import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  UserPlus,
  LogIn,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserProfile } from '../../types/game';

interface AuthPassportModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  allProfiles: UserProfile[];
  onClose: () => void;
  onCreateNewPlayer: (newProfile: UserProfile) => void;
  onSwitchPlayer: (profile: UserProfile) => void;
}

const AVATAR_CHOICES = [
  '🦊',
  '🐻',
  '🐰',
  '🐸',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐱',
  '🐶',
  '🦉',
  '🦄',
];

const NEIGHBORHOODS = [
  { name: 'Sunny Leaf District', lat: 32.0853, lng: 34.7818 },
  { name: 'Acorn Park Plaza', lat: 32.0892, lng: 34.7865 },
  { name: 'Berry Creek Cafe', lat: 32.0795, lng: 34.7772 },
  { name: 'Harbor Boardwalk', lat: 32.0945, lng: 34.7912 },
];

export const AuthPassportModal: React.FC<AuthPassportModalProps> = ({
  isOpen,
  currentUser,
  allProfiles,
  onClose,
  onCreateNewPlayer,
  onSwitchPlayer,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🦊');
  const [bio, setBio] = useState(
    'Trading cool local treasures & always down for a coffee-shop meetup!'
  );
  const [selectedPlace, setSelectedPlace] = useState(NEIGHBORHOODS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanUsername = (username.trim() || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (!cleanName) {
      setErrorMsg('Please enter your trader display name!');
      return;
    }

    const existing = allProfiles.find(
      (p) => p.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      onSwitchPlayer(existing);
      onClose();
      return;
    }

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      display_name: cleanName,
      avatar_emoji: avatarEmoji,
      title_badge: 'Sprout Villager 🌱',
      bio: bio.trim() || 'Collecting cozy treasures & trading locally!',
      karma_score: 5.0,
      karma_points: 100,
      karma_reviews_count: 1,
      completed_trades: 0,
      level: 1,
      xp: 50,
      latitude: selectedPlace.lat + (Math.random() - 0.5) * 0.004,
      longitude: selectedPlace.lng + (Math.random() - 0.5) * 0.004,
      location_name: selectedPlace.name,
      badges: ['New Villager 🌱', 'Verified GPS 📍'],
    };

    onCreateNewPlayer(newProfile);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          className="w-full max-w-md rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#4E9F6E] to-[#3B8458] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F6B93B]" />
              <div>
                <h3 className="font-game text-base font-bold leading-tight">
                  Villager Passport Account
                </h3>
                <p className="text-[11px] text-white/90 font-semibold">
                  Create your own trader profile or switch accounts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="px-5 pt-3.5">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0]">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'signup'
                    ? 'bg-[#4E9F6E] text-white shadow-sm'
                    : 'text-[#5C4328]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Trader Sign-Up</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-[#4E9F6E] text-white shadow-sm'
                    : 'text-[#5C4328]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Switch / Log In ({allProfiles.length})</span>
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {mode === 'signup' ? (
              <form onSubmit={handleCreateAccount} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-[#FFF0EC] border border-[#FF7E67] text-xs font-extrabold text-[#C84B31]">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                    Choose Your Villager Avatar
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {AVATAR_CHOICES.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarEmoji(emoji)}
                        className={`h-11 rounded-2xl text-xl flex items-center justify-center border-2 transition-all ${
                          avatarEmoji === emoji
                            ? 'bg-[#EBF7EE] border-[#4E9F6E] scale-105 shadow-sm'
                            : 'bg-white border-[#D8C5A0] hover:bg-[#F5E9CE]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Sunny Otter"
                      className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                      @Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="sunny_otter"
                      className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                    Home Neighborhood Pin
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {NEIGHBORHOODS.map((place) => {
                      const active = selectedPlace.name === place.name;
                      return (
                        <button
                          key={place.name}
                          type="button"
                          onClick={() => setSelectedPlace(place)}
                          className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 text-left transition-all ${
                            active
                              ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                              : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{place.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                    Trader Bio & Wishlist Vibe
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-sm font-bold shadow-cozy-green flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create My Villager Account (Cloud Synced)</span>
                </button>
              </form>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#7C6246]">
                  Tap any trader account below to log in as that player (great for testing multi-user trades!):
                </p>
                {allProfiles.map((prof) => {
                  const isCurrent = prof.id === currentUser.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => {
                        onSwitchPlayer(prof);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                        isCurrent
                          ? 'bg-[#EBF7EE] border-[#4E9F6E]'
                          : 'bg-white border-[#D8C5A0] hover:bg-[#F5E9CE]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-2xl">
                          {prof.avatar_emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-game text-sm font-bold text-[#4A3520]">
                              {prof.display_name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-[#F5E9CE] text-[#6E5031] text-[10px] font-extrabold">
                              Lv.{prof.level}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-[#7C6246]">
                            @{prof.username} • ⭐ {prof.karma_score.toFixed(2)} Karma
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] text-[#5C4328] text-[11px] font-extrabold">
                          Switch →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
