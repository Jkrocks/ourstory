import { useMemo } from 'react';
import type { Memory } from '../lib/types';
import { useStore } from '../lib/store';
import { ago, byDateDesc, coverOf, fmtDate, greeting, MON, parts, stats, today, typeOf, yearsTogether } from '../lib/utils';
import { Btn, Empty, Icon, Img, LinkBtn, SectionHead } from '../components/ui';
import { Polaroid } from '../components/MemoryCard';
import { Doodle, Pin, Tape, handDate } from '../components/Wander';
import { useLikes } from '../lib/likes';

export function Home() {
  const { state, openAdd, go, openMemory, setRecap, canEdit } = useStore();
  const mems = useMemo(() => [...state.memories].sort(byDateDesc), [state.memories]);
  const likes = useLikes();
  const loved = mems.filter((m) => likes.count(m.id) > 0).sort((a, b) => likes.count(b.id) - likes.count(a.id)).slice(0, 8);
  const t = parts(today());
  const s = stats(mems);
  const milestones = mems.filter((m) => typeOf(state, m.type).milestone);
  const onThisDay = mems.filter((m) => { const p = parts(m.date); return p.m === t.m && p.d === t.d && p.y < t.y; });
  const thisYear = mems.filter((m) => parts(m.date).y === t.y).sort((a, b) => (a.date < b.date ? -1 : 1));
  const lastYear = t.y - 1;
  const lastYearMems = mems.filter((m) => parts(m.date).y === lastYear);
  const favs = mems.filter((m) => m.favorite && coverOf(m)).slice(0, 3);
  const heroStack = favs.length >= 3 ? favs : mems.filter((m) => coverOf(m)).slice(0, 3);
  const upcoming = mems
    .filter((m) => m.yearly || m.type === 'birthday')
    .map((m) => { const p = parts(m.date); const next = `${p.m < t.m || (p.m === t.m && p.d <= t.d) ? t.y + 1 : t.y}-${m.date.slice(5)}`; return { m, next }; })
    .sort((a, b) => (a.next < b.next ? -1 : 1));
  const birthdays = state.people
    .filter((p) => p.birthday)
    .map((p) => { const b = parts(p.birthday!); const y = b.m < t.m || (b.m === t.m && b.d < t.d) ? t.y + 1 : t.y; return { p, next: `${y}-${p.birthday!.slice(5)}`, age: y - b.y }; })
    .sort((a, b) => (a.next < b.next ? -1 : 1))
    .slice(0, 3);

  if (!mems.length) {
    return (
      <div className="pt-8">
        <p className="font-hand text-[22px] text-muted">{greeting()}, {state.family.name} family ❤️</p>
        {canEdit
          ? <Empty title="Your story starts here ❤️" body={'Every family has a story.\nLet’s start yours with your first memory.'} />
          : <Empty title="New memories are on their way ❤️" body={'This family album is just getting started.\nCome back soon.'} action={false} />}
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-10 pt-4 sm:space-y-20 sm:pt-8">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="anim-rise min-w-0">
          <p className="font-hand text-[24px] text-muted">{greeting()}, {state.family.name} family ❤️</p>
          <h1 className="mt-3 font-display text-[58px] uppercase leading-[.92] tracking-[-.01em] sm:text-[88px]">Our<br />Story</h1>
          <p className="mt-4 max-w-md text-[19px] text-ink/80">Your family journey, one memory at a time.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {canEdit && <Btn onClick={() => openAdd('menu')} className="min-h-[56px] px-7 text-[17px]"><Icon name="plus" size={22} /> Add Memory</Btn>}
            <Btn variant={canEdit ? 'soft' : 'primary'} onClick={() => go({ name: 'timeline' })} className="min-h-[56px] px-6">Explore Our Story</Btn>
          </div>
        </div>
        <HeroBoard mems={heroStack} since={parts(state.family.since).y} onOpen={openMemory} />
      </section>

      {/* Your story so far */}
      <section aria-labelledby="sofar">
        <h2 id="sofar" className="font-hand text-[24px] text-muted">Your story so far…</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { n: yearsTogether(state.family.since), l: 'years together', note: `since ${fmtDate(state.family.since, 'month')}` },
            { n: s.memories, l: 'memories', note: 'and counting' },
            { n: s.photos, l: 'photos', note: 'of smiles' },
            { n: s.videos, l: 'videos', note: 'of laughter' },
            { n: milestones.length, l: 'milestones', note: 'big moments' },
          ].map((x, i) => (
            <div key={x.l} className={`tone-${['pink', 'marigold', 'teal', 'indigo', 'lilac'][i]} anim-rise`} style={{ animationDelay: `${i * 70}ms` }}>
              <p className="text-tone font-display text-[48px] leading-none tnum sm:text-[56px]">{x.n.toLocaleString('en-IN')}</p>
              <p className="mt-2 text-[17px] font-semibold">{x.l}</p>
              <p className="font-hand text-[16px] text-muted">{x.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* On this day */}
      <section aria-labelledby="otd" className="tone-pink bg-tone-soft relative overflow-hidden rounded-[32px] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-honey" /><Doodle name="diya" className="absolute bottom-6 right-6 hidden sm:block" size={80} />
        <div className="relative">
          <p className="eyebrow">On this day ❤️</p>
          <h2 id="otd" className="mt-1 font-display text-[34px] leading-tight sm:text-[42px]">{fmtDate(today(), 'day')}</h2>
          {onThisDay.length ? (
            <>
              <p className="mt-1 font-hand text-[20px] text-muted">{ago(onThisDay[onThisDay.length - 1].date)} today, and every year since…</p>
              <ul className="no-scrollbar -mx-2 mt-6 flex gap-5 overflow-x-auto px-2 pb-4 pt-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {onThisDay.map((m, i) => (
                  <li key={m.id} className="w-[230px] shrink-0 sm:w-auto">
                    <p className="mb-2 font-display text-[22px] tnum">{parts(m.date).y}</p>
                    <Polaroid m={m} size="lg" rotate={[-1.5, 1.2, -0.6, 1.8][i % 4]} note={`${typeOf(state, m.type).emoji} ${m.title}`} />
                    <p className="mt-2 text-[14px] text-muted">{ago(m.date)}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 max-w-lg text-ink/80">Nothing saved from this day yet. Maybe today is the day to start one.</p>
          )}
        </div>
      </section>

      {/* Recent */}
      <section aria-labelledby="recent">
        <SectionHead eyebrow="Recently added" title="Recent memories" action={<LinkBtn onClick={() => go({ name: 'timeline' })}>See all</LinkBtn>} />
        <div id="recent" className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-6 pt-2">
          {mems.slice(0, 8).map((m, i) => <Polaroid key={m.id} m={m} rotate={[-1.2, 1, -0.4, 1.4][i % 4]} />)}
        </div>
      </section>

      {/* Most loved */}
      {loved.length > 0 && (
        <section aria-labelledby="loved">
          <SectionHead eyebrow="Liked by the family" title="Most loved" />
          <div id="loved" className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-6 pt-2">
            {loved.map((m, i) => <Polaroid key={m.id} m={m} rotate={[-1, 1.2, -0.4, 1.4][i % 4]} note={`♥ ${likes.count(m.id)} · ${m.title}`} />)}
          </div>
        </section>
      )}

      {/* This year */}
      {thisYear.length > 0 && (
        <section aria-labelledby="thisyear">
          <SectionHead eyebrow={`${thisYear.length} memories so far`} title={`This year, ${t.y}`} action={<LinkBtn onClick={() => go({ name: 'timeline', view: 'year', year: t.y })}>Year view</LinkBtn>} />
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <ol id="thisyear" className="relative flex min-w-max gap-4 pb-4 pt-1">
              <span className="absolute left-0 right-0 top-[38px] h-[2px] bg-line" aria-hidden />
              {thisYear.map((m) => (
                <li key={m.id} className="relative w-[150px]">
                  <p className="h-5 text-[13px] font-semibold uppercase leading-5 tracking-[.12em] text-muted">{MON[parts(m.date).m - 1]} {parts(m.date).d}</p>
                  <span className="relative ml-3 mt-2 block h-3.5 w-3.5 rounded-full border-2 border-paper bg-heart" aria-hidden />
                  <button onClick={() => openMemory(m.id)} className="group mt-3 block w-full text-left">
                    <Img media={coverOf(m)} className="aspect-square w-full rounded-full transition group-hover:-translate-y-1" />
                    <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug">{typeOf(state, m.type).emoji} {m.title}</p>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <section aria-labelledby="ms">
          <SectionHead eyebrow="The big firsts" title="Family milestones" />
          <ul id="ms" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...milestones].reverse().map((m) => {
              const ty = typeOf(state, m.type);
              return (
                <li key={m.id}>
                  <button onClick={() => openMemory(m.id)} className="flex w-full items-center gap-4 rounded-[20px] bg-card p-3 text-left shadow-print transition hover:-translate-y-0.5 hover:shadow-lift">
                    <Img media={coverOf(m)} className="h-20 w-20 shrink-0 rounded-[14px]" />
                    <span className="min-w-0">
                      <span className="block text-[14px] text-muted"><span aria-hidden>{ty.emoji}</span> {ty.label} · {parts(m.date).y}</span>
                      <span className="block truncate font-display text-[20px] leading-tight">{m.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Coming up + recap */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="tone-teal bg-tone-soft rounded-[28px] p-6 sm:p-8">
          <p className="eyebrow">Coming up</p>
          <h2 className="mt-1 font-display text-[28px] leading-tight">Days to remember</h2>
          <ul className="mt-5 space-y-3">
            {birthdays.map(({ p, next, age }) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-card text-center leading-none shadow-sm">
                  <span><span className="block text-[11px] font-semibold uppercase text-muted">{MON[parts(next).m - 1]}</span><span className="block font-display text-[19px] tnum">{parts(next).d}</span></span>
                </span>
                <span className="min-w-0"><span className="block font-semibold">{p.name} turns {age}</span><span className="block text-[14px] text-muted">🎂 Birthday</span></span>
              </li>
            ))}
            {upcoming.filter((u) => u.m.yearly).slice(0, 2).map(({ m, next }) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-card text-center leading-none shadow-sm">
                  <span><span className="block text-[11px] font-semibold uppercase text-muted">{MON[parts(next).m - 1]}</span><span className="block font-display text-[19px] tnum">{parts(next).d}</span></span>
                </span>
                <span className="min-w-0"><span className="block truncate font-semibold">{m.title}</span><span className="block text-[14px] text-muted">📅 Every year since {parts(m.date).y}</span></span>
              </li>
            ))}
          </ul>
        </div>

        {lastYearMems.length > 0 && (
          <button onClick={() => setRecap(lastYear)} className="group relative min-h-[300px] overflow-hidden rounded-[28px] text-left text-white shadow-lift">
            <Img media={coverOf(lastYearMems.find((m) => m.favorite) ?? lastYearMems[0])} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <span className="relative flex h-full flex-col justify-end p-6 sm:p-8">
              <span className="font-hand text-[22px] text-white/85">Your yearly family story</span>
              <span className="font-display text-[56px] leading-none">Our {lastYear}</span>
              <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-[rgb(14_11_9)]">
                <Icon name="play" size={16} fill /> Play the recap
              </span>
            </span>
          </button>
        )}
      </section>

      {/* Collections */}
      <section aria-labelledby="moments">
        <SectionHead eyebrow="Gathered for you" title="Family moments" action={<LinkBtn onClick={() => go({ name: 'memories' })}>All collections</LinkBtn>} />
        <Collections />
      </section>

      <div className="flex flex-col items-center gap-4 rounded-[28px] border-2 border-dashed border-line px-6 py-12 text-center">
        <p className="font-hand text-[24px] text-muted">Your family’s story is becoming a beautiful book.</p>
        {canEdit
          ? <Btn onClick={() => openAdd('menu')} className="min-h-[56px] px-7">Continue your story <Icon name="next" size={20} /></Btn>
          : <Btn onClick={() => go({ name: 'timeline' })} className="min-h-[56px] px-7">Explore our story <Icon name="next" size={20} /></Btn>}
      </div>
    </div>
  );
}

export function Collections({ onPick }: { onPick?: (id: string) => void }) {
  const { state, go } = useStore();
  const items = state.collections
    .map((c) => ({ c, mems: state.memories.filter((m) => m.collections?.includes(c.id)).sort(byDateDesc) }))
    .filter((x) => x.mems.length);
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(({ c, mems }, i) => (
        <li key={c.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <button onClick={() => (onPick ? onPick(c.id) : go({ name: 'memories', collection: c.id }))} className="group block w-full text-left">
            <span className="relative block aspect-[4/3] overflow-hidden rounded-[18px] shadow-print">
              <Img media={coverOf(mems.find((m) => m.favorite) ?? mems[0])} className="h-full w-full transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-white">
                <span className="block text-[17px] font-semibold leading-tight"><span aria-hidden>{c.emoji}</span> {c.name}</span>
                <span className="block text-[13px] text-white/80 tnum">{mems.length} memories</span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Three pinned polaroids on string, with tape and doodles: the album's cover. */
function HeroBoard({ mems, since, onOpen }: { mems: Memory[]; since: number; onOpen: (id: string) => void }) {
  const spots = [
    { left: '6%', top: '4%', rot: -4, pin: { x: 82, y: 18 } },
    { left: '52%', top: '18%', rot: 3.5, pin: { x: 20, y: 22 } },
    { left: '18%', top: '52%', rot: -2, pin: { x: 78, y: 16 } },
  ];
  // pin centres in % of the board, for the string
  const W = 520, H = 460, PW = 200;
  const pts = spots.slice(0, mems.length).map((s) => ({
    x: (parseFloat(s.left) / 100) * W + (s.pin.x / 100) * PW,
    y: (parseFloat(s.top) / 100) * H + (s.pin.y / 100) * PW * 1.2,
  }));
  const d = pts.map((p, i) => (i ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(' ');
  return (
    <div className="relative mx-auto aspect-[520/460] w-full max-w-[520px]" aria-hidden>
      <Doodle name="curl" className="absolute left-[30%] -top-2 w-[22%]" size={120} />
      <Doodle name="hearts" className="absolute right-[4%] top-[4%] w-[12%]" size={64} />
      <Doodle name="scribble" className="absolute bottom-[2%] left-[-6%] w-[46%] opacity-70" size={220} />
      <Doodle name="star" className="absolute bottom-[30%] right-[4%] w-[10%]" size={56} />
      <Tape className="right-[-2%] top-[2%] h-10 w-32 rotate-[38deg]" />
      {mems.map((m, i) => (
        <button key={m.id} tabIndex={-1} onClick={() => onOpen(m.id)}
          className="polaroid anim-rise absolute w-[38.5%] transition duration-300 hover:z-30 hover:-translate-y-1"
          style={{ left: spots[i].left, top: spots[i].top, transform: `rotate(${spots[i].rot}deg)`, animationDelay: `${150 + i * 120}ms` }}>
          <Img media={coverOf(m)} className="aspect-[5/6] w-full" eager />
          <span className="block pt-1.5 text-center font-hand text-[17px] leading-none text-[rgb(var(--frame-ink))]">{handDate(m.date)}</span>
        </button>
      ))}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" viewBox={`0 0 ${W} ${H}`}>
        <path d={d} fill="none" stroke="rgb(0 0 0 / .18)" strokeWidth="3" transform="translate(2 4)" />
        <path d={d} fill="none" stroke="rgb(var(--string))" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {pts.map((p, i) => <Pin key={i} style={{ left: `calc(${(p.x / W) * 100}% - 11px)`, top: `calc(${(p.y / H) * 100}% - 11px)` }} />)}
      <span className="absolute bottom-[8%] right-[2%] rotate-[-4deg] font-hand text-[20px] leading-tight text-ink/80">together<br />since {since} ♡</span>
    </div>
  );
}
