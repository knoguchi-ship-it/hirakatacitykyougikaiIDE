// scripts/test-thumbnail-e2e.mjs
// v349: End-to-end Playwright test for the PDF thumbnail pipeline.
//
// Prereq:
//   - npx playwright install chromium  (one-time)
//   - .test-out/auth-admin.json present and valid
//     (run `node scripts/auth-bootstrap-admin.mjs` if expired)
//
// Run: node scripts/test-thumbnail-e2e.mjs

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getAppFrame } from './responsive-core.mjs';

const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';
const ADMIN_STATE = '.test-out/auth-admin.json';
const OUT_DIR = '.test-out';
const TEST_PDF_PATH = path.join(OUT_DIR, 'thumbnail-test.pdf');
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots-thumbnail');

// -----------------------------------------------------------------------------
// Build a tiny but properly cross-referenced 1-page PDF with one text line.
// -----------------------------------------------------------------------------
function buildMinimalPdf(text) {
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const objs = [];
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objs.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  objs.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  const stream = 'BT /F1 48 Tf 60 720 Td (' + text.replace(/[()\\]/g, (m) => '\\' + m) + ') Tj ET\n';
  objs.push(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);

  // Compute offsets
  const offsets = [0];
  let cur = Buffer.byteLength(header, 'latin1');
  for (const o of objs) {
    offsets.push(cur);
    cur += Buffer.byteLength(o, 'latin1');
  }
  const xrefStart = cur;
  let xref = `xref\n0 ${objs.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= objs.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(header + objs.join('') + xref + trailer, 'latin1');
}

// -----------------------------------------------------------------------------
async function ensurePdf() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const buf = buildMinimalPdf('v349 thumbnail e2e');
  await fs.writeFile(TEST_PDF_PATH, buf);
  return TEST_PDF_PATH;
}

async function shot(page, label) {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  const p = path.join(SHOTS_DIR, `${Date.now()}_${label}.png`);
  try { await page.screenshot({ path: p, fullPage: false }); } catch {}
  return p;
}

async function clickInFrame(frame, label, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await frame.evaluate((l) => {
      const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const t = cands.find((b) => (b.innerText || '').trim() === l || (b.innerText || '').includes(l));
      if (t) { t.click(); return true; }
      return false;
    }, label);
    if (ok) return true;
    await frame.waitForTimeout(300);
  }
  return false;
}

async function expandSidebarGroup(frame, groupLabel) {
  await frame.evaluate((g) => {
    const cands = Array.from(document.querySelectorAll('button'));
    const header = cands.find((b) => (b.innerText || '').trim() === g);
    if (header) header.click();
  }, groupLabel);
  await frame.waitForTimeout(400);
}

// -----------------------------------------------------------------------------
async function run() {
  const pdfPath = await ensurePdf();
  console.log(`[setup] test PDF written to ${pdfPath} (${(await fs.stat(pdfPath)).size} bytes)`);

  let stateExists = true;
  try { await fs.access(ADMIN_STATE); } catch { stateExists = false; }
  if (!stateExists) {
    throw new Error(`Missing ${ADMIN_STATE}. Run: node scripts/auth-bootstrap-admin.mjs`);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: ADMIN_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ja-JP',
  });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    const t = msg.text();
    if (/thumbnail|getFileThumbnail|uploadTraining/i.test(t)) {
      console.log(`[browser-console] ${msg.type()}: ${t}`);
    }
  });

  console.log(`[admin] navigating to ${ADMIN_URL}`);
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const frame = await getAppFrame(page, /管理|ダッシュボード|研修管理/);
  await shot(page, 'after-load');

  // Expand the 研修・通知 group and click 研修管理
  await expandSidebarGroup(frame, '研修・通知');
  if (!await clickInFrame(frame, '研修管理')) {
    await shot(page, 'no-training-nav');
    throw new Error('"研修管理" nav not found');
  }
  console.log('[admin] opened 研修管理 — waiting for data load');

  // Wait for the training-management data to finish loading (the loading
  // spinner says "研修管理データを読み込み中です..."). 最大 60 秒。
  let loaded = false;
  for (let i = 0; i < 60; i++) {
    await frame.waitForTimeout(1000);
    const probe = await frame.evaluate(() => {
      const txt = document.body.innerText || '';
      const stillLoading = /読み込み中/.test(txt);
      const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const hasNewBtn = cands.some((b) => /新規登録|新規作成|新しい研修/.test((b.innerText || '').trim()));
      return { stillLoading, hasNewBtn, len: txt.length };
    });
    if (!probe.stillLoading && probe.hasNewBtn) { loaded = true; break; }
    if (i % 5 === 0) console.log(`  [load probe ${i}s] stillLoading=${probe.stillLoading} hasNewBtn=${probe.hasNewBtn}`);
  }
  await shot(page, 'training-manage');
  if (!loaded) {
    await shot(page, 'training-load-timeout');
    throw new Error('Training management did not finish loading within 60s');
  }

  const opened = await frame.evaluate(() => {
    const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const t = cands.find((b) => /新規登録|新規作成|新しい研修/.test((b.innerText || '').trim()));
    if (t) { t.click(); return true; }
    return false;
  });
  if (!opened) {
    await shot(page, 'no-new-button');
    throw new Error('"新規登録" button not found');
  }
  console.log('[admin] opened new-training form');
  await frame.waitForTimeout(1500);
  await shot(page, 'new-form');

  // Locate the file input for guidePdfUrl (it's hidden behind a <label>)
  const fileInputHandle = await frame.evaluateHandle(() => {
    return document.querySelector('input[type="file"][accept*="pdf"]') ||
           document.querySelector('input[type="file"]');
  });
  if (!fileInputHandle) {
    await shot(page, 'no-file-input');
    throw new Error('file input not found');
  }
  const inputEl = fileInputHandle.asElement();
  if (!inputEl) {
    await shot(page, 'file-input-not-element');
    throw new Error('file input handle is not an element');
  }
  console.log('[admin] uploading test PDF...');
  await inputEl.setInputFiles(pdfPath);

  // Wait for the upload button label to show "アップロード中" then the thumbnail
  // preview to render. The flow is: upload triggers, server runs uploadTrainingFile_
  // which spends ~10-15s, then returns { url, thumbnailUrl }. The form should
  // render <PdfThumbnail thumbnailUrl=... /> which fetches base64 from server.
  const start = Date.now();
  let status = 'pending';
  let observedThumbnailUrl = '';
  for (let i = 0; i < 60; i++) {
    await frame.waitForTimeout(2000);
    const probe = await frame.evaluate(() => {
      // Look for "アップロード中" label state, "サムネイル..." text, and any <img>
      // with data: src (rendered by PdfThumbnail when fetchThumbnail resolves).
      const txt = document.body.innerText || '';
      const uploading = /アップロード中/.test(txt);
      const sampleNameVisible = /thumbnail-test\.pdf/.test(txt);
      const imgs = Array.from(document.querySelectorAll('img'));
      const dataImg = imgs.find((img) => /^data:image\//.test(img.src));
      return {
        uploading,
        sampleNameVisible,
        hasDataImg: !!dataImg,
        dataImgLen: dataImg ? dataImg.src.length : 0,
        txtSample: txt.slice(0, 200),
      };
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[probe ${elapsed}s] uploading=${probe.uploading} sampleVisible=${probe.sampleNameVisible} hasDataImg=${probe.hasDataImg} (img bytes=${probe.dataImgLen})`);
    if (probe.hasDataImg && probe.dataImgLen > 1000) {
      status = 'thumbnail-visible';
      break;
    }
    if (!probe.uploading && probe.sampleNameVisible && i > 5) {
      // Upload finished but no thumbnail data img yet — keep waiting a few more cycles.
      // PdfThumbnail useEffect should be firing the fetch.
    }
  }
  await shot(page, status);

  if (status !== 'thumbnail-visible') {
    console.log('[FAIL] Thumbnail did NOT render within 120 seconds.');
    console.log('See screenshots in', SHOTS_DIR);
    process.exitCode = 1;
  } else {
    console.log(`[OK] Thumbnail rendered after ~${((Date.now() - start) / 1000).toFixed(1)}s.`);
  }

  await browser.close();
}

run().catch((e) => {
  console.error('[FATAL]', e.message);
  process.exit(2);
});
