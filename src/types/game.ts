export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type ItemCategory =
  | 'All'
  | 'Gaming'
  | 'Gadgets'
  | 'Collectibles'
  | 'Fashion'
  | 'Books & Art'
  | 'Home & Cozy';

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
  is_counter_event?: boolean;
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
