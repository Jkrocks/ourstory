import { useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { Btn, Icon, Img } from '../components/ui';
import type { Media } from '../lib/types';

const art = (scene: string, seed: number, ratio = 1): Media => ({ id: scene + seed, kind: 'photo', src: `scene:${scene}:${seed}:${ratio}` });

/** A sample story on a winding ribbon. Positions are % of a 930×1024 stage. */
const STOPS = [
  { m: art('nursery', 21), x: 12.7, y: 22.3, w: 16, rot: -12, year: '1998', title: 'Where It All Began', line: 'Roots, values and a beautiful childhood.', lx: 25, ly: 18.5 },
  { m: art('mountains', 44), x: 25, y: 39, w: 19, rot: 14, year: '2005', title: 'A New Chapter', line: 'Dreams got bigger and the journey began.', lx: 46, ly: 30 },
  { m: art('wedding', 58), x: 43, y: 49.5, w: 20, rot: 24, year: '2012', title: 'Two Hearts, One Journey', line: 'Found my best friend for life.', lx: 10, ly: 47 },
  { m: art('park', 77), x: 43, y: 68, w: 18, rot: 22, year: '2015', title: 'Our First Bundle of Joy', line: 'A little one came into our lives.', lx: 14, ly: 62 },
  { m: art('garden', 90), x: 59, y: 76, w: 18, rot: 14, year: '2019', title: 'Another Blessing', line: 'Our family got bigger.', lx: 34, ly: 79.5 },
  { m: art('birthday', 33), x: 75, y: 80, w: 15, rot: -6, year: '2025', title: 'Our Little Miracle', line: 'She completed our world.', lx: 52, ly: 89 },
  { m: art('beach', 12, 4 / 3), x: 89, y: 88, w: 23, rot: -8, year: '2026', title: 'Still Writing Our Story', line: 'More adventures, more love, always.', lx: 78, ly: 58 },
];

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="font-display text-[clamp(52px,9cqw,104px)] leading-[.95] tracking-[-.02em]">Our Story</p>
      <p className="mt-1 text-[clamp(11px,1.7cqw,18px)] font-medium tracking-[.42em] text-string">A FAMILY TIMELINE</p>
    </div>
  );
}

function Ribbon() {
  return (
    <div className="relative mx-auto aspect-[930/1024] w-full max-w-[860px] [container-type:inline-size]" aria-hidden>
      <Wordmark className="absolute left-[30%] top-[2.5%] w-[56%]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 930 1024">
        <path d="M118 228 C 110 330, 180 372, 232 402 S 392 452, 402 505 S 250 590, 300 650 S 470 750, 552 780 S 650 840, 708 832 S 780 880, 810 890 M 880 700 C 930 760, 920 820, 870 850"
          fill="none" stroke="rgb(var(--string))" strokeWidth="2.2" strokeLinecap="round" opacity=".6" />
        <g fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".85">
          <path d="M66 152c-10-8-15-14-15-21 0-6 4-9 8-8 4 0 6 3 7 6 2-3 4-6 8-6 5 0 8 4 7 10-2 7-8 12-15 19z" />
          <path d="M196 170l8-9M204 178l9-3M199 184l9 3" />
          <path d="M356 368l9-5M360 378h9M356 386l9 4" />
          <path d="M530 530c-10-8-15-14-15-21 0-6 4-9 8-8 4 0 6 3 7 6 2-3 4-6 8-6 5 0 8 4 7 10-2 7-8 12-15 19z" />
          <circle cx="490" cy="618" r="9" /><path d="M490 600v-5M490 641v-5M472 618h-5M513 618h-5M477 605l-3-3M506 634l-3-3M503 605l3-3M474 634l3-3" />
          <path d="M876 622l34-14-12 32-8-12z M890 628l20-20" /><path d="M882 646c-4 12 2 24 14 32" strokeDasharray="4 6" />
        </g>
      </svg>
      {STOPS.map((s, i) => (
        <div key={s.year}>
          <div className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, zIndex: i + 1 }}>
            <div className="polaroid anim-rise !p-[5%]" style={{ animationDelay: `${i * 90}ms` }}>
              <Img media={s.m} className={`w-full ${i === 6 ? 'aspect-[4/3]' : 'aspect-square'}`} eager />
            </div>
          </div>
          <div className="absolute w-[21%] pl-[1.8cqw]" style={{ left: `${s.lx}%`, top: `${s.ly}%`, zIndex: 20 }}>
            <span className="absolute left-0 top-[.6cqw] h-[calc(100%-1cqw)] w-px bg-string/60" />
            <span className="absolute -left-[3px] top-[2.6cqw] h-[7px] w-[7px] rounded-full bg-string" />
            <p className="text-[clamp(10px,1.55cqw,15px)] font-bold tracking-[.04em] text-string tnum">{s.year}</p>
            <p className="mt-[.3cqw] font-display text-[clamp(13px,2.3cqw,22px)] font-medium leading-[1.12]">{s.title}</p>
            <p className="mt-[.5cqw] text-[clamp(9px,1.5cqw,14px)] leading-snug text-muted">{s.line}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Left: the sample story. Right: a white card for the form. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-4 py-8 sm:px-6 lg:min-h-screen lg:grid-cols-[1.45fr_1fr] lg:gap-4 lg:px-10">
        <div className="hidden lg:block"><Ribbon /></div>
        <div className="mx-auto w-full max-w-[540px]">
          <div className="mb-6 [container-type:inline-size] lg:hidden"><Wordmark /></div>
          <div className="rounded-[28px] bg-card px-6 py-9 shadow-[0_24px_60px_-28px_rgb(var(--shadow)/.35)] sm:px-10 sm:py-12">{children}</div>
          <div className="mt-8 flex justify-center gap-3 lg:hidden" aria-hidden>
            {STOPS.slice(1, 4).map((s, i) => (
              <div key={s.year} className="w-[28%]" style={{ transform: `rotate(${[-6, 4, -3][i]}deg)` }}>
                <div className="polaroid !p-1.5"><Img media={s.m} className="aspect-square w-full" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Turn sign-in errors into plain words. */
function friendly(e: unknown): string {
  const m = (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? '')).toLowerCase();
  if (m.includes('rate limit')) return 'Too many emails were sent in the last hour. Log in with your password, or try the email link again in about an hour.';
  if (m.includes('invalid login')) return 'That email and password don’t match. New here? Choose “Sign up”.';
  if (m.includes('already registered')) return 'This email already has an account. Choose “Log in”.';
  if (m.includes('not confirmed')) return 'Open the confirmation email we sent you first, then log in.';
  if (m.includes('password')) return 'Use a password with at least 8 characters.';
  return 'Something went wrong. Check your connection and try again.';
}

const fieldWrap = 'flex min-h-[60px] items-center gap-3 rounded-[16px] border border-line bg-paper px-4 focus-within:border-string';
const fieldInput = 'min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-muted focus:outline-none';
const cta = 'flex min-h-[64px] w-full items-center justify-center rounded-full bg-string px-6 text-[18px] font-bold text-white transition hover:opacity-90 disabled:opacity-50';

function GoogleMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.100-.4-4.500H24v9h12.700c-.6 3-2.300 5.500-4.800 7.200l7.700 6c4.500-4.200 6.900-10.300 6.900-17.700z" />
      <path fill="#FBBC05" d="M10.500 28.600A14.500 14.500 0 0 1 9.700 24c0-1.600.3-3.200.8-4.600l-7.900-6.200A24 24 0 0 0 0 24c0 3.900.9 7.500 2.600 10.800l7.900-6.200z" />
      <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.100 1.400-4.900 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.900l-7.900 6.200C6.500 42.600 14.600 48 24 48z" />
    </svg>
  );
}

export function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(friendly(e)); }
    setBusy(false);
  };
  const keep = () => auth.setRemember(remember);

  if (auth.mode !== 'cloud') {
    return (
      <Shell>
        <h1 className="text-center font-display text-[36px] leading-tight">Welcome</h1>
        <p className="mt-1 text-center text-[17px] text-muted">Have a look around, or start your own album</p>
        <div className="mt-8 space-y-4">
          <button className={cta} onClick={() => auth.enterPreview('demo')}>Explore the sample family <Icon name="arrow" className="ml-3" /></button>
          <form className="space-y-3 pt-2" onSubmit={(e) => { e.preventDefault(); auth.enterPreview('fresh', name.trim() || undefined); }}>
            <label htmlFor="l-name" className="block font-bold">Or start your own album</label>
            <div className={fieldWrap}><Icon name="people" className="text-muted" /><input id="l-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your family name" className={fieldInput} /></div>
            <Btn type="submit" variant="soft" className="w-full min-h-[56px]">Start my album</Btn>
            <p className="text-[13px] text-muted">In this preview your album is saved in this browser.</p>
          </form>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-center font-display text-[36px] leading-tight sm:text-[40px]">{tab === 'in' ? 'Welcome Back' : 'Create Your Account'}</h1>
      <p className="mt-1 text-center text-[17px] text-muted">{tab === 'in' ? 'Log in to continue your journey' : 'Start writing your family’s story'}</p>

      {sent ? (
        <div className="mt-8 rounded-[18px] bg-sand p-5 text-center" role="status">
          <p className="font-display text-[24px]">Check your inbox</p>
          <p className="mt-1 text-ink/80">We sent a link to <b>{email}</b>. Open it on this device to come straight in. It can take a minute; check spam too.</p>
          <button className="mt-3 min-h-[40px] font-bold text-string underline underline-offset-4" onClick={() => setSent(false)}>Back to log in</button>
        </div>
      ) : (
        <>
          <form className="mt-8 space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const em = email.trim().toLowerCase();
            if (!em.includes('@')) return;
            if (password.length < 8) { setErr('Use a password with at least 8 characters.'); return; }
            keep();
            run(async () => {
              if (tab === 'in') await auth.signInPassword(em, password);
              else if (!(await auth.signUpPassword(em, password))) setSent(true);
            });
          }}>
            <div className={fieldWrap}>
              <Icon name="mail" className="text-muted" />
              <label htmlFor="l-email" className="sr-only">Email address</label>
              <input id="l-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={fieldInput} />
            </div>
            <div className={fieldWrap}>
              <Icon name="lock" className="text-muted" />
              <label htmlFor="l-pass" className="sr-only">Password</label>
              <input id="l-pass" type={show ? 'text' : 'password'} autoComplete={tab === 'in' ? 'current-password' : 'new-password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === 'in' ? 'Password' : 'Password (8+ characters)'} className={fieldInput} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:text-ink">
                <Icon name={show ? 'eye' : 'eyeoff'} />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-muted">
                <input id="l-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--string))]" /> Remember me
              </label>
              <button type="button" disabled={busy} className="min-h-[40px] font-medium text-string underline-offset-4 hover:underline"
                onClick={() => { const em = email.trim().toLowerCase(); if (!em.includes('@')) { setErr('Type your email first, then tap “Forgot password?” to get a sign-in link.'); return; } keep(); run(async () => { await auth.signInEmail(em); setSent(true); }); }}>
                Forgot password?
              </button>
            </div>
            {err && <p className="text-[15px] text-heart" role="alert">{err}</p>}
            <button type="submit" disabled={busy} className={`${cta} relative`}>
              {busy ? 'One moment…' : tab === 'in' ? 'Log In' : 'Sign Up'}
              <Icon name="arrow" className="absolute right-7" />
            </button>
          </form>

          {import.meta.env.VITE_GOOGLE === '1' && (
            <>
              <div className="mt-8 flex items-center gap-4 text-[13px] font-medium tracking-[.08em] text-muted"><span className="h-px flex-1 bg-line" />OR CONTINUE WITH<span className="h-px flex-1 bg-line" /></div>
              <div className="mt-5 flex justify-center">
                <button onClick={() => { keep(); run(auth.signInGoogle); }} disabled={busy} aria-label="Continue with Google" className="grid h-16 w-24 place-items-center rounded-[16px] border border-line bg-paper transition hover:border-string"><GoogleMark /></button>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-[16px] text-muted">
            {tab === 'in' ? 'Don’t have an account?' : 'Already have an account?'}{' '}
            <button type="button" className="min-h-[40px] font-bold text-string underline-offset-4 hover:underline" onClick={() => { setTab(tab === 'in' ? 'up' : 'in'); setErr(''); }}>
              {tab === 'in' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </>
      )}
      <p className="mt-6 flex items-center justify-center gap-2 text-[13px] text-muted"><Icon name="lock" size={15} /> Private by default. No public feed, no ads.</p>
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
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong. Try again.'); }
    setBusy(false);
  };
  return (
    <Shell>
      <h1 className="text-center font-display text-[36px] leading-tight">Welcome, {auth.user?.name}</h1>
      <p className="mt-1 text-center text-[17px] text-muted">Start your family’s album, or join one</p>
      <div className="mt-8 grid gap-6">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => auth.createFamily(name.trim(), since)); }}>
          <p className="font-display text-[24px]">Start a new family album</p>
          <div className={fieldWrap}><Icon name="people" className="text-muted" /><label htmlFor="f-new" className="sr-only">Family name</label><input id="f-new" value={name} onChange={(e) => setName(e.target.value)} placeholder="Family name" className={fieldInput} /></div>
          <div className={fieldWrap}><Icon name="calendar" className="text-muted" /><label htmlFor="f-since" className="shrink-0 text-muted">Together since</label><input id="f-since" type="date" value={since} onChange={(e) => setSince(e.target.value)} className={fieldInput} /></div>
          <button type="submit" className={cta} disabled={busy || !name.trim()}>Create our album</button>
        </form>
        <div className="flex items-center gap-4 text-[13px] font-medium tracking-[.08em] text-muted"><span className="h-px flex-1 bg-line" />OR<span className="h-px flex-1 bg-line" /></div>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => auth.joinFamily(code)); }}>
          <p className="font-display text-[24px]">Join with a family code</p>
          <div className={fieldWrap}><Icon name="link" className="text-muted" /><label htmlFor="f-code" className="sr-only">Family code</label><input id="f-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code from your family" className={`${fieldInput} uppercase tracking-[.16em]`} autoCapitalize="characters" /></div>
          <Btn type="submit" variant="soft" className="w-full min-h-[56px]" disabled={busy || !code.trim()}>Join family</Btn>
        </form>
        {err && <p className="text-[15px] text-heart" role="alert">{err}</p>}
        <button onClick={() => auth.signOut()} className="mx-auto min-h-[44px] text-[14px] font-bold text-muted underline underline-offset-4">Log out</button>
      </div>
    </Shell>
  );
}
