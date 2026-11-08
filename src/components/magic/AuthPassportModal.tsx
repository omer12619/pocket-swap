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
  Lock,
  Mail,
  KeyRound,
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
  const [email, setEmail] = useState('');
  const [passcodePin, setPasscodePin] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🦊');
  const [bio, setBio] = useState(
    'Trading cool local treasures & always down for a coffee-shop meetup!'
  );
  const [selectedPlace, setSelectedPlace] = useState(NEIGHBORHOODS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login / PIN verification state
  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [unlockingProfile, setUnlockingProfile] = useState<UserProfile | null>(
    null
  );

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
      setErrorMsg(
        `@${cleanUsername} is already registered! Switch to the Log In tab to access it.`
      );
      return;
    }

    const cleanPin = passcodePin.replace(/\D/g, '').slice(0, 4);

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
      badges: cleanPin
        ? ['New Villager 🌱', 'PIN Protected 🔐', 'Verified GPS 📍']
        : ['New Villager 🌱', 'Verified GPS 📍'],
      email: email.trim() || undefined,
      passcode_pin: cleanPin || undefined,
    };

    onCreateNewPlayer(newProfile);
    onClose();
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = loginIdentity.trim().toLowerCase().replace(/^@/, '');
    if (!query) {
      setErrorMsg('Enter your @username, display name, or email.');
      return;
    }

    const found = allProfiles.find(
      (p) =>
        p.username.toLowerCase() === query ||
        p.display_name.toLowerCase() === query ||
        (p.email && p.email.toLowerCase() === query)
    );

    if (!found) {
      setErrorMsg('No villager account found with that username or email.');
      return;
    }

    if (found.passcode_pin && found.passcode_pin !== loginPin.trim()) {
      setErrorMsg('Incorrect 4-digit PIN passcode for this protected account!');
      return;
    }

    onSwitchPlayer(found);
    onClose();
  };

  const handleSelectProfileFromList = (prof: UserProfile) => {
    setErrorMsg(null);
    if (prof.passcode_pin && prof.id !== currentUser.id) {
      setUnlockingProfile(prof);
      setLoginPin('');
      return;
    }
    onSwitchPlayer(prof);
    onClose();
  };

  const handleUnlockProtectedProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockingProfile) return;
    if (unlockingProfile.passcode_pin !== loginPin.trim()) {
      setErrorMsg('Incorrect 4-digit PIN passcode!');
      return;
    }
    onSwitchPlayer(unlockingProfile);
    setUnlockingProfile(null);
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
                  Villager Passport & Account Security
                </h3>
                <p className="text-[11px] text-white/90 font-semibold">
                  Sign up with PIN protection or log into your account
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
                  setUnlockingProfile(null);
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'signup'
                    ? 'bg-[#4E9F6E] text-white shadow-sm'
                    : 'text-[#5C4328]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setUnlockingProfile(null);
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-[#4E9F6E] text-white shadow-sm'
                    : 'text-[#5C4328]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Switch ({allProfiles.length})</span>
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-[#FFF0EC] border border-[#FF7E67] text-xs font-extrabold text-[#C84B31]">
                {errorMsg}
              </div>
            )}

            {mode === 'signup' ? (
              <form onSubmit={handleCreateAccount} className="space-y-3.5">
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
                        className={`h-10 rounded-2xl text-xl flex items-center justify-center border-2 transition-all ${
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

                {/* Email & 4-Digit Security PIN Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                      <Mail className="w-3 h-3 text-[#4E9F6E]" />
                      <span>Email (Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                      <Lock className="w-3 h-3 text-[#FF7E67]" />
                      <span>4-Digit Security PIN</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={passcodePin}
                      onChange={(e) =>
                        setPasscodePin(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="e.g. 4242"
                      className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] tracking-widest focus:outline-none focus:border-[#4E9F6E]"
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
              <div className="space-y-4">
                {/* Direct Credential Login Box */}
                <form
                  onSubmit={handleDirectLogin}
                  className="p-3.5 rounded-2xl bg-[#F5E9CE]/75 border-2 border-[#D8C5A0] space-y-2.5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#4A3520]">
                    <KeyRound className="w-3.5 h-3.5 text-[#4E9F6E]" />
                    <span>Sign In with Username / Email & PIN</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={loginIdentity}
                      onChange={(e) => setLoginIdentity(e.target.value)}
                      placeholder="@username or email"
                      className="col-span-2 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={loginPin}
                      onChange={(e) =>
                        setLoginPin(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="PIN"
                      className="col-span-1 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] text-center tracking-widest focus:outline-none focus:border-[#4E9F6E]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-sm"
                  >
                    Unlock & Sign In
                  </button>
                </form>

                {/* PIN Prompt if user tapped a protected account from the list */}
                {unlockingProfile && (
                  <form
                    onSubmit={handleUnlockProtectedProfile}
                    className="p-3.5 rounded-2xl bg-[#FFF6E0] border-2 border-[#F6B93B] space-y-2"
                  >
                    <p className="text-xs font-extrabold text-[#4A3520]">
                      🔐 Enter 4-digit PIN for {unlockingProfile.display_name}:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoFocus
                        value={loginPin}
                        onChange={(e) =>
                          setLoginPin(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="••••"
                        className="flex-1 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] tracking-widest"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#4E9F6E] text-white font-game text-xs font-bold"
                      >
                        Unlock
                      </button>
                    </div>
                  </form>
                )}

                {/* Quick Account & Demo Trader Switcher */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C6246]">
                    ⚡ Saved & Demo Villager Accounts
                  </span>
                  {allProfiles.map((prof) => {
                    const isCurrent = prof.id === currentUser.id;
                    const isProtected = Boolean(prof.passcode_pin);
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => handleSelectProfileFromList(prof)}
                        className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                          isCurrent
                            ? 'bg-[#EBF7EE] border-[#4E9F6E]'
                            : 'bg-white border-[#D8C5A0] hover:bg-[#F5E9CE]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-2xl">
                            {prof.avatar_emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-game text-sm font-bold text-[#4A3520] truncate">
                                {prof.display_name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md bg-[#F5E9CE] text-[#6E5031] text-[10px] font-extrabold shrink-0">
                                Lv.{prof.level}
                              </span>
                              {isProtected && (
                                <span className="px-1.5 py-0.2 rounded-md bg-[#FFF6E0] text-[#B57C1E] text-[9px] font-extrabold shrink-0">
                                  🔐 PIN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#7C6246] block truncate">
                              @{prof.username} • ⭐ {prof.karma_score.toFixed(2)} Karma
                            </span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] text-[#5C4328] text-[11px] font-extrabold shrink-0">
                            {isProtected ? '🔐 Unlock' : 'Switch →'}
                          </span>
                        )}
                      </button>
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
