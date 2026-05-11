// Quick smoke test: open the portal once, dump frames + content.
import { chromium } from 'playwright';

const URL = 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 200)));
page.on('frameattached', f => console.log('[frame+]', f.url()));
page.on('framenavigated', f => console.log('[frame->]', f.url()));

console.log('navigating...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
console.log('top URL:', page.url());

for (let s = 0; s < 30; s++) {
  await page.waitForTimeout(1000);
  const frames = page.frames();
  console.log(`t=${s+1}s frames=${frames.length}`);
  for (const f of frames) console.log('  -', f.url().slice(0, 120));
}

await page.screenshot({ path: '.test-out/smoke.png', fullPage: true });
await browser.close();
console.log('done');
