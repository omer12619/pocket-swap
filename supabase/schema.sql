-- ============================================================================
-- POCKETSWAP: COMPLETE TABLES + INITIAL DATA SEED
-- Copy and paste this into your Supabase SQL Editor (the `>_` icon on the left)
-- and click "Run"!
-- ============================================================================

-- 1. Enable PostGIS for geospatial radius & radar queries
create extension if not exists postgis;

-- 2. Profiles Table
create table if not exists public.profiles (
  id text primary key,
  username text unique not null,
  display_name text not null,
  avatar_emoji text default '🦊',
  avatar_url text,
  title_badge text default 'Sprout Trader 🌱',
  bio text default 'Collecting cozy treasures & trading locally!',
  karma_score numeric(3,2) default 5.00,
  karma_points integer default 100,
  karma_reviews_count integer default 1,
  completed_trades integer default 0,
  level integer default 1,
  xp integer default 50,
  latitude double precision default 32.0853,
  longitude double precision default 34.7818,
  location_name text default 'Sunny Leaf District',
  badges text[] default array['Fast & Friendly ⚡'],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Inventory Items Table
create table if not exists public.items (
  id text default ('item-' || gen_random_uuid()::text) primary key,
  owner_id text not null,
  owner_name text default 'Trader',
  owner_avatar text default '🦊',
  owner_karma numeric(3,2) default 5.00,
  owner_level integer default 1,
  title text not null,
  description text not null,
  category text not null,
  condition text not null,
  rarity text not null default 'Common',
  year_made integer default 2023,
  brand text default 'Original',
  accessories_included text default 'Item Only',
  condition_notes text default 'Clean and tested.',
  media_url text not null,
  media_type text not null default 'image',
  wishlist_hint text default 'Open to any fun offers!',
  is_for_trade boolean default true,
  latitude double precision not null,
  longitude double precision not null,
  location_geog geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) stored,
  location_name text default 'Nearby',
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists items_location_gist_idx
  on public.items using gist (location_geog);

-- 4. Trade Offers Table
create table if not exists public.trade_offers (
  id text default ('trade-' || gen_random_uuid()::text) primary key,
  sender_id text not null,
  sender_name text not null,
  sender_avatar text default '🦊',
  sender_karma numeric(3,2) default 5.00,
  receiver_id text not null,
  receiver_name text not null,
  receiver_avatar text default '🐼',
  requested_item_id text not null,
  offered_item_ids text[] not null,
  message text,
  status text not null default 'pending',
  counter_count integer default 0,
  last_actor_name text,
  meetup_distance_km numeric(5,2) default 0.8,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Trade Chat Messages Table
create table if not exists public.trade_messages (
  id text default ('msg-' || gen_random_uuid()::text) primary key,
  trade_id text references public.trade_offers(id) on delete cascade not null,
  sender_id text not null,
  sender_name text not null,
  sender_avatar text default '🦊',
  text text not null,
  is_counter_event boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Friendships & Trade Buddies Table
create table if not exists public.friendships (
  id text default ('friend-' || gen_random_uuid()::text) primary key,
  requester_id text not null,
  addressee_id text not null,
  status text not null default 'friends',
  mutual_trades integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Karma Reviews & Ranking Table
create table if not exists public.karma_reviews (
  id text default ('rev-' || gen_random_uuid()::text) primary key,
  trade_id text,
  reviewer_id text not null,
  reviewer_name text default 'Trader',
  reviewer_avatar text default '🦊',
  target_user_id text not null,
  stars integer check (stars >= 1 and stars <= 5) not null,
  vibe_badge text not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Open Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.trade_offers enable row level security;
alter table public.trade_messages enable row level security;
alter table public.friendships enable row level security;
alter table public.karma_reviews enable row level security;

drop policy if exists "Public access profiles" on public.profiles;
create policy "Public access profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Public access items" on public.items;
create policy "Public access items" on public.items for all using (true) with check (true);

drop policy if exists "Public access trade_offers" on public.trade_offers;
create policy "Public access trade_offers" on public.trade_offers for all using (true) with check (true);

drop policy if exists "Public access trade_messages" on public.trade_messages;
create policy "Public access trade_messages" on public.trade_messages for all using (true) with check (true);

drop policy if exists "Public access friendships" on public.friendships;
create policy "Public access friendships" on public.friendships for all using (true) with check (true);

drop policy if exists "Public access karma_reviews" on public.karma_reviews;
create policy "Public access karma_reviews" on public.karma_reviews for all using (true) with check (true);

-- 9. Seed Initial Profiles
insert into public.profiles (id, username, display_name, avatar_emoji, title_badge, bio, karma_score, karma_points, karma_reviews_count, completed_trades, level, xp, latitude, longitude, location_name, badges)
values
  ('user-me-01', 'maple_trader', 'Maple Fox', '🦊', 'Star Villager 🌟', 'Lover of retro handhelds, mechanical keyboards, plants & vinyl records!', 4.94, 460, 14, 12, 7, 145, 32.0853, 34.7818, 'Sunny Leaf District', array['Fast & Friendly ⚡', 'Mint Condition Keeper ✨', 'Local Legend 🏆']),
  ('user-02', 'milo_bear', 'Milo Bear', '🐻', 'Retro Collector 🕹️', 'Trading classic Nintendo cartridges, analog cameras, and cozy desk gear.', 4.98, 620, 21, 19, 9, 180, 32.0892, 34.7865, 'Acorn Park Plaza', array['Mint Condition Keeper ✨', 'Fair Negotiator 🤝']),
  ('user-03', 'luna_bunny', 'Luna Bunny', '🐰', 'Artisan Baker & Maker 🎨', 'Crocheted plushies, art prints, and vintage Polaroid cameras!', 4.88, 390, 11, 9, 6, 90, 32.0795, 34.7772, 'Berry Creek Cafe', array['Sweetest Packaging 🎀', 'Fast & Friendly ⚡']),
  ('user-04', 'pip_otter', 'Pip Otter', '🦦', 'Harbor Gadgeteer ⚓', 'Audio gear, synthesizers, skateboards, and rare streetwear.', 4.91, 510, 16, 15, 8, 110, 32.0945, 34.7912, 'Harbor Boardwalk', array['Local Legend 🏆', 'On-Time Meetup 📍'])
on conflict (id) do nothing;
