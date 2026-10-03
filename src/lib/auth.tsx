import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { acceptInvites, cloudEnabled, createFamily as rpcCreate, joinFamily as rpcJoin, myFamilies, setCloudContext, supabase, type FamilyRow } from './cloud';
import { setMediaMode } from './media';
import { isPublishedBuild } from './published';

export type Phase = 'loading' | 'signedOut' | 'noFamily' | 'ready';
type PreviewSeed = 'demo' | 'fresh';

interface Auth {
  mode: 'cloud' | 'preview' | 'published' | 'public';
  /** set when someone opens a public timeline link */
  shareSlug: string | null;
  phase: Phase;
  user: { id: string; email?: string; name: string } | null;
  family: FamilyRow | null;
  seed: PreviewSeed;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  createFamily: (name: string, since: string) => Promise<void>;
  joinFamily: (code: string) => Promise<void>;
  enterPreview: (seed: PreviewSeed, name?: string) => void;
}

const A = createContext<Auth | null>(null);
const PREVIEW_KEY = 'ourstory-preview';

const readLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k: string, v: string | null) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage blocked */ } };

const nameOf = (u: User) => (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const shareSlug = useMemo(() => {
    try { const s = new URLSearchParams(location.search).get('share'); return s && /^[a-z0-9]{6,40}$/.test(s) ? s : null; } catch { return null; }
  }, []);
  const mode: Auth['mode'] = isPublishedBuild ? 'published' : cloudEnabled ? (shareSlug ? 'public' : 'cloud') : 'preview';
  const [phase, setPhase] = useState<Phase>('loading');
  const [user, setUser] = useState<Auth['user']>(null);
  const [family, setFamily] = useState<FamilyRow | null>(null);
  const [seed, setSeed] = useState<PreviewSeed>('demo');

  const pickFamily = useCallback(async (u: User) => {
    await acceptInvites(nameOf(u)).catch(() => 0); // join albums this email was added to
    const fams = await myFamilies();
    const wanted = readLS('ourstory-family');
    const f = fams.find((x) => x.id === wanted) ?? fams[0] ?? null;
    setFamily(f);
    setCloudContext(f?.id ?? null, u.id);
    setPhase(f ? 'ready' : 'noFamily');
  }, []);

  useEffect(() => {
    if (mode === 'public') {
      setMediaMode('cloud');
      setUser({ id: 'visitor', name: 'Visitor' });
      setPhase('ready');
      return;
    }
    if (mode === 'published') {
      setMediaMode('inline');
      setUser({ id: 'viewer', name: 'Family' });
      setPhase('ready');
      return;
    }
    if (mode === 'preview') {
      setMediaMode('local');
      const saved = readLS(PREVIEW_KEY) as PreviewSeed | null;
      if (saved) {
        setSeed(saved);
        setUser({ id: 'preview', name: readLS('ourstory-name') ?? 'You' });
        setPhase('ready');
      } else setPhase('signedOut');
      return;
    }
    setMediaMode('cloud');
    const onUser = (u: User | null) => {
      if (!u) { setUser(null); setFamily(null); setCloudContext(null, null); setPhase('signedOut'); return; }
      setUser({ id: u.id, email: u.email, name: nameOf(u) });
      pickFamily(u).catch(() => setPhase('noFamily'));
    };
    supabase!.auth.getSession().then(({ data }) => onUser(data.session?.user ?? null));
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, s) => onUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [mode, pickFamily]);

  const value = useMemo<Auth>(() => ({
    mode, shareSlug, phase, user, family, seed,
    signInGoogle: async () => {
      const { error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: (location.origin + import.meta.env.BASE_URL) } });
      if (error) throw error;
    },
    signInEmail: async (email: string) => {
      const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: (location.origin + import.meta.env.BASE_URL) } });
      if (error) throw error;
    },
    signOut: async () => {
      if (mode === 'preview') { writeLS(PREVIEW_KEY, null); setPhase('signedOut'); return; }
      await supabase!.auth.signOut();
    },
    createFamily: async (name: string, since: string) => {
      const id = await rpcCreate(name, since, user?.name ?? 'Me');
      writeLS('ourstory-family', id);
      const { data } = await supabase!.auth.getUser();
      if (data.user) await pickFamily(data.user);
    },
    joinFamily: async (code: string) => {
      const id = await rpcJoin(code, user?.name ?? 'Me');
      writeLS('ourstory-family', id);
      const { data } = await supabase!.auth.getUser();
      if (data.user) await pickFamily(data.user);
    },
    enterPreview: (s: PreviewSeed, name?: string) => {
      writeLS(PREVIEW_KEY, s);
      if (name) writeLS('ourstory-name', name);
      setSeed(s);
      setUser({ id: 'preview', name: name || readLS('ourstory-name') || 'You' });
      setPhase('ready');
    },
  }), [mode, shareSlug, phase, user, family, seed, pickFamily]);

  return <A.Provider value={value}>{children}</A.Provider>;
}

export function useAuth() {
  const c = useContext(A);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
