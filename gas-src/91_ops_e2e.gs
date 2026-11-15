// gas-src/91_ops_e2e.gs — dryRun・E2E のシナリオ。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ── 2026-10-31 docs/317 E: 会員・職員移行の隔離 E2E ─────────────────────────────────
// 一時スプレッドシートに合成データ（★・@example.invalid）だけを入れ、本物の移行（convertMemberTypeOn_）と
// 本物の一括更新を通す。前後の全表を API で読み（P0: 同じ実行の SpreadsheetApp は古い内容を返す）、
// 変わったセルと追加行が、シナリオごとの期待差分と完全に一致するかで判定する。本番 DB・ログ用 DB は開かない。
//
// 2 回に分けて実行する（同じ関数をもう一度 ▶）。
//   1 回目: E1〜E6・E8〜E11 と、往復（E7）の行き・応答喪失（E10）の 1 回目
//   2 回目: 往復の戻りと、E10 と同じ操作IDの再送
// 同じ実行の中では API で書いた内容が SpreadsheetApp に見えないので、画面の操作と同じく別の実行で確かめる。
// 1 回目と 2 回目の間は、往復用の一時ファイルの ID だけをスクリプトプロパティに置く（2 回目の最初に消す）。
// 出力は判定・件数・型・時間と合成データの ID だけ。
var MEMBER_CONVERSION_E2E_TABLES_ = ['T_会員', 'T_事業所職員', 'T_認証アカウント', 'T_管理者Googleホワイトリスト', 'T_研修申込',
  'T_役員', 'T_振込口座', 'T_請求', 'T_支払い', 'T_変更申請', 'T_人物統合ログ'];
var MEMBER_CONVERSION_E2E_PENDING_KEY_ = 'E2E_MEMBER_CONVERSION_PENDING';
// 人物の参照を持つ表の主キー列
var MEMBER_CONVERSION_E2E_REF_ID_HEADERS_ = { T_役員: '役員ID', T_振込口座: '口座ID', T_請求: '請求ID', T_支払い: '支払いID' };

function e2eMemberConversionIsolated_APPLY() {
  var session = assertMasterOperator_('e2eMemberConversionIsolated_APPLY');
  var started = Date.now();
  var props = PropertiesService.getScriptProperties();
  var pendingRaw = props.getProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_);
  var ctx = {
    stamp: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss'),
    today: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
    deadline: started + 300000, // GAS の上限 6 分より前に打ち切る（残りは時間切れとして不合格にする）
    files: [], batchCalls: 0, inject: '',
  };
  var report = { operator: session.loginId, startedAt: new Date(started).toISOString(), phase: pendingRaw ? '2/2' : '1/2',
    scenarios: [], observations: {}, files: { created: 0, opened: 0, trashed: 0, kept: 0, trashErrors: [] }, next: '', verdict: '' };
  var savedMemo = MASTER_OPTIONS_MEMO_;
  var realBatch = sheetsApiBatchUpdate_;
  var keepForPhase2 = false;
  // 一括更新の呼び出しを数え、シナリオが指定したときだけ失敗を混ぜる・応答を捨てる（本体には試験用の分岐を入れない）
  sheetsApiBatchUpdate_ = function(spreadsheetId, requests) { return memberConversionE2eBatch_(ctx, realBatch, spreadsheetId, requests); };
  // 移行が読むマスタ（M_職員権限）は、この実行の中だけ固定値にする。
  // 一時ファイルの空のマスタを読んで、本番と共有のスクリプトキャッシュへ入れないため。
  MASTER_OPTIONS_MEMO_ = { M_職員権限: [{ code: 'STAFF', label: '一般' }, { code: 'ADMIN', label: '管理者' }, { code: 'REPRESENTATIVE', label: '代表者' }] };
  try {
    if (pendingRaw) {
      props.deleteProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_); // 2 回目が途中で止まっても、次の実行は 1 回目からやり直す
      runMemberConversionE2ePhase2_(ctx, report, JSON.parse(pendingRaw));
    } else {
      var pending = runMemberConversionE2ePhase1_(ctx, report);
      props.setProperty(MEMBER_CONVERSION_E2E_PENDING_KEY_, JSON.stringify(pending));
      keepForPhase2 = true;
      report.next = 'もう一度 e2eMemberConversionIsolated_APPLY を実行してください（2/2: 往復の戻りと同じ操作IDの再送）。';
    }
  } catch (e) {
    report.scenarios.push({ id: 'ABORT', passed: false, problems: [String(e && e.message ? e.message : e)] });
  } finally {
    sheetsApiBatchUpdate_ = realBatch;
    MASTER_OPTIONS_MEMO_ = savedMemo;
    ctx.files.forEach(function(f) {
      if (f.created) report.files.created += 1; else report.files.opened += 1;
      if (keepForPhase2 && f.keep) { report.files.kept += 1; return; }
      try {
        DriveApp.getFileById(f.id).setTrashed(true);
        report.files.trashed += 1;
      } catch (e2) {
        report.files.trashErrors.push(String(e2 && e2.message ? e2.message : e2));
      }
    });
  }
  report.elapsedMs = Date.now() - started;
  var failed = report.scenarios.filter(function(s) { return !s.passed; }).map(function(s) { return s.id; });
  report.verdict = (failed.length ? 'NG: ' + failed.join(', ') : 'OK: ' + report.scenarios.length + ' 件すべて合格')
    + '（' + report.phase + (keepForPhase2 ? '・続きあり' : '') + '）';
  var out = JSON.stringify(report, null, 2);
  Logger.log('=== 会員・職員移行の隔離 E2E（一時スプレッドシート）===\n' + out);
  return out;
}

function memberConversionE2eBatch_(ctx, realBatch, spreadsheetId, requests) {
  ctx.batchCalls += 1;
  if (ctx.inject === 'REJECT') {
    // 存在しないシートへの要求を混ぜる（P2 と同じ）→ 全体が拒否されるはず
    return realBatch(spreadsheetId, requests.concat([{ updateCells: {
      start: { sheetId: 987654321, rowIndex: 1, columnIndex: 0 },
      rows: [{ values: [{ userEnteredValue: { stringValue: 'x' } }] }],
      fields: 'userEnteredValue',
    } }]));
  }
  var res = realBatch(spreadsheetId, requests);
  if (ctx.inject === 'LOSE_RESPONSE' && res.ok) throw new Error('E2E: 反映した後の応答を捨てました');
  return res;
}

// 合成データの ID（1 回目と 2 回目で同じ値を使う）
function memberConversionE2eIds_() {
  return {
    OFFICE_A: '20000001', OFFICE_R: '20000002', OFFICE_L: '20000003', OFFICE_F: '20000004', OFFICE_S: '20000005',
    M_E1: '10000001', M_E2: '10000002', M_E4W: '10000004', M_E7: '10000007', M_E9: '10000009', M_E10: '10000010',
    M_PEND: '10000020', M_DUP: '10000021', M_FULL: '10000022', M_DONE: '10000099',
    S_A1: 'S900000001', S_E2L: 'S900000002', S_E3: 'S900000003', S_E4: 'S900000004', S_REP: 'S900000005',
    S_SUC: 'S900000006', S_LAST: 'S900000007', S_F1: 'S900000008', S_DUP: 'S900000009', S_RT: 'S900000011',
  };
}

// 人物（会員・職員）。auth: 認証ID、apps: 研修申込ID、refs: 役員まわり 4 表の行ID、whitelist: ホワイトリストID
function memberConversionE2ePeople_() {
  var ids = memberConversionE2eIds_();
  var p = function(key, cm, first, firstKana, extra) {
    var o = { key: key, id: ids[key], cm: cm, last: '★E2E', first: first, lastKana: 'テスト', firstKana: firstKana,
      email: key.toLowerCase().split('_').join('-') + '@example.invalid', auth: 'AU-E2E-' + key, apps: [], refs: {} };
    Object.keys(extra || {}).forEach(function(k) { o[k] = extra[k]; });
    return o;
  };
  return {
    M_E1: p('M_E1', '05000001', '一郎', 'イチロウ', { whitelist: 'WL-E2E-01', apps: ['TA-E2E-E1'],
      refs: { T_役員: ['OF-E2E-E1'], T_振込口座: ['BK-E2E-E1'], T_請求: ['CL-E2E-E1'], T_支払い: ['PY-E2E-E1'] } }),
    M_E2: p('M_E2', '05000002', '二郎', 'ジロウ'),
    M_E4W: p('M_E4W', '01230004', '四郎', 'シロウ', { status: 'WITHDRAWN', left: '2024-03-31', auth: '' }),
    M_E7: p('M_E7', '05000007', '七郎', 'シチロウ', { apps: ['TA-E2E-E7'] }),
    M_E9: p('M_E9', '05000009', '九郎', 'クロウ'),
    M_E10: p('M_E10', '05000010', '十郎', 'ジュウロウ'),
    M_PEND: p('M_PEND', '05000020', '保留', 'ホリュウ'),
    M_DUP: p('M_DUP', '05000021', '重複', 'チョウフク'),
    M_FULL: p('M_FULL', '05000022', '満員', 'マンイン'),
    // 以前に移行済みの会員（移行日の既存の型の比べ先。どのシナリオにも関わらない）
    M_DONE: p('M_DONE', '05000099', '済み', 'スミ', { status: 'TRANSFERRED', moved: '2025-04-01', auth: '' }),
    S_A1: p('S_A1', '09000001', '同僚', 'ドウリョウ', { office: ids.OFFICE_A, whitelist: 'WL-E2E-02', apps: ['TA-E2E-A1'], refs: { T_役員: ['OF-E2E-A1'] } }),
    // E2 で使い直す、同じ事業所の除籍済みの行（氏名などは M_E2 と同じ）
    S_E2L: p('S_E2L', '05000002', '二郎', 'ジロウ', { office: ids.OFFICE_A, status: 'LEFT', deleted: true, left: '2023-03-31', auth: '', email: 'm-e2@example.invalid' }),
    S_E3: p('S_E3', '01230003', '三郎', 'サブロウ', { office: ids.OFFICE_S, apps: ['TA-E2E-E3'], refs: { T_役員: ['OF-E2E-E3'], T_支払い: ['PY-E2E-E3'] } }),
    // E4 で M_E4W（退会済み）を使い直す。氏名などは M_E4W と同じ
    S_E4: p('S_E4', '01230004', '四郎', 'シロウ', { office: ids.OFFICE_S, email: 'm-e4w@example.invalid' }),
    S_REP: p('S_REP', '07000001', '代表', 'ダイヒョウ', { office: ids.OFFICE_R, role: 'REPRESENTATIVE' }),
    S_SUC: p('S_SUC', '07000002', '後任', 'コウニン', { office: ids.OFFICE_R }),
    S_LAST: p('S_LAST', '07000003', '最後', 'サイゴ', { office: ids.OFFICE_L, role: 'REPRESENTATIVE' }),
    S_F1: p('S_F1', '09000008', '在籍', 'ザイセキ', { office: ids.OFFICE_F }),
    S_DUP: p('S_DUP', '05000021', '重複', 'チョウフク', { office: ids.OFFICE_S }),
    S_RT: p('S_RT', '01230011', '往復', 'オウフク', { office: ids.OFFICE_S, apps: ['TA-E2E-RT'] }),
  };
}

// 合成データを既存の書き方（appendRowsByHeaders_ = setValues）だけで入れる。本番と同じ型になる
// （8 桁の会員ID は数値、yyyy-MM-dd は日付、書式なしテキスト列は文字列）。
function buildMemberConversionE2eBase_(ss) {
  var ids = memberConversionE2eIds_();
  var people = memberConversionE2ePeople_();
  var now = new Date().toISOString();
  var first = ss.getSheets()[0];
  first.setName(MEMBER_CONVERSION_E2E_TABLES_[0]);
  MEMBER_CONVERSION_E2E_TABLES_.forEach(function(name, i) {
    var sheet = i === 0 ? first : ss.insertSheet(name);
    writeSheetHeaders_(sheet, テーブル定義[name]);
  });
  applyTextColumnFormats_(ss);

  var members = [];
  var office = function(id, limit) {
    members.push({ 会員ID: id, 会員種別コード: 'BUSINESS', 会員状態コード: 'ACTIVE', 入会日: '2019-04-01', 勤務先名: '★E2E事業所' + id,
      代表メールアドレス: 'office-' + id + '@example.invalid', 職員数上限: limit, 作成日時: now, 更新日時: now, 削除フラグ: false });
  };
  office(ids.OFFICE_A, 10); office(ids.OFFICE_R, 10); office(ids.OFFICE_L, 10); office(ids.OFFICE_F, 1); office(ids.OFFICE_S, 10);
  var staff = [];
  var auths = [];
  Object.keys(people).forEach(function(key) {
    var x = people[key];
    if (x.office) {
      staff.push({ 職員ID: x.id, 会員ID: x.office, 姓: x.last, 名: x.first, セイ: x.lastKana, メイ: x.firstKana,
        氏名: x.last + ' ' + x.first, フリガナ: x.lastKana + ' ' + x.firstKana, メールアドレス: x.email,
        職員権限コード: x.role || 'STAFF', 職員状態コード: x.status || 'ENROLLED', 入会日: '2021-04-01', 退会日: x.left || '',
        介護支援専門員番号: x.cm, メール配信希望コード: 'YES', 作成日時: now, 更新日時: now, 削除フラグ: !!x.deleted });
    } else {
      members.push({ 会員ID: x.id, 会員種別コード: 'INDIVIDUAL', 会員状態コード: x.status || 'ACTIVE', 入会日: '2020-04-01', 退会日: x.left || '', 移行日: x.moved || '',
        姓: x.last, 名: x.first, セイ: x.lastKana, メイ: x.firstKana, 代表メールアドレス: x.email, 介護支援専門員番号: x.cm,
        作成日時: now, 更新日時: now, 削除フラグ: false });
    }
    if (x.auth) {
      auths.push({ 認証ID: x.auth, 認証方式: 'PASSWORD', ログインID: x.cm, システムロールコード: x.office ? (x.role === 'REPRESENTATIVE' ? 'BUSINESS_ADMIN' : 'BUSINESS_MEMBER') : 'INDIVIDUAL_MEMBER',
        会員ID: x.office || x.id, 職員ID: x.office ? x.id : '', アカウント有効フラグ: true, ログイン失敗回数: 0, ロック状態: false,
        作成日時: now, 更新日時: now, 削除フラグ: false });
    }
  });
  appendRowsByHeaders_(ss, 'T_会員', members);
  appendRowsByHeaders_(ss, 'T_事業所職員', staff);
  appendRowsByHeaders_(ss, 'T_認証アカウント', auths);
  appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', [
    { ホワイトリストID: 'WL-E2E-01', Googleメール: 'wl1@example.invalid', 紐付け認証ID: people.M_E1.auth, 紐付け会員ID: ids.M_E1, 権限コード: 'GENERAL', 有効フラグ: true, 作成日時: now, 更新日時: now, 削除フラグ: false },
    { ホワイトリストID: 'WL-E2E-02', Googleメール: 'wl2@example.invalid', 紐付け認証ID: people.S_A1.auth, 紐付け会員ID: ids.OFFICE_A, 権限コード: 'GENERAL', 有効フラグ: true, 作成日時: now, 更新日時: now, 削除フラグ: false },
  ]);
  var app = function(appId, memberId, staffId, extra) {
    var o = { 申込ID: appId, 研修ID: 'TR-E2E-1', 会員ID: memberId, 職員ID: staffId, 申込状態コード: 'APPLIED', 申込日時: now,
      申込者区分コード: memberId ? 'MEMBER' : 'EXTERNAL', 申込者ID: memberId, 作成日時: now, 更新日時: now, 削除フラグ: false };
    Object.keys(extra || {}).forEach(function(k) { o[k] = extra[k]; });
    return o;
  };
  appendRowsByHeaders_(ss, 'T_研修申込', [
    app('TA-E2E-E1', ids.M_E1, ''),
    app('TA-E2E-E1DEL', ids.M_E1, '', { 削除フラグ: true }), // 削除済みは付け替えない
    // 外部申込を会員と照合した記録は申込時点のまま（docs/316 B）
    app('TA-E2E-EXT', '', '', { 外部申込者ID: 'EX-E2E-1', 照合会員ID: ids.M_E1, 申告介護支援専門員番号: people.M_E1.cm }),
    app('TA-E2E-A1', ids.OFFICE_A, ids.S_A1),
    app('TA-E2E-E3', ids.OFFICE_S, ids.S_E3),
    app('TA-E2E-E7', ids.M_E7, ''),
    app('TA-E2E-RT', ids.OFFICE_S, ids.S_RT),
  ]);
  var ref = function(table, idValue, memberId, staffId) {
    var o = { 会員ID: memberId, 職員ID: staffId, 作成日時: now, 更新日時: now, 削除フラグ: false };
    o[MEMBER_CONVERSION_E2E_REF_ID_HEADERS_[table]] = idValue;
    return o;
  };
  appendRowsByHeaders_(ss, 'T_役員', [ref('T_役員', 'OF-E2E-E1', ids.M_E1, ''), ref('T_役員', 'OF-E2E-A1', '', ids.S_A1),
    ref('T_役員', 'OF-E2E-E3', '', ids.S_E3), ref('T_役員', 'OF-E2E-OFC', ids.OFFICE_A, '')]);
  appendRowsByHeaders_(ss, 'T_振込口座', [ref('T_振込口座', 'BK-E2E-E1', ids.M_E1, '')]);
  appendRowsByHeaders_(ss, 'T_請求', [ref('T_請求', 'CL-E2E-E1', ids.M_E1, '')]);
  appendRowsByHeaders_(ss, 'T_支払い', [ref('T_支払い', 'PY-E2E-E1', ids.M_E1, ''), ref('T_支払い', 'PY-E2E-E3', '', ids.S_E3)]);
  appendRowsByHeaders_(ss, 'T_変更申請', [
    { 申請ID: 'CR-E2E-PEND', 会員ID: ids.M_PEND, 会員種別コード: 'INDIVIDUAL', 申請種別コード: 'MEMBER_UPDATE', 申請状態コード: 'PENDING', 申請内容JSON: '{"fields":{}}', 申請日時: now, 作成日時: now, 更新日時: now, 削除フラグ: false },
    { 申請ID: 'CR-E2E-DONE', 会員ID: ids.M_E1, 会員種別コード: 'INDIVIDUAL', 申請種別コード: 'MEMBER_UPDATE', 申請状態コード: 'APPROVED', 申請内容JSON: '{"fields":{}}', 申請日時: now, 作成日時: now, 更新日時: now, 削除フラグ: false },
  ]);
  // 完了記録の既存行（型の比べ先。既存の書き方 appendPersonMergeLog_ の tx なし経路）
  appendPersonMergeLog_(ss, { logId: 'PML-E2E-SEED', action: 'SEED', careManagerNumber: '00000001', oldMemberId: '19999999', newMemberId: '29999999', executedAt: now });
  SpreadsheetApp.flush();
}

function memberConversionE2eCreate_(ctx, label) {
  var ss = SpreadsheetApp.create(SHEETS_PROBE_FILE_PREFIX_ + 'E_' + label + '_' + ctx.stamp + '（自動でゴミ箱へ移します）');
  var f = { id: ss.getId(), created: true, keep: false };
  ctx.files.push(f);
  return { id: f.id, ss: ss, file: f };
}

function memberConversionE2eCopy_(ctx, sourceId, label) {
  var copy = DriveApp.getFileById(sourceId).makeCopy(SHEETS_PROBE_FILE_PREFIX_ + 'E_' + label + '_' + ctx.stamp + '（自動でゴミ箱へ移します）');
  var f = { id: copy.getId(), created: true, keep: false };
  ctx.files.push(f);
  return { id: f.id, ss: SpreadsheetApp.openById(f.id), file: f };
}

// 1 回目の実行で作った一時ファイルを開く（2 回目。別の実行なので 1 回目の書込みが見える）
function memberConversionE2eOpen_(ctx, fileId) {
  var f = { id: fileId, created: false, keep: false };
  ctx.files.push(f); // 終わったらゴミ箱へ
  return { id: fileId, ss: SpreadsheetApp.openById(fileId), file: f };
}

function memberConversionE2eOperationId_() {
  return 'e2e-' + Utilities.getUuid();
}

function memberConversionE2eI2S_(memberId, officeId) {
  return { direction: 'INDIVIDUAL_TO_STAFF', sourceMemberId: memberId, targetOfficeMemberId: officeId, staffRole: 'STAFF', operationId: memberConversionE2eOperationId_() };
}

function memberConversionE2eS2I_(officeId, staffId, successorId) {
  var p = { direction: 'STAFF_TO_INDIVIDUAL', sourceMemberId: officeId, sourceStaffId: staffId, operationId: memberConversionE2eOperationId_() };
  if (successorId) p.newRepresentativeStaffId = successorId;
  return p;
}

function runMemberConversionE2ePhase1_(ctx, report) {
  var ids = memberConversionE2eIds_();
  var people = memberConversionE2ePeople_();
  var base = memberConversionE2eCreate_(ctx, 'base');
  buildMemberConversionE2eBase_(base.ss);
  var baseSnap = probeSnapshotViaApi_(base.id);
  var baseRows = {};
  Object.keys(baseSnap).forEach(function(t) { baseRows[t] = baseSnap[t].rows.length; });
  report.observations.baseRows = baseRows;
  var run = function(spec) { return runMemberConversionE2eScenario_(ctx, report, base.id, spec); };
  var i2s = function(person, officeId, opts) {
    return function(before, result, payload) { return memberConversionE2eExpectI2S_(ctx, person, officeId, payload, result, opts); };
  };
  var s2i = function(person, opts) {
    return function(before, result, payload) { return memberConversionE2eExpectS2I_(ctx, person, payload, result, opts); };
  };

  run({ id: 'E1', title: '個人→職員（新しい職員行）', payload: memberConversionE2eI2S_(ids.M_E1, ids.OFFICE_A), expect: i2s(people.M_E1, ids.OFFICE_A),
    after: function(copy) {
      // 観察: API で書いた後に、同じ実行で開き直した SpreadsheetApp から新しい内容が見えるか（P0 の続き）
      var fresh = SpreadsheetApp.openById(copy.id);
      var found = findRowByColumnValue_(fresh.getSheetByName('T_会員'), '会員ID', ids.M_E1);
      report.observations.freshOpenSeesApiWrite = !!found && String(found.row[found.columns['会員状態コード']]) === 'TRANSFERRED';
    } });
  run({ id: 'E2', title: '個人→職員（同じ事業所の除籍済みの行を使い直す）', payload: memberConversionE2eI2S_(ids.M_E2, ids.OFFICE_A),
    expect: i2s(people.M_E2, ids.OFFICE_A, { reuseStaff: people.S_E2L }) });
  run({ id: 'E3', title: '職員→個人（新しい個人会員の行・番号の先頭 0）', payload: memberConversionE2eS2I_(ids.OFFICE_S, ids.S_E3), expect: s2i(people.S_E3) });
  run({ id: 'E4', title: '職員→個人（退会済みの個人会員の行を使い直す）', payload: memberConversionE2eS2I_(ids.OFFICE_S, ids.S_E4),
    expect: s2i(people.S_E4, { reuseMember: people.M_E4W }) });
  run({ id: 'E5', title: '職員→個人（代表者・後任あり）', payload: memberConversionE2eS2I_(ids.OFFICE_R, ids.S_REP, ids.S_SUC),
    expect: s2i(people.S_REP, { successorId: ids.S_SUC }) });
  run({ id: 'E6', title: '職員→個人（最後の 1 名の代表者・事業所は退会）', payload: memberConversionE2eS2I_(ids.OFFICE_L, ids.S_LAST),
    expect: s2i(people.S_LAST, { officeWithdrawnId: ids.OFFICE_L }) });

  // E7 往復の行き（戻りは 2 回目の実行）
  var e7a = run({ id: 'E7a-1', title: '往復（個人→職員→個人）の行き', keep: true, payload: memberConversionE2eI2S_(ids.M_E7, ids.OFFICE_A), expect: i2s(people.M_E7, ids.OFFICE_A) });
  var e7b = run({ id: 'E7b-1', title: '往復（職員→個人→職員）の行き', keep: true, payload: memberConversionE2eS2I_(ids.OFFICE_S, ids.S_RT), expect: s2i(people.S_RT) });

  // E8 止まる場合（どれも書く前に止まるので、1 つの一時ファイルで順に確かめる）
  var e8 = memberConversionE2eCopy_(ctx, base.id, 'E8');
  var stop = function(id, title, payload, message, prepare) {
    run({ id: id, title: title, target: e8, payload: payload, prepare: prepare,
      expect: function() { return { cells: [], appends: {}, error: message, batchCalls: 0 }; } });
  };
  stop('E8a', '止まる: 処理待ちの変更申請', memberConversionE2eI2S_(ids.M_PEND, ids.OFFICE_A), '処理待ちの変更申請');
  stop('E8b', '止まる: 介護支援専門員番号の重複', memberConversionE2eI2S_(ids.M_DUP, ids.OFFICE_A), '在籍職員が既に存在します');
  stop('E8c', '止まる: 職員数の上限', memberConversionE2eI2S_(ids.M_FULL, ids.OFFICE_F), '職員数上限');
  stop('E8d', '止まる: 後任の代表者の指定なし', memberConversionE2eS2I_(ids.OFFICE_R, ids.S_REP), '後任代表者の指定が必要');
  stop('E8e', '止まる: 表の列の欠落（T_役員.職員ID）', memberConversionE2eI2S_(ids.M_E1, ids.OFFICE_A), '移行に必要なデータ構造を確認できません', function(ss) {
    var sheet = ss.getSheetByName('T_役員');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    sheet.deleteColumn(headers.indexOf('職員ID') + 1);
    SpreadsheetApp.flush();
  });

  run({ id: 'E9', title: '一括更新が拒否された（失敗する要求を混ぜる）', inject: 'REJECT', payload: memberConversionE2eI2S_(ids.M_E9, ids.OFFICE_A),
    expect: function() { return { cells: [], appends: {}, error: '移行を反映できませんでした', batchCalls: 1 }; } });
  var e10 = run({ id: 'E10-1', title: '反映した後に応答が失われた（照会して成功と判定・送り直さない）', keep: true, inject: 'LOSE_RESPONSE',
    payload: memberConversionE2eI2S_(ids.M_E10, ids.OFFICE_A), expect: i2s(people.M_E10, ids.OFFICE_A, { batchCalls: 1 }) });

  // E11 規模: 本番の約 8 倍の行（2000 行）を足した表で E1・E3 と同じ移行
  if (Date.now() < ctx.deadline) {
    var scaled = memberConversionE2eCopy_(ctx, base.id, 'E11base');
    addMemberConversionE2eScaleRows_(scaled.ss, 2000);
    run({ id: 'E11a', title: '規模（2000 行）: 個人→職員', source: scaled.id, maxMs: 30000, payload: memberConversionE2eI2S_(ids.M_E1, ids.OFFICE_A), expect: i2s(people.M_E1, ids.OFFICE_A) });
    run({ id: 'E11b', title: '規模（2000 行）: 職員→個人', source: scaled.id, maxMs: 30000, payload: memberConversionE2eS2I_(ids.OFFICE_S, ids.S_E3), expect: s2i(people.S_E3) });
  } else {
    report.scenarios.push({ id: 'E11', passed: false, problems: ['時間切れで実行していません'] });
  }

  var need = [e7a, e7b, e10];
  if (need.some(function(x) { return !x || !x.result; })) throw new Error('往復の行き・E10 の 1 回目が成功しなかったため、2 回目に進めません。');
  return {
    createdAt: new Date().toISOString(),
    baseRows: baseRows,
    e7a: { fileId: e7a.copy.id, staffId: String(e7a.result.newStaffId) },
    e7b: { fileId: e7b.copy.id, memberId: String(e7b.result.newMemberId) },
    e10: { fileId: e10.copy.id, payload: e10.payload, staffId: String(e10.result.newStaffId) },
  };
}

function runMemberConversionE2ePhase2_(ctx, report, pending) {
  var ids = memberConversionE2eIds_();
  var people = memberConversionE2ePeople_();
  report.observations.phase1CreatedAt = pending.createdAt;
  // 往復の戻り（個人→職員→個人）: 移行済みの元の会員行を使い直し、同じ会員ID に戻る（2026-10-31 operator 決定）
  var e7aStaff = { key: 'E7A_STAFF', id: pending.e7a.staffId, office: ids.OFFICE_A, cm: people.M_E7.cm, last: people.M_E7.last, first: people.M_E7.first,
    lastKana: people.M_E7.lastKana, firstKana: people.M_E7.firstKana, email: people.M_E7.email, auth: people.M_E7.auth, apps: people.M_E7.apps, refs: {} };
  runMemberConversionE2eScenario_(ctx, report, null, { id: 'E7a-2', title: '往復（個人→職員→個人）の戻り', target: memberConversionE2eOpen_(ctx, pending.e7a.fileId),
    payload: memberConversionE2eS2I_(ids.OFFICE_A, pending.e7a.staffId),
    expect: function(before, result, payload) {
      var exp = memberConversionE2eExpectS2I_(ctx, e7aStaff, payload, result, { reuseMember: people.M_E7 });
      exp.totalRows = { T_会員: pending.baseRows['T_会員'] }; // 往復の全体で会員の行は増えない
      return exp;
    } });
  // 往復の戻り（職員→個人→職員）: 同じ事業所の元の職員行を使い直し、同じ職員ID に戻る
  var e7bMember = { key: 'E7B_MEMBER', id: pending.e7b.memberId, cm: people.S_RT.cm, last: people.S_RT.last, first: people.S_RT.first,
    lastKana: people.S_RT.lastKana, firstKana: people.S_RT.firstKana, email: people.S_RT.email, auth: people.S_RT.auth, apps: people.S_RT.apps, refs: {} };
  runMemberConversionE2eScenario_(ctx, report, null, { id: 'E7b-2', title: '往復（職員→個人→職員）の戻り', target: memberConversionE2eOpen_(ctx, pending.e7b.fileId),
    payload: memberConversionE2eI2S_(pending.e7b.memberId, ids.OFFICE_S),
    expect: function(before, result, payload) {
      var exp = memberConversionE2eExpectI2S_(ctx, e7bMember, ids.OFFICE_S, payload, result, { reuseStaff: people.S_RT });
      exp.totalRows = { T_事業所職員: pending.baseRows['T_事業所職員'] };
      return exp;
    } });
  // E10 と同じ操作IDをもう一度: 何も書かず、前の結果を返す
  runMemberConversionE2eScenario_(ctx, report, null, { id: 'E10-2', title: '同じ操作IDの再送（二度は実行しない）', target: memberConversionE2eOpen_(ctx, pending.e10.fileId),
    payload: pending.e10.payload,
    expect: function(before, result) {
      return { cells: [], appends: {}, batchCalls: 0, checks: [
        { label: '前の結果（alreadyApplied）を返す', ok: !!(result && result.alreadyApplied) },
        { label: '前と同じ職員ID', ok: !!result && String(result.newStaffId) === pending.e10.staffId },
      ] };
    } });
}

function addMemberConversionE2eScaleRows_(ss, count) {
  var now = new Date().toISOString();
  var members = [];
  var staff = [];
  var apps = [];
  for (var i = 0; i < count; i += 1) {
    members.push({ 会員ID: String(30000000 + i), 会員種別コード: 'INDIVIDUAL', 会員状態コード: 'ACTIVE', 入会日: '2020-04-01', 姓: '★規模', 名: String(i), 作成日時: now, 更新日時: now, 削除フラグ: false });
    staff.push({ 職員ID: 'SX' + i, 会員ID: '39999999', 姓: '★規模', 名: String(i), 職員権限コード: 'STAFF', 職員状態コード: 'ENROLLED', 入会日: '2021-04-01', 作成日時: now, 更新日時: now, 削除フラグ: false });
    apps.push({ 申込ID: 'TAX' + i, 研修ID: 'TR-E2E-1', 会員ID: String(30000000 + i), 申込者ID: String(30000000 + i), 申込状態コード: 'APPLIED', 作成日時: now, 更新日時: now, 削除フラグ: false });
  }
  appendRowsByHeaders_(ss, 'T_会員', members);
  appendRowsByHeaders_(ss, 'T_事業所職員', staff);
  appendRowsByHeaders_(ss, 'T_研修申込', apps);
  SpreadsheetApp.flush();
}

// 1 シナリオ: 一時ファイル（spec.target か、source/base の複製）で移行を 1 回実行し、前後を API で読んで判定する
function runMemberConversionE2eScenario_(ctx, report, baseId, spec) {
  var entry = { id: spec.id, title: spec.title, passed: false, problems: [] };
  report.scenarios.push(entry);
  if (Date.now() > ctx.deadline) {
    entry.problems.push('時間切れで実行していません');
    return null;
  }
  try {
    var copy = spec.target || memberConversionE2eCopy_(ctx, spec.source || baseId, spec.id);
    if (spec.keep) copy.file.keep = true;
    if (spec.prepare) spec.prepare(copy.ss);
    var before = probeSnapshotViaApi_(copy.id);
    ctx.batchCalls = 0;
    ctx.inject = spec.inject || '';
    var result = null;
    var error = '';
    var t0 = Date.now();
    try {
      result = convertMemberTypeOn_(copy.ss, spec.payload);
    } catch (e) {
      error = String(e && e.message ? e.message : e);
    } finally {
      ctx.inject = '';
    }
    entry.ms = Date.now() - t0;
    entry.batchCalls = ctx.batchCalls;
    if (error) entry.error = error;
    var after = probeSnapshotViaApi_(copy.id);
    var exp = spec.expect(before, result, spec.payload);
    var judged = memberConversionE2eJudge_(ctx, before, after, exp);
    entry.detail = judged.detail;
    var problems = judged.problems;
    if (exp.error) {
      if (!error) problems.push('止まるはずの移行が成功した');
      else if (error.indexOf(exp.error) < 0) problems.push('止まった理由が違う');
    } else if (error) {
      problems.push('移行が失敗した');
    }
    if (exp.batchCalls != null && ctx.batchCalls !== exp.batchCalls) problems.push('一括更新の回数 ' + ctx.batchCalls + '（期待 ' + exp.batchCalls + '）');
    (exp.checks || []).forEach(function(c) { if (!c.ok) problems.push(c.label); });
    Object.keys(exp.totalRows || {}).forEach(function(t) {
      var n = after[t] ? after[t].rows.length : -1;
      if (n !== exp.totalRows[t]) problems.push(t + ' の行数 ' + n + '（基準 ' + exp.totalRows[t] + '）');
    });
    if (spec.maxMs && entry.ms > spec.maxMs) problems.push('所要時間 ' + entry.ms + 'ms が上限 ' + spec.maxMs + 'ms を超えた');
    if (spec.after) spec.after(copy, result);
    entry.problems = problems;
    entry.passed = problems.length === 0;
    if (result) entry.result = { newMemberId: result.newMemberId || '', newStaffId: result.newStaffId || '', officeWithdrawn: !!result.officeWithdrawn, alreadyApplied: !!result.alreadyApplied };
    return { copy: copy, result: result, error: error, payload: spec.payload };
  } catch (e) {
    entry.problems.push('ABORT: ' + String(e && e.message ? e.message : e));
    return null;
  }
}

// 期待差分の 1 セル: m は { any } 変わっていればよい / { key } 型付きの値 / { id } ID（文字列か、数字だけなら数値）/ { today } 今日の日付
function memberConversionE2eMatch_(ctx, m, key) {
  if (m.any) return key !== '';
  if (m.today) return key === 'date:' + dateStringToSheetSerial_(ctx.today);
  if (Object.prototype.hasOwnProperty.call(m, 'id')) return memberConversionE2eIdMatches_(key, m.id);
  return key === m.key;
}

// 8 桁の会員ID は既存の書き方（setValues）で数値になる。文字列と数値のどちらでも同じ ID とみなす（型の一致は別に確かめる）
function memberConversionE2eIdMatches_(key, id) {
  var s = String(id == null ? '' : id);
  if (s === '') return key === '';
  if (key === 'string:' + s) return true;
  return isPlainNumberString_(s) && key === 'number:' + String(Number(s));
}

function memberConversionE2eRowNumber_(snap, table, idHeader, id) {
  var t = snap[table];
  if (!t) return 0;
  var c = t.headers.indexOf(idHeader);
  if (c < 0) return 0;
  for (var r = 0; r < t.rows.length; r += 1) if (memberConversionE2eIdMatches_(t.rows[r][c], id)) return r + 2;
  return 0;
}

function memberConversionE2eKeyType_(key) {
  return key === '' ? 'empty' : String(key).split(':')[0];
}

// 前後のスナップショットと期待差分を突き合わせる。
// - 変わったセル（probeChangedCells_）が「変わるべきセル」と完全に一致する（それ以外は 1 つも変わらない）
// - 期待値が前の値と同じセルは「変わってはならないセル」になる
// - 追加行の数と値、書いた値の型が既存の行（既存の書き方で入れた行）と同じ、同じ ID の型が表によって違わない
function memberConversionE2eJudge_(ctx, before, after, exp) {
  var problems = [];
  var diff = probeChangedCells_(before, after);
  var mustChange = {};
  var valueProblems = [];
  var idKeys = {};
  var noteId = function(m, key) {
    if (!m || !Object.prototype.hasOwnProperty.call(m, 'id') || String(m.id) === '' || key === '') return;
    (idKeys[String(m.id)] = idKeys[String(m.id)] || {})[memberConversionE2eKeyType_(key)] = true;
  };
  (exp.cells || []).forEach(function(c) {
    var rowNumber = memberConversionE2eRowNumber_(before, c.table, c.idHeader, c.id);
    var t = before[c.table];
    var col = t ? t.headers.indexOf(c.header) : -1;
    if (!rowNumber || col < 0) { problems.push(c.table + ' の ' + c.id + '「' + c.header + '」が見つからない'); return; }
    var key = c.table + '|' + c.header + '|' + rowNumber;
    var beforeVal = t.rows[rowNumber - 2][col];
    var afterRow = after[c.table] && after[c.table].rows[rowNumber - 2];
    var afterVal = afterRow && afterRow[col] != null ? afterRow[col] : '';
    noteId(c.m, afterVal);
    if (!c.m.any && memberConversionE2eMatch_(ctx, c.m, beforeVal)) return; // 期待値が前と同じ → 変わってはならない（下の unexpected で見る）
    mustChange[key] = true;
    if (!memberConversionE2eMatch_(ctx, c.m, afterVal)) valueProblems.push(key + '（' + memberConversionE2eKeyType_(afterVal) + '）');
  });
  var unexpected = diff.changed.filter(function(k) { return !mustChange[k]; });
  var missing = Object.keys(mustChange).filter(function(k) { return diff.changed.indexOf(k) < 0; });

  var appends = exp.appends || {};
  var appendProblems = [];
  var tables = {};
  Object.keys(after).forEach(function(t) { tables[t] = true; });
  Object.keys(appends).forEach(function(t) { tables[t] = true; });
  Object.keys(tables).forEach(function(t) {
    var got = diff.appended[t] || 0;
    var want = (appends[t] || []).length;
    if (got !== want) { appendProblems.push(t + ' の追加 ' + got + ' 行（期待 ' + want + '）'); return; }
    (appends[t] || []).forEach(function(rowExp, i) {
      var row = after[t].rows[before[t].rows.length + i];
      Object.keys(rowExp).forEach(function(h) {
        var col = after[t].headers.indexOf(h);
        var v = col >= 0 && row[col] != null ? row[col] : '';
        noteId(rowExp[h], v);
        if (col < 0 || !memberConversionE2eMatch_(ctx, rowExp[h], v)) appendProblems.push(t + ' 追加行「' + h + '」（' + memberConversionE2eKeyType_(v) + '）');
      });
    });
  });

  // 書いた値の型が、同じ列の既存の行（既存の書き方で入れた行）と同じか
  var typeMismatches = [];
  var legacyTypes = function(t, col) {
    var set = {};
    before[t].rows.forEach(function(r) { var k = r[col] == null ? '' : r[col]; if (k !== '') set[memberConversionE2eKeyType_(k)] = true; });
    return set;
  };
  var checkType = function(t, header, value) {
    if (value === '' || !before[t]) return;
    var col = before[t].headers.indexOf(header);
    if (col < 0) return;
    var set = legacyTypes(t, col);
    var type = memberConversionE2eKeyType_(value);
    if (Object.keys(set).length && !set[type]) typeMismatches.push(t + '「' + header + '」: 書いた型 ' + type + ' / 既存 ' + Object.keys(set).join('・'));
  };
  diff.changed.forEach(function(k) {
    var parts = k.split('|');
    var t = parts[0];
    var col = after[t].headers.indexOf(parts[1]);
    checkType(t, parts[1], after[t].rows[Number(parts[2]) - 2][col]);
  });
  Object.keys(diff.appended).forEach(function(t) {
    for (var i = before[t].rows.length; i < after[t].rows.length; i += 1) {
      after[t].headers.forEach(function(h, c) { checkType(t, h, after[t].rows[i][c]); });
    }
  });
  var idTypeConflicts = Object.keys(idKeys).filter(function(id) { return Object.keys(idKeys[id]).length > 1; });
  var leadingZeroLost = Object.keys(idKeys).filter(function(id) { return id.charAt(0) === '0' && idKeys[id].number; });

  if (unexpected.length) problems.push('変わってはならないセルが変わった ' + unexpected.length + ' 件');
  if (missing.length) problems.push('変わるべきセルが変わっていない ' + missing.length + ' 件');
  if (valueProblems.length) problems.push('値が期待と違う ' + valueProblems.length + ' 件');
  if (appendProblems.length) problems.push('追加行が期待と違う ' + appendProblems.length + ' 件');
  if (typeMismatches.length) problems.push('書いた値の型が既存の行と違う ' + typeMismatches.length + ' 件');
  if (idTypeConflicts.length) problems.push('同じ ID の型が表によって違う: ' + idTypeConflicts.join(', '));
  return {
    problems: problems,
    detail: {
      changedCells: diff.changed.length, expectedChanges: Object.keys(mustChange).length, appended: diff.appended,
      unexpected: unexpected.slice(0, 20), missing: missing.slice(0, 20), valueProblems: valueProblems.slice(0, 20),
      appendProblems: appendProblems.slice(0, 20), typeMismatches: typeMismatches.slice(0, 20),
      leadingZeroLostIds: leadingZeroLost, // 観察（§10.4）: 0 始まりの新しい会員ID が数値になって先頭の 0 を失った
    },
  };
}

function memberConversionE2eCell_(cells, table, idHeader, id, header, m) {
  cells.push({ table: table, idHeader: idHeader, id: id, header: header, m: m });
}

function memberConversionE2eLogId_(payload) {
  return normalizeConversionOperationId_(payload && payload.operationId);
}

// 個人→職員の期待差分。opts.reuseStaff: 使い直す職員（無ければ新しい職員行を 1 行足す）
function memberConversionE2eExpectI2S_(ctx, person, officeId, payload, result, opts) {
  opts = opts || {};
  var staffId = result && result.newStaffId ? String(result.newStaffId) : '(未作成)';
  var cells = [];
  var add = function(table, idHeader, id, header, m) { memberConversionE2eCell_(cells, table, idHeader, id, header, m); };
  add('T_会員', '会員ID', person.id, '会員状態コード', { key: 'string:TRANSFERRED' });
  add('T_会員', '会員ID', person.id, '移行日', { today: 1 });
  add('T_会員', '会員ID', person.id, '更新日時', { any: 1 });
  if (person.auth) {
    add('T_認証アカウント', '認証ID', person.auth, '会員ID', { id: officeId });
    add('T_認証アカウント', '認証ID', person.auth, '職員ID', { id: staffId });
    add('T_認証アカウント', '認証ID', person.auth, 'システムロールコード', { key: 'string:BUSINESS_MEMBER' });
    add('T_認証アカウント', '認証ID', person.auth, 'アカウント有効フラグ', { key: 'boolean:true' });
    add('T_認証アカウント', '認証ID', person.auth, '更新日時', { any: 1 });
  }
  if (person.whitelist) {
    add('T_管理者Googleホワイトリスト', 'ホワイトリストID', person.whitelist, '紐付け会員ID', { id: officeId });
    add('T_管理者Googleホワイトリスト', 'ホワイトリストID', person.whitelist, '変更日時', { any: 1 });
    add('T_管理者Googleホワイトリスト', 'ホワイトリストID', person.whitelist, '更新日時', { any: 1 });
  }
  (person.apps || []).forEach(function(appId) {
    add('T_研修申込', '申込ID', appId, '会員ID', { id: officeId });
    add('T_研修申込', '申込ID', appId, '申込者ID', { id: officeId });
    add('T_研修申込', '申込ID', appId, '職員ID', { id: staffId });
    add('T_研修申込', '申込ID', appId, '更新日時', { any: 1 });
  });
  Object.keys(person.refs || {}).forEach(function(table) {
    person.refs[table].forEach(function(rowId) {
      var h = MEMBER_CONVERSION_E2E_REF_ID_HEADERS_[table];
      add(table, h, rowId, '会員ID', { key: '' });
      add(table, h, rowId, '職員ID', { id: staffId });
      add(table, h, rowId, '更新日時', { any: 1 });
    });
  });
  var appends = {};
  var checks = [{ label: '新しい職員ID が返る', ok: !!(result && result.newStaffId) }];
  if (opts.reuseStaff) {
    var s = opts.reuseStaff;
    add('T_事業所職員', '職員ID', s.id, '職員状態コード', { key: 'string:ENROLLED' });
    add('T_事業所職員', '職員ID', s.id, '入会日', { today: 1 });
    add('T_事業所職員', '職員ID', s.id, '退会日', { key: '' });
    add('T_事業所職員', '職員ID', s.id, '削除フラグ', { key: 'boolean:false' });
    add('T_事業所職員', '職員ID', s.id, '職員権限コード', { key: 'string:STAFF' });
    add('T_事業所職員', '職員ID', s.id, '姓', { key: 'string:' + person.last });
    add('T_事業所職員', '職員ID', s.id, '名', { key: 'string:' + person.first });
    add('T_事業所職員', '職員ID', s.id, 'セイ', { key: 'string:' + person.lastKana });
    add('T_事業所職員', '職員ID', s.id, 'メイ', { key: 'string:' + person.firstKana });
    add('T_事業所職員', '職員ID', s.id, '氏名', { key: 'string:' + person.last + ' ' + person.first });
    add('T_事業所職員', '職員ID', s.id, 'フリガナ', { key: 'string:' + person.lastKana + ' ' + person.firstKana });
    add('T_事業所職員', '職員ID', s.id, 'メールアドレス', { key: 'string:' + person.email });
    add('T_事業所職員', '職員ID', s.id, '介護支援専門員番号', { key: 'string:' + person.cm });
    add('T_事業所職員', '職員ID', s.id, '更新日時', { any: 1 });
    checks.push({ label: '使い直した職員ID（' + s.id + '）が返る', ok: !!result && String(result.newStaffId) === s.id });
  } else {
    appends['T_事業所職員'] = [{ 職員ID: { id: staffId }, 会員ID: { id: officeId }, 職員状態コード: { key: 'string:ENROLLED' }, 職員権限コード: { key: 'string:STAFF' },
      入会日: { today: 1 }, 介護支援専門員番号: { key: 'string:' + person.cm }, メールアドレス: { key: 'string:' + person.email }, 削除フラグ: { key: 'boolean:false' } }];
  }
  appends['T_人物統合ログ'] = [{ ログID: { key: 'string:' + memberConversionE2eLogId_(payload) }, 処理種別: { key: 'string:INDIVIDUAL_TO_STAFF' },
    旧会員ID: { id: person.id }, 新会員ID: { id: officeId }, 新職員ID: { id: staffId }, 介護支援専門員番号: { key: 'string:' + person.cm } }];
  return { cells: cells, appends: appends, checks: checks, batchCalls: opts.batchCalls != null ? opts.batchCalls : 1 };
}

// 職員→個人の期待差分。opts.reuseMember: 使い直す個人会員（無ければ新しい会員行を 1 行足す）
// opts.successorId: 後任の代表者 / opts.officeWithdrawnId: 最後の 1 名で退会になる事業所
function memberConversionE2eExpectS2I_(ctx, person, payload, result, opts) {
  opts = opts || {};
  var newMemberId = result && result.newMemberId ? String(result.newMemberId) : '(未作成)';
  var cells = [];
  var add = function(table, idHeader, id, header, m) { memberConversionE2eCell_(cells, table, idHeader, id, header, m); };
  add('T_事業所職員', '職員ID', person.id, '職員状態コード', { key: 'string:LEFT' });
  add('T_事業所職員', '職員ID', person.id, '退会日', { today: 1 });
  add('T_事業所職員', '職員ID', person.id, '削除フラグ', { key: 'boolean:true' });
  add('T_事業所職員', '職員ID', person.id, '更新日時', { any: 1 });
  if (person.auth) {
    add('T_認証アカウント', '認証ID', person.auth, '会員ID', { id: newMemberId });
    add('T_認証アカウント', '認証ID', person.auth, '職員ID', { key: '' });
    add('T_認証アカウント', '認証ID', person.auth, 'システムロールコード', { key: 'string:INDIVIDUAL_MEMBER' });
    add('T_認証アカウント', '認証ID', person.auth, 'アカウント有効フラグ', { key: 'boolean:true' });
    add('T_認証アカウント', '認証ID', person.auth, '更新日時', { any: 1 });
  }
  (person.apps || []).forEach(function(appId) {
    add('T_研修申込', '申込ID', appId, '会員ID', { id: newMemberId });
    add('T_研修申込', '申込ID', appId, '申込者ID', { id: newMemberId });
    add('T_研修申込', '申込ID', appId, '職員ID', { key: '' });
    add('T_研修申込', '申込ID', appId, '更新日時', { any: 1 });
  });
  Object.keys(person.refs || {}).forEach(function(table) {
    person.refs[table].forEach(function(rowId) {
      var h = MEMBER_CONVERSION_E2E_REF_ID_HEADERS_[table];
      add(table, h, rowId, '会員ID', { id: newMemberId });
      add(table, h, rowId, '職員ID', { key: '' });
      add(table, h, rowId, '更新日時', { any: 1 });
    });
  });
  if (opts.successorId) {
    add('T_事業所職員', '職員ID', opts.successorId, '職員権限コード', { key: 'string:REPRESENTATIVE' });
    add('T_事業所職員', '職員ID', opts.successorId, '更新日時', { any: 1 });
  }
  if (opts.officeWithdrawnId) {
    add('T_会員', '会員ID', opts.officeWithdrawnId, '会員状態コード', { key: 'string:WITHDRAWN' });
    add('T_会員', '会員ID', opts.officeWithdrawnId, '退会日', { today: 1 });
    add('T_会員', '会員ID', opts.officeWithdrawnId, '更新日時', { any: 1 });
  }
  var appends = {};
  var checks = [
    { label: '新しい会員ID が返る', ok: !!(result && result.newMemberId) },
    { label: '事業所の退会の有無が結果と一致', ok: !!result && !!result.officeWithdrawn === !!opts.officeWithdrawnId },
  ];
  if (opts.reuseMember) {
    var m = opts.reuseMember;
    add('T_会員', '会員ID', m.id, '会員状態コード', { key: 'string:ACTIVE' });
    add('T_会員', '会員ID', m.id, '入会日', { today: 1 });
    add('T_会員', '会員ID', m.id, '退会日', { key: '' });
    add('T_会員', '会員ID', m.id, '移行日', { key: '' });
    add('T_会員', '会員ID', m.id, '姓', { key: 'string:' + person.last });
    add('T_会員', '会員ID', m.id, '名', { key: 'string:' + person.first });
    add('T_会員', '会員ID', m.id, 'セイ', { key: 'string:' + person.lastKana });
    add('T_会員', '会員ID', m.id, 'メイ', { key: 'string:' + person.firstKana });
    add('T_会員', '会員ID', m.id, '代表メールアドレス', { key: 'string:' + person.email });
    add('T_会員', '会員ID', m.id, '更新日時', { any: 1 });
    checks.push({ label: '使い直した会員ID（' + m.id + '）が返る', ok: !!result && String(result.newMemberId) === m.id });
  } else {
    appends['T_会員'] = [{ 会員ID: { id: newMemberId }, 会員種別コード: { key: 'string:INDIVIDUAL' }, 会員状態コード: { key: 'string:ACTIVE' }, 入会日: { today: 1 },
      介護支援専門員番号: { key: 'string:' + person.cm }, 代表メールアドレス: { key: 'string:' + person.email }, 削除フラグ: { key: 'boolean:false' } }];
  }
  appends['T_人物統合ログ'] = [{ ログID: { key: 'string:' + memberConversionE2eLogId_(payload) }, 処理種別: { key: 'string:STAFF_TO_INDIVIDUAL' },
    旧会員ID: { id: person.office }, 旧職員ID: { id: person.id }, 新会員ID: { id: newMemberId }, 介護支援専門員番号: { key: 'string:' + person.cm } }];
  return { cells: cells, appends: appends, checks: checks, batchCalls: 1 };
}

// ── dryRun E2E（operator 実行・実DB・自己完結: 投入→cascade→検証→復元→検証→掃除）──
var DRYRUN_CASCADE_TAG = 'DRYRUN_CASCADE';


// dryRun fixture 行のカウント（liveOnly=false で live 側 / true で archive 側）
function countDryRunCascadeRows_(ss, tag, archiveSide) {
  var total = 0;
  for (var i = 0; i < ARCHIVE_SOURCE_TABLES.length; i++) {
    var name = archiveSide ? ARCHIVE_SOURCE_TABLES[i] + '_archive' : ARCHIVE_SOURCE_TABLES[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) continue;
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    for (var r = 0; r < data.length; r++) {
      for (var c = 0; c < data[r].length; c++) {
        if (String(data[r][c]).indexOf(tag) === 0) { total++; break; }
      }
    }
  }
  return total;
}


// いずれかのセルが prefix で始まる行を物理削除する（dryRun sweep 用）
function removeRowsWithCellPrefix_(ss, sheetName, prefix) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var lastCol = sheet.getLastColumn();
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var keepRows = [];
  var removed = 0;
  for (var r = 0; r < data.length; r++) {
    var hit = false;
    for (var c = 0; c < data[r].length; c++) {
      if (String(data[r][c]).indexOf(prefix) === 0) { hit = true; break; }
    }
    if (hit) removed++;
    else keepRows.push(data[r]);
  }
  if (removed === 0) return 0;
  sheet.getRange(2, 1, data.length, lastCol).clearContent();
  if (keepRows.length > 0) sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
  return removed;
}

// ============================================================================
// DRYRUN APPLICATION SCENARIOS (2026-05-17)
//
// 本番 DB に DRYRUN_ プレフィックス付きで投入し、申込→承認→転籍経路を end-to-end
// 検証する synthetic transaction フレームワーク。
//
// 設計原則:
//   - テストデータの印: 全フィクスチャの名前に `★DRYRUN_`、メールは `@example.invalid`
//   - 後片付け: previewTestDataPurge_LOG → executeTestDataPurge_APPLY で物理削除する
//     （2026-10-11 までの manifest + 論理削除の方式は取りこぼしがあり廃止）
//   - AAA pattern: Arrange (payload 作成) → Act (関数呼出) → Assert (DB 副作用検証)
//   - Email isolation: CREDENTIAL_EMAIL_ENABLED を一時 false 化 + @example.invalid
//   - Independence: 各シナリオ独立、任意順序で実行可
//   - Idempotency: cleanup は同 runId に対し冪等
//
// 呼び出し:
//   1. dryRunApplicationScenarios()    — 全シナリオ実行（MASTER のみ）
//   2. previewTestDataPurge_LOG()        — 削除対象と件数を確認する
//   3. executeTestDataPurge_APPLY()      — 物理削除する
// ============================================================================

// 名前の先頭に★、メールアドレスは @example.invalid（テストデータの印・isTestMemberRow_ ほか）。
// 作ったデータは executeTestDataPurge_APPLY で物理削除する。
var DRYRUN_PREFIX = TEST_DATA_NAME_PREFIX + 'DRYRUN_';
var DRYRUN_EMAIL_DOMAIN = TEST_DATA_EMAIL_DOMAIN;
// 2026-10-11 に廃止した後片付けの記録。残っていれば executeTestDataPurge_APPLY が消す。
var DRYRUN_MANIFEST_KEY = 'DRYRUN_APPLICATION_MANIFEST_V1';
function dryRun_assertAdminOperator_() {
  // 2026-10-10: 以前は「clasp run からしか呼ばれない」前提で実行ユーザーを返すだけで、何も止めていなかった。
  // web app 経由では実行ユーザー＝デプロイした人なので常に通っていた（docs/302 §2）。
  var session = assertMasterOperator_('dryRun');
  return {
    loginId: session.loginId,
    permissionCode: session.adminPermissionLevel,
    displayName: session.displayName,
  };
}

function dryRun_pad_(n, width) {
  var s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

function dryRun_uniqueSuffix_(scenarioCode, index) {
  // 10 文字以内に収めるため、Date.now の下位 6 桁 + scenario code + index
  var base = String(Date.now()).slice(-6);
  return scenarioCode + base + dryRun_pad_(index, 2);
}

function dryRun_makeOfficeNumber_(seed) {
  // 事業所番号は半角英数字 10 文字。`DRYRUN` (6) + 4 桁数字。
  return 'DRYRUN' + dryRun_pad_(seed % 10000, 4);
}

function dryRun_makeCmNumber_(seed) {
  // 介護支援専門員番号: `DRYR` (4) + 6 桁数字 → 10 文字（典型的な CM 番号と同桁数）
  return 'DRYR' + dryRun_pad_(seed % 1000000, 6);
}

function dryRun_makeIndividualPayload_(suffix, opts) {
  opts = opts || {};
  return {
    memberType: 'INDIVIDUAL',
    lastName: DRYRUN_PREFIX + '個人姓' + suffix,
    firstName: '太郎' + suffix,
    lastKana: 'ドライラン',
    firstKana: 'タロウ',
    email: 'dryrun-ind-' + suffix.toLowerCase() + DRYRUN_EMAIL_DOMAIN,
    mobilePhone: '090-0000-0000',
    careManagerNumber: opts.careManagerNumber || dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + suffix.length),
    officeName: DRYRUN_PREFIX + '勤務先' + suffix,
    officePostCode: '5730000',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: 'DRYRUN町1-1-1',
    officeAddressLine2: '',
    phone: '072-000-0000',
    fax: '',
    homePostCode: '5730000',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: 'DRYRUN自宅1-1-1',
    homeAddressLine2: '',
    mailingPreference: 'EMAIL',
    preferredMailDestination: 'OFFICE',
  };
}

function dryRun_makeSupportPayload_(suffix) {
  return {
    memberType: 'SUPPORT',
    lastName: DRYRUN_PREFIX + '賛助姓' + suffix,
    firstName: '次郎' + suffix,
    lastKana: 'ドライラン',
    firstKana: 'ジロウ',
    email: 'dryrun-sup-' + suffix.toLowerCase() + DRYRUN_EMAIL_DOMAIN,
    mobilePhone: '090-0000-0001',
    careManagerNumber: '',
    officeName: '',
    officePostCode: '',
    officePrefecture: '',
    officeCity: '',
    officeAddressLine: '',
    officeAddressLine2: '',
    phone: '',
    fax: '',
    homePostCode: '5730000',
    homePrefecture: '大阪府',
    homeCity: '枚方市',
    homeAddressLine: 'DRYRUN賛助自宅1-1-1',
    homeAddressLine2: '',
    mailingPreference: 'EMAIL',
    preferredMailDestination: 'HOME',
  };
}

function dryRun_makeBizPayload_(suffix, opts) {
  opts = opts || {};
  var officeNumberSeed = parseInt(String(Date.now()).slice(-4), 10) + suffix.length * 7;
  var officeNumber = opts.officeNumber || dryRun_makeOfficeNumber_(officeNumberSeed);
  var staffList = opts.staff || [
    { role: 'REPRESENTATIVE', last: '代表', first: '太郎' },
    { role: 'STAFF', last: '職員A', first: '花子' },
    { role: 'STAFF', last: '職員B', first: '次郎' },
    { role: 'ADMIN', last: '管理者', first: '三郎' },
  ];
  var built = staffList.map(function(s, idx) {
    return {
      role: s.role || 'STAFF',
      lastName: DRYRUN_PREFIX + s.last + suffix,
      firstName: s.first + suffix,
      lastKana: 'ドライラン',
      firstKana: 'スタッフ',
      email: 'dryrun-staff-' + suffix.toLowerCase() + '-' + idx + DRYRUN_EMAIL_DOMAIN,
      careManagerNumber: s.careManagerNumber || dryRun_makeCmNumber_(officeNumberSeed * 10 + idx),
    };
  });
  return {
    memberType: 'BUSINESS',
    officeName: DRYRUN_PREFIX + '事業所' + suffix,
    officeNumber: officeNumber,
    representativeEmail: built[0].email,
    officePostCode: '5730000',
    officePrefecture: '大阪府',
    officeCity: '枚方市',
    officeAddressLine: 'DRYRUN事業所1-1-1',
    officeAddressLine2: '',
    phone: '072-100-0000',
    fax: '072-100-0001',
    staff: built,
  };
}

function dryRun_runScenario_(state, scenarioName, fn) {
  var startedAt = new Date().toISOString();
  var assertions = [];
  function assert(condition, message) {
    assertions.push({ ok: !!condition, message: message });
    if (!condition) throw new Error('Assertion failed: ' + message);
  }
  var ok = false;
  var error = null;
  var result = null;
  try {
    result = fn(assert) || {};
    ok = true;
  } catch (e) {
    error = e.message || String(e);
  }
  var finishedAt = new Date().toISOString();
  state.report.scenarios.push({
    name: scenarioName,
    passed: ok,
    error: error,
    startedAt: startedAt,
    finishedAt: finishedAt,
    assertions: assertions,
    result: result,
  });
  if (ok) state.report.passedCount++;
  else state.report.failedCount++;
}

function dryRun_submitAndApprove_(payload, adminSession) {
  var enqueue = submitMemberApplication_(payload);
  if (!enqueue || !enqueue.requestId) throw new Error('enqueue 失敗: ' + JSON.stringify(enqueue));
  var approveResult = withChangeRequestDecisionLock_(function() {
    return approveAdminChangeRequest_({
      requestId: enqueue.requestId,
      note: 'DRYRUN approval',
      __adminSession: adminSession,
    });
  });
  if (!approveResult || approveResult.success !== true) {
    throw new Error('approve 失敗: ' + JSON.stringify(approveResult));
  }
  return {
    requestId: enqueue.requestId,
    result: approveResult.result || {},
  };
}

function dryRun_findMemberById_(ss, memberId) {
  var rows = getRowsAsObjects_(ss, 'T_会員');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['会員ID'] || '') === String(memberId)) return rows[i];
  }
  return null;
}

function dryRun_findStaffByMemberId_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return String(r['会員ID'] || '') === String(memberId);
  });
}

function dryRun_findAuthByMemberId_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return String(r['会員ID'] || '') === String(memberId);
  });
}

function dryRun_recordMember_(state, memberId) {
  if (memberId) state.manifest.memberIds[memberId] = true;
}

function dryRun_recordAllSideEffects_(state, ss, memberId) {
  dryRun_recordMember_(state, memberId);
  var staffRows = dryRun_findStaffByMemberId_(ss, memberId);
  for (var i = 0; i < staffRows.length; i++) {
    var sid = String(staffRows[i]['職員ID'] || '');
    if (sid) state.manifest.staffIds[sid] = true;
  }
  var authRows = dryRun_findAuthByMemberId_(ss, memberId);
  for (var j = 0; j < authRows.length; j++) {
    var aid = String(authRows[j]['認証ID'] || '');
    if (aid) state.manifest.authIds[aid] = true;
  }
}

function dryRun_recordChangeRequest_(state, requestId) {
  if (requestId) state.manifest.requestIds[requestId] = true;
}

// ── シナリオ実装 ─────────────────────────────────────────────────────────
function dryRun_scenario_newIndividual_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_INDIVIDUAL', function(assert) {
    var suffix = 'IND' + state.runStamp;
    var payload = dryRun_makeIndividualPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'INDIVIDUAL', '会員種別コード=INDIVIDUAL');
    assert(String(memberRow['会員状態コード']) === 'ACTIVE', '会員状態コード=ACTIVE');
    assert(String(memberRow['介護支援専門員番号']) === payload.careManagerNumber, 'CM 番号一致');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === 1, 'T_認証アカウント 1 行作成 (got ' + auths.length + ')');
    assert(String(auths[0]['ログインID']) === payload.careManagerNumber, 'ログインID=CM番号');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId, loginId: io.result.loginId };
  });
}

function dryRun_scenario_newSupport_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_SUPPORT', function(assert) {
    var suffix = 'SUP' + state.runStamp;
    var payload = dryRun_makeSupportPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'SUPPORT', '会員種別=SUPPORT');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === 1, 'T_認証アカウント 1 行作成');
    assert(String(auths[0]['ログインID']) === memberId, '賛助のログインIDは会員ID');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId };
  });
}

function dryRun_scenario_newBusiness_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'NEW_BUSINESS', function(assert) {
    var suffix = 'BIZ' + state.runStamp;
    var payload = dryRun_makeBizPayload_(suffix);
    var io = dryRun_submitAndApprove_(payload, adminSession);
    dryRun_recordChangeRequest_(state, io.requestId);
    var memberId = io.result.memberId;
    assert(!!memberId, 'memberId が返ること');
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, 'T_会員 行が作成されていること');
    assert(String(memberRow['会員種別コード']) === 'BUSINESS', '会員種別=BUSINESS');
    assert(String(memberRow['事業所番号']) === payload.officeNumber, '事業所番号一致');
    var staffRows = dryRun_findStaffByMemberId_(ss, memberId);
    assert(staffRows.length === payload.staff.length,
      '職員 ' + payload.staff.length + ' 名作成 (got ' + staffRows.length + ')');
    var repCount = 0;
    for (var i = 0; i < staffRows.length; i++) {
      if (String(staffRows[i]['職員権限コード']) === 'REPRESENTATIVE') repCount++;
    }
    assert(repCount === 1, '代表者は 1 名');
    var auths = dryRun_findAuthByMemberId_(ss, memberId);
    assert(auths.length === payload.staff.length, '認証アカウント ' + payload.staff.length + ' 行');
    dryRun_recordAllSideEffects_(state, ss, memberId);
    return { memberId: memberId, staffCount: staffRows.length };
  });
}

function dryRun_scenario_transferIndividualToStaff_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_INDIVIDUAL_TO_STAFF', function(assert) {
    // Arrange: 既存個人会員を作成
    var indSuffix = 'I2S' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 17);
    var indPayload = dryRun_makeIndividualPayload_(indSuffix, { careManagerNumber: sharedCm });
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var sourceMemberId = indIo.result.memberId;
    assert(!!sourceMemberId, '前提: 個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, sourceMemberId);

    // Act: 同 CM を含む事業所申込 → 転籍
    var bizSuffix = 'I2SB' + state.runStamp;
    var bizPayload = dryRun_makeBizPayload_(bizSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: '代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 19) },
        { role: 'STAFF', last: '転籍者', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bizIo = dryRun_submitAndApprove_(bizPayload, adminSession);
    dryRun_recordChangeRequest_(state, bizIo.requestId);
    var bizMemberId = bizIo.result.memberId;
    assert(!!bizMemberId, '事業所会員作成');
    dryRun_recordAllSideEffects_(state, ss, bizMemberId);

    // Assert: 元個人会員が WITHDRAWN になり、事業所職員として登録されている
    var srcMember = dryRun_findMemberById_(ss, sourceMemberId);
    assert(srcMember, '元個人会員行存在');
    var srcStatus = String(srcMember['会員状態コード'] || '');
    assert(srcStatus === 'TRANSFERRED' || srcStatus === 'WITHDRAWN',
      '元個人会員が TRANSFERRED/WITHDRAWN になっている (got ' + srcStatus + ')');
    var bizStaffRows = dryRun_findStaffByMemberId_(ss, bizMemberId);
    var transferredStaff = null;
    for (var i = 0; i < bizStaffRows.length; i++) {
      if (String(bizStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        transferredStaff = bizStaffRows[i];
        break;
      }
    }
    assert(transferredStaff, '事業所側に CM 一致の職員が存在');
    return { sourceMemberId: sourceMemberId, bizMemberId: bizMemberId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_transferStaffToIndividual_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_STAFF_TO_INDIVIDUAL', function(assert) {
    // Arrange: 事業所会員 + 職員 (CM 共有)
    var bizSuffix = 'S2I' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 23);
    var bizPayload = dryRun_makeBizPayload_(bizSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: '代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 29) },
        { role: 'STAFF', last: '独立予定', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bizIo = dryRun_submitAndApprove_(bizPayload, adminSession);
    dryRun_recordChangeRequest_(state, bizIo.requestId);
    var bizMemberId = bizIo.result.memberId;
    assert(!!bizMemberId, '前提: 事業所会員作成');
    dryRun_recordAllSideEffects_(state, ss, bizMemberId);

    // Act: 同 CM で個人会員申込 → convertStaffToIndividual_ が走る
    var indSuffix = 'S2II' + state.runStamp;
    var indPayload = dryRun_makeIndividualPayload_(indSuffix, { careManagerNumber: sharedCm });
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var newMemberId = indIo.result.memberId;
    assert(!!newMemberId, '新個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, newMemberId);

    // Assert: 元事業所職員が ENROLLED でなくなっている
    var bizStaffRows = dryRun_findStaffByMemberId_(ss, bizMemberId);
    var formerStaff = null;
    for (var i = 0; i < bizStaffRows.length; i++) {
      if (String(bizStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        formerStaff = bizStaffRows[i];
        break;
      }
    }
    if (formerStaff) {
      var fs = String(formerStaff['職員状態コード'] || '');
      assert(fs !== 'ENROLLED', '元職員は ENROLLED でなくなっている (got ' + fs + ')');
    }
    var newMember = dryRun_findMemberById_(ss, newMemberId);
    assert(newMember, '新個人会員行存在');
    assert(String(newMember['会員種別コード']) === 'INDIVIDUAL', '会員種別=INDIVIDUAL');
    assert(String(newMember['介護支援専門員番号']) === sharedCm, 'CM 引継ぎ');
    return { bizMemberId: bizMemberId, newMemberId: newMemberId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_transferStaffAcrossBiz_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'TRANSFER_STAFF_ACROSS_BIZ', function(assert) {
    // Arrange: 事業所 A + 職員 (CM 共有)
    var aSuffix = 'BA' + state.runStamp;
    var sharedCm = dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 31);
    var aPayload = dryRun_makeBizPayload_(aSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: 'A代表', first: '太郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 37) },
        { role: 'STAFF', last: '移籍予定', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var aIo = dryRun_submitAndApprove_(aPayload, adminSession);
    dryRun_recordChangeRequest_(state, aIo.requestId);
    var bizAId = aIo.result.memberId;
    assert(!!bizAId, '事業所 A 作成');
    dryRun_recordAllSideEffects_(state, ss, bizAId);

    // Act: 事業所 B 申込（同 CM の職員含む）
    var bSuffix = 'BB' + state.runStamp;
    var bPayload = dryRun_makeBizPayload_(bSuffix, {
      staff: [
        { role: 'REPRESENTATIVE', last: 'B代表', first: '次郎', careManagerNumber: dryRun_makeCmNumber_(parseInt(String(Date.now()).slice(-6), 10) + 41) },
        { role: 'STAFF', last: '移籍者', first: '花子', careManagerNumber: sharedCm },
      ],
    });
    var bIo = dryRun_submitAndApprove_(bPayload, adminSession);
    dryRun_recordChangeRequest_(state, bIo.requestId);
    var bizBId = bIo.result.memberId;
    assert(!!bizBId, '事業所 B 作成');
    dryRun_recordAllSideEffects_(state, ss, bizBId);

    // Assert: A 側の職員が ENROLLED でなく、B 側に同 CM 職員が存在
    var aStaffRows = dryRun_findStaffByMemberId_(ss, bizAId);
    var formerStaff = null;
    for (var i = 0; i < aStaffRows.length; i++) {
      if (String(aStaffRows[i]['介護支援専門員番号']) === sharedCm) {
        formerStaff = aStaffRows[i];
        break;
      }
    }
    if (formerStaff) {
      var fs = String(formerStaff['職員状態コード'] || '');
      assert(fs !== 'ENROLLED', '事業所 A 側元職員は ENROLLED ではない (got ' + fs + ')');
    }
    var bStaffRows = dryRun_findStaffByMemberId_(ss, bizBId);
    var newStaff = null;
    for (var j = 0; j < bStaffRows.length; j++) {
      if (String(bStaffRows[j]['介護支援専門員番号']) === sharedCm) {
        newStaff = bStaffRows[j];
        break;
      }
    }
    assert(newStaff, '事業所 B 側に CM 一致の職員が存在');
    return { bizAId: bizAId, bizBId: bizBId, sharedCm: sharedCm };
  });
}

function dryRun_scenario_memberTypeChange_(state, ss, adminSession) {
  dryRun_runScenario_(state, 'MEMBER_TYPE_CHANGE_IND_TO_SUPPORT', function(assert) {
    // Arrange: 個人会員作成
    var suffix = 'TYP' + state.runStamp;
    var indPayload = dryRun_makeIndividualPayload_(suffix);
    var indIo = dryRun_submitAndApprove_(indPayload, adminSession);
    dryRun_recordChangeRequest_(state, indIo.requestId);
    var memberId = indIo.result.memberId;
    assert(!!memberId, '個人会員作成');
    dryRun_recordAllSideEffects_(state, ss, memberId);

    // Act: convertMemberType_ を直接呼び出し（INDIVIDUAL → SUPPORT）
    var convertResult;
    try {
      convertResult = convertMemberType_({ memberId: memberId, newMemberType: 'SUPPORT' });
    } catch (e) {
      throw new Error('convertMemberType_ 呼出失敗: ' + e.message);
    }
    assert(convertResult && convertResult.success !== false, 'convertMemberType_ 成功');

    // Assert: 会員種別が SUPPORT に変わっている
    var memberRow = dryRun_findMemberById_(ss, memberId);
    assert(memberRow, '会員行存在');
    var newType = String(memberRow['会員種別コード'] || '');
    assert(newType === 'SUPPORT', '会員種別が SUPPORT に変わっている (got ' + newType + ')');
    return { memberId: memberId, newType: newType };
  });
}

// ── メインエントリ ───────────────────────────────────────────────────────
function dryRunApplicationScenarios() {
  var adminSession = dryRun_assertAdminOperator_();
  var ss = getOrCreateDatabase_();
  var runStamp = String(Date.now()).slice(-5);
  var startedAt = new Date().toISOString();

  var state = {
    runStamp: runStamp,
    report: {
      runId: 'DRYRUN_' + runStamp + '_' + Utilities.getUuid().substring(0, 8),
      operator: adminSession.loginId,
      // 2026-10-13: セッションに permissionCode は無い（adminPermissionLevel）。以前は常に空だった。
      permissionCode: adminSession.adminPermissionLevel,
      startedAt: startedAt,
      finishedAt: null,
      passedCount: 0,
      failedCount: 0,
      scenarios: [],
    },
    manifest: {
      memberIds: {},
      staffIds: {},
      authIds: {},
      requestIds: {},
    },
  };

  // ── Email isolation: CREDENTIAL_EMAIL_ENABLED を一時 false 化 ────────────
  var originalEmailEnabled = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
  var emailSettingExisted = (originalEmailEnabled !== '' && originalEmailEnabled !== null);
  try {
    batchUpsertSystemSettings_(ss, [{ key: 'CREDENTIAL_EMAIL_ENABLED', value: 'false', description: 'dryRun: 一時的に無効化' }]);
  } catch (e) {
    Logger.log('dryRun: email setting toggle failed (continuing with @example.invalid as defense): ' + e.message);
  }

  try {
    dryRun_scenario_newIndividual_(state, ss, adminSession);
    dryRun_scenario_newSupport_(state, ss, adminSession);
    dryRun_scenario_newBusiness_(state, ss, adminSession);
    dryRun_scenario_transferIndividualToStaff_(state, ss, adminSession);
    dryRun_scenario_transferStaffToIndividual_(state, ss, adminSession);
    dryRun_scenario_transferStaffAcrossBiz_(state, ss, adminSession);
    dryRun_scenario_memberTypeChange_(state, ss, adminSession);
  } finally {
    // 元の email 設定を復元
    try {
      var restoreValue = emailSettingExisted ? String(originalEmailEnabled) : 'true';
      batchUpsertSystemSettings_(ss, [{ key: 'CREDENTIAL_EMAIL_ENABLED', value: restoreValue, description: 'dryRun: 復元' }]);
    } catch (e) {
      Logger.log('dryRun: email setting restore failed: ' + e.message);
    }
  }

  state.report.finishedAt = new Date().toISOString();
  state.report.manifestCounts = {
    members: Object.keys(state.manifest.memberIds).length,
    staff: Object.keys(state.manifest.staffIds).length,
    auth: Object.keys(state.manifest.authIds).length,
    changeRequests: Object.keys(state.manifest.requestIds).length,
  };

  Logger.log('dryRunApplicationScenarios: ' + JSON.stringify(state.report));
  // clasp run は util.inspect で出力するためネストが [Object]/[Array] に省略される。
  // 文字列で返すことで全データを取り出せるようにする。
  return '__DRYRUN_JSON__' + JSON.stringify(state.report);
}
