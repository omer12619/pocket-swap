import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  Sparkles,
  ArrowLeftRight,
  Video,
  Star,
  Calendar,
  Package,
  Info,
  Trash2,
  Share2,
  Pencil,
} from 'lucide-react';
import { CATEGORY_ICONS, ItemRarity, TradeItem } from '../../types/game';

interface MagicGameCardProps {
  item: TradeItem;
  isOwnItem: boolean;
  isFriendItem?: boolean;
  isLiked?: boolean;
  hasWishlistMatch?: boolean;
  onProposeTrade: (item: TradeItem) => void;
  onInspectItem?: (item: TradeItem) => void;
  onToggleForTrade?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onInspectProfile?: (ownerId: string) => void;
  onLikeItem?: (itemId: string) => void;
  onShareItem?: (item: TradeItem) => void;
  onEditItem?: (item: TradeItem) => void;
}

const RARITY_STYLES: Record<
  ItemRarity,
  {
    border: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    icon: string;
  }
> = {
  Common: {
    border: 'border-[#D8C5A0]',
    badgeBg: 'bg-[#E9DEC7]',
    badgeText: 'text-[#6D5438]',
    glow: '',
    icon: '🌿',
  },
  Rare: {
    border: 'border-[#68B9E8]',
    badgeBg: 'bg-[#E1F3FD]',
    badgeText: 'text-[#1F6E9C]',
    glow: 'shadow-[0_5px_0_#92CBEB]',
    icon: '💎',
  },
  Epic: {
    border: 'border-[#A569BD]',
    badgeBg: 'bg-[#F3E5F8]',
    badgeText: 'text-[#6C3483]',
    glow: 'shadow-[0_5px_0_#C39BD3]',
    icon: '🔮',
  },
  Legendary: {
    border: 'border-[#F6B93B]',
    badgeBg: 'bg-gradient-to-r from-[#FFF0C2] via-[#FFE082] to-[#FFD54F]',
    badgeText: 'text-[#8C5800]',
    glow: 'shadow-[0_5px_0_#E5A930]',
    icon: '👑',
  },
};

export const MagicGameCard: React.FC<MagicGameCardProps> = ({
  item,
  isOwnItem,
  isFriendItem = false,
  isLiked = false,
  hasWishlistMatch = false,
  onProposeTrade,
  onInspectItem,
  onToggleForTrade,
  onDeleteItem,
  onInspectProfile,
  onLikeItem,
  onShareItem,
  onEditItem,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rarityStyle = RARITY_STYLES[item.rarity] || RARITY_STYLES.Common;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || item.media_type !== 'video') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, [item.media_type]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikeItem?.(item.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={`relative rounded-3xl bg-[#FFFDF7] border-[3px] ${rarityStyle.border} ${
        rarityStyle.glow || 'shadow-cozy'
      } overflow-hidden flex flex-col transition-all`}
    >
      {/* Legendary Holographic Overlay Sheen */}
      {item.rarity === 'Legendary' && (
        <div className="pointer-events-none absolute inset-0 holo-legendary opacity-40 z-0" />
      )}

      {/* Top Card Header: Rarity Pill, Year Badge & Distance */}
      <div className="relative z-10 flex flex-wrap items-center justify-between px-3.5 pt-3 pb-2 gap-1.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase whitespace-nowrap border border-black/5 ${rarityStyle.badgeBg} ${rarityStyle.badgeText}`}
          >
            <span>{rarityStyle.icon}</span>
            {item.rarity}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap bg-[#FFF6E0] text-[#8C5800] border border-[#EED9B3]">
            <Calendar className="w-3 h-3 shrink-0" />
            {item.year_made || 2023}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.distance_km !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-[#EBF7EE] text-[#2F7A4C] border border-[#BEE3C8]">
              <MapPin className="w-3 h-3 shrink-0 fill-[#4E9F6E]/20" />
              {item.distance_km < 0.1
                ? 'Here!'
                : `${item.distance_km.toFixed(1)} km`}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap bg-[#F5E9CE] text-[#6E5031]">
            {item.condition}
          </span>
        </div>
      </div>

      {/* Media Frame (Clickable to open full Item Appraisal Sheet) */}
      <div
        onClick={() => onInspectItem?.(item)}
        className="relative z-10 mx-3 rounded-2xl overflow-hidden bg-[#E9DEC7] aspect-[4/3] border-2 border-[#EFE2C6] group cursor-pointer"
      >
        {item.media_type === 'video' ? (
          <div className="relative w-full h-full bg-[#2D241C]">
            <video
              ref={videoRef}
              src={item.media_url}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#FF7E67]" />
              <span>SMART VIDEO STREAM</span>
            </div>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#EFE2C6] via-[#FFF9EB] to-[#EFE2C6] animate-pulse" />
            )}
            <img
              src={item.media_url}
              alt={item.title}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
              }`}
              loading="lazy"
              decoding="async"
            />
          </>
        )}

        {/* Category + Brand Tag + Like Heart */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="px-2.5 py-1 rounded-xl bg-[#FFF9EB]/95 backdrop-blur-sm text-[#5C4328] text-[11px] font-extrabold shadow-sm flex items-center gap-1">
              <span>{CATEGORY_ICONS[item.category]}</span>
              <span>{item.category}</span>
            </span>
            {item.brand && (
              <span className="px-2 py-1 rounded-xl bg-black/65 backdrop-blur-sm text-white text-[10px] font-extrabold shadow-sm truncate max-w-[115px]">
                {item.brand}
              </span>
            )}
          </div>

          <button
            onClick={handleLike}
            className={`px-2.5 py-1 rounded-xl backdrop-blur-sm text-xs font-extrabold flex items-center gap-1 shadow-sm transition-transform active:scale-90 ${
              isLiked
                ? 'bg-[#FF7E67] text-white'
                : 'bg-[#FFF9EB]/90 text-[#5C4328] hover:bg-white'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isLiked ? 'fill-white' : 'text-[#FF7E67]'
              }`}
            />
            <span>{item.likes_count + (isLiked ? 1 : 0)}</span>
          </button>
        </div>
      </div>

      {/* Item Info, Provenance Pills & Wishlist */}
      <div className="relative z-10 p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <h3
            onClick={() => onInspectItem?.(item)}
            className="font-game text-base font-bold text-[#4A3520] leading-snug line-clamp-1 cursor-pointer hover:text-[#4E9F6E] transition-colors"
          >
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-[#7C6246] line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Specs & Provenance Strip */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#5C4328]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5E9CE] border border-[#D8C5A0]">
              <Package className="w-3 h-3 text-[#4E9F6E]" />
              <span className="truncate max-w-[140px]">
                {item.accessories_included || 'Item Only'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onInspectItem?.(item)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF9EB] hover:bg-[#F5E9CE] border border-[#D8C5A0] text-[#4E9F6E] font-extrabold transition-colors"
            >
              <Info className="w-3 h-3" />
              <span>Specs & Q&A</span>
            </button>
            {onShareItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareItem(item);
                }}
                title="Share item link or QR code"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF9EB] hover:bg-[#F5E9CE] border border-[#D8C5A0] text-[#5C4328] font-extrabold transition-colors"
              >
                <Share2 className="w-3 h-3 text-[#FF7E67]" />
                <span>Share</span>
              </button>
            )}
          </div>

          {/* Cozy Wishlist Bubble */}
          <div
            className={`mt-2 p-2 rounded-xl border flex items-start justify-between gap-1.5 ${
              hasWishlistMatch && !isOwnItem
                ? 'bg-[#EBF7EE] border-[#4E9F6E]'
                : 'bg-[#FFF6E0] border-[#EED9B3]'
            }`}
          >
            <div className="flex items-start gap-1.5">
              <Sparkles
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                  hasWishlistMatch && !isOwnItem
                    ? 'text-[#2F7A4C]'
                    : 'text-[#E59819]'
                }`}
              />
              <p
                className={`text-[11px] font-bold leading-tight ${
                  hasWishlistMatch && !isOwnItem
                    ? 'text-[#2F7A4C]'
                    : 'text-[#7A592E]'
                }`}
              >
                <span
                  className={`uppercase mr-1 ${
                    hasWishlistMatch && !isOwnItem
                      ? 'text-[#1F5C36] font-extrabold'
                      : 'text-[#B57C1E]'
                  }`}
                >
                  Wants:
                </span>
                {item.wishlist_hint}
              </p>
            </div>
            {hasWishlistMatch && !isOwnItem && (
              <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#4E9F6E] text-white text-[9px] font-extrabold shadow-sm">
                🎯 Match!
              </span>
            )}
          </div>
        </div>

        {/* Footer: Trader Mini-Profile + Trade / Vault / Delete Buttons */}
        <div className="pt-2 border-t-2 border-dashed border-[#EFE2C6] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onInspectProfile?.(item.owner_id)}
            className="flex items-center gap-2 text-left group/owner hover:opacity-85 transition-opacity min-w-0 flex-1"
          >
            <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#F5E9CE] border-2 border-[#D8C5A0] flex items-center justify-center text-lg shadow-sm group-hover/owner:scale-105 transition-transform">
              {item.owner_avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-extrabold text-[#4A3520] truncate max-w-[110px]">
                  {isOwnItem ? 'You' : item.owner_name}
                </span>
                <span className="px-1.5 py-0.2 bg-[#E9DEC7] text-[#6D5438] rounded-md text-[10px] font-extrabold whitespace-nowrap shrink-0">
                  Lv.{item.owner_level}
                </span>
                {isFriendItem && !isOwnItem && (
                  <span className="px-1.5 py-0.2 bg-[#EBF7EE] text-[#2F7A4C] border border-[#8BD1A0] rounded-md text-[9px] font-extrabold whitespace-nowrap shrink-0">
                    🤝 Friend
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#C88719] whitespace-nowrap">
                <Star className="w-3 h-3 shrink-0 fill-[#F6B93B] text-[#F6B93B]" />
                <span>{item.owner_karma.toFixed(2)} Karma</span>
              </div>
            </div>
          </button>

          {isOwnItem ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleForTrade?.(item.id)}
                className={`px-2.5 py-2 rounded-2xl text-[11px] font-extrabold whitespace-nowrap transition-all active:translate-y-0.5 ${
                  item.is_for_trade
                    ? 'bg-[#EBF7EE] text-[#2F7A4C] border-2 border-[#8BD1A0]'
                    : 'bg-[#F3E9D7] text-[#8C755B] border-2 border-[#D8C5A0]'
                }`}
              >
                {item.is_for_trade ? '🟢 Trade' : '🔒 Vault'}
              </button>
              {onEditItem && (
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  title="Edit item details & photos"
                  className="p-2 rounded-2xl bg-[#FFF6E0] hover:bg-[#F6B93B] text-[#8C5800] border border-[#EED9B3] transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDeleteItem && (
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="Remove item from Pocket"
                  className="p-2 rounded-2xl bg-[#FFF0EC] hover:bg-[#FF7E67] text-[#C84B31] hover:text-white border border-[#FF7E67]/30 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onProposeTrade(item)}
              className="shrink-0 whitespace-nowrap px-3.5 py-2 rounded-2xl bg-[#4E9F6E] hover:bg-[#438D60] text-white font-game text-xs font-bold shadow-cozy-green active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span>Offer Trade</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
