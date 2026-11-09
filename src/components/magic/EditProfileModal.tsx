import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, UserCheck, MapPin } from 'lucide-react';
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
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser.latitude,
    lng: currentUser.longitude,
  });
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleSearchCity = async () => {
    if (!locationName.trim()) return;
    setIsLocating(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          locationName.trim()
        )}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const shortName = String(first.display_name || locationName)
          .split(',')
          .slice(0, 2)
          .join(',')
          .trim();
        setLocationName(shortName);
        setCoords({
          lat: parseFloat(first.lat) + (Math.random() - 0.5) * 0.003,
          lng: parseFloat(first.lon) + (Math.random() - 0.5) * 0.003,
        });
      }
    } catch {
      // Keep typed location name
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseLiveGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let placeName = 'My Local Neighborhood 📍';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          const city =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village;
          if (city) placeName = `${city} 📍`;
        } catch {
          // fallback
        }
        setLocationName(placeName);
        setCoords({
          lat: lat + (Math.random() - 0.5) * 0.003,
          lng: lng + (Math.random() - 0.5) * 0.003,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 6000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onSaveProfile({
      display_name: displayName.trim(),
      avatar_emoji: avatarEmoji,
      title_badge: titleBadge,
      bio: bio.trim(),
      location_name: locationName.trim() || 'Local Neighborhood',
      latitude: coords.lat,
      longitude: coords.lng,
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
            <div className="space-y-3">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328]">
                    📍 Home City / Neighborhood
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLiveGps}
                    disabled={isLocating}
                    className="text-[11px] font-extrabold text-[#4E9F6E] hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{isLocating ? 'Locating...' : 'Use Live GPS'}</span>
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Type city or neighborhood (e.g. Austin, London)..."
                    className="flex-1 rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCity}
                    disabled={isLocating}
                    className="px-3 py-2 rounded-2xl bg-[#5C4328] text-white text-xs font-extrabold shrink-0"
                  >
                    Pin City
                  </button>
                </div>
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
