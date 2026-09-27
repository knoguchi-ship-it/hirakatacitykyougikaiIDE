# 機能一覧 — 公開 / 会員 / 管理（2026-09-25 起票）

## 0. この文書の役割

**「その機能はもう有るのか、どこに有るのか」を 1 枚で引ける表**。
新しい機能を作る前にここを引き、既にある実装へ寄せる。二重実装を防ぐための文書であって、
仕様の正本ではない（仕様は `docs/spec/`、DB は `docs/03`、ER は生成物）。

§2 の表は **生成物**。`npm run generate:inventory` で更新し、`test:feature-inventory`（prerelease 連鎖）が
ドリフトで落ちる。**表を手で書き換えないこと。** 分類を足す場所は `scripts/feature-inventory.mjs` の `DOMAINS`。

## 1. 面の定義

| 面 | Web App | フロント | バンドル | 認証 |
|---|---|---|---|---|
| **公開** | 統合プロジェクト（2 本） | `src/public-portal/` | `index_public.html` | 無し（匿名）。書き込みは本人確認トークン必須 |
| **会員** | 会員 split | `src/App.tsx`（`VITE_APP` で会員モード） | `index.html` | ログインID + パスワード → `sessionToken` |
| **管理** | 管理者 split | `src/App.tsx`（`VITE_APP=admin`） | `index_admin.html` | Google セッション + ホワイトリスト + ロール |

**会員と管理はフロントが同じ `src/App.tsx`**。`appShellMode`（`src/App.tsx:369`）で分岐し、
ビルド時に `VITE_APP` で切り替える。**公開だけ別バンドル**。
→ 会員／管理で同じ画面部品を作り直す必要はない。公開に同じ物を出したいときだけ移植の判断が要る。

バックエンドは 3 面とも **`gas-src/Code.full.gs` 1 本が正本**。
`build:gas` / `build:gas:member` / `build:gas:admin` が面ごとに pruning して 3 つの `Code.gs` を生成する。
面の境界は「どの action を許可するか」だけで決まる（`scripts/gas-boundary-utils.mjs`）。

## 2. 機能一覧（action × 面）

<!-- BEGIN GENERATED: feature-inventory -->

> この節は `npm run generate:inventory` の生成物。**手で編集しない。**
> 出典: 許可リスト `scripts/gas-boundary-utils.mjs` ＋ dispatcher `gas-src/Code.full.gs`。
> action 合計 **147** 件（公開 12 / 会員 19 / 管理 119、重複含む）。

### 入会・申込受付

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `submitMemberApplication` | ● |  |  | `submitMemberApplication_` |
| `getAdminChangeRequests` |  |  | ● | `getAdminChangeRequests_` |
| `approveAdminChangeRequest` |  |  | ● | `approveAdminChangeRequest_` |
| `rejectAdminChangeRequest` |  |  | ● | `rejectAdminChangeRequest_` |

### 会員情報の照会・更新

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getMemberPortalData` |  | ● |  | `getMemberPortalData_` |
| `updateMemberSelf` |  | ● |  | `updateMemberSelfByPrincipal_` |
| `updateMember` |  |  | ● | `sanitizeAdminMemberPayload_`<br>`updateMember_`<br>`notifyMembershipChatForMember_` |
| `fetchAllData` |  |  | ● | `fetchAllDataFromDb_` |
| `getAdminPersonList` |  |  | ● | `getAdminPersonList_` |
| `updatePersonsBatch` |  |  | ● | `updatePersonsBatch_` |
| `convertMemberType` |  |  | ● | `convertMemberType_` |
| `submitPublicChangeRequest` | ● |  |  | `submitPublicChangeRequest_` |
| `verifyMemberIdentityForPublic` | ● |  |  | `verifyMemberIdentityForPublic_` |
| `sendPublicOtp` | ● |  |  | `sendPublicOtp_` |
| `verifyPublicOtp` | ● |  |  | `verifyPublicOtp_` |

### 退会

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `withdrawSelf` |  | ● |  | `withdrawSelfByPrincipal_` |
| `cancelWithdrawalSelf` |  | ● |  | `cancelWithdrawalSelfByPrincipal_` |
| `withdrawMember` |  |  | ● | `withdrawMember_`<br>`notifyMembershipChatForMember_` |
| `scheduleWithdrawMember` |  |  | ● | `scheduleWithdrawMember_` |
| `cancelScheduledWithdraw` |  |  | ● | `cancelScheduledWithdraw_` |

### 事業所職員

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `updateStaff` |  |  | ● | `updateStaff_`<br>`notifyMembershipChatForMember_` |
| `removeStaffFromOffice` |  |  | ● | `removeStaffFromOffice_`<br>`notifyMembershipChatForMember_` |
| `getPublicAvailableStaffSlots` | ● |  |  | `getPublicAvailableStaffSlots_` |
| `getPublicEnrolledStaffList` | ● |  |  | `getPublicEnrolledStaffList_` |
| `repairDuplicateStaffRecords` |  |  | ● | `repairDuplicateStaffRecords_` |

### 認証・パスワード

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `memberLogin` |  | ● |  | `memberLogin_` |
| `changePassword` |  | ● |  | `changePassword_` |
| `requestPasswordReset` |  | ● |  | `requestPasswordReset_` |
| `completePasswordReset` |  | ● |  | `completePasswordReset_` |
| `getMemberAuthAccounts` |  |  | ● | `getMemberAuthAccounts_` |
| `adminResetMemberPassword` |  |  | ● | `adminResetMemberPassword_` |
| `adminUnlockMemberAccount` |  |  | ● | `adminUnlockMemberAccount_` |
| `adminIssueMemberCredential` |  |  | ● | `adminIssueMemberCredential_` |

### 研修（公開・申込）

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getPublicTrainings` | ● |  |  | `getPublicTrainings_` |
| `applyTrainingExternal` | ● |  |  | `applyTrainingExternal_` |
| `cancelTrainingExternal` | ● |  |  | `cancelTrainingExternal_` |
| `applyTraining` |  | ● |  | `applyTraining_` |
| `cancelTraining` |  | ● |  | `cancelTraining_` |

### 研修（管理）

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `saveTraining` |  |  | ● | `saveTraining_` |
| `softDeleteTraining` |  |  | ● | `softDeleteTraining_` |
| `restoreTraining` |  |  | ● | `restoreTraining_` |
| `uploadTrainingFile` |  |  | ● | `uploadTrainingFile_` |
| `setupTrainingFileFolder` |  |  | ● | `setupTrainingFileFolder_` |
| `getTrainingManagementData` |  |  | ● | `getTrainingManagementData_` |
| `getTrainingApplicants` |  |  | ● | `getTrainingApplicants_` |
| `getTrainingStats` |  |  | ● | `getTrainingStats_` |
| `repairTrainingApplicationApplicantIds` |  |  | ● | `repairTrainingApplicationApplicantIds_` |

### 研修 名簿・出欠

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getTrainingRosterDetail` |  |  | ● | `getTrainingRosterDetail_` |
| `saveAttendance` |  |  | ● | `saveAttendance_` |
| `saveAttendanceBatch` |  |  | ● | `saveAttendanceBatch_` |
| `addRosterEntry` |  |  | ● | `addRosterEntry_` |
| `addGuestRosterEntry` |  |  | ● | `addGuestRosterEntry_` |
| `cancelRosterEntry` |  |  | ● | `cancelRosterEntry_` |
| `updateRosterEntry` |  |  | ● | `updateRosterEntry_` |
| `getRosterFieldDictionary` |  |  | ● | `getRosterFieldDictionary_` |
| `getRosterDesignerData` |  |  | ● | `getRosterDesignerData_` |
| `loadRosterTemplatesV2` |  |  | ● | `loadRosterTemplatesV2_` |
| `saveRosterTemplateV2` |  |  | ● | `saveRosterTemplateV2_` |
| `deleteRosterTemplateV2` |  |  | ● | `deleteRosterTemplateV2_` |
| `duplicateRosterTemplateV2` |  |  | ● | `duplicateRosterTemplateV2_` |

### メール送信・文面

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `sendTrainingReminder` |  |  | ● | `sendTrainingReminder_` |
| `sendTrainingMail` |  |  | ● | `sendTrainingMail_` |
| `generateTrainingEmail` |  |  | ● | `generateTrainingEmailWithAI_` |
| `getAdminEmailAliases` |  |  | ● | `getAdminEmailAliases_` |
| `getMembersForBulkMail` |  |  | ● | `getMembersForBulkMail_` |
| `sendBulkMemberMail` |  |  | ● | `sendBulkMemberMail_` |
| `getEmailSendLog` |  |  | ● | `getEmailSendLog_` |
| `getCredentialEmailTemplates` |  |  | ● | `getCredentialEmailTemplates_` |
| `saveCredentialEmailTemplate` |  |  | ● | `saveCredentialEmailTemplate_` |
| `deleteCredentialEmailTemplate` |  |  | ● | `deleteCredentialEmailTemplate_` |
| `listMailTemplates` |  |  | ● | `listMailTemplates_` |
| `saveMailTemplate` |  |  | ● | `saveMailTemplate_` |
| `deleteMailTemplate` |  |  | ● | `deleteMailTemplate_` |
| `getBulkMailTemplates` |  |  | ● | `getBulkMailTemplates_` |
| `saveBulkMailTemplate` |  |  | ● | `saveBulkMailTemplate_` |
| `deleteBulkMailTemplate` |  |  | ● | `deleteBulkMailTemplate_` |
| `getMailingListTargets` |  |  | ● | `getMailingListTargets_` |
| `generateMailingListExcel` |  |  | ● | `generateMailingListExcel_` |

### 年会費・請求・入出金

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getAnnualFeeAdminData` |  |  | ● | `getAnnualFeeAdminData_` |
| `saveAnnualFeeRecord` |  |  | ● | `saveAnnualFeeRecord_` |
| `saveAnnualFeeRecordsBatch` |  |  | ● | `saveAnnualFeeRecordsBatch_` |
| `getMyClaims` |  | ● |  | `getMyClaims_` |
| `submitClaim` |  | ● |  | `saveClaim_` |
| `deleteMyClaim` |  | ● |  | `deleteMyClaim_` |
| `uploadClaimAttachment` |  | ● |  | `uploadClaimAttachment_` |
| `removeClaimAttachment` |  | ● |  | `removeClaimAttachment_` |
| `getClaims` |  |  | ● | `getClaims_` |
| `approveClaim` |  |  | ● | `approveClaim_` |
| `rejectClaim` |  |  | ● | `rejectClaim_` |
| `adminDeleteClaim` |  |  | ● | `adminDeleteClaim_` |
| `saveMyBankAccount` |  | ● |  | `saveMemberBankAccount_` |
| `getAdminBankAccount` |  |  | ● | `getBankAccount_` |
| `saveAdminBankAccount` |  |  | ● | `saveBankAccount_` |
| `deleteAdminBankAccount` |  |  | ● | `deleteBankAccount_` |
| `getPaymentHistory` |  |  | ● | `getPaymentHistory_` |
| `savePayment` |  |  | ● | `savePayment_` |
| `deletePayment` |  |  | ● | `deletePayment_` |

### 役員

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getMyOfficerStatus` |  | ● |  | `getMemberOfficerStatus_` |
| `getOfficerMasterData` |  | ● | ● | `getOfficerMasterData_` |
| `getOfficerManagementData` |  |  | ● | `getOfficerManagementData_` |
| `assignOfficer` |  |  | ● | `assignOfficer_` |
| `resignOfficer` |  |  | ● | `resignOfficer_` |
| `updateOfficerLinkage` |  |  | ● | `updateOfficerLinkage_` |
| `updateOfficerRecord` |  |  | ● | `updateOfficerRecord_` |
| `saveOrganization` |  |  | ● | `saveOrganization_` |
| `deleteOrganization` |  |  | ● | `deleteOrganization_` |
| `saveOfficerRole` |  |  | ● | `saveOfficerRole_` |
| `deleteOfficerRole` |  |  | ● | `deleteOfficerRole_` |
| `savePaymentType` |  |  | ● | `savePaymentType_` |
| `deletePaymentType` |  |  | ● | `deletePaymentType_` |
| `saveWorkCategory` |  |  | ● | `saveWorkCategory_` |
| `deleteWorkCategory` |  |  | ● | `deleteWorkCategory_` |

### 権限・ロール

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getAdminPermissionData` |  |  | ● | `getAdminPermissionData_` |
| `saveAdminPermission` |  |  | ● | `saveAdminPermission_` |
| `deleteAdminPermission` |  |  | ● | `deleteAdminPermission_` |
| `listRoles` |  |  | ● | `listRoles_` |
| `saveRole` |  |  | ● | `saveRole_` |
| `deleteRole` |  |  | ● | `deleteRole_` |
| `duplicateRole` |  |  | ● | `duplicateRole_` |

### システム設定・ダッシュボード

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getDbInfo` |  |  | ● | `getDbInfo_` |
| `getSystemSettings` |  |  | ● | `getSystemSettings_` |
| `updateSystemSettings` |  |  | ● | `updateSystemSettings_` |
| `getAdminDashboardData` |  |  | ● | `getAdminDashboardData_` |
| `getAdminInitData` |  |  | ● | `getAdminDashboardData_`<br>`getSystemSettings_`<br>`reportOverdueScheduledJobs_` |
| `getPublicPortalSettings` | ● |  |  | `getPublicPortalSettings_` |
| `getSharedMemo` |  |  | ● | `getSharedMemo_` |
| `saveSharedMemo` |  |  | ● | `saveSharedMemo_` |

### 規程

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `listRegulations` |  |  | ● | `listRegulations_` |
| `saveRegulation` |  |  | ● | `saveRegulation_` |
| `saveRegulationsBatch` |  |  | ● | `saveRegulationsBatch_` |
| `deleteRegulation` |  |  | ● | `deleteRegulation_` |

### データ書出・削除

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `listExportableTables` |  |  | ● | `listExportableTables_` |
| `exportTableCsv` |  |  | ● | `exportTableCsv_` |
| `searchMembersForDelete` |  |  | ● | `searchMembersForDelete_` |
| `previewDeleteMember` |  |  | ● | `previewDeleteMember_` |
| `executeDeleteMember` |  |  | ● | `executeDeleteMember_` |
| `getDeleteLogs` |  |  | ● | `getDeleteLogs_` |
| `backupMigrationTargets` |  |  | ● | `backupMigrationTargets_` |
| `repairMemberCareManagerDuplicates` |  |  | ● | `repairMemberCareManagerDuplicates_` |

### ファイル・サムネイル

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `getFileThumbnail` | ● | ● | ● | `getFileThumbnail_` |
| `regenerateThumbnailForTraining` |  |  | ● | `regenerateThumbnailForTraining_` |

### LINE 投稿依頼

| action | 公開 | 会員 | 管理 | GAS 実装 |
|---|:--:|:--:|:--:|---|
| `listLinePostRequests` |  |  | ● | `listLinePostRequests_` |
| `getLinePostRequest` |  |  | ● | `getLinePostRequest_` |
| `saveLinePostRequest` |  |  | ● | `saveLinePostRequest_` |
| `uploadLinePostAttachment` |  |  | ● | `uploadLinePostAttachment_` |
| `transitionLinePostRequest` |  |  | ● | `transitionLinePostRequest_` |
| `deleteLinePostRequest` |  |  | ● | `deleteLinePostRequest_` |

<!-- END GENERATED: feature-inventory -->

## 3. 単一情報源になっている中核（＝ここへ寄せる）

新規実装はまずこれらを呼べないか確かめる。

| 中核 | 何の正本か | 使っている面 |
|---|---|---|
| `saveMemberCore_` | **会員レコードの書き込み全部**。`updateMember_`（管理）も `updateMemberSelf_`（会員）も、公開申請の承認（`approveAdminChangeRequest_`）も必ずここを通る | 公開 / 会員 / 管理 |
| `deliverMail_` | **メール送信全部**。配信ガード（停止／集約／種別 ON-OFF）・失敗の Chat 通知もここ | 3 面 |
| `sendEmailWithValidatedFrom_` | 送信経路の分岐。エイリアス無し＝`MailApp` / エイリアス指定＝Gmail REST（v376.103） | 3 面 |
| `renderBizEmailTemplate_` | `{{差し込み}}` の置換 | 3 面 |
| `notifyMembershipChatForMember_` / `notifyMembershipChatSafely_` | 会員手続きの Chat 通知（REQUEST / FINAL / ANOMALY） | 3 面 |
| `verifyPublicIdentityToken_` | 公開側の本人確認トークン検証。公開の読み書き API は全部これを通る | 公開 |
| `resolveMemberPrincipalPayload_` | 会員セッションから本人を確定する（クライアント申告を信じない） | 会員 |
| `src/shared/validators.ts` | 入力書式（メール／電話／CM番号／事業所番号／郵便番号） | フロント 3 面 |
| `src/utils/kanaNormalize.ts` | カナ正規化・全角カタカナ判定 | フロント 3 面 |
| `src/shared/memberFiscalStatus.mjs` | 会計年度の在籍判定。フロントは import、GAS はビルド時注入 | フロント + GAS |
| `src/shared/mailTemplates.ts` / `mailCategories.ts` | メール種別・差し込みタグ・種別ごとの配色 | 管理フロント |
| `src/shared/memberTypes.mjs` | 会員種別の定義とラベル | フロント 3 面 |

## 4. 二重実装・重複（検出結果）

優先度は「食い違うと利用者に見える度合い」で付けた。

### 4-1. 研修の申込が 3 実装 — **解消済み（2026-09-27 / v376.104）**

同じ「研修に申し込む」が面ごとに別実装で、判定が揃っていなかった。

| | 会員 `applyTraining_` | 公開 `applyTrainingExternal_` | 管理 `addRosterEntry_` / `addGuestRosterEntry_` |
|---|---|---|---|
| 重複申込チェック | 有り | 有り | **無し** |
| 定員チェック | 有り | 有り | **無し** |
| 同一人物の解決 | — | **毎回 `T_外部申込者` を新規作成**（既存を探したうえで無視していた）| **毎回新規作成** |
| 受付メール | 送らない | `TRAINING_APPLY_RECEIPT` | 送らない |

いちばん重かったのは同一人物の扱いで、**同じ人が申し込むたびに外部申込者が増えていた**。
名簿でも宛先でも 1 人が複数人に見える。`repairTrainingApplicationApplicantIds` という
修復ツールが admin に存在するのは、この後始末のためだった。

（当初「定員の数え方が会員と公開で違う」と書いたが、これは誤り。
`countAppliedApplicants_` は `getTrainingApplicationRows_` の薄い wrapper で、
会員側のインライン集計と実質同じだった。重複していたのは実装であって挙動ではない。）

**寄せ方**: 入口ごとの手続き（本人確認・権限・メール）は本質的に違うので共通化しない。
**判定だけ**を `countAppliedApplicants_` の隣に集めた。

| 共通ルール | 何を決めるか |
|---|---|
| `resolveOrCreateExternalApplicant_` | メールで同一人物を突き合わせ、居れば再利用する（1 人を 1 人に保つ）|
| `findExistingTrainingApplication_` | 同じ研修に同じ人の申込が既にあるか。`申込者ID` / `外部申込者ID` の両方を見る |
| `evaluateTrainingCapacity_` | 定員。数え上げはここだけ |

**管理画面からは定員を超えられる**（operator 判断: 意図的な追加は許可する）。ただし黙っては通さず、
超過したことを返して「定員そのものを広げてください」と画面に出す。
**重複は入口を問わず必ず弾く。** 固定: `npm run test:training-apply-rules`。

### 4-2. 公開ポータルの入力検証が正本を使っていない（**中**）

`src/public-portal/components/MemberUpdateForm.tsx` が CM 番号を `/^\d{8}$/` と**直書き**している（4 箇所）。
正本は `src/shared/validators.ts` の `CARE_MANAGER_NO_PATTERN`。公開ポータルからは `validators.ts` を
1 箇所も import していない。

これは v376.101 で直した不具合（`MemberForm.tsx` が独自のカナ正規表現を持っていた）と**同じ形**。
そのときは会員マイページで賛助会員が保存できなくなった。

**寄せ先**: `validators.ts` を import して置き換える。差分は小さい。

### 4-3. ログインID の書き換えが承認処理に直書き（**中**）

`approveAdminChangeRequest_` は会員・職員の更新を `updateMember_` / `updateStaff_` に委ねている一方、
`T_認証アカウント` の行は `getRange().setValues()` で**直接**書いている（2 箇所）。
`syncStaffLoginIdToCmNumber_`（v376.100 で新設）と役割が重なる。

**寄せ先**: 認証アカウント行の更新を 1 関数に集約する。

### 4-4. build pruner が 3 ファイルに複製（**低・既知**）

`scripts/build-admin-gas.mjs` / `build-member-gas.mjs` / `gas-boundary-utils.mjs` に
同じ到達可能性解析が 3 つある。コード内にも申し送りのコメントがある
（「Keep the three in step」）。v376.42〜v376.61 に本番の `listMailTemplates` が
消えた事故は、この 3 つが揃っていなかったのが原因。

**寄せ先**: `gas-boundary-utils.mjs` の 1 本に集約して 2 つの build から import する。

### 4-5. 一括メールの差し込みタグがカタログを見ていない（**低・既知**）

`src/components/BulkMailSender.tsx` は挿入ボタンを持つが、タグを**自前で並べている**。
他のメール設定カードは `src/shared/mailTemplates.ts` のカタログから引く（v376.98）。
タグを足したとき一括メールだけ古いまま残る。

## 5. 意図的に分けている（統合しない）

「重複に見えるが別物」。機械的にまとめると壊れる。

| 見かけの重複 | 分けている理由 |
|---|---|
| 公開の変更申請 `submitPublicChangeRequest_` と 会員の自己更新 `updateMemberSelf_` | 前者は **`T_変更申請` に積んで管理者承認を要する**、後者は即時反映。承認境界が違う |
| 申込者解決の 2 モデル（canonical / legacy） | 用途が別。機械的統合は禁止（`docs` の申し送り・v376.12 の誤送信原因） |
| 宛先構築・添付方式がメール種別ごとに違う | 送信実体は `deliverMail_` に集約済み。宛先と添付は用途が本質的に違う（v376.17 判断） |
| 会員マイページの自己操作はメールを送らない | 送るのは管理者承認の経路だけ。マイページ編集は管理権限者しか使っていない運用 |
| 研修・認証系メールが全停止 | 研修は整備中、会員マイページ未展開。不具合ではない |

## 6. 維持のしかた

- 新しい action を足したら `scripts/feature-inventory.mjs` の `DOMAINS` に分類を書く。書かないと
  `test:feature-inventory` が「未分類の action」で落ちる。**表の更新忘れが CI で止まる**のが狙い。
- 表の再生成は `npm run generate:inventory`。
- §4 を直したらその項を消す。残っている項目が「まだ二重のままの箇所」。
