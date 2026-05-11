// Diagnose: find which frame holds the React app body content.
import { chromium } from 'playwright';
const URL = 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
console.log('navigating...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
console.log('waiting 25s for content to load...');
await page.waitForTimeout(25000);
for (const f of page.frames()) {
  let info = { url: f.url().slice(0, 100) };
  try {
    info.body = await f.evaluate(() => {
      const t = (document.body && document.body.innerText || '');
      return { len: t.length, snippet: t.slice(0, 200), childNodes: document.body ? document.body.children.length : -1 };
    });
  } catch (e) { info.error = String(e).slice(0, 100); }
  console.log(JSON.stringify(info, null, 2));
}
await browser.close();
