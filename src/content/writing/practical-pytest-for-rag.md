---
title: "Testing RAG Projects with pytest: A Practical Guide"
description: "A runnable, no-API-key example of testing chunking, retrieval, citations, and failure paths with pytest, plus a GitHub Actions workflow."
date: 2026-11-17
tags:
  - Python
  - Testing
  - RAG
  - Data Engineering
draft: false
---

A RAG assistant returns a convincing answer. Is that enough to merge the pull request?

Not quite. The answer might cite a document that was never retrieved. An empty search might still trigger a paid model call. A chunking change might silently discard the final paragraph of every file.

These are engineering failures we can test without paying for a model or connecting to a vector database. This article builds a small example you can run locally, then shows where integration tests and AI evaluations belong.

## 1. Start with Behaviors, Not Tools

Before opening pytest, write down what must remain true:

| Component | Behavior to protect | Test approach |
| --- | --- | --- |
| Chunking | No words disappear; invalid sizes fail clearly | Parametrized unit tests |
| Retrieval boundary | The question and result limit reach the retriever | A recording fake |
| Generation boundary | Only retrieved documents reach the model | A recording fake |
| Citations | Every returned source ID belongs to retrieved evidence | Contract assertions |
| Missing evidence | The assistant abstains without calling the model | Failure-path test |
| Service failure | A provider timeout follows the agreed error policy | Exception test |

Think of the flow as:

```text
Documents -> chunks -> retriever -> evidence -> model -> cited answer
              |           |            |         |           |
          boundaries   arguments    empty set   timeout    source IDs
```

The tests below focus on these boundaries. They do not prove that a real retriever finds relevant evidence or that a model tells the truth.

## 2. Create a Small Test Project

Use a separate practice directory, with Python 3.10 or newer:

```text
rag-testing/
  rag.py
  tests/
    test_rag.py
```

Create an environment and install pytest:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install pytest
```

On Windows, activate with `.venv\Scripts\activate` instead. For a shared project, record and lock development dependencies using your team's dependency manager.

## 3. Make the Pipeline Easy to Test

Put this implementation in `rag.py`. It deliberately uses word-based chunking and injected dependencies rather than a framework, embeddings, or network calls. It is a teaching example, not a production retriever or tokenizer.

```python
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Document:
    source_id: str
    text: str


@dataclass(frozen=True)
class Answer:
    text: str
    source_ids: tuple[str, ...]


class Retriever(Protocol):
    def search(self, question: str, *, limit: int) -> list[Document]: ...


class Model(Protocol):
    def generate(self, question: str, documents: list[Document]) -> Answer: ...


def chunk_text(text: str, max_words: int) -> list[str]:
    if max_words <= 0:
        raise ValueError("max_words must be positive")
    words = text.split()
    return [
        " ".join(words[start:start + max_words])
        for start in range(0, len(words), max_words)
    ]


def answer_question(
    question: str, retriever: Retriever, model: Model
) -> Answer:
    if not question.strip():
        raise ValueError("question must not be blank")

    documents = retriever.search(question, limit=3)
    if not documents:
        return Answer("I could not find supporting evidence.", ())

    answer = model.generate(question, documents)
    allowed_sources = {document.source_id for document in documents}
    if not answer.source_ids or not set(answer.source_ids) <= allowed_sources:
        raise ValueError("answer must cite retrieved sources")
    return answer
```

The important design choice is **dependency injection**: the function receives its retriever and model instead of constructing clients internally. Production can pass real clients; tests can pass small substitutes with predictable behavior.

The citation rule here checks source membership only. A citation can point to an existing document and still fail to support a claim. We will return to that distinction later.

## 4. Write the Tests

Put the following in `tests/test_rag.py`. This is the complete test file; the explanations that follow walk through it.

```python
import pytest

from rag import Answer, Document, answer_question, chunk_text


class FakeRetriever:
    def __init__(self, documents):
        self.documents = documents
        self.calls = []

    def search(self, question, *, limit):
        self.calls.append((question, limit))
        return self.documents[:limit]


class FakeModel:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def generate(self, question, documents):
        self.calls.append((question, list(documents)))
        return self.response


@pytest.fixture
def documents():
    return [Document("syllabus-v1", "The final assignment is due on Friday.")]


@pytest.mark.parametrize(
    "text, max_words, expected",
    [
        ("", 3, []),
        ("   ", 3, []),
        ("one two", 2, ["one two"]),
        ("one two three", 2, ["one two", "three"]),
        ("one\n two   three", 2, ["one two", "three"]),
    ],
)
def test_chunk_text_handles_boundaries(text, max_words, expected):
    assert chunk_text(text, max_words) == expected


@pytest.mark.parametrize("max_words", [0, -1])
def test_chunk_text_rejects_invalid_size(max_words):
    with pytest.raises(ValueError, match="must be positive"):
        chunk_text("some text", max_words)


def test_chunks_preserve_words_and_respect_size():
    text = "one two three four five six seven"
    chunks = chunk_text(text, max_words=3)

    assert " ".join(chunks).split() == text.split()
    assert all(1 <= len(chunk.split()) <= 3 for chunk in chunks)


def test_answer_passes_question_and_evidence_to_dependencies(documents):
    question = "When is the final assignment due?"
    retriever = FakeRetriever(documents)
    model = FakeModel(Answer("Friday.", ("syllabus-v1",)))

    answer = answer_question(question, retriever, model)

    assert answer == Answer("Friday.", ("syllabus-v1",))
    assert retriever.calls == [(question, 3)]
    assert model.calls == [(question, documents)]


def test_empty_retrieval_abstains_without_calling_model():
    retriever = FakeRetriever([])
    model = FakeModel(Answer("An unsupported answer.", ()))

    answer = answer_question("When is the exam?", retriever, model)

    assert answer == Answer("I could not find supporting evidence.", ())
    assert model.calls == []


@pytest.mark.parametrize("source_ids", [(), ("invented-source",)])
def test_missing_or_unknown_citations_are_rejected(documents, source_ids):
    retriever = FakeRetriever(documents)
    model = FakeModel(Answer("Friday.", source_ids))

    with pytest.raises(ValueError, match="must cite retrieved sources"):
        answer_question("When is the assignment due?", retriever, model)


def test_blank_question_does_not_call_dependencies(documents):
    retriever = FakeRetriever(documents)
    model = FakeModel(Answer("Friday.", ("syllabus-v1",)))

    with pytest.raises(ValueError, match="must not be blank"):
        answer_question("  ", retriever, model)

    assert retriever.calls == []
    assert model.calls == []


def test_model_timeout_propagates(documents, monkeypatch):
    retriever = FakeRetriever(documents)
    model = FakeModel(Answer("Friday.", ("syllabus-v1",)))

    def raise_timeout(question, documents):
        raise TimeoutError("provider unavailable")

    monkeypatch.setattr(model, "generate", raise_timeout)

    with pytest.raises(TimeoutError, match="provider unavailable"):
        answer_question("When is the assignment due?", retriever, model)
```

### Fixtures Give Each Test a Clean Starting Point

The `documents` fixture creates a fresh list for each test that requests it as a parameter. This keeps setup reusable without introducing shared mutable state between tests.

Use fixtures for small document collections, temporary indexes, database connections, or API clients. Prefer function-scoped fixtures by default. Share expensive resources more widely only when you can isolate each test's changes.

### Parametrization Covers Edge Cases Without Copying Tests

`@pytest.mark.parametrize` runs the same test against several inputs. Here, five chunking cases cover empty text, whitespace, an exact boundary, a final partial chunk, and irregular spacing.

The additional word-preservation assertion protects an invariant: all input words survive, in order, and no chunk exceeds the limit. It does not claim to preserve formatting because this implementation explicitly normalizes whitespace.

Real chunkers may use tokens, overlap, or sentence boundaries. Adjust the invariant to your contract: overlapping chunks intentionally repeat content, so joining them is not a valid reconstruction check.

### Fakes Make External Behavior Observable

The fake retriever returns known documents and records its calls. The fake model returns a known answer and records the evidence it receives. Neither performs a network request.

This verifies orchestration, not model intelligence. The assertion that the result says “Friday” is valid because our fake always returns that value. Do not copy that exact-text assertion onto a real generative model and expect a stable quality test.

The missing-evidence test verifies both the returned response and the absence of a model call. That second assertion protects cost and behavior: an answer with no evidence should not quietly fall through to generation.

### Exceptions Are Part of the Contract

`pytest.raises` checks the expected failure type. `match` also checks part of the message, making it less likely that an unrelated error will accidentally satisfy the test.

`monkeypatch` temporarily replaces the model method and restores it after the test. The timeout test documents the current policy: this function propagates provider errors. A service layer could translate them into a retryable response. If you add retries, test the attempt limit and terminal behavior rather than adding real delays to your unit suite.

## 5. Run, Read, and Debug the Suite

Run all tests from the project root:

```bash
python -m pytest -q
```

Parametrized cases count separately. This example collects 14 tests.

Use these commands while developing:

```bash
python -m pytest tests/test_rag.py -v
python -m pytest -k "citation" -q
python -m pytest -x
python -m pytest --pdb -x
```

`-v` names individual cases. `-k` selects matching test names. `-x` stops after the first failure. `--pdb` opens a debugger on failure and is useful locally, not in unattended CI.

Try deliberately removing the final partial chunk from `chunk_text`. The boundary and preservation tests should fail. Restore the implementation afterward. This small exercise checks whether the suite catches the regression you actually care about.

## 6. Add Real Integration Tests Separately

The fake retriever cannot tell you whether your vector database adapter works. Add an integration test that inserts known documents into an isolated test collection, waits for indexing using the database's readiness mechanism, performs a search, and checks the returned IDs and metadata. Clean up the collection even when assertions fail, for example with a `yield` fixture and a `finally` block.

Test access filtering with documents from two tenants and the real retrieval adapter. Verify that an unauthorized document never reaches the model, not merely that its citation is removed from the final response. The toy retriever in this article has no authorization layer and is not suitable for multi-tenant deployment.

Keep integration tests in a separate file such as `tests/test_vector_store.py` and mark them with `@pytest.mark.integration`. Register that marker in `pytest.ini`:

```ini
[pytest]
markers =
    integration: tests requiring a real external service
```

Run fast checks with `python -m pytest -m "not integration"`, then run service-dependent tests explicitly with `python -m pytest -m integration`. A marker categorizes tests; it does not skip them automatically. Avoid silently skipping required integration checks because credentials or a service are missing in a release pipeline.

## 7. Separate AI Evaluation from Software Correctness

A source-membership test catches invented IDs. It cannot prove the source supports the answer. A real RAG evaluation needs representative questions, relevance labels or reference answers, and a documented scoring procedure.

For retrieval, Recall@5 is the fraction of labeled relevant items found in the first five results for a query. If a question has two relevant passages and retrieval finds one, recall is 0.5. If there is exactly one relevant passage per question, it becomes a hit-or-miss measure. Define how you aggregate across questions and how you handle queries with no relevant evidence.

For generation, examine correctness, claim support, uncertainty behavior, and citation validity. An LLM judge can help scale review, but it can also disagree with people or change across model versions. Version the evaluation data and judge configuration, inspect failure cases, and calibrate automated judgments against human review.

Do not treat every small metric fluctuation as a release failure. Agree on meaningful regression thresholds, important query slices, and how to handle repeated-run variability. Keep strict deterministic gates for access control and schema contracts; keep probabilistic quality checks transparent about their uncertainty.

```text
Every pull request     -> fast unit tests + offline contract checks
Before a release       -> real integrations + representative RAG evaluation
After deployment       -> latency, cost, failures, and reviewed quality feedback
```

## 8. Run the Fast Suite on GitHub

For this practice project, place this workflow in `.github/workflows/tests.yml`:

```yaml
name: rag-tests

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install pytest
      - run: python -m pytest -q
```

This runs the exact offline example above, without API keys. When you add registered integration tests, change the final command to select the fast suite and give integration checks a separate job with explicit service setup. For an existing application, install its locked project and test dependencies rather than only pytest. Follow your team's policy for pinning third-party Actions to reviewed commit SHAs.

After the workflow has run, configure a GitHub ruleset to require the test status check before merging. A workflow is useful feedback; a required status check makes it an enforced quality gate. Keep deployment credentials away from untrusted pull-request code.

## What to Test Next

Apply the same approach to your project: write the behavior first, inject external dependencies, and test the failure path as deliberately as the happy path. Good next cases include repeated ingestion without duplicates, updated document versions, deleted sources, malformed model responses, and permission changes.

Start small. A handful of tests that catch lost data, leaked context, and unsupported citations contributes more than a large suite that only checks whether functions return something.

## References

- [pytest: getting started](https://docs.pytest.org/en/stable/getting-started.html)
- [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [Parametrizing tests](https://docs.pytest.org/en/stable/how-to/parametrize.html)
- [Monkeypatching](https://docs.pytest.org/en/stable/how-to/monkeypatch.html)
- [GitHub: building and testing Python](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-python)