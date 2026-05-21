
-- Profiles
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Héroe',
  avatar integer not null default 0,
  archetype integer,
  level integer not null default 1,
  xp integer not null default 0,
  coins integer not null default 100,
  gems integer not null default 5,
  streak integer not null default 0,
  last_mission_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- user_stats
create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bienestar integer not null default 50,
  resiliencia integer not null default 50,
  energia integer not null default 50,
  claridad integer not null default 50,
  updated_at timestamptz not null default now()
);
alter table public.user_stats enable row level security;
create policy "users read own stats" on public.user_stats for select using (auth.uid() = user_id);
create policy "users insert own stats" on public.user_stats for insert with check (auth.uid() = user_id);
create policy "users update own stats" on public.user_stats for update using (auth.uid() = user_id);

-- user_attributes
create table public.user_attributes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resiliencia integer not null default 30,
  empatia integer not null default 30,
  mindfulness integer not null default 30,
  autoconocimiento integer not null default 30,
  conexion_social integer not null default 30,
  creatividad integer not null default 30,
  updated_at timestamptz not null default now()
);
alter table public.user_attributes enable row level security;
create policy "users read own attrs" on public.user_attributes for select using (auth.uid() = user_id);
create policy "users insert own attrs" on public.user_attributes for insert with check (auth.uid() = user_id);
create policy "users update own attrs" on public.user_attributes for update using (auth.uid() = user_id);

-- mission_completions
create table public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  title text not null,
  xp_earned integer not null default 0,
  is_ar boolean not null default false,
  completed_at timestamptz not null default now(),
  completed_date date not null default current_date
);
create index mission_completions_user_date_idx on public.mission_completions(user_id, completed_date);
alter table public.mission_completions enable row level security;
create policy "users read own missions" on public.mission_completions for select using (auth.uid() = user_id);
create policy "users insert own missions" on public.mission_completions for insert with check (auth.uid() = user_id);

-- inventory
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  acquired_at timestamptz not null default now(),
  unique (user_id, item_name)
);
alter table public.inventory enable row level security;
create policy "users read own inventory" on public.inventory for select using (auth.uid() = user_id);
create policy "users insert own inventory" on public.inventory for insert with check (auth.uid() = user_id);
create policy "users delete own inventory" on public.inventory for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger user_stats_touch before update on public.user_stats
  for each row execute function public.touch_updated_at();
create trigger user_attributes_touch before update on public.user_attributes
  for each row execute function public.touch_updated_at();

-- Auto-create rows on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Héroe'))
  on conflict (user_id) do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_attributes (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
