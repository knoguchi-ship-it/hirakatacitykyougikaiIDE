#!/usr/bin/env node
// Non-destructive browser verification for mail-settings UI. UI literals use
// Unicode escapes to keep this executable stable regardless of shell encoding.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';
const STATE = '.test-out/auth-admin.json';
const OUT_DIR = 'output/playwright';
const RESULT_PATH = path.join(OUT_DIR, 'mail-settings-e2e.json');
const LABELS = {
  settings: '\u30b7\u30b9\u30c6\u30e0\u8a2d\u5b9a',
  mail: '\u30e1\u30fc\u30eb\u901a\u77e5',
  receipt: '\u7533\u8acb\u53d7\u4ed8\u6642\uff1a\u53d7\u4ed8\u78ba\u8a8d\u30e1\u30fc\u30eb',
  template: '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u7ba1\u7406',
  // The card renders this exact label; the previous literal never existed in the UI.
  sharedSender: '\u81ea\u52d5\u901a\u77e5\u306e\u9001\u4fe1\u5143\u30a2\u30c9\u30ec\u30b9\uff08\u5171\u901a\uff09',
};

// Tab buttons render their label together with a sub caption, e.g.
// "メール通知 入会メール・事業所メール". Exact matching missed them and reported a
// structural FAIL, so callers can opt into prefix matching.
async function visibleButton(frame, text, loose = false) {
  return frame.evaluate(([label, isLoose]) => Array.from(document.querySelectorAll('button')).some((button) => {
    const rect = button.getBoundingClientRect();
    const value = (button.innerText || '').trim();
    const hit = isLoose ? value.startsWith(label) : value === label;
    return rect.width > 0 && rect.height > 0 && hit;
  }), [text, loose]);
}

async function waitForButton(frame, page, text, seconds = 40, loose = false) {
  for (let attempt = 0; attempt < seconds; attempt += 1) {
    if (await visibleButton(frame, text, loose)) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function waitForText(frame, page, text, seconds = 30) {
  for (let attempt = 0; attempt < seconds; attempt += 1) {
    const seen = await frame.evaluate((needle) => String(document.body?.innerText || '').includes(needle), text);
    if (seen) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function clickButton(frame, text, loose = false) {
  return frame.evaluate(([label, isLoose]) => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => {
      const value = (item.innerText || '').trim();
      return isLoose ? value.startsWith(label) : value === label;
    });
    if (!button) return false;
    button.click();
    return true;
  }, [text, loose]);
}

async function getAdminFrame(page) {
  const matcher = /\u7ba1\u7406|\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9|admin|\u8a2d\u5b9a/;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(500);
    for (const frame of page.frames()) {
      try {
        const text = await frame.evaluate(() => String(document.body?.innerText || '').slice(0, 400));
        if (text.length > 20 && matcher.test(text)) return frame;
      } catch { /* frame was navigating */ }
    }
  }
  throw new Error('Admin app frame is unavailable within the non-destructive test timeout.');
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  try { await fs.access(STATE); } catch {
    throw new Error('Admin browser storageState is unavailable.');
  }

  const result = { generatedAt: new Date().toISOString(), portal: 'admin', nonDestructive: true, cases: [], consoleErrors: [] };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: STATE });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(String(message.text()).slice(0, 240));
  });

  try {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const frame = await getAdminFrame(page);
    await page.waitForTimeout(1200);

    if (!(await visibleButton(frame, LABELS.settings))) {
      const expanded = await clickButton(frame, '\u30b7\u30b9\u30c6\u30e0');
      if (expanded) await page.waitForTimeout(200);
    }
    const openedSettings = await clickButton(frame, LABELS.settings);
    result.cases.push({ id: 'E2E-01', name: 'Open system settings', pass: openedSettings });
    if (!openedSettings) throw new Error('System settings navigation is unavailable.');
    // The settings console renders after a GAS round-trip (1.8-5s per HANDOVER 12.6).
    // A fixed wait produced false FAILs, so wait for the mail tab to actually appear.
    await waitForButton(frame, page, LABELS.mail, 40, true);

    const openedMail = await clickButton(frame, LABELS.mail, true);
    result.cases.push({ id: 'E2E-02', name: 'Open mail settings', pass: openedMail });
    if (!openedMail) throw new Error('Mail settings tab is unavailable.');
    await waitForText(frame, page, LABELS.receipt);

    // Every ancestor div also "contains" the receipt label, and its first
    // <details> belongs to another card. Pick the smallest matching container.
    await frame.evaluate(() => {
      window.pickReceiptCard = (receipt) => Array.from(document.querySelectorAll('div'))
        .filter((el) => (el.textContent || '').includes(receipt) && !!el.querySelector('details'))
        .sort((x, y) => (x.textContent || '').length - (y.textContent || '').length)[0] || null;
    });

    // The template manager inside the OFF card is rendered only after the
    // disclosure is opened, so open it first (read-only interaction).
    await frame.evaluate((labels) => {
      const card = pickReceiptCard(labels.receipt);
      const details = card ? card.querySelector('details') : null;
      const summary = details ? details.querySelector('summary') : null;
      if (summary) summary.click();
    }, LABELS);
    await waitForText(frame, page, LABELS.template, 20);

    const uiChecks = await frame.evaluate((labels) => {
      const card = pickReceiptCard(labels.receipt);
      const details = card ? card.querySelector('details') : null;
      const summary = details ? details.querySelector('summary') : null;
      return {
        cardFound: !!card,
        detailFound: !!details && !!summary,
        // A collapsed <details> exposes only its summary through innerText, so the
        // template manager must be looked up in the DOM text, not the rendered text.
        templateInDetail: !!details && (details.textContent || '').includes(labels.template),
        senderLabel: (document.body.innerText || '').includes(labels.sharedSender),
      };
    }, LABELS);
    result.cases.push({ id: 'E2E-03', name: 'Receipt card remains editable while OFF', pass: uiChecks.cardFound && uiChecks.detailFound });
    result.cases.push({ id: 'E2E-04', name: 'Template manager remains accessible while OFF', pass: uiChecks.templateInDetail });
    result.cases.push({ id: 'E2E-05', name: 'Shared automatic sender label is visible', pass: uiChecks.senderLabel });
  } catch (error) {
    result.fatal = String(error instanceof Error ? error.message : error);
  } finally {
    await context.close();
    await browser.close();
  }

  result.passed = !result.fatal && result.cases.length === 5 && result.cases.every((item) => item.pass) && result.consoleErrors.length === 0;
  await fs.writeFile(RESULT_PATH, JSON.stringify(result, null, 2), 'utf8');
  if (!result.passed) process.exitCode = 1;
}

main().catch(async (error) => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(RESULT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), passed: false, fatal: String(error), nonDestructive: true }, null, 2), 'utf8');
  process.exitCode = 1;
});
