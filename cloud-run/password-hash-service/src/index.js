// v373.5 design: Cloud Run Argon2id password hash service
//
// 設計方針:
// - OWASP Password Storage Cheat Sheet (2025) 推奨: Argon2id (m=19 MiB, t=2, p=1)
// - 入力 (password, salt, pepper) を受け取り、Argon2id ハッシュを返す
// - 検証 API では PHC string (含む salt/params) を受け取り match/needsRehash を返す
// - 認証: Cloud Run の OIDC ID Token verification (Apps Script から `ScriptApp.getIdentityToken()` で発行)
// - audience: 本 service の Cloud Run URL（環境変数 EXPECTED_AUDIENCE で指定）
// - 許可される iss は https://accounts.google.com のみ
// - 許可される sub（email）は環境変数 ALLOWED_INVOKERS（comma-separated）で制限
//
// API:
//   POST /v1/hash      { password, pepper? } -> { phc: "$argon2id$v=19$m=19456,t=2,p=1$..." }
//   POST /v1/verify    { password, phc, pepper? } -> { match: boolean, needsRehash: boolean }
//   GET  /healthz                              -> { status: "ok" }
//
// pepper の扱い: hash 計算前に HMAC-SHA-256(password, pepper) で wrap してから argon2 に渡す
// → DB 漏洩しても pepper を知らなければオフライン解読不能（peppered hashing パターン）

import express from 'express';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

const PORT = Number(process.env.PORT || 8080);
const EXPECTED_AUDIENCE = process.env.EXPECTED_AUDIENCE || '';
const ALLOWED_INVOKERS = String(process.env.ALLOWED_INVOKERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// OWASP recommended params (2025)
const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,   // 19 MiB
  timeCost: 2,             // iterations
  parallelism: 1,
  hashLength: 32,
};

const oauthClient = new OAuth2Client();

async function verifyIdToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw Object.assign(new Error('missing bearer token'), { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  if (!EXPECTED_AUDIENCE) {
    throw Object.assign(new Error('server misconfigured: EXPECTED_AUDIENCE not set'), { status: 500 });
  }
  let ticket;
  try {
    ticket = await oauthClient.verifyIdToken({ idToken: token, audience: EXPECTED_AUDIENCE });
  } catch (e) {
    throw Object.assign(new Error('invalid id token: ' + e.message), { status: 401 });
  }
  const payload = ticket.getPayload();
  if (!payload || payload.iss !== 'https://accounts.google.com') {
    throw Object.assign(new Error('invalid issuer'), { status: 401 });
  }
  if (ALLOWED_INVOKERS.length > 0 && !ALLOWED_INVOKERS.includes(payload.email || '')) {
    throw Object.assign(new Error('caller not in ALLOWED_INVOKERS'), { status: 403 });
  }
  return payload;
}

function pepperWrap(password, pepper) {
  if (!pepper) return String(password || '');
  return crypto.createHmac('sha256', String(pepper)).update(String(password || '')).digest('hex');
}

const app = express();
app.use(express.json({ limit: '4kb' }));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', argon2: ARGON2_OPTS });
});

app.post('/v1/hash', async (req, res) => {
  try {
    await verifyIdToken(req.headers.authorization);
    const { password, pepper } = req.body || {};
    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'password required' });
    }
    if (password.length > 1024) {
      return res.status(400).json({ error: 'password too long' });
    }
    const wrapped = pepperWrap(password, pepper);
    const phc = await argon2.hash(wrapped, ARGON2_OPTS);
    return res.json({ phc, alg: 'argon2id', params: ARGON2_OPTS });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'internal error' });
  }
});

app.post('/v1/verify', async (req, res) => {
  try {
    await verifyIdToken(req.headers.authorization);
    const { password, phc, pepper } = req.body || {};
    if (typeof password !== 'string' || typeof phc !== 'string') {
      return res.status(400).json({ error: 'password and phc required' });
    }
    const wrapped = pepperWrap(password, pepper);
    const match = await argon2.verify(phc, wrapped);
    const needsRehash = match && argon2.needsRehash(phc, ARGON2_OPTS);
    return res.json({ match, needsRehash });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`hcmn password-hash-service listening on :${PORT} | argon2id m=${ARGON2_OPTS.memoryCost} t=${ARGON2_OPTS.timeCost} p=${ARGON2_OPTS.parallelism}`);
});
