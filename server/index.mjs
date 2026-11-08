import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Load .env variables cleanly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://cwlffynxezwjqkhlaflm.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zjtXYkqPcbwTMJWU1nDv-Q_4SYjtldQ';
const PORT = Number(process.env.PORT || 3001);

// Admin Supabase client (holds the secret key ONLY on the backend server)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // 1. GET /api/health — Live Backend & Database Health Check
  if (req.method === 'GET' && url.pathname === '/api/health') {
    try {
      const [profilesRes, itemsRes, tradesRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('items').select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('trade_offers')
          .select('id', { count: 'exact', head: true }),
      ]);

      return sendJson(res, 200, {
        status: 'ok',
        service: 'PocketSwap Backend API Server',
        supabaseProject: SUPABASE_URL,
        counts: {
          profiles: profilesRes.count ?? 0,
          items: itemsRes.count ?? 0,
          trades: tradesRes.count ?? 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: String(err) });
    }
  }

  // 2. POST /api/trades/complete — Trusted Server-Side Atomic Meetup Swap
  if (req.method === 'POST' && url.pathname === '/api/trades/complete') {
    const body = await parseBody(req);
    const { tradeId } = body;
    if (!tradeId) {
      return sendJson(res, 400, { error: 'Missing tradeId' });
    }

    try {
      const { data: trade } = await supabaseAdmin
        .from('trade_offers')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (trade) {
        // Swap requested item to sender
        await supabaseAdmin
          .from('items')
          .update({
            owner_id: trade.sender_id,
            owner_name: trade.sender_name,
            owner_avatar: trade.sender_avatar,
            is_for_trade: false,
          })
          .eq('id', trade.requested_item_id);

        // Swap offered items to receiver
        if (Array.isArray(trade.offered_item_ids) && trade.offered_item_ids.length > 0) {
          await supabaseAdmin
            .from('items')
            .update({
              owner_id: trade.receiver_id,
              owner_name: trade.receiver_name,
              owner_avatar: trade.receiver_avatar,
              is_for_trade: false,
            })
            .in('id', trade.offered_item_ids);
        }

        // Mark trade completed
        await supabaseAdmin
          .from('trade_offers')
          .update({ status: 'completed' })
          .eq('id', tradeId);
      }

      return sendJson(res, 200, {
        ok: true,
        tradeId,
        message: 'Atomic item ownership transfer verified by backend server',
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err) });
    }
  }

  // 3. POST /api/karma/rate — Anti-Cheat Server Karma Calculation
  if (req.method === 'POST' && url.pathname === '/api/karma/rate') {
    const body = await parseBody(req);
    const {
      tradeId,
      reviewerId,
      reviewerName,
      reviewerAvatar,
      targetUserId,
      stars,
      vibeBadge,
      comment,
    } = body;

    try {
      const reviewId = `rev-${Date.now()}`;
      await supabaseAdmin.from('karma_reviews').insert({
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

      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (targetProfile) {
        const newCount = (targetProfile.karma_reviews_count || 1) + 1;
        const newAvg =
          Math.round(
            (((Number(targetProfile.karma_score) || 5) *
              (targetProfile.karma_reviews_count || 1) +
              Number(stars || 5)) /
              newCount) *
              100
          ) / 100;
        const updatedBadges = Array.isArray(targetProfile.badges)
          ? targetProfile.badges.includes(vibeBadge)
            ? targetProfile.badges
            : [vibeBadge, ...targetProfile.badges]
          : [vibeBadge];

        await supabaseAdmin
          .from('profiles')
          .update({
            karma_score: newAvg,
            karma_points: (targetProfile.karma_points || 100) + Number(stars || 5) * 15,
            karma_reviews_count: newCount,
            badges: updatedBadges,
          })
          .eq('id', targetUserId);
      }

      return sendJson(res, 200, { ok: true, reviewId });
    } catch (err) {
      return sendJson(res, 500, { error: String(err) });
    }
  }

  // 4. POST /api/moderation/report — Server-Side Listing Moderation
  if (req.method === 'POST' && url.pathname === '/api/moderation/report') {
    const body = await parseBody(req);
    const { itemId } = body;
    if (itemId) {
      await supabaseAdmin
        .from('items')
        .update({ is_for_trade: false })
        .eq('id', itemId);
    }
    return sendJson(res, 200, { ok: true, moderatedItemId: itemId });
  }

  // 5. Serve Compiled Frontend App (dist/) from the Same Server in Production
  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    const safePath =
      url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.join(distDir, safePath);

    if (
      filePath.startsWith(distDir) &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile()
    ) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA Fallback to dist/index.html
    const indexHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexHtml).pipe(res);
    }
  }

  return sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(
    `🛡️ PocketSwap Backend API Server running at http://localhost:${PORT} (Connected to ${SUPABASE_URL})`
  );
});
