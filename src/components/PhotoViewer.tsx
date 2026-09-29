import { useEffect, useRef, useState } from 'react';
import { useStore, removeBlobs } from '../lib/store';
import { fmtDate } from '../lib/utils';
import { Avatar, HeartButton, Icon, Img, useSrc } from './ui';
import { mediaMode, ytEmbed, ytWatch } from '../lib/media';
import type { Media } from '../lib/types';

function DemoClip({ media }: { media: Media }) {
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0);
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[10px] bg-black">
      <div className="overflow-hidden">
        <div key={run} className={playing ? 'kenburns' : ''} style={{ animationPlayState: playing ? 'running' : 'paused' }}>
          <Img media={media} className="aspect-video w-full" eager />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <button onClick={() => setPlaying((p) => !p)} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 hover:bg-white/25" aria-label={playing ? 'Pause' : 'Play'}>
          <Icon name={playing ? 'pause' : 'play'} size={18} fill />
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded bg-white/25">
          <div key={run} className="h-full origin-left bg-white" style={{ animation: 'progress 9s linear both', animationPlayState: playing ? 'running' : 'paused' }} onAnimationEnd={() => setPlaying(false)} />
        </div>
        <button onClick={() => { setRun((r) => r + 1); setPlaying(true); }} className="text-[13px] font-semibold opacity-80 hover:opacity-100">Replay</button>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[12px]">Sample clip</span>
      </div>
    </div>
  );
}

function YouTube({ media }: { media: Media }) {
  const id = media.src.slice(3);
  if (mediaMode() === 'inline') {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Img media={media} className="aspect-video w-full rounded-[12px]" eager />
        <a href={ytWatch(id)} target="_blank" rel="noopener noreferrer" className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-[16px] font-bold text-[rgb(14_11_9)] hover:opacity-90">
          <Icon name="play" size={16} fill /> Watch on YouTube
        </a>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative aspect-video w-full overflow-hidden rounded-[12px] bg-black">
        <iframe src={ytEmbed(id)} title="YouTube video" className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      </div>
      <a href={ytWatch(id)} target="_blank" rel="noopener noreferrer" className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/20">
        <Icon name="play" size={14} fill /> Open on YouTube
      </a>
    </div>
  );
}

function RealVideo({ media }: { media: Media }) {
  const url = useSrc(media.src);
  return <video src={url} controls autoPlay playsInline className="mx-auto max-h-[78vh] w-auto max-w-full rounded-[10px] bg-black" />;
}

export function PhotoViewer() {
  const { state, viewer, openViewer, dispatch, toast, canEdit } = useStore();
  const [panel, setPanel] = useState<null | 'caption' | 'people' | 'move' | 'delete'>(null);
  const [caption, setCaption] = useState('');
  const touch = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const list = viewer?.list ?? (viewer ? [{ memoryId: viewer.memoryId, mediaId: viewer.mediaId }] : []);
  const idx = viewer ? Math.max(0, list.findIndex((x) => x.mediaId === viewer.mediaId)) : 0;
  const cur = list[idx];
  const mem = cur && state.memories.find((m) => m.id === cur.memoryId);
  const media = mem?.media.find((x) => x.id === cur.mediaId);

  const step = (d: number) => {
    if (!viewer || list.length < 2) return;
    const n = list[(idx + d + list.length) % list.length];
    openViewer({ ...viewer, memoryId: n.memoryId, mediaId: n.mediaId });
  };

  useEffect(() => {
    setPanel(null);
    setCaption(media?.caption ?? '');
  }, [media?.id]); // eslint-disable-line

  useEffect(() => {
    if (!viewer) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Escape') openViewer(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  if (!viewer || !mem || !media) return null;
  const close = () => openViewer(null);
  const patch = (p: Partial<Media>) => dispatch({ t: 'media', memoryId: mem.id, mediaId: media.id, patch: p });
  const tagged = media.people ?? mem.people;
  const isDemoVideo = media.kind === 'video' && media.src.startsWith('scene:');

  const fullscreen = () => {
    const el = stage.current as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
    try {
      const p = el?.requestFullscreen?.();
      if (p && 'catch' in p) p.catch(() => toast('Full screen isn’t available here'));
    } catch { toast('Full screen isn’t available here'); }
  };

  return (
    <div className="anim-fade fixed inset-0 z-[60] flex flex-col bg-[rgb(14_11_9)] text-white" role="dialog" aria-modal="true" aria-label="Photo viewer" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close viewer"><Icon name="close" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{mem.title}</p>
          <p className="text-[13px] text-white/60 tnum">{fmtDate(mem.date)} · {idx + 1} of {list.length}</p>
        </div>
        <button onClick={fullscreen} className="hidden h-11 w-11 place-items-center rounded-full hover:bg-white/10 sm:grid" aria-label="Full screen"><Icon name="photos" /></button>
      </div>

      <div
        ref={stage}
        className="relative flex min-h-0 flex-1 items-center justify-center bg-[rgb(14_11_9)] px-2 sm:px-16"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div key={media.id} className="anim-fade flex max-h-full w-full items-center justify-center">
          {media.kind === 'youtube' ? <YouTube media={media} /> : media.kind === 'video' ? (isDemoVideo ? <DemoClip media={media} /> : <RealVideo media={media} />) : (
            <Img media={media} cover={false} eager className="max-h-[74vh] w-auto max-w-full rounded-[6px] !bg-transparent" alt={media.caption ?? mem.title} />
          )}
        </div>
        {list.length > 1 && (
          <>
            <button onClick={() => step(-1)} className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid" aria-label="Previous"><Icon name="back" /></button>
            <button onClick={() => step(1)} className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid" aria-label="Next"><Icon name="next" /></button>
          </>
        )}
      </div>

      <div className="px-4 pb-3 pt-2">
        {media.caption && panel !== 'caption' && <p className="mb-2 text-center font-hand text-[19px] text-white/90">{media.caption}</p>}

        {panel === 'caption' && (
          <form className="mx-auto mb-3 flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); patch({ caption: caption.trim() || undefined }); setPanel(null); toast('Caption saved'); }}>
            <label htmlFor="v-caption" className="sr-only">Caption</label>
            <input id="v-caption" autoFocus value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" className="min-h-[48px] flex-1 rounded-full bg-white/10 px-5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40" />
            <button className="min-h-[48px] rounded-full bg-white px-5 font-semibold text-[rgb(14_11_9)]">Save</button>
          </form>
        )}
        {panel === 'people' && (
          <div className="mx-auto mb-3 flex max-w-2xl flex-wrap justify-center gap-2">
            {state.people.map((p) => {
              const on = tagged.includes(p.id);
              return (
                <button key={p.id} aria-pressed={on} onClick={() => patch({ people: on ? tagged.filter((x) => x !== p.id) : [...tagged, p.id] })}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-1 pr-4 text-[14px] font-medium ${on ? 'bg-white text-[rgb(14_11_9)]' : 'bg-white/10'}`}>
                  <Avatar person={p} size={32} />{p.name}
                </button>
              );
            })}
          </div>
        )}
        {panel === 'move' && (
          <div className="mx-auto mb-3 max-w-xl">
            <label htmlFor="v-move" className="mb-1 block text-center text-[14px] text-white/70">Move this {media.kind} to another memory</label>
            <select id="v-move" defaultValue="" onChange={(e) => {
              if (!e.target.value) return;
              dispatch({ t: 'moveMedia', from: mem.id, to: e.target.value, mediaId: media.id });
              const target = state.memories.find((m) => m.id === e.target.value);
              openViewer({ memoryId: e.target.value, mediaId: media.id });
              toast(`Moved to “${target?.title}”`);
            }} className="min-h-[48px] w-full rounded-full bg-white/10 px-5 text-white">
              <option value="">Choose a memory…</option>
              {[...state.memories].filter((m) => m.id !== mem.id).sort((a, b) => (a.date < b.date ? 1 : -1)).map((m) => <option key={m.id} value={m.id} className="text-black">{fmtDate(m.date, 'short')} — {m.title}</option>)}
            </select>
          </div>
        )}
        {panel === 'delete' && (
          <div className="mx-auto mb-3 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-[18px] bg-white/10 p-3">
            <p className="font-medium">Delete this {media.kind} from “{mem.title}”?</p>
            <button onClick={() => setPanel(null)} className="min-h-[44px] rounded-full px-4 font-semibold hover:bg-white/10">Keep</button>
            <button onClick={() => {
              removeBlobs([media]);
              dispatch({ t: 'deleteMedia', memoryId: mem.id, mediaId: media.id });
              if (list.length > 1) step(1); else close();
              toast('Deleted');
            }} className="min-h-[44px] rounded-full bg-heart px-4 font-semibold text-white">Delete</button>
          </div>
        )}

        {canEdit && <div className="mx-auto flex max-w-xl items-center justify-around">
          <Tool label="Favourite"><HeartButton on={!!media.favorite} onToggle={() => patch({ favorite: !media.favorite })} className="h-12 w-12 hover:bg-white/10" size={24} /></Tool>
          <Tool label="Caption"><button onClick={() => setPanel(panel === 'caption' ? null : 'caption')} className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" aria-label="Edit caption"><Icon name="pen" /></button></Tool>
          <Tool label="People"><button onClick={() => setPanel(panel === 'people' ? null : 'people')} className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" aria-label="Tag people"><Icon name="people" /></button></Tool>
          <Tool label="Move"><button onClick={() => setPanel(panel === 'move' ? null : 'move')} className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" aria-label="Add to another memory"><Icon name="folder" /></button></Tool>
          <Tool label="Delete"><button onClick={() => setPanel(panel === 'delete' ? null : 'delete')} className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" aria-label="Delete"><Icon name="trash" /></button></Tool>
        </div>}
      </div>
    </div>
  );
}

function Tool({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <span className="text-[12px] text-white/60" aria-hidden>{label}</span>
    </div>
  );
}
