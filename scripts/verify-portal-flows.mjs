// ポータル 3 フロー（入会 / 登録情報変更 / 退会）の実地検証ハーネス。
//
// 使い方:
//   node scripts/verify-portal-flows.mjs read-settings [タブ名]
//     管理コンソールの「システム設定」を開いて中身を読む。書き込みはしない。
//     タブ名の例: メール通知 / 公開ポータル / 規程・重要事項
//
// storageState は scripts/auth-bootstrap-admin.mjs が作る .test-out/auth-admin.json を使う。
import { chromium } from 'playwright';
import { getAppFrame } from './responsive-core.mjs';

const STATE = '.test-out/auth-admin.json';
const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';

// 設定画面で拾いたいラベル。値そのものではなく、周辺テキストを塊で取って目視できる形にする。
const WATCH = ['メール', '配信モード', '一斉停止', '退会', '登録情報変更'];

async function openAdmin() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // GAS の二重 iframe に由来する report-only CSP はアプリの不具合ではない
    if (/report-only Content Security Policy/i.test(t) && /frame-ancestors/i.test(t)) return;
    errors.push(t.slice(0, 200));
  });
  // ダイアログは必ず記録する。v376.86 では記録せず握りつぶしたため保存失敗を見逃した。
  // confirm は「承認しますか？」など操作の一部なので accept する（dismiss すると
  // 押したはずの操作が取り消され、成功したつもりで何も起きない）。
  page.on('dialog', async (d) => {
    errors.push(`DIALOG(${d.type()}): ${d.message().slice(0, 300)}`);
    await d.accept();
  });
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
  await page.waitForTimeout(2500);
  return { browser, page, frame, errors };
}

async function clickByText(frame, label) {
  return await frame.evaluate((l) => {
    const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const t = cands.find((b) => (b.innerText || '').trim() === l)
      || cands.find((b) => (b.innerText || '').includes(l));
    if (t) { t.click(); return true; }
    return false;
  }, label);
}

// システム設定はタブ構成（基本設定 / 会費設定 / 規程・重要事項 / 帳票出力 /
// メール通知 / 公開ポータル / マスタ管理）。タブ名を渡してその中身を読む。
async function readSettings(tab) {
  const { browser, page, frame, errors } = await openAdmin();
  await clickByText(frame, 'システム');
  await page.waitForTimeout(400);
  const ok = await clickByText(frame, 'システム設定');
  console.log('システム設定を開いた:', ok);
  await page.waitForTimeout(3000);
  if (tab) {
    const t = await clickByText(frame, tab);
    console.log(`タブ「${tab}」を開いた:`, t);
    await page.waitForTimeout(2500);
  }

  // 設定画面はセクションが多い。まず見出しを出し、次に入力要素を全部（絞らず）書き出す。
  // 絞り込みで探し物を取りこぼすより、量が出ても全体を見たほうが速い。
  const dump = await frame.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,summary,[role="tab"],button'))
      .map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim())
      .filter((t) => t && t.length <= 40);
    const fields = [];
    for (const el of Array.from(document.querySelectorAll('input, select, textarea'))) {
      const r = el.getBoundingClientRect();
      const wrap = el.closest('label') || el.parentElement;
      const near = ((wrap && wrap.innerText) || '').replace(/\s+/g, ' ').trim().slice(0, 90);
      const value = el.type === 'checkbox' ? String(el.checked) : String(el.value || '').slice(0, 60);
      fields.push({ near, name: el.name || el.id || '', type: el.type || el.tagName.toLowerCase(), value, visible: r.width > 0 && r.height > 0 });
    }
    return { headings: Array.from(new Set(headings)), fields };
  });

  console.log('--- セクション/ボタン ---');
  console.log('  ' + dump.headings.join(' | '));
  console.log(`--- 入力要素 ${dump.fields.length} 件 ---`);
  for (const f of dump.fields) console.log(`  [${f.type}]${f.visible ? '' : '(非表示)'} ${f.value}  ← ${f.near || f.name}`);
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
  await browser.close();
}

// 公開ポータルのメニュー表示トグルを 1 つだけ切り替えて保存する。
// 検証のために一時的に開け、終わったら必ず元へ戻すこと。
async function setPortalToggle(labelPart, desired) {
  const { browser, page, frame, errors } = await openAdmin();
  await clickByText(frame, 'システム');
  await page.waitForTimeout(400);
  await clickByText(frame, 'システム設定');
  await page.waitForTimeout(3000);
  await clickByText(frame, '公開ポータル');
  // 設定の読込が終わる前に押すと、直後に来た値で上書きされてトグルが戻る。
  await page.waitForTimeout(8000);

  const before = await frame.evaluate((lp) => {
    for (const el of Array.from(document.querySelectorAll('input[type=checkbox]'))) {
      const near = ((el.closest('label') || el.parentElement)?.innerText || '');
      if (near.includes(lp)) return el.checked;
    }
    return null;
  }, labelPart);
  console.log(`現在値「${labelPart}」:`, before);
  if (before === null) { console.error('トグルが見つかりません'); await browser.close(); process.exit(1); }
  if (before === desired) { console.log('既に目的の値です。何もしません。'); await browser.close(); return; }

  // ToggleSwitch の input は sr-only。DOM の el.click() では React の onChange に
  // 届かないことがあるため、Playwright に本物のクリックを撃たせる（force で可視性判定を回避）。
  await frame.locator('label').filter({ hasText: labelPart }).first().click({ force: true });
  await page.waitForTimeout(1200);
  const afterClick = await frame.evaluate((lp) => {
    for (const el of Array.from(document.querySelectorAll('input[type=checkbox]'))) {
      const near = ((el.closest('label') || el.parentElement)?.innerText || '');
      if (near.includes(lp)) return el.checked;
    }
    return null;
  }, labelPart);
  console.log('クリック直後の値:', afterClick);
  if (afterClick === before) { console.error('トグルが反応していません。保存せず中止します。'); await browser.close(); process.exit(1); }

  const clicked = await clickByText(frame, '設定を保存');
  console.log('「設定を保存」を押した:', clicked);
  // GAS は 1 呼び出しあたり 1.8〜5s の固定オーバーヘッド。保存完了まで余裕を持って待つ。
  await page.waitForTimeout(25000);

  const after = await frame.evaluate((lp) => {
    for (const el of Array.from(document.querySelectorAll('input[type=checkbox]'))) {
      const near = ((el.closest('label') || el.parentElement)?.innerText || '');
      if (near.includes(lp)) return el.checked;
    }
    return null;
  }, labelPart);
  const body = await frame.locator('body').innerText();
  console.log(`保存後の値:`, after);
  console.log('未保存の帯が残っているか:', body.includes('未保存の変更があります'));
  console.log('console errors:', errors.length ? errors : 'なし');
  await browser.close();
}

// 会員一覧でテスト会員を検索し、本人確認に必要な項目を読む。読み取りのみ。
async function findMember(query, openDetail) {
  const { browser, page, frame, errors } = await openAdmin();
  await clickByText(frame, '会員管理');
  await page.waitForTimeout(400);
  await clickByText(frame, '会員一覧');
  await page.waitForTimeout(4000);

  const inputs = await frame.evaluate(() => Array.from(document.querySelectorAll('input, select'))
    .map((el) => `${el.type || el.tagName}|ph=${el.placeholder || ''}|near=${((el.closest('label') || el.parentElement)?.innerText || '').replace(/\s+/g, ' ').slice(0, 50)}`));
  console.log('--- 入力要素 ---\n  ' + inputs.join('\n  '));

  // 会員状態の既定は「在籍中」。退会予定になった会員は既定のままだと消えて
  // 「該当データなし」になるので、全状態にしてから検索する。
  const statusSelect = frame.locator('select').filter({ hasText: '退会予定' }).first();
  // 「全状態」の value は空文字とは限らないので、ラベルで選ぶ。
  if (await statusSelect.count()) await statusSelect.selectOption({ label: '全状態' });

  // 会員種別で絞りたいとき（例: 賛助会員だけ見る）
  const typeArg = process.argv.find((a) => a.startsWith('--type='));
  if (typeArg) {
    const typeSelect = frame.locator('select').filter({ hasText: '賛助会員' }).first();
    if (await typeSelect.count()) await typeSelect.selectOption({ label: typeArg.slice(7) });
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(2500);

  // placeholder で狙う。'input[type=text]' の先頭指定は、再描画のたびに掴み直しが
  // 起きて fill がタイムアウトした。
  const box = frame.getByPlaceholder(/キーワード|会員番号/).first();
  await box.click({ force: true });
  await box.type(query, { delay: 40 });
  await page.waitForTimeout(5000);

  const text = await frame.locator('body').innerText();
  const start = text.indexOf(query);
  console.log(start >= 0 ? text.slice(Math.max(0, start - 400), start + 900) : '(該当なし)\n' + text.slice(0, 800));

  if (openDetail) {
    // 行クリックで詳細へ。本人確認に必要な番号は一覧に出ないため詳細を開く。
    // getByText だと検索ボックスの入力値を掴んでしまうので、表の行を狙う。
    const row = frame.locator('tr').filter({ hasText: openDetail }).first();
    console.log('行が見つかった数:', await frame.locator('tr').filter({ hasText: openDetail }).count());
    await row.click();
    // 詳細は GAS 往復を伴うので長めに待つ
    await page.waitForTimeout(15000);
    // 事業所番号などは input の value なので innerText には出ない。値を直接読む。
    const detailFields = await frame.evaluate(() => Array.from(document.querySelectorAll('input, select'))
      .filter((el) => el.type !== 'checkbox' && el.type !== 'radio')
      .map((el) => {
        const near = ((el.closest('label') || el.parentElement)?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return `${near || el.placeholder || el.name} = ${String(el.value || '').slice(0, 60)}`;
      })
      .filter((line) => !/^ *=/.test(line)));
    console.log('\n--- 詳細の入力値 ---\n  ' + detailFields.join('\n  '));

    // 検証で退会予定にした会員を在籍中へ戻すための後片付け。
    if (process.argv.includes('--cancel-withdrawal')) {
      const btn = frame.getByRole('button', { name: '退会をキャンセルする' });
      if (await btn.count()) {
        await btn.first().click();
        await page.waitForTimeout(25000);
        console.log('退会キャンセル後の状態:',
          await frame.locator('select').filter({ hasText: '退会予定' }).last().inputValue());
      } else {
        console.log('「退会をキャンセルする」ボタンが無い（すでに在籍中か、対象外の種別）');
      }
    }
  }
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
  await browser.close();
}

// 変更申請管理コンソールを開いて、届いている申請を読む。読み取りのみ。
async function readChangeRequests() {
  const { browser, page, frame, errors } = await openAdmin();
  // グループ見出しの '会員管理' は開閉トグル。すでに葉が見えているなら押さない
  // （押すと畳んでしまい、遷移できたつもりで一覧のまま進む）。
  const clicked = await clickByText(frame, '変更申請管理');
  console.log('「変更申請管理」を押した:', clicked);
  await page.waitForTimeout(15000);

  // 「▼ 変更内容を確認」は畳まれている。開かないと何を申請したのか分からない。
  for (const t of await frame.getByText('変更内容を確認').all()) {
    try { await t.click(); await page.waitForTimeout(600); } catch { /* 開けないものは飛ばす */ }
  }
  await page.waitForTimeout(1500);

  const text = await frame.locator('body').innerText();
  console.log('この画面は変更申請コンソールか:', /承認|却下|申請ID|保留/.test(text));
  const i = text.indexOf('変更申請');
  console.log(text.slice(i >= 0 ? i : 0).replace(/\n{2,}/g, '\n').slice(0, 2500));
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
  await browser.close();
}

// 変更申請を 1 件処理する。action は 'approve' か 'reject'。
// 却下は理由が必須。承認は DB に反映されるので、戻せることを確かめてから使うこと。
async function decideChangeRequest(requestId, action, reason) {
  const { browser, page, frame, errors } = await openAdmin();
  await clickByText(frame, '変更申請管理');
  // 一覧の描画は GAS 往復。固定待ちだと ID が出る前に探しに行って空振りする。
  await frame.getByText(requestId).first().waitFor({ timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log('一覧に申請 ID があるか:', (await frame.locator('body').innerText()).includes(requestId));

  // 申請 ID を含むカードに絞ってからボタンを押す。画面には複数件並ぶため、
  // ボタン名だけで探すと別の申請を処理してしまう。
  // filter({hasText}) は最も内側の div を返すため、ボタンを含む祖先に届かない。
  // 申請 ID を持つ要素から上へ辿り、目的のボタンを含むカードに印を付ける。
  const label = action === 'approve' ? '承認してDBに反映' : '却下';
  const marked = await frame.evaluate(([id, btnLabel]) => {
    const holder = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.textContent.includes(id) && !Array.from(el.children).some((c) => c.textContent.includes(id)))[0];
    if (!holder) return 'no-id';
    let node = holder;
    while (node && node !== document.body) {
      const btn = Array.from(node.querySelectorAll('button')).find((b) => (b.innerText || '').trim() === btnLabel);
      if (btn) { node.setAttribute('data-verify-card', '1'); return 'ok'; }
      node = node.parentElement;
    }
    return 'no-button';
  }, [requestId, label]);
  if (marked !== 'ok') { console.error('申請カードを特定できません:', marked); await browser.close(); process.exit(1); }

  const card = frame.locator('[data-verify-card="1"]');
  if (action === 'reject') {
    await card.locator('textarea, input[type=text]').last().fill(reason || '検証用の申請のため却下');
    await page.waitForTimeout(500);
  }
  await card.getByRole('button', { name: label, exact: true }).last().click();
  await page.waitForTimeout(30000);

  const text = await frame.locator('body').innerText();
  console.log(`「${label}」実行後、申請 ${requestId} が未処理に残っているか:`, text.includes(requestId));
  const i = text.indexOf('変更申請管理');
  console.log(text.slice(i >= 0 ? i : 0).replace(/\n{2,}/g, '\n').slice(0, 1200));
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
  await browser.close();
}

const cmd = process.argv[2] || 'read-settings';
if (cmd === 'read-settings') await readSettings(process.argv[3]);
else if (cmd === 'decide') await decideChangeRequest(process.argv[3], process.argv[4], process.argv[5]);
else if (cmd === 'change-requests') await readChangeRequests();
else if (cmd === 'find-member') await findMember(process.argv[3], process.argv[4]);
else if (cmd === 'set-portal-toggle') await setPortalToggle(process.argv[3], process.argv[4] === 'true');
else { console.error(`unknown command: ${cmd}`); process.exit(1); }
