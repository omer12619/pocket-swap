import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://cwlffynxezwjqkhlaflm.supabase.co';
  const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_zjtXYkqPcbwTMJWU1nDv-Q_4SYjtldQ';

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const [profilesRes, itemsRes, tradesRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('items').select('id', { count: 'exact', head: true }),
    supabase.from('trade_offers').select('id', { count: 'exact', head: true }),
  ]);

  res.status(200).json({
    status: 'ok',
    service: 'PocketSwap Full-Stack API',
    counts: {
      profiles: profilesRes.count ?? 0,
      items: itemsRes.count ?? 0,
      trades: tradesRes.count ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
}
