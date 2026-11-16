import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Copy, Share2, Sparkles, MapPin } from 'lucide-react';
import { UserProfile } from '../../types/game';

interface PrintableFlyerModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onCopyReferralLink: () => void;
}

export const PrintableFlyerModal: React.FC<PrintableFlyerModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onCopyReferralLink,
}) => {
  if (!isOpen) return null;

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://pocket-swap.onrender.com';
  const referralUrl = `${origin}/?ref=${encodeURIComponent(
    currentUser.username
  )}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=4A3520&bgcolor=FFFDF7&data=${encodeURIComponent(
    referralUrl
  )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col"
        >
          {/* Top Bar (Hidden when printing) */}
          <div className="px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xl">🖨️</span>
              <div>
                <h3 className="font-game text-base font-bold text-[#4A3520]">
                  Neighborhood Cafe & Campus QR Poster
                </h3>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Print or share this poster to seed 20+ local traders in{' '}
                  {currentUser.location_name}!
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

          {/* Printable Flyer Card */}
          <div className="p-5 space-y-4">
            <div
              id="printable-flyer-area"
              className="p-6 rounded-3xl bg-[#FFFDF7] border-4 border-[#4E9F6E] shadow-md text-center space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7EE] border border-[#8BD1A0] text-[#2F7A4C] text-xs font-extrabold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentUser.location_name} Local Swap Club</span>
              </div>

              <h2 className="font-game text-2xl sm:text-3xl font-bold text-[#4A3520] leading-tight">
                🌿 Got Retro Games, Books, Plants or Gadgets Gathering Dust?
              </h2>

              <p className="text-xs sm:text-sm font-bold text-[#6E5031] max-w-md mx-auto">
                Join our neighborhood on <strong>PocketSwap</strong> — the cozy
                local item trade-off game! Pack up to <strong>20 items</strong>{' '}
                in your Pocket Inventory and swap locally with{' '}
                <strong>0% cash and zero fees</strong>.
              </p>

              {/* QR Code Box */}
              <div className="my-2 inline-flex flex-col items-center p-4 rounded-3xl bg-[#FFF9EB] border-3 border-[#D8C5A0] shadow-sm">
                <img
                  src={qrImageUrl}
                  alt="PocketSwap QR Code"
                  className="w-44 h-44 rounded-xl"
                />
                <span className="mt-2 font-game text-xs font-bold text-[#4E9F6E]">
                  📱 Scan Camera to Browse Local Items (+50 Bonus XP!)
                </span>
                <span className="text-[10px] font-extrabold text-[#8C6D46] mt-0.5">
                  Invited by {currentUser.avatar_emoji}{' '}
                  {currentUser.display_name} (@{currentUser.username})
                </span>
              </div>

              {/* 12 Categories Strip */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[11px] font-extrabold text-[#5C4328]">
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🎮 Gaming
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  📱 Gadgets
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  📚 Books & Art
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🪴 Plants & Home
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🃏 Collectibles
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🎲 Board Games
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🎸 Music & Vinyl
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#F5E9CE]">
                  🧶 Crafts & DIY
                </span>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#D8C5A0] flex items-center justify-between text-[11px] font-extrabold text-[#7C6246]">
                <span>🛡️ 100% Free • 0% Cash Barter</span>
                <span>☕ Daytime Safe-Zone Meetups</span>
                <span>🌐 pocket-swap.onrender.com</span>
              </div>
            </div>

            {/* Action Buttons (Hidden when printing) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-4 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF Poster</span>
              </button>

              <button
                type="button"
                onClick={onCopyReferralLink}
                className="py-3 px-4 rounded-2xl bg-[#5C4328] hover:bg-[#4A3520] text-white font-game text-xs font-bold flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy My +50 XP Invite Link</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
