import { chromium } from 'playwright';
const URL = 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
console.log('navigating member...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(25000);
for (const f of page.frames()) {
  let info = { url: f.url().slice(0, 100) };
  try {
    info.body = await f.evaluate(() => {
      const t = (document.body && document.body.innerText || '');
      return { len: t.length, snippet: t.slice(0, 300) };
    });
  } catch (e) { info.error = String(e).slice(0, 100); }
  console.log(JSON.stringify(info, null, 2));
}
await browser.close();
