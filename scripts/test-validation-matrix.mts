/**
 * バリデーション検査表（2026-10-02 新設 / operator 依頼）
 *
 * 「入力・出力・書き換えの制限が仕様書どおりに効いているか」を機械検査する。
 *
 * 方針:
 *   - **実装を文字列照合するのではなく、実際に動かして判定を確かめる。**
 *     gas-src から関数本体を取り出し Node 上で実行し、入力 → 受理/拒否 の表を回す。
 *     文字列照合はコードが「書いてある」ことしか言えず、「効いている」ことは言えない。
 *   - 期待値は `docs/spec/02_RD.md` の BR-xx。本ファイルの各 test 名に BR 番号を書く。
 *   - **仕様と実装が食い違う箇所は skip せず、現状を固定したうえで docs/294 に未達として記録する。**
 *     消すべきは差分であって、検査ではない。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), ...p.split('/')), 'utf8');
const gasSrc = read('gas-src/Code.full.gs');

/**
 * 1 関数の本体を取り出す。
 * 行頭 `}` までで切る。次の `function` までで切ると、間に挟まるトップレベルの
 * `var` 宣言まで巻き込み、未定義の識別子を参照して落ちる。
 */
function fnSource(name: string): string {
  const start = gasSrc.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = gasSrc.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return gasSrc.slice(start, end + 3);
}

/**
 * 次のトップレベル宣言までを 1 関数の本体とみなす。
 * `saveMemberCore_` のような巨大な関数は内部に行頭 `}` を含み、`\n}\n` 探索では途中で切れる。
 */
function extractLargeFunction(name: string): string {
  const start = gasSrc.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const next = gasSrc.indexOf('\nfunction ', start + 1);
  return gasSrc.slice(start, next === -1 ? undefined : next);
}

/** 行コメントを落とす（説明文に書いた語をコード本体と誤認しないため） */
const stripLineComments = (text: string) => text.replace(/^\s*\/\/.*$/gm, '');

// ── 会員保存の検証を実際に動かす ────────────────────────────────────────────
const validateMemberPayload = new Function(`
  ${fnSource('validateMemberPayload_')}
  ${fnSource('isValidCmNumberRelaxed_')}
  ${fnSource('isNoOfficeAffiliation_')}
  var NO_OFFICE_AFFILIATION_LABEL_ = '勤務なし';
  return validateMemberPayload_;
`)() as (p: Record<string, unknown>, type: string, status?: string, opts?: unknown) => void;

type Member = Record<string, unknown>;

/** 検証を通る最小の個人会員。各ケースはここから 1 項目だけ崩す */
const OK_INDIVIDUAL: Member = {
  lastName: '野口', firstName: '太郎', lastKana: 'ノグチ', firstKana: 'タロウ',
  careManagerNumber: '12345678',
  mobilePhone: '090-1234-5678',
  officeName: 'ひらかた介護ステーション',
  preferredMailDestination: 'OFFICE',
  status: 'ACTIVE',
};

function verdict(payload: Member, type = 'INDIVIDUAL', status = 'ACTIVE', opts?: unknown):
  { ok: true } | { ok: false; message: string } {
  try {
    validateMemberPayload(payload, type, status, opts);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 検査表 1 行 */
interface Row {
  br: string;
  what: string;
  patch: Member;
  type?: string;
  /** 'reject' = 拒否されること / 'accept' = 受理されること */
  expect: 'reject' | 'accept';
  /** 仕様では reject だが実装が accept する（既知の未達）。理由を書く */
  gap?: string;
}

const ROWS: Row[] = [
  // ── BR-15 個人会員・賛助会員の必須 ──────────────────────────────────────
  { br: 'BR-15', what: '姓が空', patch: { lastName: '' }, expect: 'reject' },
  { br: 'BR-15', what: '名が空', patch: { firstName: '' }, expect: 'reject' },
  { br: 'BR-15', what: 'セイが空', patch: { lastKana: '' }, expect: 'reject' },
  { br: 'BR-15', what: 'メイが空', patch: { firstKana: '' }, expect: 'reject' },
  { br: 'BR-15', what: '個人会員はCM番号必須', patch: { careManagerNumber: '' }, expect: 'reject' },
  { br: 'BR-15', what: 'CM番号が7桁', patch: { careManagerNumber: '1234567' }, expect: 'reject' },
  { br: 'BR-15', what: 'CM番号が9桁', patch: { careManagerNumber: '123456789' }, expect: 'reject' },
  { br: 'BR-15', what: 'CM番号に英字（公開側は不可）', patch: { careManagerNumber: 'HN123456' }, expect: 'reject' },
  { br: 'BR-15', what: '賛助会員はCM番号が空でよい',
    patch: { careManagerNumber: '' }, type: 'SUPPORT', expect: 'accept' },
  { br: 'BR-15', what: '賛助会員のCM番号は書式自由（過去データ救済）',
    patch: { careManagerNumber: '900000001' }, type: 'SUPPORT', expect: 'accept' },
  { br: 'BR-15', what: '勤務先電話も携帯も空', patch: { mobilePhone: '', phone: '' }, expect: 'reject' },
  { br: 'BR-15', what: '勤務先電話だけでも可', patch: { mobilePhone: '', phone: '072-000-0000' }, expect: 'accept' },
  { br: 'BR-15', what: '郵送先＝勤務先で事業所名が空',
    patch: { officeName: '', preferredMailDestination: 'OFFICE' }, expect: 'reject' },
  { br: 'BR-15', what: '郵送先＝勤務先なら住所は必須でない（事業所名のみ）',
    patch: { preferredMailDestination: 'OFFICE', officePostCode: '', officeAddressLine: '' }, expect: 'accept' },
  { br: 'BR-15', what: '郵送先＝自宅で自宅〒が空',
    patch: { preferredMailDestination: 'HOME', homePrefecture: '大阪府', homeCity: '枚方市', homeAddressLine: '1-1' },
    expect: 'reject' },
  { br: 'BR-15', what: '郵送先＝自宅で自宅都道府県が空',
    patch: { preferredMailDestination: 'HOME', homePostCode: '573-0000', homeCity: '枚方市', homeAddressLine: '1-1' },
    expect: 'reject' },
  { br: 'BR-15', what: '郵送先＝自宅で自宅市区町村が空',
    patch: { preferredMailDestination: 'HOME', homePostCode: '573-0000', homePrefecture: '大阪府', homeAddressLine: '1-1' },
    expect: 'reject' },
  { br: 'BR-15', what: '郵送先＝自宅で自宅番地が空',
    patch: { preferredMailDestination: 'HOME', homePostCode: '573-0000', homePrefecture: '大阪府', homeCity: '枚方市' },
    expect: 'reject' },
  { br: 'BR-15', what: '郵送先＝自宅で自宅住所がそろっている',
    patch: { preferredMailDestination: 'HOME', homePostCode: '573-0000', homePrefecture: '大阪府', homeCity: '枚方市', homeAddressLine: '1-1' },
    expect: 'accept' },

  // ── BR-15 書式（仕様: 電話は半角数字とハイフン） ───────────────────────
  { br: 'BR-15', what: '携帯電話に日本語', patch: { mobilePhone: 'でんわばんごう' }, expect: 'reject' },
  { br: 'BR-15', what: '勤務先電話に記号', patch: { mobilePhone: '', phone: '!!!!!!' }, expect: 'reject' },
  { br: 'BR-15', what: '自宅郵便番号が数字でない',
    patch: { preferredMailDestination: 'HOME', homePostCode: 'あいうえお', homePrefecture: '大阪府', homeCity: '枚方市', homeAddressLine: '1-1' },
    expect: 'reject' },
  { br: 'BR-15', what: 'メールアドレスが@を含まない', patch: { email: 'not-an-email' }, expect: 'reject' },

  // ── BR-04 勤務先なし ────────────────────────────────────────────────────
  { br: 'BR-04', what: '勤務なし × 郵送先＝勤務先',
    patch: { officeName: '勤務なし', preferredMailDestination: 'OFFICE' }, expect: 'reject' },
  { br: 'BR-04', what: '勤務なし × 郵送先＝自宅（自宅住所あり）',
    patch: { officeName: '勤務なし', preferredMailDestination: 'HOME',
      homePostCode: '573-0000', homePrefecture: '大阪府', homeCity: '枚方市', homeAddressLine: '1-1' },
    expect: 'accept' },

  // ── BR-03 / BR-11 状態と日付 ────────────────────────────────────────────
  { br: 'BR-11', what: '退会済みなのに退会日が空',
    patch: { status: 'WITHDRAWN', withdrawnDate: '' }, expect: 'reject' },
  { br: 'BR-11', what: '退会予定なのに退会日が空',
    patch: { status: 'WITHDRAWAL_SCHEDULED', withdrawnDate: '' }, expect: 'reject' },
  { br: 'BR-03', what: '退会日が入会日より前',
    patch: { joinedDate: '2026-04-01', withdrawnDate: '2025-04-01' }, expect: 'reject' },
  { br: 'BR-03', what: '入会日が日付として壊れている',
    patch: { joinedDate: 'きのう' }, expect: 'reject' },
  { br: 'BR-11', what: '退会済みは必須チェックを免れる（履歴保全）',
    patch: { status: 'WITHDRAWN', withdrawnDate: '2026-03-31', lastName: '', careManagerNumber: '' },
    expect: 'accept' },

  // ── BR-16 事業所会員 ────────────────────────────────────────────────────
  { br: 'BR-16', what: '事業所: 郵便番号が空',
    type: 'BUSINESS', patch: { officePostCode: '', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: 都道府県が空',
    type: 'BUSINESS', patch: { officePostCode: '573-0000', officePrefecture: '', officeCity: '枚方市', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: 市区町村が空',
    type: 'BUSINESS', patch: { officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: 住所が空',
    type: 'BUSINESS', patch: { officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '', phone: '072-000-0000' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: 電話が空',
    type: 'BUSINESS', patch: { officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '1-1', phone: '' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: 事業所名が空',
    type: 'BUSINESS', patch: { officeName: '', officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'reject' },
  { br: 'BR-16', what: '事業所: そろっていれば通る',
    type: 'BUSINESS', patch: { officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'accept' },
  { br: 'BR-16', what: '事業所: 事業所番号が10桁でない',
    type: 'BUSINESS', patch: { officeNumber: 'ABC', officePostCode: '573-0000', officePrefecture: '大阪府', officeCity: '枚方市', officeAddressLine: '1-1', phone: '072-000-0000' },
    expect: 'reject' },
];

// ── 検査表の実行 ────────────────────────────────────────────────────────────

const results: { row: Row; actual: 'accept' | 'reject'; message?: string }[] = [];

for (const row of ROWS) {
  const label = `${row.br} ${row.what}`;
  test(label, () => {
    const base = row.type === 'BUSINESS'
      ? { ...OK_INDIVIDUAL, lastName: '', firstName: '', lastKana: '', firstKana: '', careManagerNumber: '', mobilePhone: '' }
      : { ...OK_INDIVIDUAL };
    const v = verdict({ ...base, ...row.patch }, row.type || 'INDIVIDUAL');
    const actual = v.ok ? 'accept' : 'reject';
    results.push({ row, actual, message: v.ok ? undefined : v.message });

    if (row.gap) {
      // 既知の未達。仕様の期待どおりに動くようになったらこの test が落ち、
      // gap 行を外すよう促す（未達を放置しないための仕掛け）。
      assert.notEqual(actual, row.expect,
        `未達として記録されているのに仕様どおり動いた。ROWS の gap を外すこと: ${label}`);
      return;
    }
    assert.equal(actual, row.expect,
      `${label}: ${row.expect} を期待したが ${actual}` + (v.ok ? '' : `（${v.message}）`));
  });
}

test('検査表のまとめを出す', () => {
  const gaps = results.filter(r => r.row.gap);
  const covered = results.length - gaps.length;
  console.log(`\n── バリデーション検査表 ──`);
  console.log(`  ケース ${results.length} / 仕様どおり ${covered} / 未達 ${gaps.length}`);
  for (const g of gaps) console.log(`  ★未達 ${g.row.br} ${g.row.what} — ${g.row.gap}`);
  assert.ok(results.length >= 35, '検査表が痩せている');
});

// ── BR-06 事業所会員のロール変更（サーバー側）─────────────────────────────
// 仕様表では「未検証（サーバー側の検証はあるが、単体テストが無い）」だった箇所。
// 実際に動かして、画面を通さずに叩かれたときの挙動を確かめる。

const validateRoleTransition = new Function(`
  ${fnSource('validateBusinessStaffRoleTransition_')}
  ${fnSource('normalizeBusinessStaffRole_')}
  function getBusinessStaffRowsByMember_(ss) { return ss.__rows; }
  return validateBusinessStaffRoleTransition_;
`)() as (ss: unknown, memberId: string, payload: unknown[], session: unknown) => void;

interface StaffRow { 職員ID: string; 職員権限コード: string; 職員状態コード?: string }

const ROSTER: StaffRow[] = [
  { 職員ID: 'S-REP', 職員権限コード: 'REPRESENTATIVE', 職員状態コード: 'ENROLLED' },
  { 職員ID: 'S-ADM', 職員権限コード: 'ADMIN', 職員状態コード: 'ENROLLED' },
  { 職員ID: 'S-GEN', 職員権限コード: 'STAFF', 職員状態コード: 'ENROLLED' },
];

/** 名簿全員ぶんの payload をつくり、指定した職員のロールだけ差し替える */
function rosterWith(changes: Record<string, string>) {
  return ROSTER.map(r => ({
    id: r.職員ID,
    role: changes[r.職員ID] || r.職員権限コード,
    status: 'ENROLLED',
  }));
}

function roleVerdict(actor: { staffId: string }, changes: Record<string, string>) {
  try {
    validateRoleTransition({ __rows: ROSTER }, 'M-1', rosterWith(changes), actor);
    return { ok: true as const };
  } catch (e) { return { ok: false as const, message: e instanceof Error ? e.message : String(e) }; }
}

test('BR-06 ADMIN は他の職員を ADMIN ⇄ STAFF にできる', () => {
  assert.equal(roleVerdict({ staffId: 'S-ADM' }, { 'S-GEN': 'ADMIN' }).ok, true,
    'ADMIN が一般職員を ADMIN にできない');
});

test('BR-06 ADMIN は代表者のロールを変更できない', () => {
  const v = roleVerdict({ staffId: 'S-ADM' }, { 'S-REP': 'ADMIN', 'S-ADM': 'REPRESENTATIVE' });
  assert.equal(v.ok, false, '代表者のロールを ADMIN が変更できてしまう');
});

test('BR-06 ADMIN は誰にも代表者を割り当てられない', () => {
  // 代表者を 2 名にする形（人数制約ではなく権限で落ちること）
  const v = roleVerdict({ staffId: 'S-ADM' }, { 'S-GEN': 'REPRESENTATIVE' });
  assert.equal(v.ok, false, 'ADMIN が代表者を増やせてしまう');
  assert.match(v.message, /代表者は代表者または管理者のみ登録できます/,
    '人数制約ではなく権限制約で落ちること');
});

test('BR-06 REPRESENTATIVE は代表者以外のロールを変更できる', () => {
  assert.equal(roleVerdict({ staffId: 'S-REP' }, { 'S-GEN': 'ADMIN' }).ok, true,
    '代表者が一般職員を ADMIN にできない');
});

test('BR-02 代表者は常に 1 名（0 名も 2 名も拒否）', () => {
  const zero = roleVerdict({ staffId: 'S-REP' }, { 'S-REP': 'ADMIN' });
  assert.equal(zero.ok, false, '代表者 0 名が通ってしまう');
  assert.match(zero.message, /代表者は必ず1名/);
  const two = roleVerdict({ staffId: 'S-REP' }, { 'S-GEN': 'REPRESENTATIVE' });
  assert.equal(two.ok, false, '代表者 2 名が通ってしまう');
  assert.match(two.message, /代表者は1名のみ/);
});

test('BR-06 ADMIN は自分自身のロールを変更できない', () => {
  const v = roleVerdict({ staffId: 'S-ADM' }, { 'S-ADM': 'STAFF' });
  assert.equal(v.ok, false, 'ADMIN が自分を降格できてしまう');
  assert.match(v.message, /自分自身のロールは変更できません/);
});

// ── 書き換え制限（allowlist）────────────────────────────────────────────────
// 「どの経路から何を書き換えられるか」はサーバ側の allowlist が正本。
// 画面で入力欄を無効化しても、API は直接叩ける。

function arrayLiteral(name: string): string[] {
  const i = gasSrc.indexOf(`var ${name} = [`);
  assert.notEqual(i, -1, `${name} が見つからない`);
  const body = gasSrc.slice(gasSrc.indexOf('[', i), gasSrc.indexOf('];', i));
  return [...body.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

test('BR-07 CM番号は会員セルフサービスから書き換えられない', () => {
  const selfWritable = arrayLiteral('MEMBER_WRITABLE_FIELDS_');
  assert.ok(!selfWritable.includes('careManagerNumber'),
    'マイページから CM番号を書けてしまう（ログインIDと連動するため管理者のみ）');
  assert.ok(!selfWritable.includes('officeNumber'), 'マイページから事業所番号を書けてしまう');
});

test('BR-03 会員ステータス・入会日は会員セルフサービスから書き換えられない', () => {
  const selfWritable = arrayLiteral('MEMBER_WRITABLE_FIELDS_');
  for (const f of ['status', 'joinedDate', 'withdrawnDate', 'withdrawalProcessDate']) {
    assert.ok(!selfWritable.includes(f), `マイページから ${f} を書けてしまう`);
  }
});

test('BR-07 一括編集で CM番号・氏名を書き換えられない', () => {
  const batch = arrayLiteral('ADMIN_BATCH_WRITABLE_FIELDS_');
  for (const f of ['careManagerNumber', 'lastName', 'firstName']) {
    assert.ok(!batch.includes(f), `一括編集で ${f} を書けてしまう`);
  }
});

test('BR-19 公開ポータルの変更申請は allowlist 内しか書けない', () => {
  const pub = arrayLiteral('PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_');
  // 書けてはいけないもの（状態・日付・権限・内部ID）
  for (const f of ['status', 'joinedDate', 'withdrawnDate', 'id', 'memberId', 'loginId', 'staffLimit']) {
    assert.ok(!pub.includes(f), `公開ポータルから ${f} を書けてしまう`);
  }
  // 承認を経れば書けるもの（本人の連絡先・勤務先）
  for (const f of ['officeName', 'email', 'mobilePhone', 'preferredMailDestination']) {
    assert.ok(pub.includes(f), `${f} が allowlist から落ちている`);
  }
});

test('BR-15 賛助会員の allowlist から CM番号が外れている（ログインID保護）', () => {
  const src = gasSrc.slice(gasSrc.indexOf('var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_'));
  assert.match(src.slice(0, 300), /k !== 'careManagerNumber'/,
    '賛助会員の変更申請で CM番号を書けてしまう');
});

test('BR-18 承認時の適用も allowlist を通る（申請に何が入っていても）', () => {
  const approve = gasSrc.slice(gasSrc.indexOf('function approveAdminChangeRequest_('));
  const head = approve.slice(0, 4000);
  assert.match(head, /publicUpdateAllowlistFor_\(memberType\)/,
    '承認時に allowlist を引いていない');
  assert.match(head, /hasOwnProperty\.call\(fields, fk\)/,
    'allowlist を回さず申請の中身をそのまま適用している');
});

// ── 2026-10-04: 保存時に値を捏造しない・書けるはずの列を書く（docs/299）──────

test('BR-15 既に空の CM 番号は、空のまま保存できる', () => {
  // 本番に CM 番号が空の個人会員が 19 名いる。全員ログインID（9 桁自動採番）は持っている。
  // 以前は保存のたびにログインIDが CM 番号欄へ書き込まれ、**登録されていない番号が捏造**されていた。
  const v = verdict({ ...OK_INDIVIDUAL, careManagerNumber: '' }, 'INDIVIDUAL', 'ACTIVE',
    { allowBlankCareManagerNumber: true });
  assert.equal(v.ok, true, '既に空の行が保存できない（管理画面から一切編集できなくなる）');
});

test('BR-15 新規は CM 番号必須のまま（許可フラグが無ければ拒否）', () => {
  const v = verdict({ ...OK_INDIVIDUAL, careManagerNumber: '' }, 'INDIVIDUAL');
  assert.equal(v.ok, false, '新規作成で CM 番号が空でも通ってしまう');
  assert.match(v.message, /介護支援専門員番号が必須/);
});

test('★捏造しない: 空の CM 番号をログインIDで埋めない', () => {
  const core = stripLineComments(extractLargeFunction('saveMemberCore_'));
  assert.ok(!/careManagerFallback\s*=\s*storedCareManagerNumber\s*\|\|/.test(core),
    'ログインIDへのフォールバックが残っている。空の CM 番号に「登録されていない番号」が入る');
  assert.ok(/var careManagerFallback = storedCareManagerNumber;/.test(core),
    '保存されている値をそのまま使う形になっていない');
  assert.ok(/allowBlankCareManagerNumber: !storedCareManagerNumber/.test(core),
    'DB 側が空のときだけ空を許す、という受け渡しが無い');
});

test('★空振りしない: 事業所番号は読むだけでなく書かれる', () => {
  // updateMember が success を返しながら列が変わらない、という無言の空振りだった。
  const core = stripLineComments(extractLargeFunction('saveMemberCore_'));
  assert.ok(/officeNumber: fromPayloadOrCurrent\('officeNumber'/.test(core),
    'mergedPayload が payload の officeNumber を拾っていない');
  assert.ok(/setCol\('事業所番号', mergedPayload\.officeNumber/.test(core),
    '事業所番号を書き込んでいない（API は成功を返すのに DB は変わらない）');
});

test('★管理者 allowlist と保存の実装が食い違っていない', () => {
  // allowlist で許可しているのに保存側が見ていない項目があると、
  // 今回の事業所番号と同じ「成功を返して何もしない」が起きる。
  const allow = arrayLiteral('ADMIN_MEMBER_WRITABLE_FIELDS_');
  const core = stripLineComments(extractLargeFunction('saveMemberCore_'));
  // 保存側でそのキー名が一切登場しないものを拾う
  const notMerged = allow.filter((f) => !core.includes(f));
  assert.deepEqual(notMerged, [],
    '保存側がまったく参照していない allowlist 項目: ' + notMerged.join(' / '));
});

// ── 2026-10-08: 職員の追加・変更・除籍（docs/300）────────────────────────────

test('BR-16 職員追加はサーバ側でも 6 項目を必須にする', () => {
  // 公開ポータルのフォームは 6 項目そろった行だけ送るが、画面を経由しない経路では
  // 空のまま職員行が作れていた。v376.110 で潰したのと同じ「画面でしか守られていない」型。
  const fn = stripLineComments(extractLargeFunction('addApprovedStaffMember_'));
  for (const [label, msg] of [
    ['姓・名', '姓と名は必須です'],
    ['セイ・メイ', 'セイとメイは必須です'],
    ['メールアドレス', '職員のメールアドレスは必須です'],
    ['介護支援専門員番号', '職員の介護支援専門員番号は必須です'],
  ] as const) {
    assert.ok(fn.includes(msg), `${label} を必須にしていない`);
  }
});

test('★職員数上限は個別が無ければ全体既定を使う', () => {
  // 以前は個別上限が空だと 0 扱いで、上限が一切効かなかった（RD §136 / §205）。
  const fn = stripLineComments(extractLargeFunction('addApprovedStaffMember_'));
  assert.ok(/DEFAULT_BUSINESS_STAFF_LIMIT/.test(fn),
    '全体既定の上限を参照していない');
  assert.ok(/if \(!staffLimit\)/.test(fn),
    '個別上限が未設定のときに既定へ落ちる分岐が無い');
});

test('★職員追加で認証アカウントを作る（RD §224）', () => {
  const fn = stripLineComments(extractLargeFunction('addApprovedStaffMember_'));
  assert.ok(/ensureStaffAuthAccount_\(/.test(fn), '認証アカウントを作っていない');
  const ensure = stripLineComments(extractLargeFunction('ensureStaffAuthAccount_'));
  assert.ok(/generateCmBasedLoginId_\(/.test(ensure),
    'ログインIDを CM 番号から採番していない（BR-15: 職員の CM 番号がログインID）');
  assert.ok(/collectExistingLoginIds_\(/.test(ensure),
    '既存ログインIDとの重複を見ていない');
  assert.ok(/hashPasswordCurrent_\(/.test(ensure), 'パスワードをハッシュ化していない');
  // 再承認・再実行で重複アカウントを作らない
  assert.ok(/職員ID'\] \|\| ''\) === String\(staffId\)/.test(ensure),
    '同じ職員の既存アカウントを検出していない（重複が生まれる）');
  // 通知はここで送らない（送信可否は設定が決める）
  assert.ok(!/deliverMail_\(/.test(ensure), 'アカウント作成の中でメールを送っている');
});

test('★代表者の絞り込みに正しい列名を使う', () => {
  // T_事業所職員 に「権限コード」は無い。誤った列名で絞ると常に空になり、
  // 代表者への職員追加通知が届かない。
  const gas = gasSrc;
  const staffRepFilters = gas.split('\n')
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /=== 'REPRESENTATIVE'/.test(l) && /\['権限コード'\]/.test(l));
  assert.deepEqual(staffRepFilters.map(x => x.i + 1), [],
    '職員を「権限コード」で絞っている行がある（正しくは 職員権限コード）');
});

test('BR-02 代表者は除籍できない', () => {
  const fn = stripLineComments(extractLargeFunction('removeStaffFromOffice_'));
  assert.ok(fn.includes('代表者は除籍できません'), '代表者の除籍を止めていない');
  assert.ok(/職員状態コード'\]\] = 'LEFT'/.test(fn), '除籍状態にしていない');
  assert.ok(/disableAuthAccountsByStaffId_\(/.test(fn), '認証アカウントを無効化していない');
  // BR-12: 当年度は履歴を残す＝削除フラグは立てない
  assert.ok(!/削除フラグ'\]\] = true/.test(fn), '除籍で削除フラグを立てている（BR-12 違反）');
});
