import { useMemo, useRef, useState, useEffect } from 'react';
import type { Media, Memory } from '../lib/types';
import { useStore, removeBlobs, type AddKind } from '../lib/store';
import { shrinkImage, videoRatio } from '../lib/storage';
import { driveId, isDriveFolder, mediaMode, uploadMedia, ytId } from '../lib/media';
import { connectDrive, driveUploadReady, prepareDrive } from '../lib/drive';
import { fmtDate, today, uid } from '../lib/utils';
import { Avatar, Btn, Icon, Img, Sheet, SheetHeader } from './ui';

const OPTIONS: { kind: AddKind; emoji: string; label: string; hint: string; bg: string }[] = [
  { kind: 'photo', emoji: '📸', label: 'Photo', hint: 'Take or choose photos', bg: 'tone-sky bg-tone-soft' },
  { kind: 'video', emoji: '🎥', label: 'Video', hint: 'Upload a clip or a YouTube link', bg: 'tone-coral bg-tone-soft' },
  { kind: 'story', emoji: '✍️', label: 'Story', hint: 'Write what happened', bg: 'tone-lilac bg-tone-soft' },
  { kind: 'milestone', emoji: '❤️', label: 'Milestone', hint: 'A first, a big day', bg: 'tone-pink bg-tone-soft' },
  { kind: 'date', emoji: '📅', label: 'Important Date', hint: 'Remember it every year', bg: 'tone-marigold bg-tone-soft' },
];

export function AddMenu() {
  const { openAdd } = useStore();
  const close = () => openAdd(null);
  return (
    <Sheet onClose={close} label="Add a memory">
      <SheetHeader title="Add a memory" sub="What do you want to remember?" onClose={close} />
      <div className="grid grid-cols-2 gap-3 overflow-y-auto px-6 pb-6 pt-3">
        {OPTIONS.map((o, i) => (
          <button
            key={o.kind}
            data-autofocus={i === 0 ? true : undefined}
            onClick={() => openAdd({ kind: o.kind })}
            className={`anim-rise flex min-h-[120px] flex-col items-start justify-between rounded-[20px] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-print ${o.bg} ${i === 4 ? 'col-span-2 min-h-[88px] flex-row items-center gap-4' : ''}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-card text-[30px] leading-none shadow-sm" aria-hidden>{o.emoji}</span>
            <span className={i === 4 ? 'mr-auto' : ''}>
              <span className="block text-[18px] font-semibold">{o.label}</span>
              <span className="block text-[14px] text-muted">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

const PROMPTS = ['What happened?', 'Why was this special?', 'Who was there?', 'What made us laugh?'];

interface Pending { key: string; file: File; url: string; kind: 'photo' | 'video' }

export function AddMemoryForm({ kind, edit, files }: { kind: AddKind; edit?: Memory; files?: File[] }) {
  const { state, dispatch, openAdd, toast, openMemory } = useStore();
  const close = () => openAdd(null);
  const isEdit = !!edit;
  const milestones = state.types.filter((t) => t.milestone);

  const [title, setTitle] = useState(edit?.title ?? '');
  const [date, setDate] = useState(edit?.date ?? today());
  const [story, setStory] = useState(edit?.story ?? '');
  const [people, setPeople] = useState<string[]>(edit?.people ?? []);
  const [place, setPlace] = useState(edit?.place ?? '');
  const [type, setType] = useState(edit?.type ?? (kind === 'photo' ? 'photo' : kind === 'story' ? 'story' : kind === 'date' ? 'date' : kind === 'milestone' ? milestones[0]?.id ?? 'steps' : 'everyday'));
  const [yearly, setYearly] = useState(edit?.yearly ?? kind === 'date');
  const [tags, setTags] = useState((edit?.tags ?? []).join(', '));
  const [keep, setKeep] = useState<Media[]>(edit?.media ?? []);
  const [pending, setPending] = useState<Pending[]>(() =>
    (files ?? []).map((f) => ({ key: uid(), file: f, url: URL.createObjectURL(f), kind: f.type.startsWith('video') ? 'video' : 'photo' })),
  );
  const [more, setMore] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState('');
  const [yt, setYt] = useState('');
  const [ytErr, setYtErr] = useState('');
  const inline = mediaMode() === 'inline';
  const toDrive = mediaMode() === 'cloud';
  const canPick = !toDrive || driveUploadReady();
  useEffect(() => { if (toDrive) prepareDrive(); }, [toDrive]);
  const camRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const places = useMemo(() => [...new Set(state.memories.map((m) => m.place).filter(Boolean) as string[])].sort(), [state.memories]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...list]
      .filter((f) => f.type.startsWith('image') || (!inline && f.type.startsWith('video')))
      .map((f) => ({ key: uid(), file: f, url: URL.createObjectURL(f), kind: (f.type.startsWith('video') ? 'video' : 'photo') as 'photo' | 'video' }));
    setPending((p) => [...p, ...next]);
    // use the photo's own date when it's the first thing added
    if (!isEdit && !pending.length && list[0]?.lastModified) {
      const d = new Date(list[0].lastModified);
      if (d.getFullYear() > 1990) setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  };

  const heading = isEdit ? 'Edit memory' : { photo: 'New photo memory', video: 'New video memory', story: 'Write a story', milestone: 'A new milestone', date: 'An important date' }[kind];

  const [gd, setGd] = useState('');
  const [gdErr, setGdErr] = useState('');
  const addDrive = (as: 'photo' | 'video') => {
    if (isDriveFolder(gd)) { setGdErr('That’s a folder link. Open the photo or video in Drive, then Share → Copy link, and paste that one.'); return; }
    const id = driveId(gd);
    if (!id) { setGdErr('That doesn’t look like a Google Drive file link. In Drive: open the file → Share → Copy link.'); return; }
    setKeep((k) => [...k, { id: uid(), kind: as, src: `gd:${id}`, ratio: as === 'video' ? 16 / 9 : 4 / 3 }]);
    setGd(''); setGdErr('');
  };

  const addYouTube = () => {
    const id = ytId(yt);
    if (!id) { setYtErr('That doesn’t look like a YouTube link. Copy it from the Share button on YouTube.'); return; }
    setKeep((k) => [...k, { id: uid(), kind: 'youtube', src: `yt:${id}`, ratio: 16 / 9 }]);
    setYt(''); setYtErr('');
  };

  async function save() {
    setSaving(true);
    const media: Media[] = [...keep];
    const pendingYt = ytId(yt);
    if (pendingYt) media.push({ id: uid(), kind: 'youtube', src: `yt:${pendingYt}`, ratio: 16 / 9 });
    try {
      // Ask Google first, while this is still a button press, so the pop-up isn't blocked.
      if (toDrive && pending.length) await connectDrive();
      for (const p of pending) {
        const id = uid();
        if (p.kind === 'photo') {
          const { blob, ratio } = await shrinkImage(p.file, inline ? 1400 : 1800);
          media.push({ id, kind: 'photo', src: await uploadMedia(blob, 'photo'), ratio });
        } else {
          const ratio = await videoRatio(p.file);
          media.push({ id, kind: 'video', src: await uploadMedia(p.file, 'video'), ratio });
        }
      }
    } catch {
      setSaving(false);
      toast(toDrive ? 'Couldn’t save to Google Drive. Allow the Google pop-up, then try Save again.' : 'A photo or video didn’t upload. Check your connection and try Save again.');
      return;
    }
    if (edit) removeBlobs(edit.media.filter((x) => !keep.includes(x)));
    const t = state.types.find((x) => x.id === type);
    const fallbackTitle = t && !['everyday', 'photo', 'story'].includes(t.id) ? t.label : `A day to remember`;
    const m: Memory = {
      id: edit?.id ?? uid(),
      title: title.trim() || fallbackTitle,
      date: date || today(),
      type,
      story: story.trim() || undefined,
      people,
      place: place.trim() || undefined,
      tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
      media,
      favorite: edit?.favorite,
      yearly,
      collections: edit?.collections,
      createdAt: edit?.createdAt ?? Date.now(),
    };
    dispatch({ t: 'memory', m });
    close();
    toast(isEdit ? 'Memory updated' : 'Another beautiful memory saved ❤️');
    if (!isEdit) setTimeout(() => openMemory(m.id), 250);
  }

  const toggle = (id: string) => setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const insertPrompt = (q: string) => setStory((s) => (s ? s.replace(/\s*$/, '\n\n') : '') + q + ' ');
  const showMedia = true;
  const field = 'w-full rounded-[14px] border border-line bg-paper px-4 py-3 text-[17px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none';

  return (
    <Sheet onClose={close} label={heading} wide>
      <SheetHeader title={heading} onClose={close} sub="Only the title matters. Everything else is optional." />
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => { e.preventDefault(); if (!saving) save(); }}
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-3">
          {kind === 'milestone' && !isEdit && (
            <fieldset>
              <legend className="mb-2 font-semibold">Which milestone?</legend>
              <div className="flex flex-wrap gap-2">
                {milestones.map((t) => (
                  <button type="button" key={t.id} onClick={() => { setType(t.id); if (!title) setTitle(''); }} aria-pressed={type === t.id}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[15px] font-medium ${type === t.id ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'}`}>
                    <span aria-hidden>{t.emoji}</span>{t.label}
                  </button>
                ))}
                <span className="inline-flex items-center gap-2">
                  <input id="new-milestone" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Your own…" className="min-h-[44px] w-36 rounded-full border border-dashed border-line bg-paper px-4 text-[15px] focus:border-ink focus:outline-none" />
                  {newType.trim() && (
                    <button type="button" className="min-h-[44px] rounded-full bg-sand px-4 text-[15px] font-semibold" onClick={() => {
                      const id = 'custom-' + uid();
                      dispatch({ t: 'type', mt: { id, label: newType.trim(), emoji: '⭐', milestone: true, custom: true } });
                      setType(id); setNewType('');
                    }}>Add</button>
                  )}
                </span>
              </div>
            </fieldset>
          )}

          {showMedia && (
            <div>
              <p className="mb-2 font-semibold">{kind === 'video' ? 'Video' : 'Photos & videos'}</p>
              {(keep.length > 0 || pending.length > 0) && (
                <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {keep.map((x) => (
                    <li key={x.id} className="relative">
                      <Img media={x} className="aspect-square w-full rounded-[12px]" />
                      {x.kind !== 'photo' && <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[rgb(20_14_10/.6)] text-white"><Icon name="play" size={12} fill /></span>}
                      <button type="button" aria-label="Remove" onClick={() => setKeep((k) => k.filter((y) => y !== x))} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-card/95 shadow"><Icon name="close" size={16} /></button>
                    </li>
                  ))}
                  {pending.map((p) => (
                    <li key={p.key} className="anim-fade relative">
                      {p.kind === 'photo'
                        ? <img src={p.url} alt="" className="aspect-square w-full rounded-[12px] object-cover" />
                        : <video src={p.url} muted playsInline className="aspect-square w-full rounded-[12px] bg-sand object-cover" />}
                      <button type="button" aria-label="Remove" onClick={() => setPending((l) => l.filter((y) => y !== p))} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-card/95 shadow"><Icon name="close" size={16} /></button>
                    </li>
                  ))}
                </ul>
              )}
              {toDrive && <p className="mb-2 text-[14px] text-muted">{canPick ? 'Photos and videos you pick are saved in your own Google Drive, in a folder called OurStory.' : 'Photos and videos are kept in Google Drive. Paste a Drive link below, or a YouTube link for videos.'}</p>}
              <div className={`flex flex-wrap gap-2 ${canPick ? '' : 'hidden'}`}>
                {kind !== 'video' && (
                  <>
                    <Btn variant="soft" onClick={() => camRef.current?.click()}><Icon name="camera" size={20} /> Take photo</Btn>
                    <Btn variant="soft" onClick={() => pickRef.current?.click()}><Icon name="photos" size={20} /> Choose photos</Btn>
                  </>
                )}
                {!inline && <Btn variant="soft" onClick={() => vidRef.current?.click()}><Icon name="video" size={20} /> {kind === 'video' ? 'Choose video' : 'Add video'}</Btn>}
              </div>
              <div className="mt-4">
                <label htmlFor="m-yt" className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><span className="grid h-6 w-8 place-items-center rounded-[7px] bg-heart text-white"><Icon name="play" size={12} fill /></span> YouTube link</label>
                <div className="flex gap-2">
                  <input id="m-yt" value={yt} onChange={(e) => { setYt(e.target.value); setYtErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYouTube(); } }}
                    inputMode="url" placeholder="https://youtu.be/…" className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[16px] focus:border-heart focus:outline-none" />
                  <Btn variant="soft" onClick={addYouTube} disabled={!yt.trim()}>Add</Btn>
                </div>
                {ytErr && <p className="mt-1 text-[14px] text-heart" role="alert">{ytErr}</p>}
                <p className="mt-1 text-[13px] text-muted">{inline ? 'Upload your video to YouTube (unlisted is fine) and paste the link here. Video files are too big to keep in a shared page.' : 'Long videos stay on YouTube and play here. Unlisted videos work too.'}</p>
              </div>
              <div className="mt-4">
                <label htmlFor="m-gd" className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><span className="grid h-6 w-8 place-items-center rounded-[7px] bg-sage text-white"><Icon name="folder" size={13} /></span> Google Drive link</label>
                <div className="flex flex-wrap gap-2">
                  <input id="m-gd" value={gd} onChange={(e) => { setGd(e.target.value); setGdErr(''); }} inputMode="url" placeholder="https://drive.google.com/file/d/…"
                    className="min-h-[48px] min-w-[200px] flex-1 rounded-full border border-line bg-paper px-4 text-[16px] focus:border-string focus:outline-none" />
                  <Btn variant="soft" onClick={() => addDrive('photo')} disabled={!gd.trim()}>Add photo</Btn>
                  <Btn variant="soft" onClick={() => addDrive('video')} disabled={!gd.trim()}>Add video</Btn>
                </div>
                {gdErr && <p className="mt-1 text-[14px] text-heart" role="alert">{gdErr}</p>}
                <p className="mt-1 text-[13px] text-muted">The file stays in your own Google Drive. Share it as “Anyone with the link can view” so it can show here.</p>
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addFiles(e.target.files)} />
              <input ref={pickRef} type="file" accept={inline ? 'image/*' : 'image/*,video/*'} multiple hidden onChange={(e) => addFiles(e.target.files)} />
              <input ref={vidRef} type="file" accept="video/*" hidden onChange={(e) => addFiles(e.target.files)} />
            </div>
          )}

          <div>
            <label htmlFor="m-title" className="mb-2 block font-semibold">Title</label>
            <input id="m-title" data-autofocus={kind !== 'photo' && kind !== 'video' ? true : undefined} value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} font-display text-[20px]`}
              placeholder={kind === 'date' ? 'Our wedding anniversary' : kind === 'milestone' ? 'Shivansh’s first steps' : kind === 'story' ? 'The day it rained all afternoon' : 'Sunday at the park'} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="m-date" className="mb-2 block font-semibold">Date</label>
              <input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              {date && <p className="mt-1 text-[14px] text-muted">{fmtDate(date)}</p>}
            </div>
            <div>
              <label htmlFor="m-place" className="mb-2 block font-semibold">Place <span className="font-normal text-muted">(optional)</span></label>
              <input id="m-place" list="places" value={place} onChange={(e) => setPlace(e.target.value)} className={field} placeholder="Home, Goa, Dubai…" />
              <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
          </div>

          {kind === 'date' && (
            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 rounded-[14px] bg-sand px-4">
              <span><span className="block font-semibold">Remind us every year</span><span className="block text-[14px] text-muted">It will show up in “On this day”</span></span>
              <input id="m-yearly" type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} className="h-6 w-6 accent-[rgb(var(--ink))]" />
            </label>
          )}

          <div>
            <label htmlFor="m-story" className="mb-2 block font-semibold">{kind === 'story' ? 'Your story' : 'The story'} <span className="font-normal text-muted">(optional)</span></label>
            <div className="mb-2 flex flex-wrap gap-2">
              {PROMPTS.map((q) => (
                <button type="button" key={q} onClick={() => insertPrompt(q)} className="min-h-[36px] rounded-full bg-honey/25 px-3 text-[14px] font-medium hover:bg-honey/40">{q}</button>
              ))}
            </div>
            <textarea id="m-story" value={story} onChange={(e) => setStory(e.target.value)} rows={kind === 'story' ? 8 : 4}
              className={`${field} resize-y bg-[repeating-linear-gradient(transparent,transparent_31px,rgb(var(--line))_31px,rgb(var(--line))_32px)] font-hand text-[20px] leading-[32px]`}
              placeholder="Today we went to the beach with the kids…" />
          </div>

          {state.people.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-semibold">Who was there?</legend>
              <div className="flex flex-wrap gap-2">
                {state.people.map((p) => {
                  const on = people.includes(p.id);
                  return (
                    <button type="button" key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                      className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[15px] font-medium transition ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'}`}>
                      <Avatar person={p} size={36} />{p.name}
                      {on && <Icon name="check" size={16} />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!more ? (
            <button type="button" onClick={() => setMore(true)} className="min-h-[44px] font-semibold text-muted underline underline-offset-4">More options</button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="m-type" className="mb-2 block font-semibold">Kind of memory</label>
                <select id="m-type" value={type} onChange={(e) => setType(e.target.value)} className={field}>
                  {state.types.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="m-tags" className="mb-2 block font-semibold">Tags</label>
                <input id="m-tags" value={tags} onChange={(e) => setTags(e.target.value)} className={field} placeholder="beach, cousins" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line bg-card px-6 py-4">
          <Btn variant="ghost" onClick={close}>Cancel</Btn>
          <Btn type="submit" disabled={saving} className="min-w-[150px]">
            {saving ? 'Saving…' : <><Icon name="check" size={20} /> {isEdit ? 'Save changes' : 'Save memory'}</>}
          </Btn>
        </div>
      </form>
    </Sheet>
  );
}

export function AddRoot() {
  const { add } = useStore();
  if (!add) return null;
  if (add === 'menu') return <AddMenu />;
  return <AddMemoryForm key={add.edit?.id ?? add.kind} kind={add.kind} edit={add.edit} files={add.files} />;
}
