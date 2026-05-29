// scripts/build-docs-portal.mjs
//
// 人間向けドキュメントポータル（docs/portal/）を生成する。
//
// 出力:
//   - docs/portal/index.html          — ポータル入口、TOC + 主要 docs サマリ
//   - docs/portal/er-diagram.html     — Mermaid ER 図（docs/03_DATA_MODEL.md から抽出）
//   - docs/portal/specifications.html — 主要仕様書サマリ（PRD / Auth / RBAC / Deployment）
//
// 再生成: スキーマ・仕様変更後に `node scripts/build-docs-portal.mjs` を実行。
// AGENTS.md §4.6 ドキュメント形式規約に準拠。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, 'docs');
const portalDir = join(docsDir, 'portal');

if (!existsSync(portalDir)) mkdirSync(portalDir, { recursive: true });

// ── 共通 CSS（docs/learning/ テーマと統一）─────────────────────────
const CSS = `
:root {
  --bg: #f4f1ea;
  --panel: #fffdf8;
  --ink: #1f2937;
  --muted: #5b6575;
  --line: #d8cfbf;
  --accent: #0f766e;
  --accent-soft: #d9f3ef;
  --warm: #8b5e34;
  --shadow: 0 18px 40px rgba(31, 41, 55, 0.08);
  --radius: 20px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Segoe UI", "Hiragino Sans", "Yu Gothic UI", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, #efe6d7 0, transparent 28%),
    linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
  line-height: 1.7;
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
.hero {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(24, 94, 146, 0.95));
  color: white;
  border-radius: 28px;
  padding: 36px;
  box-shadow: var(--shadow);
  margin-bottom: 28px;
}
.hero h1 { margin: 0 0 12px; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.2; }
.hero p { margin: 0; opacity: 0.92; }
nav.topnav {
  position: sticky; top: 0;
  background: rgba(255, 253, 248, 0.95);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
  padding: 12px 20px;
  z-index: 10;
  margin: -32px -20px 28px;
}
nav.topnav a {
  color: var(--accent);
  text-decoration: none;
  margin-right: 20px;
  font-weight: 600;
}
nav.topnav a:hover { text-decoration: underline; }
section.card {
  background: var(--panel);
  border-radius: var(--radius);
  padding: 28px 32px;
  box-shadow: var(--shadow);
  margin-bottom: 24px;
}
section.card h2 {
  margin: 0 0 16px;
  font-size: 1.6rem;
  color: var(--accent);
  border-bottom: 2px solid var(--accent-soft);
  padding-bottom: 8px;
}
section.card h3 { margin: 24px 0 12px; color: var(--warm); }
section.card ul, section.card ol { padding-left: 20px; }
section.card code {
  background: var(--accent-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}
section.card pre {
  background: #1e293b;
  color: #e5e7eb;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85em;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}
th, td {
  padding: 8px 12px;
  border: 1px solid var(--line);
  text-align: left;
  font-size: 0.93em;
}
th { background: var(--accent-soft); font-weight: 700; }
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78em;
  font-weight: 700;
  background: var(--accent-soft);
  color: var(--accent);
  margin-left: 6px;
}
.badge.warn { background: #fef3c7; color: #92400e; }
.badge.danger { background: #fee2e2; color: #991b1b; }
footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85em;
  text-align: center;
}
.mermaid-wrap {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  overflow-x: auto;
  border: 1px solid var(--line);
}
@media (max-width: 720px) {
  .wrap { padding: 16px 12px 36px; }
  nav.topnav { margin: -16px -12px 20px; }
  section.card { padding: 20px; }
}
`;

const COMMON_NAV = `
<nav class="topnav">
  <a href="index.html">📘 ポータル TOP</a>
  <a href="er-diagram.html">🗂️ ER 図</a>
  <a href="specifications.html">📋 仕様書サマリ</a>
  <a href="../../HANDOVER.md">📝 HANDOVER (Markdown)</a>
</nav>
`;

const FOOTER = `
<footer>
  生成: ${new Date().toISOString().slice(0, 10)} | scripts/build-docs-portal.mjs より自動生成 | AGENTS.md §4.6 準拠
</footer>
`;

function htmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── ER 図ページ生成 ────────────────────────────────────────────
function extractMermaidBlocks(mdContent) {
  const blocks = [];
  const lines = mdContent.split(/\r?\n/);
  let inBlock = false;
  let current = [];
  let blockStartLine = 0;
  // 直前見出し（最も近い ##/### を sticky で保持）
  let lastHeading = '';
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inBlock) {
      const h = line.match(/^(#{2,4})\s+(.*)$/);
      if (h) lastHeading = h[2].trim();
    }
    if (line.startsWith('```mermaid')) {
      inBlock = true;
      current = [];
      blockStartLine = i + 1;
      continue;
    }
    if (inBlock && line.trim() === '```') {
      blocks.push({
        startLine: blockStartLine,
        heading: lastHeading || `Mermaid Block @line ${blockStartLine}`,
        source: current.join('\n'),
      });
      inBlock = false;
      continue;
    }
    if (inBlock) current.push(line);
  }
  return blocks;
}

function buildErDiagramPage() {
  const dataModelPath = join(docsDir, '03_DATA_MODEL.md');
  const md = readFileSync(dataModelPath, 'utf8');
  const blocks = extractMermaidBlocks(md);

  let body = '';
  if (blocks.length === 0) {
    body = '<p>Mermaid ブロックが docs/03_DATA_MODEL.md に見つかりませんでした。</p>';
  } else {
    body = blocks.map((b, idx) => `
      <section class="card">
        <h2>図 ${idx + 1}: ${htmlEscape(b.heading)}</h2>
        <p style="color: var(--muted); font-size: 0.88em;">
          ソース: <code>docs/03_DATA_MODEL.md</code> line ${b.startLine}〜
        </p>
        <div class="mermaid-wrap">
          <pre class="mermaid">${htmlEscape(b.source)}</pre>
        </div>
      </section>
    `).join('\n');
  }

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ER 図 | 枚方市介護支援専門員連絡協議会 会員システム</title>
<style>${CSS}</style>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose', er: { fontSize: 12 } });
</script>
</head>
<body>
<div class="wrap">
${COMMON_NAV}
<div class="hero">
  <h1>🗂️ ER 図（データモデル可視化）</h1>
  <p>docs/03_DATA_MODEL.md から自動抽出した Mermaid ER 図。テーブル間の関係 / FK / カラム制約を視覚確認できます。</p>
</div>
${body}
<section class="card">
  <h2>更新方法</h2>
  <p>スキーマ変更（テーブル定義 / カラム追加 / 列順変更）を行った際は:</p>
  <ol>
    <li><code>gas-src/Code.full.gs</code> の <code>テーブル定義</code> を更新</li>
    <li><code>docs/03_DATA_MODEL.md</code> の Mermaid ER 図ブロックを同期</li>
    <li><code>node scripts/build-docs-portal.mjs</code> を実行</li>
    <li>本ファイル（docs/portal/er-diagram.html）が再生成されることを確認</li>
    <li>git commit で同ターン反映（AGENTS.md §3 / §4.6 同期則）</li>
  </ol>
</section>
${FOOTER}
</div>
</body>
</html>`;
}

// ── 仕様書サマリページ生成 ─────────────────────────────────────
function buildSpecificationsPage() {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>仕様書サマリ | 枚方市介護支援専門員連絡協議会 会員システム</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
${COMMON_NAV}
<div class="hero">
  <h1>📋 仕様書サマリ</h1>
  <p>主要仕様・技術要件の人間可読サマリ。詳細は各リンク先の原典 Markdown を参照。</p>
</div>

<section class="card">
  <h2>1. プロダクト概要 (PRD)</h2>
  <h3>目的</h3>
  <p>枚方市介護支援専門員連絡協議会の会員管理・研修運営をデジタル化する Web システム。Google Apps Script (GAS) + Google Spreadsheet をバックエンドに、React 19 SPA をフロントエンドに構築。</p>
  <h3>主要ユーザー</h3>
  <ul>
    <li><b>会員（個人・賛助・事業所）</b>: マイページから自身の情報変更、研修申込・キャンセル</li>
    <li><b>管理者（MASTER / カスタムロール）</b>: 会員管理、年会費、研修運営、役員管理、権限ロール定義</li>
    <li><b>非会員（公開ポータル）</b>: 新規入会申込、研修への外部申込（Google フォーム等への誘導も可）</li>
  </ul>
  <h3>原典</h3>
  <p>📄 <a href="../01_PRD.md">docs/01_PRD.md</a></p>
</section>

<section class="card">
  <h2>2. システムアーキテクチャ</h2>
  <h3>3 境界分離 <span class="badge danger">セキュリティ確定境界</span></h3>
  <table>
    <thead><tr><th>境界</th><th>用途</th><th>認証</th></tr></thead>
    <tbody>
      <tr><td>public（統合 public）</td><td>非会員向け公開ポータル・申込専用</td><td>匿名 + reCAPTCHA / honeypot</td></tr>
      <tr><td>member split</td><td>会員マイページ</td><td>loginId + password + session token</td></tr>
      <tr><td>admin split</td><td>管理者ポータル</td><td>Google session + whitelist（カスタムロール RBAC）</td></tr>
    </tbody>
  </table>
  <p style="margin-top: 12px;">3 境界の混在・統合提案は <b>禁止</b>（AGENTS.md §6 確定境界）。利便性を理由に逆行案を提示してはならない。</p>
  <h3>技術スタック</h3>
  <ul>
    <li>Frontend: React 19 + TypeScript + Vite + Tailwind CSS</li>
    <li>Backend: Google Apps Script (GAS) + Google Spreadsheet</li>
    <li>メール送信: <code>MailApp.sendEmail</code>（GAS ネイティブ）</li>
    <li>パスワードハッシュ: PBKDF2-HMAC-SHA256（10,000 反復）+ verifier-side pepper</li>
  </ul>
  <h3>原典</h3>
  <p>📄 <a href="../02_ARCHITECTURE.md">docs/02_ARCHITECTURE.md</a></p>
</section>

<section class="card">
  <h2>3. 認証・認可（RBAC）</h2>
  <h3>会員認証</h3>
  <ul>
    <li>loginId + password のみ（Google ログイン不使用）</li>
    <li>パスワードは PBKDF2-HMAC-SHA256 + pepper で保存</li>
    <li>セッショントークン（CacheService、TTL 設定済）</li>
  </ul>
  <h3>管理者認証</h3>
  <ul>
    <li><code>Session.getActiveUser().getEmail()</code> による Google セッション</li>
    <li><code>T_管理者Googleホワイトリスト</code> でメール照合</li>
    <li>GIS（Google Identity Services）は v118 で廃止</li>
  </ul>
  <h3>メニュー単位カスタムロール RBAC（docs/246）</h3>
  <ul>
    <li>固定 5 ロールを廃止し、MASTER + 任意のカスタムロールに移行（v376.24〜v376.29）</li>
    <li>権限管理画面でロール CRUD + 権限マトリクス UI（メニュー × チェック）</li>
    <li>server-side で <code>isActionAllowedForSession_</code> による menu-based 認可（session resolved）</li>
    <li>Sidebar が <code>allowedMenus</code> で動的描画 + permission-aware routing</li>
    <li>MASTER 専用メニュー（権限管理 / データ管理）は<b>特権昇格防止</b>でカスタムロールに付与不可</li>
  </ul>
  <h3>原典</h3>
  <p>📄 <a href="../05_AUTH_AND_ROLE_SPEC.md">docs/05_AUTH_AND_ROLE_SPEC.md</a> / 📄 <a href="../246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md">docs/246 (RBAC 設計)</a></p>
</section>

<section class="card">
  <h2>4. デプロイポリシー</h2>
  <h3>3 プロジェクト固定デプロイ</h3>
  <table>
    <thead><tr><th>配信</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td>統合 public legacy</td><td>公開ポータル（旧 URL 互換）</td></tr>
      <tr><td>統合 public 正式</td><td>公開ポータル（推奨 URL）</td></tr>
      <tr><td>member split</td><td>会員マイページ</td></tr>
      <tr><td>admin split</td><td>管理者ポータル</td></tr>
    </tbody>
  </table>
  <h3>デプロイコマンド</h3>
  <ul>
    <li><code>npm run build:gas[:admin|:member]</code> でビルド</li>
    <li><code>npx clasp push --force</code> → <code>clasp version "..."</code> → <code>clasp redeploy &lt;deploymentId&gt; --versionNumber &lt;N&gt;</code></li>
    <li><code>clasp deploy</code>（新 ID 生成）は<b>絶対禁止</b> — 固定 URL が変わるため</li>
    <li>2 線維持: legacy / 正式の両方を同 version に揃える</li>
  </ul>
  <h3>原典</h3>
  <p>📄 <a href="../09_DEPLOYMENT_POLICY.md">docs/09_DEPLOYMENT_POLICY.md</a></p>
</section>

<section class="card">
  <h2>5. データモデル概要</h2>
  <p>主要テーブル一覧（詳細列定義は <a href="../03_DATA_MODEL.md">docs/03</a>、視覚化は <a href="er-diagram.html">ER 図ページ</a>）:</p>
  <table>
    <thead><tr><th>テーブル</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td>T_会員</td><td>会員マスタ（個人・賛助・事業所）</td></tr>
      <tr><td>T_事業所職員</td><td>事業所会員配下の職員</td></tr>
      <tr><td>T_認証アカウント</td><td>loginId / password hash / session 関連</td></tr>
      <tr><td>T_管理者Googleホワイトリスト</td><td>管理者ログイン許可リスト + ロールID 紐付け</td></tr>
      <tr><td><b>T_権限ロール</b> <span class="badge">v376.25 追加</span></td><td>カスタムロール定義（許可メニュー / 研修編集スコープ）</td></tr>
      <tr><td>T_研修</td><td>研修マスタ（申込URL カラムは <span class="badge">v376.30 追加</span>）</td></tr>
      <tr><td>T_研修申込</td><td>会員・職員・外部申込者からの申込</td></tr>
      <tr><td>T_外部申込者</td><td>非会員からの研修申込者プロファイル</td></tr>
      <tr><td>T_年会費納入履歴 / T_年会費更新履歴</td><td>年会費の納入・更新管理</td></tr>
      <tr><td>T_変更申請</td><td>公開ポータル経由の変更申請</td></tr>
      <tr><td>T_役員 / T_振込口座 / T_支払い / T_請求</td><td>役員管理 + 支払い・請求管理</td></tr>
      <tr><td>T_監査ログ</td><td>管理者操作・ロール CRUD の監査記録</td></tr>
    </tbody>
  </table>
</section>

<section class="card">
  <h2>6. セキュリティ要件</h2>
  <h3>セキュアコーディング 5 視点 <span class="badge">AGENTS.md §6</span></h3>
  <ol>
    <li><b>入力検証</b>: 外部入力を信頼せず、許可リスト方式で検証。deny-by-default</li>
    <li><b>認証・認可</b>: server side で強制（frontend UI 非表示は単独防御にしない）</li>
    <li><b>機密データ保護</b>: 最小権限、暗号化/ハッシュ化、§0 シークレット保管準拠</li>
    <li><b>エラー処理・ログ</b>: 例外詳細を end user に出さず、ログに秘密値を含めない、fail close</li>
    <li><b>セキュア通信・依存</b>: HTTPS/TLS のみ、<code>npm audit --audit-level=high</code> 定期監査、ライブラリ採用前に build trap 確認</li>
  </ol>
  <h3>シークレット保管 <span class="badge danger">絶対不変</span></h3>
  <ul>
    <li>pepper / token / 鍵 / OAuth credentials を Git / docs / ログ / チャット / 生成物に書かない</li>
    <li><code>.env*</code> / <code>.clasprc.json</code> / <code>storageState*.json</code> 等は <code>.gitignore</code> で除外</li>
    <li>ハードコーディング原則禁止、シークレットは確認の有無に関わらず絶対禁止</li>
  </ul>
  <h3>原典</h3>
  <p>📄 <a href="../../AGENTS.md">AGENTS.md §0 §3 §6</a></p>
</section>

<section class="card">
  <h2>7. ドキュメント形式規約（AGENTS.md §4.6）</h2>
  <ul>
    <li><b>ER 図 / テーブル設計書</b>: HTML 形式必須（本ファイル + er-diagram.html がその実装）</li>
    <li><b>AI 用構造化 + 人間可読版の併設</b>: 一方のみは不完全</li>
    <li><b>文字コード UTF-8 統一</b>、文字化け疑いがあれば先に復旧</li>
    <li><b>同ターン更新</b>: スキーマ・仕様変更時は HTML も同コミットで再生成（<code>node scripts/build-docs-portal.mjs</code>）</li>
  </ul>
</section>

${FOOTER}
</div>
</body>
</html>`;
}

// ── 入口ページ生成 ────────────────────────────────────────────
function buildIndexPage() {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ドキュメントポータル | 枚方市介護支援専門員連絡協議会 会員システム</title>
<style>${CSS}
.toc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.toc-card {
  background: var(--accent-soft);
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid var(--accent);
  transition: transform 0.15s, box-shadow 0.15s;
}
.toc-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.toc-card h3 { margin: 0 0 6px; color: var(--accent); }
.toc-card p { margin: 0; font-size: 0.88em; color: var(--muted); }
.toc-card a { text-decoration: none; color: inherit; display: block; }
</style>
</head>
<body>
<div class="wrap">
${COMMON_NAV}
<div class="hero">
  <h1>📘 ドキュメントポータル</h1>
  <p>枚方市介護支援専門員連絡協議会 会員システムの仕様書・技術要件・データモデルを<b>人間が読みやすい HTML</b>で閲覧できるポータルです。</p>
  <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.85;">AGENTS.md §4.6 ドキュメント形式規約に基づき、AI 用 Markdown と並列で保守されます。</p>
</div>

<section class="card">
  <h2>🗺️ クイックナビ</h2>
  <div class="toc-grid">
    <a href="er-diagram.html"><div class="toc-card">
      <h3>🗂️ ER 図</h3>
      <p>Mermaid 可視化されたデータベース ER 図（テーブル間関係・FK・カラム制約）</p>
    </div></a>
    <a href="specifications.html"><div class="toc-card">
      <h3>📋 仕様書サマリ</h3>
      <p>PRD / アーキテクチャ / 認証・RBAC / デプロイ / セキュリティの集約サマリ</p>
    </div></a>
    <a href="../../HANDOVER.md"><div class="toc-card">
      <h3>📝 HANDOVER (現状)</h3>
      <p>本番デプロイ ID / バージョン / 未完了タスク / 最新リリース履歴</p>
    </div></a>
    <a href="../00_DOC_INDEX.md"><div class="toc-card">
      <h3>📚 docs/00 全体索引</h3>
      <p>Diátaxis 体系での全ドキュメント分類・優先順</p>
    </div></a>
    <a href="../release-notes-2026.md"><div class="toc-card">
      <h3>📦 リリースノート 2026</h3>
      <p>時系列の release 履歴（v200 系〜現行）</p>
    </div></a>
    <a href="../../AGENTS.md"><div class="toc-card">
      <h3>⚖️ AGENTS.md（グランドルール）</h3>
      <p>シークレット保管 / 行動原則 / 固定運用 / 完了条件 / セキュリティ</p>
    </div></a>
  </div>
</section>

<section class="card">
  <h2>📂 主要原典ドキュメント</h2>
  <table>
    <thead><tr><th>カテゴリ</th><th>ファイル</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td>概要</td><td><a href="../01_PRD.md">docs/01_PRD.md</a></td><td>プロダクト要件</td></tr>
      <tr><td>設計</td><td><a href="../02_ARCHITECTURE.md">docs/02_ARCHITECTURE.md</a></td><td>システムアーキテクチャ</td></tr>
      <tr><td>設計</td><td><a href="../03_DATA_MODEL.md">docs/03_DATA_MODEL.md</a></td><td>データモデル（ER 図含む）</td></tr>
      <tr><td>運用</td><td><a href="../04_DB_OPERATION_RUNBOOK.md">docs/04_DB_OPERATION_RUNBOOK.md</a></td><td>DB 操作手順</td></tr>
      <tr><td>認証</td><td><a href="../05_AUTH_AND_ROLE_SPEC.md">docs/05_AUTH_AND_ROLE_SPEC.md</a></td><td>認証・ロール仕様</td></tr>
      <tr><td>運用</td><td><a href="../09_DEPLOYMENT_POLICY.md">docs/09_DEPLOYMENT_POLICY.md</a></td><td>デプロイポリシー</td></tr>
      <tr><td>ルール</td><td><a href="../12_ENGINEERING_RULEBOOK.md">docs/12_ENGINEERING_RULEBOOK.md</a></td><td>エンジニアリングルール</td></tr>
      <tr><td>RBAC</td><td><a href="../246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md">docs/246</a></td><td>メニュー単位 RBAC 設計</td></tr>
    </tbody>
  </table>
  <p style="font-size: 0.88em; color: var(--muted); margin-top: 12px;">
    📂 <a href="../learning/index.html">docs/learning/</a> には技術スタック学習資料の HTML 群もあります。
  </p>
</section>

<section class="card">
  <h2>🔄 ポータル再生成</h2>
  <p>スキーマ・仕様変更後は以下を実行してポータル全体を再生成します:</p>
  <pre><code>node scripts/build-docs-portal.mjs</code></pre>
  <p>生成対象:</p>
  <ul>
    <li><code>docs/portal/index.html</code> — 本ファイル</li>
    <li><code>docs/portal/er-diagram.html</code> — ER 図（docs/03 から自動抽出）</li>
    <li><code>docs/portal/specifications.html</code> — 仕様書サマリ</li>
  </ul>
  <p>AGENTS.md §4.6 同期則: コード/スキーマ変更時は<b>同ターン</b>で本ポータルも再生成・コミットする。</p>
</section>

${FOOTER}
</div>
</body>
</html>`;
}

// ── 実行 ─────────────────────────────────────────────────────
const indexHtml = buildIndexPage();
const erHtml = buildErDiagramPage();
const specHtml = buildSpecificationsPage();

writeFileSync(join(portalDir, 'index.html'), indexHtml, 'utf8');
writeFileSync(join(portalDir, 'er-diagram.html'), erHtml, 'utf8');
writeFileSync(join(portalDir, 'specifications.html'), specHtml, 'utf8');

console.log('[build-docs-portal] generated:');
console.log('  - docs/portal/index.html');
console.log('  - docs/portal/er-diagram.html');
console.log('  - docs/portal/specifications.html');
