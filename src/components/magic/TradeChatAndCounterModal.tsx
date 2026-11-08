import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  RefreshCw,
  Send,
  Check,
} from 'lucide-react';
import { TradeItem, TradeOffer, UserProfile } from '../../types/game';

interface TradeChatAndCounterModalProps {
  trade: TradeOffer | null;
  currentUser: UserProfile;
  allItems: TradeItem[];
  initialMode?: 'chat' | 'counter';
  onClose: () => void;
  onSendMessage: (tradeId: string, text: string) => void;
  onSubmitCounterOffer: (
    tradeId: string,
    newRequestedItemId: string,
    newOfferedItemIds: string[],
    counterNote: string
  ) => void;
}

const QUICK_QUESTIONS = [
  'What year is this item from & are you the original owner?',
  'Any scratches, dents, or battery wear I should know about?',
  'Does it come with the original box & accessories?',
  'Would you be open to a counter-offer if I add another item?',
  'Can we meet at a local cafe this afternoon to inspect & swap?',
];

export const TradeChatAndCounterModal: React.FC<TradeChatAndCounterModalProps> = ({
  trade,
  currentUser,
  allItems,
  initialMode = 'chat',
  onClose,
  onSendMessage,
  onSubmitCounterOffer,
}) => {
  const [mode, setMode] = useState<'chat' | 'counter'>(initialMode);
  const [chatInput, setChatInput] = useState('');
  const [selectedMyItemIds, setSelectedMyItemIds] = useState<string[]>([]);
  const [selectedTheirItemId, setSelectedTheirItemId] = useState<string>('');
  const [counterNote, setCounterNote] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, trade?.id]);

  useEffect(() => {
    if (!trade) return;
    const isSender = trade.sender_id === currentUser.id;
    if (isSender) {
      setSelectedMyItemIds(trade.offered_item_ids);
      setSelectedTheirItemId(trade.requested_item_id);
    } else {
      setSelectedMyItemIds([trade.requested_item_id]);
      setSelectedTheirItemId(trade.offered_item_ids[0] || '');
    }
  }, [trade, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trade?.messages?.length, mode]);

  if (!trade) return null;

  const isSender = trade.sender_id === currentUser.id;
  const otherPartnerName = isSender ? trade.receiver_name : trade.sender_name;
  const otherPartnerAvatar = isSender ? trade.receiver_avatar : trade.sender_avatar;
  const otherPartnerId = isSender ? trade.receiver_id : trade.sender_id;

  const myTradeableItems = allItems.filter(
    (i) => i.owner_id === currentUser.id && i.is_for_trade
  );
  const theirTradeableItems = allItems.filter(
    (i) => i.owner_id === otherPartnerId && i.is_for_trade
  );

  const requestedItem = allItems.find((i) => i.id === trade.requested_item_id);
  const offeredItems = allItems.filter((i) =>
    trade.offered_item_ids.includes(i.id)
  );

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(trade.id, chatInput.trim());
    setChatInput('');
  };

  const toggleMyItem = (id: string) => {
    setSelectedMyItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTheirItemId || selectedMyItemIds.length === 0) return;

    // Pass the counter-proposer's target item (partner's item) and counter-proposer's offered items cleanly
    onSubmitCounterOffer(
      trade.id,
      selectedTheirItemId,
      selectedMyItemIds,
      counterNote.trim() ||
        `🔄 Counter-Offer from ${currentUser.display_name}: Let's do this updated swap instead!`
    );
    setCounterNote('');
    setMode('chat');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: 70, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 70, opacity: 0, scale: 0.96 }}
          className="w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Top Modal Header + Mode Switcher Tabs */}
          <div className="bg-[#F5E9CE] border-b-2 border-[#D8C5A0] px-4 pt-3 pb-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF9EB] border-2 border-[#4E9F6E] flex items-center justify-center text-lg">
                  {otherPartnerAvatar}
                </div>
                <div>
                  <h3 className="font-game text-base font-bold text-[#4A3520]">
                    Trade with {otherPartnerName}
                  </h3>
                  <p className="text-[11px] font-bold text-[#4E9F6E]">
                    {trade.counter_count > 0
                      ? `🔄 Countered ${trade.counter_count}x • Active Negotiation`
                      : `📍 ~${trade.meetup_distance_km} km away`}
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

            {/* Switcher: Chat Q&A vs Counter-Offer Studio */}
            <div className="grid grid-cols-2 gap-2 bg-[#E8D8B9] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('chat')}
                className={`py-1.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'chat'
                    ? 'bg-[#FFF9EB] text-[#4A3520] shadow-sm'
                    : 'text-[#6E5031]'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>Trade Chat ({trade.messages?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('counter')}
                className={`py-1.5 rounded-xl font-game text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'counter'
                    ? 'bg-[#FF7E67] text-white shadow-sm'
                    : 'text-[#6E5031]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Counter-Offer</span>
              </button>
            </div>
          </div>

          {mode === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-[420px] max-h-[72vh]">
              {/* Mini Pinned Current Deal Banner */}
              <div className="px-3.5 py-2 bg-[#FFFDF7] border-b border-[#E6D5B5] flex items-center justify-between text-[11px] font-bold text-[#5C4328]">
                <div className="truncate flex-1">
                  <span className="text-[#4E9F6E] font-extrabold">Current Deal:</span>{' '}
                  {offeredItems.map((i) => `${i.title} (${i.year_made})`).join(' + ')}{' '}
                  ⇄ {requestedItem?.title} ({requestedItem?.year_made})
                </div>
                <button
                  type="button"
                  onClick={() => setMode('counter')}
                  className="ml-2 shrink-0 px-2 py-0.5 rounded-lg bg-[#FFF0EC] text-[#FF7E67] font-extrabold border border-[#FF7E67]/30"
                >
                  Modify / Counter
                </button>
              </div>

              {/* Scrollable Messages Area */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#FFF9EB]">
                {(trade.messages || []).map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  if (msg.is_counter_event) {
                    return (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-2xl bg-[#FFF6E0] border-2 border-[#F6B93B] text-center space-y-0.5"
                      >
                        <span className="text-[10px] font-extrabold uppercase text-[#B57C1E] block">
                          🔄 Counter-Offer Proposed
                        </span>
                        <p className="text-xs font-bold text-[#4A3520]">
                          {msg.text}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#F5E9CE] border border-[#D8C5A0] flex items-center justify-center text-sm shrink-0">
                        {msg.sender_avatar}
                      </div>
                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-bold leading-relaxed ${
                          isMe
                            ? 'bg-[#4E9F6E] text-white rounded-br-sm'
                            : 'bg-white border-2 border-[#E6D5B5] text-[#4A3520] rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`block text-[9px] mt-1 ${
                            isMe ? 'text-white/75 text-right' : 'text-[#8C6D46]'
                          }`}
                        >
                          {msg.created_at}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* 1-Tap Quick Question Chips */}
              <div className="px-3 py-2 bg-[#F5E9CE]/60 border-t border-[#E6D5B5]">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#7C6246] block mb-1">
                  💡 Tap a Quick Question to Ask {otherPartnerName}:
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSendMessage(trade.id, q)}
                      className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-[#EBF7EE] border border-[#D8C5A0] text-[11px] font-bold text-[#4A3520] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendChat}
                className="p-3 bg-[#F5E9CE] border-t-2 border-[#D8C5A0] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask ${otherPartnerName} about year, condition, meetup...`}
                  className="flex-1 rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2.5 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <form
              onSubmit={handleCounterSubmit}
              className="p-4 space-y-4 overflow-y-auto max-h-[72vh]"
            >
              <div className="p-3 rounded-2xl bg-[#FFF6E0] border border-[#EED9B3] text-xs font-bold text-[#7A592E]">
                🔄 <strong>Counter-Offer Studio:</strong> Adjust which item you want from{' '}
                {otherPartnerName} or swap out the 1–3 items you are offering from your Pocket!
              </div>

              {/* STEP 1: Pick which item you want from Partner's Inventory */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                  🎯 1. Select Item You Want From {otherPartnerName}'s Inventory
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-0.5">
                  {theirTradeableItems.map((tItem) => {
                    const selected = selectedTheirItemId === tItem.id;
                    return (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => setSelectedTheirItemId(tItem.id)}
                        className={`p-2 rounded-2xl border-2 text-left flex items-center gap-2 transition-all ${
                          selected
                            ? 'bg-[#FFF0EC] border-[#FF7E67] shadow-sm'
                            : 'bg-white border-[#D8C5A0]'
                        }`}
                      >
                        <img
                          src={
                            tItem.media_type === 'video'
                              ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                              : tItem.media_url
                          }
                          alt={tItem.title}
                          className="w-11 h-11 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-extrabold text-[#4A3520] truncate">
                            {tItem.title}
                          </p>
                          <span className="text-[10px] font-bold text-[#8C6D46] block">
                            📅 {tItem.year_made} • {tItem.condition}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Pick 1-3 Items from Your Own Pocket Inventory */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1.5">
                  🎒 2. Select 1–3 Items From Your Pocket to Offer ({selectedMyItemIds.length}/3)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-0.5">
                  {myTradeableItems.map((mItem) => {
                    const selected = selectedMyItemIds.includes(mItem.id);
                    return (
                      <button
                        key={mItem.id}
                        type="button"
                        onClick={() => toggleMyItem(mItem.id)}
                        className={`relative p-2 rounded-2xl border-2 text-center flex flex-col items-center transition-all ${
                          selected
                            ? 'bg-[#EBF7EE] border-[#4E9F6E] shadow-sm'
                            : 'bg-white border-[#D8C5A0]'
                        }`}
                      >
                        {selected && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4E9F6E] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                        <img
                          src={
                            mItem.media_type === 'video'
                              ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
                              : mItem.media_url
                          }
                          alt={mItem.title}
                          className="w-full aspect-square rounded-xl object-cover"
                        />
                        <span className="text-[10px] font-extrabold text-[#4A3520] line-clamp-1 mt-1">
                          {mItem.title}
                        </span>
                        <span className="text-[9px] font-bold text-[#8C6D46]">
                          📅 {mItem.year_made}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Counter-Offer Note */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                  💬 Reason / Note for Counter-Offer
                </label>
                <textarea
                  rows={2}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder={`Hey ${otherPartnerName}! How about we swap these items instead?`}
                  className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#FF7E67]"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedTheirItemId || selectedMyItemIds.length === 0}
                className="w-full py-3.5 rounded-2xl bg-[#FF7E67] hover:bg-[#EC6A52] text-white font-game text-sm font-bold shadow-cozy-coral flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Send Counter-Offer to {otherPartnerName}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
