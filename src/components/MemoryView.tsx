import { useEffect, useState } from 'react';
import { useStore, removeBlobs } from '../lib/store';
import { ago, ageOn, fmtDate, typeOf } from '../lib/utils';
import { Avatar, Btn, HeartButton, Icon, Img, LikeButton } from './ui';

export function MemoryView() {
  const { state, memoryId, openMemory, dispatch, openViewer, openAdd, setShare, go, toast, canEdit, published } = useStore();
  const m = state.memories.find((x) => x.id === memoryId);
  const [confirm, setConfirm] = useState(false);
  const [collections, setCollections] = useState(false);

  useEffect(() => {
    setConfirm(false);
    setCollections(false);
    if (!memoryId) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && openMemory(null);
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [memoryId, openMemory]);

  if (!m) return null;
  const t = typeOf(state, m.type);
  const people = m.people.map((id) => state.people.find((p) => p.id === id)).filter(Boolean) as typeof state.people;
  const kids = people.filter((p) => p.generation === 2 && p.birthday && p.birthday <= m.date);
  const ages = kids.map((k) => ({ name: k.name, age: ageOn(k.birthday, m.date)! }));
  const [hero, ...rest] = m.media;
  const close = () => openMemory(null);
  const list = m.media.map((x) => ({ memoryId: m.id, mediaId: x.id }));

  return (
    <div className="anim-fade paper-bg fixed inset-0 z-40 overflow-y-auto" role="dialog" aria-modal="true" aria-label={m.title}>
      <div className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <button onClick={close} className="inline-flex min-h-[44px] items-center gap-1 rounded-full pl-2 pr-4 font-semibold hover:bg-sand" aria-label="Back">
            <Icon name="back" size={22} /> Back
          </button>
          <div className="ml-auto flex items-center gap-1">
            <HeartButton on={!!m.favorite} onToggle={() => { dispatch({ t: 'fav', id: m.id }); if (!m.favorite) toast('Added to Favourite Memories ★'); }} className="h-11 w-11 hover:bg-sand" size={24} />
            {!published && <button onClick={() => setShare({ kind: 'memory', id: m.id })} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Share this memory"><Icon name="share" /></button>}
            {canEdit && <>
            <button onClick={() => openAdd({ kind: 'photo', edit: m })} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Edit memory"><Icon name="edit" /></button>
            <button onClick={() => setConfirm(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Delete memory"><Icon name="trash" /></button>
            </>}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="anim-rise flex flex-wrap items-center gap-3 rounded-[18px] bg-heart/10 p-4">
            <p className="mr-auto font-medium">Delete “{m.title}” and its {m.media.length} photos and videos? This can’t be undone.</p>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>Keep it</Btn>
            <Btn variant="danger" onClick={() => { removeBlobs(m.media); dispatch({ t: 'deleteMemory', id: m.id }); close(); toast('Memory deleted'); }}>Delete</Btn>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          <div className="min-w-0 space-y-3">
            {hero ? (
              <button onClick={() => openViewer({ memoryId: m.id, mediaId: hero.id, list })} className="print anim-rise relative block w-full" aria-label="Open photo">
                <Img media={hero} className="max-h-[70vh] w-full rounded-[4px]" eager alt={m.title} />
                {hero.kind !== 'photo' && <PlayBadge />}
              </button>
            ) : (
              <div className="print tape relative">
                <div className="rounded-[4px] bg-sand px-8 py-14 text-center font-hand text-[26px] leading-snug">{t.emoji} {m.title}</div>
              </div>
            )}
            {rest.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {rest.map((x, i) => (
                  <li key={x.id} className="anim-rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <button onClick={() => openViewer({ memoryId: m.id, mediaId: x.id, list })} className="relative block w-full overflow-hidden rounded-[12px] shadow-print transition hover:-translate-y-0.5" aria-label={x.kind !== 'photo' ? 'Play video' : 'Open photo'}>
                      <Img media={x} className="aspect-square w-full" />
                      {x.kind !== 'photo' && <PlayBadge small />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[14px] font-semibold shadow-sm"><span aria-hidden>{t.emoji}</span>{t.label}</p>
            <h1 className="mt-4 font-display text-[36px] leading-[1.08] sm:text-[46px]">{m.title}</h1>
            <p className="mt-3 text-[17px] text-muted">
              <time dateTime={m.date}>{fmtDate(m.date)}</time> · {ago(m.date)}
              {m.place && <> · <button className="underline-offset-4 hover:underline" onClick={() => go({ name: 'places', place: m.place })}>{m.place}</button></>}
            </p>

            <LikeButton memoryId={m.id} big className="mt-5" />

            {ages.length > 0 && (
              <p className="mt-5 font-hand text-[20px] leading-snug text-ink/80">
                {ages.map((a, i) => (
                  <span key={a.name}>{i > 0 && (i === ages.length - 1 ? ' and ' : ', ')}{a.name} was {a.age === 0 ? 'a baby' : a.age}</span>
                ))}
                {Number(ago(m.date).split(' ')[0]) >= 2 ? '. Look how little they were.' : '.'}
              </p>
            )}

            {m.story && (
              <div className="mt-6 rounded-[18px] bg-card p-6 shadow-print">
                <p className="eyebrow mb-3">Our story</p>
                <p className="whitespace-pre-line font-hand text-[21px] leading-[1.6] text-ink">{m.story}</p>
              </div>
            )}

            {people.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow mb-3">Who was there</p>
                <div className="flex flex-wrap gap-2">
                  {people.map((p) => (
                    <button key={p.id} onClick={() => go({ name: 'timeline', person: p.id })} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-card py-1 pl-1 pr-4 text-[15px] font-medium shadow-sm hover:shadow-print">
                      <Avatar person={p} size={34} />{p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {m.tags.length > 0 && (
              <p className="mt-5 text-[15px] text-muted">{m.tags.map((x) => `#${x}`).join('  ')}</p>
            )}

            {canEdit && <div className="mt-6">
              <button onClick={() => setCollections((c) => !c)} aria-expanded={collections} className="inline-flex min-h-[44px] items-center gap-2 font-semibold">
                <Icon name="book" size={20} /> {m.collections?.length ? `In ${m.collections.length} collection${m.collections.length > 1 ? 's' : ''}` : 'Add to a collection'}
              </button>
              {collections && (
                <div className="anim-rise mt-2 flex flex-wrap gap-2">
                  {state.collections.map((c) => {
                    const on = m.collections?.includes(c.id);
                    return (
                      <button key={c.id} aria-pressed={on} onClick={() => dispatch({ t: 'toggleCollection', memoryId: m.id, collectionId: c.id })}
                        className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-[14px] font-medium ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card'}`}>
                        <span aria-hidden>{c.emoji}</span>{c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>}
          </div>
        </div>
        <p className="mt-16 text-center font-hand text-[20px] text-muted">Some moments deserve to be remembered forever.</p>
      </div>
    </div>
  );
}

export function PlayBadge({ small = false }: { small?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className={`grid place-items-center rounded-full bg-card/90 text-ink shadow-lift ${small ? 'h-10 w-10' : 'h-16 w-16'}`}>
        <Icon name="play" size={small ? 16 : 26} fill />
      </span>
    </span>
  );
}
