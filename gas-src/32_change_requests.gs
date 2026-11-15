// gas-src/32_change_requests.gs — 変更申請の承認・却下。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ── 管理者: 変更申請一覧取得 ──────────────────────────────────────────────────
function getAdminChangeRequests_(payload) {
  var ss = getOrCreateDatabase_();
  var rows = getRowsAsObjects_(ss, 'T_変更申請').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  var statusFilter = String(payload.status || '').trim();
  var memberTypeFilter = String(payload.memberType || '').trim();
  var requestTypeFilter = String(payload.requestType || '').trim();

  if (statusFilter) rows = rows.filter(function(r) { return String(r['申請状態コード'] || '') === statusFilter; });
  if (memberTypeFilter) rows = rows.filter(function(r) { return String(r['会員種別コード'] || '') === memberTypeFilter; });
  if (requestTypeFilter) rows = rows.filter(function(r) { return String(r['申請種別コード'] || '') === requestTypeFilter; });

  // 新しい順
  rows.sort(function(a, b) {
    return String(b['申請日時'] || '') > String(a['申請日時'] || '') ? 1 : -1;
  });

  // docs/307 F21（2026-10-25）: 未処理の変更には今の値を付ける。以前は変更後の値しか出ず、何が何に変わるか分からなかった。
  // 処理済みの申請には付けない（今の値は既に変更後になっている）。
  var isPendingChange = function(r) {
    return String(r['申請状態コード'] || '') === 'PENDING' && String(r['申請種別コード'] || '') !== 'MEMBER_APPLICATION';
  };
  var membersById = {};
  var staffById = {};
  if (rows.some(isPendingChange)) {
    getRowsAsObjects_(ss, 'T_会員').forEach(function(m) { membersById[String(m['会員ID'] || '')] = m; });
    getRowsAsObjects_(ss, 'T_事業所職員').forEach(function(s) { staffById[String(s['職員ID'] || '')] = s; });
  }

  return rows.map(function(r) {
    var changeData = {};
    try { changeData = JSON.parse(String(r['申請内容JSON'] || '{}')); } catch(e) {}
    var current = isPendingChange(r)
      ? buildChangeRequestCurrentValues_(changeData, membersById[String(r['会員ID'] || '')], staffById)
      : null;
    return {
      current: current,
      requestId: String(r['申請ID'] || ''),
      memberId: String(r['会員ID'] || ''),
      memberType: String(r['会員種別コード'] || ''),
      requestType: String(r['申請種別コード'] || ''),
      status: String(r['申請状態コード'] || ''),
      contactEmail: String(r['連絡先メールアドレス'] || ''),
      applicantName: String(r['申請者表示名'] || ''),
      requestedAt: String(r['申請日時'] || ''),
      processedAt: String(r['処理日時'] || ''),
      processedByEmail: String(r['処理者メールアドレス'] || ''),
      processNote: String(r['処理備考'] || ''),
      changeData: changeData,
    };
  });
}

// ── 管理者: 変更申請を承認し変更を適用 ─────────────────────────────────────────
// 変更申請の承認・却下は 1 件ずつ順に処理する（2026-10-14・docs/307 SX）。
// 以前は排他が無く、二人の管理者が同じ申請をほぼ同時に承認すると、どちらも「未処理」を読んで
// 二重に反映しえた（職員の二重追加・認証アカウントの二重発行）。状態の確認から書き込みまでをロックの中で行う。
// 入会申込の作成（createMemberApplicationDirectLocked_）は承認からしか呼ばれないので、ロックはここで一度だけ取る
// （同じスクリプトロックを内側でもう一度取って解放すると、外側のロックまで外れる）。
function withChangeRequestDecisionLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { success: false, error: 'ほかの承認・却下を処理しています。少し待ってから、もう一度お試しください。' };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function approveAdminChangeRequest_(payload) {
  var requestId = String(payload.requestId || '').trim();
  if (!requestId) return { success: false, error: '申請IDが必要です' };
  var adminSession = payload.__adminSession;
  // v367: checkAdminBySession_() の戻り値は loginId (email)。`email` キーは存在しない
  if (!adminSession || !adminSession.loginId) return { success: false, error: 'unauthorized' };

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_変更申請');
  if (!sheet) return { success: false, error: 'テーブルが見つかりません' };

  var found = findRowByColumnValue_(sheet, '申請ID', requestId);
  if (!found) return { success: false, error: '申請が見つかりません' };

  var cols = found.columns;
  var row = found.row;
  var statusVal = String(row[cols['申請状態コード']] || '');
  if (statusVal !== 'PENDING') return { success: false, error: 'この申請はすでに処理済みです（' + statusVal + '）' };

  var memberId = String(row[cols['会員ID']] || '');
  var memberType = String(row[cols['会員種別コード']] || '');
  var requestType = String(row[cols['申請種別コード']] || '');
  var contactEmail = String(row[cols['連絡先メールアドレス']] || '');
  // v376.99: ログインIDが実際に変わったときだけ、変わった後に本人へ知らせる。
  // 分岐の内側で宣言すると、その分岐を通らない申請種別で未定義参照になりうるため関数先頭で持つ。
  // 事業所職員の CM 番号変更ではログインIDを書き換えていないので、ここには入らない。
  var loginIdChange = null;
  var applicantName = String(row[cols['申請者表示名']] || '');
  var changeData = {};
  try { changeData = JSON.parse(String(row[cols['申請内容JSON']] || '{}')); } catch(e) {}

  var now = new Date().toISOString();
  var approvalResult = {};
  // 受付済みデータを確定する段階の不整合だけを通知する。公開入力の検証失敗は通知しない。
  var chatAnomalies = [];

  // 職員数の上限は、何かを書き込む前に申請全体で確かめる。超える申請は承認せず差し戻してもらう
  // （2026-10-13 operator 判断）。以前は 1 人ずつ追加して超えた分だけ黙って飛ばし、申請は承認済に
  // なっていた。公開ポータルは在籍人数を見せないので、ここが上限の唯一の関門になる。
  // 追加は除籍より先に適用されるため、同じ申請の除籍分は差し引かない。
  var staffAddCount = (requestType === 'MEMBER_UPDATE' || requestType === 'STAFF_ADD')
    ? (changeData.staffAdd || []).length : 0;
  if (staffAddCount > 0) {
    // 2026-10-13 operator 判断: 追加する職員の介護支援専門員番号が既存の会員・職員と重なるときは承認で止める。
    var addCmConflicts = findCareManagerRegistrationConflicts_(buildMemberApplicationRegistrationIndex_(ss),
      (changeData.staffAdd || []).map(function(sa) { return sa && sa.careManagerNumber; }));
    if (addCmConflicts.length > 0) {
      return { success: false, error: addCmConflicts.join('\n') + '\n' + CARE_MANAGER_CONFLICT_GUIDANCE_ };
    }
    var staffLimitInfo = getBusinessStaffLimitInfo_(ss, memberId);
    if (staffLimitInfo.limit > 0 && staffLimitInfo.enrolled + staffAddCount > staffLimitInfo.limit) {
      return { success: false, error: '職員数の上限を超えるため承認できません（在籍 ' + staffLimitInfo.enrolled
        + ' 名＋追加 ' + staffAddCount + ' 名、上限 ' + staffLimitInfo.limit + ' 名）。申請を差し戻してください。' };
    }
  }

  // 2026-10-13: 代表者の除籍は、何かを書き込む前に止める。以前は適用の途中で removeStaffFromOffice_ が
  // 例外を投げ、会員情報と職員追加だけが書き込まれたまま申請が PENDING に残った（再承認で重複エラー）。
  var removeTargets = (requestType === 'MEMBER_UPDATE' || requestType === 'STAFF_REMOVE') ? (changeData.staffRemove || []) : [];
  if (removeTargets.length > 0) {
    var staffRowsForRemoveCheck = getRowsAsObjects_(ss, 'T_事業所職員');
    for (var rti = 0; rti < removeTargets.length; rti++) {
      var rtMatches = findPublicEnrolledStaffByIdentity_(staffRowsForRemoveCheck, memberId, removeTargets[rti]);
      if (rtMatches.length === 1 && String(rtMatches[0]['職員権限コード'] || '') === 'REPRESENTATIVE') {
        return { success: false, error: '除籍の対象に代表者（' + joinHumanNameParts_(rtMatches[0]['姓'], rtMatches[0]['名']).trim()
          + '）が含まれています。代表者の変更は事務局で行ってから、申請を差し戻してください。' };
      }
    }
  }

  // ── 変更内容の適用 ────────────────────────────────────────────────────────
  if (requestType === 'MEMBER_APPLICATION') {
    // 承認のロック（withChangeRequestDecisionLock_）の中で呼ばれる
    approvalResult = createMemberApplicationDirectLocked_(changeData.applicationPayload || {});
  } else if (requestType === 'MEMBER_UPDATE') {
    var updatePayload = { id: memberId };
    var allowlist = publicUpdateAllowlistFor_(memberType);
    var fields = changeData.fields || {};
    for (var i = 0; i < allowlist.length; i++) {
      var fk = allowlist[i];
      if (Object.prototype.hasOwnProperty.call(fields, fk) && fields[fk] !== '') {
        updatePayload[fk] = fields[fk];
      }
    }
    if (Object.keys(updatePayload).length > 1) {
      updateMember_(updatePayload, { skipAdminCheck: true, auditActor: adminSession.loginId });
    }

    // 介護支援専門員番号変更の場合、T_認証アカウントのログインIDも更新
    if (memberType === 'INDIVIDUAL' && fields.careManagerNumber) {
      // 個人会員のログインIDは CM 番号。衝突したら先頭に 1〜9 を付けて避ける（職員と同じ規則）。
      var cmLoginUpdate = updateAuthAccountLoginId_(ss, '会員ID', memberId, function(before, others) {
        return generateCmBasedLoginId_(String(fields.careManagerNumber || ''), others);
      });
      if (cmLoginUpdate.changed) {
        loginIdChange = { before: cmLoginUpdate.before, after: cmLoginUpdate.after };
      }
    }
    // 事業所番号変更の場合、T_認証アカウントのログインIDも更新
    if (memberType === 'BUSINESS' && fields.officeNumber) {
      // 事業所会員のログインIDは事業所番号（10 桁英数字）。CM 番号の採番規則は使えないので
      // そのまま入れる。衝突したら updateAuthAccountLoginId_ が据え置いて collision を返す。
      var bizLoginUpdate = updateAuthAccountLoginId_(ss, '会員ID', memberId, function() {
        return String(fields.officeNumber || '');
      });
      if (bizLoginUpdate.changed) {
        loginIdChange = { before: bizLoginUpdate.before, after: bizLoginUpdate.after };
      } else if (bizLoginUpdate.collision) {
        notifyMailFailureToChat_('LOGIN_ID_COLLISION', {}, new Error(
          '事業所番号 ' + bizLoginUpdate.after + ' は別のアカウントが使用中のため、ログインIDを変更しませんでした。'));
      }
    }
    // MEMBER_UPDATE に含まれるスタッフ追加/除籍も適用（事業所会員の複合申請対応）
    // 2026-10-13 operator 判断: 登録情報変更と一緒に申請された職員追加でも案内メールを送る
    // （職員追加だけの申請と同じ処理。送るかどうかは設定画面の職員追加メールの設定が決める）。
    applyApprovedStaffAdds_(ss, memberId, applicantName, changeData.staffAdd || [], approvalResult, chatAnomalies);
    var staffToRemoveMixed = changeData.staffRemove || [];
    // v376.9 perf: staffToRemoveMixed.length 回の T_事業所職員 sheet 読込を 1 回にホイスト
    var allStaffRowsForRemoval = staffToRemoveMixed.length > 0 ? getRowsAsObjects_(ss, 'T_事業所職員') : [];
    for (var kr = 0; kr < staffToRemoveMixed.length; kr++) {
      var srm = staffToRemoveMixed[kr];
      var staffRowsMixed = findPublicEnrolledStaffByIdentity_(allStaffRowsForRemoval, memberId, srm);
      if (staffRowsMixed.length === 1) {
        var sIdMixed = String(staffRowsMixed[0]['職員ID'] || '');
        if (sIdMixed) removeStaffFromOffice_({ memberId: memberId, staffId: sIdMixed });
      } else {
        // 受付時には照合できていた職員が、承認までに変わった（改姓・除籍済み等）。黙って飛ばさない。
        chatAnomalies.push('除籍する職員を特定できなかったため、除籍しませんでした。管理画面で確認してください。');
      }
    }

    // v372.5: 既存職員情報の更新（staffUpdate）
    var staffUpdates = changeData.staffUpdate || [];
    if (staffUpdates.length > 0) {
      var staffSheetU = ss.getSheetByName('T_事業所職員');
      var allStaffRowsU = getRowsAsObjects_(ss, 'T_事業所職員');
      var staffEmailNotifications = []; // [{staffId, oldEmail, newEmail, staffName}]
      var staffLoginIdNotifications = []; // [{staffName, before, after, staffEmail}]
      var appliedStaffUpdates = 0; // docs/307 E6: 実際に反映した人数だけを数える
      for (var su = 0; su < staffUpdates.length; su++) {
        var upd = staffUpdates[su];
        // 対象職員の所属確認（セキュリティ: 申請の memberId と職員の所属 memberId が一致）
        var target = allStaffRowsU.filter(function(r) {
          return !toBoolean_(r['削除フラグ']) &&
                 String(r['職員ID'] || '') === String(upd.staffId) &&
                 String(r['会員ID'] || '') === memberId &&
                 String(r['職員状態コード'] || '') === 'ENROLLED';
        })[0];
        if (!target) {
          Logger.log('staffUpdate skipped (not found / not belonging): ' + upd.staffId);
          chatAnomalies.push('対象職員を確認できないため、職員情報の一部を適用しませんでした。');
          continue;
        }
        // 10 桁等の admin 緩和 CM 番号は公開ポータルからは更新不可（safeguard）
        var currentCm = String(target['介護支援専門員番号'] || '');
        if (Object.prototype.hasOwnProperty.call(upd, 'careManagerNumber') && currentCm && !/^\d{8}$/.test(currentCm)) {
          Logger.log('staffUpdate CM number protected (admin-relaxed): ' + upd.staffId);
          delete upd.careManagerNumber;
          chatAnomalies.push('保護対象の資格番号が含まれていたため、その項目を適用しませんでした。');
        }
        var oldEmail = String(target['メールアドレス'] || '');
        // updateStaff_ 経由で適用（権限境界 skipAdminCheck はないので、adminSession 渡しでバイパス）
        try {
          var staffPayload = { staffId: String(upd.staffId), memberId: memberId, __adminSession: adminSession };
          if (Object.prototype.hasOwnProperty.call(upd, 'lastName')) staffPayload.lastName = upd.lastName;
          if (Object.prototype.hasOwnProperty.call(upd, 'firstName')) staffPayload.firstName = upd.firstName;
          if (Object.prototype.hasOwnProperty.call(upd, 'lastKana')) staffPayload.lastKana = upd.lastKana;
          if (Object.prototype.hasOwnProperty.call(upd, 'firstKana')) staffPayload.firstKana = upd.firstKana;
          if (Object.prototype.hasOwnProperty.call(upd, 'email')) staffPayload.email = upd.email;
          if (Object.prototype.hasOwnProperty.call(upd, 'careManagerNumber')) staffPayload.careManagerNumber = upd.careManagerNumber;
          updateStaff_(staffPayload);
          appliedStaffUpdates++;
          // v376.100: 介護支援専門員番号が変わったらログインIDも追従させる。
          // 変えた本人がログインできる状態を保つため、updateStaff_ の直後に行う。
          if (Object.prototype.hasOwnProperty.call(upd, 'careManagerNumber')
              && String(upd.careManagerNumber || '').trim()
              && String(upd.careManagerNumber).trim() !== currentCm) {
            try {
              var sync = syncStaffLoginIdToCmNumber_(ss, String(upd.staffId), String(upd.careManagerNumber).trim());
              if (sync.changed) {
                staffLoginIdNotifications.push({
                  staffName: String(target['氏名'] || '').trim() || (String(target['姓'] || '') + ' ' + String(target['名'] || '')).trim(),
                  before: sync.before,
                  after: sync.after,
                  // メール変更も同時に申請されていれば新アドレスへ送る
                  staffEmail: (Object.prototype.hasOwnProperty.call(upd, 'email') && upd.email) ? String(upd.email) : oldEmail,
                });
              }
            } catch (eSync) {
              Logger.log('syncStaffLoginId failed for staffId=' + upd.staffId + ': ' + eSync.message);
              chatAnomalies.push('職員のログインIDを更新できませんでした。管理画面で確認してください。');
            }
          }
          // メール変更があれば旧・新両方に通知メール（H 採用）
          if (Object.prototype.hasOwnProperty.call(upd, 'email') && upd.email && upd.email !== oldEmail) {
            staffEmailNotifications.push({
              staffId: upd.staffId,
              oldEmail: oldEmail,
              newEmail: upd.email,
              staffName: String(target['氏名'] || '').trim() || (String(target['姓'] || '') + ' ' + String(target['名'] || '')).trim(),
            });
          }
        } catch (eUpd) {
          Logger.log('staffUpdate apply failed for staffId=' + upd.staffId + ': ' + eUpd.message);
          chatAnomalies.push('職員情報の一部を適用できませんでした。管理画面で申請内容を確認してください。');
        }
      }
      // v376.100: ログインIDが変わった職員へ、設定の文面で知らせる。
      // 宛先は本人と代表者（＝申請者）の両方。本人は実際にログインする側、
      // 代表者は申請した側として結果を知る必要がある。
      staffLoginIdNotifications.forEach(function(n) {
        var targets = [];
        if (n.staffEmail) targets.push(n.staffEmail);
        if (contactEmail && contactEmail !== n.staffEmail) targets.push(contactEmail);
        targets.forEach(function(to) {
          try {
            var m = renderConfiguredMail_(ss, 'LOGIN_ID_CHANGED_SUBJECT', 'LOGIN_ID_CHANGED_BODY',
              LOGIN_ID_CHANGED_DEFAULT_SUBJECT, LOGIN_ID_CHANGED_DEFAULT_BODY, {
                '氏名': n.staffName,
                '旧ログインID': n.before,
                '新ログインID': n.after,
              });
            deliverMail_('LOGIN_ID_CHANGED', to, m.subject, m.body);
          } catch (eLidStaff) {
            Logger.log('staff loginIdChanged mail failed: ' + eLidStaff.message);
          }
        });
      });
      approvalResult.staffLoginIdChanges = staffLoginIdNotifications.length;
      // 以前は対象が見つからなかった分・反映に失敗した分も含めて申請の件数を返していた。
      approvalResult.staffUpdateCount = appliedStaffUpdates;
      approvalResult.staffUpdateSkipped = staffUpdates.length - appliedStaffUpdates;
      approvalResult.staffEmailNotifications = staffEmailNotifications.length;
      // 通知メール送信（メール変更時のみ・旧アドレス + 新アドレス両方）。
      // v376.99: 以前はここに件名・本文を直書きしていたため管理画面から直せなかった。
      // 他のメールと同じく設定の文面を描画して送る。
      staffEmailNotifications.forEach(function(n) {
        [{ to: n.oldEmail, kind: '旧アドレス' }, { to: n.newEmail, kind: '新アドレス' }].forEach(function(t) {
          if (!t.to) return;
          try {
            var mail = renderConfiguredMail_(ss, 'CONTACT_EMAIL_CHANGED_SUBJECT', 'CONTACT_EMAIL_CHANGED_BODY',
              CONTACT_EMAIL_CHANGED_DEFAULT_SUBJECT, CONTACT_EMAIL_CHANGED_DEFAULT_BODY, {
                '氏名': n.staffName,
                '旧メールアドレス': n.oldEmail,
                '新メールアドレス': n.newEmail,
                '宛先区分': t.kind,
              });
            deliverMail_('CONTACT_EMAIL_CHANGED', t.to, mail.subject, mail.body);
          } catch (eNotify) {
            Logger.log('staffUpdate notify failed (' + t.kind + '): ' + eNotify.message);
          }
        });
      });
    }

  } else if (requestType === 'WITHDRAWAL') {
    var withdrawalMethod = String(changeData.withdrawalMethod || 'FISCAL_YEAR_END');
    if (withdrawalMethod === 'IMMEDIATE') {
      var immediateWithdrawalDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
      updateMember_({
        id: memberId,
        status: 'WITHDRAWN',
        withdrawnDate: immediateWithdrawalDate,
        withdrawalProcessDate: immediateWithdrawalDate,
        midYearWithdrawal: true,
      }, { skipAdminCheck: true, ss: ss, auditActor: adminSession.loginId });
      disableAuthAccountsByMemberId_(ss, memberId);
      approvalResult = { withdrawalMethod: withdrawalMethod, withdrawnDate: immediateWithdrawalDate };
    } else {
      var today = new Date();
      var month = today.getMonth() + 1;
      var year = today.getFullYear();
      var withdrawnYear = (month >= 4) ? year + 1 : year;
      var withdrawnDate = withdrawnYear + '-03-31';
      updateMember_({ id: memberId, status: 'WITHDRAWAL_SCHEDULED', withdrawnDate: withdrawnDate }, { skipAdminCheck: true, ss: ss, auditActor: adminSession.loginId });
      approvalResult = { withdrawalMethod: 'FISCAL_YEAR_END', withdrawnDate: withdrawnDate };
    }

  } else if (requestType === 'STAFF_ADD') {
    applyApprovedStaffAdds_(ss, memberId, applicantName, changeData.staffAdd || [], approvalResult, chatAnomalies);

  } else if (requestType === 'STAFF_REMOVE') {
    var staffToRemove = changeData.staffRemove || [];
    for (var k = 0; k < staffToRemove.length; k++) {
      var sr = staffToRemove[k];
      var staffRows = findPublicEnrolledStaffByIdentity_(getRowsAsObjects_(ss, 'T_事業所職員'), memberId, sr);
      if (staffRows.length === 1) {
        var sId = String(staffRows[0]['職員ID'] || '');
        if (sId) removeStaffFromOffice_({ memberId: memberId, staffId: sId });
      } else {
        chatAnomalies.push('除籍する職員を特定できなかったため、除籍しませんでした。管理画面で確認してください。');
      }
    }
  }

  // ステータス更新
  row[cols['申請状態コード']] = 'APPROVED';
  row[cols['処理日時']] = now;
  row[cols['処理者メールアドレス']] = adminSession.loginId; // v367: email→loginId
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  clearAllDataCache_();
  clearAdminDashboardCache_();

  // v376.99: 退会の確認メール。設定キーはあるのに送信箇所が無く、管理画面で文面を
  // 編集しても届かない状態だった（空回りのカード）。退会予定日は承認時にしか
  // 確定しないため、受付時ではなくここで送る。
  if (requestType === 'WITHDRAWAL' && contactEmail) {
    try {
      var wdMail = renderConfiguredMail_(ss, 'WITHDRAWAL_CONFIRM_SUBJECT', 'WITHDRAWAL_CONFIRM_BODY',
        WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT, WITHDRAWAL_CONFIRM_DEFAULT_BODY, {
          '会員名': applicantName,
          '退会予定日': String((approvalResult && approvalResult.withdrawnDate) || ''),
          '退会方式': (approvalResult && approvalResult.withdrawalMethod) === 'IMMEDIATE' ? '即時退会' : '年度末退会',
        });
      deliverMail_('WITHDRAWAL_CONFIRM', contactEmail, wdMail.subject, wdMail.body);
    } catch (eWd) {
      Logger.log('withdrawalConfirm mail failed: ' + eWd.message);
    }
  }

  // v376.99: 会員情報変更の確認メール。設定キーはあるのに送信箇所が無く、
  // 管理画面で文面を編集しても届かない状態だった（空回りのカード）。承認時に送る。
  // 2026-10-13: 一部を反映できなかったときは、本人へ「反映しました」と送らない（管理者が確かめてから連絡する）。
  var memberMailHeld = chatAnomalies.length > 0;
  if (requestType === 'MEMBER_UPDATE' && contactEmail && !memberMailHeld) {
    try {
      var updMail = renderConfiguredMail_(ss, 'MEMBER_UPDATE_CONFIRM_SUBJECT', 'MEMBER_UPDATE_CONFIRM_BODY',
        MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT, MEMBER_UPDATE_CONFIRM_DEFAULT_BODY, {
          '氏名': applicantName,
        });
      deliverMail_('MEMBER_UPDATE_CONFIRM', contactEmail, updMail.subject, updMail.body);
    } catch (eUpdMail) {
      Logger.log('memberUpdateConfirm mail failed: ' + eUpdMail.message);
    }
  }

  // v376.99: ログインIDが実際に変わったときだけ知らせる。
  if (loginIdChange && loginIdChange.after && loginIdChange.after !== loginIdChange.before && contactEmail) {
    try {
      var lidMail = renderConfiguredMail_(ss, 'LOGIN_ID_CHANGED_SUBJECT', 'LOGIN_ID_CHANGED_BODY',
        LOGIN_ID_CHANGED_DEFAULT_SUBJECT, LOGIN_ID_CHANGED_DEFAULT_BODY, {
          '氏名': applicantName,
          '旧ログインID': loginIdChange.before,
          '新ログインID': loginIdChange.after,
        });
      deliverMail_('LOGIN_ID_CHANGED', contactEmail, lidMail.subject, lidMail.body);
    } catch (eLid) {
      Logger.log('loginIdChanged mail failed: ' + eLid.message);
    }
  }

  // v368: 申請者への承認通知メール（テンプレ化・変更内容サマリー差込）
  if (!memberMailHeld) sendApprovalNotificationMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: requestType,
    memberTypeLabel: memberTypeLabel_(memberType),
    processorName: adminSession.displayName || adminSession.loginId || '事務局',
    changeSummary: buildChangeSummaryText_(changeData, requestType),
  });
  var finalMemberId = requestType === 'MEMBER_APPLICATION'
    ? String((approvalResult && approvalResult.memberId) || '')
    : memberId;
  notifyMembershipChatForMember_(ss, 'FINAL', finalMemberId, {
    memberName: applicantName,
    memberType: memberType,
    '手続種別': chatMembershipRequestTypeLabel_(requestType, changeData.withdrawalMethod),
    '申請ID': requestId,
    '日時': now,
    '変更内容': buildChangeSummaryText_(changeData, requestType),
    '異常内容': '',
  });
  if (chatAnomalies.length > 0) {
    notifyMembershipChatForMember_(ss, 'ANOMALY', finalMemberId, {
      memberName: applicantName,
      memberType: memberType,
      '手続種別': chatMembershipRequestTypeLabel_(requestType, changeData.withdrawalMethod),
      '申請ID': requestId,
      '日時': now,
      '変更内容': '',
      '異常内容': chatAnomalies.join('\n'),
    });
  }

  // 2026-10-13: 反映できなかった内容を承認した管理者の画面へ返す。以前は Chat にしか出ず、
  // 画面は常に「承認処理が完了しました」と表示していた。
  return { success: true, requestId: requestId, result: approvalResult, warnings: chatAnomalies, memberMailHeld: memberMailHeld };
}

// ── 管理者: 変更申請を却下 ──────────────────────────────────────────────────
function rejectAdminChangeRequest_(payload) {
  var requestId = String(payload.requestId || '').trim();
  if (!requestId) return { success: false, error: '申請IDが必要です' };
  var adminSession = payload.__adminSession;
  // v367: checkAdminBySession_() の戻り値は loginId (email)。`email` キーは存在しない
  if (!adminSession || !adminSession.loginId) return { success: false, error: 'unauthorized' };

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_変更申請');
  if (!sheet) return { success: false, error: 'テーブルが見つかりません' };

  var found = findRowByColumnValue_(sheet, '申請ID', requestId);
  if (!found) return { success: false, error: '申請が見つかりません' };

  var cols = found.columns;
  var row = found.row;
  if (String(row[cols['申請状態コード']] || '') !== 'PENDING') {
    return { success: false, error: 'この申請はすでに処理済みです' };
  }

  var now = new Date().toISOString();
  var contactEmail = String(row[cols['連絡先メールアドレス']] || '');
  var applicantName = String(row[cols['申請者表示名']] || '');
  var requestType = String(row[cols['申請種別コード']] || '');

  row[cols['申請状態コード']] = 'REJECTED';
  row[cols['処理日時']] = now;
  row[cols['処理者メールアドレス']] = adminSession.loginId; // v367: email→loginId
  row[cols['処理備考']] = String(payload.note || '');
  row[cols['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // v368: 申請者への却下通知メール（テンプレ化・備考差込）
  sendRejectionNotificationMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: requestType,
    processorName: adminSession.displayName || adminSession.loginId || '事務局',
    note: String(payload.note || ''),
  });

  return { success: true, requestId: requestId };
}

// 管理者が承認した変更申請からのみ職員を追加する。
// 承認した職員追加を適用し、追加できた職員だけに案内メールを送る（変更申請の承認から呼ぶ）。
// 2026-10-13: 職員追加だけの申請（STAFF_ADD）と、登録情報変更に含まれる職員追加で処理が分かれており、
// 後者は案内メールを送っていなかった。失敗した職員にも「追加しました」と送っていた。
// - 追加に失敗した職員・ログイン用アカウントを作れなかった職員は chatAnomalies に積み、メールを送らない
// - 案内のログインIDは、実際に作られたもの（衝突回避で先頭に数字が付くことがある）を使う
function applyApprovedStaffAdds_(ss, memberId, applicantName, staffToAdd, approvalResult, chatAnomalies) {
  var added = []; // { staff, loginId }
  for (var j = 0; j < staffToAdd.length; j++) {
    var addResult = addApprovedStaffMember_(memberId, staffToAdd[j]);
    if (!approvalResult.staffAddResults) approvalResult.staffAddResults = [];
    approvalResult.staffAddResults.push(addResult);
    var addName = (String(staffToAdd[j].lastName || '') + ' ' + String(staffToAdd[j].firstName || '')).trim();
    if (!addResult || addResult.success === false) {
      chatAnomalies.push('職員「' + addName + '」を追加できませんでした（' + ((addResult && addResult.error) || '理由不明') + '）。管理画面で確認してください。');
      continue;
    }
    if (addResult.authAccountCreated === false) {
      chatAnomalies.push('職員「' + addName + '」は追加しましたが、ログイン用アカウントを作れませんでした（' + (addResult.authError || '理由不明') + '）。案内メールは送っていません。管理画面で認証アカウントを発行してください。');
      continue;
    }
    added.push({ staff: staffToAdd[j], loginId: String(addResult.loginId || '') });
  }
  if (added.length === 0) return;

  // v265: 職員追加承認時メール（全体フラグ最優先）
  var staffAddCredEnabledRaw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
  var staffAddCredEnabled = (staffAddCredEnabledRaw === '' || staffAddCredEnabledRaw === null)
    ? true : String(staffAddCredEnabledRaw) !== 'false';
  if (!staffAddCredEnabled) return;
  var bizMailSettings = getBizEmailSettings_(ss);
  var memberRowForEmail = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  })[0] || {};
  var officeNameForEmail = String(memberRowForEmail['勤務先名'] || applicantName || '');
  var repStaffRow = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === memberId &&
           String(r['職員状態コード'] || '') === 'ENROLLED' &&
           // 2026-10-08: 列名が誤っていた。T_事業所職員 に「権限コード」は無く
           // 「職員権限コード」が正しい。この絞り込みは常に空を返しており、
           // 代表者への職員追加通知が一度も届いていなかった（docs/300）。
           String(r['職員権限コード'] || '') === 'REPRESENTATIVE';
  })[0] || null;
  var repEmail = repStaffRow ? String(repStaffRow['メールアドレス'] || '') : '';
  var repName = repStaffRow ? (String(repStaffRow['姓'] || '') + ' ' + String(repStaffRow['名'] || '')).trim() : '';
  var fromAddrForStaffAdd = String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim();
  var addedNames = [];

  for (var ja = 0; ja < added.length; ja++) {
    var sa = added[ja].staff;
    var saName = (String(sa.lastName || '') + ' ' + String(sa.firstName || '')).trim();
    var saEmail = String(sa.email || '').trim();
    var saLoginId = added[ja].loginId || String(sa.careManagerNumber || '').trim();
    var saPassword = '事務局から別途通知';
    addedNames.push(saName);
    // 追加された職員へのメール
    if (bizMailSettings.staffAddStaffEmailEnabled && saEmail) {
      try {
        var staffAddVars = { 氏名: saName, ログインID: saLoginId, パスワード: saPassword, 会員マイページURL: MEMBER_PORTAL_URL, 事業所名: officeNameForEmail };
        var staffAddBody = renderMergeTags_(bizMailSettings.staffAddStaffEmailBody, staffAddVars);
        deliverMail_('STAFF_ADD_STAFF_EMAIL', saEmail, bizMailSettings.staffAddStaffEmailSubject, staffAddBody, { from: fromAddrForStaffAdd });
      } catch (e) {
        Logger.log('staffAdd staff email failed for ' + saEmail + ': ' + e.message);
        chatAnomalies.push('職員「' + saName + '」への案内メールを送れませんでした。');
      }
    }
  }

  // 代表者への追加通知メール
  if (bizMailSettings.staffAddRepEmailEnabled && repEmail) {
    try {
      var repNotifyVars = { 氏名: repName, 会員マイページURL: MEMBER_PORTAL_URL, 事業所名: officeNameForEmail, 追加職員氏名: addedNames.join('、') };
      var repNotifyBody = renderMergeTags_(bizMailSettings.staffAddRepEmailBody, repNotifyVars);
      deliverMail_('STAFF_ADD_REP_EMAIL', repEmail, bizMailSettings.staffAddRepEmailSubject, repNotifyBody, { from: fromAddrForStaffAdd });
    } catch (e) {
      Logger.log('staffAdd rep notify email failed for ' + repEmail + ': ' + e.message);
      chatAnomalies.push('代表者への職員追加の通知メールを送れませんでした。');
    }
  }
}

// 事業所会員の職員数上限と在籍人数。上限 0 は「上限なし」（会員行が無い場合も 0）。
// 2026-10-08: 事業所ごとの個別上限が未設定なら全体既定を使う（RD §136 / §205）。
// 以前は個別上限が空だと 0 として扱われ、**上限が一切効かなかった**。
function getBusinessStaffLimitInfo_(ss, memberId) {
  memberId = String(memberId || '');
  var memberSheet = ss.getSheetByName('T_会員');
  var memberFound = memberSheet ? findRowByColumnValue_(memberSheet, '会員ID', memberId) : null;
  if (!memberFound) return { limit: 0, enrolled: 0 };
  var limitVal = memberFound.row[memberFound.columns['職員数上限']];
  var staffLimit = limitVal ? Number(limitVal) : 0;
  if (!staffLimit) {
    var defaultLimit = Number(getSystemSettingValue_(ss, 'DEFAULT_BUSINESS_STAFF_LIMIT') || 0);
    if (isFinite(defaultLimit) && defaultLimit > 0) staffLimit = Math.floor(defaultLimit);
  }
  if (!(staffLimit > 0)) return { limit: 0, enrolled: 0 };
  var enrolled = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId && String(r['職員状態コード'] || '') === 'ENROLLED';
  }).length;
  return { limit: staffLimit, enrolled: enrolled };
}

function addApprovedStaffMember_(memberId, s) {
    var ss = getOrCreateDatabase_();
    memberId = String(memberId || '');
    s = s || {};
    var lastName = String(s.lastName || '').trim();
    var firstName = String(s.firstName || '').trim();
    if (!lastName || !firstName) return { success: false, error: '姓と名は必須です' };
    // 2026-10-08: BR-16「入力を始めた行は 氏/名/セイ/メイ/メール/介護支援専門員番号 を必須」を
    // サーバ側でも効かせる。公開ポータルのフォームは 6 項目そろった行だけを送るが、
    // 画面を経由しない経路では空のまま職員行が作れていた（docs/300）。
    if (!String(s.lastKana || '').trim() || !String(s.firstKana || '').trim()) {
      return { success: false, error: 'セイとメイは必須です' };
    }
    if (!String(s.email || '').trim()) {
      return { success: false, error: '職員のメールアドレスは必須です' };
    }
    if (!String(s.careManagerNumber || '').trim()) {
      return { success: false, error: '職員の介護支援専門員番号は必須です（ログインIDになります）' };
    }
    var limitInfo = getBusinessStaffLimitInfo_(ss, memberId);
    if (limitInfo.limit > 0 && limitInfo.enrolled >= limitInfo.limit) {
      return { success: false, error: '職員数上限に達しています' };
    }
    var careNum = normalizeCmNumberForKey_(s.careManagerNumber);
    var now = new Date().toISOString();
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var requestedRole = normalizeBusinessStaffRole_(s.role || 'STAFF');
    if (careNum) {
      var registrationIndex = buildMemberApplicationRegistrationIndex_(ss);
      // 2026-10-13: 番号が既存の会員・職員と重なるときは自動で移さない（承認で止める）。
      // 承認の前検査（approveAdminChangeRequest_）で止まるので、ここは防御。
      var addConflicts = findCareManagerRegistrationConflicts_(registrationIndex, [careNum]);
      if (addConflicts.length > 0) {
        return { success: false, error: addConflicts.join(' ') + ' ' + CARE_MANAGER_CONFLICT_GUIDANCE_ };
      }
    }
    var newStaffId = 'S' + Date.now();
    appendRowsByHeaders_(ss, 'T_事業所職員', [{
      職員ID: newStaffId,
      会員ID: memberId,
      姓: lastName,
      名: firstName,
      セイ: String(s.lastKana || '').trim(),
      メイ: String(s.firstKana || '').trim(),
      氏名: [lastName, firstName].join(' ').trim(),
      フリガナ: [String(s.lastKana || '').trim(), String(s.firstKana || '').trim()].join(' ').trim(),
      メールアドレス: String(s.email || '').trim(),
      職員権限コード: requestedRole,
      職員状態コード: 'ENROLLED',
      入会日: today,
      退会日: '',
      介護支援専門員番号: careNum,
      メール配信希望コード: 'YES',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    }]);
    // 2026-10-08: 認証アカウントを同時に作る（RD §224「職員追加 → 職員レコードと認証アカウントを作成する」）。
    // 以前は職員行を足すだけで、アカウントは管理者が adminIssueMemberCredential_ を
    // 手で実行するまで存在しなかった。通知を送るかどうかは従来どおり
    // STAFF_ADD_STAFF_EMAIL_ENABLED 設定が決める（ここでは送信しない）。
    var createdLoginId = '';
    try {
      createdLoginId = ensureStaffAuthAccount_(ss, memberId, newStaffId, careNum);
    } catch (authErr) {
      // 職員行は既に作成済み。アカウント作成だけ失敗したことを呼び出し元へ伝える。
      Logger.log('staff auth account creation failed for ' + newStaffId + ': ' + authErr.message);
      clearAllDataCache_();
      return { success: true, staffId: newStaffId, authAccountCreated: false, authError: authErr.message };
    }
    clearAllDataCache_();
    return { success: true, staffId: newStaffId, authAccountCreated: true, loginId: createdLoginId };
}

/**
 * 職員の認証アカウントを作る。ログインIDは介護支援専門員番号から採番する（BR-15）。
 * 既に同じ職員IDのアカウントがあれば何もしない（再承認や再実行で重複させない）。
 * 初期パスワードは乱数。**通知はここでは送らない**——送るかどうかは設定が決める。
 */
function ensureStaffAuthAccount_(ss, memberId, staffId, careManagerNumber) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('T_認証アカウント シートが見つかりません。');

  var existing = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['職員ID'] || '') === String(staffId);
  })[0];
  if (existing) return String(existing['ログインID'] || '');

  var existingLoginIds = collectExistingLoginIds_(ss);
  var loginId = generateCmBasedLoginId_(String(careManagerNumber || ''), existingLoginIds);
  var password = generateRandomPassword_();
  var salt = generateSalt_();
  var hashed = hashPasswordCurrent_(password, salt);
  var now = new Date().toISOString();

  var authRow = テーブル定義.T_認証アカウント.map(function(col) {
    switch (col) {
      case '認証ID': return Utilities.getUuid();
      case '認証方式': return 'PASSWORD';
      case 'ログインID': return loginId;
      case 'パスワードハッシュ': return hashed;
      case 'パスワードソルト': return salt;
      case 'システムロールコード': return 'MEMBER';
      case '会員ID': return String(memberId);
      case '職員ID': return String(staffId);
      case 'パスワード更新日時': return now;
      case 'アカウント有効フラグ': return true;
      case 'ログイン失敗回数': return 0;
      case 'ロック状態': return false;
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      default: return '';
    }
  });
  authSheet.appendRow(authRow);
  return loginId;
}
