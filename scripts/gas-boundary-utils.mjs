// admin build が残す top-level callable 関数（doGet / processApiRequest +
// operator が Apps Script editor / clasp run から実行する backfill・診断・dryRun ツール）。
// このリストは pruning の seed（保持する根）かつ build / audit の許可 whitelist の
// 唯一の正本。以前は build-admin-gas.mjs の seed・assertAllowed・audit-admin-boundary.mjs の
// 3 箇所に同一配列が手書きされていたため、追加漏れで build / audit がズレる温床だった（単一情報源化）。
// v376.55: 完了済み一回性ツール 12 関数（v360/v370/v372/v246/v376.30-31 の migration・hotfix 診断）を
// gas-src ごと削除し棚卸し。継続利用ツールは build 時に gas/admin/dryrun.gs へ分離される
// （ADMIN_OPERATOR_TOOL_FUNCTIONS 参照）。
export const ADMIN_TOP_LEVEL_FUNCTIONS = [
  'doGet',
  'processApiRequest',
  // v349/v350: サムネイル backfill（clasp run 専用）/ time-based trigger / 1 回登録
  'regenerateAllThumbnails',
  'processPendingThumbnails',
  'setupPendingThumbnailsTrigger',
  // 2026-05-17: dryRun synthetic transaction test runner（clasp run 専用）
  'dryRunApplicationScenarios',
  'previewDryRunApplicationCleanup',
  'executeDryRunApplicationCleanup',
  // v373.5: Secret Manager 連携ヘルスチェック（operator 実行用）
  'healthCheckPasswordPepper',
  // v376.1〜.4: フリガナ backfill + テストデータ棚卸し（kana form 前検証が入るまで再利用）
  'backfillKanaToFullwidth',
  'backfillKanaToFullwidth_APPLY',
  'inspectDryRunManifest_LOG',
  'deleteTestDataPreview_LOG',
  'deleteTestData_APPLY',
  // v376.14: 研修管理 全機能ドライランテスト（operator 実行用）
  'dryRunTrainingManagement',
  'cleanupDryRunTrainingManagement',
  // v376.30: スキーマ初期化フラグの救済ツール（汎用・再利用）
  'forceMarkSchemaInitializedToCurrent',
  // v376.43 (Phase B): 全メールテンプレート差し込み描画の dryRun E2E（operator 実行用・非送信）
  'dryRunMailTemplatesV376_43_LOG',
  // v376.59: 入会申込の代表者宛先固定とワークフローメール OFF ガード（operator 実行用・非送信）
  'dryRunApplicationReceiptRoutingV376_59_LOG',
  // v376.60: メール設定・テンプレート・自動送信元の実DB監査（operator 実行用・非送信）
  'dryRunMailSettingsV376_60_LOG',
  // v376.61: 研修 endTime の実DB往復 dryRun（operator 実行用・非送信・検証行は物理削除）
  'dryRunTrainingEndTimeV376_61_LOG',
  // v376.64: 会費設定（会員種別ごとの年会費）の実DB往復 dryRun（operator 実行用・非送信・原状復帰）
  'dryRunMembershipFeeV376_64_LOG',
  // v376.44: 公式LINE投稿依頼 保存フロー dryRun E2E（operator 実行用）
  'dryRunLinePostV376_44_LOG',
  // v376.45: LINE投稿 権限二層+可視範囲+submitRequest dryRun E2E（operator 実行用）
  'dryRunLinePostV376_45_LOG',
  // v376.52: 会員系削除 cascade アーカイブ（docs/249）— 診断/バッチ一覧/復元/dryRun E2E/掃除
  'diagnoseMemberDeleteDebt_LOG',
  'listArchiveBatches_LOG',
  'restoreLastArchiveBatch_APPLY',
  'dryRunDeleteCascadeV376_52_LOG',
  'cleanupDryRunDeleteCascade',
  // v376.54 (GCP Phase B / docs/250 §10-6): GAS→Cloud Run 接続の事前診断（operator 実行用・token/pepper 値は出力しない）
  'dryRunGcpPhaseB_LOG',
];

// v376.55: operator ツール（editor ▶ 実行用）。build-admin-gas.mjs が Code.gs から抽出して
// gas/admin/dryrun.gs に分離する（editor で見つけやすくするため）。doGet / processApiRequest 以外の全て。
export const ADMIN_OPERATOR_TOOL_FUNCTIONS = ADMIN_TOP_LEVEL_FUNCTIONS.filter(
  (name) => name !== 'doGet' && name !== 'processApiRequest',
);

// admin build から強制削除する（pruning で残ってはならない）危険な top-level 関数。
// 以前は build-admin-gas.mjs と audit-admin-boundary.mjs に同一配列が二重管理されていた。
export const ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS = [
  'rebuildDatabaseSchema',
  'cleanupDatabaseSheets',
  'buildDefinedScopeOnly',
  'getDbInfo',
  'seedDemoData',
  'addDeleteLogSheet',
];

// v376.23: 各境界の processApiRequest action 許可リストの単一情報源。
// 以前は build-{admin,member,gas}.mjs の removeDisallowedActionHandlers 引数と
// audit-{admin,member,public}-boundary.mjs の expected リストに同一集合が手書き分散し、
// 追加漏れ・撤去漏れでズレる温床だった（build-admin には撤去済 action の stale entry も残存していた）。
// ここを正本とし、build と audit の双方が import する。新 action 追加/削除はこの 1 箇所のみ更新する。
export const PUBLIC_ALLOWED_ACTIONS_LIST = [
  'submitMemberApplication',
  'getPublicTrainings',
  'getFileThumbnail',
  'getPublicPortalSettings',
  'applyTrainingExternal',
  'cancelTrainingExternal',
  'sendPublicOtp',
  'verifyPublicOtp',
  'lookupMemberForPublicUpdate',
  'submitPublicMemberUpdate',
  'submitPublicBusinessUpdate',
  'addPublicStaffMember',
  'removePublicStaffByCmNumber',
  'submitPublicWithdrawalRequest',
  'verifyMemberIdentityForPublic',
  'submitPublicChangeRequest',
  'getPublicAvailableStaffSlots',
  'getPublicEnrolledStaffList',
];

export const MEMBER_ALLOWED_ACTIONS_LIST = [
  'memberLogin',
  'requestPasswordReset',
  'completePasswordReset',
  'getMemberPortalData',
  'updateMemberSelf',
  'changePassword',
  'applyTraining',
  'cancelTraining',
  'withdrawSelf',
  'cancelWithdrawalSelf',
  // v295: 役員自己サービス（役員のみ — サーバー側で isActiveOfficer_ を追加検証）
  'getMyOfficerStatus',
  'saveMyBankAccount',
  // v296: 請求（役員のみ）
  'getMyClaims',
  'submitClaim',
  'deleteMyClaim',
  'uploadClaimAttachment',
  'removeClaimAttachment',
  // v331: 請求フォームの選択肢（読み取り専用、会員公開でも安全）
  'getOfficerMasterData',
  // v344: 案内PDFサムネイル Drive proxy
  'getFileThumbnail',
];

// 管理者ログイン専用アクション（Session.getActiveUser() で自己完結認証・事前 session 検証不要）
export const ADMIN_LOGIN_ACTIONS_LIST = [
  'checkAdminBySession',
];

export const ADMIN_ALLOWED_ACTIONS_LIST = [
  'getDbInfo',
  'getSystemSettings',
  'updateSystemSettings',
  'getAdminPermissionData',
  'saveAdminPermission',
  'deleteAdminPermission',
  // docs/246 Phase 2-A: ロール CRUD
  'listRoles',
  'saveRole',
  'deleteRole',
  'duplicateRole',
  'getAdminDashboardData',
  'getAdminInitData',
  'updateMember',
  // v376.55/56: 会員認証アカウント一覧（read）+ パスワードリセット + 新規発行
  'getMemberAuthAccounts',
  'adminResetMemberPassword',
  'adminIssueMemberCredential',
  'withdrawMember',
  'scheduleWithdrawMember',
  'cancelScheduledWithdraw',
  'removeStaffFromOffice',
  'updateStaff',
  'getAdminPersonList',
  'updatePersonsBatch',
  'convertMemberType',
  'getAnnualFeeAdminData',
  'saveAnnualFeeRecord',
  'saveAnnualFeeRecordsBatch',
  'saveTraining',
  // v376.7: 研修 soft delete / restore
  'softDeleteTraining',
  'restoreTraining',
  'uploadTrainingFile',
  'setupTrainingFileFolder',
  'getTrainingManagementData',
  'getTrainingApplicants',
  'sendTrainingReminder',
  'getAdminEmailAliases',
  'sendTrainingMail',
  'generateTrainingEmail',
  'getMembersForBulkMail',
  'sendBulkMemberMail',
  'getEmailSendLog',
  'getCredentialEmailTemplates',
  'saveCredentialEmailTemplate',
  'deleteCredentialEmailTemplate',
  'listMailTemplates',
  'saveMailTemplate',
  'deleteMailTemplate',
  'getBulkMailTemplates',
  'saveBulkMailTemplate',
  'deleteBulkMailTemplate',
  'searchMembersForDelete',
  'previewDeleteMember',
  'executeDeleteMember',
  'getDeleteLogs',
  'repairDuplicateStaffRecords',
  'repairTrainingApplicationApplicantIds',
  'repairMemberCareManagerDuplicates',
  'fetchAllData',
  'getMailingListTargets',
  'generateMailingListExcel',
  'getAdminChangeRequests',
  'approveAdminChangeRequest',
  'rejectAdminChangeRequest',
  // v296: 請求管理
  'getClaims',
  'approveClaim',
  'rejectClaim',
  'adminDeleteClaim',
  // v295: 役員管理マスタ
  'getOfficerMasterData',
  'saveOrganization',
  'deleteOrganization',
  'saveOfficerRole',
  'deleteOfficerRole',
  'savePaymentType',
  'deletePaymentType',
  'saveWorkCategory',
  'deleteWorkCategory',
  'backupMigrationTargets',
  // v295: 役員割当て管理
  'getOfficerManagementData',
  'assignOfficer',
  'resignOfficer',
  'updateOfficerLinkage',
  'updateOfficerRecord',
  // v295: 振込口座管理
  'getAdminBankAccount',
  'saveAdminBankAccount',
  'deleteAdminBankAccount',
  // v295: 支払い履歴管理
  'getPaymentHistory',
  'savePayment',
  'deletePayment',
  // v309: 共有メモ（申し送りホワイトボード）
  'getSharedMemo',
  'saveSharedMemo',
  // v372: 名簿出力 Visual Template Designer
  'getRosterFieldDictionary',
  'getRosterDesignerData',
  'loadRosterTemplatesV2',
  'saveRosterTemplateV2',
  'deleteRosterTemplateV2',
  'duplicateRosterTemplateV2',
  // v374.1: 公式LINE投稿依頼
  'listLinePostRequests',
  'getLinePostRequest',
  'saveLinePostRequest',
  'uploadLinePostAttachment',
  'transitionLinePostRequest',
  'deleteLinePostRequest',
  // v344: 案内PDFサムネイル Drive proxy
  'getFileThumbnail',
  // v350: 失敗時の手動サムネイル再生成
  'regenerateThumbnailForTraining',
  // v360: 研修名簿・出欠・受講履歴・一括メール明細
  'getTrainingRosterDetail',
  'saveAttendance',
  'saveAttendanceBatch',
  'addRosterEntry',
  'addGuestRosterEntry',
  'cancelRosterEntry',
  'updateRosterEntry',
  'getTrainingStats',
];

// docs/246 Phase 1-A: gas-src/Code.full.gs の MENU_REGISTRY/ACTION_TO_MENU/LEGACY_*
// placeholder ブロックを、scripts/menu-registry.mjs の serializeMenuRegistryForGas() で
// 生成した実体に置換する。3 split build 全てから呼ぶ。
// 汎用マーカーブロック注入: source 内の startMarker〜endMarker の間を serialized で置換する。
// マーカー自体は残す（再 build で再注入可能）。
export function injectMarkerBlock(source, startMarker, endMarker, serialized, label) {
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`${label || 'build inject'} placeholders が見つかりません（gas-src/Code.full.gs の構造変更を確認）`);
  }
  const before = source.slice(0, startIdx + startMarker.length);
  const after = source.slice(endIdx);
  return `${before}\n${serialized}\n${after}`;
}

export function injectMenuRegistryPlaceholders(source, serialized) {
  return injectMarkerBlock(
    source,
    '// __MENU_REGISTRY_BUILD_INJECT_START__',
    '// __MENU_REGISTRY_BUILD_INJECT_END__',
    serialized,
    'MENU_REGISTRY',
  );
}

// v376.46: 会計年度ステータス判定 computeMemberFiscalStatus を単一情報源から注入。
export function injectMemberFiscalStatusPlaceholders(source, serialized) {
  return injectMarkerBlock(
    source,
    '// __MEMBER_FISCAL_STATUS_BUILD_INJECT_START__',
    '// __MEMBER_FISCAL_STATUS_BUILD_INJECT_END__',
    serialized,
    'MEMBER_FISCAL_STATUS',
  );
}

export function replaceObjectLiteral(source, name, replacement) {
  const pattern = new RegExp(`var ${name} = \\{[\\s\\S]*?\\n\\};`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${name} object literal in Code.gs`);
  }
  return source.replace(pattern, `var ${name} = ${replacement};`);
}

export function findBlockEnd(source, openBraceIndex) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openBraceIndex; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error('Could not find block end');
}

export function collectFunctionDeclarations(source) {
  const declarations = [];
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (depth === 0 && source.startsWith('function ', i)) {
      const header = source.slice(i).match(/^function\s+([A-Za-z0-9_]+)\s*\(/);
      if (!header) continue;
      const name = header[1];
      const start = i;
      const openBraceIndex = source.indexOf('{', i + header[0].length);
      if (openBraceIndex === -1) throw new Error(`Could not find function body for ${name}`);
      const end = findBlockEnd(source, openBraceIndex);
      const afterEnd = source[end] === '\r' && source[end + 1] === '\n'
        ? end + 2
        : source[end] === '\n'
        ? end + 1
        : end;
      declarations.push({ name, start, end: afterEnd, body: source.slice(openBraceIndex + 1, end - 1) });
      i = afterEnd - 1;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
  }
  return declarations;
}

export function collectTopLevelStatements(source, declarations) {
  const declarationRanges = declarations.map((decl) => [decl.start, decl.end]);
  const statements = [];
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let statementStart = 0;

  function declarationRangeAt(index) {
    return declarationRanges.find(([start, end]) => index >= start && index < end);
  }

  for (let i = 0; i < source.length; i += 1) {
    const range = declarationRangeAt(i);
    if (range) {
      if (statementStart < range[0] && source.slice(statementStart, range[0]).trim()) {
        statements.push({ start: statementStart, end: range[0], text: source.slice(statementStart, range[0]) });
      }
      statementStart = range[1];
      i = range[1] - 1;
      continue;
    }

    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    if (ch === '}' || ch === ']' || ch === ')') depth -= 1;
    if (depth === 0 && ch === ';') {
      const end = source[i + 1] === '\r' && source[i + 2] === '\n'
        ? i + 3
        : source[i + 1] === '\n'
        ? i + 2
        : i + 1;
      const text = source.slice(statementStart, end);
      if (text.trim()) statements.push({ start: statementStart, end, text });
      statementStart = end;
    }
  }
  if (statementStart < source.length && source.slice(statementStart).trim()) {
    statements.push({ start: statementStart, end: source.length, text: source.slice(statementStart) });
  }
  return statements;
}

export function collectReachableFunctions(source, seedNames) {
  const declarations = collectFunctionDeclarations(source);
  const declarationByName = new Map(declarations.map((decl) => [decl.name, decl]));
  const declaredNames = new Set(declarationByName.keys());
  const reachable = new Set(seedNames.filter((name) => declaredNames.has(name)));
  const queue = [...reachable];
  // A function used as a value (e.g. rows.map(recordFromRow_)) is a real
  // reference too. Counting only call syntax pruned such helpers out of every
  // split and broke listMailTemplates in production from v376.42 to v376.61.
  const callPattern = /\b([A-Za-z0-9_]+)\s*\(/g;
  const referencePattern = /(^|[^.\w$])([A-Za-z0-9_]+)\b(?!\s*\()/g;

  while (queue.length) {
    const name = queue.shift();
    const declaration = declarationByName.get(name);
    if (!declaration) continue;
    const bodyForCalls = maskCommentsAndStrings(declaration.body);
    const visit = (callee) => {
      if (declaredNames.has(callee) && !reachable.has(callee)) {
        reachable.add(callee);
        queue.push(callee);
      }
    };
    callPattern.lastIndex = 0;
    let match;
    while ((match = callPattern.exec(bodyForCalls)) !== null) visit(match[1]);
    referencePattern.lastIndex = 0;
    let reference;
    while ((reference = referencePattern.exec(bodyForCalls)) !== null) visit(reference[2]);
  }
  return { declarations, reachable };
}

export function maskCommentsAndStrings(source) {
  let result = '';
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        result += '  ';
        i += 1;
      } else {
        result += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        result += ' ';
      } else if (ch === '\\') {
        escaped = true;
        result += ' ';
      } else if (ch === quote) {
        quote = '';
        result += ' ';
      } else {
        result += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      result += '  ';
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      result += '  ';
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      result += ' ';
      continue;
    }
    result += ch;
  }
  return result;
}

export function pruneUnreachableFunctionDeclarations(source, seedNames, label) {
  const { declarations, reachable } = collectReachableFunctions(source, seedNames);
  const removable = declarations.filter((decl) => !reachable.has(decl.name));
  const removableNames = new Set(removable.map((decl) => decl.name));
  const removableTopLevelStatements = collectTopLevelStatements(source, declarations).filter((statement) => (
    [...removableNames].some((name) => new RegExp(`\\b${name}\\b`).test(statement.text))
  ));
  const rangesToRemove = [
    ...removable.map((decl) => ({ start: decl.start, end: decl.end })),
    ...removableTopLevelStatements.map((statement) => ({ start: statement.start, end: statement.end })),
  ].sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;

  for (const range of rangesToRemove) {
    if (range.start < cursor) continue;
    result += source.slice(cursor, range.start);
    cursor = range.end;
  }
  result += source.slice(cursor);
  console.log(`[${label}] Pruned ${removable.length} unreachable function declarations and ${removableTopLevelStatements.length} dependent top-level statements`);
  return result;
}

export function assertAllowedTopLevelFunctions(source, allowedNames, label) {
  const allowed = new Set(allowedNames);
  const publicTopLevel = collectFunctionDeclarations(source)
    .map((decl) => decl.name)
    .filter((name) => !name.endsWith('_'));
  const disallowed = publicTopLevel.filter((name) => !allowed.has(name));
  if (disallowed.length) {
    throw new Error(`[${label}] Disallowed public top-level functions: ${disallowed.join(', ')}`);
  }
  console.log(`[${label}] Public top-level functions: ${publicTopLevel.join(', ')}`);
}

export function removeDisallowedActionHandlers(source, allowedActions) {
  const allowed = new Set(allowedActions);
  const actionPattern = /[ \t]*if \(action === '([^']+)'\) \{/g;
  let result = '';
  let cursor = 0;
  let match;

  while ((match = actionPattern.exec(source)) !== null) {
    const action = match[1];
    const blockStart = match.index;
    const openBraceIndex = actionPattern.lastIndex - 1;
    const blockEnd = findBlockEnd(source, openBraceIndex);
    const afterBlock = source[blockEnd] === '\r' && source[blockEnd + 1] === '\n'
      ? blockEnd + 2
      : source[blockEnd] === '\n'
      ? blockEnd + 1
      : blockEnd;

    if (allowed.has(action)) {
      result += source.slice(cursor, afterBlock);
    } else {
      result += source.slice(cursor, blockStart);
    }
    cursor = afterBlock;
    actionPattern.lastIndex = afterBlock;
  }
  return result + source.slice(cursor);
}

export function removeIfBlock(source, conditionText) {
  const marker = `if (${conditionText}) {`;
  const start = source.indexOf(marker);
  if (start === -1) return source;
  const openBraceIndex = start + marker.length - 1;
  const end = findBlockEnd(source, openBraceIndex);
  const afterEnd = source[end] === '\r' && source[end + 1] === '\n'
    ? end + 2
    : source[end] === '\n'
    ? end + 1
    : end;
  return source.slice(0, start) + source.slice(afterEnd);
}

export function replaceScriptRoutesWithPublicOnly(source) {
  // 2026-07-05: gas-src の routes は Script Properties override 対応の動的構築へ変更（AGENTS §3）。
  // public ビルドでは member/admin の Script ID を bundle に残さないため、
  // routeIdMember 宣言〜最後の SCRIPT_ID_ROUTES 代入までを public-only 版に置換する。
  const pattern = /var routeIdMember = [\s\S]*?SCRIPT_ID_ROUTES\[routeIdPublic\] = \{[^}]*\};/;
  const replacement = [
    "var routeIdPublic = '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL';",
    '  try {',
    '    var routeProps = PropertiesService.getScriptProperties();',
    "    routeIdPublic = routeProps.getProperty('SCRIPT_ID_PUBLIC') || routeIdPublic;",
    '  } catch (routeErr) {}',
    '  var SCRIPT_ID_ROUTES = {};',
    "  SCRIPT_ID_ROUTES[routeIdPublic] = { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };",
  ].join('\n');
  if (!pattern.test(source)) {
    throw new Error('Could not find SCRIPT_ID_ROUTES dynamic block in Code.gs');
  }
  return source.replace(pattern, replacement);
}
