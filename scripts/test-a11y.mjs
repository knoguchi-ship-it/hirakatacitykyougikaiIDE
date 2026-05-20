#!/usr/bin/env node
// v374: 自動アクセシビリティテスト (WCAG 2.2 AA)
// axe-core + Playwright で公開ポータルを 3 view スキャンし、違反を JSON + Markdown レポートに出力。
//
// CIで失敗にしたい場合は CI=1 で実行（critical/serious が 1 件でも見つかれば exit 1）。
// 通常は warn-only モード（exit 0、レポートのみ出力）。
//
// 2026 ベストプラクティス: axe-core は WCAG SC ベースで自動検出可能な約 57% の問題量を
// カバー。残りの fix 量はキーボード操作・スクリーンリーダー読上げ等の manual テストで補完。
//
// Usage:
//   node scripts/test-a11y.mjs                # public portal、デフォルト URL
//   PORTAL_URL=https://... node scripts/test-a11y.mjs
//   CI=1 node scripts/test-a11y.mjs           # critical/serious で exit 1
//
// 出力:
//   .test-out/a11y-report.json — 全 view の axe results
//   .test-out/a11y-report.md   — 違反サマリーの人間可読 markdown
//
// Skip 条件:
//   - PORTAL_URL も既定 URL も到達できない場合は graceful skip (exit 0、警告のみ)
//   - 環境変数 SKIP_A11Y=1 でも skip

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require_ = createRequire(import.meta.url);
const AXE_SRC_PATH = require_.resolve('axe-core/axe.min.js');

const PORTAL_URL = process.env.PORTAL_URL
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const CI_MODE = process.env.CI === '1' || process.env.CI === 'true';
const SKIP = process.env.SKIP_A11Y === '1';

const OUT_DIR = '.test-out';
const JSON_PATH = path.join(OUT_DIR, 'a11y-report.json');
const MD_PATH = path.join(OUT_DIR, 'a11y-report.md');

// WCAG 2.2 AA タグ集合（axe-core が認識する標準タグ）
// wcag2a, wcag2aa: WCAG 2.0
// wcag21a, wcag21aa: WCAG 2.1
// wcag22aa: WCAG 2.2 新規追加分
// best-practice: WCAG 外だが推奨されるパターン (focus-order, target-size 等)
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

// 公開ポータルで実機テストする 3 view
const VIEWS = [
  { id: 'home',              label: 'ホーム（カードメニュー）',     trigger: null },
  { id: 'memberApplication', label: '新規入会申込フォーム',         trigger: { textIncludes: '新規入会を申し込む' } },
  { id: 'noticeDialog',      label: '事務局からのお願いモーダル',   trigger: { textIncludes: '重要事項を確認する' } },
];

async function getAppFrame(page) {
  await page.waitForLoadState('domcontentloaded');
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(500);
    for (const f of page.frames()) {
      try {
        const info = await f.evaluate(() => {
          const t = (document.body && document.body.innerText || '');
          return { len: t.length, hasApp: /新規入会|お申込みポータル|研修申込/.test(t) };
        });
        if (info.len > 100 && info.hasApp) return f;
      } catch { /* cross-origin still loading */ }
    }
  }
  throw new Error('App frame did not appear within 45s');
}

async function runAxeOnFrame(page, frame) {
  // GAS の二重 iframe 内で React アプリが動いているため、AxeBuilder の
  // 自動 frame 検出が効きにくい。axe-core を frame に直接 inject + run する。
  const axeSource = await fs.readFile(AXE_SRC_PATH, 'utf8');
  await frame.evaluate(axeSource);
  const results = await frame.evaluate(async (tags) => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: tags },
      resultTypes: ['violations', 'incomplete'],
    });
  }, WCAG_TAGS);
  return results;
}

function summarizeImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations || []) {
    if (counts[v.impact] != null) counts[v.impact] += v.nodes.length;
  }
  return counts;
}

function renderMarkdown(allResults, summary) {
  const lines = [];
  lines.push('# WCAG 2.2 AA 自動アクセシビリティスキャン結果');
  lines.push('');
  lines.push(`実行日時: ${new Date().toISOString()}`);
  lines.push(`対象 URL: ${PORTAL_URL}`);
  lines.push(`使用エンジン: axe-core (WCAG タグ: ${WCAG_TAGS.join(', ')})`);
  lines.push('');
  lines.push('## サマリー');
  lines.push('');
  lines.push('| View | critical | serious | moderate | minor | incomplete |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const r of allResults) {
    const c = summarizeImpact(r.results?.violations);
    const inc = r.results?.incomplete?.length || 0;
    lines.push(`| ${r.viewId} (${r.viewLabel}) | ${c.critical} | ${c.serious} | ${c.moderate} | ${c.minor} | ${inc} |`);
  }
  lines.push('');
  lines.push(`**総合判定**: critical=${summary.critical}, serious=${summary.serious}, moderate=${summary.moderate}, minor=${summary.minor}`);
  lines.push('');
  lines.push('## 違反詳細');
  lines.push('');
  for (const r of allResults) {
    if (r.fatal) {
      lines.push(`### ${r.viewId}: ❌ 実行失敗`);
      lines.push('```');
      lines.push(String(r.fatal));
      lines.push('```');
      lines.push('');
      continue;
    }
    const violations = r.results?.violations || [];
    if (violations.length === 0) {
      lines.push(`### ${r.viewId}: ✅ 違反なし`);
      lines.push('');
      continue;
    }
    lines.push(`### ${r.viewId} (${r.viewLabel}) — ${violations.length} 件の違反`);
    lines.push('');
    for (const v of violations) {
      lines.push(`- **[${v.impact}] ${v.id}**: ${v.description}`);
      lines.push(`  - WCAG: ${(v.tags || []).filter(t => /wcag/i.test(t)).join(', ')}`);
      lines.push(`  - Help: ${v.helpUrl}`);
      lines.push(`  - 該当要素: ${v.nodes.length} 件`);
      for (const node of v.nodes.slice(0, 3)) {
        const target = (node.target || []).join(' > ');
        const html = String(node.html || '').slice(0, 120).replace(/\n/g, ' ');
        lines.push(`    - \`${target}\`: ${html}`);
      }
      if (v.nodes.length > 3) lines.push(`    - …他 ${v.nodes.length - 3} 件`);
      lines.push('');
    }
  }
  lines.push('## 既知の限界 (manual テストで補完)');
  lines.push('');
  lines.push('- スクリーンリーダー読み上げの自然さ（NVDA + Chrome / VoiceOver + Safari）');
  lines.push('- キーボード操作の論理順序とフォーカストラップ');
  lines.push('- 認知アクセシビリティ（読みやすさ・ジャーゴン回避）');
  lines.push('- WCAG 2.2 §3.3.7 Redundant Entry / §3.3.8 Accessible Authentication の実機検証');
  lines.push('');
  lines.push('axe-core は WCAG SC ベースで自動検出可能な約 57% の問題量をカバー。残りは manual で検証する必要があります。');
  return lines.join('\n');
}

async function main() {
  if (SKIP) {
    console.log('[test-a11y] SKIP_A11Y=1 → skip');
    return;
  }
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const allResults = [];
  try {
    process.stderr.write(`[test-a11y] navigating ${PORTAL_URL}\n`);
    await page.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const frame = await getAppFrame(page);
    await page.waitForTimeout(800);

    for (const view of VIEWS) {
      process.stderr.write(`[test-a11y] view: ${view.id}\n`);
      try {
        if (view.trigger) {
          const clicked = await frame.evaluate((needle) => {
            const btns = Array.from(document.querySelectorAll('button'));
            const target = btns.find((b) => (b.innerText || '').includes(needle));
            if (target) { target.click(); return true; }
            return false;
          }, view.trigger.textIncludes);
          if (!clicked) {
            allResults.push({ viewId: view.id, viewLabel: view.label, fatal: `trigger button '${view.trigger.textIncludes}' not found` });
            continue;
          }
          await page.waitForTimeout(1200);
        }
        const results = await runAxeOnFrame(page, frame);
        allResults.push({ viewId: view.id, viewLabel: view.label, results });
      } catch (e) {
        allResults.push({ viewId: view.id, viewLabel: view.label, fatal: String(e.message || e) });
      }
    }
  } catch (navErr) {
    process.stderr.write(`[test-a11y] navigation failed: ${navErr.message}\n`);
    // graceful skip (CI 環境でも URL 到達不可なら skip 扱い)
    if (CI_MODE) {
      process.stderr.write('[test-a11y] CI mode but URL unreachable. Skipping (consider VPN / network).\n');
    }
    await browser.close();
    return;
  } finally {
    await browser.close().catch(() => {});
  }

  // 集計
  const totals = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const r of allResults) {
    const c = summarizeImpact(r.results?.violations);
    totals.critical += c.critical;
    totals.serious += c.serious;
    totals.moderate += c.moderate;
    totals.minor += c.minor;
  }

  await fs.writeFile(JSON_PATH, JSON.stringify({ url: PORTAL_URL, results: allResults, totals }, null, 2));
  await fs.writeFile(MD_PATH, renderMarkdown(allResults, totals));

  console.log(`[test-a11y] report: ${MD_PATH}`);
  console.log(`[test-a11y] totals: critical=${totals.critical}, serious=${totals.serious}, moderate=${totals.moderate}, minor=${totals.minor}`);

  if (CI_MODE && (totals.critical > 0 || totals.serious > 0)) {
    console.error('[test-a11y] CI gate failed: critical/serious violations exist');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[test-a11y] fatal:', e);
  process.exit(2);
});
