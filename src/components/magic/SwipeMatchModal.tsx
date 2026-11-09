import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  ArrowLeftRight,
  Sparkles,
  Calendar,
  MapPin,
  SkipForward,
  Flame,
  Info,
} from 'lucide-react';
import { TradeItem } from '../../types/game';

interface SwipeMatchModalProps {
  isOpen: boolean;
  items: TradeItem[];
  myInventory: TradeItem[];
  onClose: () => void;
  onLikeAndSave: (itemId: string) => void;
  onProposeTrade: (item: TradeItem) => void;
  onInspectItem: (item: TradeItem) => void;
  onOpenUpload?: () => void;
}

export const SwipeMatchModal: React.FC<SwipeMatchModalProps> = ({
  isOpen,
  items,
  myInventory,
  onClose,
  onLikeAndSave,
  onProposeTrade,
  onInspectItem,
  onOpenUpload,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  if (!isOpen) return null;

  const currentItem = items[currentIndex % Math.max(1, items.length)];

  if (!currentItem) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF7E67] fill-[#FF7E67]" />
                <h3 className="font-game text-base font-bold text-[#4A3520]">
                  Quick-Swap Match Deck
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-[#5C4328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-center space-y-3">
              <div className="text-4xl">🃏</div>
              <h4 className="font-game text-base font-bold text-[#4A3520]">
                No Nearby Items in the Deck Yet!
              </h4>
              <p className="text-xs font-bold text-[#7C6246]">
                Be the first trader in your area to post an item for swap, or invite a neighbor to join the Plaza!
              </p>
              {onOpenUpload && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="w-full py-3 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green"
                >
                  + Post Your First Item (+25 XP)
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Check if any item in user's Pocket matches keywords in currentItem's wishlist_hint!
  const matchingMyItem = myInventory.find((myItem) => {
    const hint = currentItem.wishlist_hint.toLowerCase();
    const myWords = `${myItem.title} ${myItem.category} ${myItem.brand}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    return myWords.some((word) => hint.includes(word));
  });

  const handlePass = () => {
    setDirection('left');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setDirection(null);
    }, 180);
  };

  const handleSaveAndNext = () => {
    onLikeAndSave(currentItem.id);
    setDirection('right');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setDirection(null);
    }, 180);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-sm rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF7E67] fill-[#FF7E67]" />
              <div>
                <h3 className="font-game text-base font-bold text-[#4A3520]">
                  Quick-Swap Match Deck
                </h3>
                <p className="text-[10px] font-bold text-[#7C6246]">
                  Card {(currentIndex % items.length) + 1} of {items.length} nearby
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-[#5C4328]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Animated Card Deck Body */}
          <div className="p-4">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: direction === 'left' ? -120 : direction === 'right' ? 120 : 0,
                rotate: direction === 'left' ? -8 : direction === 'right' ? 8 : 0,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="rounded-3xl bg-[#FFFDF7] border-3 border-[#D8C5A0] p-3 shadow-cozy space-y-3"
            >
              {/* Smart Wishlist Match Alert */}
              {matchingMyItem && (
                <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#4E9F6E] to-[#367A51] text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#F6B93B] shrink-0" />
                  <span className="truncate">
                    🎯 Match! Wants your{' '}
                    <strong className="underline">{matchingMyItem.title}</strong>
                  </span>
                </div>
              )}

              {/* Image / Video */}
              <div
                onClick={() => {
                  onClose();
                  onInspectItem(currentItem);
                }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#2D241C] border-2 border-[#EFE2C6] cursor-pointer"
              >
                {currentItem.media_type === 'video' ? (
                  <video
                    src={currentItem.media_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={currentItem.media_url}
                    alt={currentItem.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9EB] text-[#4A3520] text-xs font-extrabold shadow">
                    {currentItem.rarity}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#4E9F6E] text-white text-xs font-extrabold shadow">
                    📅 {currentItem.year_made}
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4E9F6E]" />
                  <span>{(currentItem.distance_km ?? 0.6).toFixed(1)} km</span>
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-[#7C6246]">
                  <span>
                    {currentItem.owner_avatar} {currentItem.owner_name} (★{' '}
                    {currentItem.owner_karma.toFixed(2)})
                  </span>
                  <span>{currentItem.condition}</span>
                </div>
                <h4 className="font-game text-base font-bold text-[#4A3520] mt-1 line-clamp-1">
                  {currentItem.title}
                </h4>
                <p className="text-xs font-bold text-[#5C4328] mt-1 bg-[#FFF6E0] p-2 rounded-xl border border-[#EED9B3] line-clamp-2">
                  💫 Wants: {currentItem.wishlist_hint}
                </p>
              </div>
            </motion.div>

            {/* 3 Tactile Deck Controls: Pass, Save ❤️, Offer Trade ⚔️ */}
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <button
                type="button"
                onClick={handlePass}
                className="py-3 rounded-2xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#6E5031] font-game text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-[#D8C5A0] active:translate-y-0.5"
              >
                <SkipForward className="w-5 h-5" />
                <span>Next / Pass</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="py-3 rounded-2xl bg-[#FFF0EC] hover:bg-[#FFE0D6] text-[#C84B31] font-game text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-[#FF7E67] active:translate-y-0.5"
              >
                <Heart className="w-5 h-5 fill-[#FF7E67] text-[#FF7E67]" />
                <span>Save ❤️</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProposeTrade(currentItem);
                }}
                className="py-3 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex flex-col items-center justify-center gap-1 active:translate-y-0.5"
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span>Trade Now!</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
