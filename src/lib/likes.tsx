// Likes from family: each person keeps their own list of liked memories at likes/<their id>.
// Everyone who can open the album sees the counts. Who can like is decided by the platform:
// people you invite as Contributors (and you). Outside visitors can read but never write.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Snap = { docs: { id: string; exists: boolean; data(): Record<string, unknown> | undefined }[] };
type Db = {
  collection(p: string): { onSnapshot(next: (s: Snap) => void, err?: (e: unknown) => void): () => void };
  doc(p: string): { set(d: Record<string, unknown>): Promise<void> };
};
type User = { id(): Promise<string | null>; can(n: string): Promise<boolean | null> };
type ClaudeNS = { use: (name: string) => Promise<unknown> };

interface Likes {
  enabled: boolean; // the page can show likes at all
  canLike: boolean; // this viewer can add one
  count: (memoryId: string) => number;
  mine: (memoryId: string) => boolean;
  toggle: (memoryId: string) => Promise<'ok' | 'denied' | 'error'>;
  total: Map<string, number>;
}

const L = createContext<Likes>({ enabled: false, canLike: false, count: () => 0, mine: () => false, toggle: async () => 'denied', total: new Map() });

export function LikesProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [canLike, setCanLike] = useState(false);
  const [all, setAll] = useState<Map<string, string[]>>(new Map());
  const mineRef = useRef<string[]>([]);

  useEffect(() => {
    if (!active) return;
    const c = (window as unknown as { claude?: ClaudeNS }).claude;
    if (!c) return;
    let live = true;
    let stop: (() => void) | undefined;
    (async () => {
      const [d, u] = (await Promise.all([c.use('db'), c.use('user')])) as [Db | null, User | null];
      if (!live || !d) return;
      setDb(d);
      stop = d.collection('likes').onSnapshot((s) => {
        const next = new Map<string, string[]>();
        s.docs.forEach((doc) => {
          const m = doc.exists ? (doc.data()?.m as unknown) : null;
          if (Array.isArray(m)) next.set(doc.id, m.filter((x): x is string => typeof x === 'string').slice(0, 2000));
        });
        setAll(next);
      }, () => {});
      const id = u ? await u.id() : null;
      const can = u ? await u.can('data.write') : null;
      if (!live) return;
      setMe(id);
      setCanLike(!!id && can !== false);
    })().catch(() => {});
    return () => { live = false; stop?.(); };
  }, [active]);

  const total = useMemo(() => {
    const t = new Map<string, number>();
    all.forEach((ids) => ids.forEach((m) => t.set(m, (t.get(m) ?? 0) + 1)));
    return t;
  }, [all]);

  mineRef.current = (me && all.get(me)) || [];

  const toggle = useCallback(async (memoryId: string) => {
    if (!db || !me || !canLike) return 'denied' as const;
    const cur = mineRef.current;
    const next = cur.includes(memoryId) ? cur.filter((x) => x !== memoryId) : [...cur, memoryId];
    setAll((a) => new Map(a).set(me, next)); // optimistic
    try {
      await db.doc(`likes/${me}`).set({ m: next, at: Date.now() });
      return 'ok' as const;
    } catch (e) {
      setAll((a) => new Map(a).set(me, cur));
      if ((e as { code?: string })?.code === 'invalid_argument') { setCanLike(false); return 'denied' as const; }
      return 'error' as const;
    }
  }, [db, me, canLike]);

  const value = useMemo<Likes>(() => ({
    enabled: !!db,
    canLike,
    count: (id) => total.get(id) ?? 0,
    mine: (id) => mineRef.current.includes(id),
    toggle,
    total,
  }), [db, canLike, total, toggle, all]); // eslint-disable-line react-hooks/exhaustive-deps

  return <L.Provider value={value}>{children}</L.Provider>;
}

export const useLikes = () => useContext(L);
