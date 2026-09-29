-- OurStory database. Lives safely next to other apps: every table, function and bucket is prefixed "os_".
-- Applied to Supabase as the migration "ourstory_init".

create extension if not exists pgcrypto with schema extensions;

-- Families -----------------------------------------------------------------
create table if not exists public.os_families (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 80),
  since          date,
  intro          text default '' check (char_length(intro) <= 2000),
  privacy        text not null default 'family' check (privacy in ('private', 'family', 'link')),
  invite_code    text not null unique default lower(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10)),
  public_slug    text not null unique default lower(substr(encode(extensions.gen_random_bytes(9), 'hex'), 1, 14)),
  public_enabled boolean not null default false,
  types          jsonb not null default '[]',
  collections    jsonb not null default '[]',
  created_by     uuid references auth.users on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.os_family_members (
  family_id    uuid not null references public.os_families on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  display_name text check (char_length(display_name) <= 80),
  joined_at    timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index if not exists os_family_members_user on public.os_family_members (user_id);

-- Album: each row keeps the app's JSON for a person or memory -------------
create table if not exists public.os_people (
  family_id  uuid not null references public.os_families on delete cascade,
  id         text not null check (char_length(id) <= 64),
  data       jsonb not null,
  primary key (family_id, id)
);

create table if not exists public.os_memories (
  family_id  uuid not null references public.os_families on delete cascade,
  id         text not null check (char_length(id) <= 64),
  date       date,
  data       jsonb not null check (pg_column_size(data) < 200000),
  updated_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now(),
  primary key (family_id, id)
);
create index if not exists os_memories_family_date on public.os_memories (family_id, date desc);

-- Helpers --------------------------------------------------------------------
create or replace function public.os_is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from os_family_members where family_id = fid and user_id = (select auth.uid()));
$$;

create or replace function public.os_is_owner(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from os_family_members where family_id = fid and user_id = (select auth.uid()) and role = 'owner');
$$;

create or replace function public.os_is_public(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from os_families where id = fid and public_enabled);
$$;

create or replace function public.os_create_family(p_name text, p_since date, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into os_families (name, since, created_by) values (left(p_name, 80), coalesce(p_since, current_date), auth.uid()) returning id into fid;
  insert into os_family_members (family_id, user_id, role, display_name) values (fid, auth.uid(), 'owner', left(p_display_name, 80));
  return fid;
end $$;

create or replace function public.os_join_family(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into fid from os_families where invite_code = lower(trim(p_code));
  if fid is null then raise exception 'invalid code'; end if;
  insert into os_family_members (family_id, user_id, display_name) values (fid, auth.uid(), left(p_display_name, 80))
    on conflict (family_id, user_id) do nothing;
  return fid;
end $$;

-- Owner-only: new invite code (old one stops working)
create or replace function public.os_new_invite_code(p_family uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not os_is_owner(p_family) then raise exception 'only the owner can change the code'; end if;
  c := lower(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
  perform set_config('ourstory.admin', 'on', true);
  update os_families set invite_code = c where id = p_family;
  return c;
end $$;

-- Owner-only: turn the public timeline link on/off, or make a new link (old link stops working)
create or replace function public.os_set_public(p_family uuid, p_on boolean, p_new_link boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if not os_is_owner(p_family) then raise exception 'only the owner can change the public link'; end if;
  perform set_config('ourstory.admin', 'on', true);
  if p_new_link then
    update os_families set public_slug = lower(substr(encode(extensions.gen_random_bytes(9), 'hex'), 1, 14)) where id = p_family;
  end if;
  update os_families set public_enabled = p_on where id = p_family returning public_slug into s;
  return s;
end $$;

-- Members may edit album details; codes and public settings change only through the owner functions.
create or replace function public.os_guard_family() returns trigger language plpgsql set search_path = public as $$
begin
  if current_setting('ourstory.admin', true) is distinct from 'on' then
    new.invite_code := old.invite_code;
    new.public_slug := old.public_slug;
    new.public_enabled := old.public_enabled;
    new.created_by := old.created_by;
  end if;
  return new;
end $$;
drop trigger if exists os_guard_family on public.os_families;
create trigger os_guard_family before update on public.os_families for each row execute function public.os_guard_family();

-- Public, read-only timeline: anyone with the link, only while the owner has it switched on.
create or replace function public.os_public_album(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'family', jsonb_build_object('id', f.id, 'name', f.name, 'since', f.since, 'intro', f.intro, 'types', f.types, 'collections', f.collections),
    'people', coalesce((select jsonb_agg(p.data) from os_people p where p.family_id = f.id), '[]'::jsonb),
    'memories', coalesce((select jsonb_agg(m.data order by m.date desc) from os_memories m where m.family_id = f.id), '[]'::jsonb))
  from os_families f where f.public_slug = p_slug and f.public_enabled;
$$;

create or replace function public.os_folder_family(p_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(p_name))[1])::uuid end;
$$;

revoke all on function public.os_is_member(uuid), public.os_is_owner(uuid), public.os_is_public(uuid),
  public.os_create_family(text, date, text), public.os_join_family(text, text), public.os_new_invite_code(uuid),
  public.os_set_public(uuid, boolean, boolean), public.os_public_album(text), public.os_guard_family() from public, anon;
grant execute on function public.os_is_member(uuid), public.os_is_owner(uuid), public.os_create_family(text, date, text),
  public.os_join_family(text, text), public.os_new_invite_code(uuid), public.os_set_public(uuid, boolean, boolean) to authenticated;
grant execute on function public.os_public_album(text), public.os_is_public(uuid), public.os_folder_family(text) to anon, authenticated;

-- Row level security ---------------------------------------------------------
alter table public.os_families       enable row level security;
alter table public.os_family_members enable row level security;
alter table public.os_people         enable row level security;
alter table public.os_memories       enable row level security;

create policy "os members read family"   on public.os_families for select to authenticated using (os_is_member(id));
create policy "os members update family" on public.os_families for update to authenticated using (os_is_member(id)) with check (os_is_member(id));

create policy "os members see members"   on public.os_family_members for select to authenticated using (os_is_member(family_id));
create policy "os leave or remove"       on public.os_family_members for delete to authenticated using (user_id = (select auth.uid()) or os_is_owner(family_id));

create policy "os members read people"   on public.os_people for select to authenticated using (os_is_member(family_id));
create policy "os members add people"    on public.os_people for insert to authenticated with check (os_is_member(family_id));
create policy "os members edit people"   on public.os_people for update to authenticated using (os_is_member(family_id)) with check (os_is_member(family_id));
create policy "os members remove people" on public.os_people for delete to authenticated using (os_is_member(family_id));

create policy "os members read memories"   on public.os_memories for select to authenticated using (os_is_member(family_id));
create policy "os members add memories"    on public.os_memories for insert to authenticated with check (os_is_member(family_id));
create policy "os members edit memories"   on public.os_memories for update to authenticated using (os_is_member(family_id)) with check (os_is_member(family_id));
create policy "os members remove memories" on public.os_memories for delete to authenticated using (os_is_member(family_id));

-- Photos & videos: private bucket, one folder per family --------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('os-media', 'os-media', false, 209715200,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif','video/mp4','video/quicktime','video/webm'])
on conflict (id) do nothing;

create policy "os members read media" on storage.objects for select to authenticated
  using (bucket_id = 'os-media' and public.os_is_member(public.os_folder_family(name)));
create policy "os public read media" on storage.objects for select to anon, authenticated
  using (bucket_id = 'os-media' and public.os_is_public(public.os_folder_family(name)));
create policy "os members upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'os-media' and public.os_is_member(public.os_folder_family(name)));
create policy "os members delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'os-media' and public.os_is_member(public.os_folder_family(name)));

-- Live updates for other family members --------------------------------------
alter publication supabase_realtime add table public.os_memories, public.os_people;
