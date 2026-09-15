export interface Recommendation {
  title: string;
  creator?: string;
  category: 'book' | 'movie' | 'music' | 'article' | 'tool' | 'other';
  year?: number;
  note?: string;
  link?: string;
}

export const recommendations: Recommendation[] = [
  {
    title: 'The Intelligence Trap',
    creator: 'David Robson',
    category: 'book',
    note: 'Why intelligence alone doesn\'t guarantee good judgment or rational thinking.',
  },
  {
    title: 'The Culture Map',
    creator: 'Erin Meyer',
    category: 'book',
    note: 'A useful framework for understanding how communication and working styles change across cultures.',
  },
  {
    title: 'The Psychology of Money',
    creator: 'Morgan Housel',
    category: 'book',
  },
  {
    title: 'Ways of Seeing',
    creator: 'John Berger',
    category: 'book',
  },
  {
    title: 'Utopia',
    creator: 'Thomas More',
    category: 'book',
  },
  {
    title: 'Our Moon',
    creator: 'Rebecca Boyle',
    category: 'book',
  },
  {
    title: 'Merchants of Doubt',
    creator: 'Naomi Oreskes & Erik M. Conway',
    category: 'book',
  },
];
