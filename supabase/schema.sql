-- =============================================
-- VidMetrics Database Schema
-- =============================================

create extension if not exists "uuid-ossp";

-- =============================================
-- WATCHLIST
-- =============================================
create table if not exists public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  channel_id text not null,
  channel_title text not null,
  handle text not null,
  thumbnail_url text not null,
  subscriber_count bigint not null default 0,
  category text not null default 'default',
  last_momentum_score integer,
  last_momentum_label text,
  last_analyzed_at timestamptz,
  added_at timestamptz default now() not null,
  unique(user_id, channel_id)
);

-- =============================================
-- WATCHLIST TAGS
-- =============================================
create table if not exists public.watchlist_tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  channel_id text not null,
  tag text not null,
  created_at timestamptz default now() not null,
  unique(user_id, channel_id, tag),
  foreign key (user_id, channel_id)
    references public.watchlist(user_id, channel_id)
    on delete cascade
);

-- =============================================
-- REPORTS HISTORY
-- =============================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  channel_id text not null,
  channel_title text not null,
  handle text not null,
  thumbnail_url text not null,
  subscriber_count bigint not null default 0,
  shared_at timestamptz default now() not null,
  unique(user_id, channel_id)
);

-- =============================================
-- CHANNEL SNAPSHOTS
-- =============================================
create table if not exists public.channel_snapshots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  channel_id text not null,
  channel_title text not null,
  handle text not null,
  thumbnail_url text not null,
  subscriber_count bigint not null default 0,
  total_view_count bigint not null default 0,
  video_count integer not null default 0,
  avg_views_per_video integer not null default 0,
  avg_engagement_rate numeric(6,4) not null default 0,
  momentum_score integer not null default 0,
  momentum_label text not null default 'Stable',
  upload_frequency text not null default '0x / week',
  views_last_30d bigint not null default 0,
  snapshotted_at timestamptz default now() not null
);

-- =============================================
-- SAVED COMPARISONS
-- =============================================
create table if not exists public.saved_comparisons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  channel_ids text[] not null,
  channel_titles text[] not null,
  channel_handles text[] not null,
  thumbnail_urls text[] not null,
  created_at timestamptz default now() not null,
  last_viewed_at timestamptz
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.watchlist enable row level security;
alter table public.watchlist_tags enable row level security;
alter table public.reports enable row level security;
alter table public.channel_snapshots enable row level security;
alter table public.saved_comparisons enable row level security;

create policy "watchlist_select" on public.watchlist
  for select using (auth.uid() = user_id);
create policy "watchlist_insert" on public.watchlist
  for insert with check (auth.uid() = user_id);
create policy "watchlist_update" on public.watchlist
  for update using (auth.uid() = user_id);
create policy "watchlist_delete" on public.watchlist
  for delete using (auth.uid() = user_id);

create policy "tags_select" on public.watchlist_tags
  for select using (auth.uid() = user_id);
create policy "tags_insert" on public.watchlist_tags
  for insert with check (auth.uid() = user_id);
create policy "tags_delete" on public.watchlist_tags
  for delete using (auth.uid() = user_id);

create policy "reports_select" on public.reports
  for select using (auth.uid() = user_id);
create policy "reports_insert" on public.reports
  for insert with check (auth.uid() = user_id);
create policy "reports_delete" on public.reports
  for delete using (auth.uid() = user_id);

create policy "snapshots_select" on public.channel_snapshots
  for select using (auth.uid() = user_id);
create policy "snapshots_insert" on public.channel_snapshots
  for insert with check (auth.uid() = user_id);

create policy "comparisons_select" on public.saved_comparisons
  for select using (auth.uid() = user_id);
create policy "comparisons_insert" on public.saved_comparisons
  for insert with check (auth.uid() = user_id);
create policy "comparisons_update" on public.saved_comparisons
  for update using (auth.uid() = user_id);
create policy "comparisons_delete" on public.saved_comparisons
  for delete using (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

create index watchlist_user_id_idx
  on public.watchlist(user_id);
create index tags_user_channel_idx
  on public.watchlist_tags(user_id, channel_id);
create index reports_user_id_idx
  on public.reports(user_id);
create index snapshots_user_channel_idx
  on public.channel_snapshots(user_id, channel_id);
create index snapshots_user_time_idx
  on public.channel_snapshots(user_id, snapshotted_at desc);
create index comparisons_user_id_idx
  on public.saved_comparisons(user_id);
