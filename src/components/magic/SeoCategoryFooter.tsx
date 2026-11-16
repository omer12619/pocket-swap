import React, { useState } from 'react';
import { ChevronDown, Printer, Share2, Globe, Sparkles } from 'lucide-react';
import {
  CATEGORY_ICONS,
  ITEM_CATEGORIES,
  ItemCategory,
  UserProfile,
} from '../../types/game';

interface SeoCategoryFooterProps {
  currentUser: UserProfile;
  selectedCategory: ItemCategory;
  onSelectCategory: (cat: ItemCategory) => void;
  onOpenFlyerModal: () => void;
  onCopyReferralLink: () => void;
}

const CATEGORY_SEO_DESCRIPTIONS: Record<Exclude<ItemCategory, 'All'>, string> = {
  Gaming:
    'Swap retro consoles, GameBoy cartridges, Nintendo Switch games, PS5 titles & controllers locally.',
  Gadgets:
    'Trade mechanical keyboards, film cameras, Polaroids, headphones & desk accessories with zero cash.',
  Collectibles:
    'Exchange Pokémon cards, anime figures, vintage pins, coins & limited-edition collectibles.',
  Fashion:
    'Barter vintage jackets, streetwear, sneakers, tote bags & accessories in your neighborhood.',
  'Books & Art':
    'Swap novels, sci-fi books, manga sets, indie zines, art prints & framed illustrations.',
  'Home & Cozy':
    'Trade houseplant cuttings, monstera props, cozy desk lamps, ceramics & home decor.',
  'Music & Audio':
    'Swap vinyl records, acoustic guitars, synth pedals, studio monitors & audio gear.',
  'Sports & Outdoors':
    'Trade bicycles, skateboards, camping gear, yoga mats & outdoor equipment locally.',
  'Toys & Board Games':
    'Swap tabletop RPGs, Catan, strategy board games, LEGO sets & puzzles.',
  'Crafts & DIY':
    'Exchange yarn, crochet kits, watercolor sets, sewing machines & 3D printing supplies.',
  'Baby & Kids':
    'Swap outgrown wooden toys, strollers, children’s books & family gear with local parents.',
  'Tools & Garden':
    'Trade hand tools, power drills, ceramic planters, seeds & gardening equipment.',
};

export const SeoCategoryFooter: React.FC<SeoCategoryFooterProps> = ({
  currentUser,
  selectedCategory,
  onSelectCategory,
  onOpenFlyerModal,
  onCopyReferralLink,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer className="mt-6 rounded-3xl bg-[#FFFDF7] border-2 border-[#D8C5A0] p-4 space-y-3 shadow-sm">
      {/* Top Referral & Local Poster Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-[#D8C5A0]">
        <div className="flex items-start gap-2.5">
          <span className="text-xl">🌱</span>
          <div>
            <h3 className="font-game text-xs sm:text-sm font-bold text-[#4A3520]">
              Grow the {currentUser.location_name} Swap Plaza (+50 XP per Neighbor!)
            </h3>
            <p className="text-[11px] font-bold text-[#7C6246]">
              Invite local friends with your referral link or print a QR poster for your favorite coffee shop or campus board.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCopyReferralLink}
            className="px-3 py-2 rounded-xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Invite Link (+50 XP)</span>
          </button>
          <button
            type="button"
            onClick={onOpenFlyerModal}
            className="px-3 py-2 rounded-xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#4A3520] border border-[#D8C5A0] font-game text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🖨️ Cafe QR Poster</span>
          </button>
        </div>
      </div>

      {/* Collapsible SEO Category Directory & AI Guide */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between text-left text-xs font-extrabold text-[#6E5031] hover:text-[#4A3520]"
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#4E9F6E]" />
            <span>
              Explore All 12 Local Barter Categories & How 0% Cash Swapping Works
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#E6D5B5] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ITEM_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#EBF7EE] border-[#4E9F6E]'
                        : 'bg-[#FFF9EB] border-[#E6D5B5] hover:bg-[#F5E9CE]'
                    }`}
                  >
                    <div className="font-game text-xs font-bold text-[#4A3520] flex items-center gap-1.5">
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span>Swap {cat} Locally</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#7C6246] mt-0.5 leading-snug">
                      {CATEGORY_SEO_DESCRIPTIONS[cat]}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-[#F5E9CE]/60 border border-[#D8C5A0] text-[11px] font-bold text-[#5C4328] space-y-1">
              <div className="font-game text-xs font-bold text-[#4A3520] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>About PocketSwap — The Cozy Local Barter Game</span>
              </div>
              <p>
                PocketSwap is a 100% free neighborhood item swap web app and Buy Nothing / Bunz alternative. Pack up to 20 items in your Pocket Inventory, discover nearby listings on the Cozy Island & OpenStreetMap GPS Radar, propose 1-for-1 or bundle trades in the Trade Arena, and complete safe daytime public meetups with a 4-digit handshake PIN.
              </p>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
