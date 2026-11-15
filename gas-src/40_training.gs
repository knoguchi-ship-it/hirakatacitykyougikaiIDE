// gas-src/40_training.gs — 研修・申込・名簿・出欠。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function dryRunTrainingReminder(trainingId) {
  return sendTrainingReminder_({
    trainingId: trainingId,
    dryRun: true,
  });
}

function sendTrainingReminderTest(trainingId, to) {
  return sendTrainingReminder_({
    trainingId: trainingId,
    dryRun: false,
    testRecipient: to,
  });
}

function dryRunTrainingReminderT001() {
  return dryRunTrainingReminder('T001');
}

function sendTrainingReminderToNoguchiTest() {
  return sendTrainingReminderTest('T001', 'k.noguchi@uguisunosato.or.jp');
}

function sendTrainingReminder_(request) {
  if (!request || !request.trainingId) {
    throw new Error('trainingId is required');
  }

  var allData = fetchAllDataFromDb_();
  var trainingId = String(request.trainingId);
  var dryRun = request.dryRun !== false;
  var testRecipient = String(request.testRecipient || '').trim().toLowerCase();
  var subject = String(request.subject || '');
  var body = String(request.body || '');

  var training = null;
  for (var i = 0; i < allData.trainings.length; i += 1) {
    if (String(allData.trainings[i].id) === trainingId) {
      training = allData.trainings[i];
      break;
    }
  }
  if (!training) {
    throw new Error('Training not found: ' + trainingId);
  }

  var recipients = collectTrainingRecipients_(allData.members, trainingId);
  if (testRecipient) {
    recipients = [{
      email: testRecipient,
      name: 'テスト送信先',
      memberId: '',
      staffId: '',
    }];
  }
  if (recipients.length === 0) {
    throw new Error('No email recipients found for training: ' + trainingId);
  }

  // v376.43: subject/body 未指定時は設定値（無ければ既定）から差し込み描画。
  if (!subject || !body) {
    var remMail = renderConfiguredMail_(getOrCreateDatabase_(), 'TRAINING_REMINDER_SUBJECT', 'TRAINING_REMINDER_BODY',
      TRAINING_REMINDER_DEFAULT_SUBJECT, TRAINING_REMINDER_DEFAULT_BODY, {
        '研修名': String(training.title || ''),
        '開催日': formatTrainingDate_(training.date, training.endTime),
        '会場': String(training.location || ''),
      });
    if (!subject) subject = remMail.subject;
    if (!body) body = remMail.body;
  }

  var result = {
    dryRun: dryRun,
    trainingId: trainingId,
    trainingTitle: String(training.title || ''),
    recipientCount: recipients.length,
    recipients: recipients.map(function(r) {
      return {
        email: r.email,
        name: r.name,
        memberId: r.memberId,
        staffId: r.staffId,
      };
    }),
    subject: subject,
    body: body,
    sentCount: 0,
    sentTo: [],
  };

  if (dryRun) {
    return result;
  }

  for (var j = 0; j < recipients.length; j += 1) {
    var to = recipients[j].email;
    // v376.67 是正: 研修リマインダーは TRAINING_REMINDER カテゴリで送る。
    // 従来 'BULK_MAIL' を渡していたため、設定「研修リマインダーメール」の有効/無効トグル
    // （TRAINING_REMINDER_ENABLED）が効かず、逆に「一括メール送信」を無効にすると
    // 研修リマインダーまで止まっていた（送信ログのカテゴリも誤記録）。
    var sendRes = deliverMail_('TRAINING_REMINDER', to, subject, body, { name: '枚方市介護支援専門員連絡協議会 事務局' });
    if (sendRes && sendRes.sent) {
      result.sentTo.push(to);
      result.sentCount += 1;
    }
  }

  return result;
}

function collectTrainingRecipients_(members, trainingId) {
  var recipients = [];
  var seen = {};

  function pushRecipient_(email, name, memberId, staffId) {
    var normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;
    if (seen[normalized]) return;
    seen[normalized] = true;
    recipients.push({
      email: normalized,
      name: String(name || ''),
      memberId: String(memberId || ''),
      staffId: String(staffId || ''),
    });
  }

  for (var i = 0; i < members.length; i += 1) {
    var member = members[i];
    var memberId = String(member.id || '');
    var memberType = String(member.type || '');

    if (memberType !== 'BUSINESS') {
      var memberTrainingIds = member.participatedTrainingIds || [];
      if (memberTrainingIds.indexOf(trainingId) !== -1) {
        pushRecipient_(member.email, String(member.lastName || '') + ' ' + String(member.firstName || ''), memberId, '');
      }
      continue;
    }

    var staffList = member.staff || [];
    var matchedStaffCount = 0;
    for (var j = 0; j < staffList.length; j += 1) {
      var staff = staffList[j];
      var staffTrainingIds = staff.participatedTrainingIds || [];
      if (staffTrainingIds.indexOf(trainingId) === -1) continue;
      matchedStaffCount += 1;
      pushRecipient_(staff.email, staff.name, memberId, staff.id);
    }

    if (matchedStaffCount > 0 && member.email) {
      pushRecipient_(member.email, member.officeName || '事業所代表', memberId, '');
    }
  }

  return recipients;
}

function buildTrainingReminderBody_(training) {
  var trainingDate = formatTrainingDate_(training.date, training.endTime);
  var lines = [];
  lines.push('会員各位');
  lines.push('');
  lines.push('平素よりお世話になっております。');
  lines.push('枚方市介護支援専門員連絡協議会 事務局です。');
  lines.push('');
  lines.push('お申し込み済みの研修が近づいていますので、ご案内いたします。');
  lines.push('');
  lines.push('■研修名');
  lines.push(String(training.title || ''));
  lines.push('');
  lines.push('■開催日');
  lines.push(trainingDate);
  lines.push('');
  lines.push('■会場');
  lines.push(String(training.location || ''));
  lines.push('');
  lines.push('当日の案内資料と詳細は、配布済みのご案内をご確認ください。');
  lines.push('');
  lines.push('何卒よろしくお願いいたします。');
  lines.push('');
  lines.push('枚方市介護支援専門員連絡協議会 事務局');
  return lines.join('\n');
}

// 研修の日付表記の単一情報源 src/shared/trainingDate.mjs::formatTrainingDateJa を
// build（injectTrainingDatePlaceholders）が下記マーカー間へ formatTrainingDateJa_ として注入する。
// __TRAINING_DATE_BUILD_INJECT_START__
function formatTrainingDateJa_(dateStr, endTime) {
  throw new Error('formatTrainingDateJa_ is not injected — run build:gas (injectTrainingDatePlaceholders)');
}
// __TRAINING_DATE_BUILD_INJECT_END__

/**
 * メール・LINE・一覧の見出しに出す研修の日付（令和8年6月20日(土) 14:00〜16:30）。
 * セルの Date はここで文字列にする。文字列は new Date に通さない（日付だけの値が UTC 解釈で 9:00 になるため）。
 */
function formatTrainingDate_(rawDate, endTime) {
  if (!rawDate) return '';
  var text = Object.prototype.toString.call(rawDate) === '[object Date]'
    ? Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm')
    : String(rawDate);
  return formatTrainingDateJa_(text, formatTimeOnly_(endTime));
}

function formatDateForApi_(rawDate) {
  if (!rawDate) return '';
  if (Object.prototype.toString.call(rawDate) === '[object Date]') {
    return Utilities.formatDate(rawDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  }
  if (typeof rawDate === 'string') {
    var parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
    }
  }
  return String(rawDate);
}

/** 時刻セル（HH:mm）を文字列で返す。Date型もシート上の時刻セルも正しく処理する */
function formatTimeOnly_(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, 'Asia/Tokyo', 'HH:mm');
  }
  var s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    var parts = s.split(':');
    return ('0' + parts[0]).slice(-2) + ':' + parts[1];
  }
  return '';
}

function parseTrainingOptions_(raw) {
  var defaultResult = {
    fieldConfig: null,
    cancelAllowed: false,
    inquiryPerson: '',
    inquiryContactType: 'PHONE',
    inquiryContactValue: '',
    inquiryPhone: '',
    inquiryEmail: '',
    askMemberNumber: null,
  };
  var text = String(raw || '').trim();
  if (!text) return defaultResult;
  try {
    var parsed = JSON.parse(text);
    if (parsed && parsed.fieldConfig !== undefined) {
      var contactType = String(parsed.inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE';
      var contactValue = String(parsed.inquiryContactValue || '');
      // 新フィールド優先、なければ旧フィールドから復元（後方互換）
      var phone = String(parsed.inquiryPhone || '');
      var email = String(parsed.inquiryEmail || '');
      if (!phone && !email) {
        if (contactType === 'PHONE') { phone = contactValue; }
        else { email = contactValue; }
      }
      return {
        fieldConfig: parsed.fieldConfig || null,
        cancelAllowed: parsed.cancelAllowed === true,
        inquiryPerson: String(parsed.inquiryPerson || ''),
        inquiryContactType: contactType,
        inquiryContactValue: contactValue,
        inquiryPhone: phone,
        inquiryEmail: email,
        // BR-21: 真偽で入っているときだけ持つ。null は「未設定（費用から決める）」
        askMemberNumber: typeof parsed.askMemberNumber === 'boolean' ? parsed.askMemberNumber : null,
      };
    }
    // 旧形式（fieldConfigオブジェクトのみ）
    return {
      fieldConfig: parsed || null,
      cancelAllowed: false,
      inquiryPerson: '',
      inquiryContactType: 'PHONE',
      inquiryContactValue: '',
      inquiryPhone: '',
      inquiryEmail: '',
      askMemberNumber: null,
    };
  } catch (e) {
    return defaultResult;
  }
}

function serializeTrainingOptions_(fieldConfig, cancelAllowed, inquiryPerson, inquiryContactType, inquiryContactValue, inquiryPhone, inquiryEmail, askMemberNumber) {
  var options = {
    fieldConfig: fieldConfig || null,
    cancelAllowed: cancelAllowed === true,
    inquiryPerson: String(inquiryPerson || ''),
    inquiryContactType: String(inquiryContactType || 'PHONE') === 'EMAIL' ? 'EMAIL' : 'PHONE',
    inquiryContactValue: String(inquiryContactValue || ''),
    inquiryPhone: String(inquiryPhone || ''),
    inquiryEmail: String(inquiryEmail || ''),
  };
  // BR-21: 真偽のときだけ書く。書かなければ resolveTrainingAsksMemberNumber_ が費用から決める
  if (typeof askMemberNumber === 'boolean') options.askMemberNumber = askMemberNumber;
  return JSON.stringify(options);
}

function normalizeInquiryContacts_(phone, email, legacyValue) {
  var p = String(phone || '').trim();
  var e = String(email || '').trim();
  // 新フィールドが両方空の場合は旧フィールドにフォールバック
  if (!p && !e) {
    var legacy = String(legacyValue || '').trim();
    if (legacy) {
      var emailPat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPat.test(legacy)) { e = legacy; }
      else { p = legacy; }
    }
  }
  if (!p && !e) {
    throw new Error('問い合わせ窓口の電話番号またはメールアドレスを入力してください。');
  }
  var phonePat = /^[0-9+\-() ー−]{6,}$/;
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (p && !phonePat.test(p)) {
    throw new Error('電話番号の形式が正しくありません: ' + p);
  }
  if (e && !emailPattern.test(e)) {
    throw new Error('メールアドレスの形式が正しくありません: ' + e);
  }
  // 後方互換: inquiryContactValue には電話優先で1件格納
  var primaryValue = p || e;
  var primaryType = p ? 'PHONE' : 'EMAIL';
  return { phone: p, email: e, primaryType: primaryType, primaryValue: primaryValue };
}

// 旧関数（後方互換、seed/test コード向け）
function normalizeInquiryContact_(inquiryContactValue) {
  var value = String(inquiryContactValue || '').trim();
  if (!value) {
    throw new Error('問い合わせ窓口の連絡先を入力してください。');
  }
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var phonePattern = /^[0-9+\-() ー−]{6,}$/;
  if (emailPattern.test(value)) {
    return { type: 'EMAIL', value: value };
  }
  if (phonePattern.test(value)) {
    return { type: 'PHONE', value: value };
  }
  throw new Error('問い合わせ窓口の連絡先は電話番号またはメールアドレス形式で入力してください。');
}

function mapTrainingRowsForApi_(trainingRows) {
  return (trainingRows || []).map(function(t) {
    var availability = computeTrainingAvailability_(t);
    var feesRaw = String(t['費用JSON'] || '');
    var fees = [];
    if (feesRaw) {
      try {
        fees = JSON.parse(feesRaw);
      } catch (e) {
        var n = Number(feesRaw);
        if (!isNaN(n) && n >= 0) {
          fees = [{ label: '会員', amount: n }];
        }
      }
    }
    if (!fees || fees.length === 0) {
      fees = [{ label: '会員', amount: 0 }, { label: '非会員', amount: 0 }];
    }

    var trainingOptions = parseTrainingOptions_(t['項目設定JSON']);

    return {
      id: String(t['研修ID'] || ''),
      title: String(t['研修名'] || ''),
      summary: String(t['研修概要'] || ''),
      description: String(t['研修内容'] || ''),
      guidePdfUrl: String(t['案内状URL'] || ''),
      thumbnailUrl: String(t['案内状サムネイルURL'] || ''),
      applicationUrl: String(t['申込URL'] || ''), // v376.30: 外部申込フォーム URL
      // v376.7: admin 一覧で削除済フィルタを表示するため isDeleted を公開（公開ポータルは別パス）
      isDeleted: toBoolean_(t['削除フラグ']),
      date: formatDateForApi_(t['開催日']),
      endTime: formatTimeOnly_(t['開催終了時刻']),
      capacity: Number(t['定員'] || 0),
      applicants: Number(t['申込者数'] || 0),
      location: String(t['開催場所'] || ''),
      status: availability.isApplicationOpen ? 'OPEN' : 'CLOSED',
      lifecycleStatus: availability.lifecycleStatus,
      applicationStatus: availability.applicationStatus,
      applicationStatusReason: availability.applicationStatusReason,
      isApplicationOpen: availability.isApplicationOpen,
      organizer: String(t['主催者'] || ''),
      isNonMandatory: toBoolean_(t['法定外研修フラグ']),
      fees: fees,
      applicationOpenDate: formatDateForApi_(t['申込開始日']),
      applicationCloseDate: formatDateForApi_(t['申込締切日']),
      instructor: String(t['講師'] || ''),
      fieldConfig: trainingOptions.fieldConfig,
      cancelAllowed: trainingOptions.cancelAllowed,
      inquiryPerson: trainingOptions.inquiryPerson,
      inquiryContactType: trainingOptions.inquiryContactType,
      inquiryContactValue: trainingOptions.inquiryContactValue,
      inquiryPhone: trainingOptions.inquiryPhone,
      inquiryEmail: trainingOptions.inquiryEmail,
      // BR-21: 判定済みの値を渡す（画面は費用から自分で決めない）
      askMemberNumber: resolveTrainingAsksMemberNumber_(t),
    };
  });
}

function getTrainingManagementData_() {
  // v376.7: admin 一覧では削除済も含めて全件返す（isDeleted で識別、frontend で filter）。
  //   公開ポータルは fetchAllData_ など別 API パスで !削除フラグ filter 済み。
  var cache = CacheService.getScriptCache();
  // _v3（2026-11-02）: registrarEmail を足した。古い形のキャッシュを返さないため鍵を変えた（版は TRAINING_MANAGEMENT_CACHE_VERSION_）
  var cacheKey = getTrainingManagementCacheKey_() + TRAINING_MANAGEMENT_CACHE_VERSION_;
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');

  // 2026-11-02（operator 決定）: 研修登録者は自分が登録した研修だけ操作できる。画面がボタンを出し分けるため、
  // 管理画面の一覧にだけ登録者を載せる（mapTrainingRowsForApi_ は公開ポータルでも使うので、そちらには載せない）
  var registrarById = {};
  trainingRows.forEach(function(r) {
    registrarById[String(r['研修ID'] || '')] = String(r['登録者メール'] || '').trim();
  });
  var trainings = mapTrainingRowsForApi_(trainingRows).map(function(t) {
    t.registrarEmail = registrarById[String(t.id || '')] || '';
    return t;
  }).sort(function(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  try {
    putChunkedCache_(cache, cacheKey, trainings, ALL_DATA_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('getTrainingManagementData_ cache skipped: ' + e.message);
  }
  return trainings;
}

// 研修の削除・復元を、この管理者に許すか（2026-11-02 operator 決定・docs/319 §5.9）。
// 研修の編集範囲が「自分の研修のみ」（OWN）のロールには許さない。MASTER は常に可。
// 以前はメニュー単位の判定だけで、研修登録者が他人の研修まで削除・復元できた。
// 管理者を確かめられない・編集範囲が読めないときは止める（fail-closed）。
// 段 2 で T_権限ロール.許可操作JSON による操作ごとの権限へ置き換える。
function assertTrainingDeleteAllowed_(session) {
  if (!session) throw new Error('管理者を確認できないため、研修の削除・復元はできません。');
  if (session.isMaster === true) return;
  var scope = String(session.trainingEditScope || '').toUpperCase();
  if (scope !== 'ALL') {
    throw new Error('このロールでは研修の削除・復元はできません（研修の編集範囲が「自分の研修のみ」のため）。');
  }
}

// 研修ごとの操作（書き込み・送信）。研修登録者（編集範囲 OWN）は自分が登録した研修にだけ許す
// （2026-11-02 operator 決定: 他の研修は見られるが、操作はできない）。値は対象の研修の見つけ方。
// 研修の保存は saveTraining_ の中で、削除・復元は assertTrainingDeleteAllowed_ で別に確かめる。
var TRAINING_SCOPED_OPERATION_ACTIONS_ = {
  regenerateThumbnailForTraining: 'trainingId',
  sendTrainingReminder: 'trainingId',
  sendTrainingMail: 'trainingId',
  addRosterEntry: 'trainingId',
  addGuestRosterEntry: 'trainingId',
  saveAttendance: 'applyId',
  saveAttendanceBatch: 'entries',
  cancelRosterEntry: 'applyId',
  updateRosterEntry: 'applyId',
};

// 操作の対象の研修IDを集める。見つけられないものがあれば止める（fail-closed）
function resolveTrainingIdsForOperation_(ss, opAction, payload) {
  var how = TRAINING_SCOPED_OPERATION_ACTIONS_[opAction];
  var p = payload || {};
  if (how === 'trainingId') {
    var tid = String(p.trainingId || '').trim();
    if (!tid) throw new Error('対象の研修を確かめられないため、この操作はできません（研修IDがありません）。');
    return [tid];
  }
  var applyIds = how === 'entries'
    ? (Array.isArray(p.entries) ? p.entries : []).map(function(e) { return String((e && e.applyId) || '').trim(); })
    : [String(p.applyId || '').trim()];
  if (applyIds.length === 0 || applyIds.some(function(id) { return !id; })) {
    throw new Error('対象の申込を確かめられないため、この操作はできません（申込IDがありません）。');
  }
  var trainingByApply = {};
  getRowsAsObjects_(ss, 'T_研修申込').forEach(function(r) {
    trainingByApply[String(r['申込ID'] || '')] = String(r['研修ID'] || '');
  });
  return applyIds.map(function(id) {
    var t = trainingByApply[id];
    if (!t) throw new Error('対象の申込が見つからないため、この操作はできません（申込ID: ' + id + '）。');
    return t;
  });
}

function assertTrainingOperationAllowed_(opAction, payload, session, getSs) {
  if (!TRAINING_SCOPED_OPERATION_ACTIONS_[opAction]) return;
  if (!session) throw new Error('管理者を確認できないため、この操作はできません。');
  if (session.isMaster === true) return;
  var scope = String(session.trainingEditScope || '').toUpperCase();
  if (scope === 'ALL') return;
  if (scope !== 'OWN') throw new Error('研修の編集範囲を確かめられないため、この操作はできません。');
  var loginId = String(session.loginId || '').trim().toLowerCase();
  if (!loginId) throw new Error('管理者を確認できないため、この操作はできません。');
  var ss = getSs();
  var trainingIds = resolveTrainingIdsForOperation_(ss, opAction, payload);
  var registrarById = {};
  getRowsAsObjects_(ss, 'T_研修').forEach(function(r) {
    registrarById[String(r['研修ID'] || '')] = String(r['登録者メール'] || '').trim().toLowerCase();
  });
  trainingIds.forEach(function(tid) {
    if (!(tid in registrarById)) throw new Error('対象の研修が見つからないため、この操作はできません（研修ID: ' + tid + '）。');
    if (registrarById[tid] !== loginId) {
      throw new Error('研修登録者は、自分が登録した研修だけ操作できます（研修ID: ' + tid + '）。');
    }
  });
}

// v376.7: 研修の soft delete（削除フラグ=true）。物理削除しない。
//   payload: { trainingId: string }
//   返却: { trainingId, applicantCount, deleted: true }
//   申込実績がある場合も削除可能（呼出側で警告表示 → 確認後実行する設計）。
//   削除後は公開ポータル/admin dashboard から自動非表示（既存の !削除フラグ filter 経由）。
function softDeleteTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が必要です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, '研修ID', trainingId);
  if (!found) throw new Error('対象研修が見つかりません: ' + trainingId);
  var cols = found.columns;
  var row = found.row.slice();
  if (toBoolean_(row[cols['削除フラグ']])) {
    return { trainingId: trainingId, applicantCount: 0, deleted: true, alreadyDeleted: true };
  }
  row[cols['削除フラグ']] = true;
  if (cols['更新日時'] != null) row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // 申込件数を返却（参考表示用、削除をブロックしない）
  var applicantCount = 0;
  try {
    var applySheet = ss.getSheetByName('T_研修申込');
    if (applySheet && applySheet.getLastRow() >= 2) {
      var applies = getRowsAsObjects_(ss, 'T_研修申込');
      applicantCount = applies.filter(function (r) {
        return !toBoolean_(r['削除フラグ']) &&
               String(r['研修ID'] || '') === trainingId &&
               String(r['申込状態コード'] || '') !== 'CANCELED';
      }).length;
    }
  } catch (e) {}

  try { clearAllDataCache_(); } catch (e) {}
  try { clearAdminDashboardCache_(); } catch (e) {}
  return { trainingId: trainingId, applicantCount: applicantCount, deleted: true };
}

// v376.7: 研修の復元（削除フラグ=false）。soft delete の取消。
function restoreTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が必要です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, '研修ID', trainingId);
  if (!found) throw new Error('対象研修が見つかりません: ' + trainingId);
  var cols = found.columns;
  var row = found.row.slice();
  if (!toBoolean_(row[cols['削除フラグ']])) {
    return { trainingId: trainingId, restored: true, alreadyActive: true };
  }
  row[cols['削除フラグ']] = false;
  if (cols['更新日時'] != null) row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  try { clearAllDataCache_(); } catch (e) {}
  try { clearAdminDashboardCache_(); } catch (e) {}
  return { trainingId: trainingId, restored: true };
}

/**
 * 研修を新規登録または更新する。
 * payload.id が空の場合は新規作成、ある場合は既存行を更新する。
 */
function saveTraining_(payload) {
  // 2026-11-02（docs/319 1.1 #5）: 申込の受付と同じスクリプトロックの中で保存する。
  // 以前はロック無しで行全体を読み直して書いており、その間に入った申込の「申込者数」を古い値で上書きしえた。
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return saveTrainingLocked_(payload);
  } finally {
    lock.releaseLock();
  }
}

function saveTrainingLocked_(payload) {
  if (!payload) throw new Error('payload が空です。');
  // 2026-11-02（BR-22・docs/319 §5.5）: 画面と同じ確認（src/shared/trainingRules.mjs）を通し、誤りをまとめて返す。
  // 以前は研修タイトル・開催日時をサーバーで確かめず、費用のマイナス・http(s) 以外の申込URL・定員 0 も受け付けていた。
  var fieldConfig = (payload.fieldConfig && typeof payload.fieldConfig === 'object') ? payload.fieldConfig : {};
  var capacityEnabled = fieldConfig.capacity !== false;
  var inputErrors = validateTrainingRegistration_({
    title: payload.title,
    date: payload.date,
    organizer: payload.organizer,
    location: payload.location,
    summary: payload.summary,
    inquiryPerson: payload.inquiryPerson,
    capacityEnabled: capacityEnabled,
    capacity: payload.capacity,
    feesEnabled: fieldConfig.fees !== false,
    fees: payload.fees,
    applicationOpenDate: payload.applicationOpenDate,
    applicationCloseDate: payload.applicationCloseDate,
    // 画面と同じく、申込URL の項目が無効なら確かめない（公開ポータルにも出ない）
    applicationUrl: fieldConfig.applicationUrl !== false ? payload.applicationUrl : '',
  });
  var normalizedContact = null;
  try {
    normalizedContact = normalizeInquiryContacts_(payload.inquiryPhone, payload.inquiryEmail, payload.inquiryContactValue);
  } catch (contactErr) {
    inputErrors.push({ field: 'inquiryContact', message: contactErr && contactErr.message ? contactErr.message : String(contactErr) });
  }
  if (inputErrors.length > 0) {
    throw new Error('入力に誤りがあります。' + inputErrors.map(function(e) { return e.message; }).join(' '));
  }
  // 定員の項目を無効にした研修は「定員なし」（0 で保存。満員の判定は 0 を定員なしとして扱う）
  if (!capacityEnabled) payload.capacity = 0;
  var organizer = String(payload.organizer || '').trim();
  var location = String(payload.location || '').trim();
  var summary = String(payload.summary || '').trim();
  var inquiryPerson = String(payload.inquiryPerson || '').trim();
  var lifecycleStatus = normalizeTrainingLifecycleStatus_(payload.lifecycleStatus || payload.status || 'PUBLISHED');
  payload.organizer = organizer;
  payload.location = location;
  payload.summary = summary;
  payload.status = lifecycleStatus;
  payload.lifecycleStatus = lifecycleStatus;
  payload.inquiryPerson = inquiryPerson;
  payload.inquiryPhone = normalizedContact.phone;
  payload.inquiryEmail = normalizedContact.email;
  payload.inquiryContactType = normalizedContact.primaryType;
  payload.inquiryContactValue = normalizedContact.primaryValue;

  // 管理者セッション情報
  var adminSession = payload.__adminSession || null;
  var adminEmail = adminSession ? String(adminSession.loginId || '') : '';
  var adminPerm = adminSession ? String(adminSession.adminPermissionLevel || '') : '';

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 シートが見つかりません。');

  var now = new Date().toISOString();
  var id = String(payload.id || '');

  if (id) {
    // 既存行を更新
    var found = findRowByColumnValue_(sheet, '研修ID', id);
    if (!found) throw new Error('研修ID「' + id + '」が見つかりません。');
    var cols = found.columns;
    var row = found.row.slice();

    // docs/246 Phase 1-A: 旧 'TRAINING_REGISTRAR' ハードコードを trainingEditScope='OWN' 判定へ置換。
    // 挙動完全維持（LEGACY_ROLE_TRAINING_SCOPE で TR のみ OWN、他は ALL）。
    var trainingScope = adminSession ? String(adminSession.trainingEditScope || 'ALL').toUpperCase() : 'ALL';
    if (trainingScope === 'OWN') {
      var registrarEmail = String(cols['登録者メール'] != null ? row[cols['登録者メール']] : '' || '').trim().toLowerCase();
      if (!registrarEmail || registrarEmail !== adminEmail.toLowerCase()) {
        throw new Error('研修登録者は自身が登録した研修のみ編集可能です。');
      }
    }

    function setCol(name, value) {
      var idx = cols[name];
      if (idx != null) row[idx] = value !== undefined ? value : '';
    }

    // v349: PDF / サムネイル差し替え時に旧ファイルを Drive 上で trashed する。
    var oldPdfUrl = cols['案内状URL'] != null ? String(row[cols['案内状URL']] || '') : '';
    var oldThumbUrl = cols['案内状サムネイルURL'] != null ? String(row[cols['案内状サムネイルURL']] || '') : '';
    var newPdfUrl = String(payload.guidePdfUrl || '');
    var newThumbUrl = String(payload.thumbnailUrl || '');
    if (oldPdfUrl && oldPdfUrl !== newPdfUrl) {
      trashFileFromUrlIfPossible_(oldPdfUrl);
    }
    if (oldThumbUrl && oldThumbUrl !== newThumbUrl) {
      trashFileFromUrlIfPossible_(oldThumbUrl);
    }

    setCol('研修名', payload.title || '');
    setCol('開催日', payload.date || '');
    setCol('開催終了時刻', payload.endTime || '');
    setCol('定員', Number(payload.capacity || 0));
    setCol('開催場所', payload.location || '');
    setCol('研修状態コード', lifecycleStatus);
    setCol('主催者', payload.organizer || '');
    setCol('法定外研修フラグ', payload.isNonMandatory ? true : false);
    setCol('研修概要', payload.summary || '');
    setCol('研修内容', payload.description || '');
    setCol('費用JSON', payload.fees ? JSON.stringify(payload.fees) : '[]');
    setCol('申込開始日', payload.applicationOpenDate || '');
    setCol('申込締切日', payload.applicationCloseDate || '');
    setCol('講師', payload.instructor || '');
    setCol('案内状URL', payload.guidePdfUrl || '');
    setCol('案内状サムネイルURL', payload.thumbnailUrl || '');
    setCol('申込URL', payload.applicationUrl || ''); // v376.30: 外部申込フォーム URL
    setCol('項目設定JSON', serializeTrainingOptions_(
      payload.fieldConfig,
      payload.cancelAllowed,
      payload.inquiryPerson,
      payload.inquiryContactType,
      payload.inquiryContactValue,
      payload.inquiryPhone,
      payload.inquiryEmail,
      // 画面が送らなかった（古い画面など）ときは、保存済みの設定を消さずに残す
      typeof payload.askMemberNumber === 'boolean'
        ? payload.askMemberNumber
        : parseTrainingOptions_(cols['項目設定JSON'] != null ? row[cols['項目設定JSON']] : '').askMemberNumber
    ));
    setCol('更新日時', now);

    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return buildTrainingSaveResponse_(payload, lifecycleStatus, Number((cols['申込者数'] != null ? row[cols['申込者数']] : payload.applicants) || 0));
  }

  // 新規作成
  var newId = 'T' + Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
  appendRowsByHeaders_(ss, 'T_研修', [{
    '研修ID': newId,
    '研修名': payload.title || '',
    '開催日': payload.date || '',
    '開催終了時刻': payload.endTime || '',
    '定員': Number(payload.capacity || 0),
    '申込者数': 0,
    '開催場所': payload.location || '',
    '研修状態コード': lifecycleStatus,
    '主催者': payload.organizer || '',
    '法定外研修フラグ': payload.isNonMandatory ? true : false,
    '研修概要': payload.summary || '',
    '研修内容': payload.description || '',
    '費用JSON': payload.fees ? JSON.stringify(payload.fees) : '[]',
    '申込開始日': payload.applicationOpenDate || '',
    '申込締切日': payload.applicationCloseDate || '',
    '講師': payload.instructor || '',
    '案内状URL': payload.guidePdfUrl || '',
    '案内状サムネイルURL': payload.thumbnailUrl || '',
    '申込URL': payload.applicationUrl || '', // v376.30: 外部申込フォーム URL
    '項目設定JSON': serializeTrainingOptions_(
      payload.fieldConfig,
      payload.cancelAllowed,
      payload.inquiryPerson,
      payload.inquiryContactType,
      payload.inquiryContactValue,
      payload.inquiryPhone,
      payload.inquiryEmail,
      typeof payload.askMemberNumber === 'boolean' ? payload.askMemberNumber : null
    ),
    '登録者メール': adminEmail,
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  }]);

  payload.id = newId;
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return buildTrainingSaveResponse_(payload, lifecycleStatus, 0);
}

/**
 * 会員/職員の研修申込を登録する。
 * - 重複申込を防止
 * - 受付期間/受付状態/定員を検証
 * - T_研修申込 へ追記
 * - T_研修 の申込者数を同期
 */
function applyTraining_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var trainingId = String(payload.trainingId || '').trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  if (!memberId) throw new Error('memberId が未指定です。');

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var ss = getOrCreateDatabase_();
    backfillApplicationApplicantIdentity_(ss);
    assertTrainingMemberApplicationWritable_(ss, memberId, staffId);
    var trainingSheet = ss.getSheetByName('T_研修');
    if (!trainingSheet) throw new Error('T_研修 シートが見つかりません。');

    var found = findRowByColumnValue_(trainingSheet, '研修ID', trainingId);
    if (!found) throw new Error('対象研修が見つかりません。');
    var tCols = found.columns;
    requireColumns_(tCols, ['申込開始日', '申込締切日', '定員', '申込者数']);
    var tRow = found.row;

    var trainingObj = rowToObjectByColumns_(tRow, tCols);
    var availability = computeTrainingAvailability_(trainingObj);
    var now = new Date();
    if (!availability.isApplicationOpen) {
      throw new Error(availability.applicationStatusReason || 'この研修は受付期間外です。');
    }

    // 重複・定員の判定は 3 経路で同じルールを使う（共通ルールは countAppliedApplicants_ の下）
    var applicant = { kind: 'MEMBER', memberId: memberId, staffId: staffId };
    var duplicate = findExistingTrainingApplication_(ss, trainingId, applicant);
    if (duplicate) {
      return {
        applicationId: String(duplicate['申込ID'] || ''),
        applicants: countAppliedApplicants_(ss, trainingId),
        duplicate: true,
      };
    }
    if (evaluateTrainingCapacity_(ss, trainingId, tRow[tCols['定員']]).isFull) {
      throw new Error('定員に達したため、申し込みできません。');
    }

    var nowIso = now.toISOString();
    var applicationId = generateTrainingApplyId_();
    appendRowsByHeaders_(ss, 'T_研修申込', [{
      '申込ID': applicationId,
      '研修ID': trainingId,
      '会員ID': memberId,
      '申込者区分コード': 'MEMBER',
      '申込者ID': memberId,
      '職員ID': staffId,
      '申込状態コード': 'APPLIED',
      '申込日時': nowIso,
      '取消日時': '',
      '備考': '',
      '作成日時': nowIso,
      '更新日時': nowIso,
      '削除フラグ': false,
    }]);

    // 2026-10-13: 以前は未定義の currentApplicants + 1 を書いており、申込行を書いた直後に
    // 必ず ReferenceError で落ちていた（2026-09-27 の定員判定の共通化で宣言だけが消えた）。
    // 件数は申込行から数え直す（他経路と同じ数え方）。
    var nextApplicants = countAppliedApplicants_(ss, trainingId);
    trainingSheet.getRange(found.rowNumber, tCols['申込者数'] + 1).setValue(nextApplicants);
    if (tCols['更新日時'] != null) {
      trainingSheet.getRange(found.rowNumber, tCols['更新日時'] + 1).setValue(nowIso);
    }
    SpreadsheetApp.flush();
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();

    return {
      applicationId: applicationId,
      applicants: nextApplicants,
      duplicate: false,
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 申込済み研修をキャンセルする。
 * - 研修側のキャンセル可否設定を検証
 * - 対象のAPPLIEDレコードをCANCELEDへ更新
 * - T_研修 の申込者数を再集計
 */
function cancelTraining_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var trainingId = String(payload.trainingId || '').trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  if (!memberId) throw new Error('memberId が未指定です。');

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var ss = getOrCreateDatabase_();
    backfillApplicationApplicantIdentity_(ss);
    var trainingSheet = ss.getSheetByName('T_研修');
    if (!trainingSheet) throw new Error('T_研修 シートが見つかりません。');

    var trainingFound = findRowByColumnValue_(trainingSheet, '研修ID', trainingId);
    if (!trainingFound) throw new Error('対象研修が見つかりません。');
    if (!isTrainingCancelable_(trainingFound.row, trainingFound.columns)) {
      throw new Error('この研修はキャンセルできません。');
    }

    var appSheet = ss.getSheetByName('T_研修申込');
    if (!appSheet) throw new Error('T_研修申込 シートが見つかりません。');
    if (appSheet.getLastRow() < 2) throw new Error('キャンセル対象の申込が見つかりません。');

    var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
    requireColumns_(cols, ['研修ID', '職員ID', '申込状態コード', '取消日時', '更新日時', '削除フラグ']);

    var data = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
    var targetRowNumber = null;
    for (var r = 0; r < data.length; r += 1) {
      var row = data[r];
      var deleted = toBoolean_(row[cols['削除フラグ']]);
      if (deleted) continue;
      var rowObj = {};
      for (var c = 0; c < headers.length; c += 1) {
        rowObj[String(headers[c] || '')] = row[c];
      }
      if (!isMemberApplicationRecord_(rowObj, trainingId, memberId, staffId)) continue;
      if (String(row[cols['申込状態コード']] || '') !== 'APPLIED') continue;
      targetRowNumber = r + 2;
      break;
    }
    if (!targetRowNumber) throw new Error('キャンセル対象の申込が見つかりません。');

    var nowIso = new Date().toISOString();
    appSheet.getRange(targetRowNumber, cols['申込状態コード'] + 1).setValue('CANCELED');
    appSheet.getRange(targetRowNumber, cols['取消日時'] + 1).setValue(nowIso);
    appSheet.getRange(targetRowNumber, cols['更新日時'] + 1).setValue(nowIso);

    var nextApplicants = countAppliedApplicants_(ss, trainingId);
    var tCols = trainingFound.columns;
    if (tCols['申込者数'] != null) {
      trainingSheet.getRange(trainingFound.rowNumber, tCols['申込者数'] + 1).setValue(nextApplicants);
    }
    if (tCols['更新日時'] != null) {
      trainingSheet.getRange(trainingFound.rowNumber, tCols['更新日時'] + 1).setValue(nowIso);
    }
    SpreadsheetApp.flush();
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();

    return { canceled: true, applicants: nextApplicants };
  } finally {
    lock.releaseLock();
  }
}

function isTrainingCancelable_(trainingRow, trainingCols) {
  var idx = trainingCols['項目設定JSON'];
  if (idx == null) return false;
  var options = parseTrainingOptions_(trainingRow[idx]);
  if (options.cancelAllowed !== true) return false;
  // 2026-10-13: 開催日を過ぎた研修は取り消せない（以前は開催後でも取り消せ、受講済みの記録が「取消」に変わった）。
  // 2026-11-02（operator 決定・BR-22）: 受付と同じく開催日の当日 23:59（日本時間）まで。以前は開始時刻で締めていた
  // 2026-11-03: 開催日の列が無い・空・読めないときは取り消させない（以前は日付を確かめずに通していた・fail-closed）。
  var dateIdx = trainingCols['開催日'];
  var eventEndMs = dateIdx == null ? null : jstDayEndMs_(trainingRow[dateIdx]);
  if (eventEndMs == null) return false;
  if (new Date().getTime() > eventEndMs) return false;
  return true;
}

function countAppliedApplicants_(ss, trainingId) {
  return getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') }).length;
}

// ── 研修申込の共通ルール ────────────────────────────────────────────────
//
// 2026-09-27: 申込の入口は 3 つある（会員マイページ / 公開ポータル / 管理画面の名簿追加）。
// 以前はそれぞれが独自に判定しており、管理画面からの追加には重複検査も定員検査も無く、
// 公開申込は同じメールの人でも申込のたびに T_外部申込者 を作り直していた。
// 「どこから登録しても 1 人の申込は 1 人」を守るため、判定をここに集める。
// 入口ごとの手続き（本人確認・権限・メール）は別物なので共通化しない。

// 外部申込者の同一性はメールアドレスで見る。氏名は表記ゆれが避けられず、
// 同姓同名もありうるので鍵にしない。メールが無い場合だけ新規に起こす。
function normalizeApplicantEmailKey_(email) {
  return String(email == null ? '' : email).trim().toLowerCase();
}

// 既存の外部申込者を返す。無ければ 1 件だけ作る。
// 連絡先が変わっていれば最新で上書きする（同じ人を増やさない）。
function resolveOrCreateExternalApplicant_(ss, info) {
  var sheet = ss.getSheetByName('T_外部申込者');
  if (!sheet) throw new Error('T_外部申込者 シートが見つかりません。');
  var emailKey = normalizeApplicantEmailKey_(info && info.email);
  var nowIso = new Date().toISOString();

  if (emailKey) {
    var found = null;
    var rows = getRowsAsObjectsFromSheet_(sheet);
    for (var i = 0; i < rows.length; i += 1) {
      if (toBoolean_(rows[i]['削除フラグ'])) continue;
      if (normalizeApplicantEmailKey_(rows[i]['メールアドレス']) !== emailKey) continue;
      found = rows[i];
      break;
    }
    if (found) {
      var externalId = String(found['外部申込者ID'] || '');
      updateExternalApplicantContact_(ss, externalId, info, nowIso);
      return { externalId: externalId, created: false };
    }
  }

  var newId = 'EXT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  appendRowsByHeaders_(ss, 'T_外部申込者', [{
    '外部申込者ID': newId,
    '氏名': String((info && info.name) || ''),
    'フリガナ': String((info && info.kana) || ''),
    'メールアドレス': String((info && info.email) || ''),
    '電話番号': String((info && info.phone) || ''),
    '事業所名': String((info && info.officeName) || ''),
    '同意日時': nowIso,
    '作成日時': nowIso,
    '更新日時': nowIso,
    '削除フラグ': false,
  }]);
  return { externalId: newId, created: true };
}

// 既存の外部申込者の連絡先を、空でない値だけ更新する。
// 空で上書きすると、管理画面のゲスト追加（メール任意）が既存の連絡先を消してしまう。
function updateExternalApplicantContact_(ss, externalId, info, nowIso) {
  try {
    var sheet = ss.getSheetByName('T_外部申込者');
    var found = findRowByColumnValue_(sheet, '外部申込者ID', String(externalId || ''));
    if (!found) return;
    var cols = found.columns;
    var row = found.row;
    var updates = {
      '氏名': (info && info.name) || '',
      'フリガナ': (info && info.kana) || '',
      '電話番号': (info && info.phone) || '',
      '事業所名': (info && info.officeName) || '',
    };
    var changed = false;
    for (var key in updates) {
      if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
      var value = String(updates[key] || '').trim();
      if (!value || cols[key] == null) continue;
      // 2026-10-13: 登録済みの値は上書きしない（空欄だけ埋める）。この経路は匿名の公開申込で、
      // メールアドレスを知っていれば他人の氏名・電話を書き換えられた（名簿にそのまま出る）。
      // 連絡先の変更は事務局が名簿で行う。
      if (String(row[cols[key]] || '').trim() !== '') continue;
      row[cols[key]] = value;
      changed = true;
    }
    if (!changed) return;
    if (cols['更新日時'] != null) row[cols['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } catch (e) {
    Logger.log('[updateExternalApplicantContact_] ' + externalId + ': ' + e.message);
  }
}

// 同じ研修に同じ人の有効な申込が既にあるか。無ければ null。
// applicant: { kind: 'MEMBER'|'EXTERNAL', memberId, staffId, externalId }
function findExistingTrainingApplication_(ss, trainingId, applicant) {
  var rows = getTrainingApplicationRows_(ss, { appliedOnly: true, trainingId: String(trainingId || '') });
  var kind = String((applicant && applicant.kind) || '');
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (kind === 'MEMBER') {
      if (isMemberApplicationRecord_(row, trainingId, applicant.memberId, applicant.staffId)) return row;
      continue;
    }
    if (String(row['申込者区分コード'] || '') !== 'EXTERNAL') continue;
    var target = String((applicant && applicant.externalId) || '');
    if (!target) continue;
    // 申込者ID と 外部申込者ID のどちらに入っているかは経路によって違う（申込者解決の 2 モデル）。
    if (String(row['申込者ID'] || '') === target || String(row['外部申込者ID'] || '') === target) return row;
  }
  return null;
}

// 研修IDだけ分かっている呼び出し元（管理画面の名簿追加）向け。
function evaluateTrainingCapacityForTraining_(ss, trainingId) {
  var capacityValue = 0;
  try {
    var found = findRowByColumnValue_(ss.getSheetByName('T_研修'), '研修ID', String(trainingId || ''));
    if (found && found.columns['定員'] != null) capacityValue = found.row[found.columns['定員']];
  } catch (e) {
    Logger.log('[evaluateTrainingCapacityForTraining_] ' + trainingId + ': ' + e.message);
  }
  return evaluateTrainingCapacity_(ss, trainingId, capacityValue);
}

// 定員の判定。数え方は countAppliedApplicants_ に一本化する。
// 管理画面からは意図的に超過させられるが、超えたことは呼び出し元へ返して伝える
// （運用の基本は定員そのものを広げること）。
function evaluateTrainingCapacity_(ss, trainingId, capacityValue) {
  var capacity = Number(capacityValue || 0);
  var applicants = countAppliedApplicants_(ss, trainingId);
  return {
    capacity: capacity,
    applicants: applicants,
    isFull: capacity > 0 && applicants >= capacity,
  };
}

function isMemberApplicationRecord_(rowObj, trainingId, memberId, staffId) {
  if (String(rowObj['研修ID'] || '') !== String(trainingId || '')) return false;
  if (String(rowObj['職員ID'] || '') !== String(staffId || '')) return false;
  var applicantType = getApplicationApplicantType_(rowObj);
  var applicantId = getApplicationApplicantId_(rowObj);
  if (applicantType || applicantId) {
    return applicantType === 'MEMBER' && applicantId === String(memberId || '');
  }
  return String(rowObj['会員ID'] || '') === String(memberId || '');
}

function backfillApplicationApplicantIdentity_(ss) {
  var appSheet = ss.getSheetByName('T_研修申込');
  if (!appSheet || appSheet.getLastRow() < 2) return 0;

  var headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  if (cols['申込者区分コード'] == null || cols['申込者ID'] == null || cols['会員ID'] == null) return 0;

  var rows = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
  var nowIso = new Date().toISOString();
  var updated = 0;

  for (var r = 0; r < rows.length; r += 1) {
    var row = rows[r];
    var applicantType = String(row[cols['申込者区分コード']] || '').trim();
    var applicantId = String(row[cols['申込者ID']] || '').trim();
    var memberId = String(row[cols['会員ID']] || '').trim();
    var changed = false;

    if (!applicantType && !applicantId && memberId) {
      row[cols['申込者区分コード']] = 'MEMBER';
      row[cols['申込者ID']] = memberId;
      changed = true;
    } else if (applicantType === 'MEMBER' && !applicantId && memberId) {
      row[cols['申込者ID']] = memberId;
      changed = true;
    }

    if (changed) {
      if (cols['更新日時'] != null) row[cols['更新日時']] = nowIso;
      appSheet.getRange(r + 2, 1, 1, row.length).setValues([row]);
      updated += 1;
    }
  }
  return updated;
}

// ============================================================
// 【申込者解決ヘルパーの使い分け — 重要・v376.21 ガードレール】
//
// 申込者の解決には用途の異なる 2 モデルが併存する。混同禁止:
//
//  (1) getCanonicalApplicantRef_  … v360 正本・STAFF を独立 type として返す。
//      「実際に申込んだのは誰か（送信先メール・名簿表示・本人解決）」を求める用途は
//      必ずこちら。STAFF 申込を職員個人として正しく解決する。
//
//  (2) getApplicationApplicantType_ / getApplicationApplicantId_ /
//      getMemberIdFromApplication_  … legacy「MEMBER + 別途 職員ID」モデル。
//      整合性検証 (getTrainingApplicationIntegrityIssues_) と会員申込フィルタが
//      この前提で組まれているため温存している。STAFF 申込を独立解決しない。
//
// ⚠️ 禁止: (2) を「送信先・名簿・本人」の解決に使わないこと。STAFF 申込が
//    会員として誤解決され、事業所代表メールへ誤送信される（v376.12 で実際に発生）。
//    送信先・表示・本人解決は必ず (1) getCanonicalApplicantRef_ を使う。
// ============================================================
/**
 * @deprecated v376.52〜（docs/248 是正）。legacy「MEMBER + 別途 職員ID」モデル。
 * 用途は整合性検証・会員申込フィルタに限定（上記ガードレール参照）。
 * 送信先・名簿・本人解決に使うことは禁止。新規呼出は追加しない（v377 で撤去予定）。
 */
function getApplicationApplicantType_(rowObj) {
  // legacy モデル: 3-FK XOR を優先評価し、空ならば legacy 申込者区分コードへフォールバック。
  // STAFF を独立解決しない（送信先・名簿解決には使わない / 上記ガードレール参照）。
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return 'EXTERNAL';
  var applicantType = String(rowObj['申込者区分コード'] || '').trim();
  if (applicantType) return applicantType;
  return String(rowObj['会員ID'] || '').trim() ? 'MEMBER' : '';
}

function getApplicationApplicantId_(rowObj) {
  // legacy モデル（getApplicationApplicantType_ と対。送信先・名簿解決には使わない）
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return externalId;
  var applicantId = String(rowObj['申込者ID'] || '').trim();
  if (applicantId) return applicantId;
  return String(rowObj['会員ID'] || '').trim();
}

// v360: 申込者の正本参照を取得（3-FK XOR 優先・STAFF を独立 type として返す）。
// 送信先メール・名簿表示・本人解決はすべてこの関数を使うこと（上記ガードレール参照）。
function getCanonicalApplicantRef_(rowObj) {
  var memberId = String(rowObj['会員ID'] || '').trim();
  var staffId = String(rowObj['職員ID'] || '').trim();
  var externalId = String(rowObj['外部申込者ID'] || '').trim();
  if (externalId) return { type: 'EXTERNAL', id: externalId };
  if (staffId) return { type: 'STAFF', id: staffId };
  if (memberId) return { type: 'MEMBER', id: memberId };
  // フォールバック: legacy データ
  var legacyId = String(rowObj['申込者ID'] || '').trim();
  var legacyType = String(rowObj['申込者区分コード'] || '').trim();
  if (legacyId && legacyType === 'EXTERNAL') return { type: 'EXTERNAL', id: legacyId };
  if (legacyId) return { type: 'MEMBER', id: legacyId };
  return { type: '', id: '' };
}

// legacy モデル: 会員申込フィルタ専用（MEMBER 以外は '' を返す）。
// 送信先・名簿・本人解決には使わない（getCanonicalApplicantRef_ を使う / 上記ガードレール参照）。
function getMemberIdFromApplication_(rowObj) {
  var applicantType = getApplicationApplicantType_(rowObj);
  if (applicantType !== 'MEMBER') return '';
  return getApplicationApplicantId_(rowObj);
}

function buildTrainingApplicationRelationContext_(ss) {
  return buildTrainingApplicationRelationContextFromRows_(getRowsAsObjectsBatch_(ss, [
    'T_研修',
    'T_会員',
    'T_事業所職員',
    'T_外部申込者',
  ]));
}

function getTrainingApplicationIntegrityIssues_(rowObj, context) {
  var issues = [];
  var trainingId = String(rowObj['研修ID'] || '').trim();
  var rawApplicantType = String(rowObj['申込者区分コード'] || '').trim();
  var rawApplicantId = String(rowObj['申込者ID'] || '').trim();
  var applicantType = getApplicationApplicantType_(rowObj);
  var applicantId = getApplicationApplicantId_(rowObj);
  var memberId = String(rowObj['会員ID'] || '').trim();
  var staffId = String(rowObj['職員ID'] || '').trim();

  if (!trainingId || !context.trainingMap[trainingId]) {
    issues.push('研修ID参照不正');
  }

  if (!rawApplicantType) {
    issues.push('申込者区分コード未設定');
  }
  if (!rawApplicantId && memberId) {
    issues.push('申込者ID未設定');
  }

  if (applicantType === 'MEMBER') {
    var effectiveMemberId = applicantId || memberId;
    if (!effectiveMemberId) {
      issues.push('会員申込なのに会員IDが空');
    } else if (!context.memberMap[effectiveMemberId]) {
      issues.push('会員ID参照不正');
    }
    if (memberId && effectiveMemberId && memberId !== effectiveMemberId) {
      issues.push('会員IDと申込者IDが不一致');
    }
    if (staffId) {
      var staffRow = context.staffMap[staffId];
      if (!staffRow) {
        issues.push('職員ID参照不正');
      } else if (effectiveMemberId && String(staffRow['会員ID'] || '') !== effectiveMemberId) {
        issues.push('職員IDと会員IDの関連不一致');
      }
    }
  } else if (applicantType === 'EXTERNAL') {
    if (!applicantId) {
      issues.push('外部申込者IDが空');
    } else if (!context.externalMap[applicantId]) {
      issues.push('外部申込者ID参照不正');
    }
    if (staffId) {
      issues.push('外部申込に職員IDが設定されている');
    }
  } else {
    issues.push('申込者区分コード不正');
  }

  return issues;
}

function isTrainingApplicationRowValid_(rowObj, context) {
  return getTrainingApplicationIntegrityIssues_(rowObj, context).length === 0;
}

function getTrainingApplicationRows_(ss, options) {
  var opts = options || {};
  var context = opts.context || buildTrainingApplicationRelationContext_(ss);
  var sourceRows = opts.rows || getRowsAsObjects_(ss, 'T_研修申込');
  return sourceRows.filter(function(row) {
    if (toBoolean_(row['削除フラグ'])) return false;
    if (opts.appliedOnly && String(row['申込状態コード'] || '') !== 'APPLIED') return false;
    if (opts.trainingId && String(row['研修ID'] || '') !== String(opts.trainingId)) return false;
    if (!isTrainingApplicationRowValid_(row, context)) return false;
    if (opts.memberId && getMemberIdFromApplication_(row) !== String(opts.memberId)) return false;
    return true;
  });
}

function assertTrainingMemberApplicationWritable_(ss, memberId, staffId) {
  var normalizedMemberId = String(memberId || '').trim();
  var normalizedStaffId = String(staffId || '').trim();
  if (!normalizedMemberId) {
    throw new Error('memberId が未指定です。');
  }

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['会員ID'] || '') === normalizedMemberId;
  });
  if (!memberRows.length) {
    throw new Error('対象会員が見つかりません。');
  }

  if (!normalizedStaffId) return;

  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['職員ID'] || '') === normalizedStaffId;
  });
  if (!staffRows.length) {
    throw new Error('対象職員が見つかりません。');
  }
  if (String(staffRows[0]['会員ID'] || '') !== normalizedMemberId) {
    throw new Error('職員IDと会員IDの紐付けが一致しません。');
  }
}

function buildRepairNote_(currentNote, message) {
  var existing = String(currentNote || '').trim();
  return existing ? existing + ' | ' + message : message;
}

// 研修の登録と受付期間のルールの単一情報源 src/shared/trainingRules.mjs を、
// build（injectTrainingRulesPlaceholders）が下記マーカー間へ toJstYmd_ / jstDayStartMs_ / jstDayEndMs_ /
// validateTrainingRegistration_ として注入する（2026-11-02・BR-22）。
// 日付は日本時間で区切る。以前は setHours（スクリプトのタイムゾーン America/New_York）で区切っており、
// 申込締切日が日本時間 13:59 に終わり、日付型の申込開始日は前日 14:00 に始まっていた。
// __TRAINING_RULES_BUILD_INJECT_START__
function toJstYmd_(value) {
  throw new Error('toJstYmd_ is not injected — run build:gas (injectTrainingRulesPlaceholders)');
}
function jstDayStartMs_(value) {
  throw new Error('jstDayStartMs_ is not injected — run build:gas (injectTrainingRulesPlaceholders)');
}
function jstDayEndMs_(value) {
  throw new Error('jstDayEndMs_ is not injected — run build:gas (injectTrainingRulesPlaceholders)');
}
function validateTrainingRegistration_(input) {
  throw new Error('validateTrainingRegistration_ is not injected — run build:gas (injectTrainingRulesPlaceholders)');
}
// __TRAINING_RULES_BUILD_INJECT_END__

function rowToObjectByColumns_(row, columns) {
  var result = {};
  Object.keys(columns || {}).forEach(function(name) {
    result[name] = row[columns[name]];
  });
  return result;
}

function normalizeTrainingLifecycleStatus_(raw) {
  var status = String(raw || '').trim().toUpperCase();
  if (status === 'DRAFT') return 'DRAFT';
  if (status === 'CANCELLED' || status === 'CANCELED') return 'CANCELLED';
  if (status === 'ARCHIVED') return 'ARCHIVED';
  // Legacy OPEN/CLOSED only described application availability. Treat them as visible trainings.
  return 'PUBLISHED';
}

// 日付の欄に何か入っているか（空欄は「未設定」、値があって読めないものは「確認できない」と分けるため）。
function hasTrainingDateValue_(value) {
  if (value == null) return false;
  if (Object.prototype.toString.call(value) === '[object Date]') return true;
  return String(value).trim() !== '';
}

function computeTrainingAvailability_(trainingRow, options) {
  var now = options && options.now ? options.now : new Date();
  var nowMs = now.getTime();
  var lifecycleStatus = normalizeTrainingLifecycleStatus_(trainingRow && trainingRow['研修状態コード']);
  // 日付は日本時間で区切る（BR-22）。受付は開催日の当日 23:59 まで（2026-11-01 operator 決定。以前は開始時刻で終了）
  var openStartMs = jstDayStartMs_(trainingRow && trainingRow['申込開始日']);
  var closeEndMs = jstDayEndMs_(trainingRow && trainingRow['申込締切日']);
  var eventEndMs = jstDayEndMs_(trainingRow && trainingRow['開催日']);
  var capacity = Number(trainingRow && trainingRow['定員'] || 0);
  var applicants = Number(trainingRow && trainingRow['申込者数'] || 0);

  if (lifecycleStatus !== 'PUBLISHED') {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'UNAVAILABLE', isApplicationOpen: false, applicationStatusReason: '研修が公開状態ではありません。' };
  }
  // 2026-11-03: 日付を確かめられないときは受け付けない（fail-closed）。以前は開催日が空・読めないと
  // 開催日の判定を飛ばし、申込開始日・締切日も値があって読めなければ制限なしとして受け付けていた。
  // 申込開始日・締切日は任意項目なので、空は今までどおり制限なし。
  if (eventEndMs == null) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'UNAVAILABLE', isApplicationOpen: false, applicationStatusReason: '開催日を確認できないため受け付けていません。' };
  }
  if ((openStartMs == null && hasTrainingDateValue_(trainingRow && trainingRow['申込開始日']))
      || (closeEndMs == null && hasTrainingDateValue_(trainingRow && trainingRow['申込締切日']))) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'UNAVAILABLE', isApplicationOpen: false, applicationStatusReason: '申込期間を確認できないため受け付けていません。' };
  }
  if (nowMs > eventEndMs) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'CLOSED', isApplicationOpen: false, applicationStatusReason: '開催日を過ぎています。' };
  }
  if (openStartMs != null && nowMs < openStartMs) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'NOT_STARTED', isApplicationOpen: false, applicationStatusReason: '申込開始日前です。' };
  }
  if (closeEndMs != null && nowMs > closeEndMs) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'CLOSED', isApplicationOpen: false, applicationStatusReason: '申込締切日を過ぎています。' };
  }
  if (capacity > 0 && applicants >= capacity) {
    return { lifecycleStatus: lifecycleStatus, applicationStatus: 'FULL', isApplicationOpen: false, applicationStatusReason: '定員に達しています。' };
  }
  return { lifecycleStatus: lifecycleStatus, applicationStatus: 'OPEN', isApplicationOpen: true, applicationStatusReason: '' };
}

function buildTrainingSaveResponse_(payload, lifecycleStatus, applicants) {
  var response = {};
  Object.keys(payload || {}).forEach(function(key) {
    response[key] = payload[key];
  });
  var availability = computeTrainingAvailability_({
    '研修状態コード': lifecycleStatus,
    '申込開始日': response.applicationOpenDate,
    '申込締切日': response.applicationCloseDate,
    '開催日': response.date,
    '定員': response.capacity,
    '申込者数': applicants,
  });
  response.status = availability.isApplicationOpen ? 'OPEN' : 'CLOSED';
  response.lifecycleStatus = availability.lifecycleStatus;
  response.applicationStatus = availability.applicationStatus;
  response.applicationStatusReason = availability.applicationStatusReason;
  response.isApplicationOpen = availability.isApplicationOpen;
  return response;
}

// ─── 申込者数ヘルパー ────────────────────────────────────────────────────────

function updateTrainingApplicantCount_(db, trainingId) {
  var count = countAppliedApplicants_(db, trainingId);
  var trainingSheet = db.getSheetByName('T_研修');
  updateRowByKey_(trainingSheet, テーブル定義.T_研修, '研修ID', trainingId, { '申込者数': count, '更新日時': new Date().toISOString() });
}

// ── v264 変更申請キュー ここまで ────────────────────────────────────────────

function getTrainingApplicants_(payload) {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  if (!payload) return JSON.stringify({ success: false, error: 'trainingId required' });
  var trainingId = String(payload.trainingId || '').trim();
  if (!trainingId) return JSON.stringify({ success: false, error: 'trainingId required' });

  // v376.12: getCanonicalApplicantRef_ で 3-FK XOR 正本判定。事業所職員 (STAFF) を職員IDで解決し、
  //   送信先メールが事業所代表ではなく職員個人になるよう修正。
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  backfillApplicationApplicantIdentity_(db);
  var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });

  var memberSheet = db.getSheetByName('T_会員');
  var memberRows = getRowsAsObjectsFromSheet_(memberSheet);
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var staffSheet = db.getSheetByName('T_事業所職員');
  var staffMap = {};
  (staffSheet ? getRowsAsObjectsFromSheet_(staffSheet) : []).forEach(function(r) { staffMap[String(r['職員ID'] || '')] = r; });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getRowsAsObjectsFromSheet_(externalSheet);
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var ref = getCanonicalApplicantRef_(r);
    var name = '(不明)', email = '', officeName = '';
    if (ref.type === 'STAFF') {
      var staffInfo = staffMap[ref.id];
      if (staffInfo) {
        name = (String(staffInfo['姓'] || '') + ' ' + String(staffInfo['名'] || '')).trim() || String(staffInfo['氏名'] || '');
        email = String(staffInfo['メールアドレス'] || '');
        var parentMember = memberMap[String(staffInfo['会員ID'] || '')];
        officeName = parentMember ? String(parentMember['勤務先名'] || '') : '';
      }
    } else if (ref.type === 'MEMBER') {
      var memberInfo = memberMap[ref.id];
      if (memberInfo) {
        name = (String(memberInfo['姓'] || '') + ' ' + String(memberInfo['名'] || '')).trim() || String(memberInfo['氏名'] || '');
        email = String(memberInfo['代表メールアドレス'] || '');
        officeName = String(memberInfo['勤務先名'] || '');
      }
    } else if (ref.type === 'EXTERNAL') {
      var extInfo = externalMap[ref.id];
      if (extInfo) {
        name = String(extInfo['氏名'] || '');
        email = String(extInfo['メールアドレス'] || '');
        officeName = String(extInfo['事業所名'] || '');
      }
    }
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: ref.type || 'MEMBER',
      applicantId: ref.id,
      name: name,
      email: email,
      officeName: officeName,
      status: String(r['申込状態コード'] || ''),
      applyDate: String(r['申込日時'] || ''),
    };
  });

  return JSON.stringify({ success: true, data: result });
}

// v373.7 (S5 Phase 2): migrateRosterTemplateLibraryCategoryForV360_ 撤去（操作者確認済み）

/**
 * T_研修申込 の 3-FK XOR 違反を検出（v360 以降の不変条件）。
 * Strict-XOR は外部申込者ID/会員ID/職員ID のいずれか1つだけ non-empty。
 * legacy 行（外部申込者ID 空 + 申込者ID 持ち）は warning 扱い。
 */
// ─── v360: 研修名簿管理 API ─────────────────────────────────────────────

/**
 * 研修詳細名簿取得（管理者専用）。
 * 既存 getTrainingApplicants_ を拡張し、出欠状態・事務局メモ・申込者サブ種別情報を追加する。
 */
function getTrainingRosterDetail_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId || '').trim();
  if (!trainingId) return { error: 'trainingId required' };

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });

  var memberRows = getRowsAsObjects_(db, 'T_会員');
  var memberMap = {};
  memberRows.forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });

  var staffRows = getRowsAsObjects_(db, 'T_事業所職員');
  var staffMap = {};
  staffRows.forEach(function(r) { staffMap[String(r['職員ID'] || '')] = r; });

  var externalRows = getRowsAsObjects_(db, 'T_外部申込者');
  var externalMap = {};
  externalRows.forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

  var result = applyRows.map(function(r) {
    var ref = getCanonicalApplicantRef_(r);
    var info, name = '(不明)', email = '', officeName = '', phone = '';
    if (ref.type === 'EXTERNAL') {
      info = externalMap[ref.id];
      if (info) {
        name = String(info['氏名'] || '');
        email = String(info['メールアドレス'] || '');
        officeName = String(info['事業所名'] || '');
        phone = String(info['電話番号'] || '');
      }
    } else if (ref.type === 'STAFF') {
      info = staffMap[ref.id];
      if (info) {
        name = (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() || String(info['氏名'] || '');
        email = String(info['メールアドレス'] || '');
        var officeMember = memberMap[String(info['会員ID'] || '')];
        officeName = officeMember ? String(officeMember['勤務先名'] || '') : '';
      }
    } else if (ref.type === 'MEMBER') {
      info = memberMap[ref.id];
      if (info) {
        name = (String(info['姓'] || '') + ' ' + String(info['名'] || '')).trim() || String(info['氏名'] || '');
        email = String(info['代表メールアドレス'] || '');
        officeName = String(info['勤務先名'] || '');
        phone = String(info['携帯電話番号'] || '');
      }
    }
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      applicantType: ref.type,
      applicantId: ref.id,
      name: name,
      email: email,
      officeName: officeName,
      phone: phone,
      status: String(r['申込状態コード'] || ''),
      applyDate: String(r['申込日時'] || ''),
      cancelDate: String(r['取消日時'] || ''),
      attendanceStatus: String(r['出欠状態コード'] || 'UNRECORDED'),
      attendanceRecordedAt: String(r['出欠記録日時'] || ''),
      attendanceRecordedBy: String(r['出欠記録者メール'] || ''),
      adminMemo: String(r['事務局メモ'] || ''),
      remarks: String(r['備考'] || ''),
      // BR-21: 会員かどうか。会員・職員として記録された申込（マイページ・管理画面の追加）は会員。
      // 外部申込は照合結果。この列ができる前の外部申込は空（照合していない）。
      membershipCode: ref.type === 'EXTERNAL' ? String(r['会員照合結果コード'] || '') : 'MEMBER',
      matchedMemberId: String(r['照合会員ID'] || ''),
      matchedStaffId: String(r['照合職員ID'] || ''),
      declaredCmNumber: String(r['申告介護支援専門員番号'] || ''),
    };
  });
  return { applicants: result };
}

/**
 * 出欠状態を 1 件記録。
 */
function saveAttendance_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId || !payload.status) return { error: 'invalid payload' };
  var ss = getOrCreateDatabase_();
  if (!isKnownMasterCode_(ss, 'M_出欠状態', payload.status)) return { error: 'invalid status' };
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet) return { error: 'sheet missing' };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  if (cols['申込ID'] == null || cols['出欠状態コード'] == null) return { error: 'columns missing' };
  // 2026-10-02: payload.status を無検証でセルに書いていた（docs/294 §2-6）。
  // シートの入力規則は setValues を止めないので、ここで M_出欠状態 と突き合わせる。
  var attendanceStatus = String((payload && payload.status) || '').trim();
  if (!attendanceStatus) return { error: '出欠状態コードが未指定です' };
  if (!isKnownMasterCode_(ss, 'M_出欠状態', attendanceStatus)) {
    return { error: '未知の出欠状態コードです: ' + attendanceStatus };
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { error: 'no data' };
  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      data[r][cols['出欠状態コード']] = payload.status;
      if (cols['出欠記録日時'] != null) data[r][cols['出欠記録日時']] = now;
      if (cols['出欠記録者メール'] != null) data[r][cols['出欠記録者メール']] = operatorEmail;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      clearAllDataCache_();
      return { ok: true, applyId: payload.applyId, status: payload.status, recordedAt: now };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 出欠を一括更新（全員出席セット等）。
 */
function saveAttendanceBatch_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !Array.isArray(payload.entries)) return { error: 'invalid payload' };
  var results = [];
  for (var i = 0; i < payload.entries.length; i++) {
    results.push(saveAttendance_(payload.entries[i]));
  }
  return { results: results };
}

/**
 * 管理者による申込者の手動追加（会員・職員）。
 * payload: { trainingId, memberId? | staffId? }
 */
function addRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId).trim();
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  if (!memberId && !staffId) return { error: 'memberId or staffId required' };
  if (memberId && staffId) return { error: 'memberId and staffId are mutually exclusive' };

  var ss = getOrCreateDatabase_();

  // 2026-09-27: 以前は重複検査も定員検査も無かった。入口が違っても
  // 「1 人の申込は 1 人」は変わらないので、重複は必ず弾く。
  var applicantKey = { kind: 'MEMBER', memberId: memberId, staffId: staffId };
  var existing = findExistingTrainingApplication_(ss, trainingId, applicantKey);
  if (existing) {
    return { error: 'already_applied', applyId: String(existing['申込ID'] || '') };
  }

  // 定員は管理画面からなら越えられる（運用上そうすることがある）。ただし黙って
  // 越えさせない。越えたことを返し、画面に「定員そのものを広げてください」と出す。
  var capacityInfo = evaluateTrainingCapacityForTraining_(ss, trainingId);

  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  var applyId = generateTrainingApplyId_();
  var row = {
    '申込ID': applyId,
    '研修ID': trainingId,
    '会員ID': memberId,
    '職員ID': staffId,
    '外部申込者ID': '',
    '申込者区分コード': 'MEMBER',
    '申込者ID': memberId || staffId,
    '申込状態コード': 'APPLIED',
    '申込日時': now,
    '取消日時': '',
    '備考': '管理者により手動追加 (' + operatorEmail + ')',
    '出欠状態コード': 'UNRECORDED',
    '出欠記録日時': '',
    '出欠記録者メール': '',
    '事務局メモ': String(payload.memo || ''),
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  };
  appendRowsByHeaders_(ss, 'T_研修申込', [row]);
  clearAllDataCache_();
  // 2026-10-13: 管理画面の名簿操作でも申込者数を数え直す。以前は更新しておらず、
  // 公開側が「定員に達しています」のまま受付を止めることがあった。
  updateTrainingApplicantCount_(ss, String(payload.trainingId));
  return { ok: true, applyId: applyId, capacityExceeded: capacityInfo.isFull, capacity: capacityInfo.capacity, applicants: capacityInfo.applicants + 1 };
}

/**
 * 管理者によるゲスト（非会員）申込追加。T_外部申込者 + T_研修申込 を 1 トランザクションで作成。
 * payload: { trainingId, guest: { name, kana?, email?, phone?, officeName? } }
 */
function addGuestRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  if (!payload.guest || !payload.guest.name) return { error: 'guest.name required' };

  var ss = getOrCreateDatabase_();
  var operatorEmail = Session.getActiveUser().getEmail();
  var now = new Date().toISOString();
  var trainingId = String(payload.trainingId);

  // 1. 外部申込者を解決する。メールが一致する人が既にいればその人を使う。
  //    2026-09-27 まではここで必ず新規作成しており、公開ポータルから申し込んだ人を
  //    管理画面でゲスト追加すると同じ人が 2 人になっていた。
  var resolvedGuest = resolveOrCreateExternalApplicant_(ss, {
    name: String(payload.guest.name),
    kana: String(payload.guest.kana || ''),
    email: String(payload.guest.email || ''),
    phone: String(payload.guest.phone || ''),
    officeName: String(payload.guest.officeName || ''),
  });
  var externalId = resolvedGuest.externalId;

  var existingGuestApply = findExistingTrainingApplication_(ss, trainingId, { kind: 'EXTERNAL', externalId: externalId });
  if (existingGuestApply) {
    return { error: 'already_applied', applyId: String(existingGuestApply['申込ID'] || ''), externalId: externalId };
  }
  var guestCapacity = evaluateTrainingCapacityForTraining_(ss, trainingId);

  // 2. T_研修申込 へ追加
  var applyId = generateTrainingApplyId_();
  var applyRow = {
    '申込ID': applyId,
    '研修ID': String(payload.trainingId),
    '会員ID': '',
    '職員ID': '',
    '外部申込者ID': externalId,
    '申込者区分コード': 'EXTERNAL',
    '申込者ID': externalId,
    '申込状態コード': 'APPLIED',
    '申込日時': now,
    '取消日時': '',
    '備考': '管理者によりゲスト追加 (' + operatorEmail + ')',
    '出欠状態コード': 'UNRECORDED',
    '出欠記録日時': '',
    '出欠記録者メール': '',
    '事務局メモ': String(payload.memo || ''),
    '作成日時': now,
    '更新日時': now,
    '削除フラグ': false,
  };
  appendRowsByHeaders_(ss, 'T_研修申込', [applyRow]);
  clearAllDataCache_();
  // 2026-10-13: 管理画面の名簿操作でも申込者数を数え直す。以前は更新しておらず、
  // 公開側が「定員に達しています」のまま受付を止めることがあった。
  updateTrainingApplicantCount_(ss, String(payload.trainingId));
  return { ok: true, applyId: applyId, externalId: externalId, reusedExternal: !resolvedGuest.created, capacityExceeded: guestCapacity.isFull, capacity: guestCapacity.capacity, applicants: guestCapacity.applicants + 1 };
}

/**
 * 管理者による申込キャンセル。物理削除はせず、申込状態=CANCELED + 取消日時 を記録。
 */
function cancelRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId) return { error: 'applyId required' };
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修申込');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  var operatorEmail = Session.getActiveUser().getEmail();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      data[r][cols['申込状態コード']] = 'CANCELED';
      data[r][cols['取消日時']] = now;
      if (cols['備考'] != null) {
        var prevNote = String(data[r][cols['備考']] || '');
        data[r][cols['備考']] = prevNote + ' / 管理者キャンセル(' + operatorEmail + '): ' + String(payload.reason || '');
      }
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      // 2026-10-13: 取消後に申込者数を数え直す（公開側の定員判定が古い件数のまま残らないように）
      if (cols['研修ID'] != null) updateTrainingApplicantCount_(ss, String(data[r][cols['研修ID']] || ''));
      clearAllDataCache_();
      return { ok: true };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 申込レコードの編集（事務局メモのみ変更可能 - データ整合性のため）。
 */
function updateRosterEntry_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.applyId) return { error: 'applyId required' };
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_研修申込');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var now = new Date().toISOString();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['申込ID']] || '') === String(payload.applyId)) {
      if (payload.adminMemo !== undefined && cols['事務局メモ'] != null) {
        data[r][cols['事務局メモ']] = String(payload.adminMemo || '').slice(0, 1000);
      }
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
      sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      clearAllDataCache_();
      return { ok: true };
    }
  }
  return { error: 'applyId not found' };
}

/**
 * 研修の集計指標を返す（残席・区分内訳・出欠率・事業所別）。
 */
function getTrainingStats_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload || !payload.trainingId) return { error: 'trainingId required' };
  var trainingId = String(payload.trainingId).trim();
  var detail = getTrainingRosterDetail_({ trainingId: trainingId });
  if (detail.error) return detail;
  var applicants = detail.applicants;

  var ss = getOrCreateDatabase_();
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');
  var training = null;
  for (var i = 0; i < trainingRows.length; i++) {
    if (String(trainingRows[i]['研修ID'] || '') === trainingId) { training = trainingRows[i]; break; }
  }
  var capacity = training ? Number(training['定員'] || 0) : 0;

  var applied = applicants.filter(function(a) { return a.status === 'APPLIED'; });
  var typeBreakdown = { MEMBER: 0, STAFF: 0, EXTERNAL: 0 };
  // 出欠ごとの件数。出欠の一覧は M_出欠状態（出席率などの計算で使うコードは仕様としてコードに持つ）
  var attendanceBreakdown = {};
  readMasterOptions_(null, 'M_出欠状態').forEach(function(o) { attendanceBreakdown[o.code] = 0; });
  var officeBreakdown = {};
  applied.forEach(function(a) {
    typeBreakdown[a.applicantType] = (typeBreakdown[a.applicantType] || 0) + 1;
    attendanceBreakdown[a.attendanceStatus] = (attendanceBreakdown[a.attendanceStatus] || 0) + 1;
    var office = a.officeName || '(未設定)';
    officeBreakdown[office] = (officeBreakdown[office] || 0) + 1;
  });
  var officeList = Object.keys(officeBreakdown).map(function(k) { return { officeName: k, count: officeBreakdown[k] }; });
  officeList.sort(function(a, b) { return b.count - a.count; });

  var recorded = applied.length - (attendanceBreakdown.UNRECORDED || 0);
  var attended = (attendanceBreakdown.PRESENT || 0) + (attendanceBreakdown.LATE || 0);
  return {
    trainingId: trainingId,
    capacity: capacity,
    applicantCount: applied.length,
    canceledCount: applicants.length - applied.length,
    remainingSlots: Math.max(capacity - applied.length, 0),
    typeBreakdown: typeBreakdown,
    attendanceBreakdown: attendanceBreakdown,
    attendanceRate: recorded > 0 ? Math.round((attended / recorded) * 1000) / 10 : null,
    cancellationRate: recorded > 0 ? Math.round(((attendanceBreakdown.SAMEDAY_CANCEL || 0) / recorded) * 1000) / 10 : null,
    officeBreakdown: officeList,
  };
}

/**
 * 会員ごとの受講履歴を返す。
 * payload: { memberId? | staffId? | externalId? }
 */
function getMemberTrainingHistory_(payload) {
  if (!checkAdminBySession_()) return { error: 'unauthorized' };
  if (!payload) return { error: 'invalid payload' };
  var memberId = String(payload.memberId || '').trim();
  var staffId = String(payload.staffId || '').trim();
  var externalId = String(payload.externalId || '').trim();
  if (!memberId && !staffId && !externalId) return { error: 'memberId/staffId/externalId required' };

  var ss = getOrCreateDatabase_();
  var apps = getRowsAsObjects_(ss, 'T_研修申込').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    var ref = getCanonicalApplicantRef_(r);
    if (memberId && ref.type === 'MEMBER' && ref.id === memberId) return true;
    if (staffId && ref.type === 'STAFF' && ref.id === staffId) return true;
    if (externalId && ref.type === 'EXTERNAL' && ref.id === externalId) return true;
    return false;
  });
  var trainingRows = getRowsAsObjects_(ss, 'T_研修');
  var trainingMap = {};
  trainingRows.forEach(function(t) { trainingMap[String(t['研修ID'] || '')] = t; });
  var history = apps.map(function(r) {
    var t = trainingMap[String(r['研修ID'] || '')] || {};
    return {
      applyId: String(r['申込ID'] || ''),
      trainingId: String(r['研修ID'] || ''),
      trainingName: String(t['研修名'] || ''),
      trainingDate: String(t['開催日'] || ''),
      location: String(t['開催場所'] || ''),
      status: String(r['申込状態コード'] || ''),
      attendanceStatus: String(r['出欠状態コード'] || 'UNRECORDED'),
      applyDate: String(r['申込日時'] || ''),
    };
  });
  history.sort(function(a, b) { return (b.trainingDate || '').localeCompare(a.trainingDate || ''); });
  return { history: history };
}

function auditTrainingApplicationsAfterV360_(ss) {
  var sheet = ss.getSheetByName('T_研修申込');
  if (!sheet || sheet.getLastRow() < 2) return { rows: 0, xorViolations: 0, legacyWarnings: 0 };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[String(headers[i] || '')] = i;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var xorViolations = 0;
  var legacyWarnings = 0;
  var sample = [];
  for (var r = 0; r < data.length; r++) {
    if (toBoolean_(data[r][cols['削除フラグ']])) continue;
    var memberId = String(data[r][cols['会員ID']] || '').trim();
    var staffId = String(data[r][cols['職員ID']] || '').trim();
    var externalId = String(data[r][cols['外部申込者ID']] || '').trim();
    var setCount = (memberId ? 1 : 0) + (staffId ? 1 : 0) + (externalId ? 1 : 0);
    if (setCount === 0) {
      // legacy: 申込者ID に頼っている行
      var legacyId = String(data[r][cols['申込者ID']] || '').trim();
      if (legacyId) {
        legacyWarnings++;
      } else {
        xorViolations++;
        if (sample.length < 5) sample.push({ row: r + 2, applyId: data[r][cols['申込ID']], issue: 'all FKs empty' });
      }
    } else if (setCount > 1) {
      // 会員ID + 職員ID 併存は legacy STAFF 申込の正常状態として許容（既存 §4.12 と同パターン）
      // 外部申込者ID + 他併存は違反
      if (externalId && (memberId || staffId)) {
        xorViolations++;
        if (sample.length < 5) sample.push({ row: r + 2, applyId: data[r][cols['申込ID']], issue: 'external + internal combined' });
      }
    }
  }
  return { rows: data.length, xorViolations: xorViolations, legacyWarnings: legacyWarnings, violationSample: sample };
}
