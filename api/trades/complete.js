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

  const { tradeId } = req.body || {};
  if (!tradeId) {
    return res.status(400).json({ error: 'Missing tradeId' });
  }

  const { data: trade } = await supabase
    .from('trade_offers')
    .select('*')
    .eq('id', tradeId)
    .single();

  if (trade) {
    await supabase
      .from('items')
      .update({
        owner_id: trade.sender_id,
        owner_name: trade.sender_name,
        owner_avatar: trade.sender_avatar,
        is_for_trade: false,
      })
      .eq('id', trade.requested_item_id);

    if (Array.isArray(trade.offered_item_ids) && trade.offered_item_ids.length > 0) {
      await supabase
        .from('items')
        .update({
          owner_id: trade.receiver_id,
          owner_name: trade.receiver_name,
          owner_avatar: trade.receiver_avatar,
          is_for_trade: false,
        })
        .in('id', trade.offered_item_ids);
    }

    await supabase
      .from('trade_offers')
      .update({ status: 'completed' })
      .eq('id', tradeId);
  }

  return res.status(200).json({ ok: true, tradeId });
}
