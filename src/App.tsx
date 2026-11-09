import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Compass,
  Radio,
  Plus,
  ArrowLeftRight,
  User,
  Backpack,
  Star,
  MapPin,
  Sparkles,
  Trophy,
  Check,
  Database,
  Search,
  Smartphone,
  Monitor,
  Zap,
  Loader2,
  Users,
  MessageCircle,
  RefreshCw,
  Edit3,
  UserPlus,
  UserCheck,
  Bell,
  Share2,
  Navigation,
  Flame,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ALL_CATEGORIES,
  CATEGORY_ICONS,
  FriendConnection,
  ItemCategory,
  ItemComment,
  ItemRarity,
  KarmaReview,
  MAX_POCKET_ITEMS,
  TradeChatMessage,
  TradeItem,
  TradeOffer,
  UserProfile,
  WantedPost,
} from './types/game';
import {
  calculateDistanceKm,
  getSupabaseClient,
  INITIAL_CURRENT_USER,
  INITIAL_FRIENDS,
  INITIAL_ITEMS,
  INITIAL_KARMA_REVIEWS,
  INITIAL_PROFILES,
  INITIAL_TRADES,
  loadCloudStateFromSupabase,
  saveCloudStateToSupabase,
  uploadItemMediaToSupabase,
} from './lib/supabase';
import { MagicGameCard } from './components/magic/MagicGameCard';
import { TradeArenaModal } from './components/magic/TradeArenaModal';
import { UploadItemModal } from './components/magic/UploadItemModal';
import { RadarMapView } from './components/magic/RadarMapModal';
import { KarmaRateModal } from './components/magic/KarmaRateModal';
import { SupabaseConfigModal } from './components/magic/SupabaseConfigModal';
import { ItemDetailModal } from './components/magic/ItemDetailModal';
import { TradeChatAndCounterModal } from './components/magic/TradeChatAndCounterModal';
import { MeetupPinModal } from './components/magic/MeetupPinModal';
import { EditProfileModal } from './components/magic/EditProfileModal';
import { FriendsListModal } from './components/magic/FriendsListModal';
import {
  CozyQuest,
  QuestsAndRewardsModal,
} from './components/magic/QuestsAndRewardsModal';
import { SwipeMatchModal } from './components/magic/SwipeMatchModal';
import { AuthPassportModal } from './components/magic/AuthPassportModal';
import { ActivityFeedModal } from './components/magic/ActivityFeedModal';
import { ShareQrModal } from './components/magic/ShareQrModal';
import { WantedBoardModal } from './components/magic/WantedBoardModal';
import {
  isSoundEnabled,
  playCozySound,
  setSoundEnabled,
} from './lib/gameAudio';

type ActiveTab = 'explore' | 'radar' | 'pocket' | 'trades' | 'passport';
type SortMode =
  | 'closest'
  | 'matches'
  | 'friends'
  | 'rarity'
  | 'vintage'
  | 'saved';

const CATEGORIES: ItemCategory[] = ALL_CATEGORIES;

const RARITY_WEIGHT: Record<ItemRarity, number> = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
};

const PAGE_SIZE = 6;

const INITIAL_WANTED_POSTS: WantedPost[] = [];

export function App() {
  useEffect(() => {
    // Purge legacy demo localStorage keys so all returning browsers start clean
    const legacyKeys = [
      'pocketswap_user',
      'pocketswap_profiles_v2',
      'pocketswap_friends_v1',
      'pocketswap_items_v2',
      'pocketswap_trades_v2',
      'pocketswap_reviews',
      'pocketswap_wanted_v1',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pocketswap_user_v3');
    if (saved) {
      const parsed = JSON.parse(saved) as UserProfile;
      // Ensure every visitor has a unique device user ID instead of sharing 'user-founder-01'
      if (parsed && parsed.id && parsed.id !== 'user-founder-01') {
        return parsed;
      }
    }
    return INITIAL_CURRENT_USER;
  });

  const [deletedItemIds, setDeletedItemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pocketswap_deleted_items_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('pocketswap_profiles_v3');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [friends, setFriends] = useState<FriendConnection[]>(() => {
    const saved = localStorage.getItem('pocketswap_friends_v3');
    return saved ? JSON.parse(saved) : INITIAL_FRIENDS;
  });

  const [items, setItems] = useState<TradeItem[]>(() => {
    const saved = localStorage.getItem('pocketswap_items_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    return INITIAL_ITEMS;
  });

  const [trades, setTrades] = useState<TradeOffer[]>(() => {
    const saved = localStorage.getItem('pocketswap_trades_v3');
    return saved ? JSON.parse(saved) : INITIAL_TRADES;
  });

  const [reviews, setReviews] = useState<KarmaReview[]>(() => {
    const saved = localStorage.getItem('pocketswap_reviews_v3');
    return saved ? JSON.parse(saved) : INITIAL_KARMA_REVIEWS;
  });

  const [likedItemIds, setLikedItemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pocketswap_liked_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pocketswap_blocked_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pocketswap_claimed_quests');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation, Sort & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('All');
  const [sortMode, setSortMode] = useState<SortMode>('closest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchFilter, setCategorySearchFilter] = useState('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const [radarRadiusKm, setRadarRadiusKm] = useState<number>(10);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'locating' | 'locked' | 'simulated'
  >('idle');
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pocketswap_view_mode');
    if (saved === 'mobile') return true;
    if (saved === 'desktop') return false;
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [showDevTools, setShowDevTools] = useState<boolean>(false);

  const handleSetViewMode = (isMobileFrame: boolean) => {
    setPhoneFrameMode(isMobileFrame);
    localStorage.setItem(
      'pocketswap_view_mode',
      isMobileFrame ? 'mobile' : 'desktop'
    );
  };

  // Infinite Scroll & Pagination State
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [tradeTargetItem, setTradeTargetItem] = useState<TradeItem | null>(null);
  const [inspectedItem, setInspectedItem] = useState<TradeItem | null>(null);
  const [activeChatTradeId, setActiveChatTradeId] = useState<string | null>(null);
  const [chatModalInitialMode, setChatModalInitialMode] = useState<
    'chat' | 'counter' | 'meetup'
  >('chat');
  const [meetupPinTradeId, setMeetupPinTradeId] = useState<string | null>(null);
  const [isWantedBoardOpen, setIsWantedBoardOpen] = useState<boolean>(false);
  const [wantedPosts, setWantedPosts] = useState<WantedPost[]>(() => {
    const saved = localStorage.getItem('pocketswap_wanted_v3');
    return saved ? JSON.parse(saved) : INITIAL_WANTED_POSTS;
  });
  const [dailyStreakClaimed, setDailyStreakClaimed] = useState<boolean>(() => {
    return (
      localStorage.getItem('pocketswap_streak_date') ===
      new Date().toDateString()
    );
  });
  const [eventFilterActive, setEventFilterActive] = useState<boolean>(false);
  const [tradeStatusFilter, setTradeStatusFilter] = useState<
    'all' | 'active' | 'completed'
  >('all');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState<boolean>(false);
  const [isSwipeDeckOpen, setIsSwipeDeckOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TradeItem | null>(null);
  const [sharingItem, setSharingItem] = useState<TradeItem | null>(null);
  const [sharingProfile, setSharingProfile] = useState<UserProfile | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [browserNotifsEnabled, setBrowserNotifsEnabled] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
  );
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [ratingTrade, setRatingTrade] = useState<TradeOffer | null>(null);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(
    Boolean(getSupabaseClient())
  );

  // Debounce search input (220ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
      setVisibleCount(PAGE_SIZE);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, sortMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('pocketswap_user_v3', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pocketswap_profiles_v3', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('pocketswap_friends_v3', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('pocketswap_items_v3', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('pocketswap_trades_v3', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('pocketswap_reviews_v3', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('pocketswap_liked_ids', JSON.stringify(likedItemIds));
  }, [likedItemIds]);

  useEffect(() => {
    localStorage.setItem(
      'pocketswap_blocked_users',
      JSON.stringify(blockedUserIds)
    );
  }, [blockedUserIds]);

  useEffect(() => {
    localStorage.setItem(
      'pocketswap_claimed_quests',
      JSON.stringify(claimedQuestIds)
    );
  }, [claimedQuestIds]);

  useEffect(() => {
    localStorage.setItem('pocketswap_wanted_v3', JSON.stringify(wantedPosts));
  }, [wantedPosts]);

  const handleClaimDailyStreak = () => {
    if (dailyStreakClaimed) {
      showToast('🔥 You already claimed today’s Village Check-In Bonus! Come back tomorrow.');
      return;
    }
    setDailyStreakClaimed(true);
    localStorage.setItem('pocketswap_streak_date', new Date().toDateString());
    playCozySound('fanfare');
    setCurrentUser((prev) => {
      const nextXp = prev.xp + 30;
      const leveledUp = nextXp >= 200;
      return {
        ...prev,
        xp: leveledUp ? nextXp - 200 : nextXp,
        level: leveledUp ? prev.level + 1 : prev.level,
        karma_points: prev.karma_points + 10,
      };
    });
    confetti({ particleCount: 65, spread: 65, origin: { y: 0.6 } });
    showToast('🔥 Daily Village Check-In Claimed! (+30 XP & +10 Karma Points)');
  };

  const handleAddPublicComment = (itemId: string, commentText: string) => {
    const newComment: ItemComment = {
      id: `comment-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.display_name,
      user_avatar: currentUser.avatar_emoji,
      text: commentText,
      is_owner_reply:
        items.find((i) => i.id === itemId)?.owner_id === currentUser.id,
      created_at: 'Just now',
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = {
          ...item,
          comments: [...(item.comments || []), newComment],
        };
        if (inspectedItem?.id === itemId) {
          setInspectedItem(updated);
        }
        return updated;
      })
    );
    showToast('💬 Posted your comment to the Item Q&A Wall!');
  };

  const handleAddWantedPost = (
    lookingFor: string,
    category: Exclude<ItemCategory, 'All'>,
    offeringHint: string
  ) => {
    const newPost: WantedPost = {
      id: `wanted-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.display_name,
      user_avatar: currentUser.avatar_emoji,
      user_level: currentUser.level,
      user_karma: currentUser.karma_score,
      looking_for: lookingFor,
      category,
      offering_hint: offeringHint,
      location_name: currentUser.location_name,
      created_at: 'Just now',
    };
    setWantedPosts((prev) => [newPost, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      xp: prev.xp + 15,
    }));
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.65 } });
    showToast('📌 Pinned your ISO Wish Note to the Village Wanted Board! (+15 XP)');
  };

  const handleFulfillWanted = (post: WantedPost) => {
    const targetOwnerItem = itemsWithDistance.find(
      (i) => i.owner_id === post.user_id && i.is_for_trade
    );
    if (targetOwnerItem) {
      setTradeTargetItem(targetOwnerItem);
      showToast(
        `🎁 Opening Trade Bench with ${post.user_name} for their "${post.looking_for}" wish!`
      );
    } else {
      setInspectedUserId(post.user_id);
      setActiveTab('passport');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  // Capture PWA Install Prompt & URL Deep Links (?item=... or ?trader=...)
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedItemId = params.get('item');
    const sharedTraderId = params.get('trader');

    if (sharedItemId) {
      const found = items.find((i) => i.id === sharedItemId);
      if (found) {
        setInspectedItem(found);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else if (sharedTraderId) {
      const foundTrader = profiles.find((p) => p.id === sharedTraderId);
      if (foundTrader) {
        setInspectedUserId(foundTrader.id);
        setActiveTab('passport');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [items, profiles]);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) {
      showToast(
        '📲 To install on iPhone/Android: tap your browser Share/Menu button → "Add to Home Screen"!'
      );
      return;
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      showToast('🎉 PocketSwap installed to your Home Screen!');
    }
    setDeferredInstallPrompt(null);
  };

  const handleEnableBrowserNotifs = async () => {
    if (!('Notification' in window)) {
      showToast('🔔 In-app toast & sound notifications are active!');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setBrowserNotifsEnabled(true);
      showToast('🔔 Live browser push notifications enabled!');
      try {
        new Notification('PocketSwap Alerts Enabled 🌿', {
          body: 'You will now receive instant alerts for new trade offers and chat replies!',
        });
      } catch {
        // Notification sent
      }
    } else {
      showToast('🔔 Using in-app notification banners & sound effects.');
    }
  };

  const syncWithSupabase = async () => {
    const supabase = getSupabaseClient();
    setSupabaseConnected(Boolean(supabase));
    if (!supabase) return;

    try {
      // 1. Check live Supabase Cloud State (item-media/cloud-db/state.json)
      const cloudState = await loadCloudStateFromSupabase();
      if (cloudState && Array.isArray(cloudState.items)) {
        const mergeList = <T extends { id: string }>(
          localArr: T[],
          cloudArr: T[],
          ignoreIds: string[] = []
        ): T[] => {
          const ignoreSet = new Set(ignoreIds);
          const map = new Map<string, T>();
          for (const item of localArr) {
            if (item?.id && !ignoreSet.has(item.id)) map.set(item.id, item);
          }
          for (const item of cloudArr) {
            if (item?.id && !ignoreSet.has(item.id)) {
              map.set(item.id, { ...(map.get(item.id) || {}), ...item });
            }
          }
          return Array.from(map.values());
        };

        const mergedDeleted = Array.from(
          new Set([...deletedItemIds, ...(cloudState.deletedItemIds || [])])
        );
        if (mergedDeleted.length !== deletedItemIds.length) {
          setDeletedItemIds(mergedDeleted);
          localStorage.setItem(
            'pocketswap_deleted_items_v3',
            JSON.stringify(mergedDeleted)
          );
        }

        setItems((prev) => mergeList(prev, cloudState.items, mergedDeleted));
        if (Array.isArray(cloudState.trades)) {
          setTrades((prev) => mergeList(prev, cloudState.trades));
        }
        if (Array.isArray(cloudState.profiles) && cloudState.profiles.length > 0) {
          setProfiles((prev) => mergeList(prev, cloudState.profiles));
        }
        if (Array.isArray(cloudState.reviews)) {
          setReviews((prev) => mergeList(prev, cloudState.reviews));
        }
        if (Array.isArray(cloudState.wantedPosts)) {
          setWantedPosts((prev) => mergeList(prev, cloudState.wantedPosts!));
        }
        if (Array.isArray(cloudState.friends)) {
          setFriends((prev) => mergeList(prev, cloudState.friends!));
        }
      } else {
        await saveCloudStateToSupabase({
          items,
          trades,
          profiles,
          reviews,
          wantedPosts,
          friends,
          deletedItemIds,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Keep hybrid local state seamlessly
    }
  };

  useEffect(() => {
    syncWithSupabase();

    // Poll every 12s & on window focus so multi-user listings, offers & chat sync live
    const pollTimer = setInterval(() => {
      syncWithSupabase();
    }, 12000);
    const handleFocus = () => syncWithSupabase();
    window.addEventListener('focus', handleFocus);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleFocus);
      };
    }

    const channel = supabase
      .channel('pocketswap-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        () => {
          syncWithSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_offers' },
        () => {
          syncWithSupabase();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  // Automatically persist changes to Supabase Cloud Storage (debounced)
  useEffect(() => {
    if (!supabaseConnected) return;
    const timer = setTimeout(() => {
      saveCloudStateToSupabase({
        items,
        trades,
        profiles,
        reviews,
        wantedPosts,
        friends,
        deletedItemIds,
        updatedAt: new Date().toISOString(),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [
    items,
    trades,
    profiles,
    reviews,
    wantedPosts,
    friends,
    deletedItemIds,
    supabaseConnected,
  ]);

  // Friend System Handlers
  const acceptedFriendIds = useMemo(
    () =>
      friends
        .filter((f) => f.status === 'friends')
        .map((f) => f.friend_id),
    [friends]
  );

  const incomingFriendRequestsCount = useMemo(
    () => friends.filter((f) => f.status === 'incoming').length,
    [friends]
  );

  const handleAcceptFriendRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.friend_id === friendId
          ? {
              ...f,
              status: 'friends',
              buddy_note: 'Trade Buddies! Ready for local swaps.',
              created_at: 'Just now',
            }
          : f
      )
    );
    setCurrentUser((prev) => ({
      ...prev,
      xp: prev.xp + 25,
      level: prev.xp + 25 >= 200 ? prev.level + 1 : prev.level,
    }));
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    showToast('🤝 Trade Buddy Request Accepted! (+25 XP)');
  };

  const handleDeclineOrRemoveFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
    showToast('🍃 Updated your Friends list.');
  };

  const handleSendFriendRequest = (targetProfile: UserProfile) => {
    const exists = friends.some((f) => f.friend_id === targetProfile.id);
    if (exists) return;

    const newConn: FriendConnection = {
      id: `friend-${Date.now()}`,
      friend_id: targetProfile.id,
      friend_username: targetProfile.username,
      friend_name: targetProfile.display_name,
      friend_avatar: targetProfile.avatar_emoji,
      friend_title: targetProfile.title_badge,
      friend_level: targetProfile.level,
      friend_karma: targetProfile.karma_score,
      friend_location: targetProfile.location_name.split(' (')[0],
      status: 'outgoing',
      online_status: 'Online Now 🟢',
      mutual_trades: 0,
      buddy_note: `Friend request sent to ${targetProfile.display_name}`,
      created_at: 'Just now',
    };

    setFriends((prev) => [newConn, ...prev]);
    showToast(`💌 Friend Request sent to ${targetProfile.display_name}!`);
  };

  const handleToggleLikeItem = (itemId: string) => {
    playCozySound('like');
    setLikedItemIds((prev) => {
      const exists = prev.includes(itemId);
      const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      showToast(
        exists ? '💔 Removed from Saved Wishlist' : '❤️ Saved to your Wishlist!'
      );
      return next;
    });
  };

  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updated }));
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentUser.id ? { ...p, ...updated } : p))
    );
    if (updated.display_name || updated.avatar_emoji || updated.location_name) {
      setItems((prev) =>
        prev.map((item) =>
          item.owner_id === currentUser.id
            ? {
                ...item,
                owner_name: updated.display_name || item.owner_name,
                owner_avatar: updated.avatar_emoji || item.owner_avatar,
                location_name: updated.location_name || item.location_name,
              }
            : item
        )
      );
    }
    showToast('✨ Villager Passport updated!');
  };

  const handleCreateNewPlayer = async (newProfile: UserProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setCurrentUser(newProfile);
    setInspectedUserId(null);
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    showToast(
      `🌱 Welcome to PocketSwap, ${newProfile.display_name}! Your account is live.`
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: newProfile.id,
          username: newProfile.username,
          display_name: newProfile.display_name,
          avatar_emoji: newProfile.avatar_emoji,
          title_badge: newProfile.title_badge,
          bio: newProfile.bio,
          karma_score: newProfile.karma_score,
          karma_points: newProfile.karma_points,
          karma_reviews_count: newProfile.karma_reviews_count,
          completed_trades: newProfile.completed_trades,
          level: newProfile.level,
          xp: newProfile.xp,
          latitude: newProfile.latitude,
          longitude: newProfile.longitude,
          location_name: newProfile.location_name,
          badges: newProfile.badges,
        });
      } catch {
        // Saved in state & cloud storage
      }
    }
  };

  const handleSwitchPlayer = (targetProfile: UserProfile) => {
    setCurrentUser(targetProfile);
    setInspectedUserId(null);
    showToast(
      `🔑 Switched active trader account to ${targetProfile.display_name} (${targetProfile.avatar_emoji})!`
    );
  };

  const handleDeleteOwnItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeletedItemIds((prev) => {
      const next = Array.from(new Set([...prev, itemId]));
      localStorage.setItem('pocketswap_deleted_items_v3', JSON.stringify(next));
      return next;
    });
    showToast('🗑️ Item removed from your Pocket Inventory.');
  };

  const handleUpdateItem = async (updatedItem: TradeItem) => {
    let finalMediaUrl = updatedItem.media_url;
    if (updatedItem.media_url.startsWith('data:')) {
      const uploadedUrl = await uploadItemMediaToSupabase(
        updatedItem.media_url,
        updatedItem.media_type === 'video' ? 'mp4' : 'webp'
      );
      if (uploadedUrl) {
        finalMediaUrl = uploadedUrl;
      }
    }

    const savedItem: TradeItem = {
      ...updatedItem,
      media_url: finalMediaUrl,
    };

    setItems((prev) =>
      prev.map((i) => (i.id === savedItem.id ? savedItem : i))
    );
    setEditingItem(null);
    showToast(`✏️ Updated "${savedItem.title}" & synced to Cloud!`);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('items').upsert({
          id: savedItem.id,
          owner_id: savedItem.owner_id,
          owner_name: savedItem.owner_name,
          owner_avatar: savedItem.owner_avatar,
          owner_karma: savedItem.owner_karma,
          owner_level: savedItem.owner_level,
          title: savedItem.title,
          description: savedItem.description,
          category: savedItem.category,
          condition: savedItem.condition,
          rarity: savedItem.rarity,
          year_made: savedItem.year_made,
          brand: savedItem.brand,
          accessories_included: savedItem.accessories_included,
          condition_notes: savedItem.condition_notes,
          media_url: savedItem.media_url,
          media_type: savedItem.media_type,
          wishlist_hint: savedItem.wishlist_hint,
          is_for_trade: savedItem.is_for_trade,
          latitude: savedItem.latitude,
          longitude: savedItem.longitude,
          location_name: savedItem.location_name,
          likes_count: savedItem.likes_count,
        });
      } catch {
        // Synced via cloud-db/state.json & local state
      }
    }
  };

  const handleReportItem = (reportedItem: TradeItem) => {
    setItems((prev) => prev.filter((i) => i.id !== reportedItem.id));
    showToast(
      `🛡️ Reported "${reportedItem.title}" & hid it from your Plaza feed.`
    );
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? 'http://localhost:3001' : '');
    fetch(`${apiBase}/api/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: reportedItem.id }),
    }).catch(() => {});
  };

  const handleBlockUser = (ownerId: string, ownerName: string) => {
    setBlockedUserIds((prev) =>
      prev.includes(ownerId) ? prev : [...prev, ownerId]
    );
    showToast(`🚫 Blocked ${ownerName}. Their items and trades are now hidden.`);
  };

  const handleTriggerRealGps = () => {
    if (!('geolocation' in navigator)) {
      showToast('⚠️ Geolocation is not supported by this browser.');
      return;
    }
    setGpsStatus('locating');
    showToast('📡 Tracing your phone GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setItems((prev) =>
          prev.map((item, idx) => {
            if (item.owner_id === currentUser.id) {
              return {
                ...item,
                latitude,
                longitude,
                location_name: 'My Live GPS Pin',
              };
            }
            const angle = (idx * Math.PI) / 2.5;
            const offset = 0.004 + (idx % 3) * 0.003;
            return {
              ...item,
              latitude: latitude + Math.sin(angle) * offset,
              longitude: longitude + Math.cos(angle) * offset,
            };
          })
        );
        setCurrentUser((prev) => ({
          ...prev,
          latitude,
          longitude,
          location_name: 'Live GPS Location 📍',
        }));
        setGpsStatus('locked');
        showToast('🛰️ Live GPS Locked! Radar updated to your coordinates.');
      },
      () => {
        setGpsStatus('simulated');
        showToast(
          '🧭 Using Cozy Town GPS simulator (Browser location permission skipped).'
        );
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleSimulateMove = (
    latDelta: number,
    lngDelta: number,
    placeName: string
  ) => {
    setCurrentUser((prev) => ({
      ...prev,
      latitude: prev.latitude + latDelta,
      longitude: prev.longitude + lngDelta,
      location_name: placeName,
    }));
    setGpsStatus('simulated');
    showToast(`🚶 Walked to ${placeName}! Distances recalculated.`);
  };

  const itemsWithDistance = useMemo(() => {
    return items.map((item) => ({
      ...item,
      distance_km: calculateDistanceKm(
        currentUser.latitude,
        currentUser.longitude,
        item.latitude,
        item.longitude
      ),
    }));
  }, [items, currentUser.latitude, currentUser.longitude]);

  const myInventory = useMemo(
    () => itemsWithDistance.filter((i) => i.owner_id === currentUser.id),
    [itemsWithDistance, currentUser.id]
  );

  // Smart Wishlist Match Detector: checks if any of our Pocket items match a listing's wishlist_hint
  const checkHasWishlistMatch = (targetItem: TradeItem): boolean => {
    const hint = (targetItem.wishlist_hint || '').toLowerCase();
    return myInventory.some((myItem) => {
      const cat = myItem.category.toLowerCase();
      const brand = (myItem.brand || '').toLowerCase();
      const firstWord = myItem.title.toLowerCase().split(' ')[0];
      return (
        (cat && hint.includes(cat.split(' ')[0])) ||
        (brand.length > 2 && hint.includes(brand)) ||
        (firstWord.length > 3 && hint.includes(firstWord))
      );
    });
  };

  const cozyQuests = useMemo<CozyQuest[]>(() => {
    const totalChatMsgs = trades.reduce(
      (acc, t) => acc + (t.messages?.length || 0),
      0
    );
    return [
      {
        id: 'quest-pocket-3',
        title: 'Pack Your Pocket',
        description: 'Have at least 3 items in your Pocket Inventory',
        icon: '🎒',
        current: Math.min(3, myInventory.length),
        target: 3,
        xpReward: 50,
        karmaBonus: 15,
        badgeReward: '🎒 Collector',
        claimed: claimedQuestIds.includes('quest-pocket-3'),
      },
      {
        id: 'quest-friends-2',
        title: 'Village Buddy Circle',
        description: 'Connect with 2+ Trade Buddies in your Friends List',
        icon: '🤝',
        current: Math.min(2, acceptedFriendIds.length),
        target: 2,
        xpReward: 60,
        karmaBonus: 20,
        badgeReward: '🤝 Village Buddy',
        claimed: claimedQuestIds.includes('quest-friends-2'),
      },
      {
        id: 'quest-chat-3',
        title: 'Curious Appraiser',
        description: 'Exchange 3+ chat messages or item questions with traders',
        icon: '💬',
        current: Math.min(3, totalChatMsgs),
        target: 3,
        xpReward: 45,
        karmaBonus: 10,
        claimed: claimedQuestIds.includes('quest-chat-3'),
      },
      {
        id: 'quest-wishlist-2',
        title: 'Treasure Hunter',
        description: 'Save 2+ nearby items to your ❤️ Wishlist',
        icon: '❤️',
        current: Math.min(2, likedItemIds.length),
        target: 2,
        xpReward: 40,
        karmaBonus: 10,
        claimed: claimedQuestIds.includes('quest-wishlist-2'),
      },
      {
        id: 'quest-trades-2',
        title: 'Deal Maker',
        description: 'Have 2+ active or completed Trade-Offs',
        icon: '⚔️',
        current: Math.min(2, trades.length),
        target: 2,
        xpReward: 85,
        karmaBonus: 30,
        badgeReward: '⚔️ Master Trader',
        claimed: claimedQuestIds.includes('quest-trades-2'),
      },
    ];
  }, [
    myInventory.length,
    acceptedFriendIds.length,
    trades,
    likedItemIds.length,
    claimedQuestIds,
  ]);

  const claimableQuestsCount = useMemo(
    () =>
      cozyQuests.filter((q) => q.current >= q.target && !q.claimed).length,
    [cozyQuests]
  );

  const handleClaimQuest = (questId: string) => {
    const quest = cozyQuests.find((q) => q.id === questId);
    if (!quest || quest.claimed || quest.current < quest.target) return;

    setClaimedQuestIds((prev) => [...prev, questId]);
    playCozySound('fanfare');
    setCurrentUser((prev) => {
      const totalXp = prev.xp + quest.xpReward;
      const leveledUp = totalXp >= 200;
      const nextBadges =
        quest.badgeReward && !prev.badges.includes(quest.badgeReward)
          ? [quest.badgeReward, ...prev.badges]
          : prev.badges;
      return {
        ...prev,
        xp: leveledUp ? totalXp - 200 : totalXp,
        level: leveledUp ? prev.level + 1 : prev.level,
        karma_points: prev.karma_points + quest.karmaBonus,
        badges: nextBadges,
      };
    });

    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    showToast(
      `🏆 Quest Claimed: "${quest.title}" (+${quest.xpReward} XP & +${quest.karmaBonus} KP!)`
    );
  };

  const filteredMarketplaceItems = useMemo(() => {
    return itemsWithDistance
      .filter(
        (i) =>
          i.owner_id !== currentUser.id &&
          i.is_for_trade &&
          !blockedUserIds.includes(i.owner_id)
      )
      .filter((i) =>
        selectedCategory === 'All' ? true : i.category === selectedCategory
      )
      .filter((i) =>
        eventFilterActive
          ? i.category === 'Gaming' ||
            i.category === 'Gadgets' ||
            i.category === 'Collectibles'
          : true
      )
      .filter((i) => {
        if (sortMode === 'saved') return likedItemIds.includes(i.id);
        if (sortMode === 'friends') return acceptedFriendIds.includes(i.owner_id);
        if (sortMode === 'matches') return checkHasWishlistMatch(i);
        return true;
      })
      .filter((i) =>
        debouncedQuery === ''
          ? true
          : i.title.toLowerCase().includes(debouncedQuery) ||
            i.description.toLowerCase().includes(debouncedQuery) ||
            i.wishlist_hint.toLowerCase().includes(debouncedQuery) ||
            (i.brand && i.brand.toLowerCase().includes(debouncedQuery)) ||
            String(i.year_made).includes(debouncedQuery)
      )
      .sort((a, b) => {
        if (sortMode === 'rarity') {
          return (RARITY_WEIGHT[b.rarity] || 1) - (RARITY_WEIGHT[a.rarity] || 1);
        }
        if (sortMode === 'vintage') {
          return (a.year_made || 2023) - (b.year_made || 2023);
        }
        return (a.distance_km ?? 0) - (b.distance_km ?? 0);
      });
  }, [
    itemsWithDistance,
    currentUser.id,
    blockedUserIds,
    selectedCategory,
    sortMode,
    likedItemIds,
    acceptedFriendIds,
    debouncedQuery,
    eventFilterActive,
  ]);

  const paginatedMarketplaceItems = useMemo(
    () => filteredMarketplaceItems.slice(0, visibleCount),
    [filteredMarketplaceItems, visibleCount]
  );

  const hasMorePages = visibleCount < filteredMarketplaceItems.length;

  useEffect(() => {
    if (activeTab !== 'explore' || !hasMorePages || isLoadingMore) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setIsLoadingMore(false);
          }, 320);
        }
      },
      { rootMargin: '160px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, hasMorePages, isLoadingMore]);

  const handleCleanDemoData = async () => {
    setItems([]);
    setTrades([]);
    setReviews([]);
    setWantedPosts([]);
    setFriends([]);

    await saveCloudStateToSupabase({
      items: [],
      trades: [],
      profiles: [currentUser],
      reviews: [],
      wantedPosts: [],
      friends: [],
      updatedAt: new Date().toISOString(),
    });

    showToast('🧹 Reset Village Plaza & Cloud State!');
  };

  const handleAddItem = async (newItem: TradeItem) => {
    if (myInventory.length >= MAX_POCKET_ITEMS) {
      showToast(
        `🎒 Your Pocket is full (${MAX_POCKET_ITEMS}/${MAX_POCKET_ITEMS} items)! Complete a swap or remove an item first.`
      );
      return;
    }

    let finalMediaUrl = newItem.media_url;
    if (newItem.media_url.startsWith('data:')) {
      const uploadedUrl = await uploadItemMediaToSupabase(
        newItem.media_url,
        newItem.media_type === 'video' ? 'mp4' : 'webp'
      );
      if (uploadedUrl) {
        finalMediaUrl = uploadedUrl;
      }
    }

    const itemToSave: TradeItem = {
      ...newItem,
      media_url: finalMediaUrl,
    };

    setItems((prev) => [itemToSave, ...prev]);
    setCurrentUser((prev) => {
      const nextXp = prev.xp + 25;
      const leveledUp = nextXp >= 200;
      return {
        ...prev,
        xp: leveledUp ? nextXp - 200 : nextXp,
        level: leveledUp ? prev.level + 1 : prev.level,
      };
    });

    confetti({ particleCount: 55, spread: 60, origin: { y: 0.75 } });
    showToast(
      `🎒 Added "${itemToSave.title}" (${itemToSave.year_made}) to your Pocket & Cloud! (+25 XP)`
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('items').insert({
          id: itemToSave.id,
          owner_id: currentUser.id,
          owner_name: currentUser.display_name,
          owner_avatar: currentUser.avatar_emoji,
          owner_karma: currentUser.karma_score,
          owner_level: currentUser.level,
          title: itemToSave.title,
          description: itemToSave.description,
          category: itemToSave.category,
          condition: itemToSave.condition,
          rarity: itemToSave.rarity,
          year_made: itemToSave.year_made,
          brand: itemToSave.brand,
          accessories_included: itemToSave.accessories_included,
          condition_notes: itemToSave.condition_notes,
          media_url: itemToSave.media_url,
          media_type: itemToSave.media_type,
          wishlist_hint: itemToSave.wishlist_hint,
          is_for_trade: true,
          latitude: itemToSave.latitude,
          longitude: itemToSave.longitude,
          location_name: itemToSave.location_name,
        });
      } catch {
        // Synced via cloud-db/state.json & local state
      }
    }
  };

  const handleToggleForTrade = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_for_trade: !item.is_for_trade } : item
      )
    );
    showToast('🔄 Updated item trade status in your Pocket!');
  };

  const handleSubmitTrade = (
    targetItem: TradeItem,
    offeredItemIds: string[],
    message: string
  ) => {
    const tradeId = `trade-${Date.now()}`;
    const initialMsg: TradeChatMessage = {
      id: `msg-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      text: message,
      created_at: 'Just now',
    };

    const newOffer: TradeOffer = {
      id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      sender_karma: currentUser.karma_score,
      receiver_id: targetItem.owner_id,
      receiver_name: targetItem.owner_name,
      receiver_avatar: targetItem.owner_avatar,
      requested_item_id: targetItem.id,
      offered_item_ids: offeredItemIds,
      message,
      status: 'pending',
      counter_count: 0,
      last_actor_name: currentUser.display_name,
      meetup_distance_km: targetItem.distance_km ?? 0.8,
      messages: [initialMsg],
      created_at: new Date().toISOString(),
    };

    setTrades((prev) => [newOffer, ...prev]);
    setTradeTargetItem(null);
    setActiveTab('trades');
    playCozySound('trade');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    showToast(`⚔️ Trade Offer sent to ${targetItem.owner_name}!`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('trade_offers')
        .upsert({
          id: newOffer.id,
          sender_id: newOffer.sender_id,
          sender_name: newOffer.sender_name,
          sender_avatar: newOffer.sender_avatar,
          sender_karma: newOffer.sender_karma,
          receiver_id: newOffer.receiver_id,
          receiver_name: newOffer.receiver_name,
          receiver_avatar: newOffer.receiver_avatar,
          requested_item_id: newOffer.requested_item_id,
          offered_item_ids: newOffer.offered_item_ids,
          message: newOffer.message,
          status: newOffer.status,
          counter_count: newOffer.counter_count,
          last_actor_name: newOffer.last_actor_name,
          meetup_distance_km: newOffer.meetup_distance_km,
        })
        .then(() => {
          supabase.from('trade_messages').insert({
            id: initialMsg.id,
            trade_id: newOffer.id,
            sender_id: initialMsg.sender_id,
            sender_name: initialMsg.sender_name,
            sender_avatar: initialMsg.sender_avatar,
            text: initialMsg.text,
          });
        });
    }
  };

  const handleSendTradeMessage = async (
    tradeId: string,
    text: string,
    attachmentUrl?: string
  ) => {
    const newMsg: TradeChatMessage = {
      id: `msg-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      text,
      attachment_url: attachmentUrl,
      created_at: 'Just now',
    };

    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? { ...t, messages: [...(t.messages || []), newMsg] }
          : t
      )
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('trade_messages').insert({
          trade_id: tradeId,
          sender_id: currentUser.id,
          sender_name: currentUser.display_name,
          sender_avatar: currentUser.avatar_emoji,
          text,
        });
      } catch {
        // Local state updated
      }
    }
  };

  const handleAskQuestionFromItem = (item: TradeItem, questionText: string) => {
    const existingTrade = trades.find(
      (t) =>
        t.requested_item_id === item.id &&
        (t.sender_id === currentUser.id || t.receiver_id === currentUser.id)
    );

    if (existingTrade) {
      handleSendTradeMessage(existingTrade.id, questionText);
      setChatModalInitialMode('chat');
      setActiveChatTradeId(existingTrade.id);
      setActiveTab('trades');
      return;
    }

    const defaultOfferedId = myInventory[0]?.id || '';
    const tradeId = `trade-q-${Date.now()}`;
    const firstMsg: TradeChatMessage = {
      id: `msg-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      text: questionText,
      created_at: 'Just now',
    };

    const newThread: TradeOffer = {
      id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      sender_karma: currentUser.karma_score,
      receiver_id: item.owner_id,
      receiver_name: item.owner_name,
      receiver_avatar: item.owner_avatar,
      requested_item_id: item.id,
      offered_item_ids: defaultOfferedId ? [defaultOfferedId] : [],
      message: questionText,
      status: 'pending',
      counter_count: 0,
      last_actor_name: currentUser.display_name,
      meetup_distance_km: item.distance_km ?? 0.7,
      messages: [firstMsg],
      created_at: new Date().toISOString(),
    };

    setTrades((prev) => [newThread, ...prev]);
    setChatModalInitialMode('chat');
    setActiveChatTradeId(tradeId);
    setActiveTab('trades');
  };

  const handleSubmitCounterOffer = (
    tradeId: string,
    partnerTargetItemId: string,
    mySelectedOfferedIds: string[],
    counterNote: string
  ) => {
    const reqItem = items.find((i) => i.id === partnerTargetItemId);
    const offItems = items.filter((i) => mySelectedOfferedIds.includes(i.id));

    const counterEventMsg: TradeChatMessage = {
      id: `msg-counter-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      text: `${currentUser.display_name} proposed a Counter-Offer: ${offItems
        .map((i) => i.title)
        .join(' + ')} ⇄ ${reqItem?.title || 'Item'}. "${counterNote}"`,
      is_counter_event: true,
      created_at: 'Just now',
    };

    setTrades((prev) =>
      prev.map((t) => {
        if (t.id !== tradeId) return t;
        const wasSender = t.sender_id === currentUser.id;
        const partnerId = wasSender ? t.receiver_id : t.sender_id;
        const partnerName = wasSender ? t.receiver_name : t.sender_name;
        const partnerAvatar = wasSender ? t.receiver_avatar : t.sender_avatar;

        return {
          ...t,
          sender_id: currentUser.id,
          sender_name: currentUser.display_name,
          sender_avatar: currentUser.avatar_emoji,
          sender_karma: currentUser.karma_score,
          receiver_id: partnerId,
          receiver_name: partnerName,
          receiver_avatar: partnerAvatar,
          requested_item_id: partnerTargetItemId,
          offered_item_ids: mySelectedOfferedIds,
          message: counterNote,
          status: 'countered',
          counter_count: (t.counter_count || 0) + 1,
          last_actor_name: currentUser.display_name,
          messages: [...(t.messages || []), counterEventMsg],
        };
      })
    );

    confetti({ particleCount: 65, spread: 60, origin: { y: 0.65 } });
    showToast('🔄 Counter-Offer sent! Both sides updated in the Trade Chat.');
  };

  const handleScheduleMeetup = (
    tradeId: string,
    spotName: string,
    spotAddress: string,
    timeSlot: string,
    lat: number,
    lng: number
  ) => {
    const meetupMsg: TradeChatMessage = {
      id: `msg-meetup-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_avatar: currentUser.avatar_emoji,
      text: `${currentUser.display_name} proposed a Safe Meetup at ${spotName} (${spotAddress}) for ${timeSlot}!`,
      is_meetup_event: true,
      created_at: 'Just now',
    };

    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              meetup_spot_name: spotName,
              meetup_spot_address: spotAddress,
              meetup_time_slot: timeSlot,
              meetup_lat: lat,
              meetup_lng: lng,
              messages: [...(t.messages || []), meetupMsg],
            }
          : t
      )
    );

    setCurrentUser((prev) => ({
      ...prev,
      xp: prev.xp + 20,
    }));
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    showToast(`📍 Scheduled Safe Meetup at ${spotName} (${timeSlot})! (+20 XP)`);
  };

  const handleUpdateTradeStatus = async (
    tradeId: string,
    newStatus: 'accepted' | 'declined' | 'completed'
  ) => {
    const targetTrade = trades.find((t) => t.id === tradeId);
    if (!targetTrade) return;

    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, status: newStatus } : t))
    );

    if (newStatus === 'accepted') {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 } });
      showToast(
        '🤝 Trade Accepted! Tap "Verify Meetup PIN" when you meet up in person.'
      );
    } else if (newStatus === 'completed') {
      const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? 'http://localhost:3001' : '');
      fetch(`${apiBase}/api/trades/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      }).catch(() => {});

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.rpc('complete_trade_atomic', { p_trade_id: tradeId });
        } catch {
          // Local atomic fallback
        }
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === targetTrade.requested_item_id) {
            return {
              ...item,
              owner_id: targetTrade.sender_id,
              owner_name: targetTrade.sender_name,
              owner_avatar: targetTrade.sender_avatar,
              is_for_trade: false,
            };
          }
          if (targetTrade.offered_item_ids.includes(item.id)) {
            return {
              ...item,
              owner_id: targetTrade.receiver_id,
              owner_name: targetTrade.receiver_name,
              owner_avatar: targetTrade.receiver_avatar,
              is_for_trade: false,
            };
          }
          return item;
        })
      );

      setCurrentUser((prev) => ({
        ...prev,
        completed_trades: prev.completed_trades + 1,
        xp: prev.xp + 100,
        level: prev.xp + 100 >= 200 ? prev.level + 1 : prev.level,
      }));

      confetti({ particleCount: 110, spread: 90, origin: { y: 0.55 } });
      setRatingTrade(targetTrade);
      showToast('🎉 Verified Meetup Swap Completed! Items transferred & +100 XP!');
    } else {
      showToast('🍃 Trade offer declined.');
    }
  };

  const handleSubmitKarmaReview = (
    stars: number,
    badge: string,
    comment: string
  ) => {
    if (!ratingTrade) return;
    const isSender = ratingTrade.sender_id === currentUser.id;
    const targetUserId = isSender
      ? ratingTrade.receiver_id
      : ratingTrade.sender_id;
    const targetUserName = isSender
      ? ratingTrade.receiver_name
      : ratingTrade.sender_name;

    const newRev: KarmaReview = {
      id: `rev-${Date.now()}`,
      trade_id: ratingTrade.id,
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.display_name,
      reviewer_avatar: currentUser.avatar_emoji,
      target_user_id: targetUserId,
      stars,
      vibe_badge: badge,
      comment,
      created_at: 'Just now',
    };

    setReviews((prev) => [newRev, ...prev]);
    setTrades((prev) =>
      prev.map((t) =>
        t.id === ratingTrade.id ? { ...t, rated_by_user: true } : t
      )
    );

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== targetUserId) return p;
        const newCount = p.karma_reviews_count + 1;
        const newAvg =
          Math.round(
            ((p.karma_score * p.karma_reviews_count + stars) / newCount) * 100
          ) / 100;
        return {
          ...p,
          karma_score: newAvg,
          karma_points: p.karma_points + stars * 15,
          karma_reviews_count: newCount,
          badges: p.badges.includes(badge) ? p.badges : [badge, ...p.badges],
        };
      })
    );

    setCurrentUser((prev) => ({
      ...prev,
      karma_points: prev.karma_points + 25,
      xp: prev.xp + 50,
    }));

    setRatingTrade(null);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast(`🌟 Awarded ${stars}★ Karma & "${badge}" to ${targetUserName}!`);

    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? 'http://localhost:3001' : '');
    fetch(`${apiBase}/api/karma/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeId: ratingTrade.id,
        reviewerId: currentUser.id,
        reviewerName: currentUser.display_name,
        reviewerAvatar: currentUser.avatar_emoji,
        targetUserId,
        stars,
        vibeBadge: badge,
        comment,
      }),
    }).catch(() => {});
  };

  const pendingTradesCount = trades.filter(
    (t) => t.status === 'pending' || t.status === 'countered'
  ).length;

  const displayedProfile = useMemo(() => {
    if (!inspectedUserId || inspectedUserId === currentUser.id) {
      return currentUser;
    }
    return profiles.find((p) => p.id === inspectedUserId) || currentUser;
  }, [inspectedUserId, currentUser, profiles]);

  const displayedProfileItems = useMemo(
    () =>
      itemsWithDistance.filter(
        (i) => i.owner_id === displayedProfile.id && i.is_for_trade
      ),
    [itemsWithDistance, displayedProfile.id]
  );

  const displayedFriendStatus = useMemo(
    () =>
      friends.find((f) => f.friend_id === displayedProfile.id)?.status || 'none',
    [friends, displayedProfile.id]
  );

  const activeChatTrade = useMemo(
    () => trades.find((t) => t.id === activeChatTradeId) || null,
    [trades, activeChatTradeId]
  );

  const activeMeetupTrade = useMemo(
    () => trades.find((t) => t.id === meetupPinTradeId) || null,
    [trades, meetupPinTradeId]
  );

  return (
    <div
      className={`min-h-screen flex flex-col items-center ${
        phoneFrameMode
          ? 'justify-center sm:py-5 sm:px-4'
          : 'justify-start sm:py-4 sm:px-6'
      }`}
    >
      {/* DESKTOP / MOBILE SCREEN MODE SWITCHER BAR (Visible on Tablet & Desktop screens) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-7xl mb-3 px-4 py-2 rounded-2xl bg-[#4A3520]/90 text-[#FFF9EB] border-2 border-[#D8C5A0]/50 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🌿</span>
          <div>
            <span className="font-game text-sm font-bold text-[#FFF9EB] tracking-wide">
              PocketSwap
            </span>
            <span className="hidden md:inline-block ml-2 px-2 py-0.5 rounded-full bg-[#4E9F6E]/30 border border-[#4E9F6E] text-[10px] font-extrabold text-[#A8Ebc2]">
              {phoneFrameMode
                ? '📱 Mobile App Screen Mode'
                : '🖥️ Desktop Website Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#352515] p-1 rounded-xl border border-[#7C6246]/50">
          <button
            type="button"
            onClick={() => handleSetViewMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              !phoneFrameMode
                ? 'bg-[#4E9F6E] text-white shadow-sm'
                : 'text-[#D8C5A0] hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Website</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              phoneFrameMode
                ? 'bg-[#F6B93B] text-[#4A3520] shadow-sm'
                : 'text-[#D8C5A0] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App Screen</span>
          </button>
        </div>
      </div>

      {/* Secret Developer Toolbar (Hidden from real users; only accessible in local dev mode when toggled) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end gap-2">
          {showDevTools && (
            <div className="p-2.5 rounded-2xl bg-[#4A3520] text-[#FFF9EB] border-2 border-[#F6B93B] shadow-xl flex flex-col gap-1.5 text-xs font-bold">
              <span className="text-[10px] uppercase tracking-wider text-[#F6B93B] font-extrabold px-1">
                🛠️ Creator / Dev Controls (Only for you)
              </span>
              <button
                type="button"
                onClick={() => handleSetViewMode(!phoneFrameMode)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-left flex items-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>
                  {phoneFrameMode ? 'Switch to Desktop Website' : 'Switch to Phone Frame'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-left flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>
                  {supabaseConnected ? '🟢 Supabase Connected' : '☁️ Configure Supabase'}
                </span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowDevTools(!showDevTools)}
            title="Toggle Creator Dev Controls (Hidden in production)"
            className="px-3 py-1.5 rounded-full bg-[#4A3520]/80 hover:bg-[#4A3520] text-[#FFF9EB] text-[11px] font-extrabold shadow-md border border-[#D8C5A0]/40"
          >
            {showDevTools ? '✕ Hide Dev Tools' : '🛠️ Dev'}
          </button>
        </div>
      )}

      {/* ADAPTIVE APP SHELL CONTAINER (MOBILE PHONE FRAME VS DESKTOP WEBSITE) */}
      <div
        className={`w-full bg-[#FFF9EB] flex flex-col relative overflow-hidden transition-all ${
          phoneFrameMode
            ? 'max-w-[440px] h-[100dvh] sm:h-[850px] sm:max-h-[90vh] sm:rounded-[42px] sm:border-[6px] sm:border-[#5C4328] sm:shadow-[0_20px_50px_rgba(62,43,23,0.3)]'
            : 'max-w-7xl min-h-[100dvh] sm:min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border-4 sm:border-[#D8C5A0] shadow-xl'
        }`}
      >
        {/* TOP GAME HUD BAR */}
        <header className="sticky top-0 z-30 shrink-0 bg-[#F5E9CE]/95 backdrop-blur-md border-b-2 border-[#D8C5A0] px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Player Avatar + Name + Level + Karma & XP */}
            <button
              type="button"
              onClick={() => {
                setInspectedUserId(null);
                setActiveTab('passport');
              }}
              className="flex items-center gap-2.5 text-left group min-w-0 flex-1"
            >
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FFF9EB] border-2 border-[#4E9F6E] flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">
                {currentUser.avatar_emoji}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-game text-sm font-bold text-[#4A3520] truncate">
                    {currentUser.display_name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#4E9F6E] text-white text-[10px] font-extrabold leading-none shrink-0">
                    Lv.{currentUser.level}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] font-extrabold text-[#7C6246]">
                  <span className="inline-flex items-center gap-0.5 text-[#C88719] shrink-0">
                    <Star className="w-3 h-3 fill-[#F6B93B] text-[#F6B93B]" />
                    {currentUser.karma_score.toFixed(2)}
                  </span>
                  <span className="text-[#C7B087]">•</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-12 h-1.5 rounded-full bg-[#E0CEAC] overflow-hidden shrink-0">
                      <div
                        className="h-full bg-[#4E9F6E] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (currentUser.xp / 200) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-[#7C6246] whitespace-nowrap">
                      {currentUser.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Right: 3 Clean, Uniform Cozy Icon Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cozy Quests Button */}
              <button
                type="button"
                onClick={() => setIsQuestsModalOpen(true)}
                className="relative h-9 px-2.5 rounded-xl bg-[#FFF6E0] border-2 border-[#F6B93B] flex items-center justify-center gap-1 shadow-sm hover:bg-white transition-colors"
                title="Cozy Quests & Rewards"
              >
                <Trophy className="w-4 h-4 text-[#D9822B] shrink-0" />
                <span className="hidden sm:inline font-game text-xs font-bold text-[#5C4328]">
                  Quests
                </span>
                {claimableQuestsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#4E9F6E] text-white text-[9px] font-extrabold flex items-center justify-center shadow">
                    {claimableQuestsCount}
                  </span>
                )}
              </button>

              {/* Friends Hub Button */}
              <button
                type="button"
                onClick={() => setIsFriendsModalOpen(true)}
                className="relative h-9 px-2.5 rounded-xl bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center justify-center gap-1 shadow-sm hover:bg-white transition-colors"
                title="Friends & Trade Buddies"
              >
                <Users className="w-4 h-4 text-[#4E9F6E] shrink-0" />
                <span className="font-game text-xs font-bold text-[#5C4328]">
                  {acceptedFriendIds.length}
                </span>
                {incomingFriendRequestsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF7E67] text-white text-[9px] font-extrabold flex items-center justify-center shadow">
                    {incomingFriendRequestsCount}
                  </span>
                )}
              </button>

              {/* Activity & Notification Bell Button */}
              <button
                type="button"
                onClick={() => {
                  playCozySound('tap');
                  setIsActivityModalOpen(true);
                }}
                className="relative w-9 h-9 rounded-xl bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                title="Village Activity & Alerts"
              >
                <Bell className="w-4 h-4 text-[#5C4328]" />
                {pendingTradesCount + incomingFriendRequestsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF7E67] text-white text-[9px] font-extrabold flex items-center justify-center shadow">
                    {pendingTradesCount + incomingFriendRequestsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* FLOATING TOAST NOTIFICATION */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-16 inset-x-4 z-40 px-4 py-2.5 rounded-2xl bg-[#4A3520] text-[#FFF9EB] text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 text-center border-2 border-[#F6B93B]"
            >
              <Sparkles className="w-4 h-4 text-[#F6B93B] shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BODY WRAPPER: DESKTOP SIDEBAR + MAIN SCROLLABLE VIEWPORT */}
        <div className="flex-1 flex min-h-0 min-w-0 w-full overflow-hidden">
          {/* DESKTOP WEBSITE LEFT SIDEBAR NAVIGATION (Only visible in Desktop Website Mode on lg+ screens) */}
          {!phoneFrameMode && (
            <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col justify-between bg-[#F5E9CE]/70 border-r-2 border-[#D8C5A0] p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Primary Post & Swipe Actions */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FF7E67] hover:bg-[#EE6C55] text-white font-game text-sm font-bold shadow-cozy-coral flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Post Item for Swap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSwipeDeckOpen(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#FFF6E0] hover:bg-[#F6B93B]/30 border-2 border-[#F6B93B] text-[#4A3520] font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#D9822B]" />
                    <span>Open Swipe Match Deck</span>
                  </button>
                </div>

                {/* Desktop Navigation Menu */}
                <div className="space-y-1.5">
                  <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46]">
                    Village Navigation
                  </span>
                  {(
                    [
                      {
                        id: 'explore',
                        label: 'Explore Trade Plaza',
                        icon: Compass,
                        badge: filteredMarketplaceItems.length,
                      },
                      {
                        id: 'radar',
                        label: 'Live Street & GPS Radar',
                        icon: Radio,
                        badge: `${radarRadiusKm} km`,
                      },
                      {
                        id: 'pocket',
                        label: 'My Pocket Inventory',
                        icon: Backpack,
                        badge: `${myInventory.length}/${MAX_POCKET_ITEMS}`,
                      },
                      {
                        id: 'trades',
                        label: 'Active Trades & Chat',
                        icon: ArrowLeftRight,
                        badge: pendingTradesCount > 0 ? pendingTradesCount : trades.length,
                        highlightBadge: pendingTradesCount > 0,
                      },
                      {
                        id: 'passport',
                        label: 'Passport & Leaderboard',
                        icon: User,
                        badge: `${currentUser.karma_score.toFixed(1)}★`,
                      },
                    ] as const
                  ).map((navItem) => {
                    const IconComponent = navItem.icon;
                    const isActive = activeTab === navItem.id;
                    return (
                      <button
                        key={navItem.id}
                        type="button"
                        onClick={() => {
                          if (navItem.id === 'passport') setInspectedUserId(null);
                          setActiveTab(navItem.id);
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-2xl font-game text-xs font-bold flex items-center justify-between transition-all border-2 ${
                          isActive
                            ? 'bg-[#4E9F6E] text-white border-[#367A51] shadow-sm'
                            : 'bg-[#FFFDF7] text-[#5C4328] border-[#D8C5A0] hover:bg-[#FFF9EB]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <IconComponent className="w-4 h-4" />
                          <span>{navItem.label}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'highlightBadge' in navItem && navItem.highlightBadge
                              ? 'bg-[#FF7E67] text-white'
                              : 'bg-[#F5E9CE] text-[#6E5031]'
                          }`}
                        >
                          {navItem.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Mini Trader Passport Card */}
                <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] border-2 border-[#4E9F6E] flex items-center justify-center text-2xl">
                      {currentUser.avatar_emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-[#2F7A4C] block truncate">
                        {currentUser.title_badge}
                      </span>
                      <h4 className="font-game text-sm font-bold text-[#4A3520] truncate">
                        {currentUser.display_name}
                      </h4>
                      <span className="text-[10px] font-bold text-[#7C6246] block truncate">
                        📍 {currentUser.location_name}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="py-1.5 px-2 rounded-xl bg-[#EBF7EE] hover:bg-[#D7F0DF] text-[#2F7A4C] text-[10px] font-extrabold text-center transition-colors"
                    >
                      🔑 Switch Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuestsModalOpen(true)}
                      className="py-1.5 px-2 rounded-xl bg-[#FFF6E0] hover:bg-[#F6B93B]/30 text-[#8C5811] text-[10px] font-extrabold text-center transition-colors"
                    >
                      🏆 Quests ({claimableQuestsCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Mode Hint */}
              <div className="pt-4 mt-4 border-t border-[#D8C5A0] text-[11px] font-bold text-[#7C6246] flex items-center justify-between">
                <span>🟢 Cloud Synced</span>
                <button
                  type="button"
                  onClick={() => handleSetViewMode(true)}
                  className="underline text-[#4E9F6E] hover:text-[#2F7A4C] font-extrabold"
                >
                  📱 Mobile View →
                </button>
              </div>
            </aside>
          )}

          {/* MAIN SCROLLABLE VIEWPORT */}
          <main
            className={`flex-1 min-h-0 min-w-0 w-full overflow-y-auto px-3.5 pt-3 space-y-3.5 ${
              phoneFrameMode ? 'pb-24' : 'pb-24 lg:pb-10 lg:px-6 lg:pt-5'
            }`}
          >
          {/* ========================================================= */}
          {/* TAB 1: EXPLORE LOCAL TRADE PLAZA                          */}
          {/* ========================================================= */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              <div className="rounded-3xl bg-gradient-to-r from-[#4E9F6E] to-[#3B8458] p-4 text-white shadow-cozy-green relative overflow-hidden">
                <div
                  className={`relative z-10 flex gap-3 ${
                    phoneFrameMode
                      ? 'flex-col'
                      : 'flex-col md:flex-row md:items-center md:justify-between'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      🌿 Local Trade-Off Season 1
                    </span>
                    <h1 className="font-game text-base sm:text-lg font-bold leading-snug">
                      Swap Treasures Around {currentUser.location_name}!
                    </h1>
                    <p className="text-xs text-white/90 font-semibold mt-0.5">
                      Tap any item to inspect Year, Condition & ask the owner questions!
                    </p>
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-2 shrink-0 ${
                      phoneFrameMode ? 'w-full pt-1' : 'w-full md:w-auto'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="px-3.5 py-2 rounded-2xl bg-[#F6B93B] hover:bg-[#E7A92B] text-[#4A3520] font-game text-xs font-bold shadow-cozy-gold active:translate-y-0.5 whitespace-nowrap text-center"
                    >
                      + Post Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSwipeDeckOpen(true)}
                      className="px-3.5 py-2 rounded-2xl bg-[#FF7E67] hover:bg-[#EE6C55] text-white font-game text-xs font-bold shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>Swipe Deck</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE VILLAGE SWAP EVENT, WANTED BOARD (ISO) & DAILY STREAK STRIP */}
              <div
                className={`grid gap-2 ${
                  phoneFrameMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = !eventFilterActive;
                    setEventFilterActive(next);
                    showToast(
                      next
                        ? '🎪 Filtering Plaza to Weekend Event Items (Gaming, Gadgets & Collectibles)!'
                        : '🌿 Showing all village categories.'
                    );
                  }}
                  className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    eventFilterActive
                      ? 'bg-[#FFF0EC] border-[#FF7E67] shadow-sm'
                      : 'bg-[#FFFDF7] border-[#D8C5A0] hover:bg-[#F5E9CE]/60'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold uppercase text-[#C84B31] block">
                      🎪 Live Weekend Event • 2x XP
                    </span>
                    <span className="font-game text-xs font-bold text-[#4A3520] block truncate">
                      Retro Gaming & Gadgets Fest
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FF7E67] text-white text-[10px] font-extrabold shrink-0">
                    {eventFilterActive ? 'Active ✓' : 'Filter'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWantedBoardOpen(true)}
                  className="p-2.5 rounded-2xl bg-[#FFFDF7] hover:bg-[#F5E9CE]/60 border-2 border-[#D8C5A0] text-left flex items-center justify-between transition-all"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold uppercase text-[#2F7A4C] block">
                      📌 Village Wanted Board
                    </span>
                    <span className="font-game text-xs font-bold text-[#4A3520] block truncate">
                      {wantedPosts.length} ISO Wishes Pinned
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-[#EBF7EE] text-[#2F7A4C] border border-[#8BD1A0] text-[10px] font-extrabold shrink-0">
                    Open →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClaimDailyStreak}
                  className={`p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                    dailyStreakClaimed
                      ? 'bg-[#EBF7EE] border-[#8BD1A0]'
                      : 'bg-[#FFF6E0] border-[#F6B93B] hover:bg-[#F6B93B]/20'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold uppercase text-[#8C5800] flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#FF7E67]" />
                      <span>Daily Village Streak</span>
                    </span>
                    <span className="font-game text-xs font-bold text-[#4A3520] block truncate">
                      {dailyStreakClaimed
                        ? 'Streak Claimed Today! ✓'
                        : 'Claim +30 XP & +10 KP'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                      dailyStreakClaimed
                        ? 'bg-[#4E9F6E] text-white'
                        : 'bg-[#F6B93B] text-[#4A3520]'
                    }`}
                  >
                    {dailyStreakClaimed ? 'Done' : 'Claim'}
                  </span>
                </button>
              </div>

              {/* Compact Search + Category Dropdown + Sort Dropdown Toolbar */}
              <div
                ref={filterDropdownRef}
                className="space-y-2"
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                    <Search className="w-4 h-4 text-[#8C6D46] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search item, brand, year (e.g. 1998, Nintendo)..."
                      className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-xs font-bold text-[#4A3520] placeholder-[#A68E6E] focus:outline-none focus:border-[#4E9F6E]"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F5E9CE] text-[#6E5031] text-[10px] font-extrabold flex items-center justify-center hover:bg-[#E8D5B0]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown Trigger + Popover */}
                  <div className="relative flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen((prev) => !prev);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full sm:w-auto px-3.5 py-2.5 rounded-2xl font-game text-xs font-bold border-2 flex items-center justify-between gap-2 transition-all ${
                        selectedCategory !== 'All'
                          ? 'bg-[#5C4328] text-[#FFF9EB] border-[#4A3520] shadow-sm'
                          : 'bg-[#FFFDF7] text-[#4A3520] border-[#D8C5A0] hover:bg-[#FFF9EB]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{CATEGORY_ICONS[selectedCategory]}</span>
                        <span>
                          {selectedCategory === 'All'
                            ? `All Categories (${CATEGORIES.length - 1})`
                            : selectedCategory}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isCategoryDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 rounded-3xl bg-[#FFF9EB] border-3 border-[#D8C5A0] shadow-2xl p-3 z-40 space-y-2.5"
                        >
                          <div className="flex items-center justify-between px-1">
                            <span className="font-game text-xs font-bold text-[#4A3520]">
                              🗂️ Browse by Category ({CATEGORIES.length - 1})
                            </span>
                            {selectedCategory !== 'All' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory('All');
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="text-[10px] font-extrabold text-[#FF7E67] hover:underline"
                              >
                                Reset to All
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#8C6D46] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={categorySearchFilter}
                              onChange={(e) =>
                                setCategorySearchFilter(e.target.value)
                              }
                              placeholder="Quick filter categories..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#D8C5A0] text-[11px] font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                            {CATEGORIES.filter((cat) =>
                              cat
                                .toLowerCase()
                                .includes(categorySearchFilter.toLowerCase())
                            ).map((category) => {
                              const active = selectedCategory === category;
                              const count =
                                category === 'All'
                                  ? items.filter(
                                      (i) =>
                                        i.owner_id !== currentUser.id &&
                                        i.is_for_trade
                                    ).length
                                  : items.filter(
                                      (i) =>
                                        i.owner_id !== currentUser.id &&
                                        i.is_for_trade &&
                                        i.category === category
                                    ).length;
                              return (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setIsCategoryDropdownOpen(false);
                                    setCategorySearchFilter('');
                                  }}
                                  className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-extrabold border flex items-center justify-between gap-1.5 transition-all ${
                                    active
                                      ? 'bg-[#5C4328] text-[#FFF9EB] border-[#4A3520] shadow-sm'
                                      : 'bg-[#FFFDF7] text-[#5C4328] border-[#D8C5A0] hover:bg-[#F5E9CE]'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span>{CATEGORY_ICONS[category]}</span>
                                    <span className="truncate">{category}</span>
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                                      active
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#F5E9CE] text-[#7C6246]'
                                    }`}
                                  >
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sort & Filter Dropdown Trigger + Popover */}
                  <div className="relative flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSortDropdownOpen((prev) => !prev);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full sm:w-auto px-3.5 py-2.5 rounded-2xl font-game text-xs font-bold border-2 flex items-center justify-between gap-2 transition-all ${
                        sortMode !== 'closest'
                          ? 'bg-[#4E9F6E] text-white border-[#367A51] shadow-sm'
                          : 'bg-[#FFFDF7] text-[#4A3520] border-[#D8C5A0] hover:bg-[#FFF9EB]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {
                            {
                              closest: '📍 Closest',
                              matches: '🎯 Wants My Items',
                              friends: `🤝 Friends (${acceptedFriendIds.length})`,
                              rarity: '👑 Highest Rarity',
                              vintage: '📅 Oldest / Vintage',
                              saved: `❤️ Saved (${likedItemIds.length})`,
                            }[sortMode]
                          }
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSortDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isSortDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 mt-2 w-60 rounded-3xl bg-[#FFF9EB] border-3 border-[#D8C5A0] shadow-2xl p-2.5 z-40 space-y-1"
                        >
                          <div className="px-2 py-1 font-game text-xs font-bold text-[#4A3520]">
                            🔃 Sort & Filter Feed
                          </div>
                          {(
                            [
                              { id: 'closest', label: '📍 Closest to Me' },
                              { id: 'matches', label: '🎯 Wants My Items' },
                              {
                                id: 'friends',
                                label: `🤝 Friends' Items (${acceptedFriendIds.length})`,
                              },
                              { id: 'rarity', label: '👑 Highest Rarity' },
                              { id: 'vintage', label: '📅 Oldest / Vintage' },
                              {
                                id: 'saved',
                                label: `❤️ Saved Wishlist (${likedItemIds.length})`,
                              },
                            ] as const
                          ).map((s) => {
                            const active = sortMode === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSortMode(s.id);
                                  setIsSortDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-extrabold flex items-center justify-between transition-all ${
                                  active
                                    ? 'bg-[#4E9F6E] text-white shadow-sm'
                                    : 'text-[#5C4328] hover:bg-[#F5E9CE]'
                                }`}
                              >
                                <span>{s.label}</span>
                                {active && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Compact Active Filter Chip Strip (only visible when filtering) */}
                {(selectedCategory !== 'All' ||
                  sortMode !== 'closest' ||
                  debouncedQuery !== '' ||
                  eventFilterActive) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] mr-1">
                      Active Filters:
                    </span>
                    {selectedCategory !== 'All' && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('All')}
                        className="px-2.5 py-1 rounded-full bg-[#5C4328] text-[#FFF9EB] text-[11px] font-extrabold flex items-center gap-1"
                      >
                        <span>
                          {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
                        </span>
                        <span className="opacity-80">✕</span>
                      </button>
                    )}
                    {sortMode !== 'closest' && (
                      <button
                        type="button"
                        onClick={() => setSortMode('closest')}
                        className="px-2.5 py-1 rounded-full bg-[#4E9F6E] text-white text-[11px] font-extrabold flex items-center gap-1"
                      >
                        <span>Sort: {sortMode}</span>
                        <span className="opacity-80">✕</span>
                      </button>
                    )}
                    {debouncedQuery !== '' && (
                      <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        className="px-2.5 py-1 rounded-full bg-[#F5E9CE] text-[#4A3520] border border-[#D8C5A0] text-[11px] font-extrabold flex items-center gap-1"
                      >
                        <span>"{searchInput}"</span>
                        <span className="opacity-80">✕</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSortMode('closest');
                        setSearchInput('');
                        setEventFilterActive(false);
                      }}
                      className="text-[11px] font-extrabold text-[#FF7E67] hover:underline ml-1"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Paginated Item Cards Feed or Founding Villager Empty State */}
              {filteredMarketplaceItems.length === 0 ? (
                <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-dashed border-[#D8C5A0] p-6 text-center space-y-3 shadow-sm">
                  <div className="text-4xl">🌱</div>
                  <h3 className="font-game text-base sm:text-lg font-bold text-[#4A3520]">
                    {selectedCategory !== 'All' ||
                    debouncedQuery !== '' ||
                    sortMode !== 'closest' ||
                    eventFilterActive
                      ? 'No Items Match Your Current Filter'
                      : 'The Local Trade Plaza is Fresh & Open!'}
                  </h3>
                  <p className="text-xs font-bold text-[#7C6246] max-w-md mx-auto">
                    {selectedCategory !== 'All' ||
                    debouncedQuery !== '' ||
                    sortMode !== 'closest' ||
                    eventFilterActive
                      ? 'Try resetting your category or search filter, or post an item in this category!'
                      : `Be the first Founding Villager around ${currentUser.location_name} to post an item for swap (+25 XP) or pin a wish to the Wanted Board!`}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {(selectedCategory !== 'All' ||
                      debouncedQuery !== '' ||
                      sortMode !== 'closest' ||
                      eventFilterActive) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All');
                          setSearchInput('');
                          setSortMode('closest');
                          setEventFilterActive(false);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#5C4328] font-game text-xs font-bold"
                      >
                        Reset All Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green"
                    >
                      + Post Your First Item (+25 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWantedBoardOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-[#FFF6E0] hover:bg-[#F6B93B]/30 border-2 border-[#F6B93B] text-[#4A3520] font-game text-xs font-bold"
                    >
                      📌 Pin an ISO Wish Note
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`grid gap-4 ${
                      phoneFrameMode
                        ? 'grid-cols-1'
                        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    }`}
                  >
                    {paginatedMarketplaceItems.map((item) => (
                      <MagicGameCard
                        key={item.id}
                        item={item}
                        isOwnItem={item.owner_id === currentUser.id}
                        isFriendItem={acceptedFriendIds.includes(item.owner_id)}
                        isLiked={likedItemIds.includes(item.id)}
                        hasWishlistMatch={checkHasWishlistMatch(item)}
                        onLikeItem={handleToggleLikeItem}
                        onProposeTrade={(target) => setTradeTargetItem(target)}
                        onInspectItem={(target) => setInspectedItem(target)}
                        onShareItem={(target) => setSharingItem(target)}
                        onInspectProfile={(ownerId) => {
                          setInspectedUserId(ownerId);
                          setActiveTab('passport');
                        }}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Sentinel */}
                  <div
                    ref={loadMoreSentinelRef}
                    className="py-4 flex flex-col items-center justify-center gap-2"
                  >
                    {hasMorePages ? (
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#6E5031]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#4E9F6E]" />
                        <span>
                          Loading more nearby treasures ({paginatedMarketplaceItems.length}{' '}
                          of {filteredMarketplaceItems.length})...
                        </span>
                      </div>
                    ) : (
                      <div className="w-full rounded-2xl bg-[#F5E9CE]/70 border-2 border-dashed border-[#D8C5A0] p-3.5 text-center">
                        <p className="text-xs font-extrabold text-[#5C4328]">
                          🌟 Showing all {filteredMarketplaceItems.length} nearby items in this category!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: LIVE GPS RADAR & LOCATION TRACKER                  */}
          {/* ========================================================= */}
          {activeTab === 'radar' && (
            <RadarMapView
              currentUser={currentUser}
              items={itemsWithDistance}
              friendIds={acceptedFriendIds}
              radiusKm={radarRadiusKm}
              gpsStatus={gpsStatus}
              onChangeRadius={setRadarRadiusKm}
              onTriggerRealGps={handleTriggerRealGps}
              onSimulateMove={handleSimulateMove}
              onSelectItemForTrade={(item) => setTradeTargetItem(item)}
              onInspectItem={(item) => setInspectedItem(item)}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 3: MY POCKET INVENTORY                                */}
          {/* ========================================================= */}
          {activeTab === 'pocket' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-4 shadow-cozy space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-game text-lg font-bold text-[#4A3520] flex items-center gap-2 flex-wrap">
                      <span>🎒 My Pocket Inventory</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#F5E9CE] text-[#6E5031]">
                        {myInventory.length} / {MAX_POCKET_ITEMS} Items
                      </span>
                    </h2>
                    <p className="text-xs font-bold text-[#7C6246] mt-0.5">
                      Each trader can hold up to {MAX_POCKET_ITEMS} items. Tap any slot to toggle "Up for Trade"!
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={myInventory.length >= MAX_POCKET_ITEMS}
                    onClick={() => setIsUploadOpen(true)}
                    className={`px-3.5 py-2.5 rounded-2xl font-game text-xs font-bold flex items-center gap-1 shrink-0 ${
                      myInventory.length >= MAX_POCKET_ITEMS
                        ? 'bg-[#D8C5A0] text-[#7C6246] cursor-not-allowed'
                        : 'bg-[#4E9F6E] text-white shadow-cozy-green'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {myInventory.length >= MAX_POCKET_ITEMS
                        ? 'Pocket Full'
                        : 'Add Item'}
                    </span>
                  </button>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#EFE2C6] overflow-hidden border border-[#D8C5A0]">
                  <div
                    className="h-full bg-gradient-to-r from-[#4E9F6E] to-[#F6B93B] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (myInventory.length / MAX_POCKET_ITEMS) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* 📊 Pocket Valuation & Demand Analytics Strip */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-center">
                  <span className="font-game text-base font-bold text-[#4E9F6E] block">
                    {myInventory.reduce(
                      (acc, i) => acc + (RARITY_WEIGHT[i.rarity] || 1) * 2.5,
                      0
                    )}{' '}
                    pts
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                    Pocket Appraisal
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-center">
                  <span className="font-game text-base font-bold text-[#FF7E67] block">
                    ❤️{' '}
                    {myInventory.reduce((acc, i) => acc + (i.likes_count || 0), 0)}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                    Community Likes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) =>
                      prev.map((i) =>
                        i.owner_id === currentUser.id
                          ? { ...i, is_for_trade: true }
                          : i
                      )
                    );
                    showToast('🟢 Marked all items in your Pocket as Up for Trade!');
                  }}
                  className="p-3 rounded-2xl bg-[#EBF7EE] hover:bg-[#DDF2E3] border-2 border-[#8BD1A0] text-center transition-colors"
                >
                  <span className="font-game text-xs font-bold text-[#2F7A4C] block">
                    🟢 Activate All
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-[#4E9F6E]">
                    1-Tap Trade All
                  </span>
                </button>
              </div>

              <div className="rounded-3xl bg-[#F5E9CE] border-3 border-[#D8C5A0] p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6E5031] mb-2 flex items-center justify-between px-1">
                  <span>
                    ✨ Quick Equipment Slots ({myInventory.length}/{MAX_POCKET_ITEMS})
                  </span>
                  <span>
                    {myInventory.filter((i) => i.is_for_trade).length} Active for Trade
                  </span>
                </div>
                <div
                  className={`grid gap-2 ${
                    phoneFrameMode
                      ? 'grid-cols-5'
                      : 'grid-cols-5 sm:grid-cols-10'
                  }`}
                >
                  {Array.from({ length: MAX_POCKET_ITEMS }).map((_, slotIdx) => {
                    const slotItem = myInventory[slotIdx];
                    if (!slotItem) {
                      return (
                        <button
                          key={slotIdx}
                          type="button"
                          onClick={() => setIsUploadOpen(true)}
                          className="aspect-square rounded-2xl bg-[#E8D8B9]/70 border-2 border-dashed border-[#C7B087] flex flex-col items-center justify-center text-[#8C6D46] hover:bg-[#FFF9EB] transition-colors"
                        >
                          <Plus className="w-4 h-4 opacity-60" />
                          <span className="text-[8px] font-extrabold mt-0.5">
                            #{slotIdx + 1}
                          </span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={slotItem.id}
                        type="button"
                        onClick={() => handleToggleForTrade(slotItem.id)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                          slotItem.is_for_trade
                            ? 'border-[#4E9F6E] shadow-sm'
                            : 'border-[#B89F72] opacity-75'
                        }`}
                      >
                        <img
                          src={
                            slotItem.media_type === 'video'
                              ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                              : slotItem.media_url
                          }
                          alt={slotItem.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center shadow ${
                            slotItem.is_for_trade
                              ? 'bg-[#4E9F6E]'
                              : 'bg-[#5C4328]'
                          }`}
                        >
                          {slotItem.is_for_trade ? '🟢' : '🔒'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {myInventory.length === 0 ? (
                <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-dashed border-[#D8C5A0] p-6 text-center space-y-3 shadow-sm">
                  <div className="text-4xl">🎒</div>
                  <h3 className="font-game text-base font-bold text-[#4A3520]">
                    Your 20-Slot Pocket Inventory is Empty!
                  </h3>
                  <p className="text-xs font-bold text-[#7C6246] max-w-md mx-auto">
                    Snap a photo of a game, gadget, book, plant cutting, or craft item you’d love to trade locally to fill Slot #1 and earn +25 XP!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green"
                  >
                    + Add Your First Item (+25 XP)
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    phoneFrameMode
                      ? 'grid-cols-1'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {myInventory.map((item) => (
                    <MagicGameCard
                      key={item.id}
                      item={item}
                      isOwnItem={true}
                      onProposeTrade={() => {}}
                      onInspectItem={(target) => setInspectedItem(target)}
                      onToggleForTrade={handleToggleForTrade}
                      onDeleteItem={handleDeleteOwnItem}
                      onEditItem={(target) => setEditingItem(target)}
                      onShareItem={(target) => setSharingItem(target)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: TRADE OFFERS, CHAT Q&A & COUNTER-OFFERS            */}
          {/* ========================================================= */}
          {activeTab === 'trades' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-4 shadow-cozy space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-game text-lg font-bold text-[#4A3520] flex items-center gap-2">
                    <span>⚔️ Active Trades, Chat & Counter-Offers</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#FFF0EC] text-[#FF7E67]">
                      {trades.length} Total
                    </span>
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: `All (${trades.length})` },
                        {
                          id: 'active',
                          label: `Active (${
                            trades.filter((t) => t.status !== 'completed' && t.status !== 'declined').length
                          })`,
                        },
                        {
                          id: 'completed',
                          label: `Completed (${
                            trades.filter((t) => t.status === 'completed').length
                          })`,
                        },
                      ] as const
                    ).map((tf) => (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => setTradeStatusFilter(tf.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                          tradeStatusFilter === tf.id
                            ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                            : 'bg-[#FFF9EB] text-[#6E5031] border-[#D8C5A0]'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs font-bold text-[#7C6246]">
                  Chat with traders to ask questions, propose counter-offers, schedule safe meetups, or verify meetup PINs!
                </p>
              </div>

              {trades.filter((t) => {
                if (tradeStatusFilter === 'active')
                  return t.status !== 'completed' && t.status !== 'declined';
                if (tradeStatusFilter === 'completed')
                  return t.status === 'completed';
                return true;
              }).length === 0 ? (
                <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-dashed border-[#D8C5A0] p-6 text-center space-y-3 shadow-sm">
                  <div className="text-4xl">⚔️</div>
                  <h3 className="font-game text-base font-bold text-[#4A3520]">
                    No Trade Offers Yet
                  </h3>
                  <p className="text-xs font-bold text-[#7C6246] max-w-md mx-auto">
                    Browse the Trade Plaza and tap "Offer Trade" on any item, or post items to your Pocket so nearby villagers can send you offers!
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('explore')}
                      className="px-4 py-2.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green"
                    >
                      🧭 Explore Trade Plaza
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#5C4328] font-game text-xs font-bold"
                    >
                      + Post Item to Pocket
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className={`grid gap-4 ${
                  phoneFrameMode ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
                }`}
              >
              {trades
                .filter((t) => {
                  if (tradeStatusFilter === 'active')
                    return t.status !== 'completed' && t.status !== 'declined';
                  if (tradeStatusFilter === 'completed')
                    return t.status === 'completed';
                  return true;
                })
                .map((trade) => {
                const requestedItem = items.find(
                  (i) => i.id === trade.requested_item_id
                );
                const offeredItems = items.filter((i) =>
                  trade.offered_item_ids.includes(i.id)
                );
                const isIncoming = trade.receiver_id === currentUser.id;
                const msgCount = trade.messages?.length || 0;

                return (
                  <motion.div
                    key={trade.id}
                    layout
                    className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-4 shadow-cozy space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0] flex items-center justify-center text-lg">
                          {isIncoming ? trade.sender_avatar : trade.receiver_avatar}
                        </span>
                        <div>
                          <span className="text-xs font-extrabold text-[#4A3520] block">
                            {isIncoming
                              ? `${trade.sender_name} wants to trade!`
                              : `Trade with ${trade.receiver_name}`}
                          </span>
                          <span className="text-[11px] font-bold text-[#4E9F6E]">
                            📍 Meetup ~{trade.meetup_distance_km} km away
                            {trade.counter_count > 0 &&
                              ` • 🔄 ${trade.counter_count}x Countered`}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                          trade.status === 'pending'
                            ? 'bg-[#FFF6E0] text-[#B57C1E] border border-[#EED9B3]'
                            : trade.status === 'countered'
                            ? 'bg-[#FFF0EC] text-[#FF7E67] border border-[#FF7E67]/40'
                            : trade.status === 'accepted'
                            ? 'bg-[#EBF7EE] text-[#2F7A4C] border border-[#8BD1A0]'
                            : trade.status === 'completed'
                            ? 'bg-[#E1F3FD] text-[#1F6E9C] border border-[#92CBEB]'
                            : 'bg-[#F3E9D7] text-[#8C755B]'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </div>

                    {/* Visual Item Swap Box */}
                    <div className="grid grid-cols-11 gap-2 items-center bg-[#F5E9CE]/70 p-3 rounded-2xl border border-[#D8C5A0]">
                      <div className="col-span-5 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-[#7C6246] block">
                          {isIncoming ? '🎁 They Offer' : '🎁 You Offer'} (
                          {offeredItems.length})
                        </span>
                        <div className="flex -space-x-2 overflow-hidden py-0.5">
                          {offeredItems.map((offItem) => (
                            <img
                              key={offItem.id}
                              onClick={() => setInspectedItem(offItem)}
                              src={
                                offItem.media_type === 'video'
                                  ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                                  : offItem.media_url
                              }
                              alt={offItem.title}
                              title={`${offItem.title} (${offItem.year_made})`}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm cursor-pointer"
                            />
                          ))}
                        </div>
                        <p className="text-[11px] font-extrabold text-[#4A3520] truncate">
                          {offeredItems
                            .map((i) => `${i.title} (${i.year_made})`)
                            .join(' + ')}
                        </p>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <div className="w-7 h-7 rounded-full bg-[#FF7E67] text-white flex items-center justify-center shadow-sm">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="col-span-5 space-y-1 text-right">
                        <span className="text-[10px] font-extrabold uppercase text-[#7C6246] block">
                          {isIncoming ? '🎯 Your Item' : '🎯 Their Item'}
                        </span>
                        {requestedItem && (
                          <div className="flex justify-end py-0.5">
                            <img
                              onClick={() => setInspectedItem(requestedItem)}
                              src={
                                requestedItem.media_type === 'video'
                                  ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                                  : requestedItem.media_url
                              }
                              alt={requestedItem.title}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm cursor-pointer"
                            />
                          </div>
                        )}
                        <p className="text-[11px] font-extrabold text-[#4A3520] truncate">
                          {requestedItem
                            ? `${requestedItem.title} (${requestedItem.year_made})`
                            : 'Mystery Item'}
                        </p>
                      </div>
                    </div>

                    {/* Safe Meetup Ticket or Schedule Meetup Button */}
                    {trade.meetup_spot_name ? (
                      <div className="p-2.5 rounded-2xl bg-[#EBF7EE] border-2 border-[#8BD1A0] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase text-[#2F7A4C] block">
                            📍 Scheduled Safe Meetup ({trade.meetup_time_slot})
                          </span>
                          <p className="font-game text-xs font-bold text-[#4A3520] truncate">
                            {trade.meetup_spot_name}
                          </p>
                          <p className="text-[10px] font-bold text-[#7C6246] truncate">
                            {trade.meetup_spot_address}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              trade.meetup_spot_name
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Maps</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setChatModalInitialMode('meetup');
                              setActiveChatTradeId(trade.id);
                            }}
                            className="px-2 py-1.5 rounded-xl bg-white border border-[#8BD1A0] text-[#2F7A4C] text-[10px] font-extrabold"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setChatModalInitialMode('meetup');
                          setActiveChatTradeId(trade.id);
                        }}
                        className="w-full py-2 px-3 rounded-2xl bg-[#EBF7EE] hover:bg-[#DDF2E3] border border-[#8BD1A0] text-[#2F7A4C] text-xs font-extrabold flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Pick a Safe Public Meetup Cafe / Library & Time</span>
                        </span>
                        <span className="text-[10px] underline">Schedule →</span>
                      </button>
                    )}

                    {/* Latest Chat Message Preview */}
                    <div
                      onClick={() => {
                        setChatModalInitialMode('chat');
                        setActiveChatTradeId(trade.id);
                      }}
                      className="px-3 py-2 rounded-2xl bg-[#FFF9EB] hover:bg-[#F5E9CE]/60 border border-[#EED9B3] text-xs font-bold text-[#5C4328] cursor-pointer flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate">
                        💬 “
                        {trade.messages && trade.messages.length > 0
                          ? trade.messages[trade.messages.length - 1].text
                          : trade.message}
                        ”
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#EBF7EE] text-[#2F7A4C] text-[10px] font-extrabold">
                        {msgCount} msgs →
                      </span>
                    </div>

                    {/* Chat & Counter-Offer Action Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setChatModalInitialMode('chat');
                          setActiveChatTradeId(trade.id);
                        }}
                        className="py-2 px-3 rounded-2xl bg-[#FFF9EB] hover:bg-[#F5E9CE] border-2 border-[#D8C5A0] text-[#4A3520] font-game text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
                        <span>Chat & Ask ({msgCount})</span>
                      </button>

                      {(trade.status === 'pending' ||
                        trade.status === 'countered') && (
                        <button
                          type="button"
                          onClick={() => {
                            setChatModalInitialMode('counter');
                            setActiveChatTradeId(trade.id);
                          }}
                          className="py-2 px-3 rounded-2xl bg-[#FFF0EC] hover:bg-[#FFE0D6] border-2 border-[#FF7E67] text-[#C84B31] font-game text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Counter-Offer</span>
                        </button>
                      )}
                    </div>

                    {/* Accept / Decline / Verify Meetup PIN Primary Actions */}
                    {(trade.status === 'pending' ||
                      trade.status === 'countered') && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateTradeStatus(trade.id, 'accepted')
                          }
                          className="flex-1 py-2.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            Accept{' '}
                            {trade.status === 'countered'
                              ? 'Counter-Offer'
                              : 'Trade Offer'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateTradeStatus(trade.id, 'declined')
                          }
                          className="px-4 py-2.5 rounded-2xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#7C6246] font-game text-xs font-bold"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {trade.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => setMeetupPinTradeId(trade.id)}
                        className="w-full py-3 rounded-2xl bg-[#F6B93B] hover:bg-[#E7A92B] text-[#4A3520] font-game text-xs font-bold shadow-cozy-gold flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          Verify Meetup PIN & Complete Swap (+100 XP)
                        </span>
                      </button>
                    )}

                    {trade.status === 'completed' && !trade.rated_by_user && (
                      <button
                        type="button"
                        onClick={() => setRatingTrade(trade)}
                        className="w-full py-2.5 rounded-2xl bg-[#EBF7EE] border-2 border-[#4E9F6E] text-[#2F7A4C] font-game text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-4 h-4 fill-[#F6B93B] text-[#F6B93B]" />
                        <span>Rate Trader Karma (+50 XP)</span>
                      </button>
                    )}
                  </motion.div>
                );
              })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PLAYER PASSPORT, FRIENDS & KARMA LEADERBOARD       */}
          {/* ========================================================= */}
          {activeTab === 'passport' && (
            <div className="space-y-4">
              {inspectedUserId && inspectedUserId !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => setInspectedUserId(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5E9CE] text-xs font-extrabold text-[#5C4328]"
                >
                  ← Back to My Passport
                </button>
              )}

              <div className="rounded-3xl bg-gradient-to-b from-[#FFFDF7] to-[#F5E9CE] border-[3px] border-[#D8C5A0] p-4 sm:p-5 shadow-cozy relative overflow-hidden">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 shrink-0 rounded-3xl bg-[#FFF9EB] border-3 border-[#4E9F6E] flex items-center justify-center text-3xl shadow-md">
                      {displayedProfile.avatar_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2F7A4C] text-[10px] font-extrabold border border-[#9FD8B2]">
                        {displayedProfile.title_badge}
                      </span>
                      <h2 className="font-game text-lg sm:text-xl font-bold text-[#4A3520] mt-0.5 truncate">
                        {displayedProfile.display_name}
                      </h2>
                      <p className="text-xs font-bold text-[#7C6246] truncate">
                        @{displayedProfile.username} • 📍{' '}
                        {displayedProfile.location_name}
                      </p>
                    </div>
                  </div>

                  {displayedProfile.id === currentUser.id ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditProfileOpen(true)}
                        className="px-2.5 py-2 rounded-2xl bg-[#FFF9EB] hover:bg-white border-2 border-[#D8C5A0] text-[11px] font-extrabold text-[#5C4328] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#4E9F6E] shrink-0" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharingProfile(displayedProfile)}
                        className="px-2.5 py-2 rounded-2xl bg-[#FFF9EB] hover:bg-white border-2 border-[#D8C5A0] text-[11px] font-extrabold text-[#5C4328] flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#FF7E67] shrink-0" />
                        <span>Share QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-2.5 py-2 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5 shrink-0" />
                        <span>Account</span>
                      </button>
                    </div>
                  ) : displayedFriendStatus === 'friends' ? (
                    <span className="px-3 py-2 rounded-2xl bg-[#EBF7EE] border-2 border-[#8BD1A0] text-xs font-extrabold text-[#2F7A4C] flex items-center justify-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Trade Buddies (Friends)</span>
                    </span>
                  ) : displayedFriendStatus === 'incoming' ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleAcceptFriendRequest(displayedProfile.id)
                      }
                      className="w-full px-3 py-2 rounded-2xl bg-[#F6B93B] text-xs font-extrabold text-[#4A3520] shadow-sm"
                    >
                      Accept Friend Request
                    </button>
                  ) : displayedFriendStatus === 'outgoing' ? (
                    <span className="px-3 py-2 rounded-2xl bg-[#F5E9CE] text-xs font-extrabold text-[#7C6246] text-center">
                      Friend Request Sent ⏳
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendFriendRequest(displayedProfile)}
                      className="w-full px-3 py-2 rounded-2xl bg-[#4E9F6E] text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-cozy-green"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add as Trade Buddy</span>
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs font-bold text-[#5C4328] bg-[#FFF9EB] p-3 rounded-2xl border border-[#E6D5B5]">
                  “{displayedProfile.bio}”
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="rounded-2xl bg-[#FFF9EB] border-2 border-[#EED9B3] p-2.5 text-center">
                    <div className="font-game text-lg font-bold text-[#C88719] flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-[#F6B93B] text-[#F6B93B]" />
                      <span>{displayedProfile.karma_score.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                      Karma Score ({displayedProfile.karma_reviews_count})
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#FFF9EB] border-2 border-[#EED9B3] p-2.5 text-center">
                    <div className="font-game text-lg font-bold text-[#4E9F6E]">
                      {displayedProfile.karma_points}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                      Karma Points
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#FFF9EB] border-2 border-[#EED9B3] p-2.5 text-center">
                    <div className="font-game text-lg font-bold text-[#4A3520]">
                      {displayedProfile.completed_trades}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                      Swaps Done
                    </span>
                  </div>
                </div>

                {/* Friends Quick Bar on Own Passport */}
                {displayedProfile.id === currentUser.id && (
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-[#D8C5A0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {friends
                          .filter((f) => f.status === 'friends')
                          .map((f) => (
                            <span
                              key={f.id}
                              className="w-8 h-8 rounded-full bg-[#FFF9EB] border-2 border-[#4E9F6E] flex items-center justify-center text-sm shadow-sm"
                            >
                              {f.friend_avatar}
                            </span>
                          ))}
                      </div>
                      <span className="text-xs font-extrabold text-[#4A3520]">
                        {acceptedFriendIds.length} Trade Buddies
                        {incomingFriendRequestsCount > 0 && (
                          <span className="ml-1 text-[#FF7E67]">
                            ({incomingFriendRequestsCount} new request!)
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFriendsModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#4E9F6E] text-white font-game text-xs font-bold shadow-sm"
                    >
                      Open Friends List
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C6246] mb-1.5">
                    🏅 Community Karma Badges
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {displayedProfile.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2.5 py-1 rounded-xl bg-[#FFF9EB] border border-[#D8C5A0] text-[11px] font-extrabold text-[#5C4328]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* If viewing a Friend's / Other Trader's Passport, show their Pocket Items up for trade! */}
              {displayedProfile.id !== currentUser.id && (
                <div className="space-y-3">
                  <h3 className="font-game text-base font-bold text-[#4A3520] flex items-center justify-between">
                    <span>
                      🎒 {displayedProfile.display_name}'s Pocket Inventory
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#F5E9CE] text-[#6E5031]">
                      {displayedProfileItems.length} / {MAX_POCKET_ITEMS} Slots
                    </span>
                  </h3>
                  {displayedProfileItems.map((item) => (
                    <MagicGameCard
                      key={item.id}
                      item={item}
                      isOwnItem={false}
                      isFriendItem={acceptedFriendIds.includes(item.owner_id)}
                      isLiked={likedItemIds.includes(item.id)}
                      onLikeItem={handleToggleLikeItem}
                      onProposeTrade={(target) => setTradeTargetItem(target)}
                      onInspectItem={(target) => setInspectedItem(target)}
                    />
                  ))}
                </div>
              )}

              {/* VILLAGE KARMA LEADERBOARD */}
              <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-4 shadow-cozy space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-game text-base font-bold text-[#4A3520] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#F6B93B]" />
                    <span>Village Karma Leaderboard</span>
                  </h3>
                  <span className="text-[11px] font-extrabold text-[#4E9F6E]">
                    Top Ranked Traders
                  </span>
                </div>

                <div className="space-y-2">
                  {[...profiles]
                    .sort((a, b) => b.karma_points - a.karma_points)
                    .map((trader, idx) => {
                      const isMe = trader.id === currentUser.id;
                      const isBuddy = acceptedFriendIds.includes(trader.id);
                      return (
                        <div
                          key={trader.id}
                          onClick={() => setInspectedUserId(trader.id)}
                          className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            isMe
                              ? 'bg-[#EBF7EE] border-[#4E9F6E]'
                              : 'bg-[#FFF9EB] border-[#E6D5B5] hover:bg-[#F5E9CE]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 text-center font-game font-bold text-sm text-[#8C6D46]">
                              {idx === 0
                                ? '🥇'
                                : idx === 1
                                ? '🥈'
                                : idx === 2
                                ? '🥉'
                                : `#${idx + 1}`}
                            </span>
                            <span className="w-9 h-9 rounded-2xl bg-white border border-[#D8C5A0] flex items-center justify-center text-lg">
                              {trader.avatar_emoji}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-[#4A3520]">
                                  {trader.display_name} {isMe && '(You)'}
                                </span>
                                {isBuddy && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-[#EBF7EE] text-[#2F7A4C] text-[9px] font-extrabold">
                                    🤝 Friend
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-[#7C6246]">
                                Lv.{trader.level} • {trader.title_badge}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-extrabold text-[#C88719] flex items-center justify-end gap-1">
                              <Star className="w-3.5 h-3.5 fill-[#F6B93B] text-[#F6B93B]" />
                              <span>{trader.karma_score.toFixed(2)}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#4E9F6E]">
                              {trader.karma_points} KP
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* RECENT KARMA REVIEWS */}
              <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-4 shadow-cozy space-y-3">
                <h3 className="font-game text-base font-bold text-[#4A3520]">
                  💬 Trader Karma Wall ({reviews.length})
                </h3>
                {reviews.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-dashed border-[#D8C5A0] text-center text-xs font-bold text-[#7C6246]">
                    🌟 No Karma reviews yet! Complete an in-person swap using the Meetup Handshake PIN/QR to earn 5★ Karma & Vibe Badges.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-[#FFF9EB] border border-[#E6D5B5] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{rev.reviewer_avatar}</span>
                            <span className="text-xs font-extrabold text-[#4A3520]">
                              {rev.reviewer_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#EBF7EE] text-[#2F7A4C] text-[10px] font-extrabold">
                              {rev.vibe_badge}
                            </span>
                          </div>
                          <div className="flex items-center text-[#F6B93B]">
                            {Array.from({ length: rev.stars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#F6B93B]" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-[#5C4328]">
                          “{rev.comment}”
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CLOUD SYNC & DATA CONTROLS CARD */}
              <div className="rounded-3xl bg-[#F5E9CE]/70 border-2 border-[#D8C5A0] p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-game text-xs font-bold text-[#4A3520] block">
                    ☁️ Cloud Storage & Pocket Data Backup
                  </span>
                  <span className="text-[11px] font-bold text-[#7C6246]">
                    {supabaseConnected
                      ? '🟢 Connected to Supabase Cloud'
                      : 'Local + Cloud Hybrid Sync Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCleanDemoData}
                    className="px-3 py-1.5 rounded-xl bg-[#FFF0EC] hover:bg-[#FFE0D6] border border-[#FF7E67] text-[#C84B31] text-xs font-extrabold"
                  >
                    🧹 Reset All Data
                  </button>
                  <button
                    type="button"
                    onClick={() => syncWithSupabase()}
                    className="px-3 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white text-xs font-extrabold"
                  >
                    ☁️ Sync Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            {
                              user: currentUser,
                              items: myInventory,
                              trades,
                              exportedAt: new Date().toISOString(),
                            },
                            null,
                            2
                          ),
                        ],
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pocketswap-backup-${currentUser.username}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('💾 Downloaded your Pocket Inventory JSON backup!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF9EB] border border-[#D8C5A0] text-[#5C4328] text-xs font-extrabold"
                  >
                    💾 Export Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        </div>

        {/* BOTTOM GAME NAVIGATION DOCK (Always visible in Mobile App Mode, or on tablet/mobile screens in Website Mode) */}
        <nav
          className={`sticky bottom-0 z-30 shrink-0 bg-[#FFFDF7]/95 backdrop-blur-md border-t-3 border-[#D8C5A0] px-3 py-2 flex items-center justify-around ${
            !phoneFrameMode ? 'lg:hidden' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'explore'
                ? 'text-[#4E9F6E] font-extrabold scale-105'
                : 'text-[#8C6D46] font-bold'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px]">Plaza</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'radar'
                ? 'text-[#4E9F6E] font-extrabold scale-105'
                : 'text-[#8C6D46] font-bold'
            }`}
          >
            <Radio className="w-5 h-5" />
            <span className="text-[10px]">Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="-mt-6 w-14 h-14 rounded-3xl bg-[#FF7E67] hover:bg-[#EE6C55] text-white shadow-cozy-coral border-4 border-[#FFF9EB] flex flex-col items-center justify-center active:translate-y-0.5 transition-all"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pocket')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'pocket'
                ? 'text-[#4E9F6E] font-extrabold scale-105'
                : 'text-[#8C6D46] font-bold'
            }`}
          >
            <Backpack className="w-5 h-5" />
            <span className="text-[10px]">Pocket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'trades'
                ? 'text-[#4E9F6E] font-extrabold scale-105'
                : 'text-[#8C6D46] font-bold'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px]">Trades</span>
            {pendingTradesCount > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-[#FF7E67] text-white text-[9px] font-extrabold flex items-center justify-center">
                {pendingTradesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setInspectedUserId(null);
              setActiveTab('passport');
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'passport'
                ? 'text-[#4E9F6E] font-extrabold scale-105'
                : 'text-[#8C6D46] font-bold'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Karma</span>
          </button>
        </nav>

        {/* MODALS */}
        <ActivityFeedModal
          isOpen={isActivityModalOpen}
          currentUser={currentUser}
          trades={trades}
          friends={friends}
          matchingItems={filteredMarketplaceItems.filter((item) =>
            checkHasWishlistMatch(item)
          )}
          soundEnabled={soundOn}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            setSoundEnabled(next);
            if (next) playCozySound('coins');
            showToast(
              next
                ? '🔊 Cozy Game Sound Effects & Haptics Enabled!'
                : '🔇 Game Sound Effects Muted.'
            );
          }}
          canInstallPwa={true}
          onInstallPwa={handleInstallPwa}
          browserNotifsEnabled={browserNotifsEnabled}
          onEnableBrowserNotifs={handleEnableBrowserNotifs}
          onClose={() => setIsActivityModalOpen(false)}
          onOpenTradeChat={(tradeId) => {
            setChatModalInitialMode('chat');
            setActiveChatTradeId(tradeId);
            setActiveTab('trades');
          }}
          onOpenFriends={() => setIsFriendsModalOpen(true)}
          onInspectItem={(item) => setInspectedItem(item)}
        />

        <ShareQrModal
          isOpen={Boolean(sharingItem || sharingProfile)}
          shareItem={sharingItem}
          shareProfile={sharingProfile}
          onClose={() => {
            setSharingItem(null);
            setSharingProfile(null);
          }}
        />

        <QuestsAndRewardsModal
          isOpen={isQuestsModalOpen}
          currentUser={currentUser}
          quests={cozyQuests}
          onClose={() => setIsQuestsModalOpen(false)}
          onClaimQuest={handleClaimQuest}
        />

        <SwipeMatchModal
          isOpen={isSwipeDeckOpen}
          items={filteredMarketplaceItems}
          myInventory={myInventory}
          onClose={() => setIsSwipeDeckOpen(false)}
          onLikeAndSave={handleToggleLikeItem}
          onProposeTrade={(item) => setTradeTargetItem(item)}
          onInspectItem={(item) => setInspectedItem(item)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        <FriendsListModal
          isOpen={isFriendsModalOpen}
          currentUser={currentUser}
          friends={friends}
          allProfiles={profiles}
          allItems={itemsWithDistance}
          onClose={() => setIsFriendsModalOpen(false)}
          onAcceptRequest={handleAcceptFriendRequest}
          onDeclineOrRemove={handleDeclineOrRemoveFriend}
          onSendFriendRequest={handleSendFriendRequest}
          onInspectFriendProfile={(friendId) => {
            setInspectedUserId(friendId);
            setActiveTab('passport');
          }}
          onFilterByFriendsItems={() => {
            setSortMode('friends');
            setActiveTab('explore');
            showToast('🤝 Filtering Plaza to show only your Friends’ items!');
          }}
          onWaveToFriend={(friendName) =>
            showToast(`👋 You waved at ${friendName}! They waved back 🌿`)
          }
          onQuickTradeWithFriend={(item) => setTradeTargetItem(item)}
        />

        <ItemDetailModal
          item={inspectedItem}
          isOwnItem={inspectedItem?.owner_id === currentUser.id}
          onClose={() => setInspectedItem(null)}
          onProposeTrade={(item) => setTradeTargetItem(item)}
          onAskQuestion={handleAskQuestionFromItem}
          onAddPublicComment={handleAddPublicComment}
          onReportItem={handleReportItem}
          onBlockUser={handleBlockUser}
          onShareItem={(item) => setSharingItem(item)}
          onEditItem={(item) => setEditingItem(item)}
        />

        <WantedBoardModal
          isOpen={isWantedBoardOpen}
          currentUser={currentUser}
          wantedPosts={wantedPosts}
          onClose={() => setIsWantedBoardOpen(false)}
          onAddWantedPost={handleAddWantedPost}
          onFulfillWanted={handleFulfillWanted}
        />

        <TradeChatAndCounterModal
          trade={activeChatTrade}
          currentUser={currentUser}
          allItems={itemsWithDistance}
          initialMode={chatModalInitialMode}
          onClose={() => setActiveChatTradeId(null)}
          onSendMessage={handleSendTradeMessage}
          onSubmitCounterOffer={handleSubmitCounterOffer}
          onScheduleMeetup={handleScheduleMeetup}
        />

        <MeetupPinModal
          trade={activeMeetupTrade}
          requestedItem={
            activeMeetupTrade
              ? items.find((i) => i.id === activeMeetupTrade.requested_item_id)
              : undefined
          }
          offeredItems={
            activeMeetupTrade
              ? items.filter((i) =>
                  activeMeetupTrade.offered_item_ids.includes(i.id)
                )
              : []
          }
          onClose={() => setMeetupPinTradeId(null)}
          onConfirmComplete={(tradeId) =>
            handleUpdateTradeStatus(tradeId, 'completed')
          }
        />

        <EditProfileModal
          isOpen={isEditProfileOpen}
          currentUser={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onSaveProfile={handleSaveProfile}
        />

        <AuthPassportModal
          isOpen={isAuthModalOpen}
          currentUser={currentUser}
          allProfiles={profiles}
          onClose={() => setIsAuthModalOpen(false)}
          onCreateNewPlayer={handleCreateNewPlayer}
          onSwitchPlayer={handleSwitchPlayer}
        />

        <TradeArenaModal
          targetItem={tradeTargetItem}
          myInventory={myInventory}
          onClose={() => setTradeTargetItem(null)}
          onSubmitTrade={handleSubmitTrade}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        <UploadItemModal
          isOpen={isUploadOpen || Boolean(editingItem)}
          currentUser={currentUser}
          currentPocketCount={myInventory.length}
          editingItem={editingItem}
          onClose={() => {
            setIsUploadOpen(false);
            setEditingItem(null);
          }}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
        />

        <KarmaRateModal
          isOpen={Boolean(ratingTrade)}
          targetName={
            ratingTrade?.sender_id === currentUser.id
              ? ratingTrade.receiver_name
              : ratingTrade?.sender_name || 'Trader'
          }
          targetAvatar={
            ratingTrade?.sender_id === currentUser.id
              ? ratingTrade.receiver_avatar
              : ratingTrade?.sender_avatar || '🦊'
          }
          onClose={() => setRatingTrade(null)}
          onSubmitReview={handleSubmitKarmaReview}
        />

        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConfigUpdated={syncWithSupabase}
        />
      </div>
    </div>
  );
}
export default App;
