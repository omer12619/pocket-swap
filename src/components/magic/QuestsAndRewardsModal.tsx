import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  Gift,
  Sparkles,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import { UserProfile } from '../../types/game';

export interface CozyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  current: number;
  target: number;
  xpReward: number;
  karmaBonus: number;
  badgeReward?: string;
  claimed: boolean;
}

interface QuestsAndRewardsModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  quests: CozyQuest[];
  onClose: () => void;
  onClaimQuest: (questId: string) => void;
}

export const QuestsAndRewardsModal: React.FC<QuestsAndRewardsModalProps> = ({
  isOpen,
  currentUser,
  quests,
  onClose,
  onClaimQuest,
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const inviteCode = `COZY-${currentUser.username.toUpperCase().slice(0, 6)}-77`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(
      `Join me on PocketSwap! Use my Villager Code ${inviteCode} to trade items locally 🦊🌿`
    );
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2400);
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
          <div className="bg-[#F5E9CE] border-b-2 border-[#D8C5A0] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <h2 className="font-game text-lg font-bold text-[#4A3520]">
                  Village Quests & Rewards
                </h2>
                <p className="text-[11px] font-bold text-[#7C6246]">
                  Complete cozy trading milestones to level up & unlock badges!
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

          <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
            {/* Player Streak & Level Progress Card */}
            <div className="rounded-3xl bg-gradient-to-r from-[#F6B93B] to-[#E59819] p-4 text-[#4A3520] shadow-cozy-gold flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-extrabold uppercase">
                  <Flame className="w-3 h-3 fill-[#C84B31] text-[#C84B31]" />3 Day
                  Trader Streak
                </span>
                <h3 className="font-game text-lg font-bold mt-0.5">
                  Level {currentUser.level} • {currentUser.xp}/200 XP
                </h3>
                <p className="text-xs font-bold opacity-90">
                  {quests.filter((q) => q.claimed).length} of {quests.length} Season
                  Quests Claimed
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF9EB] border-2 border-[#4A3520]/20 flex items-center justify-center text-2xl shadow">
                🎁
              </div>
            </div>

            {/* Quests List */}
            <div className="space-y-2.5">
              {quests.map((q) => {
                const isComplete = q.current >= q.target;
                const progressPct = Math.min(
                  100,
                  Math.round((q.current / q.target) * 100)
                );

                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-3xl border-2 transition-all space-y-2 ${
                      q.claimed
                        ? 'bg-[#F5E9CE]/50 border-[#D8C5A0] opacity-75'
                        : isComplete
                        ? 'bg-[#EBF7EE] border-[#4E9F6E] shadow-sm'
                        : 'bg-[#FFFDF7] border-[#D8C5A0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-xl shrink-0">
                          {q.icon}
                        </div>
                        <div>
                          <h4 className="font-game text-sm font-bold text-[#4A3520]">
                            {q.title}
                          </h4>
                          <p className="text-xs font-bold text-[#7C6246]">
                            {q.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FFF6E0] border border-[#EED9B3] text-[10px] font-extrabold text-[#B57C1E] block">
                          +{q.xpReward} XP
                        </span>
                        {q.karmaBonus > 0 && (
                          <span className="text-[10px] font-extrabold text-[#4E9F6E] block mt-0.5">
                            +{q.karmaBonus} KP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Claim Button */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex-1">
                        <div className="w-full h-2.5 rounded-full bg-[#E8D8B9] overflow-hidden">
                          <div
                            className="h-full bg-[#4E9F6E] rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#7C6246] mt-0.5 block">
                          Progress: {Math.min(q.current, q.target)} / {q.target}
                        </span>
                      </div>

                      {q.claimed ? (
                        <span className="px-3 py-1.5 rounded-xl bg-[#D8C5A0]/50 text-[#6E5031] text-xs font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claimed</span>
                        </span>
                      ) : isComplete ? (
                        <button
                          type="button"
                          onClick={() => onClaimQuest(q.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green animate-bounce flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim +{q.xpReward} XP</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] text-[#8C6D46] text-[11px] font-extrabold">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Viral Invite a Trade Buddy Pass */}
            <div className="p-4 rounded-3xl bg-[#FFFDF7] border-2 border-dashed border-[#4E9F6E] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#2F7A4C] flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite Real Friends (+100 XP Bonus)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#2F7A4C] text-[10px] font-extrabold">
                  Founder Pass
                </span>
              </div>
              <p className="text-xs font-bold text-[#7C6246]">
                Share your Villager Pass code with friends in your neighborhood to trade items together!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 rounded-xl bg-[#F5E9CE] font-mono text-xs font-extrabold text-[#4A3520] tracking-wider text-center">
                  {inviteCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="px-3.5 py-2 rounded-xl bg-[#4E9F6E] text-white font-game text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Invite</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
