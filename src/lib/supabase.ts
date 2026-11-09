import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  FriendConnection,
  KarmaReview,
  TradeItem,
  TradeOffer,
  UserProfile,
  WantedPost,
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
  const savedUrl =
    localStorage.getItem('pocketswap_supabase_url') || envUrl || '';
  const savedKey =
    localStorage.getItem('pocketswap_supabase_key') || envKey || '';
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
  wantedPosts?: WantedPost[];
  friends?: FriendConnection[];
  deletedItemIds?: string[];
  updatedAt: string;
}

const getApiBaseUrl = (): string => {
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    (import.meta.env.DEV ? 'http://localhost:3001' : '')
  );
};

export async function saveCloudStateToSupabase(
  state: CloudAppState
): Promise<boolean> {
  try {
    const apiBase = getApiBaseUrl();
    const apiRes = await fetch(`${apiBase}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (apiRes.ok) return true;
  } catch {
    // Fall back to direct Supabase client
  }

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
  try {
    const apiBase = getApiBaseUrl();
    const apiRes = await fetch(`${apiBase}/api/state?t=${Date.now()}`);
    if (apiRes.ok) {
      const data = (await apiRes.json()) as CloudAppState;
      if (data && Array.isArray(data.items)) {
        return data;
      }
    }
  } catch {
    // Fall back to direct public storage URL
  }

  const { url } = getStoredSupabaseConfig();
  if (!url) return null;
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/item-media/cloud-db/state.json?t=${Date.now()}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as CloudAppState;
    if (data && Array.isArray(data.items)) {
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
  try {
    let dataUrl = '';
    if (typeof dataUrlOrFile === 'string') {
      if (!dataUrlOrFile.startsWith('data:')) {
        return dataUrlOrFile;
      }
      dataUrl = dataUrlOrFile;
    } else {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(dataUrlOrFile);
      });
    }

    const apiBase = getApiBaseUrl();
    const apiRes = await fetch(`${apiBase}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, ext }),
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json?.publicUrl) return json.publicUrl;
    }
  } catch {
    // Fall back to direct Supabase upload
  }

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

function getOrCreateDeviceUser(): UserProfile {
  let uid = 'user-founder-01';
  let suffix = '01';
  if (typeof window !== 'undefined' && window.localStorage) {
    const existingUid = localStorage.getItem('pocketswap_device_uid');
    if (existingUid) {
      uid = existingUid;
      suffix = existingUid.slice(-4);
    } else {
      const rand = Math.random().toString(36).slice(2, 8);
      uid = `villager-${Date.now().toString(36)}-${rand}`;
      suffix = rand.slice(0, 4);
      localStorage.setItem('pocketswap_device_uid', uid);
    }
  }
  return {
    id: uid,
    username: `villager_${suffix}`,
    display_name: `Villager #${suffix.toUpperCase()}`,
    avatar_emoji: '🦊',
    title_badge: 'Founding Villager 🌱',
    bio: 'New to PocketSwap! Ready to swap local items in my neighborhood.',
    karma_score: 5.0,
    karma_points: 100,
    karma_reviews_count: 0,
    completed_trades: 0,
    level: 1,
    xp: 0,
    latitude: 32.0853,
    longitude: 34.7818,
    location_name: 'Local Neighborhood',
    badges: ['🌱 Founding Villager'],
  };
}

export const INITIAL_CURRENT_USER: UserProfile = getOrCreateDeviceUser();

export const INITIAL_PROFILES: UserProfile[] = [INITIAL_CURRENT_USER];

export const INITIAL_FRIENDS: FriendConnection[] = [];

export const INITIAL_ITEMS: TradeItem[] = [];

export const INITIAL_TRADES: TradeOffer[] = [];

export const INITIAL_KARMA_REVIEWS: KarmaReview[] = [];
