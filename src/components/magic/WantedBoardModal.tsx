import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Plus, ArrowLeftRight, MapPin, Search } from 'lucide-react';
import { ItemCategory, UserProfile, WantedPost } from '../../types/game';

interface WantedBoardModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  wantedPosts: WantedPost[];
  onClose: () => void;
  onAddWantedPost: (
    lookingFor: string,
    category: Exclude<ItemCategory, 'All'>,
    offeringHint: string
  ) => void;
  onFulfillWanted: (post: WantedPost) => void;
}

const WANTED_CATEGORIES: Exclude<ItemCategory, 'All'>[] = [
  'Gaming',
  'Gadgets',
  'Collectibles',
  'Fashion',
  'Books & Art',
  'Home & Cozy',
];

export const WantedBoardModal: React.FC<WantedBoardModalProps> = ({
  isOpen,
  currentUser,
  wantedPosts,
  onClose,
  onAddWantedPost,
  onFulfillWanted,
}) => {
  const [lookingFor, setLookingFor] = useState('');
  const [category, setCategory] =
    useState<Exclude<ItemCategory, 'All'>>('Gaming');
  const [offeringHint, setOfferingHint] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookingFor.trim()) return;
    onAddWantedPost(
      lookingFor.trim(),
      category,
      offeringHint.trim() || 'Any item from my Pocket Inventory!'
    );
    setLookingFor('');
    setOfferingHint('');
    setShowForm(false);
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
          <div className="px-5 py-4 bg-gradient-to-r from-[#5C4328] to-[#7C6246] text-[#FFF9EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F6B93B] text-[#4A3520] flex items-center justify-center text-lg shadow">
                📌
              </div>
              <div>
                <h3 className="font-game text-base font-bold leading-tight">
                  Village Wanted Board (ISO)
                </h3>
                <p className="text-[11px] text-[#FFF9EB]/85 font-semibold">
                  See what neighbors are searching for & post your own wish!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-3.5">
            {/* Post New ISO Toggle / Form */}
            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#F6B93B] hover:bg-[#E7A92B] text-[#4A3520] font-game text-xs font-bold shadow-cozy-gold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post What You’re Looking For (ISO) • +15 XP</span>
              </button>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-3.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#F6B93B] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-game text-xs font-bold text-[#4A3520]">
                    📌 Pin Your ISO Wish Note to the Village Board
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-[11px] font-extrabold text-[#8C6D46]"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#5C4328] mb-1">
                    🔍 What Specific Item Are You Looking For?
                  </label>
                  <input
                    type="text"
                    required
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    placeholder="e.g., Nintendo 3DS Charger, Fujifilm Instax Film, Cozy Desk Lamp..."
                    className="w-full rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-[#5C4328] mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as Exclude<ItemCategory, 'All'>)
                      }
                      className="w-full rounded-xl bg-white border-2 border-[#D8C5A0] px-2.5 py-2 text-xs font-bold text-[#4A3520]"
                    >
                      {WANTED_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-[#5C4328] mb-1">
                      🎁 What Can You Offer?
                    </label>
                    <input
                      type="text"
                      value={offeringHint}
                      onChange={(e) => setOfferingHint(e.target.value)}
                      placeholder="e.g., Retro games or plants"
                      className="w-full rounded-xl bg-white border-2 border-[#D8C5A0] px-2.5 py-2 text-xs font-bold text-[#4A3520]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-sm"
                >
                  📌 Pin Wish Note to Board (+15 XP)
                </button>
              </form>
            )}

            {/* Wanted Posts List */}
            <div className="space-y-2.5">
              {wantedPosts.map((post) => {
                const isMine = post.user_id === currentUser.id;
                return (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0] flex items-center justify-center text-lg">
                          {post.user_avatar}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-game text-xs font-bold text-[#4A3520]">
                              {post.user_name} {isMine && '(You)'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#E9DEC7] text-[#6D5438] text-[9px] font-extrabold">
                              Lv.{post.user_level}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#7C6246] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#4E9F6E]" />
                            {post.location_name} • {post.created_at}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF6E0] border border-[#EED9B3] text-[#8C5800] text-[10px] font-extrabold">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F5E9CE]/70 border border-[#D8C5A0] space-y-1">
                      <div className="flex items-start gap-1.5 text-xs font-extrabold text-[#4A3520]">
                        <Search className="w-3.5 h-3.5 text-[#FF7E67] shrink-0 mt-0.5" />
                        <span>ISO: “{post.looking_for}”</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] font-bold text-[#2F7A4C]">
                        <Sparkles className="w-3.5 h-3.5 text-[#4E9F6E] shrink-0 mt-0.5" />
                        <span>Offering in return: {post.offering_hint}</span>
                      </div>
                    </div>

                    {!isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onFulfillWanted(post);
                        }}
                        className="w-full py-2 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>🎁 I Have This! Propose Swap with {post.user_name}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
