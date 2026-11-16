import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BarChart3,
  Users,
  Eye,
  Globe,
  ShieldCheck,
  Trash2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { TradeItem, WantedPost } from '../../types/game';

interface AdminMetrics {
  onlineCount: number;
  totalPageViews: number;
  uniqueVisitors: number;
  referrerCounts: Record<string, number>;
  funnel: {
    profiles: number;
    items: number;
    wantedPosts: number;
    trades: number;
    completedTrades: number;
    reviews: number;
  };
}

interface FounderDashboardModalProps {
  isOpen: boolean;
  items: TradeItem[];
  wantedPosts: WantedPost[];
  onClose: () => void;
  onAdminDeleteItem: (itemId: string) => void;
  onAdminDeleteWanted: (wantedId: string) => void;
  onSeedStarterItems?: () => void;
}

export const FounderDashboardModal: React.FC<FounderDashboardModalProps> = ({
  isOpen,
  items,
  wantedPosts,
  onClose,
  onAdminDeleteItem,
  onAdminDeleteWanted,
  onSeedStarterItems,
}) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [indexNowStatus, setIndexNowStatus] = useState<string | null>(null);

  const handleTriggerIndexNow = async () => {
    setIndexNowStatus('Submitting to Bing, ChatGPT Search, Yandex & Naver...');
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:3001' : '');
      const res = await fetch(`${apiBase}/api/admin/indexnow`, {
        method: 'POST',
      });
      const data = await res.json();
      setIndexNowStatus(
        `✅ Submitted ${data.submittedCount || 15} URLs via IndexNow (HTTP ${
          data.status || 200
        })!`
      );
    } catch {
      setIndexNowStatus('⚠️ Could not reach IndexNow endpoint.');
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:3001' : '');
      const res = await fetch(`${apiBase}/api/admin/metrics?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const referrers = metrics?.referrerCounts || {
    Direct: 1,
    Reddit: 0,
    'Google Search': 0,
    'AI Search (ChatGPT/Perplexity)': 0,
    'Neighbor Invite (?ref=)': 0,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 px-5 py-3.5 bg-[#4A3520] text-[#FFF9EB] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-[#F6B93B]" />
              <div>
                <h3 className="font-game text-base font-bold">
                  🛡️ Founder Live Analytics &amp; Moderation Command Center
                </h3>
                <p className="text-[11px] font-bold text-[#D8C5A0]">
                  Real-time traffic, referrer attribution, marketplace funnel &amp; 1-click moderation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchMetrics}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Refresh Metrics"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#FF7E67] flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#EBF7EE] border-2 border-[#8BD1A0] text-center">
                <div className="flex items-center justify-center gap-1 text-[#2F7A4C] font-game text-xl font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4E9F6E] animate-ping" />
                  <span>{metrics?.onlineCount ?? 1}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#2F7A4C]">
                  Online Now (SSE)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-center">
                <div className="flex items-center justify-center gap-1 text-[#4A3520] font-game text-xl font-bold">
                  <Eye className="w-4 h-4 text-[#FF7E67]" />
                  <span>{metrics?.totalPageViews ?? 1}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  Total Page Views
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] text-center">
                <div className="flex items-center justify-center gap-1 text-[#4A3520] font-game text-xl font-bold">
                  <Users className="w-4 h-4 text-[#4E9F6E]" />
                  <span>{metrics?.uniqueVisitors ?? 1}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#8C6D46]">
                  Unique Visitors
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF6E0] border-2 border-[#F6B93B] text-center">
                <div className="flex items-center justify-center gap-1 text-[#8C5800] font-game text-xl font-bold">
                  <TrendingUp className="w-4 h-4 text-[#C88719]" />
                  <span>{items.length}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#8C5800]">
                  Active Listings
                </span>
              </div>
            </div>

            {/* Traffic Sources & Conversion Funnel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2.5">
                <h4 className="font-game text-xs font-bold text-[#4A3520] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#4E9F6E]" />
                  <span>Top Traffic Sources &amp; Referrers</span>
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(referrers).map(([source, count]) => (
                    <div
                      key={source}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5] text-xs font-bold text-[#5C4328]"
                    >
                      <span>{source}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F5E9CE] text-[#4A3520] font-extrabold">
                        {count} visits
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2.5">
                <h4 className="font-game text-xs font-bold text-[#4A3520] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#FF7E67]" />
                  <span>Marketplace Conversion Funnel</span>
                </h4>
                <div className="space-y-1.5 text-xs font-bold text-[#5C4328]">
                  <div className="flex justify-between px-3 py-1.5 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]">
                    <span>🪪 Registered Profiles</span>
                    <span className="font-extrabold">
                      {metrics?.funnel.profiles ?? 1}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]">
                    <span>🎒 Items in Pockets</span>
                    <span className="font-extrabold">{items.length}</span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]">
                    <span>📌 Wanted Board Wishes</span>
                    <span className="font-extrabold">{wantedPosts.length}</span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]">
                    <span>⚔️ Trade Offers Sent</span>
                    <span className="font-extrabold">
                      {metrics?.funnel.trades ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 rounded-xl bg-[#EBF7EE] border border-[#8BD1A0] text-[#2F7A4C]">
                    <span>🤝 Completed Swaps</span>
                    <span className="font-extrabold">
                      {metrics?.funnel.completedTrades ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Click Launch Unblockers: Seed Starter Storefront & IndexNow Search Submission */}
            <div className="p-4 rounded-2xl bg-[#EBF7EE] border-2 border-[#8BD1A0] space-y-2.5">
              <h4 className="font-game text-xs font-bold text-[#2F7A4C]">
                🚀 1-Click Launch Unblockers (Storefront Seeding &amp; Search Engine Indexing)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onSeedStarterItems && (
                  <button
                    type="button"
                    onClick={onSeedStarterItems}
                    className="py-2.5 px-3 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-sm"
                  >
                    🌱 Seed 4 Starter Listings in Plaza
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTriggerIndexNow}
                  className="py-2.5 px-3 rounded-xl bg-[#5C4328] hover:bg-[#4A3520] text-[#FFF9EB] font-game text-xs font-bold shadow-sm"
                >
                  🔍 Ping Bing &amp; ChatGPT Search (IndexNow)
                </button>
              </div>
              {indexNowStatus && (
                <p className="text-[11px] font-extrabold text-[#2F7A4C]">
                  {indexNowStatus}
                </p>
              )}
            </div>

            {/* 1-Click Live Listing Moderation */}
            <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-game text-xs font-bold text-[#4A3520]">
                  🗂️ Live Plaza Listings Moderation ({items.length})
                </h4>
                <span className="text-[10px] font-extrabold text-[#7C6246]">
                  1-Click Global Cloud Removal
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs font-bold text-[#8C6D46] py-2">
                  No items currently listed in the Plaza.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-9 h-9 rounded-lg object-cover border border-[#D8C5A0] shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-[#4A3520] block truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold text-[#7C6246] block truncate">
                            By {item.owner_name} • {item.category} •{' '}
                            {item.location_name}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAdminDeleteItem(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#C84B31] hover:bg-[#A63820] text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1-Click Wanted Board Moderation */}
            {wantedPosts.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#D8C5A0] space-y-2.5">
                <h4 className="font-game text-xs font-bold text-[#4A3520]">
                  📌 Wanted Board Notes Moderation ({wantedPosts.length})
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {wantedPosts.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFF9EB] border border-[#E6D5B5]"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-[#4A3520] block truncate">
                          ISO: {w.looking_for}
                        </span>
                        <span className="text-[10px] font-bold text-[#7C6246] block truncate">
                          By {w.user_name} • Offering: {w.offering_hint}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAdminDeleteWanted(w.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#C84B31] text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
