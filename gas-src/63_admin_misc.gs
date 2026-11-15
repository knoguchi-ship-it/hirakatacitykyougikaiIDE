// gas-src/63_admin_misc.gs — 共有メモ・規程・データの書き出し。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ─── v309: 共有メモ（申し送りホワイトボード）────────────────────────────────

function getSharedMemo_(payload) {
  var key = String((payload && payload.key) || 'ANNUAL_FEE_BOARD');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_共有メモ');
  if (!sheet || sheet.getLastRow() < 2) {
    return { key: key, content: '', updatedByEmail: '', updatedByName: '', updatedAt: '', version: 0 };
  }
  var found = findRowByColumnValue_(sheet, 'キー', key);
  if (!found) {
    return { key: key, content: '', updatedByEmail: '', updatedByName: '', updatedAt: '', version: 0 };
  }
  var row = found.row;
  var cols = found.columns;
  return {
    key: key,
    content: String(row[cols['内容']] || ''),
    updatedByEmail: String(row[cols['更新者メール']] || ''),
    updatedByName: String(row[cols['更新者名']] || ''),
    updatedAt: String(row[cols['更新日時']] || ''),
    version: parseInt(String(row[cols['バージョン']] || '0'), 10) || 0,
  };
}

function saveSharedMemo_(payload) {
  var key = String((payload && payload.key) || 'ANNUAL_FEE_BOARD');
  var content = String((payload && payload.content !== undefined) ? payload.content : '');
  var clientVersion = parseInt(String((payload && payload.version) || '0'), 10) || 0;
  var session = payload && payload.__adminSession;
  var editorEmail = session ? String(session.loginId || '') : '';
  var editorName = session ? String(session.displayName || '') : '';

  var ss = getOrCreateDatabase_();
  // シートが存在しない場合はヘッダー付きで新規作成
  var sheet = getOrCreateSheet_(ss, 'T_共有メモ');
  writeSheetHeaders_(sheet, テーブル定義['T_共有メモ']);

  var now = new Date().toISOString();
  var found = (sheet.getLastRow() >= 2) ? findRowByColumnValue_(sheet, 'キー', key) : null;

  if (found) {
    var serverVersion = parseInt(String(found.row[found.columns['バージョン']] || '0'), 10) || 0;
    // 楽観的排他制御: クライアントのバージョンが古い場合は競合として返す
    if (clientVersion < serverVersion) {
      return {
        conflict: true,
        current: {
          key: key,
          content: String(found.row[found.columns['内容']] || ''),
          updatedByEmail: String(found.row[found.columns['更新者メール']] || ''),
          updatedByName: String(found.row[found.columns['更新者名']] || ''),
          updatedAt: String(found.row[found.columns['更新日時']] || ''),
          version: serverVersion,
        },
      };
    }
    var newVersion = serverVersion + 1;
    var newRow = found.row.slice();
    newRow[found.columns['内容']] = content;
    newRow[found.columns['更新者メール']] = editorEmail;
    newRow[found.columns['更新者名']] = editorName;
    newRow[found.columns['更新日時']] = now;
    newRow[found.columns['バージョン']] = newVersion;
    sheet.getRange(found.rowNumber, 1, 1, newRow.length).setValues([newRow]);
    return { key: key, content: content, updatedByEmail: editorEmail, updatedByName: editorName, updatedAt: now, version: newVersion };
  }

  // 新規行を追加
  appendRowsByHeaders_(ss, 'T_共有メモ', [{
    'キー': key,
    '内容': content,
    '更新者メール': editorEmail,
    '更新者名': editorName,
    '更新日時': now,
    'バージョン': 1,
  }]);
  return { key: key, content: content, updatedByEmail: editorEmail, updatedByName: editorName, updatedAt: now, version: 1 };
}





// ============================================================
// v376.65（案C Phase 1）: 規程・重要事項マスタ
// 本文の正本は T_規程 の 1 箇所。公開ポータルの入会申込画面と管理設定が同じ行を読む。
// ============================================================

var REGULATION_KINDS = ['NOTICE', 'REGULATION'];
// 対象会員種別は 'ALL' か M_会員種別 の有効なコード（getActiveMemberTypeCodes_）
var REGULATION_TARGET_ALL = 'ALL';

// 初期 seed（従来フロントにハードコードされていた文面をそのまま移行する）。
// 既に行があるときは何もしない＝事務局の改定を上書きしない。
var REGULATION_SEED = [
  { kind: 'NOTICE', title: '会費の返還について', body: '納入後の会費は、いかなる理由があっても返還できません。', url: '', urlLabel: '', target: 'ALL', order: 1 },
  { kind: 'NOTICE', title: '個人情報の利用目的', body: '登録情報は、台帳管理、定例会・研修会等の周知、受付確認、広報発送など、協議会運営に必要な範囲でのみ利用します。', url: '', urlLabel: '', target: 'ALL', order: 2 },
  { kind: 'NOTICE', title: '変更・退会の手続き', body: '登録情報の変更や退会は、協議会ホームページからお手続きください。', url: 'https://sites.google.com/view/starhirakata/%E5%85%A5%E4%BC%9A%E9%80%80%E4%BC%9A?authuser=0', urlLabel: '入会・退会案内を開く', target: 'ALL', order: 3 },
  { kind: 'NOTICE', title: '退会の締切', body: '退会は年度切替前の3月末までに完了してください。手続きがない場合は継続扱いとなり、当該年度の会費納入が必要です。', url: '', urlLabel: '', target: 'ALL', order: 4 },
  { kind: 'REGULATION', title: '協議会の定款', body: '入会前に、協議会の基本規程も確認できます。', url: 'https://sites.google.com/view/starhirakata/%E5%AE%9A%E6%AC%BE?authuser=0', urlLabel: '定款を確認する', target: 'ALL', order: 5 }
];










function seedRegulationsIfEmpty_(ss) {
  var sheet = ss.getSheetByName('T_規程');
  if (!sheet) return;
  if (sheet.getLastRow() >= 2) return; // 既存行があれば触らない
  var now = new Date().toISOString();
  var rows = [];
  for (var i = 0; i < REGULATION_SEED.length; i += 1) {
    var seed = REGULATION_SEED[i];
    rows.push({
      '規程ID': 'REG-' + ('000' + (i + 1)).slice(-3),
      '区分コード': seed.kind,
      'タイトル': seed.title,
      '本文': seed.body,
      '外部リンクURL': seed.url,
      '外部リンク文言': seed.urlLabel,
      '対象会員種別': seed.target,
      '版数': 1,
      '施行日': '',
      '表示順': seed.order,
      '公開フラグ': true,
      '更新者メール': '',
      '削除フラグ': false,
      '作成日時': now,
      '更新日時': now
    });
  }
  appendRowsByHeaders_(ss, 'T_規程', rows);
}

function regulationRowToObject_(row) {
  return {
    id: String(row['規程ID'] || ''),
    kind: String(row['区分コード'] || 'NOTICE'),
    title: String(row['タイトル'] || ''),
    body: String(row['本文'] || ''),
    linkUrl: String(row['外部リンクURL'] || ''),
    linkLabel: String(row['外部リンク文言'] || ''),
    target: String(row['対象会員種別'] || 'ALL'),
    version: Number(row['版数'] || 1),
    effectiveDate: String(row['施行日'] || ''),
    sortOrder: Number(row['表示順'] || 0),
    published: toBoolean_(row['公開フラグ']),
    updatedBy: String(row['更新者メール'] || ''),
    updatedAt: String(row['更新日時'] || '')
  };
}

// 規程を表示順で返す。publishedOnly=true のときは公開フラグの立った行だけ（公開ポータル用）。
function listRegulations_(ss, publishedOnly) {
  var target = ss || getOrCreateDatabase_();
  if (!target.getSheetByName('T_規程')) return [];
  var rows = getRowsAsObjects_(target, 'T_規程').filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    if (publishedOnly && !toBoolean_(row['公開フラグ'])) return false;
    return true;
  });
  var list = rows.map(function(row) {
    var obj = regulationRowToObject_(row);
    // 2026-10-13: 公開ポータル用（publishedOnly）には更新者のメールを含めない（匿名に事務局員のアドレスが渡っていた）
    if (publishedOnly) delete obj.updatedBy;
    return obj;
  });
  list.sort(function(a, b) {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  });
  return list;
}

function validateRegulationPayload_(payload, memberTypeCodes) {
  var title = String((payload && payload.title) || '').trim();
  var body = String((payload && payload.body) || '');
  var kind = String((payload && payload.kind) || 'NOTICE');
  var targetType = String((payload && payload.target) || 'ALL');
  var linkUrl = String((payload && payload.linkUrl) || '').trim();
  var linkLabel = String((payload && payload.linkLabel) || '').trim();
  if (!title) throw new Error('タイトルを入力してください。');
  if (title.length > 100) throw new Error('タイトルは 100 文字以内で入力してください。');
  if (body.length > 20000) throw new Error('本文は 20,000 文字以内で入力してください。');
  if (REGULATION_KINDS.indexOf(kind) < 0) throw new Error('区分の値が不正です。');
  if (targetType !== REGULATION_TARGET_ALL && (memberTypeCodes || []).indexOf(targetType) < 0) {
    throw new Error('対象会員種別の値が不正です。');
  }
  if (linkUrl && linkUrl.indexOf('https://') !== 0) throw new Error('外部リンクは https:// で始まる URL を入力してください。');
  if (linkUrl.length > 500) throw new Error('外部リンクは 500 文字以内で入力してください。');
  if (linkLabel.length > 40) throw new Error('外部リンクの文言は 40 文字以内で入力してください。');
  return { title: title, body: body, kind: kind, target: targetType, linkUrl: linkUrl, linkLabel: linkLabel };
}

// 新規追加 / 既存更新。本文・タイトル・リンクが変わったときだけ版数を +1 する
// （Phase 2 の同意記録が「どの版に同意したか」を指せるようにするため）。
function saveRegulation_(payload, operatorEmail) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var v = validateRegulationPayload_(payload, getActiveMemberTypeCodes_(ss));
  var sheet = ss.getSheetByName('T_規程');
  if (!sheet) throw new Error('T_規程 が初期化されていません。');
  var now = new Date().toISOString();
  var id = String((payload && payload.id) || '').trim();
  var sortOrder = Number((payload && payload.sortOrder) || 0);
  if (!isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999) sortOrder = 0;
  var published = payload && payload.published != null ? !!payload.published : true;
  var effectiveDate = String((payload && payload.effectiveDate) || '').trim();

  if (!id) {
    var existing = getRowsAsObjects_(ss, 'T_規程');
    var maxSeq = 0;
    for (var i = 0; i < existing.length; i += 1) {
      var m = /^REG-(\d+)$/.exec(String(existing[i]['規程ID'] || ''));
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10) || 0);
    }
    var newId = 'REG-' + ('000' + (maxSeq + 1)).slice(-3);
    appendRowsByHeaders_(ss, 'T_規程', [{
      '規程ID': newId,
      '区分コード': v.kind,
      'タイトル': v.title,
      '本文': v.body,
      '外部リンクURL': v.linkUrl,
      '外部リンク文言': v.linkLabel,
      '対象会員種別': v.target,
      '版数': 1,
      '施行日': effectiveDate,
      '表示順': sortOrder,
      '公開フラグ': published,
      '更新者メール': String(operatorEmail || ''),
      '削除フラグ': false,
      '作成日時': now,
      '更新日時': now
    }]);
    return { id: newId, version: 1, created: true };
  }

  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['規程ID', 'タイトル', '本文', '版数', '更新日時']);
  var values = sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), sheet.getLastColumn()).getValues();
  for (var r = 0; r < values.length; r += 1) {
    if (String(values[r][cols['規程ID']] || '') !== id) continue;
    var contentChanged = String(values[r][cols['タイトル']] || '') !== v.title
      || String(values[r][cols['本文']] || '') !== v.body
      || String(values[r][cols['外部リンクURL']] || '') !== v.linkUrl
      || String(values[r][cols['外部リンク文言']] || '') !== v.linkLabel;
    var nextVersion = Number(values[r][cols['版数']] || 1) + (contentChanged ? 1 : 0);
    values[r][cols['区分コード']] = v.kind;
    values[r][cols['タイトル']] = v.title;
    values[r][cols['本文']] = v.body;
    values[r][cols['外部リンクURL']] = v.linkUrl;
    values[r][cols['外部リンク文言']] = v.linkLabel;
    values[r][cols['対象会員種別']] = v.target;
    values[r][cols['版数']] = nextVersion;
    values[r][cols['施行日']] = effectiveDate;
    values[r][cols['表示順']] = sortOrder;
    values[r][cols['公開フラグ']] = published;
    values[r][cols['更新者メール']] = String(operatorEmail || '');
    values[r][cols['更新日時']] = now;
    sheet.getRange(2, 1, values.length, sheet.getLastColumn()).setValues(values);
    return { id: id, version: nextVersion, created: false, versionBumped: contentChanged };
  }
  throw new Error('対象の規程が見つかりません: ' + id);
}

// v376.86: 規程の一括保存。設定画面の「一括保存」でまとめて反映するための入口。
//
// 以前は 1 件ごとに saveRegulation / deleteRegulation を呼んでいたため、
// 並べ替え 1 回で 3 往復（保存 2 + 再読込 1）＝ 15〜20 秒かかり、操作のたびに待たされた。
// GAS は 1 呼び出しあたり 1.8〜5 秒の固定オーバーヘッドがある（TRD 第1部 §6）ので、
// 往復回数を減らすことがそのまま体感速度になる。
//
// changes: [{ op: 'upsert' | 'delete', item: {...} }] を順に適用し、シート書き込みは 1 回にまとめる。
function saveRegulationsBatch_(payload, operatorEmail) {
  var changes = payload && Array.isArray(payload.changes) ? payload.changes : [];
  if (changes.length === 0) return { applied: 0, items: [] };
  if (changes.length > 100) throw new Error('一度に保存できるのは 100 件までです。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = ss.getSheetByName('T_規程');
    if (!sheet) throw new Error('T_規程 が初期化されていません。');
    var cols = buildColumnIndex_(sheet);
    requireColumns_(cols, ['規程ID', '区分コード', 'タイトル', '本文', '対象会員種別', '版数', '表示順', '公開フラグ', '削除フラグ', '更新日時']);
    var lastRow = sheet.getLastRow();
    var values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues() : [];
    var now = new Date().toISOString();
    var email = String(operatorEmail || '');
    var memberTypeCodes = getActiveMemberTypeCodes_(ss);

    // 新規採番の起点（既存の最大連番）
    var maxSeq = 0;
    for (var i = 0; i < values.length; i += 1) {
      var m = /^REG-(\d+)$/.exec(String(values[i][cols['規程ID']] || ''));
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10) || 0);
    }

    var appended = [];
    var result = [];
    for (var c = 0; c < changes.length; c += 1) {
      var ch = changes[c] || {};
      var op = String(ch.op || 'upsert');
      var item = ch.item || {};
      var id = String(item.id || '').trim();

      if (op === 'delete') {
        if (!id) throw new Error('削除には規程IDが必要です。');
        var deleted = false;
        for (var d = 0; d < values.length; d += 1) {
          if (String(values[d][cols['規程ID']] || '') !== id) continue;
          values[d][cols['削除フラグ']] = true;
          values[d][cols['公開フラグ']] = false;
          values[d][cols['更新者メール']] = email;
          values[d][cols['更新日時']] = now;
          deleted = true;
          break;
        }
        if (!deleted) throw new Error('削除対象の規程が見つかりません: ' + id);
        result.push({ id: id, op: 'delete' });
        continue;
      }

      var v = validateRegulationPayload_(item, memberTypeCodes);
      var sortOrder = Number(item.sortOrder || 0);
      if (!isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999) sortOrder = 0;
      var published = item.published != null ? !!item.published : true;
      var effectiveDate = String(item.effectiveDate || '').trim();

      if (!id) {
        maxSeq += 1;
        var newId = 'REG-' + ('000' + maxSeq).slice(-3);
        appended.push({
          '規程ID': newId, '区分コード': v.kind, 'タイトル': v.title, '本文': v.body,
          '外部リンクURL': v.linkUrl, '外部リンク文言': v.linkLabel, '対象会員種別': v.target,
          '版数': 1, '施行日': effectiveDate, '表示順': sortOrder, '公開フラグ': published,
          '更新者メール': email, '削除フラグ': false, '作成日時': now, '更新日時': now
        });
        result.push({ id: newId, op: 'create', version: 1 });
        continue;
      }

      var found = false;
      for (var u = 0; u < values.length; u += 1) {
        if (String(values[u][cols['規程ID']] || '') !== id) continue;
        // 版数は「本文が変わったとき」だけ上げる。並べ替えや公開切替では上げない。
        var contentChanged = String(values[u][cols['タイトル']] || '') !== v.title
          || String(values[u][cols['本文']] || '') !== v.body
          || String(values[u][cols['外部リンクURL']] || '') !== v.linkUrl
          || String(values[u][cols['外部リンク文言']] || '') !== v.linkLabel;
        var nextVersion = Number(values[u][cols['版数']] || 1) + (contentChanged ? 1 : 0);
        values[u][cols['区分コード']] = v.kind;
        values[u][cols['タイトル']] = v.title;
        values[u][cols['本文']] = v.body;
        values[u][cols['外部リンクURL']] = v.linkUrl;
        values[u][cols['外部リンク文言']] = v.linkLabel;
        values[u][cols['対象会員種別']] = v.target;
        values[u][cols['版数']] = nextVersion;
        values[u][cols['施行日']] = effectiveDate;
        values[u][cols['表示順']] = sortOrder;
        values[u][cols['公開フラグ']] = published;
        values[u][cols['更新者メール']] = email;
        values[u][cols['更新日時']] = now;
        result.push({ id: id, op: 'update', version: nextVersion, versionBumped: contentChanged });
        found = true;
        break;
      }
      if (!found) throw new Error('対象の規程が見つかりません: ' + id);
    }

    if (values.length > 0) sheet.getRange(2, 1, values.length, sheet.getLastColumn()).setValues(values);
    if (appended.length > 0) appendRowsByHeaders_(ss, 'T_規程', appended);
    SpreadsheetApp.flush();
    clearAllDataCache_();
    return { applied: result.length, items: result };
  } finally {
    lock.releaseLock();
  }
}

// soft delete（削除フラグ）。会員に紐づかないため cascade アーカイブの対象外。
function deleteRegulation_(payload, operatorEmail) {
  var id = String((payload && payload.id) || '').trim();
  if (!id) throw new Error('規程IDが空です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_規程');
  if (!sheet) throw new Error('T_規程 が初期化されていません。');
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['規程ID', '削除フラグ', '更新日時']);
  var values = sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), sheet.getLastColumn()).getValues();
  for (var r = 0; r < values.length; r += 1) {
    if (String(values[r][cols['規程ID']] || '') !== id) continue;
    values[r][cols['削除フラグ']] = true;
    values[r][cols['更新者メール']] = String(operatorEmail || '');
    values[r][cols['更新日時']] = new Date().toISOString();
    sheet.getRange(2, 1, values.length, sheet.getLastColumn()).setValues(values);
    return { id: id, deleted: true };
  }
  throw new Error('対象の規程が見つかりません: ' + id);
}


// dryRun 専用: 検証で作った T_規程 の行を物理削除する（通常運用では soft delete のみ）。
function purgeRegulationRowForDryRun_(ss, id) {
  var sheet = ss.getSheetByName('T_規程');
  if (!sheet || sheet.getLastRow() < 2) return false;
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['規程ID', 'タイトル']);
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var r = values.length - 1; r >= 0; r -= 1) {
    if (String(values[r][cols['規程ID']] || '') !== String(id)) continue;
    // 安全弁: dryRun が作った行以外は絶対に消さない
    if (String(values[r][cols['タイトル']] || '').indexOf(DRYRUN_PREFIX) !== 0) return false;
    sheet.deleteRow(r + 2);
    return true;
  }
  return false;
}


// ============================================================
// v376.68: 汎用データエクスポート（CSV）
//
// 背景（docs/261 T-07）: GCP 移行後は事務局がスプレッドシートを直接開けなくなる。
// 現状の代替手段は一括編集 6 項目と名簿系の出力しかなく、
// 「任意のテーブルを Excel で確認・分析する」手段が無い。移行を待たず GAS 側で先に実装する。
//
// 設計方針:
//   - 出力は CSV（UTF-8 BOM 付き）。Excel でそのまま開けること
//   - 権限は menu 単位 RBAC に載せる（menu: data-export）。MASTER は常に可
//   - **T_認証アカウントは常に出力禁止**（パスワードハッシュ・ソルトを含むため）
//   - ログ系と T_システム設定 は **MASTER 限定**（個人情報・運用値を含むため）
//   - 誰が何を出力したかを監査ログへ残す（個人情報の持ち出し記録）
//   - GCP 移植性: シート読み出しと文字列生成のみ。Firestore へ移しても同一ロジックで動く
// ============================================================

// 常に出力を禁止するテーブル（秘密値を含む）
var EXPORT_FORBIDDEN_TABLES_ = ['T_認証アカウント'];

// MASTER のみ出力できるテーブル（個人情報の追跡記録・運用設定）
var EXPORT_MASTER_ONLY_TABLES_ = [
  'T_監査ログ', 'T_ログイン履歴', 'T_メール送信ログ', 'T_メール送信明細',
  'T_削除ログ', 'T_人物統合ログ', 'T_システム設定',
];

// 1 回の出力で扱う最大行数（GAS の実行時間を超えないための安全弁）
var EXPORT_MAX_ROWS_ = 20000;

// テーブル名から `_archive` を外した「元テーブル名」を返す。
// v376.68 修正: 削除アーカイブ（`<テーブル名>_archive`）は元テーブルと同じ列を持つため、
// **元テーブルと同じ制限を適用しなければならない**。
// 実際に `T_認証アカウント_archive` がパスワードハッシュ・ソルトを保持したまま
// 出力対象に混入していた（live 確認で検出）。
function exportBaseTableName_(name) {
  var n = String(name || '');
  var suffix = '_archive';
  if (n.length > suffix.length && n.slice(-suffix.length) === suffix) {
    return n.slice(0, n.length - suffix.length);
  }
  return n;
}

function isExportForbiddenTable_(name) {
  return EXPORT_FORBIDDEN_TABLES_.indexOf(exportBaseTableName_(name)) >= 0;
}

function isExportMasterOnlyTable_(name) {
  return EXPORT_MASTER_ONLY_TABLES_.indexOf(exportBaseTableName_(name)) >= 0;
}

// 出力可能なテーブル一覧を返す。権限に応じて masterOnly を落とす。
function listExportableTables_(session) {
  var isMaster = !!(session && session.isMaster);
  var ss = getOrCreateDatabase_();
  var names = [];
  var tableNames = Object.keys(テーブル定義);
  for (var i = 0; i < tableNames.length; i += 1) names.push(tableNames[i]);
  var masterNames = Object.keys(マスタ定義);
  for (var m = 0; m < masterNames.length; m += 1) names.push(masterNames[m]);

  // v376.68.2 修正: 一覧で各シートの行数まで取ると 56 シート分の往復が積み上がり、
  // 実測 20 秒（getSheets 1 回にまとめた後でも 20 秒）かかっていた。
  // **一覧では行数を返さない**。件数は出力後の結果（rowCount）で示せば足りる。
  var existing = {};
  var sheets = ss.getSheets();
  for (var sIdx = 0; sIdx < sheets.length; sIdx += 1) {
    existing[sheets[sIdx].getName()] = true;
  }

  var result = [];
  for (var n = 0; n < names.length; n += 1) {
    var name = names[n];
    if (isExportForbiddenTable_(name)) continue;
    var masterOnly = isExportMasterOnlyTable_(name);
    if (masterOnly && !isMaster) continue;
    result.push({
      name: name,
      kind: name.indexOf('M_') === 0 ? 'MASTER' : 'TABLE',
      masterOnly: masterOnly,
      exists: !!existing[name],
    });
  }
  result.sort(function(a, b) {
    if (a.kind !== b.kind) return a.kind === 'TABLE' ? -1 : 1;
    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
  });
  return { tables: result, maxRows: EXPORT_MAX_ROWS_ };
}

// CSV の 1 セルをエスケープする（RFC 4180）。
// 先頭が = + - @ の場合は数式として解釈されないよう ' を前置する（CSV インジェクション対策）。
function csvEscapeCell_(value) {
  var v = value == null ? '' : String(value);
  // 【重要】ここで正規表現リテラルを使わないこと。
  // 二重引用符を含む regex は build のパーサ（collectFunctionDeclarationsShared）を壊し、
  // 以降のすべての関数が検出されなくなる（v376.68 で実際に発生し operator tool 4 件が消えた）。
  var first = v.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@') v = "'" + v;
  var needsQuote = v.indexOf(',') >= 0
    || v.indexOf('"') >= 0
    || v.indexOf(String.fromCharCode(13)) >= 0
    || v.indexOf(String.fromCharCode(10)) >= 0;
  if (needsQuote) v = '"' + v.split('"').join('""') + '"';
  return v;
}

// 出力の事実を T_監査ログ へ残す（列構成は既存の appendRoleAuditLog_ と同一）。
// 中身は残さず、テーブル名・行数・条件のみ記録する（持ち出し記録が目的）。
function appendExportAuditLog_(adminEmail, tableName, rowCount, includeDeleted, truncated) {
  try {
    appendAuditLogEntries_([{ operatorEmail: adminEmail, operation: 'EXPORT_TABLE_CSV', tableName: tableName,
      fieldName: 'rowCount',
      newValue: JSON.stringify({ rows: rowCount, includeDeleted: !!includeDeleted, truncated: !!truncated }) }]);
  } catch (e) { /* schema 未整備時は silent skip */ }
}

// 指定テーブルを CSV 文字列で返す。
function exportTableCsv_(payload, session) {
  var name = String((payload && payload.tableName) || '').trim();
  if (!name) throw new Error('テーブル名が指定されていません。');
  if (isExportForbiddenTable_(name)) {
    throw new Error('このテーブルは出力できません（秘密情報を含むため）: ' + name);
  }
  var known = Object.prototype.hasOwnProperty.call(テーブル定義, name)
    || Object.prototype.hasOwnProperty.call(マスタ定義, name);
  if (!known) throw new Error('未知のテーブルです: ' + name);

  var isMaster = !!(session && session.isMaster);
  if (isExportMasterOnlyTable_(name) && !isMaster) {
    throw new Error('このテーブルの出力はマスター権限が必要です: ' + name);
  }

  var includeDeleted = !!(payload && payload.includeDeleted);
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('シートが見つかりません: ' + name);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) throw new Error('シートが空です: ' + name);

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h == null ? '' : h); });
  var deletedIdx = headers.indexOf('削除フラグ');

  var lines = [headers.map(csvEscapeCell_).join(',')];
  var exported = 0;
  var skippedDeleted = 0;
  for (var r = 1; r < values.length; r += 1) {
    var row = values[r];
    if (!includeDeleted && deletedIdx >= 0 && toBoolean_(row[deletedIdx])) {
      skippedDeleted += 1;
      continue;
    }
    if (exported >= EXPORT_MAX_ROWS_) break;
    var cells = [];
    for (var c = 0; c < headers.length; c += 1) {
      var cell = row[c];
      // 日付は ISO 文字列へ寄せる（Excel のロケール差で表示が揺れないように）
      if (cell instanceof Date) {
        cells.push(csvEscapeCell_(Utilities.formatDate(cell, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss")));
      } else {
        cells.push(csvEscapeCell_(cell));
      }
    }
    lines.push(cells.join(','));
    exported += 1;
  }

  var truncated = (values.length - 1 - skippedDeleted) > exported;
  var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmm');

  // 個人情報の持ち出し記録として監査ログへ残す（行数のみ。中身は残さない）
  appendExportAuditLog_(String((session && session.loginId) || ''), name, exported, includeDeleted, truncated);

  return {
    tableName: name,
    filename: name + '_' + stamp + '.csv',
    csv: lines.join('\r\n'),
    rowCount: exported,
    skippedDeleted: skippedDeleted,
    truncated: truncated,
    maxRows: EXPORT_MAX_ROWS_,
  };
}
