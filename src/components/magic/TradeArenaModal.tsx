import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, Sparkles, Check, AlertCircle, Send, ShieldCheck } from 'lucide-react';
import { ItemRarity, TradeItem } from '../../types/game';

interface TradeArenaModalProps {
  targetItem: TradeItem | null;
  myInventory: TradeItem[];
  onClose: () => void;
  onSubmitTrade: (targetItem: TradeItem, offeredItemIds: string[], message: string) => void;
}

const RARITY_POINTS: Record<ItemRarity, number> = {
  Common: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

const COZY_SWEETENERS = [
  { id: 'coffee', label: '☕ + Buy You a Coffee', bonus: 0.6 },
  { id: 'treat', label: '🥐 + Bakery Treat', bonus: 0.5 },
  { id: 'travel', label: '🚗 + I’ll Travel to You', bonus: 0.7 },
  { id: 'karma', label: '✨ +50 Bonus Karma Tip', bonus: 0.8 },
];

export const TradeArenaModal: React.FC<TradeArenaModalProps> = ({
  targetItem,
  myInventory,
  onClose,
  onSubmitTrade,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSweeteners, setSelectedSweeteners] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  if (!targetItem) return null;

  const tradeableItems = myInventory.filter((i) => i.is_for_trade);

  const toggleSweetener = (id: string) => {
    setSelectedSweeteners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  // Compute cozy fairness gauge based on rarity points + wishlist match bonus
  const hint = (targetItem.wishlist_hint || '').toLowerCase();
  const doesItemMatchWishlist = (myItem: TradeItem): boolean => {
    const cat = myItem.category.toLowerCase().split(' ')[0];
    const brand = (myItem.brand || '').toLowerCase();
    const firstWord = myItem.title.toLowerCase().split(' ')[0];
    return (
      (cat && hint.includes(cat)) ||
      (brand.length > 2 && hint.includes(brand)) ||
      (firstWord.length > 3 && hint.includes(firstWord))
    );
  };

  const computeItemAppraisalScore = (item: TradeItem, includeWishBonus = false): number => {
    const rarityBase = RARITY_POINTS[item.rarity] || 1;
    const conditionBonus =
      item.condition === 'Mint ✨'
        ? 0.8
        : item.condition === 'Great 🌿'
        ? 0.5
        : item.condition === 'Well-Loved 🧸'
        ? 0.2
        : 0;
    const vintageBonus = (item.year_made || 2023) < 2005 ? 0.8 : (item.year_made || 2023) < 2016 ? 0.4 : 0.1;
    const wishBonus = includeWishBonus && doesItemMatchWishlist(item) ? 1.5 : 0;
    return Math.round((rarityBase + conditionBonus + vintageBonus + wishBonus) * 10) / 10;
  };

  const sweetenerScore = selectedSweeteners.reduce((acc, sid) => {
    const found = COZY_SWEETENERS.find((s) => s.id === sid);
    return acc + (found?.bonus || 0);
  }, 0);

  const targetScore = computeItemAppraisalScore(targetItem, false);
  const offeredScore =
    Math.round(
      (selectedIds.reduce((acc, id) => {
        const found = myInventory.find((i) => i.id === id);
        if (!found) return acc;
        return acc + computeItemAppraisalScore(found, true);
      }, 0) +
        sweetenerScore) *
        10
    ) / 10;

  const fairnessRatio = Math.min(100, Math.round((offeredScore / targetScore) * 75));
  const matchProbability =
    selectedIds.length === 0
      ? 0
      : Math.min(98, Math.max(35, Math.round((offeredScore / targetScore) * 72)));
  const fairnessLabel =
    selectedIds.length === 0
      ? 'Pick 1–3 items from your pocket! (🎯 = Matches their Wishlist)'
      : offeredScore >= targetScore
      ? `🔥 ${matchProbability}% Acceptance Chance — Super Fair & Generous Offer!`
      : offeredScore >= targetScore - 1
      ? `🌿 ${matchProbability}% Acceptance Chance — Balanced Cozy Offer!`
      : `🌱 ${matchProbability}% Chance — Sweetener Suggested (Add another item?)`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const sweetenerLabels = selectedSweeteners
      .map((sid) => COZY_SWEETENERS.find((s) => s.id === sid)?.label)
      .filter(Boolean);
    const sweetenerSuffix =
      sweetenerLabels.length > 0
        ? ` [Sweeteners included: ${sweetenerLabels.join(', ')}]`
        : '';
    onSubmitTrade(
      targetItem,
      selectedIds,
      (message.trim() ||
        `Hi ${targetItem.owner_name}! Would love to swap for your ${targetItem.title}! 🌿`) +
        sweetenerSuffix
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col"
        >
          {/* Arena Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0]">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <div>
                <h2 className="font-game text-lg font-bold text-[#4A3520]">
                  Cozy Trade-Off Bench
                </h2>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Propose an item swap with {targetItem.owner_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center justify-center text-[#5C4328] hover:bg-[#FF7E67] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* TOP SLOT: TARGET ITEM */}
            <div className="rounded-2xl bg-gradient-to-br from-[#FFFDF7] to-[#F5E9CE] p-3 border-2 border-[#D8C5A0] relative">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] mb-1.5 flex items-center justify-between">
                <span>🎯 You Receive ({targetItem.owner_name}'s Item)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] text-[#5C4328]">
                  {targetItem.rarity}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={
                    targetItem.media_type === 'video'
                      ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'
                      : targetItem.media_url
                  }
                  alt={targetItem.title}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#D8C5A0] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-game text-sm font-bold text-[#4A3520] truncate">
                    {targetItem.title}
                  </h4>
                  <p className="text-xs text-[#7C6246] mt-0.5 line-clamp-1">
                    Wants: {targetItem.wishlist_hint}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-[#4E9F6E]">
                    <span>📍 {targetItem.location_name}</span>
                    {targetItem.distance_km !== undefined && (
                      <span>({targetItem.distance_km.toFixed(1)} km away)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* VS SWAP BADGE + FAIRNESS METER */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FF7E67] text-white font-game font-bold text-xs flex items-center justify-center shadow-cozy-coral border-2 border-white -my-2 z-10">
                <ArrowUpDown className="w-5 h-5" />
              </div>

              <div className="w-full mt-3 bg-[#F5E9CE] rounded-2xl p-3 border-2 border-[#D8C5A0] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#5C4328]">
                  <span>⚖️ Smart Fair-Trade Appraiser</span>
                  <span>
                    Your Offer: <strong className="text-[#2F7A4C]">{offeredScore} pts</strong> vs Target:{' '}
                    <strong className="text-[#4A3520]">{targetScore} pts</strong>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#E2D1B0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(10, fairnessRatio)}%` }}
                    className={`h-full rounded-full ${
                      offeredScore >= targetScore
                        ? 'bg-[#4E9F6E]'
                        : 'bg-[#F6B93B]'
                    }`}
                  />
                </div>
                <p className="text-[11px] font-bold text-[#6E5031] text-center">
                  {fairnessLabel}
                </p>
                <div className="pt-1 border-t border-[#D8C5A0]/70 flex items-center justify-between text-[10px] font-bold text-[#7C6246]">
                  <span>Factors: Rarity + Condition + Vintage Era + 🎯 Wishlist</span>
                  <span>{selectedIds.length}/3 Slots</span>
                </div>
              </div>
            </div>

            {/* BOTTOM SLOTS: SELECT FROM YOUR INVENTORY */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#5C4328]">
                  🎒 Pick Items From Your Pocket to Offer
                </label>
              </div>

              {tradeableItems.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F5E9CE] text-center text-xs font-bold text-[#7C6246]">
                  You have no items marked "Up for Trade" in your pocket! Add an item first.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {tradeableItems.map((myItem) => {
                    const isSelected = selectedIds.includes(myItem.id);
                    const isWishMatch = doesItemMatchWishlist(myItem);
                    return (
                      <button
                        type="button"
                        key={myItem.id}
                        onClick={() => toggleItem(myItem.id)}
                        className={`relative rounded-2xl p-2 border-2 text-left transition-all flex flex-col items-center ${
                          isSelected
                            ? 'bg-[#EBF7EE] border-[#4E9F6E] shadow-cozy-green -translate-y-0.5'
                            : isWishMatch
                            ? 'bg-[#FFF6E0] border-[#F6B93B]'
                            : 'bg-white border-[#D8C5A0] hover:border-[#B89F72]'
                        }`}
                      >
                        {isWishMatch && !isSelected && (
                          <span className="absolute -top-1.5 left-1.5 px-1.5 py-0.2 rounded-full bg-[#F6B93B] text-[#4A3520] text-[8px] font-extrabold shadow">
                            🎯 Wants!
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4E9F6E] text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                        <img
                          src={
                            myItem.media_type === 'video'
                              ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'
                              : myItem.media_url
                          }
                          alt={myItem.title}
                          className="w-full aspect-square rounded-xl object-cover border border-[#EFE2C6]"
                        />
                        <span className="mt-1.5 text-[11px] font-extrabold text-[#4A3520] line-clamp-1 w-full text-center">
                          {myItem.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#8C6D46]">
                          {myItem.rarity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cozy Trade Sweeteners (Cashless Perks to Balance Any Swap) */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                🎁 Add Cozy Trade Sweeteners (Optional Perks to Boost Match %)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {COZY_SWEETENERS.map((sw) => {
                  const active = selectedSweeteners.includes(sw.id);
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      onClick={() => toggleSweetener(sw.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border text-left flex items-center justify-between transition-all ${
                        active
                          ? 'bg-[#FFF6E0] border-[#F6B93B] text-[#4A3520] shadow-sm'
                          : 'bg-white border-[#D8C5A0] text-[#7C6246] hover:bg-[#FFFDF7]'
                      }`}
                    >
                      <span className="truncate">{sw.label}</span>
                      <span className="text-[9px] text-[#2F7A4C] ml-1 shrink-0">
                        +{sw.bonus}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Friendly Message Note */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                💬 Add a Cozy Trade Note
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hey ${targetItem.owner_name}! Want to meet at ${targetItem.location_name} for this swap?`}
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2 text-xs font-bold text-[#4A3520] placeholder-[#A89274] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className={`w-full py-3.5 rounded-2xl font-game text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                selectedIds.length > 0
                  ? 'bg-[#4E9F6E] hover:bg-[#3F885B] text-white shadow-cozy-green active:translate-y-0.5'
                  : 'bg-[#D8C5A0] text-[#8C755B] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                Send Trade Offer ({selectedIds.length}{' '}
                {selectedIds.length === 1 ? 'Item' : 'Items'})
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
