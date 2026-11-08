import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, UserCheck } from 'lucide-react';
import { UserProfile } from '../../types/game';

interface EditProfileModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

const AVATAR_OPTIONS = ['🦊', '🐻', '🐰', '🐸', '🐼', '🐨', '🦁', '🐱', '🐶', '🦉', '🦄', '🐲'];
const TITLE_OPTIONS = [
  'Star Villager 🌟',
  'Retro Collector 🕹️',
  'Cozy Botanist 🌿',
  'Gadget Alchemist ⚡',
  'Vinyl Archivist 💿',
  'Plaza Legend 👑',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser.avatar_emoji);
  const [titleBadge, setTitleBadge] = useState(currentUser.title_badge);
  const [bio, setBio] = useState(currentUser.bio);
  const [locationName, setLocationName] = useState(currentUser.location_name);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onSaveProfile({
      display_name: displayName.trim(),
      avatar_emoji: avatarEmoji,
      title_badge: titleBadge,
      bio: bio.trim(),
      location_name: locationName.trim() || 'Sunny Leaf District',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl"
        >
          <div className="px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{avatarEmoji}</span>
              <h3 className="font-game text-base font-bold text-[#4A3520]">
                Customize Villager Passport
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-[#5C4328]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                🎭 Choose Your Villager Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`h-11 rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${
                      avatarEmoji === emoji
                        ? 'bg-[#EBF7EE] border-[#4E9F6E] scale-105 shadow-sm'
                        : 'bg-white border-[#D8C5A0]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name & Home Plaza */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  🏷️ Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  📍 Home Neighborhood
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>
            </div>

            {/* Title Badge */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                🏅 Villager Title Badge
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TITLE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitleBadge(t)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                      titleBadge === t
                        ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                        : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                📝 Trader Bio & Wishlist Vibe
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-sm font-bold shadow-cozy-green flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Save Passport Changes</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
