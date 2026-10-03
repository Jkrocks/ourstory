import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { addInvite, familyMembers, listInvites, newInviteCode, removeInvite, removeMember, setPassword, setPublicLink, shareUrl, siteUrl, type MemberRow } from '../lib/cloud';
import { useStore } from '../lib/store';
import type { Memory, Privacy, Theme } from '../lib/types';
import { byDateDesc, coverOf, fmtDate, parts, stats, toneAt, uid, yearsTogether } from '../lib/utils';
import { shrinkImage, videoRatio } from '../lib/storage';
import { mediaMode, uploadMedia } from '../lib/media';
import { Avatar, Btn, Empty, Icon, Img } from '../components/ui';
import { MemoryCard } from '../components/MemoryCard';
import { Masonry } from './Memories';

/* ---------------- Drive album ---------------- */
// The family's shared Google Drive folder, shown as it is. Needs "Anyone with the link" sharing.
export const DRIVE_FOLDER = ((import.meta.env.VITE_DRIVE_FOLDER as string | undefined) ?? '').trim();

export function DriveAlbum() {
  if (!DRIVE_FOLDER) return <Empty title="No Drive folder yet" body="A shared Google Drive folder will show here once it is connected." action={false} />;
  const open = `https://drive.google.com/drive/folders/${DRIVE_FOLDER}`;
  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Google Drive</p>
          <h1 className="font-display text-[40px] leading-tight">Drive album</h1>
          <p className="text-muted">Everything in the family folder. Drop new photos into the folder and they appear here.</p>
        </div>
        <a href={open} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-card px-5 font-semibold hover:bg-sand"><Icon name="folder" size={20} /> Open in Drive</a>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-print">
        <iframe title="Family Google Drive folder" src={`https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER}#grid`} loading="lazy" referrerPolicy="no-referrer" className="block h-[78vh] min-h-[480px] w-full" />
      </div>
      <p className="mt-3 text-[14px] text-muted">Empty or asking to sign in? Set the folder to “Anyone with the link · Viewer” in Google Drive.</p>
    </div>
  );
}

/* ---------------- Places ---------------- */
export function Places() {
  const { state, route, go } = useStore();
  const sel = route.name === 'places' ? route.place : undefined;
  const places = useMemo(() => {
    const map = new Map<string, Memory[]>();
    [...state.memories].sort(byDateDesc).forEach((m) => m.place && map.set(m.place, [...(map.get(m.place) ?? []), m]));
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [state.memories]);

  if (!places.length) return <Empty title="Where have you been?" body="Add a place to any memory, even just “Home”, and it will show up here." />;

  if (sel) {
    const list = places.find(([p]) => p === sel)?.[1] ?? [];
    const years = [...new Set(list.map((m) => parts(m.date).y))].sort();
    return (
      <div className="pb-10 pt-4 sm:pt-8">
        <button onClick={() => go({ name: 'places' })} className="mb-4 inline-flex min-h-[44px] items-center gap-1 rounded-full pr-4 font-semibold hover:bg-sand"><Icon name="back" /> All places</button>
        <p className="eyebrow">📍 Place</p>
        <h1 className="font-display text-[44px] leading-tight sm:text-[56px]">{sel}</h1>
        <p className="mb-10 font-hand text-[20px] text-muted">{list.length} {list.length === 1 ? 'memory' : 'memories'}{years.length ? `, ${years[0] === years[years.length - 1] ? `in ${years[0]}` : `from ${years[0]} to ${years[years.length - 1]}`}` : ''}</p>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((m, i) => <li key={m.id}><MemoryCard m={m} index={i} /></li>)}</ul>
      </div>
    );
  }

  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <header className="mb-10">
        <p className="eyebrow">Places</p>
        <h1 className="font-display text-[40px] leading-tight sm:text-[52px]">Where we’ve been</h1>
        <p className="mt-1 font-hand text-[20px] text-muted">{places.length} places full of memories</p>
      </header>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {places.map(([p, list], i) => {
          const ys = list.map((m) => parts(m.date).y);
          const lo = Math.min(...ys), hi = Math.max(...ys);
          return (
            <li key={p} className="anim-rise" style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}>
              <button onClick={() => go({ name: 'places', place: p })} className="group flex w-full items-center gap-4 rounded-[22px] bg-card p-3 text-left shadow-print transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="relative h-24 w-24 shrink-0">
                  {list.slice(0, 2).reverse().map((m, k, arr) => (
                    <span key={m.id} className="print absolute inset-0 !p-1" style={{ transform: `rotate(${k === arr.length - 1 ? -3 : 5}deg)` }}>
                      <Img media={coverOf(m)} className="h-full w-full rounded-[2px]" />
                    </span>
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[22px] leading-tight">{p}</span>
                  <span className="block text-[15px] text-muted">{list.length} {list.length === 1 ? 'memory' : 'memories'} · {lo === hi ? lo : `${lo}–${hi}`}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Favourites ---------------- */
export function Favorites() {
  const { state } = useStore();
  const mems = [...state.memories].filter((m) => m.favorite).sort(byDateDesc);
  const photos = state.memories.flatMap((m) => m.media.filter((x) => x.favorite).map((x) => ({ m, x })));
  if (!mems.length && !photos.length) return <Empty title="Favourite Memories" body={'Tap the ★ on any memory or photo.\nYour most special moments will gather here.'} action={false} />;
  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <header className="mb-10">
        <p className="eyebrow">★ Favourites</p>
        <h1 className="font-display text-[40px] leading-tight sm:text-[52px]">Favourite Memories</h1>
        <p className="mt-1 font-hand text-[20px] text-muted">The ones we’d save first.</p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{mems.map((m, i) => <li key={m.id}><MemoryCard m={m} index={i} /></li>)}</ul>
      {photos.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-[28px]">Favourite photos</h2>
          <Masonry items={photos} />
        </section>
      )}
    </div>
  );
}

/* ---------------- Family profile & settings ---------------- */
export function Settings() {
  const { state, dispatch, go, toast, setShare, canEdit, published } = useStore();
  const f = state.family;
  const s = stats(state.memories);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(f.name);
  const [since, setSince] = useState(f.since);
  const [intro, setIntro] = useState(f.intro);
  const [importing, setImporting] = useState(0);
  const [newType, setNewType] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const importRef = useRef<HTMLInputElement>(null);
  const years = [...new Set(state.memories.map((m) => parts(m.date).y))].sort((a, b) => b - a);
  const cover = state.memories.filter((m) => m.favorite && coverOf(m)).sort(byDateDesc)[0] ?? state.memories.find((m) => coverOf(m));

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    const byDay = new Map<string, File[]>();
    [...files].forEach((file) => {
      const d = new Date(file.lastModified || Date.now());
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay.set(iso, [...(byDay.get(iso) ?? []), file]);
    });
    setImporting(files.length);
    for (const [date, list] of byDay) {
      const media = [];
      for (const file of list) {
        const id = uid();
        if (file.type.startsWith('video')) {
          if (mediaMode() === 'inline') continue;
          media.push({ id, kind: 'video' as const, src: await uploadMedia(file, 'video'), ratio: await videoRatio(file) });
        } else if (file.type.startsWith('image')) {
          const { blob, ratio } = await shrinkImage(file, mediaMode() === 'inline' ? 1400 : 1800);
          media.push({ id, kind: 'photo' as const, src: await uploadMedia(blob, 'photo'), ratio });
        }
      }
      if (media.length) dispatch({ t: 'memory', m: { id: uid(), title: `Photos from ${fmtDate(date, 'day')}`, date, type: 'photo', people: [], tags: ['imported'], media, createdAt: Date.now() } });
    }
    setImporting(0);
    toast(`${files.length} files added to ${byDay.size} memories. Your story keeps growing.`);
  }

  const field = 'w-full rounded-[14px] border border-line bg-paper px-4 py-3 text-[17px] focus:border-ink focus:outline-none';

  return (
    <div className="pb-10 pt-4 sm:pt-8">
      {/* Family profile */}
      <section className="relative mb-14 overflow-hidden rounded-[28px] bg-card shadow-print">
        {cover && <div className="h-40 sm:h-56"><Img media={coverOf(cover)} className="h-full w-full" eager /></div>}
        <div className="relative px-6 pb-8 sm:px-10">
          <div className="-mt-10 mb-4 flex flex-wrap items-end gap-2">
            {state.people.slice(0, 7).map((p) => <span key={p.id} className="-mr-4"><Avatar person={p} size={64} ring /></span>)}
          </div>
          {!editing ? (
            <>
              <h1 className="font-display text-[40px] leading-tight sm:text-[48px]">The {f.name} family ❤️</h1>
              <p className="mt-1 font-hand text-[21px] text-muted">Together since {parts(f.since).y} · {yearsTogether(f.since)} years</p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {[[state.people.length, 'family members'], [s.memories, 'memories'], [s.photos, 'photos'], [s.videos, 'videos']].map(([n, l]) => (
                  <div key={l as string}><dt className="sr-only">{l}</dt><dd><span className="font-display text-[30px] tnum">{(n as number).toLocaleString('en-IN')}</span> <span className="text-muted">{l}</span></dd></div>
                ))}
              </dl>
              <div className="mt-8 max-w-2xl">
                <p className="eyebrow mb-2">Our story</p>
                <p className="font-hand text-[21px] leading-relaxed">{f.intro || 'Write a few lines about your family: how it started, what you love doing together.'}</p>
              </div>
              {canEdit && <Btn variant="soft" className="mt-6" onClick={() => setEditing(true)}><Icon name="edit" size={18} /> Edit profile</Btn>}
            </>
          ) : (
            <form className="max-w-2xl space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); dispatch({ t: 'family', f: { name: name.trim() || 'Our', since, intro } }); setEditing(false); toast('Family profile saved'); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="f-name" className="mb-2 block font-semibold">Family name</label><input id="f-name" value={name} onChange={(e) => setName(e.target.value)} className={field} /></div>
                <div><label htmlFor="f-since" className="mb-2 block font-semibold">Together since</label><input id="f-since" type="date" value={since} onChange={(e) => setSince(e.target.value)} className={field} /></div>
              </div>
              <div><label htmlFor="f-intro" className="mb-2 block font-semibold">Our story</label><textarea id="f-intro" rows={4} value={intro} onChange={(e) => setIntro(e.target.value)} className={`${field} font-hand text-[20px]`} /></div>
              <div className="flex gap-2"><Btn type="submit">Save</Btn><Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn></div>
            </form>
          )}
        </div>
      </section>

      {/* mobile shortcuts */}
      <nav aria-label="More" className={`mb-14 grid gap-3 lg:hidden ${DRIVE_FOLDER ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {([['people', 'people', 'People'], ['places', 'place', 'Places'], ['favorites', 'star', 'Favourites'], ...(DRIVE_FOLDER ? [['album', 'folder', 'Drive album']] as const : [])] as const).map(([r, ic, l]) => (
          <button key={r} onClick={() => go({ name: r })} className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[20px] bg-card font-semibold shadow-print"><Icon name={ic} />{l}</button>
        ))}
      </nav>

      {canEdit && <div className="grid gap-10 lg:grid-cols-2">
        {!published && <SettingBlock title="Privacy" sub="Your album is private by default. No public feed, no followers, no likes.">
          {([
            ['private', 'Private', 'Only you can see it', 'lock'],
            ['family', 'Family only', 'People you invite can see and add', 'people'],
            ['link', 'Shared link', 'Anyone with a private link can view', 'link'],
          ] as [Privacy, string, string, string][]).map(([v, t, d, ic]) => (
            <label key={v} className={`flex min-h-[64px] cursor-pointer items-center gap-4 rounded-[16px] border px-4 ${f.privacy === v ? 'border-ink bg-card' : 'border-line'}`}>
              <input id={`priv-${v}`} type="radio" name="privacy" checked={f.privacy === v} onChange={() => dispatch({ t: 'family', f: { privacy: v } })} className="h-5 w-5 accent-[rgb(var(--ink))]" />
              <Icon name={ic} className="text-muted" />
              <span><span className="block font-semibold">{t}</span><span className="block text-[14px] text-muted">{d}</span></span>
            </label>
          ))}
          {years.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[15px] text-muted">Share a whole year:</span>
              {years.slice(0, 4).map((y) => <button key={y} onClick={() => setShare({ kind: 'year', year: y })} className="min-h-[40px] rounded-full bg-sand px-4 font-semibold tnum">{y}</button>)}
            </div>
          )}
        </SettingBlock>}

        <SettingBlock title="Add many photos at once" sub="Pick photos and videos from your phone, camera roll or an album you downloaded. We’ll sort them into memories by date.">
          <Btn onClick={() => importRef.current?.click()} disabled={importing > 0}><Icon name="upload" size={20} /> {importing ? `Adding ${importing} files…` : 'Choose photos & videos'}</Btn>
          <input ref={importRef} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => importFiles(e.target.files)} />
          <p className="text-[14px] text-muted">From Google Photos: open an album, choose Download all, then pick the files here.</p>
        </SettingBlock>

        <SettingBlock title="Appearance" sub="OurStory is light by default. Switch to dark if you prefer it; it only changes on this device.">
          <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-full bg-sand p-1">
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button key={t} role="radio" aria-checked={(f.theme === 'dark' ? 'dark' : 'light') === t} onClick={() => dispatch({ t: 'family', f: { theme: t } })}
                className={`min-h-[44px] rounded-full px-5 font-semibold capitalize ${(f.theme === 'dark' ? 'dark' : 'light') === t ? 'bg-card shadow-sm' : 'text-muted'}`}>{t}</button>
            ))}
          </div>
        </SettingBlock>

        <SettingBlock title="Milestone types" sub="Add your own kinds of moments, like “Lost first tooth”.">
          <div className="flex flex-wrap gap-2">
            {state.types.filter((t) => t.milestone).map((t) => <span key={t.id} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-card px-3 text-[14px] font-medium shadow-sm">{t.emoji} {t.label}</span>)}
          </div>
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (!newType.trim()) return; dispatch({ t: 'type', mt: { id: 'custom-' + uid(), label: newType.trim(), emoji: newEmoji || '⭐', milestone: true, custom: true } }); toast(`“${newType.trim()}” added`); setNewType(''); }}>
            <label htmlFor="t-emoji" className="sr-only">Emoji</label>
            <input id="t-emoji" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value.slice(0, 4))} className="min-h-[48px] w-16 rounded-full border border-line bg-paper text-center text-[20px]" />
            <label htmlFor="t-label" className="sr-only">Milestone name</label>
            <input id="t-label" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Lost first tooth" className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-paper px-4 focus:border-ink focus:outline-none" />
            <Btn type="submit" variant="soft">Add</Btn>
          </form>
        </SettingBlock>

        <AccountBlock />

        <div className="tone-marigold bg-tone-soft rounded-[22px] p-6">
          <p className="font-display text-[22px]">Free for every family</p>
          <p className="mt-1 text-ink/80">Memories, photos, videos, stories, people and search are free. No ads, and your photos are never used to sell anything.</p>
        </div>
      </div>}
    </div>
  );
}

function SettingBlock({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[24px] leading-tight">{title}</h2>
      <p className="text-muted">{sub}</p>
      <div className="space-y-3 pt-1">{children}</div>
    </section>
  );
}

function AccountBlock() {
  const auth = useAuth();
  const { state, toast } = useStore();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  useEffect(() => { if (auth.mode === 'cloud') { familyMembers().then(setMembers).catch(() => {}); listInvites().then(setInvites).catch(() => {}); } }, [auth.mode, auth.family?.id]);

  if (auth.mode === 'published') return <PublishBlock />;

  if (auth.mode === 'preview') {
    return (
      <SettingBlock title="Your album" sub={state.demo ? 'You’re exploring the Khalsa family sample album. Changes here aren’t kept.' : 'Preview mode: your album is saved in this browser on this device. When OurStory is live, sign in to keep it in the cloud and share it with family.'}>
        <div className="flex flex-wrap gap-2">
          {state.demo
            ? <Btn onClick={() => auth.enterPreview('fresh')}>Start my own album</Btn>
            : <Btn variant="soft" onClick={() => auth.enterPreview('demo')}>See the sample family</Btn>}
          <Btn variant="ghost" onClick={() => auth.signOut()}>Sign out</Btn>
        </div>
      </SettingBlock>
    );
  }

  const [code, setCode] = useState(auth.family?.invite_code ?? '');
  const isOwner = members.some((x) => x.user_id === auth.user?.id && x.role === 'owner');
  const invite = `Join our family album on OurStory: ${(location.origin + import.meta.env.BASE_URL)}  Sign in, choose “Join with a code” and enter ${code.toUpperCase()}`;
  const copy = () => {
    try { navigator.clipboard.writeText(invite).then(() => toast('Invite copied. Send it on WhatsApp or email.'), () => toast('Select the code and copy it')); }
    catch { toast('Select the code and copy it'); }
  };
  return (
    <>
      <SettingBlock title="People who can add" sub="Add someone’s email. When they sign in on the OurStory page with that email, they land in this same album and can add photos, videos and YouTube links.">
        {isOwner && (
          <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const em = email.trim().toLowerCase();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('That doesn’t look like an email address.'); return; }
            try { await addInvite(em); setInvites((l) => (l.includes(em) ? l : [...l, em])); setEmail(''); toast(`${em} added. Send them the page link.`); }
            catch { toast('Couldn’t add that email. Try again.'); }
          }}>
            <label htmlFor="inv-email" className="sr-only">Email address</label>
            <input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" autoComplete="off"
              className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-card px-4 focus:border-ink focus:outline-none" />
            <Btn type="submit"><Icon name="plus" size={18} /> Add</Btn>
          </form>
        )}
        <ul className="space-y-2">
          {members.map((m, i) => (
            <li key={m.user_id} className={`tone-${toneAt(i)} flex min-h-[52px] items-center gap-3 rounded-[16px] bg-card px-3 py-2`}>
              <span className="bg-tone grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold">{(m.display_name ?? m.email ?? '?').slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m.display_name ?? 'Family member'}{m.role === 'owner' ? ' · owner' : ''}</span>
                {m.email && <span className="block truncate text-[13px] text-muted">{m.email}</span>}
              </span>
              {isOwner && m.role !== 'owner' && (
                <button className="min-h-[40px] px-2 text-[13px] font-bold text-heart underline underline-offset-4" onClick={async () => {
                  try { await removeMember(m.user_id); setMembers((l) => l.filter((x) => x.user_id !== m.user_id)); toast('Removed. They can no longer see or add.'); }
                  catch { toast('Couldn’t remove them. Try again.'); }
                }}>Remove</button>
              )}
            </li>
          ))}
          {invites.map((em) => (
            <li key={em} className="flex min-h-[52px] items-center gap-3 rounded-[16px] border border-dashed border-line px-3 py-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-[14px] font-bold">{em.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{em}</span><span className="block text-[13px] text-muted">Added · waiting for them to sign in</span></span>
              {isOwner && (
                <button className="min-h-[40px] px-2 text-[13px] font-bold text-muted underline underline-offset-4" onClick={async () => {
                  try { await removeInvite(em); setInvites((l) => l.filter((x) => x !== em)); } catch { toast('Couldn’t remove. Try again.'); }
                }}>Remove</button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] bg-sand p-3">
          <span className="min-w-0 flex-1 truncate text-[14px]"><b>Page link to send them:</b> {siteUrl()}</span>
          <Btn variant="soft" onClick={() => {
            const msg = `Join our family album on OurStory: ${siteUrl()}  Sign in with your email and you’re in.`;
            try { navigator.clipboard.writeText(msg).then(() => toast('Message copied. Paste it in WhatsApp or email.'), () => toast('Select the link and copy it')); } catch { toast('Select the link and copy it'); }
          }}><Icon name="link" size={18} /> Copy message</Btn>
        </div>
        <details className="text-[14px] text-muted">
          <summary className="min-h-[36px] cursor-pointer font-bold">Or use a family code</summary>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="select-all font-display text-[24px] tracking-[.12em] text-ink">{code.toUpperCase()}</span>
            <button className="font-bold underline underline-offset-4" onClick={copy}>Copy invite</button>
            {isOwner && (
              <button className="font-bold underline underline-offset-4" onClick={async () => {
                try { const c = await newInviteCode(); setCode(c); toast('New code made. The old one no longer works.'); }
                catch { toast('Couldn’t change the code. Try again.'); }
              }}>New code</button>
            )}
          </div>
        </details>
      </SettingBlock>
      {isOwner && <PublicLinkBlock />}
      <SettingBlock title="Account" sub={`Signed in as ${auth.user?.email ?? auth.user?.name}.`}>
        <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) { toast('Use at least 8 characters.'); return; }
          try { await setPassword(pw); setPw(''); toast('Password saved. Next time, sign in with it. No email needed.'); }
          catch { toast('Couldn’t save the password. Try again.'); }
        }}>
          <label htmlFor="acc-pw" className="sr-only">New password</label>
          <input id="acc-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Set a password (8+ characters)"
            className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-card px-4 focus:border-ink focus:outline-none" />
          <Btn type="submit" variant="soft">Save password</Btn>
        </form>
        <p className="text-[14px] text-muted">With a password you can sign in on any device without waiting for an email.</p>
        <Btn variant="soft" onClick={() => auth.signOut()}>Sign out</Btn>
      </SettingBlock>
    </>
  );
}

function PublishBlock() {
  const { state, dispatch, dirty, publish, publishing, bytes, limit, toast } = useStore();
  const [confirm, setConfirm] = useState(false);
  const pct = Math.min(100, Math.round((bytes / limit) * 100));
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  return (
    <SettingBlock title="Publishing" sub="You’re the owner. Add and edit memories here, then press Publish. Anyone you share the link with sees the published album, read-only.">
      <div className="tone-pink bg-tone-soft space-y-4 rounded-[20px] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`tone-${dirty ? 'marigold' : 'leaf'} bg-tone rounded-full px-3 py-1 text-[13px] font-bold`}>{dirty ? 'Unpublished changes' : 'Everything published'}</span>
          <Btn className="ml-auto" onClick={publish} disabled={!dirty || publishing}>{publishing ? 'Publishing…' : 'Publish'}</Btn>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[13px] text-muted tnum"><span>Album size</span><span>{mb(bytes)} of {mb(limit)} MB</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-card" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Album size">
            <div className={`h-full rounded-full ${pct > 90 ? 'bg-heart' : pct > 70 ? 'bg-honey' : 'bg-sage'}`} style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-muted">Photos are shrunk before they’re added (about 150–300 KB each), so roughly 60–90 photos fit. Add videos as YouTube links: they take no space.</p>
        </div>
      </div>
      {state.memories.some((m) => /^m\d+$/.test(m.id)) && (
        !confirm ? (
          <Btn variant="soft" onClick={() => setConfirm(true)}>Remove the sample memories</Btn>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-heart/10 p-4">
            <p className="mr-auto">Remove all sample memories? Your family members and your own memories stay.</p>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>Keep them</Btn>
            <Btn variant="danger" onClick={() => {
              dispatch({ t: 'replace', s: { ...state, demo: false, memories: state.memories.filter((m) => !/^m\d+$/.test(m.id)) } });
              setConfirm(false);
              toast('Sample memories removed. Your story starts here ❤️');
            }}>Remove</Btn>
          </div>
        )
      )}
    </SettingBlock>
  );
}

function PublicLinkBlock() {
  const auth = useAuth();
  const { toast } = useStore();
  const [on, setOn] = useState(!!auth.family?.public_enabled);
  const [slug, setSlug] = useState(auth.family?.public_slug ?? '');
  const [busy, setBusy] = useState(false);
  const url = slug ? shareUrl(slug) : '';
  const run = async (next: boolean, fresh = false) => {
    setBusy(true);
    try {
      const s = await setPublicLink(next, fresh);
      setSlug(s); setOn(next);
      toast(fresh ? 'New link made. The old one no longer works.' : next ? 'Public link is on. Anyone with it can view your timeline.' : 'Public link is off.');
    } catch { toast('Couldn’t change the link. Try again.'); }
    setBusy(false);
  };
  const copy = () => {
    try { navigator.clipboard.writeText(url).then(() => toast('Link copied'), () => toast('Select the link and copy it')); }
    catch { toast('Select the link and copy it'); }
  };
  return (
    <SettingBlock title="Public timeline link" sub="Share your timeline with anyone, no sign-in needed. They can look, not change anything. Turn it off any time.">
      <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-line px-4">
        <span><span className="block font-semibold">{on ? 'Link is on' : 'Link is off'}</span><span className="block text-[14px] text-muted">{on ? 'Anyone with the link can view' : 'Only signed-in family can view'}</span></span>
        <input id="pub-on" type="checkbox" disabled={busy} checked={on} onChange={(e) => run(e.target.checked)} className="h-6 w-6 accent-[rgb(var(--string))]" />
      </label>
      {on && (
        <>
          <div className="flex gap-2">
            <label htmlFor="pub-url" className="sr-only">Public link</label>
            <input id="pub-url" readOnly value={url} onFocus={(e) => e.target.select()} className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-card px-4 text-[14px] text-muted" />
            <Btn onClick={copy}><Icon name="link" size={18} /> Copy</Btn>
          </div>
          <button disabled={busy} onClick={() => run(true, true)} className="min-h-[40px] text-[14px] font-bold text-muted underline underline-offset-4">Make a new link (old one stops working)</button>
        </>
      )}
    </SettingBlock>
  );
}
