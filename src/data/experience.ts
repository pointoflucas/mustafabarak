export interface Experience {
  company: string;
  title: string;
  period: string;
  description: string;
  areas: string[];
}

export const experiences: Experience[] = [
  {
    company: 'EPAM Systems',
    title: 'Senior Data & AI Engineer',
    period: '2024 — Present',
    description: `Working across data engineering and applied AI projects in industries
including pharma, retail and finance.

My work has included designing and operating data pipelines,
backend services, distributed data processing, RAG systems and
agentic AI workflows.

I've also taken responsibilities beyond individual development,
including mentoring engineers, technical interviewing, knowledge
sharing and helping teams improve engineering practices.`,
    areas: [
      'Python',
      'SQL',
      'Airflow',
      'Spark',
      'Databricks',
      'AWS',
      'Azure',
      'Terraform',
      'FastAPI',
      'RAG',
      'LLM systems',
      'Agentic AI',
    ],
  },
  {
    company: 'BECO Capital',
    title: 'Data Engineer',
    period: '2023 — 2024',
    description: `Worked on data infrastructure for a venture capital environment.

One of the main problems I worked on was data unification: combining
information coming from different sources and identifying when
different records actually represented the same real-world entity.

The project involved entity resolution, dimensional modeling,
analytics-ready data layers, semantic models and improving data
accessibility and consistency.`,
    areas: [
      'Python',
      'GCP',
      'BigQuery',
      'Airflow',
      'dbt',
      'Data modeling',
      'Entity resolution',
      'Knowledge engineering',
    ],
  },
  {
    company: 'Solvoyo',
    title: 'Data Engineer',
    period: '2022 — 2023',
    description: `Worked close to operations research problems where data engineering
and optimization met.

Built data processing systems supporting real-time and batch
optimization workloads and worked on parallel processing,
data architecture and graph-based modeling.

This period strengthened my interest in problems where algorithms,
data infrastructure and real-world operational constraints intersect.`,
    areas: [
      'Python',
      'AWS',
      'GCP',
      'Spark',
      'Neo4j',
      'Optimization',
      'Operations research',
    ],
  },
  {
    company: 'Independent / LegBus',
    title: 'Data Engineer & Data Scientist',
    period: '2018 — 2022',
    description: `This was where I learned to build things end-to-end.

I worked independently on more than 30 data engineering and data
science projects, covering ingestion, transformation, analytics,
predictive modeling and data infrastructure.

Working across many different problems taught me to move from an
unclear business problem to a working technical solution rather than
focusing only on one part of the stack.`,
    areas: [
      'Python',
      'Data Engineering',
      'Machine Learning',
      'Data Science',
      'Analytics',
    ],
  },
  {
    company: 'Turing',
    title: 'AI Research Data Engineering',
    period: '2022 — 2023',
    description: `Worked through Turing on a term project supporting AI research and
model-training workflows.

The work involved Python tooling, data preparation, preprocessing,
prompt-related tasks and technical problem solving around LLM
development.`,
    areas: ['Python', 'Data Preparation', 'LLM Development', 'AI Research'],
  },
];
