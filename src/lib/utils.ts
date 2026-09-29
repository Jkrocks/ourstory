import type { AppState, Memory, MemoryType } from './types';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON = MONTHS.map((m) => m.slice(0, 3));

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};

export function fmtDate(iso: string, style: 'long' | 'short' | 'month' | 'day' = 'long') {
  const { y, m, d } = parts(iso);
  if (style === 'month') return `${MONTHS[m - 1]} ${y}`;
  if (style === 'short') return `${d} ${MON[m - 1]} ${y}`;
  if (style === 'day') return `${d} ${MONTHS[m - 1]}`;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function ago(iso: string) {
  const { y, m, d } = parts(iso);
  const t = parts(today());
  let years = t.y - y;
  if (t.m < m || (t.m === m && t.d < d)) years--;
  if (years >= 1) return years === 1 ? '1 year ago' : `${years} years ago`;
  const days = Math.round((Date.parse(today()) - Date.parse(iso)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 31) return `${Math.round(days / 7)} week${days < 11 ? '' : 's'} ago`;
  const months = Math.round(days / 30.4);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export function ageOn(birthday: string | undefined, iso: string) {
  if (!birthday) return undefined;
  const b = parts(birthday);
  const t = parts(iso);
  let y = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) y--;
  return y;
}

export const byDateDesc = (a: Memory, b: Memory) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt);

export function typeOf(state: AppState, id: string): MemoryType {
  return state.types.find((t) => t.id === id) ?? { id, label: id, emoji: '✨' };
}

export function stats(mems: Memory[]) {
  let photos = 0;
  let videos = 0;
  for (const m of mems) for (const x of m.media) x.kind === 'photo' ? photos++ : videos++;
  return { memories: mems.length, photos, videos };
}

export const plural = (n: number, one: string, many = one + 's') => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function yearsTogether(since: string) {
  const s = parts(since);
  const t = parts(today());
  let y = t.y - s.y;
  if (t.m < s.m || (t.m === s.m && t.d < s.d)) y--;
  return Math.max(0, y);
}

export const coverOf = (m: Memory) => m.media.find((x) => x.kind === 'photo') ?? m.media[0];

export const TONES = ['pink', 'marigold', 'teal', 'indigo', 'leaf', 'coral', 'lilac', 'sky'] as const;
export type Tone = (typeof TONES)[number];
const TYPE_TONE: Record<string, Tone> = {
  met: 'pink', married: 'pink', wedding: 'pink', home: 'teal', baby: 'lilac', steps: 'leaf', birthday: 'marigold',
  graduation: 'indigo', trip: 'sky', school: 'indigo', festival: 'marigold', achievement: 'leaf', funny: 'coral',
  date: 'coral', everyday: 'teal', photo: 'sky', story: 'lilac',
};
export const toneOf = (typeId: string): Tone => TYPE_TONE[typeId] ?? 'indigo';
export const toneAt = (i: number): Tone => TONES[((i % TONES.length) + TONES.length) % TONES.length];
export const isVideo = (x: { kind: string }) => x.kind !== 'photo';
