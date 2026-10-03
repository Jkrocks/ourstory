import { useStore, type Route } from './lib/store';
import { useAuth } from './lib/auth';
import { Icon, Toast } from './components/ui';
import { AddRoot } from './components/AddMemory';
import { MemoryView } from './components/MemoryView';
import { PhotoViewer } from './components/PhotoViewer';
import { Recap, Search, ShareSheet } from './components/Overlays';
import { Home } from './screens/Home';
import { Timeline } from './screens/Timeline';
import { Memories } from './screens/Memories';
import { People } from './screens/People';
import { DriveAlbum, Favorites, Places, Settings, DRIVE_FOLDER } from './screens/Other';

const NAV: { r: Route['name']; label: string; icon: string }[] = [
  { r: 'home', label: 'Home', icon: 'home' },
  { r: 'timeline', label: 'Timeline', icon: 'timeline' },
  { r: 'memories', label: 'Memories', icon: 'photos' },
  { r: 'people', label: 'People', icon: 'people' },
  { r: 'places', label: 'Places', icon: 'place' },
  { r: 'favorites', label: 'Favourites', icon: 'star' },
  ...(DRIVE_FOLDER ? [{ r: 'album' as const, label: 'Drive album', icon: 'folder' }] : []),
  { r: 'settings', label: 'Settings', icon: 'settings' },
];

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className={`font-display leading-none tracking-[-.01em] ${small ? 'text-[26px]' : 'text-[32px]'}`}>OurStory</span>
      {!small && <span className="mt-1 text-[9px] font-bold tracking-[.38em] text-string">A FAMILY TIMELINE</span>}
    </span>
  );
}

export default function App() {
  const { route, go, openAdd, setSearch, ready, canEdit, published, dirty, publish, publishing, missing, state } = useStore();
  const auth = useAuth();
  const screen = {
    home: <Home />, timeline: <Timeline />, memories: <Memories />, people: <People />,
    places: <Places />, favorites: <Favorites />, album: <DriveAlbum />, settings: <Settings />,
  }[route.name];

  return (
    <div className="paper-bg min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden bg-paper lg:block" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center px-10 pt-5">
          <button onClick={() => setSearch(true)} className="inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full px-3 text-[14px] text-muted hover:text-ink">
            <Icon name="search" size={18} /> Search
          </button>
          <button onClick={() => go({ name: 'home' })} aria-label="OurStory home"><Wordmark /></button>
          {canEdit ? (
            <button onClick={() => openAdd('menu')} className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink text-paper px-5 text-[15px] font-bold transition hover:opacity-90">
              <Icon name="plus" size={18} /> Add Memory
            </button>
          ) : <span />}
        </div>
        <nav aria-label="Main" className="border-b border-line/60">
          <ul className="mx-auto flex max-w-[1180px] items-center justify-center gap-1 px-10 pb-2 pt-3">
            {NAV.map((n) => {
              const on = route.name === n.r;
              return (
                <li key={n.r}>
                  <button onClick={() => go({ name: n.r } as Route)} aria-current={on ? 'page' : undefined}
                    className={`relative min-h-[40px] px-3 text-[14px] tracking-[.06em] transition ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                    {n.r === 'settings' && !canEdit ? 'Our family' : n.label}
                    {on && <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-string" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper lg:hidden" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex h-16 items-center justify-between px-4">
          <button onClick={() => go({ name: 'home' })} aria-label="OurStory home"><Wordmark small /></button>
          <div className="flex gap-1">
            <button onClick={() => go({ name: 'favorites' })} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Favourites"><Icon name="star" /></button>
            <button onClick={() => setSearch(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Search"><Icon name="search" /></button>
          </div>
        </div>
      </header>

      <main id="main" className="px-4 pb-32 sm:px-6 lg:px-10 lg:pb-16">
        <div key={route.name + JSON.stringify(route)} className="anim-fade mx-auto max-w-[1180px]">
          {auth.mode === 'public' && ready && !missing && (
            <div className="mb-2 mt-4 flex flex-wrap items-center gap-3 rounded-[18px] bg-sand px-4 py-3 text-[15px]">
              <span className="h-2.5 w-2.5 rounded-full bg-string" aria-hidden />
              <span>You’re viewing <b>the {state.family.name} family’s</b> story. Read-only.</span>
              <a href={import.meta.env.BASE_URL} className="ml-auto font-bold underline underline-offset-4">Family sign in</a>
            </div>
          )}
          {missing ? (
            <div className="mx-auto max-w-md py-24 text-center">
              <p className="font-display text-[34px] leading-tight">This story is private</p>
              <p className="mt-3 text-muted">The link was switched off or replaced by the family. Ask them for the new link.</p>
              <a href={import.meta.env.BASE_URL} className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-ink px-6 font-bold text-paper">Go to OurStory</a>
            </div>
          ) : ready ? screen : null}
        </div>
      </main>

      {/* Owner: publish bar */}
      {published && canEdit && (
        <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-ink py-2 pl-5 pr-2 text-paper shadow-lift lg:bottom-8" role="region" aria-label="Publishing">
          <span className={`h-2.5 w-2.5 rounded-full ${dirty ? 'bg-honey' : 'bg-leaf'}`} aria-hidden />
          <span className="text-[14px] font-medium">{dirty ? 'Unpublished changes' : 'Owner view · all published'}</span>
          {dirty && (
            <button onClick={publish} disabled={publishing} className="tone-pink bg-tone min-h-[40px] rounded-full px-4 text-[14px] font-bold disabled:opacity-50">
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      )}

      {/* Desktop floating + */}
      {canEdit && <button onClick={() => openAdd('menu')} aria-label="Add a memory"
        className="fixed bottom-8 right-8 z-30 hidden h-16 w-16 place-items-center rounded-full bg-string text-white shadow-lift transition hover:scale-105 lg:grid">
        <Icon name="plus" size={30} stroke={2.2} />
      </button>}

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <ul className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-center">
          {([['home', 'home', 'Home'], ['timeline', 'timeline', 'Timeline'], ['add', 'plus', ''], ['memories', 'photos', 'Memories'], ['settings', 'user', canEdit ? 'Profile' : 'Family']] as const).map(([r, ic, l]) => (
            <li key={r} className="flex justify-center">
              {r === 'add' ? (
                <button onClick={() => (canEdit ? openAdd('menu') : setSearch(true))} aria-label={canEdit ? 'Add a memory' : 'Search memories'} className="-mt-8 grid h-16 w-16 place-items-center rounded-full bg-string text-white shadow-lift ring-[6px] ring-paper">
                  <Icon name={canEdit ? 'plus' : 'search'} size={canEdit ? 30 : 26} stroke={2.2} />
                </button>
              ) : (
                <button onClick={() => go({ name: r } as Route)} aria-current={route.name === r ? 'page' : undefined}
                  className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 text-[12px] font-semibold ${route.name === r || (r === 'settings' && ['people', 'places', 'favorites', 'album'].includes(route.name)) ? 'text-string' : 'text-muted'}`}>
                  <Icon name={ic} size={24} stroke={route.name === r ? 2.2 : 1.8} />{l}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <MemoryView />
      <AddRoot />
      <PhotoViewer />
      <Search />
      <ShareSheet />
      <Recap />
      <Toast />
    </div>
  );
}
