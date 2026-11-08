import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  ArrowLeftRight,
  MessageCircle,
  UserPlus,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  BellRing,
} from 'lucide-react';
import {
  FriendConnection,
  TradeItem,
  TradeOffer,
  UserProfile,
} from '../../types/game';

interface ActivityFeedModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  trades: TradeOffer[];
  friends: FriendConnection[];
  matchingItems: TradeItem[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  browserNotifsEnabled?: boolean;
  onEnableBrowserNotifs?: () => void;
  onClose: () => void;
  onOpenTradeChat: (tradeId: string) => void;
  onOpenFriends: () => void;
  onInspectItem: (item: TradeItem) => void;
}

export const ActivityFeedModal: React.FC<ActivityFeedModalProps> = ({
  isOpen,
  currentUser,
  trades,
  friends,
  matchingItems,
  soundEnabled,
  onToggleSound,
  canInstallPwa = false,
  onInstallPwa,
  browserNotifsEnabled = false,
  onEnableBrowserNotifs,
  onClose,
  onOpenTradeChat,
  onOpenFriends,
  onInspectItem,
}) => {
  if (!isOpen) return null;

  const incomingFriends = friends.filter((f) => f.status === 'incoming');
  const activeTrades = trades.filter(
    (t) => t.status === 'pending' || t.status === 'countered' || t.status === 'accepted'
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 14 }}
          className="w-full max-w-md rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
        >
          {/* Header with Sound & Haptics Toggle */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#4A3520] to-[#6E5031] text-[#FFF9EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F6B93B] text-[#4A3520] flex items-center justify-center shadow">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-game text-base font-bold leading-tight">
                  Village Activity & Alerts
                </h3>
                <p className="text-[11px] text-[#FFF9EB]/80 font-semibold">
                  Live trades, messages, friend requests & pocket matches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute Cozy Game Sounds' : 'Unmute Game Sounds'}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 border transition-all ${
                  soundEnabled
                    ? 'bg-[#4E9F6E] text-white border-[#8BD1A0]'
                    : 'bg-white/15 text-[#FFF9EB] border-white/20'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>SFX On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-3.5">
            {/* App Installation & Push Notification Banner */}
            <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#4E9F6E] shrink-0" />
                <div>
                  <span className="font-game text-xs font-bold text-[#4A3520] block">
                    App & Push Notification Settings
                  </span>
                  <span className="text-[10px] font-bold text-[#7C6246]">
                    {browserNotifsEnabled
                      ? '🟢 Live browser trade notifications enabled'
                      : 'Enable alerts for instant swap & chat notifications'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!browserNotifsEnabled && onEnableBrowserNotifs && (
                  <button
                    type="button"
                    onClick={onEnableBrowserNotifs}
                    className="px-2.5 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white text-[10px] font-extrabold flex items-center gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    <span>Enable Alerts</span>
                  </button>
                )}
                {canInstallPwa && onInstallPwa && (
                  <button
                    type="button"
                    onClick={onInstallPwa}
                    className="px-2.5 py-1.5 rounded-xl bg-[#F6B93B] hover:bg-[#E5A930] text-[#4A3520] text-[10px] font-extrabold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Install App</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1. Incoming Friend Requests */}
            {incomingFriends.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] px-1">
                  🤝 Friend Requests ({incomingFriends.length})
                </span>
                {incomingFriends.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFriends();
                    }}
                    className="w-full p-3 rounded-2xl bg-[#FFF6E0] hover:bg-[#F5E9CE] border-2 border-[#F6B93B] flex items-center justify-between text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-2xl bg-white border border-[#D8C5A0] flex items-center justify-center text-xl">
                        {req.friend_avatar}
                      </span>
                      <div>
                        <span className="font-game text-xs font-bold text-[#4A3520] block">
                          {req.friend_name} sent a Trade Buddy request!
                        </span>
                        <span className="text-[11px] font-semibold text-[#7C6246]">
                          “{req.buddy_note}”
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      <span>View</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Active Trade Offers & Chat Messages */}
            <div className="space-y-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] px-1">
                ⚔️ Trade Offers & Chat Threads ({activeTrades.length})
              </span>
              {activeTrades.map((trade) => {
                const isIncoming = trade.receiver_id === currentUser.id;
                const partnerName = isIncoming
                  ? trade.sender_name
                  : trade.receiver_name;
                const partnerAvatar = isIncoming
                  ? trade.sender_avatar
                  : trade.receiver_avatar;
                const lastMsg =
                  trade.messages && trade.messages.length > 0
                    ? trade.messages[trade.messages.length - 1].text
                    : trade.message;

                return (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTradeChat(trade.id);
                    }}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-[#F5E9CE]/70 border-2 border-[#D8C5A0] flex items-center justify-between gap-2 text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-10 h-10 rounded-2xl bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-xl shrink-0">
                        {partnerAvatar}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-game text-xs font-bold text-[#4A3520] truncate">
                            {partnerName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-[#EBF7EE] text-[#2F7A4C] text-[9px] font-extrabold uppercase">
                            {trade.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-[#7C6246] truncate mt-0.5">
                          💬 “{lastMsg}”
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#F5E9CE] text-[#5C4328] text-[10px] font-extrabold flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-[#4E9F6E]" />
                      <span>Open Chat</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Smart Wishlist Matches Around You */}
            {matchingItems.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] px-1">
                  🎯 Nearby Traders Who Want Your Pocket Items (
                  {matchingItems.length})
                </span>
                {matchingItems.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onInspectItem(item);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-[#EBF7EE] hover:bg-[#DDF2E3] border-2 border-[#8BD1A0] flex items-center justify-between gap-2.5 text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          item.media_type === 'video'
                            ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                            : item.media_url
                        }
                        alt={item.title}
                        className="w-11 h-11 rounded-xl object-cover border border-white shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-game text-xs font-bold text-[#2F7A4C] block truncate">
                          🎯 {item.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#4A3520] block truncate">
                          {item.owner_avatar} {item.owner_name} wants:{' '}
                          {item.wishlist_hint}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold flex items-center gap-1">
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Swap</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-[#F5E9CE]/70 border border-[#D8C5A0] flex items-center gap-2 text-[11px] font-bold text-[#5C4328]">
              <Sparkles className="w-4 h-4 text-[#E59819] shrink-0" />
              <span>
                Pro Tip: Keep at least 3 items marked "🟢 Up for Trade" in your Pocket to get 2x more local match alerts!
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
