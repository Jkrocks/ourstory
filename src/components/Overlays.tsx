import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { byDateDesc, coverOf, fmtDate, parts, plural, stats, typeOf, uid } from '../lib/utils';
import { Avatar, Btn, Icon, Img, Sheet, SheetHeader } from './ui';

/* ---------------- Search ---------------- */
export function Search() {
  const { state, search, setSearch, openMemory, go } = useStore();
  const [q, setQ] = useState('');
  useEffect(() => { if (!search) setQ(''); }, [search]);

  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    const words = s.split(/\s+/);
    const hay = (parts: (string | undefined)[]) => parts.filter(Boolean).join(' ').toLowerCase();
    const mems = state.memories
      .filter((m) => {
        const h = hay([m.title, m.story, m.place, m.tags.join(' '), typeOf(state, m.type).label, fmtDate(m.date), fmtDate(m.date, 'month'),
          m.people.map((id) => state.people.find((p) => p.id === id)?.name).join(' ')]);
        return words.every((w) => h.includes(w));
      })
      .sort(byDateDesc);
    const people = state.people.filter((p) => hay([p.name, p.relation]).includes(s));
    const places = [...new Set(state.memories.map((m) => m.place).filter(Boolean) as string[])].filter((p) => p.toLowerCase().includes(s));
    return { mems, people, places };
  }, [q, state]);

  if (!search) return null;
  const close = () => setSearch(false);
  const years = [...new Set(state.memories.map((m) => parts(m.date).y))].sort((a, b) => b - a);
  const places = [...new Set(state.memories.map((m) => m.place).filter(Boolean) as string[])].slice(0, 8);

  return (
    <Sheet onClose={close} label="Search" wide>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Icon name="search" className="text-muted" />
        <label htmlFor="q" className="sr-only">Search your memories</label>
        <input id="q" data-autofocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name, place, year or story…" className="min-h-[44px] flex-1 bg-transparent text-[19px] focus:outline-none" autoComplete="off" />
        <button onClick={close} aria-label="Close search" className="grid h-11 w-11 place-items-center rounded-full bg-sand"><Icon name="close" size={20} /></button>
      </div>
      <div className="min-h-[40vh] overflow-y-auto px-5 py-5">
        {!res && (
          <div className="space-y-6">
            <div>
              <p className="eyebrow mb-3">People</p>
              <div className="flex flex-wrap gap-2">
                {state.people.map((p) => (
                  <button key={p.id} onClick={() => { close(); go({ name: 'timeline', person: p.id }); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-paper py-1 pl-1 pr-4 font-medium hover:bg-sand"><Avatar person={p} size={34} />{p.name}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-3">Places</p>
              <div className="flex flex-wrap gap-2">
                {places.map((p) => <button key={p} onClick={() => setQ(p)} className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-paper px-4 font-medium hover:bg-sand"><Icon name="place" size={16} />{p}</button>)}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-3">Years</p>
              <div className="flex flex-wrap gap-2">
                {years.map((y) => <button key={y} onClick={() => { close(); go({ name: 'timeline', view: 'year', year: y }); }} className="min-h-[40px] rounded-full bg-paper px-4 font-semibold tnum hover:bg-sand">{y}</button>)}
              </div>
            </div>
          </div>
        )}
        {res && (
          <div className="space-y-6">
            {res.people.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {res.people.map((p) => (
                  <button key={p.id} onClick={() => { close(); go({ name: 'timeline', person: p.id }); }} className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-sand py-1 pl-1 pr-5 font-semibold"><Avatar person={p} size={38} />Show memories with {p.name}</button>
                ))}
              </div>
            )}
            {res.places.map((p) => (
              <button key={p} onClick={() => { close(); go({ name: 'places', place: p }); }} className="flex min-h-[48px] items-center gap-2 font-semibold"><Icon name="place" />All memories in {p} <Icon name="next" size={18} /></button>
            ))}
            {res.mems.length > 0 ? (
              <ul className="space-y-2">
                {res.mems.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => { close(); openMemory(m.id); }} className="flex w-full items-center gap-4 rounded-[16px] p-2 text-left hover:bg-sand">
                      <Img media={coverOf(m)} className="h-16 w-16 shrink-0 rounded-[10px]" />
                      <span className="min-w-0">
                        <span className="block truncate text-[17px] font-semibold">{m.title}</span>
                        <span className="block text-[14px] text-muted">{fmtDate(m.date)}{m.place ? ` · ${m.place}` : ''}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              !res.people.length && !res.places.length && <p className="py-10 text-center text-muted">Nothing found for “{q}”. Try a name, a place or a year.</p>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ---------------- Share ---------------- */
export function ShareSheet() {
  const { state, share, setShare, toast } = useStore();
  const auth = useAuth();
  const [download, setDownload] = useState(false);
  const [token] = useState(() => uid());
  const ref = useRef<HTMLInputElement>(null);
  if (!share) return null;
  const close = () => setShare(null);
  const m = share.kind === 'memory' ? state.memories.find((x) => x.id === share.id) : undefined;
  const title = share.kind === 'memory' ? `Share “${m?.title}”` : `Share our ${share.year} memories`;
  const link = `https://ourstory.family/s/${token}`;
  const count = share.kind === 'year' ? state.memories.filter((x) => parts(x.date).y === share.year).length : 1;
  const copy = () => {
    const done = () => toast('Private link copied');
    try {
      navigator.clipboard.writeText(link).then(done, () => { ref.current?.select(); toast('Select the link and copy it'); });
    } catch { ref.current?.select(); }
  };
  if (auth.mode === 'cloud') {
    const code = (auth.family?.invite_code ?? '').toUpperCase();
    const invite = `Join our family album on OurStory: ${(location.origin + import.meta.env.BASE_URL)}  Sign in, choose “Join with a code” and enter ${code}`;
    return (
      <Sheet onClose={close} label={title}>
        <SheetHeader title={title} onClose={close} sub="Everyone in your family can already see this." />
        <div className="space-y-4 px-6 pb-6 pt-3">
          {m && coverOf(m) && <Img media={coverOf(m)} className="aspect-[16/9] w-full rounded-[16px]" />}
          <div className="tone-pink bg-tone-soft rounded-[20px] p-5">
            <p className="text-[13px] font-bold tracking-[.14em] text-muted">TO ADD SOMEONE, SEND THIS CODE</p>
            <p className="select-all font-display text-[32px] tracking-[.12em]">{code}</p>
          </div>
          <Btn className="w-full" onClick={() => { try { navigator.clipboard.writeText(invite).then(() => toast('Invite copied'), () => toast('Select the code and copy it')); } catch { toast('Select the code and copy it'); } }}><Icon name="share" size={18} /> Copy invite</Btn>
          <p className="text-[14px] text-muted">OurStory stays private: no public links, no strangers.</p>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet onClose={close} label={title}>
      <SheetHeader title={title} onClose={close} sub={share.kind === 'year' ? `${plural(count, 'memory', 'memories')} from ${share.year}` : 'Only people with this link can see it.'} />
      <div className="space-y-4 px-6 pb-6 pt-3">
        {m && coverOf(m) && <Img media={coverOf(m)} className="aspect-[16/9] w-full rounded-[16px]" />}
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold">What can they do?</legend>
          {[
            { v: false, t: 'View only', d: 'They can look, not save' },
            { v: true, t: 'View and download', d: 'They can save photos and videos' },
          ].map((o) => (
            <label key={o.t} className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-[14px] border px-4 ${download === o.v ? 'border-ink bg-paper' : 'border-line'}`}>
              <input id={`share-${o.v}`} type="radio" name="dl" checked={download === o.v} onChange={() => setDownload(o.v)} className="h-5 w-5 accent-[rgb(var(--ink))]" />
              <span><span className="block font-semibold">{o.t}</span><span className="block text-[14px] text-muted">{o.d}</span></span>
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="share-link" className="mb-2 block font-semibold">Private link</label>
          <div className="flex gap-2">
            <input id="share-link" ref={ref} readOnly value={link} className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] text-muted" onFocus={(e) => e.target.select()} />
            <Btn onClick={copy}><Icon name="link" size={18} /> Copy</Btn>
          </div>
          <p className="mt-2 text-[14px] text-muted">No public profile, no likes, no comments from strangers. You can turn the link off any time in Settings. In this preview the album stays on your device, so the link is a sample.</p>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------- Yearly recap ---------------- */
export function Recap() {
  const { state, recap, setRecap, openMemory } = useStore();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const year = recap ?? 0;
  const mems = useMemo(() => state.memories.filter((m) => parts(m.date).y === year).sort((a, b) => (a.date < b.date ? -1 : 1)), [state.memories, year]);
  const picks = useMemo(() => {
    const scored = [...mems].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || b.media.length - a.media.length).slice(0, 6);
    return scored.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [mems]);
  const s = stats(mems);
  const trips = mems.filter((m) => m.type === 'trip').length;
  const birthdays = mems.filter((m) => m.type === 'birthday').length;
  const milestones = mems.filter((m) => typeOf(state, m.type).milestone).length;
  const total = 2 + picks.length + 1;

  useEffect(() => { setI(0); setPaused(false); }, [recap]);
  useEffect(() => {
    if (recap == null || paused) return;
    const t = setTimeout(() => setI((x) => (x + 1 < total ? x + 1 : x)), i === 1 ? 6000 : 4500);
    return () => clearTimeout(t);
  }, [i, paused, recap, total]);
  useEffect(() => {
    if (recap == null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRecap(null);
      if (e.key === 'ArrowRight') setI((x) => Math.min(total - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
      if (e.key === ' ') setPaused((p) => !p);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [recap, total, setRecap]);

  if (recap == null) return null;
  const pick = i >= 2 && i < 2 + picks.length ? picks[i - 2] : null;
  const bg = pick ? coverOf(pick) : coverOf(picks[0] ?? mems[0] ?? { media: [] } as never);
  const line = (n: number, one: string, many?: string) => n > 0 && <li className="flex items-baseline gap-4"><span className="w-28 text-right font-display text-[44px] leading-none tnum sm:w-36 sm:text-[56px]">{n.toLocaleString('en-IN')}</span><span className="text-[19px] text-white/85">{n === 1 ? one : many ?? one + 's'}</span></li>;

  return (
    <div className="fixed inset-0 z-[65] overflow-hidden bg-[rgb(14_11_9)] text-white" role="dialog" aria-modal="true" aria-label={`Our ${year}`}>
      {bg && (
        <div key={i} className="absolute inset-0 opacity-70">
          <div className="kenburns h-full w-full"><Img media={bg} className="h-full w-full" eager /></div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />

      <div className="absolute inset-x-0 top-0 z-10 flex gap-1.5 px-4 pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        {Array.from({ length: total }).map((_, k) => (
          <div key={k} className="h-1 flex-1 overflow-hidden rounded bg-white/25">
            <div className="h-full origin-left bg-white" style={k < i ? { transform: 'scaleX(1)' } : k === i ? { animation: `progress ${i === 1 ? 6 : 4.5}s linear both`, animationPlayState: paused ? 'paused' : 'running' } : { transform: 'scaleX(0)' }} key={`${k}-${i}`} />
          </div>
        ))}
      </div>
      <div className="absolute right-3 top-8 z-20 flex gap-1" style={{ top: 'calc(28px + env(safe-area-inset-top, 0px))' }}>
        <button onClick={() => setPaused((p) => !p)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={paused ? 'Play' : 'Pause'}><Icon name={paused ? 'play' : 'pause'} size={18} fill /></button>
        <button onClick={() => setRecap(null)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close recap"><Icon name="close" /></button>
      </div>

      <button className="absolute inset-y-0 left-0 z-[5] w-1/3" aria-label="Previous" onClick={() => setI((x) => Math.max(0, x - 1))} />
      <button className="absolute inset-y-0 right-0 z-[5] w-2/3" aria-label="Next" onClick={() => setI((x) => Math.min(total - 1, x + 1))} />

      <div key={i} className="anim-rise pointer-events-none relative z-[6] mx-auto flex h-full max-w-3xl flex-col justify-end px-6 pb-16 sm:justify-center sm:pb-0">
        {i === 0 && (
          <>
            <p className="font-hand text-[24px] text-white/85">The {state.family.name} family</p>
            <h2 className="font-display text-[88px] leading-[.9] sm:text-[140px]">Our<br />{year}</h2>
            <p className="mt-4 text-[19px] text-white/80">365 days. Here are the ones we kept.</p>
          </>
        )}
        {i === 1 && (
          <ul className="space-y-3">
            {line(365, 'days together')}
            {line(s.memories, 'family memories', 'family memories')}
            {line(trips, 'trip')}
            {line(birthdays, 'birthday')}
            {line(milestones, 'milestone')}
            {line(s.photos, 'photo')}
            {line(s.videos, 'video')}
          </ul>
        )}
        {pick && (
          <>
            {i === 2 && <p className="mb-3 font-hand text-[26px] text-white/85">{year} was the year we…</p>}
            <p className="text-[15px] font-semibold uppercase tracking-[.14em] text-white/70">{fmtDate(pick.date, 'day')}</p>
            <h2 className="mt-1 font-display text-[44px] leading-[1.02] sm:text-[64px]">{pick.title}</h2>
            {pick.story && <p className="mt-4 max-w-xl font-hand text-[21px] leading-snug text-white/90">{pick.story}</p>}
            <button className="pointer-events-auto mt-6 w-fit rounded-full bg-white/15 px-5 py-3 font-semibold backdrop-blur hover:bg-white/25" onClick={() => { setRecap(null); openMemory(pick.id); }}>Open this memory</button>
          </>
        )}
        {i === total - 1 && (
          <>
            <h2 className="font-display text-[48px] leading-[1.02] sm:text-[72px]">Your story keeps growing.</h2>
            <p className="mt-4 text-[19px] text-white/80">{year} is one more chapter in your family’s book.</p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-white px-6 py-3 font-semibold text-[rgb(14_11_9)]" onClick={() => setI(0)}>Watch again</button>
              <button className="rounded-full bg-white/15 px-6 py-3 font-semibold" onClick={() => setRecap(null)}>Back to our story</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
