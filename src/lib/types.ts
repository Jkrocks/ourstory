export type MediaKind = 'photo' | 'video' | 'youtube';

export interface Media {
  id: string;
  kind: MediaKind;
  /** "scene:<name>:<seed>" for demo art, "idb:<id>" for uploads stored in the browser */
  src: string;
  caption?: string;
  favorite?: boolean;
  people?: string[];
  ratio?: number; // width / height
}

export interface Memory {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: string; // MemoryType id
  story?: string;
  people: string[];
  place?: string;
  tags: string[];
  media: Media[];
  favorite?: boolean;
  yearly?: boolean; // important dates that come back every year
  collections?: string[];
  createdAt: number;
}

export interface Person {
  id: string;
  name: string;
  relation: string;
  birthday?: string;
  photo?: string; // media src
  generation: 0 | 1 | 2; // grandparents, parents, children
  tint: string; // css rgb triple var name
}

export interface MemoryType {
  id: string;
  label: string;
  emoji: string;
  milestone?: boolean;
  custom?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
}

export type Privacy = 'private' | 'family' | 'link';
export type Theme = 'system' | 'light' | 'dark';

export interface Family {
  name: string;
  since: string; // YYYY-MM-DD
  intro: string;
  privacy: Privacy;
  theme: Theme;
}

export interface AppState {
  family: Family;
  people: Person[];
  memories: Memory[];
  types: MemoryType[];
  collections: Collection[];
  demo: boolean;
}
