// One-time manual login for admin portal.
// Run: node scripts/auth-bootstrap-admin.mjs
// Output: .test-out/auth-admin.json (gitignored)
//
// Flow:
//   1. Launches Chromium with a visible window.
//   2. You log into Google with k.noguchi@hcm-n.org and reach the admin portal.
//   3. When the page shows admin UI (sidebar with 会員管理 etc.), press ENTER
//      in this terminal to save the session state and exit.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import readline from 'node:readline';

const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';

const OUT = '.test-out/auth-admin.json';

await fs.mkdir('.test-out', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

console.log('---');
console.log('Admin auth bootstrap');
console.log('1. A browser window will open.');
console.log('2. Log in with k.noguchi@hcm-n.org and wait until the admin portal renders.');
console.log('3. Come back to this terminal and press ENTER to save the session.');
console.log('---');

await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await new Promise(resolve => rl.question('Press ENTER once you have logged in and the admin UI is visible: ', () => { rl.close(); resolve(); }));

await context.storageState({ path: OUT });
console.log(`Saved session state → ${OUT}`);
await browser.close();
