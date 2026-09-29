import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { Media, Memory } from '../lib/types';
import { byDateDesc, fmtDate, parts, uid } from '../lib/utils';
import { Avatar, Btn, Chip, Empty, HeartButton, Icon, Img, SectionHead } from '../components/ui';
import { PlayBadge } from '../components/MemoryView';
import { Collections } from './Home';
import { MemoryCard } from '../components/MemoryCard';

type Tab = 'all' | 'year' | 'person' | 'event' | 'place' | 'videos';
type Item = { m: Memory; x: Media };

export function Masonry({ items }: { items: Item[] }) {
  const { openViewer, dispatch } = useStore();
  const list = items.map((i) => ({ memoryId: i.m.id, mediaId: i.x.id }));
  return (
    <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
      {items.map(({ m, x }, i) => (
        <li key={x.id} className="anim-fade group relative break-inside-avoid" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
          <button onClick={() => openViewer({ memoryId: m.id, mediaId: x.id, list })} className="block w-full overflow-hidden rounded-[14px] shadow-print" aria-label={`${x.kind !== 'photo' ? 'Video' : 'Photo'} from ${m.title}`}>
            <span className="block" style={{ aspectRatio: String(x.ratio ?? 4 / 3) }}>
              <Img media={x} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
            </span>
            {x.kind !== 'photo' && <PlayBadge small />}
          </button>
          <HeartButton on={!!x.favorite} onToggle={() => dispatch({ t: 'media', memoryId: m.id, mediaId: x.id, patch: { favorite: !x.favorite } })}
            className={`absolute right-2 top-2 h-10 w-10 bg-card/85 backdrop-blur ${x.favorite ? '' : 'text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'}`} size={18} />
        </li>
      ))}
    </ul>
  );
}

export function Memories() {
  const { state, route, go, dispatch, toast, canEdit } = useStore();
  const [tab, setTab] = useState<Tab>('all');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const collection = route.name === 'memories' ? route.collection : undefined;

  const mems = useMemo(() => [...state.memories].sort(byDateDesc), [state.memories]);
  const all: Item[] = useMemo(() => mems.flatMap((m) => m.media.map((x) => ({ m, x }))), [mems]);

  if (!mems.length) return <Empty title="No memories yet." body={'Every family has a story.\nLet’s start yours.'} />;

  if (collection) {
    const c = state.collections.find((x) => x.id === collection);
    const list = mems.filter((m) => m.collections?.includes(collection));
    return (
      <div className="pb-10 pt-4 sm:pt-8">
        <button onClick={() => go({ name: 'memories' })} className="mb-4 inline-flex min-h-[44px] items-center gap-1 rounded-full pr-4 font-semibold hover:bg-sand"><Icon name="back" /> All memories</button>
        <h1 className="font-display text-[40px] leading-tight sm:text-[52px]"><span aria-hidden>{c?.emoji}</span> {c?.name}</h1>
        <p className="mb-8 font-hand text-[20px] text-muted">{list.length} {list.length === 1 ? 'memory' : 'memories'}</p>
        {list.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((m, i) => <li key={m.id}><MemoryCard m={m} index={i} /></li>)}</ul>
        ) : <p className="font-hand text-[20px] text-muted">Nothing here yet. Open any memory and choose “Add to a collection”.</p>}
      </div>
    );
  }

  const groups: [string, Item[], React.ReactNode?][] = (() => {
    if (tab === 'all') return [['', all.filter((i) => i.x.kind === 'photo')]];
    if (tab === 'videos') return [['', all.filter((i) => i.x.kind !== 'photo')]];
    if (tab === 'year') {
      const ys = [...new Set(all.map((i) => parts(i.m.date).y))];
      return ys.map((y) => [String(y), all.filter((i) => parts(i.m.date).y === y)]);
    }
    if (tab === 'person') {
      return state.people.map((p) => [p.name, all.filter((i) => (i.x.people ?? i.m.people).includes(p.id)), <Avatar key={p.id} person={p} size={40} />] as [string, Item[], React.ReactNode]).filter((g) => g[1].length);
    }
    if (tab === 'place') {
      const ps = [...new Set(all.map((i) => i.m.place).filter(Boolean) as string[])];
      return ps.map((p) => [p, all.filter((i) => i.m.place === p)]);
    }
    return mems.filter((m) => m.media.length).map((m) => [`${m.title} · ${fmtDate(m.date, 'short')}`, m.media.map((x) => ({ m, x }))]);
  })();

  const s = { photos: all.filter((i) => i.x.kind === 'photo').length, videos: all.filter((i) => i.x.kind !== 'photo').length };

  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <header className="mb-10">
        <p className="eyebrow">Memories</p>
        <h1 className="font-display text-[40px] leading-tight sm:text-[52px]">The moments we’ve saved</h1>
        <p className="mt-1 font-hand text-[20px] text-muted">{s.photos.toLocaleString('en-IN')} photos and {s.videos} videos, kept safe in one place.</p>
      </header>

      <section className="mb-14">
        <SectionHead title="Family moments" action={canEdit && !creating && <Btn variant="soft" onClick={() => setCreating(true)} className="min-h-[44px]"><Icon name="plus" size={18} /> New collection</Btn>} />
        {creating && (
          <form className="anim-rise mb-6 flex flex-wrap gap-2" onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            dispatch({ t: 'collection', c: { id: 'c-' + uid(), name: newName.trim(), emoji: '📔' } });
            toast(`“${newName.trim()}” created. Add memories to it from any memory.`);
            setNewName(''); setCreating(false);
          }}>
            <label htmlFor="c-name" className="sr-only">Collection name</label>
            <input id="c-name" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Our Sunday breakfasts" className="min-h-[48px] flex-1 rounded-full border border-line bg-card px-5 focus:border-ink focus:outline-none" />
            <Btn type="submit">Create</Btn>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
          </form>
        )}
        <Collections />
        {state.collections.filter((c) => !mems.some((m) => m.collections?.includes(c.id))).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {state.collections.filter((c) => !mems.some((m) => m.collections?.includes(c.id))).map((c) => (
              <button key={c.id} onClick={() => go({ name: 'memories', collection: c.id })} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-dashed border-line px-4 text-[15px] text-muted">{c.emoji} {c.name} · empty</button>
            ))}
          </div>
        )}
      </section>

      <div role="tablist" aria-label="Show photos" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
        {([['all', 'All photos'], ['year', 'By year'], ['person', 'By person'], ['event', 'By event'], ['place', 'By place'], ['videos', 'Videos']] as [Tab, string][]).map(([k, l]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Chip>
        ))}
      </div>

      <div className="space-y-12">
        {groups.map(([title, items, icon]) => (
          <section key={title || 'all'}>
            {title && <h2 className="mb-4 flex items-center gap-3 font-display text-[26px] leading-tight">{icon}{title} <span className="font-sans text-[15px] font-normal text-muted tnum">{items.length}</span></h2>}
            {items.length ? <Masonry items={items} /> : <p className="font-hand text-[20px] text-muted">Nothing here yet.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
