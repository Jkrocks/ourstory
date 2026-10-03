import { useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { toneAt } from '../lib/utils';
import { Doodle } from '../components/Wander';
import { Btn, Icon, Img } from '../components/ui';
import type { Media } from '../lib/types';

const art = (scene: string, seed: number): Media => ({ id: scene + seed, kind: 'photo', src: `scene:${scene}:${seed}:1` });

/** The colourful left half: photos on a thread, like the album itself. */
function Collage() {
  const stops = [
    { m: art('beach', 21), cls: 'left-[4%] top-[6%] w-[38%]', round: 'rounded-full' },
    { m: art('birthday', 44), cls: 'right-[6%] top-[2%] w-[34%]', round: 'rounded-[24px]' },
    { m: art('festival', 58), cls: 'left-[30%] top-[42%] w-[30%]', round: 'rounded-full' },
    { m: art('garden', 77), cls: 'right-[2%] bottom-[6%] w-[36%]', round: 'rounded-full' },
    { m: art('wedding', 90), cls: 'left-[2%] bottom-[2%] w-[30%]', round: 'rounded-[24px]' },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="thread" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(var(--heart))" />
            <stop offset=".35" stopColor="rgb(var(--honey))" />
            <stop offset=".7" stopColor="rgb(var(--sage))" />
            <stop offset="1" stopColor="rgb(var(--indigo))" />
          </linearGradient>
        </defs>
        <path d="M22 -4 C 10 20, 30 26, 24 30 S 70 8, 78 20 S 60 50, 45 56 S 90 62, 80 80 S 30 76, 16 88" fill="none" stroke="url(#thread)" strokeWidth=".8" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3.5 }} />
      </svg>
      {stops.map((s, i) => (
        <div key={i} className={`anim-rise absolute ${s.cls}`} style={{ animationDelay: `${i * 90}ms` }}>
          <div className={`tone-${toneAt(i)} p-[5px] ${s.round} bg-tone`}>
            <Img media={s.m} className={`aspect-square w-full ${s.round}`} eager />
          </div>
        </div>
      ))}
      <span className="absolute left-[46%] top-[30%] h-10 w-10 rounded-full bg-honey" />
      <span className="absolute right-[34%] bottom-[34%] h-6 w-6 rounded-full bg-sage" />
      <span className="absolute left-[16%] top-[48%] h-5 w-5 rounded-full bg-heart" />
      <Doodle name="kite" className="absolute right-[40%] top-[4%] text-heart" size={56} />
      <Doodle name="birds" className="absolute bottom-[26%] left-[40%] text-indigo" size={80} />
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-8 sm:px-6 lg:min-h-screen lg:grid-cols-[1.05fr_1fr] lg:px-10">
        <div className="order-2 lg:order-1">
          <Collage />
        </div>
        <div className="order-1 lg:order-2">
          <p className="font-display text-[28px] tracking-[.04em]">OurStory</p>
          <p className="text-[11px] font-medium tracking-[.3em] text-muted">A FAMILY TIMELINE</p>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Turn sign-in errors into plain words. */
function friendly(e: unknown): string {
  const m = (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? '')).toLowerCase();
  if (m.includes('rate limit')) return 'Too many emails were sent in the last hour. Sign in with your password instead, or try the email link again in about an hour.';
  if (m.includes('invalid login')) return 'That email and password don’t match. New here? Choose “Create account”.';
  if (m.includes('already registered')) return 'This email already has an account. Choose “Sign in”.';
  if (m.includes('not confirmed')) return 'Open the confirmation email we sent you first, then sign in.';
  if (m.includes('password')) return 'Use a password with at least 8 characters.';
  return 'Something went wrong. Check your connection and try again.';
}

export function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const field = 'min-h-[52px] w-full rounded-full border-2 border-line bg-card px-5 text-[17px] focus:border-heart focus:outline-none';

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(friendly(e)); }
    setBusy(false);
  };

  return (
    <Shell>
      <h1 className="mt-10 font-display text-[44px] leading-[1.08] sm:text-[56px]">
        Every memory.<br /><span className="text-heart">Every milestone.</span><br /><span className="text-sage">Our story</span>, together.
      </h1>
      <p className="mt-4 max-w-md text-[17px] text-ink/75">A private, free family album that grows with your family. Photos, videos, stories and the days you never want to forget, on one timeline.</p>

      {auth.mode === 'cloud' ? (
        <div className="mt-8 max-w-md space-y-4">
          {sent ? (
            <div className="tone-leaf bg-tone-soft rounded-[22px] p-5" role="status">
              <p className="font-display text-[22px]">Check your inbox 💌</p>
              <p className="mt-1 text-ink/80">We sent a link to <b>{email}</b>. Open it on this device to come straight in. It can take a minute; check spam too.</p>
              <button className="mt-3 min-h-[40px] font-bold underline underline-offset-4" onClick={() => setSent(false)}>Use a different email</button>
            </div>
          ) : (
            <>
              {import.meta.env.VITE_GOOGLE === '1' && (
                <>
                  <Btn className="w-full min-h-[56px] text-[17px]" onClick={() => run(auth.signInGoogle)} disabled={busy}>Continue with Google</Btn>
                  <div className="flex items-center gap-3 text-[14px] text-muted"><span className="h-px flex-1 bg-line" />or with your email<span className="h-px flex-1 bg-line" /></div>
                </>
              )}
              <div role="tablist" aria-label="Sign in or create account" className="inline-flex rounded-full bg-sand p-1">
                {([['in', 'Sign in'], ['up', 'Create account']] as const).map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setErr(''); }}
                    className={`min-h-[44px] rounded-full px-5 text-[15px] font-bold ${tab === k ? 'bg-card shadow-sm' : 'text-muted'}`}>{l}</button>
                ))}
              </div>
              <form className="space-y-3" onSubmit={(e) => {
                e.preventDefault();
                const em = email.trim().toLowerCase();
                if (!em.includes('@')) return;
                if (password.length < 8) { setErr('Use a password with at least 8 characters.'); return; }
                run(async () => {
                  if (tab === 'in') await auth.signInPassword(em, password);
                  else if (!(await auth.signUpPassword(em, password))) setSent(true);
                });
              }}>
                <label htmlFor="l-email" className="sr-only">Email</label>
                <input id="l-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@family.com" className={field} />
                <label htmlFor="l-pass" className="sr-only">Password</label>
                <input id="l-pass" type="password" autoComplete={tab === 'in' ? 'current-password' : 'new-password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === 'in' ? 'Password' : 'Choose a password (8+ characters)'} className={field} />
                <Btn type="submit" className="w-full" disabled={busy}>{busy ? 'One moment…' : tab === 'in' ? 'Sign in' : 'Create account'}</Btn>
              </form>
              <button type="button" disabled={busy} className="min-h-[40px] text-[14px] font-bold text-muted underline underline-offset-4"
                onClick={() => { const em = email.trim().toLowerCase(); if (!em.includes('@')) { setErr('Type your email first.'); return; } run(async () => { await auth.signInEmail(em); setSent(true); }); }}>
                Forgot password? Email me a sign-in link
              </button>
            </>
          )}
          {err && <p className="text-[15px] text-heart" role="alert">{err}</p>}
          <p className="flex items-center gap-2 text-[14px] text-muted"><Icon name="lock" size={16} /> Private by default. No public feed, no ads.</p>
        </div>
      ) : (
        <div className="mt-8 max-w-md space-y-4">
          <span className="tone-marigold bg-tone inline-flex rounded-full px-3 py-1 text-[12px] font-bold tracking-[.12em]">PREVIEW</span>
          <Btn className="w-full min-h-[56px] text-[17px]" onClick={() => auth.enterPreview('demo')}>Explore the sample family</Btn>
          <form className="tone-teal bg-tone-soft space-y-3 rounded-[24px] p-5" onSubmit={(e) => { e.preventDefault(); auth.enterPreview('fresh', name.trim() || undefined); }}>
            <label htmlFor="l-name" className="block font-bold">Or start your own album</label>
            <input id="l-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your family name, like Khalsa" className={field} />
            <Btn type="submit" variant="soft" className="w-full">Start my album</Btn>
            <p className="text-[13px] text-muted">In this preview your album is saved in this browser. Google and email sign-in turn on when the site goes live.</p>
          </form>
        </div>
      )}
    </Shell>
  );
}

export function FamilySetup() {
  const auth = useAuth();
  const [name, setName] = useState('');
  const [since, setSince] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const field = 'min-h-[52px] w-full rounded-full border-2 border-line bg-card px-5 text-[17px] focus:border-heart focus:outline-none';
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong. Try again.'); }
    setBusy(false);
  };
  return (
    <Shell>
      <h1 className="mt-10 font-display text-[40px] leading-tight sm:text-[48px]">Welcome, {auth.user?.name} <span className="text-heart">❤</span></h1>
      <p className="mt-2 text-[17px] text-ink/75">Start your family’s album, or join the one your family already made.</p>
      <div className="mt-8 grid max-w-md gap-4">
        <form className="tone-pink bg-tone-soft space-y-3 rounded-[24px] p-5" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => auth.createFamily(name.trim(), since)); }}>
          <p className="font-display text-[22px]">Start a new family album</p>
          <label htmlFor="f-new" className="sr-only">Family name</label>
          <input id="f-new" value={name} onChange={(e) => setName(e.target.value)} placeholder="Family name, like Khalsa" className={field} />
          <label htmlFor="f-since" className="block text-[14px] font-bold">Together since <span className="font-normal text-muted">(optional)</span></label>
          <input id="f-since" type="date" value={since} onChange={(e) => setSince(e.target.value)} className={field} />
          <Btn type="submit" className="w-full" disabled={busy || !name.trim()}>Create our album</Btn>
        </form>
        <form className="tone-indigo bg-tone-soft space-y-3 rounded-[24px] p-5" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => auth.joinFamily(code)); }}>
          <p className="font-display text-[22px]">Join with a family code</p>
          <label htmlFor="f-code" className="sr-only">Family code</label>
          <input id="f-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="8-letter code from your family" className={`${field} uppercase tracking-[.2em]`} autoCapitalize="characters" />
          <Btn type="submit" variant="soft" className="w-full" disabled={busy || !code.trim()}>Join family</Btn>
        </form>
        {err && <p className="text-[15px] text-heart" role="alert">{err}</p>}
        <button onClick={() => auth.signOut()} className="min-h-[44px] w-fit text-[14px] font-bold text-muted underline underline-offset-4">Sign out</button>
      </div>
    </Shell>
  );
}
