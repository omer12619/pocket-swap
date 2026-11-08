import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Award, Sparkles, Send } from 'lucide-react';

interface KarmaRateModalProps {
  isOpen: boolean;
  targetName: string;
  targetAvatar: string;
  onClose: () => void;
  onSubmitReview: (stars: number, badge: string, comment: string) => void;
}

const COZY_BADGES = [
  'Fast & Friendly ⚡',
  'Item Exactly as Described ✨',
  'Generous Trader 🎁',
  'Cozy Communicator 💬',
  'Punctual Meetup 📍',
];

export const KarmaRateModal: React.FC<KarmaRateModalProps> = ({
  isOpen,
  targetName,
  targetAvatar,
  onClose,
  onSubmitReview,
}) => {
  const [stars, setStars] = useState(5);
  const [selectedBadge, setSelectedBadge] = useState(COZY_BADGES[0]);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(
      stars,
      selectedBadge,
      comment.trim() || `Awesome local swap with ${targetName}! Smooth & friendly.`
    );
    setComment('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden"
        >
          <div className="px-5 py-4 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <h3 className="font-game text-base font-bold text-[#4A3520]">
                Award Trader Karma
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-[#5C4328]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#F5E9CE] border-2 border-[#D8C5A0] flex items-center justify-center text-3xl shadow-sm">
              {targetAvatar}
            </div>
            <div>
              <h4 className="font-game text-lg font-bold text-[#4A3520]">
                How was your trade with {targetName}?
              </h4>
              <p className="text-xs font-bold text-[#7C6246]">
                Your rating boosts their Village Karma Rank & gives you +50 XP!
              </p>
            </div>

            {/* 5-Star Selector */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setStars(num)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 ${
                      num <= stars
                        ? 'fill-[#F6B93B] text-[#F6B93B] drop-shadow-sm'
                        : 'text-[#D8C5A0]'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Badge Picker */}
            <div className="text-left">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                🏅 Bestow a Cozy Honor Badge
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COZY_BADGES.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setSelectedBadge(badge)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                      selectedBadge === badge
                        ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                        : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comment */}
            <div className="text-left">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                💌 Leave a Public Karma Note
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Super friendly trade with ${targetName}! Item was exactly as shown.`}
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#F6B93B] hover:bg-[#E5A729] text-[#4A3520] font-game text-sm font-bold shadow-cozy-gold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Send {stars}-Star Karma & Claim +50 XP</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
