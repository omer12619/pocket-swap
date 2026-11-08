import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Package,
  ShieldCheck,
  Sparkles,
  ArrowLeftRight,
  MessageCircle,
  Tag,
  Send,
  Flag,
  Ban,
} from 'lucide-react';
import { TradeItem } from '../../types/game';

interface ItemDetailModalProps {
  item: TradeItem | null;
  isOwnItem: boolean;
  onClose: () => void;
  onProposeTrade: (item: TradeItem) => void;
  onAskQuestion: (item: TradeItem, questionText: string) => void;
  onReportItem?: (item: TradeItem) => void;
  onBlockUser?: (ownerId: string, ownerName: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOwnItem,
  onClose,
  onProposeTrade,
  onAskQuestion,
  onReportItem,
  onBlockUser,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);

  if (!item) return null;

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(0, currentYear - (item.year_made || 2023));
  const eraLabel =
    item.year_made < 2005
      ? `Vintage (${ageYears} yrs old)`
      : item.year_made < 2018
      ? `Classic (${item.year_made})`
      : `Modern (${item.year_made})`;

  // Multi-angle gallery views (Main media + zoomed detail crop + condition angle)
  const angleLabels = ['📸 Main Showcase', '🔍 Condition Zoom', '📦 Accessories View'];

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    onAskQuestion(item, questionText.trim());
    setQuestionText('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: 70, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 70, opacity: 0, scale: 0.96 }}
          className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col"
        >
          {/* Top Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <div>
                <h2 className="font-game text-base font-bold text-[#4A3520]">
                  Item Appraisal & Specs Sheet
                </h2>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Full provenance, year, condition & multi-angle view
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

          <div className="p-4 space-y-4">
            {/* Media Showcase with Multi-Angle Switcher */}
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden bg-[#2D241C] aspect-[4/3] border-2 border-[#D8C5A0]">
                {item.media_type === 'video' ? (
                  <video
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      activeAngleIdx === 1
                        ? 'scale-125 object-center'
                        : activeAngleIdx === 2
                        ? 'scale-110 object-bottom'
                        : 'scale-100'
                    }`}
                  />
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-[#FFF9EB]/95 text-[#4A3520] text-xs font-extrabold shadow">
                    {item.rarity}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#4E9F6E] text-white text-xs font-extrabold shadow">
                    📅 {item.year_made || 2023}
                  </span>
                </div>
              </div>

              {item.media_type === 'image' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {angleLabels.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setActiveAngleIdx(idx)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition-all ${
                        activeAngleIdx === idx
                          ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                          : 'bg-[#FFFDF7] text-[#5C4328] border-[#D8C5A0]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Story */}
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#8C6D46] mb-1">
                <span>{item.category}</span>
                <span>•</span>
                <span>📍 {item.location_name}</span>
                {item.distance_km !== undefined && (
                  <span>({item.distance_km.toFixed(1)} km)</span>
                )}
              </div>
              <h3 className="font-game text-lg font-bold text-[#4A3520] leading-snug">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs font-semibold text-[#5C4328] leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* 4-Box Provenance & Specs Grid (Year, Brand, Condition, Accessories) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  <Calendar className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>Year / Era</span>
                </div>
                <p className="font-game text-sm font-bold text-[#4A3520] mt-1">
                  {item.year_made || 2023}
                </p>
                <span className="text-[11px] font-bold text-[#7C6246]">
                  {eraLabel}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  <Tag className="w-3.5 h-3.5 text-[#FF7E67]" />
                  <span>Brand / Maker</span>
                </div>
                <p className="font-game text-sm font-bold text-[#4A3520] mt-1 truncate">
                  {item.brand || 'Original Maker'}
                </p>
                <span className="text-[11px] font-bold text-[#7C6246]">
                  Authentic Item
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F6B93B]" />
                  <span>Condition Grade</span>
                </div>
                <p className="font-game text-sm font-bold text-[#4A3520] mt-1">
                  {item.condition}
                </p>
                <span className="text-[11px] font-bold text-[#7C6246]">
                  Verified by Owner
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0]">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  <Package className="w-3.5 h-3.5 text-[#68B9E8]" />
                  <span>What's Included</span>
                </div>
                <p className="font-game text-xs font-bold text-[#4A3520] mt-1 line-clamp-2">
                  {item.accessories_included || 'Item Only'}
                </p>
              </div>
            </div>

            {/* Detailed Condition Notes Box */}
            <div className="p-3.5 rounded-2xl bg-[#F5E9CE]/75 border-2 border-[#D8C5A0] space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6E5031] block">
                🔎 Detailed Condition & History Notes
              </span>
              <p className="text-xs font-bold text-[#4A3520] leading-relaxed">
                {item.condition_notes ||
                  'Tested and kept in great shape! Ready for local inspection during swap.'}
              </p>
            </div>

            {/* Wishlist Box */}
            <div className="p-3 rounded-2xl bg-[#FFF6E0] border-2 border-[#EED9B3] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#E59819] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#B57C1E] block">
                  Trader's Wishlist
                </span>
                <p className="text-xs font-bold text-[#5C4328]">
                  {item.wishlist_hint}
                </p>
              </div>
            </div>

            {/* Ask a Question Directly From Item Sheet */}
            {!isOwnItem && (
              <form
                onSubmit={handleSendQuestion}
                className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2"
              >
                <label className="text-[11px] font-extrabold uppercase text-[#5C4328] flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>Ask {item.owner_name} a Question About This Item</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={`e.g., Does this ${item.year_made} ${item.brand} have any scratches?`}
                    className="flex-1 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#5C4328] hover:bg-[#4A3520] text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </div>
              </form>
            )}

            {/* Primary Offer Trade Button */}
            {!isOwnItem && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProposeTrade(item);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-sm font-bold shadow-cozy-green flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Propose a Trade for This Item</span>
              </button>
            )}

            {/* App Store Guideline 1.2 Trust & Safety Bar (Report Item / Block User) */}
            {!isOwnItem && (
              <div className="pt-2 border-t border-dashed border-[#D8C5A0] flex items-center justify-between text-[11px] font-bold text-[#8C6D46]">
                <button
                  type="button"
                  onClick={() => {
                    onReportItem?.(item);
                    onClose();
                  }}
                  className="flex items-center gap-1 hover:text-[#C84B31] transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Listing</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onBlockUser?.(item.owner_id, item.owner_name);
                    onClose();
                  }}
                  className="flex items-center gap-1 hover:text-[#C84B31] transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Block {item.owner_name}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
