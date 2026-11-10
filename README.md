# 🌿 PocketSwap — Cozy Local Item Trade-Off Game (0% Cash, 20-Slot Pocket)

[![Live on Render](https://img.shields.io/badge/Live_App-pocket--swap.onrender.com-4E9F6E?style=for-the-badge&logo=render&logoColor=white)](https://pocket-swap.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React_18-Vite_6-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

> **Swap real-life treasures in your neighborhood like a Cozy RPG!**  
> Pack up to **20 items** in your **Pocket Inventory** across **12 categories**, scan nearby listings on the **Cozy Island Game Radar** or **Live OpenStreetMap Street Radar**, negotiate in the **Trade Arena**, and verify in-person swaps with a **4-Digit Meetup Handshake PIN & QR Code**—with **0% cash and zero fees**.

🌐 **Live Production App:** [https://pocket-swap.onrender.com](https://pocket-swap.onrender.com)

---

## ✨ Core Features

### 🎒 1. 20-Slot RPG Pocket Inventory & 12 Categories
- Each villager has a **20-slot Pocket Inventory** (`MAX_POCKET_ITEMS = 20`) to encourage curated, high-quality local items rather than endless clutter.
- Browse and filter across **12 curated categories** via a compact, searchable Category Popover Dropdown:
  - 🎮 **Gaming** • 📱 **Gadgets** • 🃏 **Collectibles** • 👟 **Fashion** • 📚 **Books & Art** • 🪴 **Home & Cozy** • 🎸 **Music & Audio** • 🚲 **Sports & Outdoors** • 🎲 **Toys & Board Games** • 🧶 **Crafts & DIY** • 🧸 **Baby & Kids** • 🛠️ **Tools & Garden**
- **Provenance & Condition Specs**: Every item tracks **Year Made**, **Brand/Maker**, **Condition Grade** (`Mint`, `Great`, `Good`, `Well-Loved`), **Rarity Tier** (`Common`, `Rare`, `Epic`, `Legendary`), **Included Accessories**, and a **Multi-Angle Photo Gallery** (auto-compressed client-side to WebP).

### 🗺️ 2. Dual Radar: Cozy Island Game Map + Real OpenStreetMap GPS Radar
- **Cozy Island Radar**: Animated SVG island map with neighborhood districts, animated water waves, sweeping radar beam, and interactive item pins.
- **Real Street Map Radar**: Powered by **Leaflet + OpenStreetMap** (100% free, no paid API keys required) with **Safe Public Meetup Zones** (verified local cafes, libraries, and community plazas).
- **Privacy-Safe City & GPS Pinning**: Search any city/neighborhood worldwide via OpenStreetMap Nominatim geocoding or lock your live browser GPS with automatic ~300m privacy fuzzing so exact home addresses are never exposed.

### ⚔️ 3. Trade Arena, Fairness Appraiser & Multi-Item Bundles
- Select **1 to 3 items** from your Pocket to propose a 1-for-1 or multi-item bundle swap.
- **Live Trade Scale & Appraiser**: Automatically compares item rarity, condition grade, and vintage age to rate the offer (`Fair Swap ⚖️`, `Generous Offer 🎁`, or `Needs Sweetener 🍬`).
- **Swipe Match Deck**: Tinder-style quick card deck for swiping through local items and saving favorites to your Wishlist.

### 💬 4. 1-on-1 Trade Chat, Counter-Offers & Safe Meetup Scheduler
- Built-in real-time **Trade Chat**, **1-Click Counter-Offer Builder** (swap out requested items right inside the chat), and **Safe Public Meetup Zone Scheduler**.
- **Public Item Q&A Wall**: Ask the owner public questions about condition or accessories directly on any listing card.

### 🤝 5. In-Person Meetup PIN & QR Handshake + Karma Passport
- When two traders meet at a safe public spot, they complete the swap using a **4-Digit Meetup PIN & Scannable QR Code** (`/api/trades/complete`), which atomically transfers item ownership between Pockets and awards **+100 XP**.
- **5-Star Karma Reviews & Vibe Badges**: Rate your trade partner after every swap (`Fast & Friendly ⚡`, `Item Exactly as Described 🎯`, `Generous Trader 🎁`) and climb the **Village Karma Leaderboard**.

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend PWA** | React 18, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti |
| **Maps & Geocoding** | Leaflet (`react-leaflet`), OpenStreetMap Tiles, OpenStreetMap Nominatim City Geocoding |
| **Backend API & SSR Meta** | Node.js HTTP Server (`server/index.mjs`) with dynamic OpenGraph/SEO meta injection & `/sitemap.xml` |
| **Cloud Database & Media** | Supabase PostgreSQL (`profiles`, `items`, `trade_offers`, `karma_reviews`) + Supabase Storage (`item-media`) |
| **Hosting & CI/CD** | Render Web Service (`render.yaml` Blueprint) |

---

## 🔌 Backend API Endpoints (`server/index.mjs`)

| Method & Route | Description |
| :--- | :--- |
| `GET /api/health` | Returns server status, Supabase connection health, and live table row counts |
| `GET /api/state` | Loads shared village state from Supabase Storage (`item-media/cloud-db/state.json`) |
| `POST /api/state` | Multi-user smart ID merge of `items`, `trades`, `profiles`, `reviews`, `wantedPosts`, and `deletedItemIds` |
| `POST /api/media/upload` | Uploads compressed WebP photos / MP4 videos to Supabase Storage (`item-media/uploads/`) |
| `POST /api/trades/complete` | Server-side atomic meetup swap completion, ownership transfer, and XP/Karma progression |
| `POST /api/reviews/submit` | Records a verified post-swap Karma review and recalculates trader Karma score |
| `POST /api/moderation/report` | Flags/reports inappropriate listings and supports Founder Admin moderation |
| `GET /sitemap.xml` | Dynamically generates an XML sitemap of all categories and active public listings for Google Search |

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/omer12619/pocket-swap.git
cd pocket-swap
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
PORT=3001
```

### 3. Run in Development or Production Mode
```bash
# Start Vite dev server
npm run dev

# Build production bundle & start full-stack Node.js server
npm run build
npm start
```

---

## 🛡️ License & Community Rules
PocketSwap is built around the **0% Cash Barter Rule**: no cash sales, no crypto, and all in-person swaps take place in daytime public Safe Zones (local coffee shops, libraries, community centers, or police station safe-exchange lobbies).
