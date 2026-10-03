import type { Memory } from '../lib/types';
import { coverOf, parts } from '../lib/utils';
import { Img } from './ui';

/** Where each photo sits on the ribbon, as % of a 1672×941 stage. */
const SPOTS = [
  { x: 7.5, y: 30.5, w: 11.5, rot: -6, label: { x: 5, y: 9 } },
  { x: 20.5, y: 36.5, w: 12, rot: 14, label: { x: 20, y: 15 } },
  { x: 32.5, y: 48.5, w: 12, rot: 24, label: { x: 34, y: 25.5 } },
  { x: 45, y: 62.5, w: 11.5, rot: 27, label: { x: 35.5, y: 71 } },
  { x: 58, y: 72, w: 12, rot: 10, label: { x: 52.5, y: 82 } },
  { x: 72.5, y: 73, w: 11.5, rot: -8, label: { x: 71, y: 83 } },
  { x: 90.5, y: 67.5, w: 17, rot: -12, label: { x: 86, y: 42 } },
];

const firstLine = (m: Memory) => {
  const s = (m.story ?? '').split(/(?<=[.!?])\s/)[0] ?? '';
  return s.length > 46 ? s.slice(0, 44).replace(/\s\S*$/, '') + '…' : s;
};

/** Pick up to seven moments that tell the whole story: the big ones, oldest to newest, ending on the latest. */
export function pickMoments(mems: Memory[], isMilestone: (m: Memory) => boolean): Memory[] {
  const asc = [...mems].filter((m) => coverOf(m)).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (asc.length <= 7) return asc;
  const last = asc[asc.length - 1];
  const big = asc.filter((m) => m !== last && (isMilestone(m) || m.favorite));
  const pool = big.length >= 6 ? big : asc.slice(0, -1);
  const out: Memory[] = [];
  for (let i = 0; i < 6; i++) out.push(pool[Math.round((i * (pool.length - 1)) / 5)]);
  return [...new Set(out), last];
}

function Label({ m }: { m: Memory }) {
  const line = firstLine(m);
  return (
    <div className="relative pl-[1.2cqw]">
      <span className="absolute left-0 top-[.5cqw] h-[calc(100%+1.6cqw)] w-px bg-string/60" aria-hidden />
      <span className="absolute -left-[3px] top-[1.7cqw] h-[7px] w-[7px] rounded-full bg-string" aria-hidden />
      <p className="text-[clamp(11px,.9cqw,15px)] font-bold tracking-[.04em] text-string tnum">{parts(m.date).y}</p>
      <p className="mt-[.2cqw] line-clamp-2 font-display text-[clamp(15px,1.4cqw,23px)] font-medium leading-[1.12] text-ink">{m.title}</p>
      {line && <p className="mt-[.35cqw] line-clamp-2 text-[clamp(11px,.92cqw,14px)] leading-snug text-muted">{line}</p>}
    </div>
  );
}

const Doodles = () => (
  <g fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".85">
    {/* spark */}
    <path d="M222 222l8-10M230 232l10-4M224 238l10 4" />
    <path d="M482 290l10-6M486 300l10 0M482 310l10 4" />
    {/* heart */}
    <path d="M690 440c-12-9-18-17-18-25 0-7 5-11 10-10 4 1 6 4 8 8 2-4 5-7 9-7 6 0 10 5 8 12-2 8-9 14-17 22z" />
    {/* sun */}
    <circle cx="1328" cy="590" r="11" /><path d="M1328 568v-6M1328 618v-6M1306 590h-6M1356 590h-6M1312 574l-4-4M1348 610l-4-4M1344 574l4-4M1308 610l4-4" />
    {/* paper plane */}
    <path d="M1608 386l38-14-14 34-8-14z M1624 392l22-20" /><path d="M1612 412c-8 10-6 22 2 30" strokeDasharray="4 6" />
  </g>
);

export function StoryRibbon({ moments, onOpen, title }: { moments: Memory[]; onOpen: (id: string) => void; title: React.ReactNode }) {
  const n = moments.length;
  // spread fewer photos evenly along the same ribbon, always ending on the big last spot
  const spots = moments.map((_, i) => (n === 1 ? SPOTS[6] : SPOTS[i === n - 1 ? 6 : Math.round((i * 5) / Math.max(1, n - 2 || 1))]));

  return (
    <>
      {/* Desktop: the ribbon */}
      <div className="relative left-1/2 hidden aspect-[1672/941] w-[min(100vw-40px,1560px)] -translate-x-1/2 [container-type:inline-size] lg:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1672 941" aria-hidden="true">
          <path d="M0 302 C 90 288, 210 300, 340 345 S 580 480, 760 600 S 1010 722, 1190 698 S 1520 640, 1672 488"
            fill="none" stroke="rgb(var(--string))" strokeWidth="2.2" strokeLinecap="round" opacity=".65" />
          <Doodles />
        </svg>
        <div className="absolute right-[5%] top-[9%] w-[44%] text-center">{title}</div>
        {moments.map((m, i) => {
          const s = spots[i];
          return (
            <div key={m.id}>
              <div className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, zIndex: i + 1 }}>
                <button onClick={() => onOpen(m.id)} aria-label={`${m.title}, ${parts(m.date).y}`}
                  className="polaroid anim-rise block w-full !p-[5%] transition duration-300 hover:scale-[1.04]" style={{ animationDelay: `${i * 90}ms` }}>
                  <Img media={coverOf(m)} className={`w-full ${i === n - 1 ? 'aspect-[4/3]' : 'aspect-[1/1]'}`} eager />
                </button>
              </div>
              <div className="absolute w-[13.5%]" style={{ left: `${s.label.x}%`, top: `${s.label.y}%`, zIndex: 30 }}>
                <Label m={m} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Phone and tablet: the same story, top to bottom */}
      <div className="lg:hidden">
        <div className="py-6 text-center">{title}</div>
        <ol className="relative mx-auto max-w-md space-y-10 pb-4">
          <span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-string/40" aria-hidden />
          {moments.map((m, i) => (
            <li key={m.id} className={`relative flex items-center gap-4 ${i % 2 ? 'flex-row-reverse text-right' : ''}`}>
              <div className="relative z-[1] w-[46%] shrink-0" style={{ transform: `rotate(${[-5, 6, -3, 7, -6, 4, -4][i % 7]}deg)` }}>
                <button onClick={() => onOpen(m.id)} aria-label={`${m.title}, ${parts(m.date).y}`} className="polaroid anim-rise block w-full !p-1.5">
                  <Img media={coverOf(m)} className="aspect-square w-full" />
                </button>
              </div>
              <div className="relative z-[1] min-w-0 flex-1 bg-paper py-1">
                <p className="text-[14px] font-bold text-string tnum">{parts(m.date).y}</p>
                <p className="font-display text-[20px] leading-tight">{m.title}</p>
                {firstLine(m) && <p className="mt-1 text-[13px] leading-snug text-muted">{firstLine(m)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
