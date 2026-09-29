import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { Memory } from '../lib/types';
import { byDateDesc, coverOf, fmtDate, MON, MONTHS, parts, today, toneAt, typeOf } from '../lib/utils';
import { Avatar, Chip, Empty, Icon, Img } from '../components/ui';
import { MemoryCard } from '../components/MemoryCard';
import { Doodle, PathMemory, useWander } from '../components/Wander';

type View = 'timeline' | 'year' | 'month';
type Kind = 'all' | 'milestones' | 'photos' | 'videos' | 'favorites' | 'stories';

export function useFiltered(person: string[] , place: string | undefined, kind: Kind) {
  const { state } = useStore();
  return useMemo(() => {
    return state.memories
      .filter((m) => person.every((p) => m.people.includes(p)))
      .filter((m) => !place || m.place === place)
      .filter((m) => {
        if (kind === 'milestones') return typeOf(state, m.type).milestone;
        if (kind === 'photos') return m.media.some((x) => x.kind === 'photo');
        if (kind === 'videos') return m.media.some((x) => x.kind !== 'photo');
        if (kind === 'favorites') return m.favorite;
        if (kind === 'stories') return !!m.story;
        return true;
      })
      .sort(byDateDesc);
  }, [state, person, place, kind]);
}

export function Timeline() {
  const { state, route } = useStore();
  const r = route.name === 'timeline' ? route : { name: 'timeline' as const };
  const [view, setView] = useState<View>(r.view ?? 'timeline');
  const [people, setPeople] = useState<string[]>(r.person ? [r.person] : []);
  const [place, setPlace] = useState<string | undefined>(r.place);
  const [kind, setKind] = useState<Kind>('all');
  const [year, setYear] = useState<number>(r.year ?? parts(today()).y);
  const [month, setMonth] = useState<number>(parts(today()).m);

  useEffect(() => {
    setView(r.view ?? 'timeline');
    setPeople(r.person ? [r.person] : []);
    setPlace(r.place);
    if (r.year) setYear(r.year);
  }, [r.view, r.person, r.place, r.year]);

  const mems = useFiltered(people, place, kind);
  const kids = state.people.filter((p) => p.generation === 2).map((p) => p.id);
  const kidsOn = kids.length > 1 && kids.every((k) => people.includes(k)) && people.length === kids.length;
  const places = [...new Set(state.memories.map((m) => m.place).filter(Boolean) as string[])].sort();
  const years = [...new Set(state.memories.map((m) => parts(m.date).y))].sort((a, b) => b - a);
  const active = people.length || place || kind !== 'all';
  const who = people.map((id) => state.people.find((p) => p.id === id)?.name).filter(Boolean);

  const toggle = (id: string) => setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (!state.memories.length) return <Empty title="No memories yet." body={'Every family has a story.\nLet’s start yours.'} />;

  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Timeline</p>
          <h1 className="font-display text-[40px] leading-tight sm:text-[52px]">What happened in our life</h1>
          {who.length > 0 && <p className="mt-1 font-hand text-[21px] text-muted">Memories with {kidsOn ? 'the kids' : who.join(' & ')}</p>}
          {place && <p className="mt-1 font-hand text-[21px] text-muted">Memories in {place}</p>}
        </div>
        <div role="tablist" aria-label="View" className="inline-flex rounded-full bg-sand p-1">
          {(['timeline', 'year', 'month'] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`min-h-[44px] rounded-full px-5 text-[15px] font-semibold capitalize transition ${view === v ? 'bg-card shadow-sm' : 'text-muted hover:text-ink'}`}>
              {v}
            </button>
          ))}
        </div>
      </header>

      {/* Filters */}
      <div className="sticky z-20 -mx-4 mb-8 space-y-3 border-b border-line/60 bg-paper px-4 py-3" style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--topbar, 0px))' }}>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="sr-only">Show memories with</span>
          {state.people.map((p) => {
            const on = people.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on} aria-label={`Show memories with ${p.name}`}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[15px] font-medium transition ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card'}`}>
                <Avatar person={p} size={32} />{p.name}
              </button>
            );
          })}
          {kids.length > 1 && <Chip active={kidsOn} onClick={() => setPeople(kidsOn ? [] : kids)}>🧸 The kids</Chip>}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {([['all', 'Everything'], ['milestones', '❤️ Milestones'], ['photos', '📸 Photos'], ['videos', '🎥 Videos'], ['stories', '✍️ Stories'], ['favorites', '★ Favourites']] as [Kind, string][]).map(([k, l]) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{l}</Chip>
          ))}
          <label htmlFor="f-place" className="sr-only">Place</label>
          <select id="f-place" value={place ?? ''} onChange={(e) => setPlace(e.target.value || undefined)} className="min-h-[40px] shrink-0 rounded-full border border-line bg-card px-4 text-[15px] font-medium">
            <option value="">📍 Any place</option>
            {places.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {active ? <button onClick={() => { setPeople([]); setPlace(undefined); setKind('all'); }} className="min-h-[40px] shrink-0 px-3 text-[15px] font-semibold underline underline-offset-4">Clear</button> : null}
        </div>
      </div>

      {view === 'timeline' && <TimelineView mems={mems} years={years} />}
      {view === 'year' && <YearView mems={mems} years={years} year={year} setYear={setYear} openMonth={(m) => { setMonth(m); setView('month'); }} />}
      {view === 'month' && <MonthView mems={mems} year={year} month={month} set={(y, m) => { setYear(y); setMonth(m); }} />}
    </div>
  );
}

function YearHeader({ y, count }: { y: number; count: number }) {
  const tone = toneAt(y);
  const { setRecap, setShare, published } = useStore();
  return (
    <div id={`y${y}`} className="relative z-[1] mx-auto mb-10 flex w-fit scroll-mt-48 flex-col items-center pt-6 text-center">
      <h2 className={`tone-${tone} text-tone rounded-full bg-paper px-5 font-display text-[52px] leading-none tnum sm:text-[64px]`}>{y}</h2>
      <p className="mt-2 bg-paper px-3 text-[14px] text-muted">{count} {count === 1 ? 'memory' : 'memories'}</p>
      <div className="flex gap-4 bg-paper px-3 text-[13px] font-bold">
        <button className="min-h-[36px] underline-offset-4 hover:underline" onClick={() => setRecap(y)}>▶ Our {y}</button>
        {!published && <button className="min-h-[36px] underline-offset-4 hover:underline" onClick={() => setShare({ kind: 'year', year: y })}>Share year</button>}
      </div>
    </div>
  );
}

const OFFSETS = ['6%', '44%', '18%', '50%', '2%', '36%'];
const DOODLE_ORDER = ['curl', 'hearts', 'star', 'kite', 'candy', 'arrow'];

function TimelineView({ mems, years }: { mems: Memory[]; years: number[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => {
    const g = new Map<number, Memory[]>();
    mems.forEach((m) => { const y = parts(m.date).y; g.set(y, [...(g.get(y) ?? []), m]); });
    return [...g.entries()];
  }, [mems]);
  const line = useWander(wrap, [mems]);
  if (!mems.length) return <p className="py-16 text-center font-hand text-[22px] text-muted">No memories match these filters yet.</p>;
  let n = 0;
  return (
    <div className="relative lg:grid lg:grid-cols-[1fr_72px] lg:gap-6">
      <div ref={wrap} className="relative">
        {line}
        {groups.map(([y, list], gi) => (
          <section key={y} className="relative mb-6" aria-label={String(y)}>
            <YearHeader y={y} count={list.length} />
            <Doodle name={DOODLE_ORDER[gi % DOODLE_ORDER.length]} className={`absolute top-6 hidden sm:block ${gi % 2 ? 'left-0' : 'right-0'}`} size={gi % 2 ? 84 : 104} />
            <ol className="space-y-14 sm:space-y-4">
              {list.map((m) => {
                const i = n++;
                const off = OFFSETS[i % OFFSETS.length];
                const side = parseInt(off) >= 36 ? 'right' : 'left';
                return (
                  <li key={m.id} className="relative" style={{ ['--off' as string]: off }}>
                    <div className={`sm:ml-[var(--off)] sm:w-fit ${side === 'right' ? 'ml-auto w-fit' : ''}`}>
                      <PathMemory m={m} i={i} side={side} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <p className="relative z-[1] mx-auto mt-10 w-fit bg-paper px-4 pb-4 text-center font-display text-[19px] text-muted">…and that’s where it all began.</p>
      </div>
      <nav aria-label="Jump to year" className="hidden lg:block">
        <ul className="sticky top-48 space-y-1">
          {years.map((y) => (
            <li key={y}><a href={`#y${y}`} onClick={(e) => { e.preventDefault(); document.getElementById(`y${y}`)?.scrollIntoView({ behavior: 'smooth' }); }} className="block rounded-full px-3 py-1 text-right text-[14px] font-medium text-muted tnum hover:text-ink">{y}</a></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function YearView({ mems, years, year, setYear, openMonth }: { mems: Memory[]; years: number[]; year: number; setYear: (y: number) => void; openMonth: (m: number) => void }) {
  const { state, openMemory, setRecap } = useStore();
  const inYear = mems.filter((m) => parts(m.date).y === year);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {years.map((y) => <Chip key={y} active={y === year} onClick={() => setYear(y)} className="tnum">{y}</Chip>)}
        </div>
        {inYear.length > 0 && <button onClick={() => setRecap(year)} className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-5 font-semibold text-paper"><Icon name="play" size={16} fill /> Our {year}</button>}
      </div>
      <div className="paper-bg rounded-[28px] border border-line p-4 sm:p-8">
        <h2 className="mb-6 font-display text-[72px] leading-none tnum sm:text-[96px]">{year}</h2>
        <ol className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {MON.map((mon, i) => {
            const list = inYear.filter((m) => parts(m.date).m === i + 1).sort((a, b) => (a.date < b.date ? -1 : 1));
            return (
              <li key={mon}>
                <button onClick={() => openMonth(i + 1)} className="mb-3 flex w-full items-baseline justify-between border-b border-line pb-1 text-left">
                  <span className="text-[15px] font-bold uppercase tracking-[.16em]">{mon}</span>
                  <span className="text-[13px] text-muted tnum">{list.length || ''}</span>
                </button>
                {list.length ? (
                  <div className="relative h-[190px]">
                    {list.slice(0, 3).map((m, k) => (
                      <button key={m.id} onClick={() => openMemory(m.id)} className="print absolute w-[150px] transition hover:z-10 hover:-translate-y-1 hover:rotate-0"
                        style={{ left: `${k * 26}%`, top: k % 2 ? 22 : 0, transform: `rotate(${[-4, 3, -1.5][k]}deg)`, zIndex: k }} aria-label={m.title}>
                        <Img media={coverOf(m)} className="aspect-square w-full rounded-[3px]" />
                        <p className="mt-1 truncate font-hand text-[14px]">{typeOf(state, m.type).emoji} {m.title}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-hand text-[18px] text-muted/70">a quiet month</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function MonthView({ mems, year, month, set }: { mems: Memory[]; year: number; month: number; set: (y: number, m: number) => void }) {
  const { openMemory } = useStore();
  const list = mems.filter((m) => { const p = parts(m.date); return p.y === year && p.m === month; }).sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (d: number) => { let m = month + d; let y = year; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } set(y, m); };
  const t = today();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <button onClick={() => shift(-1)} className="grid h-12 w-12 place-items-center rounded-full bg-sand" aria-label="Previous month"><Icon name="back" /></button>
        <h2 className="text-center font-display text-[34px] leading-tight sm:text-[44px]">{MONTHS[month - 1]} <span className="tnum">{year}</span></h2>
        <button onClick={() => shift(1)} className="grid h-12 w-12 place-items-center rounded-full bg-sand" aria-label="Next month"><Icon name="next" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <p key={i} className="pb-1 text-center text-[13px] font-semibold text-muted">{d}</p>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const hit = list.find((m) => m.date === iso);
          const isToday = iso === t;
          return hit ? (
            <button key={i} onClick={() => openMemory(hit.id)} className="relative aspect-square overflow-hidden rounded-[10px] shadow-print sm:rounded-[14px]" aria-label={`${d} ${MONTHS[month - 1]}: ${hit.title}`}>
              <Img media={coverOf(hit)} className="h-full w-full" />
              <span className="absolute left-1 top-1 rounded-full bg-card/90 px-1.5 text-[12px] font-bold tnum sm:left-2 sm:top-2 sm:text-[13px]">{d}</span>
            </button>
          ) : (
            <span key={i} className={`grid aspect-square place-items-center rounded-[10px] text-[15px] tnum sm:rounded-[14px] ${isToday ? 'bg-ink font-bold text-paper' : 'bg-card/60 text-muted'}`}>{d}</span>
          );
        })}
      </div>
      <div className="mt-10">
        {list.length ? (
          <ul className="grid gap-6 sm:grid-cols-2">
            {list.map((m, i) => <li key={m.id}><MemoryCard m={m} index={i} /></li>)}
          </ul>
        ) : (
          <p className="py-8 text-center font-hand text-[21px] text-muted">A quiet month. {fmtDate(`${year}-${String(month).padStart(2, '0')}-01`, 'month')} is still waiting for its story.</p>
        )}
      </div>
    </div>
  );
}
