-- OurStory database. Paste into Supabase → SQL Editor → Run. Safe to run once on a new project.

create extension if not exists pgcrypto;

-- Families -----------------------------------------------------------------
create table if not exists public.families (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  since        date,
  intro        text default '',
  privacy      text not null default 'family' check (privacy in ('private', 'family', 'link')),
  invite_code  text not null unique default lower(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  types        jsonb not null default '[]',
  collections  jsonb not null default '[]',
  created_by   uuid references auth.users on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id    uuid not null references public.families on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  joined_at    timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- Album --------------------------------------------------------------------
-- Each row keeps the app's own JSON for a person or memory in `data`.
create table if not exists public.people (
  family_id  uuid not null references public.families on delete cascade,
  id         text not null,
  data       jsonb not null,
  primary key (family_id, id)
);

create table if not exists public.memories (
  family_id  uuid not null references public.families on delete cascade,
  id         text not null,
  date       date,
  data       jsonb not null,
  updated_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now(),
  primary key (family_id, id)
);
create index if not exists memories_family_date on public.memories (family_id, date desc);

-- Who belongs where ----------------------------------------------------------
create or replace function public.is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.create_family(p_name text, p_since date, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into families (name, since, created_by) values (p_name, coalesce(p_since, current_date), auth.uid()) returning id into fid;
  insert into family_members (family_id, user_id, role, display_name) values (fid, auth.uid(), 'owner', p_display_name);
  return fid;
end $$;

create or replace function public.join_family(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into fid from families where invite_code = lower(trim(p_code));
  if fid is null then raise exception 'invalid code'; end if;
  insert into family_members (family_id, user_id, display_name) values (fid, auth.uid(), p_display_name)
    on conflict (family_id, user_id) do nothing;
  return fid;
end $$;

grant execute on function public.create_family(text, date, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;

-- Row level security: only family members see or change a family's album ----
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.people         enable row level security;
alter table public.memories       enable row level security;

create policy "members read family"   on public.families for select using (is_member(id));
create policy "members update family" on public.families for update using (is_member(id)) with check (is_member(id));

-- Members can edit the album details but never change the invite code directly.
create or replace function public.keep_invite_code() returns trigger language plpgsql as $$
begin
  if new.invite_code is distinct from old.invite_code and current_setting('ourstory.rotating', true) is distinct from 'on' then
    new.invite_code := old.invite_code;
  end if;
  return new;
end $$;
drop trigger if exists keep_invite_code on public.families;
create trigger keep_invite_code before update on public.families for each row execute function public.keep_invite_code();

-- Owner can issue a new code (the old one stops working immediately).
create or replace function public.new_invite_code(p_family uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not exists (select 1 from family_members where family_id = p_family and user_id = auth.uid() and role = 'owner') then
    raise exception 'only the owner can change the code';
  end if;
  c := lower(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
  perform set_config('ourstory.rotating', 'on', true);
  update families set invite_code = c where id = p_family;
  return c;
end $$;
grant execute on function public.new_invite_code(uuid) to authenticated;

-- Owner can remove a member.
create policy "owner removes members" on public.family_members for delete using (
  exists (select 1 from family_members o where o.family_id = family_members.family_id and o.user_id = auth.uid() and o.role = 'owner')
);

create policy "members see members"   on public.family_members for select using (is_member(family_id));
create policy "leave a family"        on public.family_members for delete using (user_id = auth.uid());
-- Only photos/videos, max 200 MB each (bucket limit below).

create policy "members read people"   on public.people for select using (is_member(family_id));
create policy "members add people"    on public.people for insert with check (is_member(family_id));
create policy "members edit people"   on public.people for update using (is_member(family_id)) with check (is_member(family_id));
create policy "members remove people" on public.people for delete using (is_member(family_id));

create policy "members read memories"   on public.memories for select using (is_member(family_id));
create policy "members add memories"    on public.memories for insert with check (is_member(family_id));
create policy "members edit memories"   on public.memories for update using (is_member(family_id)) with check (is_member(family_id));
create policy "members remove memories" on public.memories for delete using (is_member(family_id));

-- Photos & videos: private bucket, one folder per family ---------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 209715200)  -- 200 MB per file, private
on conflict (id) do nothing;
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/gif','video/mp4','video/quicktime','video/webm']
where id = 'media';

create policy "members read media" on storage.objects for select
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members upload media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members delete media" on storage.objects for delete
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));

-- Live updates when someone else in the family adds a memory ----------------
alter publication supabase_realtime add table public.memories, public.people;
