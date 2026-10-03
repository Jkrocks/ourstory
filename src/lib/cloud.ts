// Live mode: Supabase for sign-in, the family's album (Postgres) and photos/videos (Storage).
// Turned on by VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. Without them the app runs in preview mode.
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { AppState, Family, Memory, Person } from './types';
import { DEFAULT_COLLECTIONS, DEFAULT_TYPES } from './demo';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = URL_ && KEY && import.meta.env.VITE_TARGET !== 'artifact' ? createClient(URL_, KEY) : null;
export const cloudEnabled = !!supabase;

export interface FamilyRow {
  id: string;
  name: string;
  since: string | null;
  intro: string | null;
  privacy: Family['privacy'];
  invite_code: string;
  public_slug: string;
  public_enabled: boolean;
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
  const { data, error } = await sb().from('os_families').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []) as FamilyRow[];
}

export async function createFamily(name: string, since: string, displayName: string): Promise<string> {
  const { data, error } = await sb().rpc('os_create_family', { p_name: name, p_since: since || null, p_display_name: displayName });
  if (error) throw error;
  return data as string;
}

export async function joinFamily(code: string, displayName: string): Promise<string> {
  const { data, error } = await sb().rpc('os_join_family', { p_code: code.trim().toLowerCase(), p_display_name: displayName });
  if (error) throw new Error(error.message.includes('invalid') ? 'That code didn’t match a family. Check it and try again.' : error.message);
  return data as string;
}

export async function newInviteCode(): Promise<string> {
  const { data, error } = await sb().rpc('os_new_invite_code', { p_family: familyId });
  if (error) throw error;
  return data as string;
}

export interface MemberRow { user_id: string; display_name: string | null; role: string; email?: string | null }

export async function familyMembers(): Promise<MemberRow[]> {
  if (!familyId) return [];
  const full = await sb().rpc('os_members', { p_family: familyId });
  if (!full.error && full.data) return full.data as MemberRow[];
  const { data } = await sb().from('os_family_members').select('user_id, display_name, role').eq('family_id', familyId);
  return data ?? [];
}

/* ---------- invite people by email ---------- */
/** After sign-in: join every album this email address was added to. */
export async function acceptInvites(displayName: string): Promise<number> {
  const { data, error } = await sb().rpc('os_accept_invites', { p_display_name: displayName });
  return error ? 0 : (data as number) ?? 0;
}

export async function listInvites(): Promise<string[]> {
  if (!familyId) return [];
  const { data } = await sb().from('os_invites').select('email').eq('family_id', familyId).order('created_at');
  return (data ?? []).map((r) => r.email as string);
}

export async function addInvite(email: string) {
  const { error } = await sb().from('os_invites').upsert({ family_id: familyId, email: email.trim().toLowerCase(), invited_by: userId }, { onConflict: 'family_id,email', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeInvite(email: string) {
  const { error } = await sb().from('os_invites').delete().eq('family_id', familyId!).eq('email', email);
  if (error) throw error;
}

export async function removeMember(uid: string) {
  const { error } = await sb().from('os_family_members').delete().eq('family_id', familyId!).eq('user_id', uid);
  if (error) throw error;
}

export const siteUrl = () => `${location.origin}${import.meta.env.BASE_URL}`;

/* ---------- public, read-only timeline ---------- */
export async function loadPublicAlbum(slug: string): Promise<AppState | null> {
  const { data, error } = await sb().rpc('os_public_album', { p_slug: slug });
  if (error || !data) return null;
  const d = data as { family: { id: string; name: string; since: string | null; intro: string | null; types: AppState['types']; collections: AppState['collections'] }; people: Person[]; memories: Memory[] };
  familyId = d.family.id;
  const state: AppState = {
    family: { name: d.family.name, since: d.family.since ?? new Date().toISOString().slice(0, 10), intro: d.family.intro ?? '', privacy: 'link', theme: 'system' },
    people: d.people ?? [],
    memories: d.memories ?? [],
    types: d.family.types?.length ? d.family.types : DEFAULT_TYPES.map((t) => ({ ...t })),
    collections: d.family.collections?.length ? d.family.collections : DEFAULT_COLLECTIONS.map((x) => ({ ...x })),
    demo: false,
  };
  const paths = [...state.memories.flatMap((m) => m.media).map((x) => x.src), ...state.people.map((p) => p.photo ?? '')]
    .filter((s) => s.startsWith('sb:')).map((s) => s.slice(3));
  await warmUrls(paths).catch(() => {});
  return state;
}

/** Owner: switch the public link on/off, or replace it with a new one. Returns the link's slug. */
export async function setPublicLink(on: boolean, newLink = false): Promise<string> {
  const { data, error } = await sb().rpc('os_set_public', { p_family: familyId, p_on: on, p_new_link: newLink });
  if (error) throw error;
  return data as string;
}

export const shareUrl = (slug: string) => `${location.origin}${import.meta.env.BASE_URL}?share=${slug}`;

/* ---------- album ---------- */
export async function loadAlbum(): Promise<AppState> {
  const c = sb();
  const [fam, people, mems] = await Promise.all([
    c.from('os_families').select('*').eq('id', familyId!).single(),
    c.from('os_people').select('data').eq('family_id', familyId!),
    c.from('os_memories').select('data').eq('family_id', familyId!),
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

async function diffRows<T extends { id: string }>(table: 'os_people' | 'os_memories', prev: T[], next: T[], row: (x: T) => Record<string, unknown>) {
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
    const { error } = await sb().from('os_families').update({
      name: next.family.name, since: next.family.since, intro: next.family.intro, privacy: next.family.privacy,
      types: next.types, collections: next.collections,
    }).eq('id', familyId!);
    if (error) throw error;
  }
  await diffRows('os_people', prev.people, next.people, (p) => ({ id: p.id, family_id: familyId, data: p }));
  await diffRows('os_memories', prev.memories, next.memories, (m) => ({ id: m.id, family_id: familyId, date: m.date, data: m, updated_by: userId }));
}

/** Calls back when another family member changes something. */
export function watchAlbum(onChange: () => void): () => void {
  if (!supabase || !familyId) return () => {};
  let t: ReturnType<typeof setTimeout> | undefined;
  const bump = () => { clearTimeout(t); t = setTimeout(onChange, 800); };
  const ch: RealtimeChannel = supabase
    .channel(`family-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'os_memories', filter: `family_id=eq.${familyId}` }, bump)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'os_people', filter: `family_id=eq.${familyId}` }, bump)
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
    const { data } = await sb().storage.from('os-media').createSignedUrls(chunk, WEEK);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }
}

export async function uploadToCloud(blob: Blob, kind: 'photo' | 'video'): Promise<string> {
  const ext = blob.type.split('/')[1]?.split(';')[0] || (kind === 'photo' ? 'jpg' : 'mp4');
  const path = `${familyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb().storage.from('os-media').upload(path, blob, { contentType: blob.type || undefined, cacheControl: '31536000' });
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
  await sb().storage.from('os-media').remove([path]);
}
