// 会員種別ごとに「公開ポータルの本人確認に使える項目」がどれだけ埋まっているかを数える。
//
// 個人情報は一切出力しない。件数だけを出す（AGENTS §0）。集計はブラウザ内で行い、
// 会員レコードそのものはこちらへ持ち出さない。
//
// Run: node scripts/diagnose-identity-coverage.mjs
import { chromium } from 'playwright';
import { getAppFrame } from './responsive-core.mjs';

const STATE = '.test-out/auth-admin.json';
const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE });
const page = await context.newPage();
await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
await page.waitForTimeout(4000);

const result = await frame.evaluate(() => new Promise((resolve) => {
  const done = (v) => resolve(v);
  if (typeof google === 'undefined' || !google.script) return done({ error: 'google.script が無い' });
  google.script.run
    .withSuccessHandler((raw) => {
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return done({ error: 'JSON パース失敗' }); }
      if (!parsed.success) return done({ error: parsed.error || 'API エラー' });
      const data = parsed.data || {};
      const members = data.persons || data.rows || data.people || data.memberRows || (Array.isArray(data) ? data : []);
      if (!Array.isArray(members) || !members.length) {
        return done({ error: '会員配列が取れない', topKeys: Object.keys(data).slice(0, 30) });
      }
      // 値が入っているかだけを見る。値そのものは返さない。
      const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';
      const FIELDS = ['careManagerNumber',
        'email', 'phone', 'mobilePhone', 'officePostCode', 'homePostCode', 'officeName', 'kana', 'displayName'];
      const byType = {};
      for (const m of members) {
        const t = (m.personType || m.memberType || 'UNKNOWN') + (m.staffId ? '(職員)' : '');
        byType[t] = byType[t] || { 件数: 0 };
        byType[t].件数 += 1;
        for (const key of FIELDS) {
          if (!(key in m)) continue;
          byType[t][key] = byType[t][key] || 0;
          if (has(m[key])) byType[t][key] += 1;
        }
      }
      done({ byType, sampleKeys: Object.keys(members[0]).sort() });
    })
    .withFailureHandler((e) => done({ error: String(e && e.message ? e.message : e) }))
    .processApiRequest('getAdminPersonList', JSON.stringify({}));
}));

if (result.error) {
  console.error('取得できませんでした:', result.error);
  if (result.topKeys) console.error('data のキー:', result.topKeys.join(', '));
} else {
  console.log('会員レコードの項目名:\n  ' + result.sampleKeys.join(', '));
  console.log('\n種別ごとの「埋まっている件数 / 全件」:');
  for (const [type, counts] of Object.entries(result.byType)) {
    const total = counts.件数;
    const parts = Object.entries(counts).filter(([k]) => k !== '件数')
      .map(([k, v]) => `${k}=${v}/${total}`);
    console.log(`  ${type} (${total} 件)\n    ${parts.join('  ')}`);
  }
}
await browser.close();
