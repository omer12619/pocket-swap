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

  const {
    tradeId,
    reviewerId,
    reviewerName,
    reviewerAvatar,
    targetUserId,
    stars,
    vibeBadge,
    comment,
  } = req.body || {};

  const reviewId = `rev-${Date.now()}`;
  await supabase.from('karma_reviews').insert({
    id: reviewId,
    trade_id: tradeId,
    reviewer_id: reviewerId,
    reviewer_name: reviewerName,
    reviewer_avatar: reviewerAvatar,
    target_user_id: targetUserId,
    stars: Number(stars || 5),
    vibe_badge: vibeBadge || 'Fast & Friendly ⚡',
    comment: comment || '',
  });

  return res.status(200).json({ ok: true, reviewId });
}
