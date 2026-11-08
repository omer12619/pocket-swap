import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  Star,
  Sparkles,
  Backpack,
  Search,
  Check,
  Trash2,
  Hand,
} from 'lucide-react';
import { FriendConnection, TradeItem, UserProfile } from '../../types/game';

interface FriendsListModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  friends: FriendConnection[];
  allProfiles: UserProfile[];
  allItems: TradeItem[];
  onClose: () => void;
  onAcceptRequest: (friendId: string) => void;
  onDeclineOrRemove: (friendId: string) => void;
  onSendFriendRequest: (targetProfile: UserProfile) => void;
  onInspectFriendProfile: (friendId: string) => void;
  onFilterByFriendsItems: () => void;
  onWaveToFriend: (friendName: string) => void;
  onQuickTradeWithFriend?: (item: TradeItem) => void;
}

export const FriendsListModal: React.FC<FriendsListModalProps> = ({
  isOpen,
  currentUser,
  friends,
  allProfiles,
  allItems,
  onClose,
  onAcceptRequest,
  onDeclineOrRemove,
  onSendFriendRequest,
  onInspectFriendProfile,
  onFilterByFriendsItems,
  onWaveToFriend,
  onQuickTradeWithFriend,
}) => {
  const [tab, setTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const acceptedFriends = friends.filter((f) => f.status === 'friends');
  const incomingRequests = friends.filter((f) => f.status === 'incoming');
  const outgoingRequests = friends.filter((f) => f.status === 'outgoing');

  // Discoverable villagers not yet in accepted/incoming/outgoing
  const discoverableProfiles = allProfiles
    .filter((p) => p.id !== currentUser.id)
    .filter(
      (p) =>
        searchQuery.trim() === '' ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getFriendStatus = (userId: string) => {
    return friends.find((f) => f.friend_id === userId)?.status || 'none';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: 70, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 70, opacity: 0, scale: 0.96 }}
          className="w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#F5E9CE] border-b-2 border-[#D8C5A0] px-5 pt-3.5 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <div>
                  <h2 className="font-game text-lg font-bold text-[#4A3520]">
                    Village Friends & Trade Buddies
                  </h2>
                  <p className="text-[11px] font-bold text-[#7C6246]">
                    Trade with friends to earn bonus Karma & see their new drops!
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center justify-center text-[#5C4328] hover:bg-[#FF7E67] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Tab Switcher */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#E8D8B9] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTab('friends')}
                className={`py-1.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  tab === 'friends'
                    ? 'bg-[#FFF9EB] text-[#4A3520] shadow-sm'
                    : 'text-[#6E5031]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>Friends ({acceptedFriends.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('requests')}
                className={`relative py-1.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  tab === 'requests'
                    ? 'bg-[#FFF9EB] text-[#4A3520] shadow-sm'
                    : 'text-[#6E5031]'
                }`}
              >
                <span>Requests</span>
                {incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#FF7E67] text-white text-[10px] font-extrabold">
                    {incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab('discover')}
                className={`py-1.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  tab === 'discover'
                    ? 'bg-[#FFF9EB] text-[#4A3520] shadow-sm'
                    : 'text-[#6E5031]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#FF7E67]" />
                <span>Add Friends</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {/* ===================================================== */}
            {/* TAB 1: ACCEPTED FRIENDS LIST                          */}
            {/* ===================================================== */}
            {tab === 'friends' && (
              <>
                <div className="p-3 rounded-2xl bg-[#EBF7EE] border border-[#8BD1A0] flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#2F7A4C]">
                    🌿 Want to see only items listed by your Friends?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterByFriendsItems();
                      onClose();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#4E9F6E] text-white font-game text-xs font-bold shadow-sm"
                  >
                    Filter Feed
                  </button>
                </div>

                {acceptedFriends.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#F5E9CE]/60 border-2 border-dashed border-[#D8C5A0] space-y-2">
                    <p className="font-game text-sm font-bold text-[#4A3520]">
                      No Trade Buddies added yet!
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab('discover')}
                      className="px-4 py-2 rounded-xl bg-[#4E9F6E] text-white text-xs font-extrabold"
                    >
                      + Find Local Villagers
                    </button>
                  </div>
                ) : (
                  acceptedFriends.map((friend) => {
                    const friendItems = allItems.filter(
                      (i) => i.owner_id === friend.friend_id && i.is_for_trade
                    );
                    const friendItemsCount = friendItems.length;
                    const firstFriendItem = friendItems[0];

                    return (
                      <div
                        key={friend.id}
                        className="p-3.5 rounded-3xl bg-[#FFFDF7] border-2 border-[#D8C5A0] shadow-sm space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => {
                              onInspectFriendProfile(friend.friend_id);
                              onClose();
                            }}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-[#F5E9CE] border-2 border-[#4E9F6E] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                                {friend.friend_avatar}
                              </div>
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#4E9F6E] text-white text-[9px] font-extrabold">
                                Lv.{friend.friend_level}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-game text-sm font-bold text-[#4A3520]">
                                  {friend.friend_name}
                                </h4>
                                <span className="text-[10px] font-extrabold text-[#2F7A4C] bg-[#EBF7EE] px-2 py-0.5 rounded-full">
                                  {friend.online_status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-[#7C6246] mt-0.5">
                                <span className="flex items-center gap-0.5 text-[#C88719]">
                                  <Star className="w-3 h-3 fill-[#F6B93B] text-[#F6B93B]" />
                                  {friend.friend_karma.toFixed(2)}
                                </span>
                                <span>•</span>
                                <span>📍 {friend.friend_location}</span>
                                <span>•</span>
                                <span>🤝 {friend.mutual_trades} swaps</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeclineOrRemove(friend.friend_id)}
                            title="Remove Friend"
                            className="p-1.5 rounded-xl text-[#A68E6E] hover:text-[#C84B31] hover:bg-[#FFF0EC]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {friend.buddy_note && (
                          <p className="text-[11px] font-bold text-[#5C4328] bg-[#F5E9CE]/60 px-3 py-1.5 rounded-xl">
                            💬 “{friend.buddy_note}”
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onInspectFriendProfile(friend.friend_id);
                              onClose();
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Backpack className="w-3.5 h-3.5" />
                            <span>
                              Items ({friendItemsCount})
                            </span>
                          </button>

                          {firstFriendItem && onQuickTradeWithFriend && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onQuickTradeWithFriend(firstFriendItem);
                              }}
                              className="py-2 px-3 rounded-xl bg-[#FF7E67] hover:bg-[#EC6A52] text-white font-game text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Swap</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onWaveToFriend(friend.friend_name)}
                            className="py-2 px-3 rounded-xl bg-[#FFF6E0] hover:bg-[#F6B93B]/30 border border-[#EED9B3] text-[#7A592E] font-game text-xs font-bold flex items-center gap-1"
                          >
                            <Hand className="w-3.5 h-3.5 text-[#E59819]" />
                            <span>Wave 👋</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ===================================================== */}
            {/* TAB 2: INCOMING & OUTGOING FRIEND REQUESTS            */}
            {/* ===================================================== */}
            {tab === 'requests' && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5C4328]">
                  💌 Incoming Friend Requests ({incomingRequests.length})
                </h4>

                {incomingRequests.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#F5E9CE]/50 border border-[#D8C5A0] text-xs font-bold text-[#7C6246] text-center">
                    No pending incoming requests right now.
                  </div>
                ) : (
                  incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-3xl bg-[#FFFDF7] border-2 border-[#F6B93B] shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F5E9CE] border-2 border-[#D8C5A0] flex items-center justify-center text-2xl">
                          {req.friend_avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-game text-sm font-bold text-[#4A3520]">
                              {req.friend_name}
                            </h4>
                            <span className="text-[10px] font-bold text-[#8C6D46]">
                              {req.created_at}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-[#4E9F6E]">
                            {req.friend_title} • ★ {req.friend_karma.toFixed(2)} Karma
                          </p>
                        </div>
                      </div>

                      {req.buddy_note && (
                        <p className="text-xs font-bold text-[#5C4328] bg-[#FFF6E0] p-2.5 rounded-xl border border-[#EED9B3]">
                          “{req.buddy_note}”
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest(req.friend_id)}
                          className="flex-1 py-2 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Trade Buddy (+25 XP)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineOrRemove(req.friend_id)}
                          className="px-3.5 py-2 rounded-xl bg-[#F5E9CE] text-[#7C6246] font-game text-xs font-bold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {outgoingRequests.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5C4328]">
                      📤 Sent Friend Requests ({outgoingRequests.length})
                    </h4>
                    {outgoingRequests.map((out) => (
                      <div
                        key={out.id}
                        className="p-3 rounded-2xl bg-[#FFFDF7] border border-[#D8C5A0] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{out.friend_avatar}</span>
                          <div>
                            <span className="text-xs font-extrabold text-[#4A3520] block">
                              {out.friend_name}
                            </span>
                            <span className="text-[10px] font-bold text-[#8C6D46]">
                              Request Sent • Waiting for reply
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeclineOrRemove(out.friend_id)}
                          className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] text-[11px] font-bold text-[#7C6246]"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB 3: DISCOVER & ADD LOCAL VILLAGERS                 */}
            {/* ===================================================== */}
            {tab === 'discover' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8C6D46] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search villagers by name, @username, or plaza..."
                    className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border-2 border-[#D8C5A0] text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                </div>

                <div className="space-y-2">
                  {discoverableProfiles.map((villager) => {
                    const status = getFriendStatus(villager.id);
                    return (
                      <div
                        key={villager.id}
                        className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] flex items-center justify-between gap-2"
                      >
                        <div
                          onClick={() => {
                            onInspectFriendProfile(villager.id);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0] flex items-center justify-center text-xl">
                            {villager.avatar_emoji}
                          </div>
                          <div>
                            <h4 className="font-game text-xs font-bold text-[#4A3520]">
                              {villager.display_name}
                            </h4>
                            <p className="text-[10px] font-bold text-[#7C6246]">
                              @{villager.username} • ★ {villager.karma_score.toFixed(2)} •{' '}
                              {villager.location_name.split(' ')[0]}
                            </p>
                          </div>
                        </div>

                        {status === 'friends' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#EBF7EE] text-[#2F7A4C] text-[11px] font-extrabold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Friends</span>
                          </span>
                        ) : status === 'incoming' ? (
                          <button
                            type="button"
                            onClick={() => onAcceptRequest(villager.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#F6B93B] text-[#4A3520] text-[11px] font-extrabold"
                          >
                            Accept Request
                          </button>
                        ) : status === 'outgoing' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] text-[#7C6246] text-[11px] font-extrabold">
                            Requested ⏳
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSendFriendRequest(villager)}
                            className="px-3 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
