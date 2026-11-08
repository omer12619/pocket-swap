import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { itemId } = req.body || {};
  if (itemId) {
    await supabase
      .from('items')
      .update({ is_for_trade: false })
      .eq('id', itemId);
  }

  return res.status(200).json({ ok: true, moderatedItemId: itemId });
}
