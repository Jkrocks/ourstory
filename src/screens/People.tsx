import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { Person } from '../lib/types';
import { ageOn, fmtDate, today, uid } from '../lib/utils';
import { shrinkImage } from '../lib/storage';
import { uploadMedia } from '../lib/media';
import { Avatar, Btn, Icon, Sheet, SheetHeader } from '../components/ui';

const TINTS = ['#5FA8E0', '#F58A6B', '#5CC08A', '#FFD24A', '#B993F0', '#F28FB1', '#F6B73C', '#4CC3C0'];
const RELATIONS = ['Father', 'Mother', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Cousin', 'Husband', 'Wife', 'Friend'];
const GEN: Record<string, 0 | 1 | 2> = { Grandfather: 0, Grandmother: 0, Father: 1, Mother: 1, Husband: 1, Wife: 1, Uncle: 1, Aunt: 1, Son: 2, Daughter: 2, Brother: 2, Sister: 2, Cousin: 2 };

export function People() {
  const { state, go, canEdit } = useStore();
  const [edit, setEdit] = useState<Person | 'new' | null>(null);
  const gens = [0, 1, 2].map((g) => state.people.filter((p) => p.generation === g));

  return (
    <div className="pb-10 pt-4 sm:pt-8">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">People</p>
          <h1 className="font-display text-[40px] leading-tight sm:text-[52px]">Who is part of our story</h1>
        </div>
        {canEdit && <Btn onClick={() => setEdit('new')}><Icon name="plus" size={20} /> Add family member</Btn>}
      </header>

      {state.people.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-display text-[26px]">Add the people in your story</p>
          <p className="mt-2 text-muted">Start with yourself, then everyone who belongs in the album.</p>
          <Btn className="mt-6" onClick={() => setEdit('new')}><Icon name="plus" size={20} /> Add family member</Btn>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {state.people.map((p, i) => {
              const count = state.memories.filter((m) => m.people.includes(p.id)).length;
              const age = ageOn(p.birthday, today());
              return (
                <li key={p.id} className="anim-rise" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="relative flex h-full flex-col items-center rounded-[22px] bg-card p-5 text-center shadow-print">
                    {canEdit && <button onClick={() => setEdit(p)} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label={`Edit ${p.name}`}><Icon name="edit" size={18} /></button>}
                    <Avatar person={p} size={88} />
                    <p className="mt-3 font-display text-[22px] leading-tight">{p.name}</p>
                    <p className="text-[15px] text-muted">{p.relation}{age != null ? ` · ${age === 0 ? 'baby' : age}` : ''}</p>
                    {p.birthday && <p className="mt-1 font-hand text-[16px] text-muted">🎂 {fmtDate(p.birthday, 'day')}</p>}
                    <button onClick={() => go({ name: 'timeline', person: p.id })} className="mt-4 min-h-[44px] w-full rounded-full bg-sand px-3 text-[14px] font-semibold hover:bg-line">
                      {count} {count === 1 ? 'memory' : 'memories'} with {p.name}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <section className="mt-16" aria-labelledby="tree">
            <p className="eyebrow">Family tree</p>
            <h2 id="tree" className="mb-8 font-display text-[30px] leading-tight">The {state.family.name} family</h2>
            <div className="overflow-x-auto rounded-[28px] bg-card/70 px-4 py-10 shadow-print">
              <div className="mx-auto flex min-w-fit flex-col items-center">
                {gens.map((row, gi) => row.length > 0 && (
                  <div key={gi} className="flex flex-col items-center">
                    {gi > 0 && gens.slice(0, gi).some((r) => r.length) && <span className="h-10 w-[2px] bg-line" aria-hidden />}
                    <div className="relative flex items-start justify-center gap-6 px-4 sm:gap-10">
                      {gi === 2 && row.length > 1 && <span className="absolute left-[calc(40px+1rem)] right-[calc(40px+1rem)] top-0 h-[2px] bg-line" aria-hidden />}
                      {row.map((p, k) => (
                        <div key={p.id} className="relative flex flex-col items-center">
                          {gi === 2 && row.length > 1 && <span className="h-5 w-[2px] bg-line" aria-hidden />}
                          <button onClick={() => go({ name: 'timeline', person: p.id })} className="group flex w-[80px] flex-col items-center" aria-label={`${p.name}, ${p.relation}`}>
                            <span className="rounded-full transition group-hover:-translate-y-0.5"><Avatar person={p} size={64} ring /></span>
                            <span className="mt-2 text-[15px] font-semibold">{p.name}</span>
                            <span className="text-[13px] text-muted">{p.relation}</span>
                          </button>
                          {gi < 2 && k < row.length - 1 && <span className="absolute left-[calc(100%+0px)] top-8 h-[2px] w-6 bg-heart/40 sm:w-10" aria-hidden />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {edit && <PersonSheet person={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function PersonSheet({ person, onClose }: { person?: Person; onClose: () => void }) {
  const { state, dispatch, toast } = useStore();
  const [name, setName] = useState(person?.name ?? '');
  const [relation, setRelation] = useState(person?.relation ?? 'Son');
  const [birthday, setBirthday] = useState(person?.birthday ?? '');
  const [photo, setPhoto] = useState(person?.photo);
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const draft: Person = {
    id: person?.id ?? uid(), name: name || '?', relation, birthday: birthday || undefined, photo,
    generation: GEN[relation] ?? person?.generation ?? 1, tint: person?.tint ?? TINTS[state.people.length % TINTS.length],
  };
  const field = 'w-full rounded-[14px] border border-line bg-paper px-4 py-3 text-[17px] focus:border-ink focus:outline-none';

  return (
    <Sheet onClose={onClose} label={person ? `Edit ${person.name}` : 'Add a family member'}>
      <SheetHeader title={person ? `Edit ${person.name}` : 'Add a family member'} onClose={onClose} />
      <form className="space-y-5 overflow-y-auto px-6 pb-6 pt-3" onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        dispatch({ t: 'person', p: { ...draft, name: name.trim() } });
        toast(person ? 'Saved' : `${name.trim()} is now part of your story ❤️`);
        onClose();
      }}>
        <div className="flex items-center gap-4">
          <Avatar person={draft} size={80} />
          <Btn variant="soft" onClick={() => fileRef.current?.click()}><Icon name="camera" size={20} /> {photo ? 'Change photo' : 'Add photo'}</Btn>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const { blob } = await shrinkImage(f, 600);
            setPhoto(await uploadMedia(blob, 'photo'));
          }} />
        </div>
        <div>
          <label htmlFor="p-name" className="mb-2 block font-semibold">Name</label>
          <input id="p-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Eva" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-rel" className="mb-2 block font-semibold">Relationship</label>
            <select id="p-rel" value={relation} onChange={(e) => setRelation(e.target.value)} className={field}>
              {[...new Set([relation, ...RELATIONS])].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-bday" className="mb-2 block font-semibold">Birthday <span className="font-normal text-muted">(optional)</span></label>
            <input id="p-bday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={field} />
          </div>
        </div>
        {confirm && person && (
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-heart/10 p-4">
            <p className="mr-auto">Remove {person.name} from the family? Their memories stay.</p>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>Keep</Btn>
            <Btn variant="danger" onClick={() => { dispatch({ t: 'deletePerson', id: person.id }); onClose(); }}>Remove</Btn>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          {person && !confirm && <Btn variant="ghost" onClick={() => setConfirm(true)} className="text-heart">Remove</Btn>}
          <Btn type="submit" className="ml-auto" disabled={!name.trim()}><Icon name="check" size={20} /> Save</Btn>
        </div>
      </form>
    </Sheet>
  );
}
