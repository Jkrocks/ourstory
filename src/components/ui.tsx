import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Media, Person } from '../lib/types';
import { mediaUrl, mediaUrlSync } from '../lib/media';
import { useStore } from '../lib/store';
import { useLikes } from '../lib/likes';

/* ---------- icons ---------- */
const P: Record<string, ReactNode> = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7.5 8 6 8-6" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.6C3.6 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  timeline: <><path d="M6 3v18" /><circle cx="6" cy="7" r="2" /><circle cx="6" cy="16" r="2" /><path d="M10 7h10M10 16h7" /></>,
  photos: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 5.5 4.8" /></>,
  place: <><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  heart: <path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  play: <path d="M7 4.5v15l12-7.5z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  pen: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  share: <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
  tree: <><circle cx="12" cy="4.5" r="2" /><circle cx="5" cy="19.5" r="2" /><circle cx="12" cy="19.5" r="2" /><circle cx="19" cy="19.5" r="2" /><path d="M12 6.5v6M5 17.5V14h14v3.5M12 12.5v5" /></>,
  filter: <path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
};

export function Icon({ name, size = 22, className = '', fill = false, stroke = 1.8 }: { name: keyof typeof P | string; size?: number; className?: string; fill?: boolean; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

/* ---------- media ---------- */
export function useSrc(src?: string) {
  const [url, setUrl] = useState<string | undefined>(() => mediaUrlSync(src));
  useEffect(() => {
    const now = mediaUrlSync(src);
    setUrl(now);
    if (now || !src) return;
    let live = true;
    mediaUrl(src).then((u) => live && setUrl(u));
    return () => { live = false; };
  }, [src]);
  return url;
}

export function Img({ media, className = '', alt = '', cover = true, eager = false }: { media?: Media; className?: string; alt?: string; cover?: boolean; eager?: boolean }) {
  const url = useSrc(media?.src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!media) return <div className={`bg-sand ${className}`} />;
  if (media.src.startsWith('gd:') && failed) {
    return (
      <div className={`grid place-items-center bg-sand p-3 text-center text-[13px] leading-snug text-muted ${className}`} role="img" aria-label={alt || 'Google Drive file'}>
        <span><b className="block text-ink">Can’t show this Drive file</b>In Google Drive set it to “Anyone with the link”.</span>
      </div>
    );
  }
  if (media.kind === 'youtube' && failed) {
    return (
      <div className={`tone-coral relative grid place-items-center overflow-hidden bg-[linear-gradient(135deg,rgb(var(--heart)),rgb(var(--peach))_60%,rgb(var(--honey)))] text-white ${className}`} role="img" aria-label={alt || 'YouTube video'}>
        <span className="flex flex-col items-center gap-1 font-bold"><span className="grid h-12 w-16 place-items-center rounded-[14px] bg-white/95 text-[rgb(var(--heart))]"><Icon name="play" size={22} fill /></span><span className="text-[13px] tracking-[.08em]">YOUTUBE</span></span>
      </div>
    );
  }
  const isUploadedVideo = media.kind === 'video' && !media.src.startsWith('scene:') && !media.src.startsWith('gd:');
  if (isUploadedVideo) {
    return <video src={url ? url + '#t=0.5' : undefined} muted playsInline preload="metadata" className={`${cover ? 'object-cover' : 'object-contain'} bg-sand ${className}`} aria-label={alt} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${cover ? 'object-cover' : 'object-contain'} bg-sand transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}

/* ---------- people ---------- */
export function Avatar({ person, size = 40, ring = false }: { person?: Person; size?: number; ring?: boolean }) {
  const url = useSrc(person?.photo);
  if (!person) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${ring ? 'ring-2 ring-card' : ''}`}
      style={{ width: size, height: size, background: person.tint, color: '#2a2724', fontSize: size * 0.42 }}
      title={person.name}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : person.name.slice(0, 1)}
    </span>
  );
}

export function Faces({ ids, size = 28, max = 4 }: { ids: string[]; size?: number; max?: number }) {
  const { state } = useStore();
  const list = ids.map((id) => state.people.find((p) => p.id === id)).filter(Boolean) as Person[];
  if (!list.length) return null;
  const extra = list.length - max;
  return (
    <span className="flex items-center" aria-label={`With ${list.map((p) => p.name).join(', ')}`}>
      {list.slice(0, max).map((p, i) => (
        <span key={p.id} style={{ marginLeft: i ? -size * 0.28 : 0 }}>
          <Avatar person={p} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span className="ml-1 text-sm text-muted tnum">+{extra}</span>
      )}
    </span>
  );
}

/* ---------- controls ---------- */
export function HeartButton({ on, onToggle, className = '', size = 22, label = 'Favourite' }: { on: boolean; onToggle: () => void; className?: string; size?: number; label?: string }) {
  const [bump, setBump] = useState(0);
  const { canEdit } = useStore();
  if (!canEdit) {
    return on ? <span className={`grid place-items-center rounded-full text-honey ${className}`} aria-label="Family favourite" title="Family favourite"><Icon name="star" size={size} fill /></span> : null;
  }
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove from favourites` : label}
      onClick={(e) => { e.stopPropagation(); setBump((b) => b + 1); onToggle(); }}
      className={`grid place-items-center rounded-full transition-colors ${on ? 'text-honey' : ''} ${className}`}
      title={on ? 'Favourite' : 'Mark as favourite'}
    >
      <span key={bump} className={bump ? 'anim-pop' : ''}>
        <Icon name="star" size={size} fill={on} />
      </span>
    </button>
  );
}

export function Chip({ active, onClick, children, className = '' }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium transition-colors ${
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink hover:border-muted/60'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', type = 'button', disabled, ...rest }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'soft' | 'ghost' | 'danger'; className?: string; type?: 'button' | 'submit'; disabled?: boolean; 'aria-label'?: string;
}) {
  const v = {
    primary: 'bg-ink text-paper hover:opacity-90 shadow-print',
    soft: 'bg-sand text-ink hover:bg-line',
    ghost: 'text-ink hover:bg-sand',
    danger: 'bg-heart text-white hover:opacity-90',
  }[variant];
  return (
    <button type={type} disabled={disabled} onClick={onClick} {...rest} className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[16px] font-semibold transition disabled:opacity-40 ${v} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- overlays ---------- */
export function Sheet({ onClose, children, label, wide = false, full = false }: { onClose: () => void; children: ReactNode; label: string; wide?: boolean; full?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const t = setTimeout(() => {
      const f = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current;
      f?.focus();
    }, 30);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      clearTimeout(t);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="anim-fade absolute inset-0 bg-[rgb(20_14_10/.45)] backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={`anim-sheet relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-card shadow-lift outline-none sm:rounded-[28px] ${
          full ? 'sm:max-w-5xl' : wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ title, onClose, sub }: { title: string; onClose: () => void; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <h2 className="font-display text-[26px] leading-tight">{title}</h2>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand hover:bg-line">
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div
      key={toastMsg.id}
      role="status"
      className="pointer-events-none fixed left-1/2 z-[70] whitespace-nowrap rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper shadow-lift"
      style={{ bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))', animation: 'toast 3.2s ease both' }}
    >
      {toastMsg.msg}
    </div>
  );
}

export function Empty({ title, body, action = true }: { title: string; body: string; action?: boolean }) {
  const { openAdd, canEdit } = useStore();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="print tape relative mb-8 w-40 rotate-[-4deg]">
        <div className="grid aspect-square place-items-center rounded-[3px] bg-sand text-muted">
          <Icon name="heart" size={34} />
        </div>
        <p className="mt-2 text-center font-hand text-[15px] text-muted">first page</p>
      </div>
      <h2 className="font-display text-[28px] leading-tight">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-muted">{body}</p>
      {action && canEdit && (
        <Btn className="mt-6" onClick={() => openAdd('menu')}>
          <Icon name="plus" size={20} /> Add Memory
        </Btn>
      )}
    </div>
  );
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="font-display text-[26px] leading-tight sm:text-[30px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function LinkBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-2 font-semibold text-ink underline-offset-4 hover:underline">
      {children} <Icon name="next" size={18} />
    </button>
  );
}

/** ♥ Like with a count. Family members invited as Contributors can like; everyone sees the count. */
export function LikeButton({ memoryId, className = '', big = false }: { memoryId: string; className?: string; big?: boolean }) {
  const likes = useLikes();
  const { toast } = useStore();
  const [bump, setBump] = useState(0);
  if (!likes.enabled) return null;
  const n = likes.count(memoryId);
  const on = likes.mine(memoryId);
  const pad = big ? 'min-h-[44px] px-4 text-[15px]' : 'min-h-[34px] px-3 text-[13px]';
  if (!likes.canLike) {
    return n ? (
      <span className={`tone-pink bg-tone-soft inline-flex items-center gap-1.5 rounded-full font-bold text-heart tnum ${pad} ${className}`} aria-label={`${n} ${n === 1 ? 'like' : 'likes'}`}>
        <Icon name="heart" size={big ? 18 : 15} fill /> {n}
      </span>
    ) : null;
  }
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Unlike. ${n} ${n === 1 ? 'like' : 'likes'}` : `Like. ${n} ${n === 1 ? 'like' : 'likes'}`}
      onClick={async (e) => {
        e.stopPropagation();
        setBump((b) => b + 1);
        const r = await likes.toggle(memoryId);
        if (r === 'denied') toast('Only family members invited to the album can like.');
        if (r === 'error') toast('Couldn’t save your like. Try again.');
      }}
      className={`tone-pink inline-flex items-center gap-1.5 rounded-full font-bold tnum transition ${on ? 'bg-tone' : 'bg-tone-soft text-heart hover:opacity-90'} ${pad} ${className}`}
    >
      <span key={bump} className={bump ? 'anim-pop' : ''}><Icon name="heart" size={big ? 18 : 15} fill={on} /></span>
      {n > 0 ? n : 'Like'}
    </button>
  );
}
