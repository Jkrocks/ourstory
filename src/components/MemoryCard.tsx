import type { Memory } from '../lib/types';
import { useStore } from '../lib/store';
import { coverOf, fmtDate, typeOf, ago, toneOf } from '../lib/utils';
import { Faces, HeartButton, Icon, Img, LikeButton } from './ui';
import { Pin, handDate } from './Wander';

export function Counts({ m, className = '' }: { m: Memory; className?: string }) {
  const p = m.media.filter((x) => x.kind === 'photo').length;
  const v = m.media.length - p;
  if (!p && !v) return null;
  return (
    <span className={`inline-flex items-center gap-3 text-[14px] text-muted tnum ${className}`}>
      {p > 0 && <span className="inline-flex items-center gap-1"><Icon name="photos" size={16} />{p}<span className="sr-only"> photos</span></span>}
      {v > 0 && <span className="inline-flex items-center gap-1"><Icon name="video" size={16} />{v}<span className="sr-only"> videos</span></span>}
    </span>
  );
}

export function TypeBadge({ id, className = '' }: { id: string; className?: string }) {
  const { state } = useStore();
  const t = typeOf(state, id);
  return (
    <span className={`tone-${toneOf(id)} inline-flex items-center gap-1.5 rounded-full bg-card/95 py-1 pl-1 pr-3 text-[13px] font-bold text-ink shadow-sm ${className}`}>
      <span className="bg-tone grid h-6 w-6 place-items-center rounded-full text-[12px]" aria-hidden>{t.emoji}</span>{t.label}
    </span>
  );
}

/** The big card used on the timeline: a print with the story beside it. */
export function MemoryCard({ m, index = 0 }: { m: Memory; index?: number }) {
  const { dispatch, openMemory } = useStore();
  const cover = coverOf(m);
  const hasVideo = m.media.some((x) => x.kind !== 'photo');
  const tilt = ['-rotate-[0.6deg]', 'rotate-[0.5deg]', 'rotate-0', '-rotate-[0.3deg]'][index % 4];
  const people = m.people;
  return (
    <article
      className="anim-rise group relative"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => openMemory(m.id)}
        className="block w-full rounded-[18px] bg-card p-3 text-left shadow-print transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-4"
        aria-label={`${m.title}, ${fmtDate(m.date)}`}
      >
        {cover ? (
          <div className={`relative overflow-hidden rounded-[10px] ${tilt} transition-transform duration-500 group-hover:rotate-0`}>
            <Img media={cover} className="aspect-[4/3] w-full" alt="" />
            <TypeBadge id={m.type} className="absolute left-3 top-3" />
            {hasVideo && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[rgb(20_14_10/.6)] px-3 py-1.5 text-[13px] font-semibold text-white">
                <Icon name="play" size={14} fill /> Video
              </span>
            )}
          </div>
        ) : (
          <div className="relative rounded-[10px] bg-sand px-6 pb-8 pt-14">
            <TypeBadge id={m.type} className="absolute left-3 top-3" />
            <p className="font-hand text-[22px] leading-snug text-ink/80">“{(m.story ?? m.title).slice(0, 140)}{(m.story?.length ?? 0) > 140 ? '…' : ''}”</p>
          </div>
        )}
        <div className="px-1 pb-1 pt-4">
          <p className="text-[14px] font-medium text-muted">
            <time dateTime={m.date}>{fmtDate(m.date)}</time>
            <span aria-hidden> · </span>{ago(m.date)}
          </p>
          <h3 className="mt-1 pr-10 font-display text-[23px] leading-tight">{m.title}</h3>
          {m.story && cover && <p className="mt-2 line-clamp-2 text-[16px] text-ink/80">{m.story}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Faces ids={people} size={30} />
            {m.place && (
              <span className="inline-flex items-center gap-1 text-[14px] text-muted">
                <Icon name="place" size={16} />{m.place}
              </span>
            )}
            <Counts m={m} className="ml-auto" />
            <LikeButton memoryId={m.id} />
          </div>
        </div>
      </button>
      <HeartButton
        on={!!m.favorite}
        onToggle={() => dispatch({ t: 'fav', id: m.id })}
        className="absolute right-5 top-5 h-11 w-11 bg-card/90 shadow-sm backdrop-blur hover:bg-card sm:right-7 sm:top-7"
      />
    </article>
  );
}

/** A pinned polaroid with a handwritten date. */
export function Polaroid({ m, rotate = 0, size = 'md', note }: { m: Memory; rotate?: number; size?: 'sm' | 'md' | 'lg'; note?: string }) {
  const { openMemory } = useStore();
  const cover = coverOf(m);
  const w = size === 'sm' ? 'w-[150px]' : size === 'lg' ? 'w-full' : 'w-[200px]';
  return (
    <button
      type="button"
      onClick={() => openMemory(m.id)}
      className={`polaroid group relative mt-3 shrink-0 text-left transition duration-300 hover:-translate-y-1 ${w}`}
      style={{ transform: `rotate(${rotate * 1.6}deg)` }}
      aria-label={`${m.title}, ${fmtDate(m.date)}`}
    >
      <Pin className="-top-2 left-1/2 -translate-x-1/2" />
      {cover ? (
        <Img media={cover} className="aspect-[4/5] w-full" />
      ) : (
        <span className="grid aspect-[4/5] w-full place-items-center bg-sand p-4 text-center font-hand text-[18px] text-[rgb(var(--frame-ink))]">{m.story?.slice(0, 70) ?? m.title}</span>
      )}
      <p className="mt-2 line-clamp-1 px-1 text-center font-hand text-[18px] leading-tight text-[rgb(var(--frame-ink))]">{note ?? m.title}</p>
      <p className="px-1 text-center font-hand text-[15px] leading-tight text-[rgb(var(--frame-ink)/.6)]">{handDate(m.date)}{size !== 'lg' ? `, ${m.date.slice(0, 4)}` : ''}</p>
    </button>
  );
}
