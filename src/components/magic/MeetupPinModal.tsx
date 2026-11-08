import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import { TradeItem, TradeOffer } from '../../types/game';

interface MeetupPinModalProps {
  trade: TradeOffer | null;
  requestedItem?: TradeItem;
  offeredItems: TradeItem[];
  onClose: () => void;
  onConfirmComplete: (tradeId: string) => void;
}

const SAFE_SPOTS = [
  '☕ Sunny Leaf Cafe (Verified Safe Spot)',
  '📚 Acorn Public Library Lobby',
  '🛡️ Harbor Safe-Swap Community Desk',
  '🌳 Central Town Plaza Kiosk',
];

export const MeetupPinModal: React.FC<MeetupPinModalProps> = ({
  trade,
  requestedItem,
  offeredItems,
  onClose,
  onConfirmComplete,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [selectedSpot, setSelectedSpot] = useState(SAFE_SPOTS[0]);
  const [checkedPublicSpot, setCheckedPublicSpot] = useState(true);
  const [checkedCondition, setCheckedCondition] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!trade) return null;

  // Deterministic 4-digit meetup PIN derived from trade ID
  const expectedPin = String(
    1000 +
      (trade.id
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
        9000)
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() !== expectedPin) {
      setError(`Incorrect PIN! Tap "Auto-Fill Partner PIN (${expectedPin})" to test.`);
      return;
    }
    if (!checkedPublicSpot || !checkedCondition) {
      setError('Please check both safety & item inspection boxes first.');
      return;
    }
    setError(null);
    onConfirmComplete(trade.id);
    setPinInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden"
        >
          <div className="px-5 py-3.5 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4E9F6E]" />
              <div>
                <h3 className="font-game text-base font-bold text-[#4A3520]">
                  Safe Meetup Handshake
                </h3>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Verify in-person inspection & 4-digit swap PIN
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

          <form onSubmit={handleVerify} className="p-5 space-y-4">
            {/* Summary of Items Being Swapped */}
            <div className="p-3 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-xs font-bold text-[#4A3520] space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-[#4E9F6E]">
                🔄 Atomic Ownership Transfer Preview
              </div>
              <p>
                <strong>{offeredItems.map((i) => i.title).join(' + ')}</strong> ⇄{' '}
                <strong>{requestedItem?.title || 'Partner Item'}</strong>
              </p>
            </div>

            {/* Verified Safe Public Meetup Spot Picker */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                📍 Verified Public Safe-Swap Zone
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SAFE_SPOTS.map((spot) => (
                  <button
                    key={spot}
                    type="button"
                    onClick={() => setSelectedSpot(spot)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border text-left truncate transition-all ${
                      selectedSpot === spot
                        ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                        : 'bg-white text-[#5C4328] border-[#D8C5A0]'
                    }`}
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Person Safety & Provenance Checklist */}
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#EBF7EE] border border-[#8BD1A0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedPublicSpot}
                  onChange={(e) => setCheckedPublicSpot(e.target.checked)}
                  className="mt-0.5 accent-[#4E9F6E] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#2F7A4C]">
                  📍 We met at a safe public spot (~{trade.meetup_distance_km} km)
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#FFF6E0] border border-[#EED9B3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedCondition}
                  onChange={(e) => setCheckedCondition(e.target.checked)}
                  className="mt-0.5 accent-[#4E9F6E] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#7A592E]">
                  🔎 I inspected the item's Year ({requestedItem?.year_made || 2023}),
                  Condition ({requestedItem?.condition || 'Mint ✨'}), & Accessories
                </span>
              </label>
            </div>

            {/* 4-Digit Meetup PIN Handshake */}
            <div className="p-3.5 rounded-2xl bg-[#F5E9CE] border-2 border-[#D8C5A0] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-[#5C4328] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#4E9F6E]" />
                  <span>Enter Partner's 4-Digit Meetup PIN</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPinInput(expectedPin);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#4E9F6E] text-white text-[10px] font-extrabold shadow-sm"
                >
                  ⚡ Auto-Fill Demo PIN ({expectedPin})
                </button>
              </div>

              <input
                type="text"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={`Enter ${expectedPin}`}
                className="w-full text-center tracking-[0.5em] font-game text-xl font-bold py-2.5 rounded-2xl bg-white border-2 border-[#D8C5A0] text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            {error && (
              <p className="text-xs font-extrabold text-[#C84B31] text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#F6B93B] hover:bg-[#E7A92B] text-[#4A3520] font-game text-sm font-bold shadow-cozy-gold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Verify PIN & Complete Swap (+100 XP)</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
