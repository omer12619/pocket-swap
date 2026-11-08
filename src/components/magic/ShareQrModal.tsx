import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { TradeItem, UserProfile } from '../../types/game';

interface ShareQrModalProps {
  isOpen: boolean;
  shareItem?: TradeItem | null;
  shareProfile?: UserProfile | null;
  onClose: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  shareItem,
  shareProfile,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!shareItem && !shareProfile)) return null;

  const baseOrigin =
    typeof window !== 'undefined' &&
    !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://pocket-swap.onrender.com';

  const shareUrl = shareItem
    ? `${baseOrigin}/?item=${encodeURIComponent(shareItem.id)}`
    : `${baseOrigin}/?trader=${encodeURIComponent(shareProfile!.id)}`;

  const shareTitle = shareItem
    ? `Swap "${shareItem.title}" (${shareItem.year_made}) on PocketSwap!`
    : `Trade with ${shareProfile!.display_name} (@${shareProfile!.username}) on PocketSwap!`;

  const shareText = shareItem
    ? `🌿 Check out "${shareItem.title}" (${shareItem.condition}, ${shareItem.year_made}) up for local swap on PocketSwap! Wants: ${shareItem.wishlist_hint}`
    : `🌿 Add ${shareProfile!.display_name} (${shareProfile!.avatar_emoji} ⭐${shareProfile!.karma_score.toFixed(2)} Karma) as a Trade Buddy on PocketSwap!`;

  // Crisp QR code SVG via public API with cozy fallback
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=4A3520&bgcolor=FFF9EB&margin=8&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n👉 ${shareUrl}`
  )}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          className="w-full max-w-sm rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#4E9F6E] to-[#3B8458] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#F6B93B]" />
              <div>
                <h3 className="font-game text-base font-bold leading-tight">
                  {shareItem ? 'Share Item & Swap Link' : 'Share Trader Passport'}
                </h3>
                <p className="text-[11px] text-white/90 font-semibold">
                  Scan QR in person or send direct link to friends
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-center">
            {/* Preview Card */}
            <div className="p-3 rounded-2xl bg-[#F5E9CE]/80 border-2 border-[#D8C5A0] flex items-center gap-3 text-left">
              {shareItem ? (
                <img
                  src={
                    shareItem.media_type === 'video'
                      ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                      : shareItem.media_url
                  }
                  alt={shareItem.title}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#FFF9EB] border-2 border-[#4E9F6E] flex items-center justify-center text-3xl shrink-0">
                  {shareProfile?.avatar_emoji}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase text-[#2F7A4C] block">
                  {shareItem
                    ? `${shareItem.rarity} • ${shareItem.year_made}`
                    : shareProfile?.title_badge}
                </span>
                <h4 className="font-game text-sm font-bold text-[#4A3520] truncate">
                  {shareItem ? shareItem.title : shareProfile?.display_name}
                </h4>
                <p className="text-[11px] font-bold text-[#7C6246] truncate">
                  {shareItem
                    ? `By ${shareItem.owner_name} • 📍 ${shareItem.location_name}`
                    : `@${shareProfile?.username} • ⭐ ${shareProfile?.karma_score.toFixed(2)} Karma`}
                </p>
              </div>
            </div>

            {/* Scannable QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-3xl bg-white border-3 border-[#D8C5A0] shadow-cozy inline-block">
                <img
                  src={qrImageUrl}
                  alt="PocketSwap QR Code"
                  className="w-44 h-44 rounded-xl"
                />
              </div>
              <span className="text-[11px] font-extrabold text-[#7C6246] mt-2">
                📱 Point any phone camera here to open immediately
              </span>
            </div>

            {/* Direct Link Box */}
            <div className="flex items-center gap-1.5 bg-white border-2 border-[#D8C5A0] rounded-2xl p-1.5 pl-3">
              <span className="text-[11px] font-bold text-[#5C4328] truncate flex-1 text-left">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white text-xs font-extrabold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Share Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-game text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-2xl bg-[#F6B93B] hover:bg-[#E7A92B] text-[#4A3520] font-game text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Sheet</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
