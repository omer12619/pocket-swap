import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  FriendConnection,
  KarmaReview,
  TradeItem,
  TradeOffer,
  UserProfile,
} from '../types/game';

const DEFAULT_SUPABASE_URL = 'https://cwlffynxezwjqkhlaflm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_zjtXYkqPcbwTMJWU1nDv-Q_4SYjtldQ';

const envUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  DEFAULT_SUPABASE_URL;
const envKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  DEFAULT_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const savedUrl = localStorage.getItem('pocketswap_supabase_url') || envUrl || '';
  const savedKey = localStorage.getItem('pocketswap_supabase_key') || envKey || '';
  return { url: savedUrl.trim(), anonKey: savedKey.trim() };
}

export function setStoredSupabaseConfig(url: string, anonKey: string) {
  cachedClient = null;
  if (url && anonKey) {
    localStorage.setItem('pocketswap_supabase_url', url.trim());
    localStorage.setItem('pocketswap_supabase_key', anonKey.trim());
  } else {
    localStorage.removeItem('pocketswap_supabase_url');
    localStorage.removeItem('pocketswap_supabase_key');
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey || url.includes('your-project-id')) {
    return null;
  }
  const configKey = `${url}::${anonKey}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    cachedConfigKey = configKey;
    return cachedClient;
  } catch {
    return null;
  }
}

export interface CloudAppState {
  items: TradeItem[];
  trades: TradeOffer[];
  profiles: UserProfile[];
  reviews: KarmaReview[];
  updatedAt: string;
}

export async function saveCloudStateToSupabase(
  state: CloudAppState
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  try {
    const blob = new Blob([JSON.stringify(state)], {
      type: 'application/json',
    });
    const { error } = await supabase.storage
      .from('item-media')
      .upload('cloud-db/state.json', blob, {
        contentType: 'application/json',
        upsert: true,
      });
    return !error;
  } catch {
    return false;
  }
}

export async function loadCloudStateFromSupabase(): Promise<CloudAppState | null> {
  const { url } = getStoredSupabaseConfig();
  if (!url) return null;
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/item-media/cloud-db/state.json?t=${Date.now()}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as CloudAppState;
    if (data && Array.isArray(data.items) && data.items.length > 0) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function uploadItemMediaToSupabase(
  dataUrlOrFile: string | File,
  ext = 'webp'
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    let uploadBody: Blob | File;
    let contentType = ext === 'mp4' ? 'video/mp4' : 'image/webp';

    if (typeof dataUrlOrFile === 'string') {
      if (!dataUrlOrFile.startsWith('data:')) {
        return dataUrlOrFile;
      }
      const res = await fetch(dataUrlOrFile);
      uploadBody = await res.blob();
      contentType = uploadBody.type || contentType;
    } else {
      uploadBody = dataUrlOrFile;
      contentType = dataUrlOrFile.type || contentType;
    }

    const filePath = `uploads/item-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage
      .from('item-media')
      .upload(filePath, uploadBody, {
        contentType,
        upsert: true,
      });

    if (error) return null;
    const { data } = supabase.storage.from('item-media').getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}

// Haversine formula to compute real-time distance between two GPS coordinates in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export const INITIAL_CURRENT_USER: UserProfile = {
  id: 'user-me-01',
  username: 'maple_trader',
  display_name: 'Maple Fox',
  avatar_emoji: '🦊',
  title_badge: 'Star Villager 🌟',
  bio: 'Lover of retro handhelds, mechanical keyboards, plants & vinyl records! Always down for a local coffee-shop swap ☕🌿',
  karma_score: 4.94,
  karma_points: 460,
  karma_reviews_count: 14,
  completed_trades: 12,
  level: 7,
  xp: 145,
  latitude: 32.0853,
  longitude: 34.7818,
  location_name: 'Sunny Leaf District',
  badges: [
    'Fast & Friendly ⚡',
    'Mint Condition Keeper ✨',
    'Local Legend 🏆',
    'Verified GPS 📍',
  ],
};

export const INITIAL_PROFILES: UserProfile[] = [
  INITIAL_CURRENT_USER,
  {
    id: 'user-milo-02',
    username: 'milo_beans',
    display_name: 'Milo Bear',
    avatar_emoji: '🐻',
    title_badge: 'Guild Master 👑',
    bio: 'Collector of Nintendo classics, cozy board games, and Polaroid cameras.',
    karma_score: 4.98,
    karma_points: 680,
    karma_reviews_count: 23,
    completed_trades: 21,
    level: 11,
    xp: 180,
    latitude: 32.0892,
    longitude: 34.7865,
    location_name: 'Acorn Park (0.6 km)',
    badges: [
      'Generous Trader 🎁',
      'Fast & Friendly ⚡',
      'Item Exactly as Described ✨',
    ],
  },
  {
    id: 'user-luna-03',
    username: 'luna_sprout',
    display_name: 'Luna Bunny',
    avatar_emoji: '🐰',
    title_badge: 'Crafty Artisan 🎨',
    bio: 'Trading handmade ceramics, indie art books, and vintage headphones!',
    karma_score: 4.85,
    karma_points: 340,
    karma_reviews_count: 9,
    completed_trades: 8,
    level: 5,
    xp: 90,
    latitude: 32.0795,
    longitude: 34.7772,
    location_name: 'Berry Creek Cafe (0.8 km)',
    badges: ['Cozy Communicator 💬', 'Item Exactly as Described ✨'],
  },
  {
    id: 'user-pip-04',
    username: 'pip_arcade',
    display_name: 'Pip Frog',
    avatar_emoji: '🐸',
    title_badge: 'Gadget Scout 🕹️',
    bio: 'Always swapping audio gear, synth pedals, and limited-edition sneakers.',
    karma_score: 4.79,
    karma_points: 290,
    karma_reviews_count: 7,
    completed_trades: 6,
    level: 4,
    xp: 120,
    latitude: 32.0945,
    longitude: 34.7912,
    location_name: 'Harbor Boardwalk (1.3 km)',
    badges: ['Fast & Friendly ⚡'],
  },
  {
    id: 'user-community-0',
    username: 'boba_panda',
    display_name: 'Boba Panda',
    avatar_emoji: '🐼',
    title_badge: 'Retro Collector 🕹️',
    bio: 'Collecting transparent handhelds, synth pedals & bubble tea plushies!',
    karma_score: 4.91,
    karma_points: 410,
    karma_reviews_count: 11,
    completed_trades: 9,
    level: 6,
    xp: 130,
    latitude: 32.0835,
    longitude: 34.7805,
    location_name: 'Bamboo Tea Corner (0.4 km)',
    badges: ['Generous Trader 🎁', 'Punctual Meetup 📍'],
  },
  {
    id: 'user-community-1',
    username: 'koko_koala',
    display_name: 'Koko Koala',
    avatar_emoji: '🐨',
    title_badge: 'Vinyl Archivist 💿',
    bio: 'Always down to trade vinyl records, vintage jackets, and art prints.',
    karma_score: 4.88,
    karma_points: 375,
    karma_reviews_count: 10,
    completed_trades: 8,
    level: 5,
    xp: 160,
    latitude: 32.0872,
    longitude: 34.7832,
    location_name: 'Eucalyptus Grove (0.5 km)',
    badges: ['Cozy Communicator 💬'],
  },
];

export const INITIAL_FRIENDS: FriendConnection[] = [
  {
    id: 'friend-1',
    friend_id: 'user-milo-02',
    friend_username: 'milo_beans',
    friend_name: 'Milo Bear',
    friend_avatar: '🐻',
    friend_title: 'Guild Master 👑',
    friend_level: 11,
    friend_karma: 4.98,
    friend_location: 'Acorn Park',
    status: 'friends',
    online_status: 'Online Now 🟢',
    mutual_trades: 3,
    buddy_note: 'Best trade buddy for Nintendo & camera gear!',
    created_at: '2 weeks ago',
  },
  {
    id: 'friend-2',
    friend_id: 'user-luna-03',
    friend_username: 'luna_sprout',
    friend_name: 'Luna Bunny',
    friend_avatar: '🐰',
    friend_title: 'Crafty Artisan 🎨',
    friend_level: 5,
    friend_karma: 4.85,
    friend_location: 'Berry Creek Cafe',
    status: 'friends',
    online_status: 'At the Plaza 🌿',
    mutual_trades: 2,
    buddy_note: 'Met at Berry Creek Cafe for a plant swap!',
    created_at: '5 days ago',
  },
  {
    id: 'friend-3',
    friend_id: 'user-pip-04',
    friend_username: 'pip_arcade',
    friend_name: 'Pip Frog',
    friend_avatar: '🐸',
    friend_title: 'Gadget Scout 🕹️',
    friend_level: 4,
    friend_karma: 4.79,
    friend_location: 'Harbor Boardwalk',
    status: 'incoming',
    online_status: 'Online Now 🟢',
    mutual_trades: 1,
    buddy_note: 'Hey Maple! Let’s be Trade Buddies so we can see each other’s new drops!',
    created_at: '10 mins ago',
  },
];

export const INITIAL_ITEMS: TradeItem[] = [
  // Current user's pocket inventory items
  {
    id: 'item-my-1',
    owner_id: 'user-me-01',
    owner_name: 'Maple Fox',
    owner_avatar: '🦊',
    owner_karma: 4.94,
    owner_level: 7,
    title: 'Atomic Purple GameBoy Color (IPS Mod)',
    description:
      'Backlit IPS screen mod with rechargeable USB-C battery! Plays like a dream, includes Zelda Oracle of Ages.',
    category: 'Gaming',
    condition: 'Mint ✨',
    rarity: 'Legendary',
    year_made: 1998,
    brand: 'Nintendo (Custom IPS)',
    accessories_included: 'Pouch + Zelda Cartridge + USB-C Cable',
    condition_notes:
      'Original 1998 Atomic Purple shell cleaned ultrasonically, brand new laminated glass IPS screen with 0 dead pixels.',
    media_url:
      'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint:
      'Looking for an instant camera, custom mechanical keyboard, or vinyl player!',
    is_for_trade: true,
    latitude: 32.0853,
    longitude: 34.7818,
    location_name: 'Sunny Leaf District',
    likes_count: 24,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'item-my-2',
    owner_id: 'user-me-01',
    owner_name: 'Maple Fox',
    owner_avatar: '🦊',
    owner_karma: 4.94,
    owner_level: 7,
    title: 'Matcha Keycap 65% Wireless Mechanical Keyboard',
    description:
      'Lubed tactile switches with creamy thock sound! Comes with coiled aviator cable and box.',
    category: 'Gadgets',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2024,
    brand: 'Keychron / Custom Matcha',
    accessories_included: 'Original Box + Coiled Aviator Cable + Keycap Puller',
    condition_notes:
      'Used for 2 weeks on a desk mat. All switches hand-lubed with Krytox 205g0.',
    media_url:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Open to headphones, Switch games, or cool desk decor',
    is_for_trade: true,
    latitude: 32.0853,
    longitude: 34.7818,
    location_name: 'Sunny Leaf District',
    likes_count: 17,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'item-my-3',
    owner_id: 'user-me-01',
    owner_name: 'Maple Fox',
    owner_avatar: '🦊',
    owner_karma: 4.94,
    owner_level: 7,
    title: 'Monstera Thai Constellation (Variegated Pot)',
    description:
      'Healthy rooted plant in a handmade terracotta pot with 4 creamy variegated leaves.',
    category: 'Home & Cozy',
    condition: 'Mint ✨',
    rarity: 'Rare',
    year_made: 2025,
    brand: 'Botanical Nursery',
    accessories_included: 'Handmade Terracotta Pot + Saucer + Care Card',
    condition_notes:
      'Fully rooted in chunky aroid mix, newest leaf just unfurled with high cream variegation!',
    media_url:
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Art books, ceramics, or board games!',
    is_for_trade: true,
    latitude: 32.0853,
    longitude: 34.7818,
    location_name: 'Sunny Leaf District',
    likes_count: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
  },

  // Nearby traders' items
  {
    id: 'item-milo-1',
    owner_id: 'user-milo-02',
    owner_name: 'Milo Bear',
    owner_avatar: '🐻',
    owner_karma: 4.98,
    owner_level: 11,
    title: 'Fujifilm Instax Mini Evo Hybrid Camera + 2 Film Packs',
    description:
      'Retro dial controls, prints real instant photos & saves digital copies! Barely used, includes leather strap.',
    category: 'Gadgets',
    condition: 'Mint ✨',
    rarity: 'Legendary',
    year_made: 2023,
    brand: 'Fujifilm',
    accessories_included: 'Original Box + Leather Strap + 20 Instant Film Sheets',
    condition_notes:
      'Shutter count under 40 shots! Lens glass is spotless, battery holds 100% charge.',
    media_url:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint:
      'Looking for retro GameBoy / handheld consoles or vintage lenses!',
    is_for_trade: true,
    latitude: 32.0892,
    longitude: 34.7865,
    location_name: 'Acorn Park',
    likes_count: 31,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'item-luna-1',
    owner_id: 'user-luna-03',
    owner_name: 'Luna Bunny',
    owner_avatar: '🐰',
    owner_karma: 4.85,
    owner_level: 5,
    title: 'Marshall Major IV Wireless On-Ear Headphones (Brown)',
    description:
      '80+ hours of wireless playtime, warm vintage sound signature, folds up into a tiny square.',
    category: 'Gadgets',
    condition: 'Great 🌿',
    rarity: 'Epic',
    year_made: 2022,
    brand: 'Marshall Audio',
    accessories_included: 'Coiled 3.5mm Audio Cord + USB-C Cable',
    condition_notes:
      'Ear cushions are soft and clean with zero peeling. Brass control knob works smoothly.',
    media_url:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Would love a mechanical keyboard or rare houseplants!',
    is_for_trade: true,
    latitude: 32.0795,
    longitude: 34.7772,
    location_name: 'Berry Creek Cafe',
    likes_count: 19,
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  {
    id: 'item-pip-1',
    owner_id: 'user-pip-04',
    owner_name: 'Pip Frog',
    owner_avatar: '🐸',
    owner_karma: 4.79,
    owner_level: 4,
    title: 'Teenage Engineering PO-33 K.O! Pocket Sampler (Video Demo)',
    description:
      'Micro sampler with built-in microphone and 40 second sample memory. Watch the video showcase!',
    category: 'Gadgets',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2021,
    brand: 'Teenage Engineering',
    accessories_included: 'Silicone Pro Case + Sync Cables + Box',
    condition_notes:
      'Top hanger tab intact! LCD screen crisp, all 16 mechanical buttons click cleanly.',
    media_url:
      'https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-nightclub-43451-large.mp4',
    media_type: 'video',
    wishlist_hint: 'Trading for gaming gear, collectibles, or sneakers!',
    is_for_trade: true,
    latitude: 32.0945,
    longitude: 34.7912,
    location_name: 'Harbor Boardwalk',
    likes_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'item-milo-2',
    owner_id: 'user-milo-02',
    owner_name: 'Milo Bear',
    owner_avatar: '🐻',
    owner_karma: 4.98,
    owner_level: 11,
    title: 'Catan 3D Collector Edition Board Game',
    description:
      'Hand-painted sculpted terrain tiles in collector chest. Played twice with sleeves on all cards!',
    category: 'Gaming',
    condition: 'Mint ✨',
    rarity: 'Legendary',
    year_made: 2021,
    brand: 'Catan Studio',
    accessories_included: 'Complete in Collector Box + Card Sleeves',
    condition_notes:
      '100% complete piece count verified. All resource cards kept in matte protective sleeves.',
    media_url:
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Open to multi-item trades or retro gaming gear',
    is_for_trade: true,
    latitude: 32.0888,
    longitude: 34.785,
    location_name: 'Acorn Park',
    likes_count: 22,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'item-luna-2',
    owner_id: 'user-luna-03',
    owner_name: 'Luna Bunny',
    owner_avatar: '🐰',
    owner_karma: 4.85,
    owner_level: 5,
    title: 'Studio Ghibli Hardcover Concept Art Anthology',
    description:
      'Full-color Japanese & English artbook bundle featuring Spirited Away and Howl’s Moving Castle sketches.',
    category: 'Books & Art',
    condition: 'Mint ✨',
    rarity: 'Rare',
    year_made: 2019,
    brand: 'Viz Media / Studio Ghibli',
    accessories_included: 'Hardcover Slipcase + Obi Strip + Art Postcards',
    condition_notes:
      'No spine creases or dog-eared pages. Stored in a smoke-free bookshelf away from sunlight.',
    media_url:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Plants, cozy lamps, or vinyl records!',
    is_for_trade: true,
    latitude: 32.0801,
    longitude: 34.7785,
    location_name: 'Berry Creek Cafe',
    likes_count: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
  },
  {
    id: 'item-pip-2',
    owner_id: 'user-pip-04',
    owner_name: 'Pip Frog',
    owner_avatar: '🐸',
    owner_karma: 4.79,
    owner_level: 4,
    title: 'Nike Dunk Low Matcha Edition (Size 10)',
    description:
      'Worn twice indoors, comes with original box and both cream & forest green laces.',
    category: 'Fashion',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2023,
    brand: 'Nike Sportswear',
    accessories_included: 'Original Box + Extra Cream Laces + Receipt',
    condition_notes:
      'Zero heel drag or toe box creasing. Soles wiped clean after 2 indoor wears.',
    media_url:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Vintage jackets, watches, or audio gear!',
    is_for_trade: true,
    latitude: 32.0921,
    longitude: 34.789,
    location_name: 'Harbor Boardwalk',
    likes_count: 34,
    created_at: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
  },
  {
    id: 'item-milo-3',
    owner_id: 'user-milo-02',
    owner_name: 'Milo Bear',
    owner_avatar: '🐻',
    owner_karma: 4.98,
    owner_level: 11,
    title: 'LEGO Botanical Bonsai Tree Set (Complete)',
    description:
      'Includes both green leaf & pink cherry blossom frog canopies! Built once for display.',
    category: 'Collectibles',
    condition: 'Mint ✨',
    rarity: 'Rare',
    year_made: 2022,
    brand: 'LEGO Icons',
    accessories_included: 'Box + Instruction Manual + Pink & Green Leaves',
    condition_notes: 'All 878 pieces sorted in zip bags ready for you to build!',
    media_url:
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Other LEGO sets, board games, or cozy mugs!',
    is_for_trade: true,
    latitude: 32.0875,
    longitude: 34.784,
    location_name: 'Acorn Park',
    likes_count: 18,
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
  {
    id: 'item-luna-3',
    owner_id: 'user-luna-03',
    owner_name: 'Luna Bunny',
    owner_avatar: '🐰',
    owner_karma: 4.85,
    owner_level: 5,
    title: 'Fellow Stagg EKG Electric Pour-Over Kettle (Matte Cream)',
    description:
      'Variable temperature control with gooseneck spout for specialty coffee brewing.',
    category: 'Home & Cozy',
    condition: 'Great 🌿',
    rarity: 'Epic',
    year_made: 2023,
    brand: 'Fellow Products',
    accessories_included: 'PID Base + Wooden Handle Upgrade',
    condition_notes:
      'Descaled monthly with filtered water only. Heats to 96°C in under 3 minutes.',
    media_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Ceramic dinnerware, art prints, or plants!',
    is_for_trade: true,
    latitude: 32.0812,
    longitude: 34.779,
    location_name: 'Berry Creek Cafe',
    likes_count: 27,
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
  {
    id: 'item-koko-music-1',
    owner_id: 'user-community-1',
    owner_name: 'Koko Koala',
    owner_avatar: '🐨',
    owner_karma: 4.88,
    owner_level: 5,
    title: 'Fender Ukulele & Vintage Vinyl Record Bundle (4 LPs)',
    description:
      'Solid mahogany concert ukulele with padded gig bag plus 4 classic city-pop & jazz vinyl records.',
    category: 'Music & Audio',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2021,
    brand: 'Fender / Sony Music',
    accessories_included: 'Padded Gig Bag + Clip-On Tuner + 4 Vinyl LPs',
    condition_notes:
      'Fresh Aquila strings installed, vinyl sleeves and records graded NM (Near Mint).',
    media_url:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Looking for studio headphones, synth pedals, or art books!',
    is_for_trade: true,
    latitude: 32.0872,
    longitude: 34.7832,
    location_name: 'Eucalyptus Grove',
    likes_count: 23,
    created_at: new Date(Date.now() - 1000 * 60 * 640).toISOString(),
  },
  {
    id: 'item-boba-sports-1',
    owner_id: 'user-community-0',
    owner_name: 'Boba Panda',
    owner_avatar: '🐼',
    owner_karma: 4.91,
    owner_level: 6,
    title: 'Penny Cruiser Pastels Skateboard & Bell Bike Helmet',
    description:
      'Smooth ABEC-7 bearings with soft 59mm cruiser wheels — glides over sidewalk cracks effortlessly.',
    category: 'Sports & Outdoors',
    condition: 'Great 🌿',
    rarity: 'Rare',
    year_made: 2023,
    brand: 'Penny Skateboards',
    accessories_included: 'Skate Tool + Matte Cream Helmet',
    condition_notes:
      'Bearings freshly cleaned and oiled, wheels have 95% tread remaining.',
    media_url:
      'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Camping hammock, retro games, or water bottle!',
    is_for_trade: true,
    latitude: 32.0835,
    longitude: 34.7805,
    location_name: 'Bamboo Tea Corner',
    likes_count: 16,
    created_at: new Date(Date.now() - 1000 * 60 * 680).toISOString(),
  },
  {
    id: 'item-milo-toys-1',
    owner_id: 'user-milo-02',
    owner_name: 'Milo Bear',
    owner_avatar: '🐻',
    owner_karma: 4.98,
    owner_level: 11,
    title: 'Wingspan Board Game + European Expansion Set',
    description:
      'Cozy engine-building bird sanctuary board game with wooden dice tower, pastel eggs, and linen cards.',
    category: 'Toys & Board Games',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2022,
    brand: 'Stonemaier Games',
    accessories_included: 'Base Game + Expansion + Wooden Birdhouse Dice Tower',
    condition_notes:
      'All cards sleeved from day one! Complete with all food tokens and scorepads.',
    media_url:
      'https://images.unsplash.com/photo-1632501641765-e568d28b0015?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Other tabletop games, puzzles, or collectibles!',
    is_for_trade: true,
    latitude: 32.0892,
    longitude: 34.7865,
    location_name: 'Acorn Park',
    likes_count: 25,
    created_at: new Date(Date.now() - 1000 * 60 * 710).toISOString(),
  },
  {
    id: 'item-luna-crafts-1',
    owner_id: 'user-luna-03',
    owner_name: 'Luna Bunny',
    owner_avatar: '🐰',
    owner_karma: 4.85,
    owner_level: 5,
    title: 'Complete Punch Needle & Merino Yarn Craft Chest',
    description:
      '18 skeins of soft pastel merino wool yarn, adjustable wooden embroidery hoops, and Oxford punch needles.',
    category: 'Crafts & DIY',
    condition: 'Mint ✨',
    rarity: 'Rare',
    year_made: 2024,
    brand: 'DMC / Artisan Wool',
    accessories_included: 'Wooden Storage Box + 18 Yarn Skeins + 3 Hoops',
    condition_notes: 'Brand new unused skeins in a cedar organizer chest.',
    media_url:
      'https://images.unsplash.com/photo-1584992236310-6edddc08a227?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Watercolor paints, ceramics, or botanical books!',
    is_for_trade: true,
    latitude: 32.0795,
    longitude: 34.7772,
    location_name: 'Berry Creek Cafe',
    likes_count: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 740).toISOString(),
  },
  {
    id: 'item-koko-kids-1',
    owner_id: 'user-community-1',
    owner_name: 'Koko Koala',
    owner_avatar: '🐨',
    owner_karma: 4.88,
    owner_level: 5,
    title: 'Montessori Wooden Rainbow Stacker & Balance Train',
    description:
      'Handcrafted beechwood pastel rainbow arches and magnetic wooden animal train set for toddlers.',
    category: 'Baby & Kids',
    condition: 'Mint ✨',
    rarity: 'Rare',
    year_made: 2023,
    brand: 'Grimm’s / Lovevery Style',
    accessories_included: '12 Rainbow Arches + Wooden Train + Cotton Bag',
    condition_notes:
      'Non-toxic water-based stain, sanitized and kept in a pet-free nursery.',
    media_url:
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Children’s picture books, plushies, or cozy home items!',
    is_for_trade: true,
    latitude: 32.0872,
    longitude: 34.7832,
    location_name: 'Eucalyptus Grove',
    likes_count: 20,
    created_at: new Date(Date.now() - 1000 * 60 * 770).toISOString(),
  },
  {
    id: 'item-pip-tools-1',
    owner_id: 'user-pip-04',
    owner_name: 'Pip Frog',
    owner_avatar: '🐸',
    owner_karma: 4.79,
    owner_level: 4,
    title: 'iFixit Pro Tech Toolkit + Japanese Bonsai Pruning Shears',
    description:
      '64-bit precision magnetic driver kit for consoles/laptops plus forged carbon-steel garden shears.',
    category: 'Tools & Garden',
    condition: 'Mint ✨',
    rarity: 'Epic',
    year_made: 2023,
    brand: 'iFixit / Wazakura Japan',
    accessories_included: 'Magnetic Bit Case + ESD Tweezers + Canvas Roll',
    condition_notes:
      'All 64 S2 steel bits present and magnetized. Shears oiled and razor sharp.',
    media_url:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    media_type: 'image',
    wishlist_hint: 'Retro cartridges, soldering gear, or outdoor tools!',
    is_for_trade: true,
    latitude: 32.0945,
    longitude: 34.7912,
    location_name: 'Harbor Boardwalk',
    likes_count: 21,
    created_at: new Date(Date.now() - 1000 * 60 * 800).toISOString(),
  },
];

export function generateCommunityWave(
  baseLat: number,
  baseLng: number,
  batchNumber: number
): TradeItem[] {
  const templates = [
    {
      title: 'Analogue Pocket Limited Transparent Edition',
      category: 'Gaming' as const,
      rarity: 'Legendary' as const,
      year_made: 2023,
      brand: 'Analogue',
      accessories_included: 'Hard Case + Glass Screen Protector',
      condition_notes: 'Factory screen protector applied out of the box.',
      img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      wants: 'Synthesizers, camera lenses, or rare cartridges',
    },
    {
      title: 'Carhartt WIP Vintage Detroit Canvas Jacket',
      category: 'Fashion' as const,
      rarity: 'Epic' as const,
      year_made: 1996,
      brand: 'Carhartt WIP',
      accessories_included: 'Authentic Blanket Lining',
      condition_notes: 'Beautiful natural 90s fade, zipper works smoothly.',
      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      wants: 'Sneakers, denim, or backpacks',
    },
    {
      title: 'Tamagotchi Connection V3 Translucent Shell',
      category: 'Collectibles' as const,
      rarity: 'Rare' as const,
      year_made: 2006,
      brand: 'Bandai',
      accessories_included: 'New CR2032 Battery + Charm Strap',
      condition_notes: 'Sound and IR port tested and working 100%.',
      img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
      wants: 'Plushies, pins, or cozy desk toys',
    },
    {
      title: 'Daft Punk Discovery Gatefold 2xLP Vinyl Record',
      category: 'Books & Art' as const,
      rarity: 'Epic' as const,
      year_made: 2001,
      brand: 'Virgin Records',
      accessories_included: 'Gatefold Sleeve + Anti-Static Inner Sleeves',
      condition_notes: 'Media graded NM (Near Mint), zero skips.',
      img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
      wants: 'Other vinyl albums or studio headphones',
    },
  ];

  const avatars = ['🐼', '🐨', '🦉', '🦦', '🐹', '🦝'];
  const names = [
    'Boba Panda',
    'Koko Koala',
    'Ollie Owl',
    'Otto Otter',
    'Mochi Hamster',
    'Bandit Raccoon',
  ];

  return templates.map((tpl, idx) => {
    const traderIdx = (batchNumber + idx) % avatars.length;
    return {
      id: `wave-${Date.now()}-${batchNumber}-${idx}`,
      owner_id: `user-community-${traderIdx}`,
      owner_name: names[traderIdx],
      owner_avatar: avatars[traderIdx],
      owner_karma: Number((4.75 + (idx % 3) * 0.08).toFixed(2)),
      owner_level: 3 + ((batchNumber + idx) % 9),
      title: `${tpl.title} #${batchNumber * 4 + idx + 1}`,
      description:
        'Freshly listed by a nearby villager! WebP compressed for fast mobile browsing.',
      category: tpl.category,
      condition: idx % 2 === 0 ? 'Mint ✨' : 'Great 🌿',
      rarity: tpl.rarity,
      year_made: tpl.year_made,
      brand: tpl.brand,
      accessories_included: tpl.accessories_included,
      condition_notes: tpl.condition_notes,
      media_url: tpl.img,
      media_type: 'image',
      wishlist_hint: tpl.wants,
      is_for_trade: true,
      latitude: baseLat + (Math.random() - 0.5) * 0.025,
      longitude: baseLng + (Math.random() - 0.5) * 0.025,
      location_name: 'Nearby Village Plaza',
      likes_count: 5 + ((batchNumber * 3 + idx * 7) % 30),
      created_at: new Date().toISOString(),
    };
  });
}

export const INITIAL_TRADES: TradeOffer[] = [
  {
    id: 'trade-demo-1',
    sender_id: 'user-luna-03',
    sender_name: 'Luna Bunny',
    sender_avatar: '🐰',
    sender_karma: 4.85,
    receiver_id: 'user-me-01',
    receiver_name: 'Maple Fox',
    receiver_avatar: '🦊',
    requested_item_id: 'item-my-2', // Matcha Mechanical Keyboard
    offered_item_ids: ['item-luna-1', 'item-luna-2'], // Marshall Headphones + Studio Ghibli Artbook
    message:
      'Hey Maple! 🦊 I saw your Matcha 65% Keyboard and fell in love! Offering my Marshall Major IV headphones + Studio Ghibli Art Anthology (2-for-1!). Can meet at Berry Creek Cafe!',
    status: 'pending',
    counter_count: 0,
    last_actor_name: 'Luna Bunny',
    meetup_distance_km: 0.78,
    messages: [
      {
        id: 'msg-1',
        trade_id: 'trade-demo-1',
        sender_id: 'user-luna-03',
        sender_name: 'Luna Bunny',
        sender_avatar: '🐰',
        text: 'Hey Maple! Does the Matcha keyboard still have the coiled aviator cable from 2024?',
        created_at: '20 mins ago',
      },
      {
        id: 'msg-2',
        trade_id: 'trade-demo-1',
        sender_id: 'user-me-01',
        sender_name: 'Maple Fox',
        sender_avatar: '🦊',
        text: 'Hi Luna! Yes it does, plus the original box and extra keycaps! Feel free to ask anything or counter-offer 😊',
        created_at: '15 mins ago',
      },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

export const INITIAL_KARMA_REVIEWS: KarmaReview[] = [
  {
    id: 'rev-1',
    trade_id: 'trade-past-1',
    reviewer_id: 'user-milo-02',
    reviewer_name: 'Milo Bear',
    reviewer_avatar: '🐻',
    target_user_id: 'user-me-01',
    stars: 5,
    vibe_badge: 'Item Exactly as Described ✨',
    comment:
      'Swapped a Zelda cartridge with Maple at Acorn Park! Super friendly, arrived right on time, and item was spotless.',
    created_at: '2 days ago',
  },
  {
    id: 'rev-2',
    trade_id: 'trade-past-2',
    reviewer_id: 'user-luna-03',
    reviewer_name: 'Luna Bunny',
    reviewer_avatar: '🐰',
    target_user_id: 'user-me-01',
    stars: 5,
    vibe_badge: 'Generous Trader 🎁',
    comment:
      'Maple even included a cute sticker pack with the trade! 10/10 cozy trader.',
    created_at: '5 days ago',
  },
  {
    id: 'rev-3',
    trade_id: 'trade-past-3',
    reviewer_id: 'user-pip-04',
    reviewer_name: 'Pip Frog',
    reviewer_avatar: '🐸',
    target_user_id: 'user-me-01',
    stars: 5,
    vibe_badge: 'Fast & Friendly ⚡',
    comment: 'Quickest local trade ever, great communication!',
    created_at: '1 week ago',
  },
];
