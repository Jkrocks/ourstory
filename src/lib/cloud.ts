// Live mode: Supabase for sign-in, the family's album (Postgres) and photos/videos (Storage).
// Turned on by VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. Without them the app runs in preview mode.
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { AppState, Family, Memory, Person } from './types';
import { DEFAULT_COLLECTIONS, DEFAULT_TYPES } from './demo';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = URL_ && KEY ? createClient(URL_, KEY) : null;
export const cloudEnabled = !!supabase;

export interface FamilyRow {
  id: string;
  name: string;
  since: string | null;
  intro: string | null;
  privacy: Family['privacy'];
  invite_code: string;
  types: AppState['types'] | null;
  collections: AppState['collections'] | null;
}

let familyId: string | null = null;
let userId: string | null = null;
export const setCloudContext = (fid: string | null, uid: string | null) => { familyId = fid; userId = uid; };

const sb = () => {
  if (!supabase) throw new Error('Live mode is not configured');
  return supabase;
};

/* ---------- families ---------- */
export async function myFamilies(): Promise<FamilyRow[]> {
  const { data, error } = await sb().from('families').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []) as FamilyRow[];
}

export async function createFamily(name: string, since: string, displayName: string): Promise<string> {
  const { data, error } = await sb().rpc('create_family', { p_name: name, p_since: since || null, p_display_name: displayName });
  if (error) throw error;
  return data as string;
}

export async function joinFamily(code: string, displayName: string): Promise<string> {
  const { data, error } = await sb().rpc('join_family', { p_code: code.trim().toLowerCase(), p_display_name: displayName });
  if (error) throw new Error(error.message.includes('invalid') ? 'That code didn’t match a family. Check it and try again.' : error.message);
  return data as string;
}

export async function newInviteCode(): Promise<string> {
  const { data, error } = await sb().rpc('new_invite_code', { p_family: familyId });
  if (error) throw error;
  return data as string;
}

export async function familyMembers(): Promise<{ user_id: string; display_name: string | null; role: string }[]> {
  if (!familyId) return [];
  const { data } = await sb().from('family_members').select('user_id, display_name, role').eq('family_id', familyId);
  return data ?? [];
}

/* ---------- album ---------- */
export async function loadAlbum(): Promise<AppState> {
  const c = sb();
  const [fam, people, mems] = await Promise.all([
    c.from('families').select('*').eq('id', familyId!).single(),
    c.from('people').select('data').eq('family_id', familyId!),
    c.from('memories').select('data').eq('family_id', familyId!),
  ]);
  if (fam.error) throw fam.error;
  const f = fam.data as FamilyRow;
  const state: AppState = {
    family: { name: f.name, since: f.since ?? new Date().toISOString().slice(0, 10), intro: f.intro ?? '', privacy: f.privacy ?? 'family', theme: 'system' },
    people: (people.data ?? []).map((r) => r.data as Person),
    memories: (mems.data ?? []).map((r) => r.data as Memory),
    types: f.types?.length ? f.types : DEFAULT_TYPES.map((t) => ({ ...t })),
    collections: f.collections?.length ? f.collections : DEFAULT_COLLECTIONS.map((x) => ({ ...x })),
    demo: false,
  };
  const paths = [
    ...state.memories.flatMap((m) => m.media).map((x) => x.src),
    ...state.people.map((p) => p.photo ?? ''),
  ].filter((s) => s.startsWith('sb:')).map((s) => s.slice(3));
  await warmUrls(paths);
  return state;
}

async function diffRows<T extends { id: string }>(table: 'people' | 'memories', prev: T[], next: T[], row: (x: T) => Record<string, unknown>) {
  const before = new Map(prev.map((x) => [x.id, JSON.stringify(x)]));
  const changed = next.filter((x) => before.get(x.id) !== JSON.stringify(x));
  const nextIds = new Set(next.map((x) => x.id));
  const removed = prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id);
  if (changed.length) {
    const { error } = await sb().from(table).upsert(changed.map(row), { onConflict: 'family_id,id' });
    if (error) throw error;
  }
  if (removed.length) {
    const { error } = await sb().from(table).delete().eq('family_id', familyId!).in('id', removed);
    if (error) throw error;
  }
}

export async function saveAlbum(prev: AppState, next: AppState) {
  const fam = (s: AppState) => JSON.stringify([s.family.name, s.family.since, s.family.intro, s.family.privacy, s.types, s.collections]);
  if (fam(prev) !== fam(next)) {
    const { error } = await sb().from('families').update({
      name: next.family.name, since: next.family.since, intro: next.family.intro, privacy: next.family.privacy,
      types: next.types, collections: next.collections,
    }).eq('id', familyId!);
    if (error) throw error;
  }
  await diffRows('people', prev.people, next.people, (p) => ({ id: p.id, family_id: familyId, data: p }));
  await diffRows('memories', prev.memories, next.memories, (m) => ({ id: m.id, family_id: familyId, date: m.date, data: m, updated_by: userId }));
}

/** Calls back when another family member changes something. */
export function watchAlbum(onChange: () => void): () => void {
  if (!supabase || !familyId) return () => {};
  let t: ReturnType<typeof setTimeout> | undefined;
  const bump = () => { clearTimeout(t); t = setTimeout(onChange, 800); };
  const ch: RealtimeChannel = supabase
    .channel(`family-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memories', filter: `family_id=eq.${familyId}` }, bump)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'people', filter: `family_id=eq.${familyId}` }, bump)
    .subscribe();
  return () => { clearTimeout(t); supabase.removeChannel(ch); };
}

/* ---------- photos & videos ---------- */
const signed = new Map<string, string>();
const WEEK = 60 * 60 * 24 * 7;

async function warmUrls(paths: string[]) {
  const todo = paths.filter((p) => !signed.has(p));
  for (let i = 0; i < todo.length; i += 100) {
    const chunk = todo.slice(i, i + 100);
    const { data } = await sb().storage.from('media').createSignedUrls(chunk, WEEK);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }
}

export async function uploadToCloud(blob: Blob, kind: 'photo' | 'video'): Promise<string> {
  const ext = blob.type.split('/')[1]?.split(';')[0] || (kind === 'photo' ? 'jpg' : 'mp4');
  const path = `${familyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb().storage.from('media').upload(path, blob, { contentType: blob.type || undefined, cacheControl: '31536000' });
  if (error) throw error;
  signed.set(path, URL.createObjectURL(blob));
  return `sb:${path}`;
}

export const cloudUrlSync = (path: string) => signed.get(path);

export async function cloudUrl(path: string) {
  if (!signed.has(path)) await warmUrls([path]);
  return signed.get(path);
}

export async function removeFromCloud(path: string) {
  signed.delete(path);
  await sb().storage.from('media').remove([path]);
}
