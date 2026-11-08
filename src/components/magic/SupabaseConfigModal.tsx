import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, CheckCircle2, Cloud, Copy, Check } from 'lucide-react';
import { getStoredSupabaseConfig, setStoredSupabaseConfig } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const current = getStoredSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isConnected = Boolean(url && anonKey && !url.includes('your-project-id'));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredSupabaseConfig(url, anonKey);
    onConfigUpdated();
    onClose();
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-[#FFF9EB] border-4 border-[#D8C5A0] shadow-2xl overflow-hidden"
        >
          <div className="px-5 py-4 bg-[#F5E9CE] border-b-2 border-[#D8C5A0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#4E9F6E]" />
              <h3 className="font-game text-base font-bold text-[#4A3520]">
                Supabase Cloud Backend Setup
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#FFF9EB] border border-[#D8C5A0] flex items-center justify-center text-[#5C4328]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div
              className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-bold ${
                isConnected
                  ? 'bg-[#EBF7EE] border-[#8BD1A0] text-[#2F7A4C]'
                  : 'bg-[#FFF6E0] border-[#EED9B3] text-[#7A592E]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isConnected
                  ? 'Connected to live Supabase Project! Syncing items, trades & Karma.'
                  : 'Currently running in Hybrid LocalStorage + Demo World mode. Add your Supabase credentials below to sync live!'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C4328] mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full rounded-2xl bg-white border-2 border-[#D8C5A0] px-3.5 py-2 text-xs font-bold text-[#4A3520] focus:outline-none focus:border-[#4E9F6E]"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#F5E9CE] border border-[#D8C5A0] text-xs font-bold text-[#5C4328] space-y-1">
              <div className="flex items-center justify-between">
                <span>📜 PostGIS + Karma SQL Schema:</span>
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="px-2 py-0.5 rounded-lg bg-white border border-[#D8C5A0] text-[11px] flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>supabase/schema.sql</span>
                </button>
              </div>
              <p className="text-[11px] text-[#7C6246]">
                Run <code>supabase/schema.sql</code> in your Supabase SQL Editor to create the tables, PostGIS distance RPC, and storage bucket.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#4E9F6E] hover:bg-[#3F885B] text-white font-game text-xs font-bold shadow-cozy-green"
              >
                Save & Sync Supabase
              </button>
              {isConnected && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                    setStoredSupabaseConfig('', '');
                    onConfigUpdated();
                    onClose();
                  }}
                  className="px-4 py-3 rounded-2xl bg-[#F5E9CE] text-[#7C6246] font-game text-xs font-bold"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
