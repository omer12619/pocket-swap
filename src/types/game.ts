export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export const MAX_POCKET_ITEMS = 20;

export type ItemCategory =
  | 'All'
  | 'Gaming'
  | 'Gadgets'
  | 'Collectibles'
  | 'Fashion'
  | 'Books & Art'
  | 'Home & Cozy'
  | 'Music & Audio'
  | 'Sports & Outdoors'
  | 'Toys & Board Games'
  | 'Crafts & DIY'
  | 'Baby & Kids'
  | 'Tools & Garden';

export const ITEM_CATEGORIES: Exclude<ItemCategory, 'All'>[] = [
  'Gaming',
  'Gadgets',
  'Collectibles',
  'Fashion',
  'Books & Art',
  'Home & Cozy',
  'Music & Audio',
  'Sports & Outdoors',
  'Toys & Board Games',
  'Crafts & DIY',
  'Baby & Kids',
  'Tools & Garden',
];

export const ALL_CATEGORIES: ItemCategory[] = ['All', ...ITEM_CATEGORIES];

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  All: '✨',
  Gaming: '🎮',
  Gadgets: '📱',
  Collectibles: '🃏',
  Fashion: '👟',
  'Books & Art': '📚',
  'Home & Cozy': '🪴',
  'Music & Audio': '🎸',
  'Sports & Outdoors': '🚲',
  'Toys & Board Games': '🎲',
  'Crafts & DIY': '🧶',
  'Baby & Kids': '🧸',
  'Tools & Garden': '🛠️',
};

export type ItemCondition =
  | 'Mint ✨'
  | 'Great 🌿'
  | 'Well-Loved 🧸'
  | 'Needs TLC 🛠️';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  title_badge: string;
  bio: string;
  karma_score: number;
  karma_points: number;
  karma_reviews_count: number;
  completed_trades: number;
  level: number;
  xp: number;
  latitude: number;
  longitude: number;
  location_name: string;
  badges: string[];
  email?: string;
  passcode_pin?: string;
}

export interface FriendConnection {
  id: string;
  friend_id: string;
  friend_username: string;
  friend_name: string;
  friend_avatar: string;
  friend_title: string;
  friend_level: number;
  friend_karma: number;
  friend_location: string;
  status: 'friends' | 'incoming' | 'outgoing';
  online_status: 'Online Now 🟢' | 'At the Plaza 🌿' | 'Offline 🌙';
  mutual_trades: number;
  buddy_note?: string;
  created_at: string;
}

export interface ItemComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  is_owner_reply?: boolean;
  created_at: string;
}

export interface WantedPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_level: number;
  user_karma: number;
  looking_for: string;
  category: Exclude<ItemCategory, 'All'>;
  offering_hint: string;
  location_name: string;
  created_at: string;
}

export interface TradeItem {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar: string;
  owner_karma: number;
  owner_level: number;
  title: string;
  description: string;
  category: Exclude<ItemCategory, 'All'>;
  condition: ItemCondition;
  rarity: ItemRarity;
  // Detailed Item Specs & Provenance
  year_made: number;
  brand: string;
  accessories_included: string;
  condition_notes: string;
  media_url: string;
  media_type: 'image' | 'video';
  gallery_urls?: string[];
  comments?: ItemComment[];
  wishlist_hint: string;
  is_for_trade: boolean;
  latitude: number;
  longitude: number;
  location_name: string;
  distance_km?: number;
  likes_count: number;
  created_at: string;
}

export interface TradeChatMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  attachment_url?: string;
  is_counter_event?: boolean;
  is_meetup_event?: boolean;
  created_at: string;
}

export interface TradeOffer {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  sender_karma: number;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar: string;
  requested_item_id: string;
  offered_item_ids: string[];
  message: string;
  status: 'pending' | 'countered' | 'accepted' | 'declined' | 'completed';
  counter_count: number;
  last_actor_name?: string;
  meetup_distance_km: number;
  meetup_spot_name?: string;
  meetup_spot_address?: string;
  meetup_time_slot?: string;
  meetup_lat?: number;
  meetup_lng?: number;
  messages: TradeChatMessage[];
  created_at: string;
  rated_by_user?: boolean;
}

export interface KarmaReview {
  id: string;
  trade_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  target_user_id: string;
  stars: number;
  vibe_badge: string;
  comment: string;
  created_at: string;
}
