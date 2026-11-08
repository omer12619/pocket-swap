import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Video,
  Sparkles,
  MapPin,
  Zap,
  AlertTriangle,
  Calendar,
  Tag,
  Package,
} from 'lucide-react';
import {
  ItemCategory,
  ItemCondition,
  ItemRarity,
  TradeItem,
  UserProfile,
} from '../../types/game';
import { getSupabaseClient } from '../../lib/supabase';
import {
  formatBytes,
  optimizeImageFile,
  OptimizedMediaResult,
  validateAndExtractVideoPoster,
} from '../../lib/mediaOptimizer';

interface UploadItemModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onAddItem: (newItem: TradeItem) => void;
}

const CATEGORIES: Exclude<ItemCategory, 'All'>[] = [
  'Gaming',
  'Gadgets',
  'Collectibles',
  'Fashion',
  'Books & Art',
  'Home & Cozy',
];

const RARITIES: ItemRarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
const CONDITIONS: ItemCondition[] = [
  'Mint ✨',
  'Great 🌿',
  'Well-Loved 🧸',
  'Needs TLC 🛠️',
];

const QUICK_PRESETS = [
  {
    title: 'Nintendo Switch OLED (White Dock + Mario Wonder)',
    category: 'Gaming' as const,
    rarity: 'Legendary' as const,
    year_made: 2023,
    brand: 'Nintendo',
    accessories_included: 'Original Box + White Dock + Joy-Con Grip + HDMI',
    condition_notes: 'Glass screen protector installed since day 1, zero Joy-Con drift.',
    media_type: 'image' as const,
    media_url:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80',
    wishlist_hint: 'Looking for an iPad Mini, vintage camera, or audio gear!',
  },
  {
    title: 'Sony Walkman TPS-L2 Cassette Player (Vintage)',
    category: 'Gadgets' as const,
    rarity: 'Legendary' as const,
    year_made: 1984,
    brand: 'Sony Classic',
    accessories_included: 'Leather Case + Foam Headphones + 3 Mixtapes',
    condition_notes: 'New drive belt installed in 2025, plays cassettes at exact pitch!',
    media_type: 'image' as const,
    media_url:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
    wishlist_hint: 'Mechanical keyboard, vinyl records, or Espresso machine!',
  },
  {
    title: 'Live Vinyl Turntable Setup Showcase (Video)',
    category: 'Home & Cozy' as const,
    rarity: 'Epic' as const,
    year_made: 2021,
    brand: 'Audio-Technica',
    accessories_included: 'Dust Cover + Ortofon Stylus + RCA Preamp Cable',
    condition_notes: 'Stylus has less than 30 hours of spin time.',
    media_type: 'video' as const,
    media_url:
      'https://assets.mixkit.co/videos/preview/mixkit-turntable-playing-a-vinyl-record-42921-large.mp4',
    wishlist_hint: 'Rare collectibles, guitars, or retro gaming consoles!',
  },
];

export const UploadItemModal: React.FC<UploadItemModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onAddItem,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<ItemCategory, 'All'>>('Gaming');
  const [condition, setCondition] = useState<ItemCondition>('Mint ✨');
  const [rarity, setRarity] = useState<ItemRarity>('Rare');
  const [yearMade, setYearMade] = useState<number>(2023);
  const [brand, setBrand] = useState<string>('');
  const [accessoriesIncluded, setAccessoriesIncluded] = useState<string>(
    'Original Box & Accessories'
  );
  const [conditionNotes, setConditionNotes] = useState<string>('');
  const [wishlistHint, setWishlistHint] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [compressionStats, setCompressionStats] =
    useState<OptimizedMediaResult | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setUploading(true);
    setMediaError(null);

    try {
      const optimized = isVideo
        ? await validateAndExtractVideoPoster(file)
        : await optimizeImageFile(file);

      setCompressionStats(optimized);

      const supabase = getSupabaseClient();
      if (supabase && optimized.blob) {
        const ext = isVideo ? file.name.split('.').pop() || 'mp4' : 'webp';
        const filePath = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from('item-media')
          .upload(filePath, optimized.blob, {
            upsert: true,
            contentType: isVideo ? file.type : 'image/webp',
          });

        if (!error) {
          const { data } = supabase.storage
            .from('item-media')
            .getPublicUrl(filePath);
          if (data?.publicUrl) {
            setMediaUrl(data.publicUrl);
            setUploading(false);
            return;
          }
        }
      }

      setMediaUrl(optimized.dataUrl);
      setUploading(false);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : 'Failed to optimize media file'
      );
      setUploading(false);
    }
  };

  const applyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setRarity(preset.rarity);
    setYearMade(preset.year_made);
    setBrand(preset.brand);
    setAccessoriesIncluded(preset.accessories_included);
    setConditionNotes(preset.condition_notes);
    setMediaType(preset.media_type);
    setMediaUrl(preset.media_url);
    setWishlistHint(preset.wishlist_hint);
    setCompressionStats(null);
    setMediaError(null);
    setDescription(
      `Super clean ${preset.year_made} ${preset.title}! Ready for a local trade in ${currentUser.location_name}.`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalMediaUrl =
      mediaUrl.trim() ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80';

    const newItem: TradeItem = {
      id: `item-${Date.now()}`,
      owner_id: currentUser.id,
      owner_name: currentUser.display_name,
      owner_avatar: currentUser.avatar_emoji,
      owner_karma: currentUser.karma_score,
      owner_level: currentUser.level,
      title: title.trim(),
      description:
        description.trim() ||
        'Stored safely in my cozy collection! Let me know what you want to trade.',
      category,
      condition,
      rarity,
      year_made: Number(yearMade) || 2023,
      brand: brand.trim() || 'Original Maker',
      accessories_included: accessoriesIncluded.trim() || 'Item Only',
      condition_notes:
        conditionNotes.trim() ||
        'Tested and verified in great working condition.',
      media_url: finalMediaUrl,
      media_type: mediaType,
      wishlist_hint: wishlistHint.trim() || 'Open to any fun local offers!',
      is_for_trade: true,
      latitude: currentUser.latitude + (Math.random() - 0.5) * 0.003,
      longitude: currentUser.longitude + (Math.random() - 0.5) * 0.003,
      location_name: currentUser.location_name,
      distance_km: 0,
      likes_count: 1,
      created_at: new Date().toISOString(),
    };

    onAddItem(newItem);
    // Reset form state so next upload starts fresh
    setTitle('');
    setDescription('');
    setBrand('');
    setYearMade(2023);
    setAccessoriesIncluded('Original Box & Accessories');
    setConditionNotes('');
    setWishlistHint('');
    setMediaUrl('');
    setCompressionStats(null);
    setMediaError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎒</span>
              <div>
                <h2 className="font-game text-lg font-bold text-[#4A3520]">
                  Add Item & Provenance Specs
                </h2>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Include Year, Condition & Details • Earn +25 XP!
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

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Quick 1-Tap Demo Presets */}
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] mb-1.5">
                ⚡ Quick Fill Demo Presets (With Year & Condition Specs)
              </span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#F5E9CE] hover:bg-[#E9D7B2] border border-[#D8C5A0] text-[11px] font-extrabold text-[#5C4328] flex items-center gap-1"
                  >
                    <span>{preset.media_type === 'video' ? '🎬' : '📸'}</span>
                    <span className="truncate max-w-[140px]">
                      ({preset.year_made}) {preset.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo / Video Upload Dropzone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {mediaError && (
                <div className="mb-2 p-2.5 rounded-2xl bg-[#FFF0EC] border border-[#FF7E67] text-xs font-bold text-[#B83B24] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{mediaError}</span>
                </div>
              )}

              {mediaUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-[#2D241C] aspect-video border-2 border-[#4E9F6E]">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaUrl}
                        poster={compressionStats?.thumbnailDataUrl}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Photo/Video</span>
                    </button>
                  </div>

                  {compressionStats && (
                    <div className="px-3 py-2 rounded-xl bg-[#EBF7EE] border border-[#8BD1A0] flex items-center justify-between text-[11px] font-extrabold text-[#2F7A4C]">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-[#4E9F6E]" />
                        {compressionStats.mediaType === 'image' ? (
                          <span>
                            WebP Optimized:{' '}
                            {formatBytes(compressionStats.originalBytes)} →{' '}
                            {formatBytes(compressionStats.compressedBytes)}
                          </span>
                        ) : (
                          <span>
                            Video Verified ({compressionStats.durationSec}s •{' '}
                            {formatBytes(compressionStats.originalBytes)})
                          </span>
                        )}
                      </span>
                      {compressionStats.savingsPercent > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#4E9F6E] text-white text-[10px]">
                          -{compressionStats.savingsPercent}% Size
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#B89F72] bg-[#FFFDF7] hover:bg-[#F5E9CE]/50 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-2xl bg-[#EBF7EE] text-[#4E9F6E] flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </span>
                    <span className="w-10 h-10 rounded-2xl bg-[#FFF0EC] text-[#FF7E67] flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="font-game text-sm font-bold text-[#4A3520]">
                      {uploading
                        ? '⚡ Compressing to Fast WebP...'
                        : 'Tap to Snap Photo or Record Video'}
                    </p>
                    <p className="text-[11px] font-bold text-[#8C6D46]">
                      Auto-compresses phone photos to crisp WebP
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Item Title */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                🏷️ Item Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., GameBoy Color Atomic Purple, Polaroid Camera..."
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2.5 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            {/* Year Made & Brand / Maker Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>Year From</span>
                </label>
                <input
                  type="number"
                  min={1920}
                  max={2027}
                  value={yearMade}
                  onChange={(e) => setYearMade(Number(e.target.value))}
                  placeholder="1999"
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  <Tag className="w-3.5 h-3.5 text-[#FF7E67]" />
                  <span>Brand / Maker</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Nintendo, Sony..."
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>
            </div>

            {/* Rarity & Condition Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  ✨ Rarity Tier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RARITIES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRarity(r)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border transition-all ${
                        rarity === r
                          ? 'bg-[#4E9F6E] text-white border-[#367A51] shadow-sm'
                          : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  🌿 Condition Grade
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {CONDITIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold border text-center transition-all ${
                        condition === c
                          ? 'bg-[#F6B93B] text-[#4A3520] border-[#C89019]'
                          : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Accessories Included & Condition Notes */}
            <div className="space-y-2.5 bg-[#F5E9CE]/60 p-3 rounded-2xl border border-[#D8C5A0]">
              <div>
                <label className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  <Package className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>What's Included (Box, Cables, Manuals)</span>
                </label>
                <input
                  type="text"
                  value={accessoriesIncluded}
                  onChange={(e) => setAccessoriesIncluded(e.target.value)}
                  placeholder="e.g., Original Box + Charger + Carrying Case"
                  className="w-full rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  🔎 Detailed Condition Notes (Scratches, Battery, History)
                </label>
                <input
                  type="text"
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g., Zero scratches on lens, new battery installed in 2025"
                  className="w-full rounded-xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                🗂️ Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                      category === cat
                        ? 'bg-[#5C4328] text-white border-[#4A3520]'
                        : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description & Wishlist */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  📝 Item Story & Overview
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people the story behind this item..."
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  💫 What Do You Want in Return? (Wishlist)
                </label>
                <input
                  type="text"
                  value={wishlistHint}
                  onChange={(e) => setWishlistHint(e.target.value)}
                  placeholder="e.g., Retro games, headphones, plants, or surprise me!"
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-sm font-bold shadow-cozy-green active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Put Item in Pocket Inventory (+25 XP)</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
