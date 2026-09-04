#!/usr/bin/env node
// Responsive test harness for the public portal.
// 2026 WCAG 2.2 + Apple HIG / Material Design grade criteria.
// Output: .test-out/result.json, .test-out/report.md, .test-out/screenshots/*.png
//
// Usage:
//   node scripts/responsive-test.mjs
//   PORTAL_URL=https://... node scripts/responsive-test.mjs

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORTAL_URL = process.env.PORTAL_URL
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const OUT_DIR = '.test-out';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

const VIEWPORTS = [
  { name: '320x568_iPhoneSE',   width: 320, height: 568, mobile: true,  note: 'WCAG 2.2 §1.4.10 minimum reflow' },
  { name: '360x640_AndroidS',   width: 360, height: 640, mobile: true,  note: 'Android budget tier' },
  { name: '390x844_iPhone14',   width: 390, height: 844, mobile: true,  note: 'iPhone 14/15 standard' },
  { name: '414x896_iPhonePM',   width: 414, height: 896, mobile: true,  note: 'iPhone Pro Max' },
  { name: '768x1024_iPad',      width: 768, height: 1024, mobile: false, note: 'iPad portrait' },
  { name: '1280x800_Laptop',    width: 1280, height: 800, mobile: false, note: 'Laptop center' },
  { name: '1920x1080_Desktop',  width: 1920, height: 1080, mobile: false, note: 'Desktop full HD' },
];

// View transitions in the SPA — exercised via in-page button clicks.
const VIEWS = [
  { id: 'home',            label: 'ホーム（カードメニュー）',     trigger: null },
  { id: 'memberApplication', label: '新規入会申込フォーム',         trigger: { kind: 'button', textIncludes: '新規入会を申し込む' } },
  { id: 'noticeDialog',    label: '事務局からのお願いモーダル',   trigger: { kind: 'button', textIncludes: '入会・退会案内を開く' } },
];

async function getAppFrame(page, debugTag) {
  // The React app renders inside a doubly-nested GAS iframe whose URL ends in
  // '/blank' (NOT '/userCodeAppPanel'). Detect by content instead of URL.
  await page.waitForLoadState('domcontentloaded');
  let lastFrames = [];
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(500);
    const frames = page.frames();
    lastFrames = frames.map(f => f.url().slice(0, 100));
    for (const f of frames) {
      try {
        const info = await f.evaluate(() => {
          const t = (document.body && document.body.innerText || '');
          return { len: t.length, hasApp: /新規入会|お申込みポータル|研修申込/.test(t) };
        });
        if (info.len > 100 && info.hasApp) return f;
      } catch { /* cross-origin still loading */ }
    }
  }
  process.stderr.write(`[debug ${debugTag}] frames at fail:\n` + lastFrames.map(u => '  - ' + u).join('\n') + '\n');
  throw new Error('App frame did not appear within 45s');
}

// The app frame can be detected while the portal is still fetching its settings
// (GAS round-trip is 1.8-5s per HANDOVER 12.6). Collecting metrics at that point
// measures a half-rendered home view and produces false FAILs. Wait for the
// primary CTA to exist before measuring.
async function waitForHomeReady(frame) {
  for (let i = 0; i < 60; i++) {
    try {
      const ready = await frame.evaluate(() => Array.from(document.querySelectorAll('button'))
        .some((b) => (b.innerText || '').includes('新規入会を申し込む')));
      if (ready) return true;
    } catch { /* frame navigating */ }
    await frame.page().waitForTimeout(500);
  }
  return false;
}

async function collectMetrics(frame, page, viewportWidth) {
  return await frame.evaluate((vw) => {
    const doc = document.documentElement;
    const horizontalOverflow = doc.scrollWidth - doc.clientWidth;

    // Collect every interactive element rect
    const interactiveSelector = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(document.querySelectorAll(interactiveSelector));
    const tapTargets = elements
      .map((el) => {
        const r = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const visible = styles.display !== 'none' && styles.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        const type = el.type || '';
        return {
          tag: el.tagName.toLowerCase(),
          type,
          text: (el.innerText || el.value || '').trim().slice(0, 60),
          w: Math.round(r.width),
          h: Math.round(r.height),
          visible,
          // v374: WCAG 適合パターンを除外できるよう情報を付与
          isSrOnly: !!(el.className && typeof el.className === 'string' && /\bsr-only\b/.test(el.className)),
          wrappedInLabel: !!el.closest('label'),
        };
      })
      .filter((x) => x.visible);

    // v374: WCAG 適合パターンを除外
    //   - sr-only skip link (visually hidden, becomes visible on focus — SC 2.4.1 Bypass Blocks 適合)
    //   - checkbox/radio が <label> でラップされている場合（label が hit area・SC 2.5.5 適合）
    const realTargets = tapTargets.filter((t) => {
      if (t.isSrOnly) return false;
      if ((t.type === 'checkbox' || t.type === 'radio') && t.wrappedInLabel) return false;
      return true;
    });
    const tooSmall24 = realTargets.filter((t) => t.w < 24 || t.h < 24);
    const tooSmall44 = realTargets.filter((t) => t.w < 44 || t.h < 44);

    // Find any element whose right edge crosses viewport (potential overflow)
    const allEls = Array.from(document.body.querySelectorAll('*'));
    const overflowingElements = allEls
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, r };
      })
      .filter(({ r }) => r.right > vw + 1 && r.width > 0 && r.height > 0)
      .slice(0, 10)
      .map(({ el, r }) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.innerText || '').trim().slice(0, 40),
      }));

    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      horizontalOverflow,
      hasHorizontalScroll: horizontalOverflow > 1,
      tapTargetTotal: tapTargets.length,
      tapTargetsBelow24: tooSmall24,
      tapTargetsBelow44: tooSmall44,
      overflowingElements,
    };
  }, viewportWidth);
}

async function runViewport(browser, vp, consoleErrors) {
  // Use viewport-only sizing (no mobile UA/isMobile) — GAS may serve different
  // payloads to mobile UAs and our smoke test confirmed the desktop-UA path works.
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push({ vp: vp.name, view: '_global', text: msg.text() });
  });

  const result = { vp: vp.name, width: vp.width, height: vp.height, views: {} };

  try {
    await page.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const frame = await getAppFrame(page, vp.name);
    const homeReady = await waitForHomeReady(frame);
    if (!homeReady) result.homeReadyTimeout = true;
    await page.waitForTimeout(800);

    // VIEW: home
    {
      const metrics = await collectMetrics(frame, page, vp.width);
      const shotPath = path.join(SHOTS_DIR, `${vp.name}__01_home.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.views.home = { ...metrics, screenshot: shotPath };
    }

    // VIEW: memberApplication
    try {
      const clicked = await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find((b) => (b.innerText || '').includes('新規入会を申し込む'));
        if (target) { target.click(); return true; }
        return false;
      });
      if (clicked) {
        await page.waitForTimeout(1500);
        const metrics = await collectMetrics(frame, page, vp.width);
        const shotPath = path.join(SHOTS_DIR, `${vp.name}__02_memberApplication.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        result.views.memberApplication = { ...metrics, screenshot: shotPath };
      } else {
        result.views.memberApplication = { error: '新規入会ボタンが見つかりません' };
      }
    } catch (e) {
      result.views.memberApplication = { error: String(e) };
    }

    // VIEW: noticeDialog — open within member application
    try {
      const clicked = await frame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find((b) => (b.innerText || '').includes('重要事項を確認する'));
        if (target) { target.click(); return true; }
        return false;
      });
      if (clicked) {
        await page.waitForTimeout(700);
        const metrics = await collectMetrics(frame, page, vp.width);
        // Additional check: footer reachable?
        const dialogCheck = await frame.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return { dialogFound: false };
          const r = dialog.getBoundingClientRect();
          const buttons = Array.from(dialog.querySelectorAll('button'));
          const buttonInfo = buttons.map((b) => {
            const br = b.getBoundingClientRect();
            return { text: (b.innerText || '').trim().slice(0, 30), top: Math.round(br.top), bottom: Math.round(br.bottom), inViewport: br.bottom <= window.innerHeight + 1 };
          });
          const footerBtn = buttons.find((b) => (b.innerText || '').includes('内容を確認して閉じる'));
          let footerReachable = false;
          if (footerBtn) {
            // Scroll body to bottom
            const body = dialog.querySelector('div.overflow-y-auto');
            if (body) body.scrollTop = body.scrollHeight;
            const fr = footerBtn.getBoundingClientRect();
            footerReachable = fr.bottom <= window.innerHeight + 1 && fr.top >= 0;
          }
          return {
            dialogFound: true,
            dialogTop: Math.round(r.top), dialogBottom: Math.round(r.bottom),
            innerHeight: window.innerHeight,
            buttons: buttonInfo,
            footerReachable,
          };
        });
        const shotPath = path.join(SHOTS_DIR, `${vp.name}__03_noticeDialog.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        result.views.noticeDialog = { ...metrics, dialogCheck, screenshot: shotPath };
      } else {
        result.views.noticeDialog = { error: 'モーダル起動ボタンが見つかりません' };
      }
    } catch (e) {
      result.views.noticeDialog = { error: String(e) };
    }
  } catch (e) {
    result.fatal = String(e);
  } finally {
    await context.close();
  }
  return result;
}

function score(metrics) {
  if (!metrics || metrics.error) return { pass: false, fails: ['load-error'] };
  const fails = [];
  if (metrics.hasHorizontalScroll) fails.push(`C1 横スクロール(+${metrics.horizontalOverflow}px)`);
  if (metrics.tapTargetsBelow24.length > 0) fails.push(`C2 24px未満タップターゲット ${metrics.tapTargetsBelow24.length}件`);
  if (metrics.tapTargetsBelow44.length > 0) fails.push(`C3 44px未満タップターゲット ${metrics.tapTargetsBelow44.length}件 (推奨)`);
  if (metrics.overflowingElements.length > 0) fails.push(`C7 オーバーフロー要素 ${metrics.overflowingElements.length}件`);
  return { pass: fails.filter((f) => !f.includes('(推奨)')).length === 0, fails };
}

async function main() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  const consoleErrors = [];
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of VIEWPORTS) {
    process.stderr.write(`[test] ${vp.name} (${vp.width}x${vp.height}) ...\n`);
    const r = await runViewport(browser, vp, consoleErrors);
    results.push(r);
  }
  await browser.close();

  await fs.writeFile(path.join(OUT_DIR, 'result.json'), JSON.stringify({ portalUrl: PORTAL_URL, generated: new Date().toISOString(), results, consoleErrors }, null, 2));

  // Generate Markdown report
  const md = [];
  md.push(`# レスポンシブ テストレポート`);
  md.push(``);
  md.push(`- 実施日時: ${new Date().toISOString()}`);
  md.push(`- 対象 URL: ${PORTAL_URL}`);
  md.push(`- ツール: Playwright (chromium, headless) ${'v' + (await import('playwright/package.json', { with: { type: 'json' } })).default.version}`);
  md.push(`- 基準: WCAG 2.2 (Reflow §1.4.10 / Target Size §2.5.5/§2.5.8) + Apple HIG 44×44 + 2026 best practice`);
  md.push(``);
  md.push(`## 合否サマリ`);
  md.push(``);
  md.push(`| Viewport | ホーム | 入会申込 | モーダル | コメント |`);
  md.push(`|---|---|---|---|---|`);
  for (const r of results) {
    const home = score(r.views.home);
    const app = score(r.views.memberApplication);
    const dlg = score(r.views.noticeDialog);
    const dlgExtra = r.views.noticeDialog?.dialogCheck;
    let comment = '';
    if (r.fatal) comment = `致命的エラー: ${r.fatal.slice(0, 80)}`;
    else if (dlgExtra && dlgExtra.dialogFound === false) comment = 'モーダル未表示（テストスキップ）';
    md.push(`| **${r.vp}** | ${home.pass ? '✅' : '❌'} | ${app.pass ? '✅' : '❌'} | ${dlg.pass ? '✅' : '❌'} | ${comment} |`);
  }
  md.push(``);
  md.push(`## ビューポート別詳細`);
  for (const r of results) {
    md.push(``);
    md.push(`### ${r.vp} (${r.width}×${r.height})`);
    if (r.fatal) {
      md.push(`- ❌ Fatal: \`${r.fatal}\``);
      continue;
    }
    for (const [viewId, m] of Object.entries(r.views)) {
      md.push(``);
      md.push(`**${viewId}**`);
      if (m.error) {
        md.push(`- スキップ: ${m.error}`);
        continue;
      }
      const s = score(m);
      md.push(`- scrollWidth/clientWidth: ${m.scrollWidth}/${m.clientWidth} (差 ${m.horizontalOverflow}px)`);
      md.push(`- tap targets: ${m.tapTargetTotal} 件, <24px: ${m.tapTargetsBelow24.length}, <44px: ${m.tapTargetsBelow44.length}`);
      md.push(`- overflow elements: ${m.overflowingElements.length}`);
      if (m.dialogCheck) {
        const dc = m.dialogCheck;
        if (dc.dialogFound) {
          md.push(`- dialog: top=${dc.dialogTop}, bottom=${dc.dialogBottom}, innerHeight=${dc.innerHeight}, footerReachable=${dc.footerReachable ? '✅' : '❌'}`);
        } else {
          md.push(`- dialog: 未表示`);
        }
      }
      md.push(`- 判定: ${s.pass ? '✅ PASS' : '❌ FAIL'}${s.fails.length ? ' — ' + s.fails.join(' / ') : ''}`);
      md.push(`- screenshot: \`${m.screenshot}\``);
      if (m.tapTargetsBelow44.length > 0 && m.tapTargetsBelow44.length <= 8) {
        md.push(`  - 44px未満タップターゲット詳細:`);
        for (const t of m.tapTargetsBelow44.slice(0, 8)) {
          md.push(`    - \`${t.tag}\` ${t.w}×${t.h}px "${t.text}"`);
        }
      }
    }
  }
  md.push(``);
  md.push(`## コンソールエラー`);
  if (consoleErrors.length === 0) md.push(`- なし ✅`);
  else for (const e of consoleErrors) md.push(`- [${e.vp}] ${e.text}`);

  await fs.writeFile(path.join(OUT_DIR, 'report.md'), md.join('\n'));
  // v376.71: fatal（画面に到達できない）でも exit 0 で終わっていたため、ログだけ見ると
  // PASS と誤読できた。admin / member と同じく終了コードで落とす。
  const fatals = results.filter((r) => r.fatal);
  if (fatals.length) {
    console.error('[test] FAIL: ' + fatals.length + '/' + results.length + ' viewport が fatal。先頭: ' + fatals[0].fatal);
    process.exit(1);
  }
  process.stderr.write(`[test] done. results=${results.length}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
