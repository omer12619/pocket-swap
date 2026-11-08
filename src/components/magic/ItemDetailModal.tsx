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
  Share2,
  Pencil,
} from 'lucide-react';
import { TradeItem } from '../../types/game';

interface ItemDetailModalProps {
  item: TradeItem | null;
  isOwnItem: boolean;
  onClose: () => void;
  onProposeTrade: (item: TradeItem) => void;
  onAskQuestion: (item: TradeItem, questionText: string) => void;
  onAddPublicComment?: (itemId: string, commentText: string) => void;
  onReportItem?: (item: TradeItem) => void;
  onBlockUser?: (ownerId: string, ownerName: string) => void;
  onShareItem?: (item: TradeItem) => void;
  onEditItem?: (item: TradeItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOwnItem,
  onClose,
  onProposeTrade,
  onAskQuestion,
  onAddPublicComment,
  onReportItem,
  onBlockUser,
  onShareItem,
  onEditItem,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [publicCommentText, setPublicCommentText] = useState('');
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  if (!item) return null;

  const allPhotos = [
    item.media_url,
    ...(item.gallery_urls ? item.gallery_urls.filter(Boolean) : []),
  ];
  const currentPhotoUrl = allPhotos[selectedPhotoIdx] || item.media_url;

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

  const handlePostPublicComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicCommentText.trim() || !onAddPublicComment) return;
    onAddPublicComment(item.id, publicCommentText.trim());
    setPublicCommentText('');
  };

  const defaultComments = [
    {
      id: 'default-c1',
      user_id: 'user-3',
      user_name: 'Mochi Cat',
      user_avatar: '🐱',
      text: `Is everything tested and working smoothly on this ${item.year_made || 2023} ${item.brand || 'item'}?`,
      created_at: '2h ago',
    },
    {
      id: 'default-c2',
      user_id: item.owner_id,
      user_name: item.owner_name,
      user_avatar: item.owner_avatar,
      text: `Yes! Graded ${item.condition} and comes with ${item.accessories_included || 'all listed accessories'}. Happy to let you test it in person at meetup!`,
      is_owner_reply: true,
      created_at: '1h ago',
    },
  ];

  const displayedComments =
    item.comments && item.comments.length > 0 ? item.comments : defaultComments;

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
            <div className="flex items-center gap-1.5">
              {onShareItem && (
                <button
                  type="button"
                  onClick={() => onShareItem(item)}
                  title="Share Item / QR Code"
                  className="px-2.5 py-1.5 rounded-full bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center gap-1 text-[11px] font-extrabold text-[#4E9F6E] hover:bg-[#4E9F6E] hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FFF9EB] border-2 border-[#D8C5A0] flex items-center justify-center text-[#5C4328] hover:bg-[#FF7E67] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Media Showcase with Multi-Angle & Multi-Photo Switcher */}
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
                    src={currentPhotoUrl}
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

              {/* Multi-Photo Gallery Thumbnails (when additional photos exist) */}
              {item.media_type === 'image' && allPhotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allPhotos.map((photoUrl, idx) => (
                    <button
                      key={`${photoUrl}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedPhotoIdx(idx);
                        setActiveAngleIdx(0);
                      }}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedPhotoIdx === idx
                          ? 'border-[#4E9F6E] ring-2 ring-[#4E9F6E]/40 scale-105'
                          : 'border-[#D8C5A0] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photoUrl}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/65 text-white text-[9px] font-extrabold">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

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

            {/* Public Community Q&A Wall on Item */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-[#5C4328] flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>Public Item Q&A Wall ({displayedComments.length})</span>
                </span>
                <span className="text-[10px] font-bold text-[#8C6D46]">
                  Visible to all villagers
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {displayedComments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-xl border text-xs ${
                      c.is_owner_reply
                        ? 'bg-[#EBF7EE] border-[#8BD1A0]'
                        : 'bg-[#FFF9EB] border-[#E6D5B5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span>{c.user_avatar}</span>
                        <span className="font-extrabold text-[#4A3520]">
                          {c.user_name}
                        </span>
                        {c.is_owner_reply && (
                          <span className="px-1.5 py-0.2 rounded bg-[#4E9F6E] text-white text-[9px] font-extrabold uppercase">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#8C6D46]">
                        {c.created_at}
                      </span>
                    </div>
                    <p className="font-semibold text-[#5C4328] leading-snug">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>

              {onAddPublicComment && (
                <form onSubmit={handlePostPublicComment} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={publicCommentText}
                    onChange={(e) => setPublicCommentText(e.target.value)}
                    placeholder={
                      isOwnItem
                        ? 'Post an owner update or answer on your listing...'
                        : `Ask a public question on this listing...`
                    }
                    className="flex-1 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-1.5 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white text-xs font-extrabold shrink-0"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>

            {/* Ask a Private Question Directly in 1-on-1 Trade Chat */}
            {!isOwnItem && (
              <form
                onSubmit={handleSendQuestion}
                className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2"
              >
                <label className="text-[11px] font-extrabold uppercase text-[#5C4328] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#FF7E67]" />
                  <span>Or Start Private 1-on-1 Trade Chat with {item.owner_name}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={`DM ${item.owner_name} privately about swapping...`}
                    className="flex-1 rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#5C4328] hover:bg-[#4A3520] text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>DM</span>
                  </button>
                </div>
              </form>
            )}

            {/* Primary Offer Trade Button OR Owner Edit/Share Controls */}
            {isOwnItem ? (
              <div className="grid grid-cols-2 gap-2">
                {onEditItem && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditItem(item);
                    }}
                    className="py-3 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Item & Photos</span>
                  </button>
                )}
                {onShareItem && (
                  <button
                    type="button"
                    onClick={() => onShareItem(item)}
                    className="py-3 rounded-2xl bg-[#5C4328] hover:bg-[#4A3520] text-white font-game text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Link & QR</span>
                  </button>
                )}
              </div>
            ) : (
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
