import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import type { Memory } from '../lib/types';
import { useStore } from '../lib/store';
import { coverOf, fmtDate, toneOf, typeOf } from '../lib/utils';
import { Faces, HeartButton, Img, LikeButton } from './ui';

/* ---------- small ink drawings scattered in the margins ---------- */
const DOODLES: Record<string, ReactNode> = {
  curl: (
    <path d="M6 70c10-2 14-30 26-30s6 26-4 26-8-20 6-30 20-6 22 6-4 24-10 20 2-24 18-30 22 0 20 12-6 22-2 30" fill="none" strokeWidth="5.5" strokeLinejoin="round" />
  ),
  hearts: (
    <g fill="currentColor">
      <path d="M30 62c-10-8-18-14-18-22 0-6 5-10 10-9 4 1 6 4 8 7 2-3 5-6 9-6 5 0 9 5 7 11-2 7-9 12-16 19z" />
      <path d="M68 40c-6-5-11-9-11-14 0-4 3-6 6-6 3 0 4 2 5 4 1-2 3-4 6-4 3 0 6 3 4 7-1 4-5 8-10 13z" />
    </g>
  ),
  scribble: (
    <g fill="none" strokeWidth="1.6">
      <ellipse cx="52" cy="52" rx="48" ry="30" transform="rotate(-6 52 52)" />
      <ellipse cx="53" cy="51" rx="46" ry="28" transform="rotate(-2 52 52)" />
    </g>
  ),
  candy: (
    <g fill="none" strokeWidth="9" strokeLinecap="butt">
      <path d="M30 92V40a14 14 0 0 1 28 0v6" strokeDasharray="7 6" />
      <path d="M62 92V56a12 12 0 0 1 24 0v4" strokeDasharray="7 6" />
    </g>
  ),
  star: (
    <path d="M52 10l9 28h30l-24 17 9 29-24-18-24 18 9-29-24-17h30z" fill="none" strokeWidth="3" strokeLinejoin="round" />
  ),
  arrow: (
    <g fill="none" strokeWidth="3">
      <path d="M8 70c20-30 50-40 84-30" />
      <path d="M78 28l14 12-16 8" strokeLinejoin="round" />
    </g>
  ),
  birds: (
    <g>
      <path d="M4 58c18-10 40-14 70-8 12 2 22 8 36 6" strokeWidth="2" fill="none" />
      <path d="M22 50c-2-6 2-12 8-13 4 0 7 3 8 6l5 1-5 2c-1 5-6 8-11 7" fill="currentColor" />
      <path d="M58 48c0-6 4-11 10-11 4 0 6 3 7 6l5 0-5 3c-1 5-5 7-10 7" fill="currentColor" />
      <path d="M30 51l-1 7M34 51l1 7M65 48l-1 8M69 48l1 8" strokeWidth="1.5" />
      <path d="M86 52c4-6 10-8 14-4M92 54c2-5 8-9 12-6M76 56c-2 6-6 10-10 12" strokeWidth="1.6" fill="none" />
    </g>
  ),
  kite: (
    <g>
      <path d="M40 6 62 30 40 58 18 30z" fill="currentColor" />
      <path d="M40 6v52M18 30h44" stroke="rgb(var(--paper))" strokeWidth="1.5" />
      <path d="M40 58c-6 10 8 14 2 24s6 12 0 20" fill="none" strokeWidth="1.6" />
      <path d="M36 70l-6 2 5 3M44 86l6 2-5 3" fill="none" strokeWidth="1.4" />
    </g>
  ),
  palm: (
    <g fill="currentColor">
      <path d="M44 100c2-22 2-44-2-62l4-1c4 18 4 40 2 63z" />
      <path d="M44 38c-8-10-22-14-36-10 10 0 22 4 30 14z" />
      <path d="M44 38c-4-12-2-24 8-34-4 10-4 22-2 32z" />
      <path d="M46 38c10-8 24-10 36-4-10-2-22 0-32 8z" />
      <path d="M44 40c-10-2-22 4-28 16 8-8 18-12 28-12z" />
      <path d="M46 40c10 0 20 8 24 18-6-8-14-12-24-14z" />
    </g>
  ),
  diya: (
    <g>
      <path d="M14 58c6 14 46 14 52 0z" fill="currentColor" />
      <path d="M40 22c7 10 7 18 0 26-7-8-7-16 0-26z" fill="rgb(var(--honey))" stroke="currentColor" strokeWidth="1.4" />
      <path d="M40 40v10" strokeWidth="1.6" />
      <path d="M10 76h60" strokeWidth="1.4" strokeDasharray="2 5" />
    </g>
  ),
  plane: (
    <g>
      <path d="M8 40 78 12 50 70 40 48z" fill="none" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 48 78 12" strokeWidth="1.6" />
      <path d="M6 70c10-4 16 2 24-2s12-10 20-8" fill="none" strokeWidth="1.4" strokeDasharray="3 5" />
    </g>
  ),
  cycle: (
    <g fill="none" strokeWidth="2">
      <circle cx="20" cy="58" r="14" />
      <circle cx="74" cy="58" r="14" />
      <path d="M20 58l18-24h28l8 24M38 34l12 24 16-24M34 26h10M66 34l-4-10h8" strokeLinejoin="round" />
      <path d="M50 58h-2" />
    </g>
  ),
};

export function Doodle({ name, className = '', size = 96 }: { name: keyof typeof DOODLES | string; className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 104 104" width={size} height={size} className={`pointer-events-none text-ink/80 ${className}`} stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      {DOODLES[name]}
    </svg>
  );
}

/* ---------- pinboard parts ---------- */
/** A glossy push-pin. */
export function Pin({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`pointer-events-none absolute z-20 block h-[22px] w-[22px] rounded-full ${className}`} style={{ background: 'radial-gradient(circle at 35% 30%, rgb(255 235 220) 0 12%, rgb(var(--string)) 45%, rgb(var(--string-dark)) 100%)', boxShadow: '2px 4px 5px rgb(0 0 0 / .28)', ...style }} aria-hidden />
  );
}

/** A strip of washi tape. */
export function Tape({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`pointer-events-none absolute z-20 block h-7 w-24 bg-[rgb(var(--tape)/.8)] shadow-sm [clip-path:polygon(2%_8%,98%_0,100%_90%,0_100%)] ${className}`} style={style} aria-hidden />;
}

/* ---------- the string between pins ---------- */
/** Draws purple string from pin to pin, through every [data-anchor] in order. */
export function useWander(container: RefObject<HTMLElement>, deps: unknown[]) {
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [holes, setHoles] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const draw = () => {
      const r = el.getBoundingClientRect();
      setPts([...el.querySelectorAll<HTMLElement>('[data-anchor]')].map((a) => {
        const b = a.getBoundingClientRect();
        return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
      }));
      setHoles([...el.querySelectorAll<HTMLElement>('[data-avoid]')].map((a) => {
        const b = a.getBoundingClientRect();
        return { x: b.left - r.left - 6, y: b.top - r.top - 6, w: b.width + 12, h: b.height + 12 };
      }));
      setBox({ w: r.width, h: r.height });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    const imgs = el.querySelectorAll('img');
    imgs.forEach((i) => i.addEventListener('load', draw));
    return () => { ro.disconnect(); imgs.forEach((i) => i.removeEventListener('load', draw)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  // a string sags a little between two pins
  const d = pts.map((p, i) => {
    if (!i) return `M ${p.x} ${p.y}`;
    const a = pts[i - 1];
    const sag = Math.min(26, Math.hypot(p.x - a.x, p.y - a.y) * 0.04);
    return `Q ${(a.x + p.x) / 2} ${(a.y + p.y) / 2 + sag} ${p.x} ${p.y}`;
  }).join(' ');
  return (
    <svg className="pointer-events-none absolute inset-0 z-10 overflow-visible" width={box.w} height={box.h} aria-hidden="true">
      <defs>
        <mask id="string-mask" maskUnits="userSpaceOnUse" x="-50" y="-50" width={box.w + 100} height={box.h + 100}>
          <rect x="-50" y="-50" width={box.w + 100} height={box.h + 100} fill="white" />
          {holes.map((h, i) => <rect key={i} x={h.x} y={h.y} width={h.w} height={h.h} rx="12" fill="black" />)}
        </mask>
      </defs>
      <g mask="url(#string-mask)">
        <path d={d} fill="none" stroke="rgb(0 0 0 / .18)" strokeWidth="3" strokeLinecap="round" transform="translate(2 4)" />
        <path d={d} fill="none" stroke="rgb(var(--string))" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ---------- a memory pinned to the board ---------- */
const TILTS = [-3, 2.5, -1.5, 3.5, -2.5, 1.5];
const RATIOS = ['aspect-[4/5]', 'aspect-square', 'aspect-[4/5]', 'aspect-[5/4]', 'aspect-[3/4]', 'aspect-square'];

export function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${s}`;
}
export const handDate = (iso: string) => {
  const [y, mo, d] = iso.split('-').map(Number);
  return `${new Date(y, mo - 1, 1).toLocaleString('en-GB', { month: 'long' })} ${ordinal(d)}`;
};

/** A one-line margin note: the first short sentence of the story. */
function noteOf(m: Memory) {
  const first = (m.story ?? '').split(/(?<=[.!?])\s/)[0] ?? '';
  return first.length > 70 ? first.slice(0, 66).replace(/\s\S*$/, '') + '…' : first;
}

export function PathMemory({ m, i, side }: { m: Memory; i: number; side: 'left' | 'right' }) {
  const { state, openMemory, dispatch } = useStore();
  const cover = coverOf(m);
  const t = typeOf(state, m.type);
  const tone = toneOf(m.type);
  const tilt = TILTS[i % TILTS.length];
  const ratio = RATIOS[i % RATIOS.length];
  const note = noteOf(m);
  const tape = i % 4 === 2;
  const right = side === 'right';
  const hasVideo = m.media.some((x) => x.kind !== 'photo');

  return (
    <div className={`tone-${tone} anim-rise relative flex flex-col gap-4 sm:items-center ${right ? 'items-end sm:flex-row-reverse' : 'items-start sm:flex-row'}`}>
      <div className="relative shrink-0" style={{ transform: `rotate(${tilt}deg)` }}>
        <button
          onClick={() => openMemory(m.id)}
          className="polaroid group relative block w-[210px] transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:w-[250px]"
          aria-label={`${m.title}, ${fmtDate(m.date)}`}
        >
          <span className={`relative block overflow-hidden bg-sand ${ratio}`}>
            {cover ? <Img media={cover} className="h-full w-full" /> : (
              <span className="grid h-full w-full place-items-center p-5 text-center font-hand text-[20px] leading-snug text-[rgb(var(--frame-ink))]">{m.story?.slice(0, 90) ?? m.title}</span>
            )}
            {hasVideo && <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] font-bold text-[rgb(var(--frame-ink))]">▶ video</span>}
          </span>
          <span className="block px-1 pt-2 text-center font-hand text-[19px] leading-none text-[rgb(var(--frame-ink))]">{handDate(m.date)}</span>
        </button>
        <Pin className={right ? 'left-3 top-[18%]' : 'right-3 top-[18%]'} />
        <span data-anchor className={`pointer-events-none absolute top-[18%] h-[22px] w-[22px] ${right ? 'left-3' : 'right-3'}`} aria-hidden />
        {tape && <Tape className={right ? '-right-8 -top-2 rotate-[28deg]' : '-left-8 -top-2 -rotate-[28deg]'} />}
        {t.milestone && (
          <span className={`bg-tone absolute -bottom-3 z-20 rounded-full px-3 py-1 text-[12px] font-bold shadow ${right ? '-left-3' : '-right-3'}`} style={{ transform: `rotate(${-tilt * 2}deg)` }}>
            {t.emoji} {t.label}
          </span>
        )}
      </div>

      <div data-avoid className={`relative max-w-[280px] px-1 py-1 ${right ? 'text-right' : 'text-left'}`}>
        <button onClick={() => openMemory(m.id)} className="text-inherit">
          <h3 className="font-display text-[20px] leading-tight sm:text-[22px]">{m.title}</h3>
        </button>
        {note && <p className="mt-2 font-hand text-[21px] leading-[1.25] text-ink/80">{note}</p>}
        <div className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted ${right ? 'justify-end' : ''}`}>
          <Faces ids={m.people} size={26} />
          {m.place && <span>📍 {m.place}</span>}
          <HeartButton on={!!m.favorite} onToggle={() => dispatch({ t: 'fav', id: m.id })} className="h-9 w-9 hover:bg-sand" size={18} />
          <LikeButton memoryId={m.id} />
        </div>
      </div>
    </div>
  );
}
