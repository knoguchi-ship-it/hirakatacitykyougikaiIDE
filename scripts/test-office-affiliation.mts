/**
 * 勤務先（所属）の変更まわりを固定する。
 *
 * 背景（2026-10-01 operator 指摘）:
 * 入会申込では事業所名を必須で取るのに、公開ポータルの変更申請に項目が無く、
 * サーバの allowlist にも入っていなかった。転職しても
 * 「前職の事業所名 ＋ 現職の住所・電話」という行しか作れず、
 * 郵送先区分が勤務先の人は**郵便が前職へ届く**（事業所名が宛名を決める／docs/spec/02_RD.md §591）。
 *
 * 判定の正本は `src/shared/officeAffiliation.ts`。GAS は同名のローカル実装を持つので
 * （build 注入の経路を増やさない方針／`validators.ts` と同じ）、両者の一致をここで検査する。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { isNoOfficeAffiliation, NO_OFFICE_AFFILIATION_LABEL } from '../src/shared/officeAffiliation.ts';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), ...p.split('/')), 'utf8');
const gasSrc = read('gas-src/Code.full.gs');
const publicForm = read('src/public-portal/components/MemberUpdateForm.tsx');
const adminForm = read('src/components/MemberForm.tsx');

function extractFunction(name: string): string {
  const start = gasSrc.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = gasSrc.indexOf('\n}\n', start);
  return gasSrc.slice(start, end + 3);
}

/**
 * 次のトップレベル宣言までを本体とみなす。
 * `saveMemberCore_` のような巨大な関数は内部に行頭 `}` を含み、
 * `\n}\n` 探索では途中で切れてしまう。
 */
function extractLargeFunction(name: string): string {
  const start = gasSrc.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const nextDecl = gasSrc.indexOf('\nfunction ', start + 1);
  return gasSrc.slice(start, nextDecl === -1 ? undefined : nextDecl);
}

/** 行コメントを落とす（説明文に書いた語をコード本体と誤認しないため） */
const stripLineComments = (text: string) => text.replace(/^\s*\/\/.*$/gm, '');

// ── 判定そのもの ─────────────────────────────────────────────────────

test('勤務先なしの判定（空欄と予約語の両方）', () => {
  assert.equal(NO_OFFICE_AFFILIATION_LABEL, '勤務なし');
  assert.equal(isNoOfficeAffiliation(''), true);
  assert.equal(isNoOfficeAffiliation('   '), true);
  assert.equal(isNoOfficeAffiliation('勤務なし'), true);
  assert.equal(isNoOfficeAffiliation(' 勤務なし '), true);
  assert.equal(isNoOfficeAffiliation(null), true);
  assert.equal(isNoOfficeAffiliation(undefined), true);
  assert.equal(isNoOfficeAffiliation('ひらかた介護ステーション'), false);
});

test('GAS 側の実装がフロントと同じ答えを返す', () => {
  const fn = new Function(
    `${extractFunction('isNoOfficeAffiliation_')}
     var NO_OFFICE_AFFILIATION_LABEL_ = '勤務なし';
     return isNoOfficeAffiliation_;`,
  )() as (v: unknown) => boolean;
  for (const v of ['', '   ', '勤務なし', ' 勤務なし ', null, undefined, 'ひらかた介護ステーション', '勤務なしセンター']) {
    assert.equal(fn(v), isNoOfficeAffiliation(v as string), `判定が食い違う: ${JSON.stringify(v)}`);
  }
});

test('GAS 側の予約語がフロントと同じ', () => {
  const m = gasSrc.match(/var NO_OFFICE_AFFILIATION_LABEL_ = '([^']*)';/);
  assert.ok(m, 'GAS に予約語の定義が無い');
  assert.equal(m[1], NO_OFFICE_AFFILIATION_LABEL);
});

// ── 公開ポータルから勤務先を変えられる ────────────────────────────────

test('★個人・賛助会員の allowlist に 勤務先名 がある', () => {
  const start = gasSrc.indexOf('var PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_ = [');
  assert.notEqual(start, -1);
  const block = gasSrc.slice(start, gasSrc.indexOf('];', start));
  assert.ok(block.includes("'officeName'"), '勤務先名が公開の変更対象に入っていない（画面を直しても通らない）');
  // 賛助会員は個人会員から careManagerNumber だけを外した派生なので自動的に含まれる
  const support = gasSrc.slice(gasSrc.indexOf('var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_'), gasSrc.indexOf('var PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_'));
  assert.ok(support.includes('PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_.filter'), '賛助会員が個人会員の派生でなくなっている');
  assert.ok(support.includes("k !== 'careManagerNumber'"), '賛助会員から外すのは介護支援専門員番号だけ');
});

test('★公開フォームが事業所名を送る', () => {
  assert.ok(publicForm.includes('fields.officeName'), '事業所名を送っていない');
  assert.ok(publicForm.includes("label: '勤務先（事業所）'"), 'グループ名が勤務先を表していない');
});

test('事業所名は電話・FAX と同じグループに置く（別々にして片方を忘れさせない）', () => {
  const start = publicForm.indexOf('const INDIVIDUAL_GROUPS = [');
  const block = publicForm.slice(start, publicForm.indexOf('];', start));
  const groups = [...block.matchAll(/key: '([A-Za-z]+)' as FieldGroup/g)].map((m) => m[1]);
  assert.ok(groups.includes('officeContact'), '勤務先グループが無い');
  assert.ok(!groups.includes('officeName'), '事業所名を単独グループにしない（転職時に選び漏れる）');
});

// ── 退職（勤務なし）の整合性 ─────────────────────────────────────────

test('★「現在は勤務していない」は郵送先を自宅へ寄せる', () => {
  const start = publicForm.indexOf('if (indFields.noOffice) {');
  assert.notEqual(start, -1, '勤務なしの分岐が無い');
  const block = publicForm.slice(start, start + 600);
  assert.ok(block.includes('NO_OFFICE_AFFILIATION_LABEL'), '予約語を直書きしている');
  assert.ok(block.includes("fields.preferredMailDestination = 'HOME'"), '郵送先を自宅へ切り替えていない');
  assert.ok(block.includes("fields.phone = ''"), '勤務先の電話を残している');
  assert.ok(block.includes("fields.fax = ''"), '勤務先の FAX を残している');
});

test('★サーバが「勤務なし」×「郵送先＝勤務先」を拒否する', () => {
  // 入力検証は saveMemberCore_ 本体ではなく validateMemberPayload_ にある。
  const validator = extractLargeFunction('validateMemberPayload_');
  assert.ok(
    validator.includes('isNoOfficeAffiliation_(payload.officeName)'),
    '勤務なしを見ていない（「勤務なし」宛の郵便が出る）',
  );
  // 必須チェックの直後、つまり requireOfficeInfo（郵送先＝勤務先）の中にあること
  const guard = validator.indexOf('isNoOfficeAffiliation_(payload.officeName)');
  const requireBlock = validator.indexOf('if (requireOfficeInfo) {');
  assert.ok(requireBlock !== -1 && guard > requireBlock, '郵送先＝勤務先 の判定の中に入っていない');
  assert.ok(validator.includes('郵送先区分を自宅にしてください'), '利用者に何をすればよいか伝えていない');
});

test('検証は会員保存の中核から必ず通る（迂回経路を作らない）', () => {
  // validateMemberPayload_ を呼ばない保存経路があると、上のガードを素通りできる。
  const core = extractLargeFunction('saveMemberCore_');
  assert.ok(core.includes('validateMemberPayload_('), 'saveMemberCore_ が検証を呼んでいない');
});

test('画面が「勤務なし」を直書きしていない（3 箇所の食い違いを防ぐ）', () => {
  for (const [label, source] of [['公開ポータル', publicForm], ['管理画面', adminForm]] as const) {
    const offenders = stripLineComments(source).split('\n').filter((line) =>
      line.includes("'勤務なし'") || line.includes('"勤務なし"'));
    assert.deepEqual(offenders, [], `${label} が予約語を直書きしている: ${offenders.join(' / ')}`);
  }
});

// ── 退職時にフロントで止める（2026-10-02 operator 指示）─────────────
// 「管理者の手元に来た時点で、承認ができる状態のデータしか確認へ飛ばしてはならない」。
// サーバの必須ルールをフロントが先に満たさせる。満たすまで送信させない。

test('★退職を選んだら、サーバが必須にする項目をフロントが要求する', () => {
  const start = publicForm.indexOf('const retirementMissing = useMemo(');
  assert.notEqual(start, -1, '退職時の不足チェックが無い');
  const block = publicForm.slice(start, publicForm.indexOf('}, [', start));
  // 勤務先電話を消すので携帯が要る（サーバ: 勤務先電話番号または携帯電話番号のどちらか）
  assert.ok(block.includes('mobilePhone'), '携帯電話番号を要求していない');
  // 郵送先が自宅になるので自宅住所一式が要る
  for (const key of ['postCode', 'prefecture', 'city', 'addressLine']) {
    assert.ok(block.includes(key), `自宅住所の ${key} を要求していない`);
  }
  assert.ok(block.includes('email'), '連絡先メールを要求していない');
});

test('★不足があれば送信ボタンを押せない', () => {
  assert.ok(
    publicForm.includes('disabled={busy || !hasAnyInput || retirementMissing.length > 0}'),
    '不足があっても送信できてしまう',
  );
});

test('★ボタン以外の経路でも送信を止める', () => {
  // Enter キー・支援技術・将来の改修で disabled が外れても通さない。
  const start = publicForm.indexOf('const handleSubmit = async');
  const block = publicForm.slice(start, start + 500);
  assert.ok(block.includes('retirementMissing.length > 0'), 'handleSubmit で確かめていない');
  assert.ok(block.includes('e.preventDefault()'), '送信を止めていない');
});

test('退職中は連絡先・自宅住所のグループを外せない', () => {
  const start = publicForm.indexOf('const toggle = (g: FieldGroup)');
  const block = publicForm.slice(start, publicForm.indexOf('});', start));
  assert.ok(block.includes('indNoOffice'), '退職中かを見ていない');
  assert.ok(block.includes("'contact'") && block.includes("'homeAddress'"), '外せないようにする対象が足りない');
});

test('退職を選ぶと必要なグループが自動で開く', () => {
  assert.ok(
    publicForm.includes("new Set(prev).add('homeAddress').add('contact')"),
    '自宅住所・連絡先の入力欄が出ないと、必須を満たしようがない',
  );
});

test('フロントが要求する項目はサーバの必須ルールと対応している', () => {
  // サーバ側がこれらを必須にしている限り、フロントの要求は過不足ない。
  const validator = extractLargeFunction('validateMemberPayload_');
  assert.ok(validator.includes('勤務先電話番号または携帯電話番号のどちらかを入力してください'),
    'サーバの電話必須ルールが消えている（フロントの要求根拠が無くなる）');
  assert.ok(validator.includes('個人会員は自宅郵便番号が必須です'),
    'サーバの自宅住所必須ルールが消えている');
});
