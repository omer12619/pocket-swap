import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import {
  Navigation,
  Radio,
  ArrowLeftRight,
  Search,
  X,
  Info,
  Map as MapIcon,
  Compass,
  LocateFixed,
} from 'lucide-react';
import { ItemCategory, TradeItem, UserProfile } from '../../types/game';

interface RadarMapViewProps {
  currentUser: UserProfile;
  items: TradeItem[];
  friendIds?: string[];
  radiusKm: number;
  gpsStatus: 'idle' | 'locating' | 'locked' | 'simulated';
  onChangeRadius: (km: number) => void;
  onTriggerRealGps: () => void;
  onSimulateMove: (latDelta: number, lngDelta: number, placeName: string) => void;
  onSelectItemForTrade: (item: TradeItem) => void;
  onInspectItem?: (item: TradeItem) => void;
}

const CATEGORIES: ItemCategory[] = [
  'All',
  'Gaming',
  'Gadgets',
  'Collectibles',
  'Fashion',
  'Books & Art',
  'Home & Cozy',
];

type RadarQuickFilter = 'all' | 'friends' | 'high_rarity' | 'vintage';
type MapDisplayMode = 'street' | 'cozy';

const COZY_PLACES = [
  { name: 'Sunny Leaf District', lat: 32.0853, lng: 34.7818, icon: '🌳' },
  { name: 'Acorn Park Plaza', lat: 32.0892, lng: 34.7865, icon: '🐿️' },
  { name: 'Berry Creek Cafe', lat: 32.0795, lng: 34.7772, icon: '☕' },
  { name: 'Harbor Boardwalk', lat: 32.0945, lng: 34.7912, icon: '⚓' },
];

export const RadarMapView: React.FC<RadarMapViewProps> = ({
  currentUser,
  items,
  friendIds = [],
  radiusKm,
  gpsStatus,
  onChangeRadius,
  onTriggerRealGps,
  onSimulateMove,
  onSelectItemForTrade,
  onInspectItem,
}) => {
  const [radarSearch, setRadarSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('All');
  const [quickFilter, setQuickFilter] = useState<RadarQuickFilter>('all');
  const [mapMode, setMapMode] = useState<MapDisplayMode>('street');

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Filter nearby items by radius + search query + category + quick filter
  const nearbyFilteredItems = useMemo(() => {
    const q = radarSearch.trim().toLowerCase();
    return items
      .filter(
        (i) =>
          i.owner_id !== currentUser.id &&
          i.is_for_trade &&
          (i.distance_km === undefined || i.distance_km <= radiusKm)
      )
      .filter((i) =>
        selectedCategory === 'All' ? true : i.category === selectedCategory
      )
      .filter((i) => {
        if (quickFilter === 'friends') return friendIds.includes(i.owner_id);
        if (quickFilter === 'high_rarity')
          return i.rarity === 'Legendary' || i.rarity === 'Epic';
        if (quickFilter === 'vintage') return (i.year_made || 2023) < 2015;
        return true;
      })
      .filter((i) =>
        q === ''
          ? true
          : i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.wishlist_hint.toLowerCase().includes(q) ||
            (i.brand && i.brand.toLowerCase().includes(q)) ||
            String(i.year_made).includes(q) ||
            i.owner_name.toLowerCase().includes(q)
      )
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  }, [
    items,
    currentUser.id,
    radiusKm,
    selectedCategory,
    quickFilter,
    friendIds,
    radarSearch,
  ]);

  const [selectedPinItem, setSelectedPinItem] = useState<TradeItem | null>(
    nearbyFilteredItems[0] || null
  );

  // Keep selectedPinItem in sync when filters or search change
  useEffect(() => {
    if (
      !selectedPinItem ||
      !nearbyFilteredItems.some((i) => i.id === selectedPinItem.id)
    ) {
      setSelectedPinItem(nearbyFilteredItems[0] || null);
    }
  }, [nearbyFilteredItems, selectedPinItem]);

  // Initialize Real Leaflet Street Map when in 'street' mode
  useEffect(() => {
    if (mapMode !== 'street' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentUser.latitude, currentUser.longitude],
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      // 100% Free OpenStreetMap Tiles (No API key or paid Carto/Mapbox account required!)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (100% Free)',
        maxZoom: 19,
      }).addTo(map);

      const radiusCircle = L.circle(
        [currentUser.latitude, currentUser.longitude],
        {
          radius: radiusKm * 1000,
          color: '#4E9F6E',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#4E9F6E',
          fillOpacity: 0.1,
        }
      ).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);

      leafletMapRef.current = map;
      radiusCircleRef.current = radiusCircle;
      markersLayerRef.current = markersLayer;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
        radiusCircleRef.current = null;
      }
    };
  }, [mapMode]);

  // Sync user GPS coordinates & radius circle on the Real Map
  useEffect(() => {
    const map = leafletMapRef.current;
    const circle = radiusCircleRef.current;
    if (!map || !circle || mapMode !== 'street') return;

    circle.setLatLng([currentUser.latitude, currentUser.longitude]);
    circle.setRadius(radiusKm * 1000);
    map.flyTo([currentUser.latitude, currentUser.longitude], map.getZoom(), {
      duration: 0.65,
    });
  }, [currentUser.latitude, currentUser.longitude, radiusKm, mapMode]);

  // Render Player Marker + Filtered Item Photo Pins on the Real Street Map
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer || mapMode !== 'street') return;

    markersLayer.clearLayers();

    // 1. Current Player Marker ("YOU")
    const userIcon = L.divIcon({
      className: 'pocketswap-leaflet-icon',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
          <div style="background:#4A3520;color:#FFF9EB;font-weight:800;font-size:10px;padding:2px 7px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);margin-bottom:3px;border:1.5px solid #F6B93B;">
            YOU (${currentUser.display_name})
          </div>
          <div style="width:44px;height:44px;border-radius:16px;background:#FFF9EB;border:3px solid #4E9F6E;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 12px rgba(0,0,0,0.25);">
            ${currentUser.avatar_emoji}
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    L.marker([currentUser.latitude, currentUser.longitude], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(markersLayer);

    // 2. Nearby Filtered Item Markers
    nearbyFilteredItems.forEach((item) => {
      const isSelected = selectedPinItem?.id === item.id;
      const isFriend = friendIds.includes(item.owner_id);
      const thumbUrl =
        item.media_type === 'video'
          ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
          : item.media_url;

      const badgeBg = isSelected
        ? '#FF7E67'
        : isFriend
        ? '#EBF7EE'
        : '#FFF9EB';
      const badgeColor = isSelected
        ? '#FFFFFF'
        : isFriend
        ? '#2F7A4C'
        : '#4A3520';
      const borderCol = isSelected
        ? '#FF7E67'
        : isFriend
        ? '#4E9F6E'
        : '#FFFFFF';

      const itemIcon = L.divIcon({
        className: 'pocketswap-leaflet-icon',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
            <div style="background:${badgeBg};color:${badgeColor};font-weight:800;font-size:10px;padding:2px 7px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);margin-bottom:3px;border:1.5px solid ${
          isFriend ? '#4E9F6E' : '#D8C5A0'
        };">
              ${item.owner_avatar} ${(item.distance_km ?? 0.6).toFixed(1)}km
            </div>
            <div style="width:${isSelected ? '48px' : '42px'};height:${
          isSelected ? '48px' : '42px'
        };border-radius:14px;overflow:hidden;border:3px solid ${borderCol};box-shadow:0 4px 12px rgba(0,0,0,0.28);background:#FFF9EB;transition:all 0.2s;">
              <img src="${thumbUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([item.latitude, item.longitude], {
        icon: itemIcon,
        zIndexOffset: isSelected ? 900 : 500,
      });

      marker.on('click', () => {
        setSelectedPinItem(item);
        map.panTo([item.latitude, item.longitude], { animate: true });
      });

      marker.addTo(markersLayer);
    });
  }, [
    nearbyFilteredItems,
    selectedPinItem,
    friendIds,
    currentUser.latitude,
    currentUser.longitude,
    currentUser.display_name,
    currentUser.avatar_emoji,
    mapMode,
  ]);

  const handleRecenterMap = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(
        [currentUser.latitude, currentUser.longitude],
        14,
        { duration: 0.6 }
      );
    }
  };

  const hasActiveFilters =
    radarSearch.trim() !== '' ||
    selectedCategory !== 'All' ||
    quickFilter !== 'all';

  return (
    <div className="space-y-3.5">
      {/* Top GPS Status, Search & Filter Panel */}
      <div className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-3.5 shadow-cozy space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF7EE] border-2 border-[#8BD1A0] flex items-center justify-center text-[#2F7A4C] shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-game text-sm sm:text-base font-bold text-[#4A3520]">
                  Live Trade Radar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#EBF7EE] text-[#2F7A4C] border border-[#8BD1A0]">
                  {gpsStatus === 'locked'
                    ? '🛰️ Real GPS'
                    : gpsStatus === 'locating'
                    ? '📡 Scanning...'
                    : '🧭 Town GPS'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#7C6246] truncate">
                📍 {currentUser.location_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTriggerRealGps}
            className="shrink-0 px-3 py-2 rounded-2xl bg-[#4E9F6E] hover:bg-[#3E885B] text-white font-game text-xs font-bold shadow-cozy-green active:translate-y-0.5 flex items-center gap-1"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>My GPS</span>
          </button>
        </div>

        {/* Map View Switcher: Real Street Map vs Cozy Game Radar */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0]">
          <button
            type="button"
            onClick={() => setMapMode('street')}
            className={`py-1.5 px-2.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mapMode === 'street'
                ? 'bg-[#4E9F6E] text-white shadow-sm'
                : 'text-[#5C4328] hover:bg-[#FFF9EB]/60'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>🗺️ Real Street Map</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('cozy')}
            className={`py-1.5 px-2.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mapMode === 'cozy'
                ? 'bg-[#4E9F6E] text-white shadow-sm'
                : 'text-[#5C4328] hover:bg-[#FFF9EB]/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🎨 Cozy Game Radar</span>
          </button>
        </div>

        {/* Radar Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C6D46] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={radarSearch}
            onChange={(e) => setRadarSearch(e.target.value)}
            placeholder="Search radar pins (Camera, Nintendo, 1998, Milo)..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#FFF9EB] border-2 border-[#D8C5A0] text-xs font-bold text-[#4A3520] placeholder-[#A68E6E] focus:outline-none focus:border-[#4E9F6E]"
          />
          {radarSearch && (
            <button
              type="button"
              onClick={() => setRadarSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E8D8B9] text-[#5C4328] flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Filter Pills (Wrapped so all options are visible without clipping) */}
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] px-0.5">
            ⚡ Filter Pins
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: '🗺️ All Pins' },
                { id: 'friends', label: '🤝 Friends Only' },
                { id: 'high_rarity', label: '👑 Epic & Legendary' },
                { id: 'vintage', label: '📅 Vintage (<2015)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                  quickFilter === f.id
                    ? 'bg-[#4E9F6E] text-white border-[#367A51] shadow-sm'
                    : 'bg-[#FFF9EB] text-[#6E5031] border-[#D8C5A0] hover:bg-[#F5E9CE]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills on Radar (Wrapped so all 7 categories are visible) */}
        <div className="space-y-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D46] px-0.5">
            🏷️ Category
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl font-game text-[11px] font-bold border transition-all ${
                    active
                      ? 'bg-[#5C4328] text-[#FFF9EB] border-[#4A3520] shadow-sm'
                      : 'bg-white text-[#6E5031] border-[#D8C5A0] hover:bg-[#F5E9CE]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance Radius Slider */}
        <div className="pt-2 border-t-2 border-dashed border-[#EFE2C6] flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-[#5C4328] shrink-0">
            🔭 Range: <strong className="text-[#4E9F6E]">{radiusKm} km</strong>
          </span>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={radiusKm}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-full accent-[#4E9F6E] cursor-pointer"
          />
          <span className="px-2 py-0.5 rounded-lg bg-[#EBF7EE] text-[#2F7A4C] text-xs font-extrabold shrink-0">
            {nearbyFilteredItems.length} pins
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MAP VIEWPORT: REAL INTERACTIVE STREET MAP OR COZY GAME RADAR      */}
      {/* ================================================================= */}
      {mapMode === 'street' ? (
        <div className="relative w-full aspect-square max-h-[370px] rounded-3xl overflow-hidden border-4 border-[#D8C5A0] shadow-cozy bg-[#E8D8B9]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Recenter Button on Real Street Map */}
          <button
            type="button"
            onClick={handleRecenterMap}
            title="Recenter on my GPS pin"
            className="absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-2xl bg-[#FFF9EB]/95 hover:bg-white border-2 border-[#4E9F6E] text-[#2F7A4C] font-game text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Center on Me</span>
          </button>

          {/* Empty State Overlay When No Pins Match Filter */}
          {nearbyFilteredItems.length === 0 && (
            <div className="absolute inset-x-6 bottom-6 z-[400] p-3 rounded-2xl bg-[#FFF9EB]/95 border-2 border-[#D8C5A0] text-center shadow-lg space-y-1.5">
              <p className="font-game text-xs font-bold text-[#4A3520]">
                🔍 No map pins match this filter within {radiusKm} km
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setRadarSearch('');
                    setSelectedCategory('All');
                    setQuickFilter('all');
                  }}
                  className="px-3 py-1 rounded-xl bg-[#4E9F6E] text-white text-[11px] font-extrabold"
                >
                  Reset Map Filters
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-square max-h-[380px] rounded-3xl overflow-hidden border-4 border-[#5C4328] shadow-cozy bg-[#A7D7C5] select-none">
          {/* Rich Illustrated Cozy Island & Village Radar SVG */}
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <defs>
              <radialGradient id="cozyIslandGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E6F4D7" />
                <stop offset="68%" stopColor="#C5E5B4" />
                <stop offset="88%" stopColor="#EDD9A3" />
                <stop offset="100%" stopColor="#7EC4CF" />
              </radialGradient>
              <linearGradient id="riverStream" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7EC4CF" />
                <stop offset="100%" stopColor="#5AA9E6" />
              </linearGradient>
            </defs>

            {/* Ocean Water Base */}
            <rect width="400" height="400" fill="#7EC4CF" />

            {/* Cozy Island Landmass & Sandy Beach */}
            <circle cx="200" cy="200" r="178" fill="#EDD9A3" />
            <circle cx="200" cy="200" r="164" fill="url(#cozyIslandGrad)" />

            {/* Lush Forest Groves */}
            <circle cx="105" cy="105" r="42" fill="#A8D597" opacity="0.7" />
            <circle cx="295" cy="110" r="38" fill="#A8D597" opacity="0.7" />
            <circle cx="100" cy="285" r="40" fill="#A8D597" opacity="0.7" />
            <circle cx="295" cy="290" r="45" fill="#A8D597" opacity="0.7" />

            {/* Winding Village River */}
            <path
              d="M 28 245 Q 125 225 200 265 T 372 230"
              stroke="url(#riverStream)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />

            {/* Cobblestone Village Paths */}
            <path
              d="M 45 200 L 355 200"
              stroke="#E8D3B0"
              strokeWidth="12"
              strokeDasharray="8 4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 200 45 L 200 355"
              stroke="#E8D3B0"
              strokeWidth="12"
              strokeDasharray="8 4"
              fill="none"
              strokeLinecap="round"
            />

            {/* Wooden River Bridge */}
            <rect
              x="188"
              y="252"
              width="24"
              height="24"
              rx="5"
              fill="#B88655"
              stroke="#6E4720"
              strokeWidth="2"
            />

            {/* Town Center Cobblestone Plaza Circle */}
            <circle
              cx="200"
              cy="200"
              r="34"
              fill="#F5E9CE"
              stroke="#D8C5A0"
              strokeWidth="3"
            />

            {/* Radar Distance Rings (35%, 60%, 82%) */}
            <circle
              cx="200"
              cy="200"
              r="65"
              fill="none"
              stroke="#2F7A4C"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.45"
            />
            <circle
              cx="200"
              cy="200"
              r="112"
              fill="none"
              stroke="#2F7A4C"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              opacity="0.45"
            />
            <circle
              cx="200"
              cy="200"
              r="152"
              fill="none"
              stroke="#2F7A4C"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              opacity="0.45"
            />

            {/* Decorative Village Trees & Landmarks */}
            <text x="88" y="92" fontSize="14">🌲🌳</text>
            <text x="285" y="96" fontSize="14">🌳🏡</text>
            <text x="82" y="295" fontSize="14">☕🥐</text>
            <text x="288" y="302" fontSize="14">⚓⛵</text>
          </svg>

          {/* Compass Cardinal Directions & Distance Ring Labels */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#4A3520]/85 text-[#FFF9EB] text-[9px] font-extrabold tracking-widest z-10">
            ▲ NORTH ({radiusKm}km range)
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#4A3520]/80 text-[#FFF9EB] text-[9px] font-extrabold z-10">
            ▼ HARBOR SOUTH
          </span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-lg bg-[#4A3520]/75 text-[#FFF9EB] text-[9px] font-extrabold z-10">
            ◀ W
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-lg bg-[#4A3520]/75 text-[#FFF9EB] text-[9px] font-extrabold z-10">
            E ▶
          </span>

          {/* Distance Ring Pills */}
          <span
            style={{ left: '50%', top: '33%' }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-[#FFF9EB]/80 text-[#2F7A4C] text-[8px] font-extrabold border border-[#8BD1A0]"
          >
            {(radiusKm * 0.35).toFixed(1)} km
          </span>
          <span
            style={{ left: '50%', top: '21%' }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-[#FFF9EB]/80 text-[#2F7A4C] text-[8px] font-extrabold border border-[#8BD1A0]"
          >
            {(radiusKm * 0.7).toFixed(1)} km
          </span>

          {/* Animated Radar Pulse Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 rounded-full border-2 border-[#4E9F6E]/45 radar-ring" />
            <div
              className="w-56 h-56 rounded-full border-2 border-[#4E9F6E]/30 radar-ring"
              style={{ animationDelay: '1.2s' }}
            />
          </div>

          {/* Center Pin: Current Player Avatar */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div className="px-2 py-0.5 rounded-full bg-[#4A3520] text-[#FFF9EB] text-[9px] font-extrabold mb-0.5 shadow border border-[#F6B93B] whitespace-nowrap">
              YOU ({currentUser.display_name})
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF9EB] border-3 border-[#4E9F6E] shadow-lg flex items-center justify-center text-xl">
              {currentUser.avatar_emoji}
            </div>
          </div>

          {/* Empty State Overlay When No Pins Match Filter */}
          {nearbyFilteredItems.length === 0 && (
            <div className="absolute inset-x-6 bottom-8 z-30 p-3 rounded-2xl bg-[#FFF9EB]/95 border-2 border-[#D8C5A0] text-center shadow-lg space-y-1.5">
              <p className="font-game text-xs font-bold text-[#4A3520]">
                🔍 No radar pins match this filter within {radiusKm} km
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setRadarSearch('');
                    setSelectedCategory('All');
                    setQuickFilter('all');
                  }}
                  className="px-3 py-1 rounded-xl bg-[#4E9F6E] text-white text-[11px] font-extrabold"
                >
                  Reset Radar Filters
                </button>
              )}
            </div>
          )}

          {/* Collision-Free Polar Radar Pins for Nearby Items */}
          {nearbyFilteredItems.slice(0, 10).map((item, index, arr) => {
            const total = arr.length;
            // Evenly distribute pins around the compass using golden-ratio offset + true bearing
            const baseAngle =
              (index * (2 * Math.PI)) / Math.max(1, total) - Math.PI / 3;
            const distRatio = Math.min(
              1,
              Math.max(0.18, (item.distance_km ?? 0.8) / Math.max(2, radiusKm))
            );
            // Keep radius between 25% and 41% of container width so pins NEVER touch center or edges
            const radiusPct = 25 + distRatio * 15 + (index % 2 === 0 ? 0 : 3);
            const leftPct = 50 + Math.cos(baseAngle) * radiusPct;
            const topPct = 50 + Math.sin(baseAngle) * radiusPct;

            const isSelected = selectedPinItem?.id === item.id;
            const isFriend = friendIds.includes(item.owner_id);

            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedPinItem(item)}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group ${
                  isSelected ? 'z-40' : 'z-30'
                }`}
              >
                <div
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-md mb-0.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#FF7E67] text-white scale-110 ring-2 ring-white'
                      : isFriend
                      ? 'bg-[#EBF7EE] text-[#2F7A4C] border border-[#4E9F6E]'
                      : 'bg-[#FFF9EB] text-[#4A3520] border border-[#D8C5A0]'
                  }`}
                >
                  {item.owner_avatar} {(item.distance_km ?? 0.6).toFixed(1)}km
                </div>
                <div
                  className={`w-11 h-11 rounded-2xl overflow-hidden border-2 shadow-md transition-transform bg-[#FFF9EB] ${
                    isSelected
                      ? 'border-[#FF7E67] ring-4 ring-[#FF7E67]/35 scale-110'
                      : 'border-white hover:scale-105'
                  }`}
                >
                  <img
                    src={
                      item.media_type === 'video'
                        ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                        : item.media_url
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Selected Pin Preview Card with Specs & Trade Buttons */}
      {selectedPinItem && (
        <motion.div
          key={selectedPinItem.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#FFFDF7] border-[3px] border-[#D8C5A0] p-3.5 shadow-cozy space-y-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => onInspectItem?.(selectedPinItem)}
              className="flex items-center gap-3 min-w-0 cursor-pointer"
            >
              <img
                src={
                  selectedPinItem.media_type === 'video'
                    ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'
                    : selectedPinItem.media_url
                }
                alt={selectedPinItem.title}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D8C5A0] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold text-[#4E9F6E]">
                    📍 {(selectedPinItem.distance_km ?? 0.6).toFixed(2)} km
                  </span>
                  <span className="text-[11px] font-bold text-[#8C6246]">
                    • {selectedPinItem.owner_avatar} {selectedPinItem.owner_name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#FFF6E0] text-[#8C5800] text-[10px] font-extrabold">
                    📅 {selectedPinItem.year_made || 2023}
                  </span>
                </div>
                <h4 className="font-game text-sm font-bold text-[#4A3520] truncate mt-0.5">
                  {selectedPinItem.title}
                </h4>
                <p className="text-[11px] font-bold text-[#7C6246] truncate">
                  {selectedPinItem.condition} •{' '}
                  {selectedPinItem.brand || selectedPinItem.category}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectItemForTrade(selectedPinItem)}
                className="px-3.5 py-2 rounded-2xl bg-[#FF7E67] hover:bg-[#EB6B54] text-white font-game text-xs font-bold shadow-cozy-coral flex items-center justify-center gap-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Trade</span>
              </button>
              {onInspectItem && (
                <button
                  type="button"
                  onClick={() => onInspectItem(selectedPinItem)}
                  className="px-2.5 py-1 rounded-xl bg-[#F5E9CE] hover:bg-[#E8D5B0] text-[#5C4328] text-[11px] font-extrabold flex items-center justify-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  <span>Specs</span>
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Quick-Select Strip for Matching Radar Pins */}
          {nearbyFilteredItems.length > 1 && (
            <div className="pt-2 border-t border-dashed border-[#E6D5B5] flex items-center gap-2 overflow-x-auto no-scrollbar">
              {nearbyFilteredItems.map((pin) => {
                const active = pin.id === selectedPinItem.id;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => {
                      setSelectedPinItem(pin);
                      if (leafletMapRef.current && mapMode === 'street') {
                        leafletMapRef.current.panTo(
                          [pin.latitude, pin.longitude],
                          { animate: true }
                        );
                      }
                    }}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-[#4E9F6E] text-white border-[#367A51]'
                        : 'bg-[#FFF9EB] text-[#5C4328] border-[#D8C5A0]'
                    }`}
                  >
                    <span>{pin.owner_avatar}</span>
                    <span className="truncate max-w-[110px]">{pin.title}</span>
                    <span className="opacity-80">
                      ({(pin.distance_km ?? 0.5).toFixed(1)}km)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Fast-Travel Cozy Town Checkpoints */}
      <div className="rounded-2xl bg-[#F5E9CE] p-3 border-2 border-[#D8C5A0]">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6E5031] mb-2">
          🚶 Explore Neighborhoods Around Town
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COZY_PLACES.map((place) => {
            const active = currentUser.location_name === place.name;
            return (
              <button
                key={place.name}
                type="button"
                onClick={() =>
                  onSimulateMove(
                    place.lat - currentUser.latitude,
                    place.lng - currentUser.longitude,
                    place.name
                  )
                }
                className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border text-left transition-all ${
                  active
                    ? 'bg-[#4E9F6E] text-white border-[#367A51] shadow-sm'
                    : 'bg-[#FFF9EB] text-[#4A3520] border-[#D8C5A0] hover:bg-white'
                }`}
              >
                <span>{place.icon}</span>
                <span className="truncate">{place.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
