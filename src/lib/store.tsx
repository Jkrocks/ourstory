import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { AppState, Collection, Family, Media, Memory, MemoryType, Person } from './types';
import { demoState, emptyState } from './demo';
import { loadState, saveState, getMediaUrl, loadDraft, saveDraft } from './storage';
import { canEditPage, pageBytes, publishPage, readEmbedded, LIMIT_BYTES } from './published';
import { removeMedia } from './media';
import { loadAlbum, loadPublicAlbum, saveAlbum, watchAlbum } from './cloud';
import { useAuth } from './auth';

type Action =
  | { t: 'replace'; s: AppState }
  | { t: 'memory'; m: Memory }
  | { t: 'deleteMemory'; id: string }
  | { t: 'fav'; id: string }
  | { t: 'person'; p: Person }
  | { t: 'deletePerson'; id: string }
  | { t: 'family'; f: Partial<Family> }
  | { t: 'type'; mt: MemoryType }
  | { t: 'collection'; c: Collection }
  | { t: 'toggleCollection'; memoryId: string; collectionId: string }
  | { t: 'media'; memoryId: string; mediaId: string; patch: Partial<Media> }
  | { t: 'deleteMedia'; memoryId: string; mediaId: string }
  | { t: 'moveMedia'; from: string; to: string; mediaId: string };

function reducer(s: AppState, a: Action): AppState {
  const mapMem = (id: string, f: (m: Memory) => Memory) => ({ ...s, memories: s.memories.map((m) => (m.id === id ? f(m) : m)) });
  switch (a.t) {
    case 'replace':
      return a.s;
    case 'memory': {
      const exists = s.memories.some((m) => m.id === a.m.id);
      return { ...s, memories: exists ? s.memories.map((m) => (m.id === a.m.id ? a.m : m)) : [...s.memories, a.m] };
    }
    case 'deleteMemory':
      return { ...s, memories: s.memories.filter((m) => m.id !== a.id) };
    case 'fav':
      return mapMem(a.id, (m) => ({ ...m, favorite: !m.favorite }));
    case 'person': {
      const exists = s.people.some((p) => p.id === a.p.id);
      return { ...s, people: exists ? s.people.map((p) => (p.id === a.p.id ? a.p : p)) : [...s.people, a.p] };
    }
    case 'deletePerson':
      return {
        ...s,
        people: s.people.filter((p) => p.id !== a.id),
        memories: s.memories.map((m) => ({ ...m, people: m.people.filter((x) => x !== a.id) })),
      };
    case 'family':
      return { ...s, family: { ...s.family, ...a.f } };
    case 'type':
      return { ...s, types: [...s.types, a.mt] };
    case 'collection':
      return { ...s, collections: [...s.collections, a.c] };
    case 'toggleCollection':
      return mapMem(a.memoryId, (m) => {
        const c = m.collections ?? [];
        return { ...m, collections: c.includes(a.collectionId) ? c.filter((x) => x !== a.collectionId) : [...c, a.collectionId] };
      });
    case 'media':
      return mapMem(a.memoryId, (m) => ({ ...m, media: m.media.map((x) => (x.id === a.mediaId ? { ...x, ...a.patch } : x)) }));
    case 'deleteMedia':
      return mapMem(a.memoryId, (m) => ({ ...m, media: m.media.filter((x) => x.id !== a.mediaId) }));
    case 'moveMedia': {
      const from = s.memories.find((m) => m.id === a.from);
      const item = from?.media.find((x) => x.id === a.mediaId);
      if (!item) return s;
      return {
        ...s,
        memories: s.memories.map((m) =>
          m.id === a.from ? { ...m, media: m.media.filter((x) => x.id !== a.mediaId) } : m.id === a.to ? { ...m, media: [...m.media, item] } : m,
        ),
      };
    }
  }
}

export type Route =
  | { name: 'home' }
  | { name: 'timeline'; person?: string; place?: string; view?: 'timeline' | 'year' | 'month'; year?: number }
  | { name: 'memories'; collection?: string }
  | { name: 'people' }
  | { name: 'places'; place?: string }
  | { name: 'favorites' }
  | { name: 'settings' };

export type AddKind = 'photo' | 'video' | 'story' | 'milestone' | 'date';

interface UI {
  route: Route;
  go: (r: Route) => void;
  openMemory: (id: string | null) => void;
  memoryId: string | null;
  viewer: { memoryId: string; mediaId: string; list?: { memoryId: string; mediaId: string }[] } | null;
  openViewer: (v: UI['viewer']) => void;
  add: { kind: AddKind; edit?: Memory; files?: File[] } | 'menu' | null;
  openAdd: (a: UI['add']) => void;
  toast: (msg: string) => void;
  toastMsg: { id: number; msg: string } | null;
  search: boolean;
  setSearch: (b: boolean) => void;
  recap: number | null;
  setRecap: (y: number | null) => void;
  share: { kind: 'memory'; id: string } | { kind: 'year'; year: number } | null;
  setShare: (s: UI['share']) => void;
}

interface Ctx extends UI {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
  /** false for visitors of the published page */
  canEdit: boolean;
  published: boolean;
  /** a public link was opened but the album is private or the link was replaced */
  missing: boolean;
  /** owner has changes visitors can't see yet */
  dirty: boolean;
  publish: () => Promise<void>;
  publishing: boolean;
  bytes: number;
  limit: number;
}

const C = createContext<Ctx | null>(null);

const ROUTES = ['home', 'timeline', 'memories', 'people', 'places', 'favorites', 'settings'] as const;

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const cloud = auth.mode === 'cloud';
  const isPublicView = auth.mode === 'public';
  const published = auth.mode === 'published' || isPublicView;
  const embedded = useMemo(() => (auth.mode === 'published' ? readEmbedded() : null), [auth.mode]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    isPublicView ? emptyState('') : published ? embedded?.state ?? demoState() : cloud || auth.seed === 'fresh' ? emptyState(auth.family?.name ?? '') : demoState());
  const [canEdit, setCanEdit] = useState(!published);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [ready, setReady] = useState(false);
  const initial = (() => {
    try {
      const h = location.hash.replace('#', '');
      if ((ROUTES as readonly string[]).includes(h)) return { name: h } as Route;
    } catch { /* ignore */ }
    return { name: 'home' } as Route;
  })();
  const [route, setRoute] = useState<Route>(initial);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<UI['viewer']>(null);
  const [add, setAdd] = useState<UI['add']>(null);
  const [toastMsg, setToast] = useState<UI['toastMsg']>(null);
  const [search, setSearch] = useState(false);
  const [recap, setRecap] = useState<number | null>(null);
  const [share, setShare] = useState<UI['share']>(null);

  const saved = useRef<AppState | null>(null);
  const [saveError, setSaveError] = useState(false);

  // load
  useEffect(() => {
    let live = true;
    const done = (st: AppState) => { if (!live) return; const themed = withTheme(st); saved.current = themed; dispatch({ t: 'replace', s: themed }); setReady(true); };
    if (isPublicView) {
      setCanEdit(false);
      loadPublicAlbum(auth.shareSlug!).then((st) => {
        if (!live) return;
        if (st) done(st);
        else { setMissing(true); setReady(true); }
      });
      return () => { live = false; };
    }
    if (published) {
      done(embedded?.state ?? demoState());
      canEditPage().then(async (can) => {
        if (!live) return;
        setCanEdit(can);
        if (!can) return;
        const draft = await loadDraft();
        if (live && draft?.state && draft.stamp > (embedded?.stamp ?? 0)) { const d = withTheme(draft.state); saved.current = d; dispatch({ t: 'replace', s: d }); setDirty(true); }
      });
      return () => { live = false; };
    }
    if (cloud) {
      loadAlbum().then(done).catch(() => { if (live) { setSaveError(true); setReady(true); } });
      const stop = watchAlbum(() => loadAlbum().then(done).catch(() => {}));
      const onFocus = () => loadAlbum().then(done).catch(() => {});
      window.addEventListener('focus', onFocus);
      return () => { live = false; stop(); window.removeEventListener('focus', onFocus); };
    }
    if (auth.seed === 'demo') { done(demoState()); return () => { live = false; }; }
    const safety = setTimeout(() => done(emptyState(auth.user?.name ? `${auth.user.name}’s` : 'Our')), 1500);
    loadState().then(async (st) => {
      clearTimeout(safety);
      if (st && st.memories && !st.demo) {
        const ids = [...st.memories.flatMap((m) => m.media).map((x) => x.src), ...st.people.map((p) => p.photo ?? '')]
          .filter((x) => x.startsWith('idb:')).map((x) => x.slice(4));
        await Promise.all(ids.map((id) => getMediaUrl(id)));
        done(st);
      } else done(emptyState(auth.user?.name ? `${auth.user.name}’s` : 'Our'));
    });
    return () => { live = false; clearTimeout(safety); };
  }, [cloud, auth.seed, auth.family?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // save
  useEffect(() => {
    if (!ready || !saved.current || state === saved.current) return;
    if (isPublicView) return;
    if (published) {
      if (!canEdit) return;
      const t = setTimeout(() => { saveDraft({ state, stamp: Date.now() }); setDirty(true); }, 300);
      return () => clearTimeout(t);
    }
    if (state.demo) return;
    const t = setTimeout(() => {
      const prev = saved.current!;
      const next = state;
      if (cloud) {
        saveAlbum(prev, next).then(() => { saved.current = next; setSaveError(false); }).catch(() => setSaveError(true));
      } else {
        saveState(next).then(() => { saved.current = next; });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state, ready, cloud, published, canEdit]);

  useEffect(() => { if (saveError) setToast({ id: Date.now(), msg: 'Couldn’t reach your album. We’ll try again with your next change.' }); }, [saveError]);

  // theme
  useEffect(() => {
    const el = document.documentElement;
    if (state.family.theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', state.family.theme);
    try { localStorage.setItem('ourstory-theme', state.family.theme); } catch { /* storage blocked */ }
  }, [state.family.theme]);

  const go = useCallback((r: Route) => {
    setRoute(r);
    setMemoryId(null);
    try { history.replaceState(null, '', '#' + r.name); } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const toast = useCallback((msg: string) => setToast({ id: Date.now(), msg }), []);

  const bytes = useMemo(() => (auth.mode === 'published' ? pageBytes(state) : 0), [auth.mode, state]);
  const publish = useCallback(async () => {
    if (bytes > LIMIT_BYTES) { toast('The album is too big to publish. Remove a few photos first.'); return; }
    setPublishing(true);
    const stamp = Date.now();
    await saveDraft({ state, stamp });
    const out = await publishPage(state, stamp);
    setPublishing(false);
    if (out === 'ok') { setDirty(false); toast('Published ❤️ Everyone with the link now sees it.'); return; }
    if (out === 'conflict') return; // the page is reloading to the newer version
    toast(out === 'too_large' ? 'The album is too big to publish. Remove a few photos first.'
      : out === 'not_writer' ? 'Only the album’s owner can publish.'
      : 'Couldn’t publish just now. Your changes are kept; try again in a minute.');
  }, [state, bytes, toast]);

  const value = useMemo<Ctx>(
    () => ({
      state, dispatch, ready, route, go, canEdit, published, missing, dirty, publish, publishing, bytes, limit: LIMIT_BYTES,
      memoryId, openMemory: setMemoryId,
      viewer, openViewer: setViewer,
      add, openAdd: setAdd,
      toast, toastMsg, search, setSearch, recap, setRecap, share, setShare,
    }),
    [state, ready, route, go, canEdit, published, missing, dirty, publish, publishing, bytes, memoryId, viewer, add, toast, toastMsg, search, recap, share],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export function removeBlobs(media: Media[]) {
  media.forEach((x) => removeMedia(x.src));
}

function withTheme(st: AppState): AppState {
  let theme = st.family.theme ?? 'system';
  try { theme = (localStorage.getItem('ourstory-theme') as AppState['family']['theme']) || theme; } catch { /* storage blocked */ }
  return { ...st, family: { ...st.family, theme } };
}
