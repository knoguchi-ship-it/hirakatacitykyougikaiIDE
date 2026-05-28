# Release Notes 2026

このファイルは **時系列の release ログ**です。リリース確定後は本書のエントリだけ更新し、`HANDOVER.md` は「現状」のみ保持してください。
詳細な背景・設計判断・修正コードは個別 `docs/2XX_RELEASE_STATE_*.md` を参照。

凡例:
- 🆕 = 機能追加
- 🔧 = 改善 / リファクタ
- 🐛 = バグ修正
- 🔒 = セキュリティ
- 📝 = ドキュメント / ツール
- 🎉 = マイルストーン

---

## v376.25 — 2026-05-28 🆕 メニュー単位 RBAC Phase 1-B コード反映（schema + fallback chain）

`docs/246` Phase 1-B のコード反映。**実 DB migration は operator が次セッションで段階実行**するため、この commit/deploy 単独では挙動完全維持。admin split のみ @180。

| 種別 | 内容 |
|---|---|
| 🆕 | `T_権限ロール` テーブル新設（11 列: ロールID/ロール名/説明/許可メニューJSON/研修編集スコープ/組込フラグ/マスターフラグ/表示順/作成日時/更新日時/削除フラグ）|
| 🆕 | `T_管理者Googleホワイトリスト` に `ロールID` 列追加（並行運用、`権限コード` 列保持） |
| 🆕 | `INITIAL_ROLE_DEFINITIONS` (5 ロール) を `scripts/menu-registry.mjs` で定義。MASTER は `isBuiltIn=true` で編集削除不可。他 4 ロールは編集可能カスタムロール。**allowedMenus は Phase 1-A LEGACY_ROLE_TO_MENUS と完全一致**（挙動完全維持）。決定論的 roleId (`role-master-builtin` 等) で再投入冪等 |
| 🆕 | `LEGACY_CODE_TO_INITIAL_ROLE_ID` mapping (whitelist 移行用) |
| 🆕 | `getRoleByIdCached_(ss, roleId)` — `T_権限ロール` キャッシュ参照 (TTL 300s, `admin_roles_v1`) |
| 🆕 | `seedInitialPermissionRoles_(ss)` — 空テーブル時のみ seed（冪等。既存編集を消さない）|
| 🆕 | `runRebuildSchemaForV246()` (admin top-level) — schema 適用 + ロール seed |
| 🆕 | `migrateToRoleBasedRBAC_v246_DRYRUN()` (admin top-level) — 変換プレビュー JSON |
| 🆕 | `migrateToRoleBasedRBAC_v246_APPLY()` (admin top-level) — ホワイトリストの`ロールID`列を実書込み（冪等。`権限コード`列は保持）|
| 🔧 | `checkAdminBySession_` に fallback chain: `ロールID` 列があれば `T_権限ロール` の値が authoritative、無ければ Phase 1-A LEGACY_ROLE_TO_MENUS にフォールバック。既存 `adminPermissionLevel` フィールドは後方互換維持 |
| 🔧 | `initializeSchema_` に `normalizeTableColumns_(T_権限ロール)` + `seedInitialPermissionRoles_` を組み込み |
| 🔧 | `clearAdminPermissionCaches_` に `admin_roles_v1` キー追加 |
| ✅ | snapshot test 9/9 PASS（INITIAL_ROLE_DEFINITIONS の roleId 一意性 + MASTER 組込 + legacy mapping + allowedMenus 完全一致 をすべて assert）|
| ✅ | typecheck / test:formula / test:search / test:kana 全 PASS。security:public/member/admin-boundary 全 PASS。build:gas / build:gas:member / build:gas:admin 全成功 |
| 🚀 | デプロイ: admin split のみ @180（外部 API 表面は不変。member/public 未 redeploy）|

### 操作者引継ぎ（次セッション）

admin デプロイ (@180) 完了後、Apps Script editor (admin split) を開き、以下を順に ▶ Run:

| Step | 関数 | 目的 | 安全性 |
|---|---|---|---|
| 1 | `runRebuildSchemaForV246` | T_権限ロール シート作成 + ロールID 列追加 + 5 ロール seed | 冪等・既存編集を保護 |
| 2 | `migrateToRoleBasedRBAC_v246_DRYRUN` | ホワイトリスト全行の権限コード→ロールID 変換プレビューを JSON で取得 | 書込なし |
| 3 | (preview を user と確認後) `migrateToRoleBasedRBAC_v246_APPLY` | ホワイトリストの ロールID 列を実書込み | 冪等。権限コード列は保持 |
| 4 | admin login テスト | 挙動完全維持（ロールID 経由 = legacy 経由が同じ結果）| - |
| Rollback | T_管理者Googleホワイトリスト の ロールID 列を全行クリア | fallback chain により legacy 経路に自動復帰 | - |

---

## v376.24 — 2026-05-28 🆕 メニュー単位 RBAC Phase 1-A（認可レイヤー内部置換）

`docs/246` で設計確定したメニュー単位カスタムロール RBAC の **Phase 1-A** を実装。旧 `ADMIN_ACTION_PERMISSIONS` による `action→role` 固定マップ判定を、新 `action→menu→role.allowedMenus` 評価へ内部置換した。**外部 API 表面・DB schema・whitelist 列構成は不変**で、Phase 1-B (T_権限ロール 新設) は次回着手予定。

| 種別 | 内容 |
|---|---|
| 🆕 | `scripts/menu-registry.mjs` 新設（v376.23 単一情報源パターン踏襲）。MENU_REGISTRY（14 メニュー）/ ACTION_TO_MENU / LEGACY_ROLE_TO_MENUS / LEGACY_ROLE_TRAINING_SCOPE / LEGACY_ROLE_DELTA_ACCEPTED を一元管理 |
| 🆕 | `scripts/test-menu-registry.mjs` 新設（snapshot test 7 件）。旧 ADMIN_ACTION_PERMISSIONS と新 menu-based 認可の **全 (action × role) 等価性を機械検証**。許容デルタ以外があれば FAIL でリリースを止める fail-safe。prerelease に統合 |
| 🆕 | `scripts/gas-boundary-utils.mjs::injectMenuRegistryPlaceholders` 追加。build:gas / build:gas:member / build:gas:admin から呼び、`gas-src/Code.full.gs` の placeholder ブロックを実体に置換 |
| 🔧 | `processApiRequest`: `requiredPerms.indexOf(permLevel) === -1` → `!isActionAllowedByMenu_(action, permLevel)`。等価性は snapshot test が保証。`ADMIN_ACTION_PERMISSIONS` は action 集合の whitelist 用途として残置（Phase 1-B で撤去予定） |
| 🔧 | `checkAdminBySession_`: 戻り値に `roleId`/`roleName`/`isMaster`/`allowedMenus`/`trainingEditScope` を追加。既存 `adminPermissionLevel` は後方互換維持（Phase 1-B で T_権限ロール の UUID へ移行） |
| 🔧 | `saveTraining_` (旧 11631-11637) の `adminPerm === 'TRAINING_REGISTRAR'` ハードコードを `trainingEditScope === 'OWN'` 判定へ置換 |
| ⚠️ | 既知デルタ 7 件（LEGACY_ROLE_DELTA_ACCEPTED に明示承認済）。すべて TR/TM が training-manage menu 経由で旧不許可 action にアクセス可能化する単一方向。MA は完全に挙動不変。逆方向（許可→deny）デルタは 0 件 |
| ✅ | 検証: typecheck / test:formula / test:search / test:kana / test:menu-registry 全 PASS。security:public/member/admin-boundary 全 PASS。build:gas / build:gas:member / build:gas:admin 全成功 |
| 🚀 | デプロイ: admin split のみ @179（外部 API 表面・DB schema・whitelist 列が不変のため member/public 未 redeploy） |

### 許容デルタ内訳
- TR: softDeleteTraining / restoreTraining / sendTrainingReminder / getAdminEmailAliases / sendTrainingMail / setupTrainingFileFolder（OWN scope で saveTraining_ は引き続き保護）
- TM: setupTrainingFileFolder（冪等な初回フォルダ設定）
- GENERAL: fetchAllData（GENERAL は `checkAdminBySession_` で弾かれるため到達不能）

### 次回（Phase 1-B）作業
- `T_権限ロール` 新設 + whitelist にロールID列追加（並行運用、権限コード列保持）
- 初期4ロール（ADMIN / TRAINING_MANAGER / TRAINING_REGISTRAR / GENERAL = 編集可能なカスタムロール）+ MASTER built-in
- operator 移行スクリプト `migrateToRoleBasedRBAC_v246_DRYRUN` / `_APPLY`

---

## v376.23 — 2026-05-28 🔧 二重管理の解消⑥: action 許可リストの単一情報源化（A-3）

各境界の `processApiRequest` action 許可リストが build×3（`build-{admin,member,gas}.mjs` の `removeDisallowedActionHandlers` 引数）と audit×3（`audit-{admin,member,public}-boundary.mjs` の expected リスト）の**計6箇所に手書き分散**していたのを、`gas-boundary-utils.mjs` の4定数（`PUBLIC_/MEMBER_/ADMIN_ALLOWED_ACTIONS_LIST` + `ADMIN_LOGIN_ACTIONS_LIST`）に単一情報源化。**生成物に変更なし・再デプロイ不要**。

| 種別 | 内容 |
|---|---|
| 🔧 | build と audit が同一の共有定数を import。新 action 追加/削除は 1 箇所のみ更新すればよくなった（従来は build と audit の両方更新が必要で、漏れると build 成功・audit 失敗のズレが発生していた） |
| 🐛 | `build-admin-gas.mjs` の許可リストに、v373.7 等で撤去済みの action（`getMembersForRoster` / `generateRosterZip` / `validateTemplateSpreadsheet` / `initRosterExport` / `processRosterChunk` / `finalizeRosterExport` / `cleanupRosterExport` / v316 `getRosterTemplateList` 群）が **stale entry として残存**していた（`removeDisallowedActionHandlers` は存在しない action を無視するため no-op で見逃されていた）。共有定数化（実態 = audit リストを正本）により自然に解消 |
| ✅ | 検証: リファクタ後に 3 split をリビルドし `backend/gas-admin/gas-member の Code.gs` が md5 完全一致（build 挙動不変）+ prerelease 全 audit PASS を確認 |

※ frontend `api.ts` 呼び出し ↔ backend `processApiRequest` dispatch の codegen 連動は将来課題として見送り（軽量版スコープ）。

---

## v376.22 — 2026-05-27 🔧 二重管理の解消⑤: 未使用 backend endpoint の削除（B-1 backend）

v376.19 で frontend から削除した未使用 6 API の **backend 側 endpoint と全許可リストを削除**。3 境界（admin/member/public）の dispatch・権限/許可マップ・build/audit スクリプトから一掃。

| 削除 action | 削除箇所 |
|---|---|
| `createMember` / `updateMembersBatch` / `getMemberTrainingHistory` | dispatch + `ADMIN_ACTION_PERMISSIONS` + build-admin/audit-admin 許可リスト |
| `getFileBytes` | dispatch + `PUBLIC_ALLOWED_ACTIONS` + `MEMBER_ALLOWED_ACTIONS` + `ADMIN_ACTION_PERMISSIONS` + build/audit ×3（admin/member/public 全境界） |
| `adminLoginWithData` | dispatch + `ADMIN_LOGIN_ACTIONS` + build-admin/audit-admin |
| `memberLoginWithData` | dispatch + `MEMBER_ALLOWED_ACTIONS` + `LOGIN_ONLY_MEMBER_ACTIONS` + build-member/audit-member |

| 種別 | 内容 |
|---|---|
| 🔧 | 上記に加え、v376.17 で消し忘れていた `sendTrainingMailSegmented` / `getTrainingMailSendLogs` の `ADMIN_ACTION_PERMISSIONS` dead エントリも除去（audit は perm マップを検証しないため見逃されていた） |
| 📝 | 関数本体 `createMember_` / `updateMembersBatch_` / `getFileBytes_` / `getMemberTrainingHistory_` は build pruner が全 3 生成物から自動除去（検証: 生成 Code.gs 内 0 件）。source には残置（切り離された機能実装であり再利用余地あり・二重管理ではない）。完全な source 撤去は軽微なフォローアップ |
| ✅ | 3 split ビルド + prerelease 全通過。3 境界の audit が dispatch==許可リスト整合を検証 |

**挙動変更**: 上記 endpoint は呼ぶと unauthorized/未定義になる（いずれも呼び出し元ゼロを検証済のため実害なし）。**デプロイは全 3 split 必要**（A-2/A-1 の挙動不変分も同梱）。本コミット時点では未デプロイ。

---

## v376.21 — 2026-05-27 🛡 二重管理の解消④: 申込者解決のガードレール（敢えて統合しない判断）

監査で「申込者解決ロジックの重複」とされた箇所を精読した結果、**真の重複ではなく異なる 2 モデルの併存**と判明したため、機械的統合は行わず誤用防止のガードレールを追加した（方針: 無理にまとめない）。

| モデル | 関数 | 用途 |
|---|---|---|
| canonical（v360・STAFF 独立 type） | `getCanonicalApplicantRef_` | 送信先メール・名簿表示・本人解決 |
| legacy（MEMBER + 別途 職員ID） | `getApplicationApplicantType_` / `getApplicationApplicantId_` / `getMemberIdFromApplication_` | 整合性検証 `getTrainingApplicationIntegrityIssues_`・会員申込フィルタ |

| 種別 | 内容 |
|---|---|
| 🛡 | legacy 3 関数と `getCanonicalApplicantRef_` に使い分けの警告コメントを追加。「送信先・名簿・本人解決は必ず canonical を使う／legacy を使うと STAFF 申込が会員誤解決され事業所代表メールへ誤送信（v376.12 で実際に発生）」を明文化 |
| 📝 | 整合性検証は MEMBER/EXTERNAL の 2 分岐のみで legacy モデル前提に組まれており、canonical への機械的置換は検証ロジックを壊す（＝申込有効性ゲートに影響）と確認。よって統合せず温存 |

**コメントのみ・挙動不変**（非コメントのコード行変更ゼロを git diff で確認）。デプロイは A-2 と同様、次の backend 機能変更時に同梱。prerelease 全通過。

---

## v376.20 — 2026-05-27 🔧 二重管理の解消③: シート読取ヘルパーを一本化

backend `gas-src/Code.full.gs` で機能同一だった 2 つのシート読取ヘルパーを統合。`getSheetData_(sheet)`（ヘッダ行→オブジェクト配列化、19 箇所で使用）を、同一実装の `getRowsAsObjectsFromSheet_(sheet)` に置換し `getSheetData_` を削除。

| 種別 | 内容 |
|---|---|
| 🔧 | `getSheetData_` の 18 呼び出しを `getRowsAsObjectsFromSheet_` に置換、定義を削除。両者は「ヘッダ行を key に値をオブジェクト化」する同一ロジック（A1 起点の DB シート前提で出力完全同値）と検証済み |
| 📝 | 全呼び出しが sheet オブジェクトを渡している（ss 誤用なし）ことを事前確認。差分が純粋なリネーム + 定義削除のみであることを git diff で確認 |

**挙動不変**（等価ヘルパーへの置換）。3 split すべての `Code.gs` が変化するが runtime 動作は同一のため、**単独再デプロイは行わず次の backend 機能変更（A-1: 申込者解決の統合）のデプロイに同梱**。typecheck + prerelease 全通過。

---

## v376.19 — 2026-05-27 🔧 二重管理の解消②: 未使用 frontend API メソッド削除

全機能の二重管理監査の是正 第2弾。frontend `api.ts` で**どのコンポーネントからも呼ばれていない 6 メソッド**を削除（grep で呼び出しゼロを検証済）。**機能変更なし・本番再デプロイ不要**（dead code 除去のみ。bundle が縮小するだけで挙動不変）。

| 削除した API メソッド | 備考 |
|---|---|
| `adminLoginWithData` / `memberLoginWithData` | v150 のログイン+ポータル統合 API。`checkAdminBySession` / `memberLogin` に置換済の廃止予定コード |
| `createMember` | 会員作成。入会は公開申込 + 承認フロー（`createMemberApplicationDirect_`）が正路 |
| `updateMembersBatch` | 一括更新。未配線 |
| `getMemberTrainingHistory` | 研修履歴取得。未配線。孤立した型 `TrainingHistoryEntry` も撤去 |
| `getFileBytes` | v357 PDF lightbox 用 bytes proxy。現状は `getFileThumbnail` で代替 |

検証: 各メソッドは backend dispatch handler 以外に内部呼び出しが無いことも確認済（完全デッド）。ただし backend endpoint・権限/許可リストの削除は、同じ action レジストリを触る A-3（action 名の単一情報源化）でまとめて実施するため**本リリースでは frontend のみ**。typecheck + prerelease 全通過。

---

## v376.18 — 2026-05-27 🔧 二重管理の解消①: admin build keep-list の単一情報源化

全機能の二重管理監査（メール送信以外）の是正 第1弾。**生成物に変更はなく本番再デプロイ不要**（build / audit ツールのみの整理。`gas/admin/Code.gs` はバイト単位で不変を確認）。

| 種別 | 内容 |
|---|---|
| 🔧 | admin build が残す top-level callable 関数の許可リスト（22項目）が、`build-admin-gas.mjs` の pruning seed・assertAllowed・`audit-admin-boundary.mjs` の3箇所に同一配列で手書きされていた。`gas-boundary-utils.mjs` の `ADMIN_TOP_LEVEL_FUNCTIONS` に単一情報源化 |
| 🔧 | 強制削除する forbidden top-level 関数リスト（6項目）の build / audit 2コピーを `ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS` に単一情報源化 |
| 📝 | 検証: リファクタ後に `build:gas:admin` を再実行し `gas/admin/Code.gs` の md5 が変化しないこと（挙動不変）+ prerelease 全通過を確認 |

※ `build-admin-gas.mjs` が `gas-boundary-utils.mjs` の utility 関数群（`collectFunctionDeclarations` 等）の独自コピーを持ち実装が乖離している件は別レイヤの重複として残課題（挙動変化リスクがあるため本リリースでは非対象）。

---

## v376.17 — 2026-05-27 🔧 メール送信の整理（差し込み一本化 + 未使用 segment 削除）

メール送信機能の棚卸し。送信の最下層は従来どおり `deliverMail_` → `sendEmailWithValidatedFrom_` → `MailApp/GmailApp` に完全集約されており（全送信箇所が `deliverMail_` 経由）、ここは変更していない。1 段上の重複のみ整理した。

| 種別 | 内容 |
|---|---|
| 🔧 | 差し込みタグ置換（`{{氏名}}` `{{事業所名}}` `{{会員番号}}` 等）を、`sendTrainingMail_` / `sendBulkMemberMail_` のインライン `.replace(/\{\{…\}\}/g, …)` チェーンから、汎用の `renderBizEmailTemplate_(template, vars)` に一本化。タグ追加時の漏れ・不整合を防止。`null/undefined` は空文字に正規化（従来の `"undefined"` 混入も解消） |
| 🔧 | frontend から一切呼ばれていなかった研修メール segment 送信を削除し、研修メール送信を現役の `sendTrainingMail_` に一本化。削除対象: backend `sendTrainingMailSegmented_` / `getTrainingMailSendLogs_` と action handler、`api.ts` の同名メソッド、`types.ts` の `TrainingMailSegment` / `TrainingMailSegmentedPayload` / `TrainingMailLogHeader` / `TrainingMailLogDetail`、`build-admin-gas.mjs` / `audit-admin-boundary.mjs` の許可リスト |
| 📝 | 「まとめない」判断: 宛先構築ロジック（研修=3-FK XOR 申込者解決 / 一括=年度別メーリングリスト）と添付方式（applyId 別 Drive / 姓名部分一致の自動添付）は本質的に異なるため、各送信関数で個別維持（無理な共通化はしない） |

機能変更は admin のみ。デプロイ: admin `@177`（member/public はコメント/bundle 再生成差分のみで未 redeploy、次回機能リリース時に同期）。

---

## v376.16 — 2026-05-27 🐛 研修管理 新規入力を画面表示中は保持

| 種別 | 内容 |
|---|---|
| 🐛 | 新規研修登録の入力中に一覧から既存研修を選ぶと、共有していた `form` state が上書きされ入力内容が消えていた問題を解消 |
| 🔧 | 新規入力を `pendingNewForm` へ退避（`loadTraining`）し、既存研修の詳細モーダルを閉じると右ペインへ復元（`closeDetail`）。研修管理画面を開いている間は新規入力を保持する |
| 🔧 | 既存研修の削除・復元後も `closeDetail` 経由で退避中の新規入力を保持（従来は `startNew` で破棄していた） |
| 🐛 | v376.15 で混入した「新規作成成功後に右ペインが空白化」を解消。新規作成（`isNew`）成功時は空フォームへ戻し `isNew` を維持して連続登録に対応。既存更新（モーダル）はモーダルを開いたまま最新値を反映 |

対象: `src/components/TrainingManagement.tsx`。admin shell のみ。デプロイ: admin `@176`（member/public は据え置き）。

---

## v376.15 — 2026-05-27 🔧 研修管理 右ペインを新規登録専用エリアに固定

| 種別 | 内容 |
|---|---|
| 🐛 | 研修を選択 → 詳細モーダルを閉じると、右ペインがプレースホルダー（「左の一覧から選択するか…」）に戻り、一覧は選択ハイライト維持という宙ぶらりんなデッド状態になっていた問題を解消 |
| 🔧 | v376.11 で既存研修の編集・名簿・メールがすべてモーダルへ移行済のため、右ペイン（`lg:col-span-2`）を「新規登録専用エリア」として固定。プレースホルダー／空表示を含む3状態を、新規登録フォームのみの1状態に簡素化 |
| 🔧 | 既存研修の詳細モーダルを閉じると `startNew()` を呼び、右ペインを新規登録フォームへリセット＆一覧選択を解除（`onClose=startNew`） |
| 🔧 | `isNew` ブランチ内に残っていた到達不能な `panelView === 'roster'/'mail'` 分岐（デッドコード）を除去 |

対象: `src/components/TrainingManagement.tsx`。admin shell のみ。デプロイ: admin `@175`（member/public は据え置き）。

---

## v376.14.2 — 2026-05-27 ✅ ドライランテスト 実施完了 + cleanup 強化

| 種別 | 内容 |
|---|---|
| 🎉 | 研修管理 全機能ドライランテストを本番 DB で実施 → **15/15 PASS**（v376.12 の STAFF メール個人解決の回帰確認を含む）。テストデータは全 run 分を物理削除済（残骸ゼロ） |
| 🔧 | `cleanupDryRunTrainingManagement` を「manifest 参照のみ」から「manifest + DRYRUN_ プレフィックス全研修 sweep」に強化。cleanup 前に再実行して manifest が上書きされても孤児データを確実に回収・物理削除（冪等） |

デプロイ: admin `@174`。

---

## v376.14.1 — 2026-05-27 🐛 ドライランテスト関数の自己バグ修正

| 種別 | 内容 |
|---|---|
| 🐛 | 初回 run で 3 件 FAIL（いずれもテスト構築側の不備、本番コードは正常）。STAFF 申込挿入を `申込者区分コード='STAFF'`（`isTrainingApplicationRowValid_` が弾く）から本番同型（`区分コード='MEMBER'` + `申込者ID=親会員ID` + `職員ID` 併記、canonical ref が職員ID優先で STAFF 解決）に修正 |
| 🐛 | `saveAttendanceBatch_` の payload を生配列から `{ entries: [...] }` 形式に修正 |
| 📝 | この FAIL は `isTrainingApplicationRowValid_`（integrity 検証）が不正な区分コードを正しく除外している証拠でもあった |

デプロイ: admin `@173`。

---

## v376.14 — 2026-05-27 ✅ 研修管理 全機能ドライランテスト基盤

| 種別 | 内容 |
|---|---|
| ✅ | `dryRunTrainingManagement()` を追加 — 15 項目の機能網羅テスト（CREATE/READ/UPDATE/ゲスト追加/STAFF申込/名簿取得/メール対象解決(v376.12回帰)/出欠単・一括/集計/メモ/キャンセル/soft delete/一覧除外/復元） |
| ✅ | `cleanupDryRunTrainingManagement()` を追加 — manifest 記録した training / 申込 / 外部申込者を物理削除（行番号降順 deleteRow） |
| 📝 | メール送信は実行せず `getTrainingApplicants_` の対象解決のみ検証（誤送信なし）。2026 CRUD/integration test best practice 準拠 |
| 🔒 | build keep-list 3 箇所 + audit-admin-boundary allowlist に登録 |

デプロイ: admin `@172`。テスト関数のみ追加・既存挙動への影響なし。

---

## v376.13 — 2026-05-26 🐛 メール送信のチェックボックス再選択バグ修正

| 種別 | 内容 |
|---|---|
| 🐛 | TrainingMailSender の `toggleSelect` で「全員選択モード（excludedIds による除外管理）」のとき、一度 click で除外した行を再 click しても除外解除されないバグを修正 |
| 🔧 | null-branch のロジックを `next.add(applyId)` から `has(applyId) ? delete : add` (toggle) に変更。状態遷移が対称になり、check ↔ uncheck が両方向で動作 |

デプロイ: admin `@171`。UI バグのみ・API/DB 影響なし。

---

## v376.12 — 2026-05-26 🐛 メール送信: 事業所職員の誤送信修正

| 種別 | 内容 |
|---|---|
| 🐛 | **重要バグ修正**: 事業所職員 (STAFF) の研修申込が、メール送信画面で事業所代表 (MEMBER) 扱いされ、送信先が事業所代表メール宛になっていた問題を解消 |
| 🐛 | 原因: `getTrainingApplicants_` / `sendTrainingMail_` 両方が legacy `getApplicationApplicantType_` を使用していた。これは申込レコードに `職員ID` と `会員ID` が両方ある場合、`会員ID` で MEMBER 判定してしまう仕様。`getTrainingRosterDetail_` (名簿) は v360 modern `getCanonicalApplicantRef_` (3-FK XOR) を使うため正常動作していた |
| 🔧 | `getTrainingApplicants_` と `sendTrainingMail_` を `getCanonicalApplicantRef_` ベースに統一し、`T_事業所職員` を staffMap として参照。STAFF は職員姓名・職員個人メール・親事業所の勤務先名で解決 |
| 🎨 | フロント `TrainingApplicantRow.applicantType` を `'MEMBER' \| 'STAFF' \| 'EXTERNAL'` の 3 値に拡張。送信画面の区分バッジに「事業所職員」(violet) を追加 |

デプロイ: admin `@170`。public/member は無変更（fetchAllData 系は別経路）。仕様変更ゼロ・DB 不変・セキュリティ影響なし（職員メールは既に admin が名簿で閲覧可能だった情報）。

---

## v376.11 — 2026-05-26 🎨 研修詳細を大画面モーダルへ

| 種別 | 内容 |
|---|---|
| 🎨 | 既存研修選択時を画面右パネルの圧迫表示から **大画面モーダル** へ移行（モバイル full-screen / デスクトップ 95vw × 95vh max-w-1600px） |
| 🎨 | `TrainingDetailModal.tsx` を新規作成 — ESC / backdrop / focus restore / body scroll lock / sticky header + tabs / iOS safe-area 対応 |
| 🎨 | 編集 form を `renderEditForm()` 関数に extract — inline (新規登録) とモーダル (既存編集) で同じ JSX を共有 |
| 🎨 | inline 右パネルは新規登録時のみ表示。既存選択時はプレースホルダ「← 研修一覧から選択してください」 |
| 📝 | グローバル best practice 準拠 — UXPin 2026 modal a11y guide / WCAG 2.2 / Material UI responsive pattern |

デプロイ: admin `@169`。仕様変更ゼロ・API 不変・新規登録機能は従来通り。

---

## v376.10 — 2026-05-26 🎨 研修管理 UX 微調整

| 種別 | 内容 |
|---|---|
| 🎨 | 研修選択時の既定ビューを `form` (編集) → `roster` (名簿・出欠) に変更。業務頻度の最も高い操作にデフォルト位置を寄せる |
| 🎨 | パネル上部のタブボタン順を **名簿/出欠 → メール送信 → 編集 → 削除** に並べ替え。「日々の運用」操作を左に集めて到達性向上 |

デプロイ: admin `@168`。仕様変更ゼロ・API 不変・DB 影響なし。

---

## v376.9 — 2026-05-26 ⚡ パフォーマンス監査 + 最適化

| 種別 | 内容 |
|---|---|
| ⚡ | **backend** `approveAdminChangeRequest_` の staffRemove ループ内の `getRowsAsObjects_(ss, 'T_事業所職員')` をループ外にホイスト。N 名削除時の sheet 読込回数を N → 1 回に削減 |
| ⚡ | **frontend** 3 箇所の `loadAppData({includeAdminSettings: true})` を `false` に変更。SystemSettings 不変なシナリオで `getSystemSettings` の API 往復を削減（会員詳細を開く時 / 職員一括保存 成功時・エラー時） |
| 📝 | グローバル best practice 準拠 — Google Apps Script: batch read 推奨 + 「Reduce calls to other services」、React 19: useEffect 不要再実行 / dependency 安定化（React Compiler 自動メモ化への準備） |
| 📝 | 採用しなかった項目（記録のみ）: `getMemberPortalData_` の per-user cache 化（invalidation 複雑度 ↑）/ `addPublicStaffMember_` 内 sheet 読込（API 変更必要） |

デプロイ: member `@107` / admin `@167`。public は backend/Code.gs 無変更のため `@348` 維持。仕様変更ゼロ・DB 操作なし・セキュリティ影響なし。

---

## v376.8 (sync) — 2026-05-26 🔧 ドキュメント・成果物整合性

| 種別 | 内容 |
|---|---|
| 🔧 | v376.1〜v376.8 の累積 build 成果物（backend / gas/member / gas/admin Code.gs + index.html）を git に同期。runtime と source の差分ゼロに |
| 🔧 | member split `@106` 再デプロイ（`mapTrainingRowsForApi_` の isDeleted field 追加 + `clearTrainingManagementCache_` 二重 key 対応を反映。member 側は機能影響なし、source-runtime sync 目的） |
| 🔒 | `scripts/audit-admin-boundary.mjs` allow-list に v376 系で追加した admin editor 関数 5 つ + dispatcher action 2 つを登録（prerelease gate PASS 復旧） |
| 📝 | HANDOVER.md / docs/00_DOC_INDEX.md / docs/09_DEPLOYMENT_POLICY.md / release-notes 全てを最新 deployment と整合 |
| 📝 | feedback memory 3 件追加: admin editor keep-list / editor ▶ 引数なし制約 / async busy 解除位置 |

デプロイ後の固定 deployment: public `@348` x2 / member `@106` / admin `@166`。

---

## v376.8 — 2026-05-26 🎨 研修管理 — 名簿・メール送信 UX 改修

| 種別 | 内容 |
|---|---|
| 🎨 | **TrainingRoster**: 二重タイトル削除（タブで明示済）/「研修一覧へ戻る」リンク廃止 / ボタン 3 階層化（primary=申込追加、neutral=CSV・更新、destructive=取消）/ 申込者追加を drop-down 化（会員 / ゲスト） |
| 🎨 | **TrainingRoster**: フィルターを segmented control に（区分・出欠の各 4〜6 個ボタン）。検索 + 件数を別段に分離 |
| 🔒 | **TrainingRoster**: 「表示全員 出席」「表示全員 欠席」一括ボタンを廃止 → **選択ベース**（checkbox で行選択 → selection toolbar で実行）に変更。誤操作リスク低減 |
| 🎨 | **TrainingRoster**: テーブルに checkbox 列追加 + 行 hover ハイライト + ステータス色分け |
| 🎨 | **TrainingMailSender**: 「研修メール送信」見出し削除（タブで明示）/ 全員選択・解除ボタンを segmented 同等スタイルへ |
| 🎨 | **TrainingManagement**: パネル見出しを `編集: タイトル` / `名簿: タイトル` / `メール送信: タイトル` から **タイトル単体** に集約 |
| 📝 | グローバル enterprise UX 準拠 — Salesforce Lightning + Mobbin segmented control + NN/g filter pattern + WCAG 2.2 AA |

デプロイ: admin `@166`。API 変更なし・公開ポータル影響なし。

---

## v376.7 — 2026-05-26 🆕 研修管理 — フィルター + soft delete

| 種別 | 内容 |
|---|---|
| 🆕 | **研修削除機能**を追加（soft delete = `削除フラグ=true`、物理削除しない）。申込実績がある場合は警告ダイアログ。削除済表示時は「復元」ボタンで取消可能 |
| 🆕 | **研修一覧フィルター** UI 追加 — 年度（既定: 今年度・日本式 4 月開始）/ 状態（申込受付中・締切済・削除済）/ キーワード検索（研修名+主催者） |
| 🆕 | 件数表示「フィルター後 N / 全 M 件」で透明性確保 |
| 🔧 | `getTrainingManagementData_` で削除済も含めて返却し `isDeleted` フラグ付与（admin 側のみ。公開ポータルは `fetchAllData_` 別パスで filter 維持・**影響ゼロ**） |
| 🔧 | バックエンドに `softDeleteTraining_` / `restoreTraining_` 追加。権限 `MASTER/ADMIN/TRAINING_MANAGER` のみ（`TRAINING_REGISTRAR` は登録専用） |
| 📝 | DB スキーマ変更ゼロ（`削除フラグ` 既存列を利用）。グローバル UX best practice 準拠（Salesforce/Tableau 既定 = current fiscal year、NN/g filter 7 項目以内、progressive disclosure） |

デプロイ: admin `@165`。

---

## v376.6 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🐛 | 承認/却下 API 完了→`load()` 再取得開始の隙間で「承認してDBに反映」「却下」ボタンが再押下できてしまうバグ修正。`setBusy(null)` を `finally` ブロックのみに戻し、load() 完了（カード filter で消失）まで一貫して disabled を維持 |
| 🔧 | v376.5 で導入した `setBusy(null)` の前倒し配置は二重押下リスクを生んだため、安全側に振り戻し。ボタン文字列「処理中…」は load() 完了まで残るが、これは正しい挙動（処理は実際に継続中） |

デプロイ: admin `@164`。

---

## v376.5 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🐛 | 変更申請の承認/却下後に「処理中…」ボタン文字列が滞留するバグ修正。`setBusy(null)` を `await load()` の前に移動 |
| 🐛 | 承認成功時に空オブジェクト `{}` が緑色のコードブロックで冗長表示されるバグ修正。`actionResult` state + JSON.stringify プリレンダー削除（既に alert で完了通知済） |
| 🔧 | 不要 API 往復洗い出し: 承認後の `await load()` は他 admin との並行整合性のため残置。`loading` / `actionError` / `expanded` state は必須機能のため残置。最終判断: メイン 2 点のみ修正 |

デプロイ: admin `@163`。影響範囲は `src/components/ChangeRequestConsole.tsx` のみ（バックエンド・データロジック影響ゼロ）。

---

## v376.4 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🧹 | テストデータ棚卸し・soft delete 機能を追加（`deleteTestDataPreview_LOG` / `deleteTestData_APPLY`）。条件: T_認証アカウント `demo-*` / T_会員 `DEMO-*` / 上記に紐づく職員 / T_外部申込者 氏名・フリガナに「テスト/ガイブ/セイゴウカクニン」を含む |
| 🎉 | 本番 DB のテストデータ削除実施 — T_外部申込者 3 件（`テスト タロウ` / `ガイブ テストイチロウ` / `セイゴウカクニン タロウ`）を soft delete。demo-* / DEMO-* は検出ゼロ（過去に cleanup 済 or 未投入）|

デプロイ: admin `@162`。

---

## v376.3 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🔧 | `inspectDryRunManifest_LOG` を追加（`previewDryRunApplicationCleanup` が return のみで Logger.log しない仕様への補助）。実行結果: manifest 未保存を確認（過去 dryRun テストデータの残骸ゼロ）|

デプロイ: admin `@161`。

---

## v376.2 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🎉 | **migration 本実行完了** — T_会員 180 rows / T_事業所職員 173 rows / T_外部申込者 3 rows、計 356 rows / 804 cells を全角カタカナへ変換。エラーゼロ。dryRun と件数完全一致 |
| 🔧 | `backfillKanaToFullwidth_APPLY()` ラッパー追加（editor ▶ ボタンが引数なしで実行する制約を回避し、1-click で本実行を可能化） |

デプロイ: admin `@160`。

---

## v376.1 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🐛 | `backfillKanaToFullwidth` が build pruner に削除され admin editor の関数選択に出ないバグを修正。`scripts/build-admin-gas.mjs` の keep-list に追加 |

デプロイ: admin `@159`。

---

## v376 — 2026-05-23

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **フリガナ（セイ/メイ/フリガナ）の保存形式を全角カタカナに統一**。ひらがな・半角カナ・全角カタカナの混在入力を受け付け、保存時に NFKC + ひらがな→カタカナ + 全角スペース正規化を適用。中点 `・` と長音 `ー` のみ追加許容、それ以外（漢字・英数字）は throw | `src/utils/kanaNormalize.ts` |
| 🆕 | `normalizeKana()` / `normalizeAndValidateKana_()` を frontend (TS) + backend (GAS) 両方に実装（同一ロジック・冪等性確認済） | — |
| 🆕 | `backfillKanaToFullwidth({dryRun})` 移行関数を追加（T_会員 / T_事業所職員 / T_外部申込者 対象。dryRun=true で件数確認 → admin 承認後 dryRun=false で本実行） | — |
| 🔧 | 旧 `toHalfWidthKana` (frontend) を `normalizeKana` 呼び出しに置換 — MemberForm / MemberDetailAdmin / StaffDetailAdmin / MemberApplicationForm / MemberUpdateForm / TrainingRoster | — |
| 🔧 | バックエンド書込関数（saveMemberCore_ / overwritePublicApplicationMemberFields_ / overwritePublicApplicationStaffFields_ / submitPublicChangeRequest_ / normalizeStaffNameFields_）で正規化 + validation を信頼境界として強制 | — |
| 🔧 | 旧 `isHalfWidthKana` バリデーション（v131 系）を削除。ポリシー反転（半角強制 → 全角強制） | `validateMemberPayload_` |
| 📝 | 19 ケースの Vitest 単体テスト追加 (`scripts/test-kana-normalize.mts`)。`npm run prerelease` gate に組み込み | — |

実装方針: T_変更申請 pending レコードは migration 対象外（承認時 `approveAdminChangeRequest_` → 各 save 関数で正規化されるため）。

デプロイ予定: 3 split を build → push → redeploy → migration dryRun → 確認 → 本実行。

---

## v374.1 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **公式LINE投稿依頼コンソール**を管理者ポータルに新規追加。3 状態ライフサイクル（DRAFT → REQUESTED → POSTED）+ Drive 添付（画像/PDF・10MB）+ Polymorphic association（GENERAL / TRAINING、将来拡張可）+ LINE 風プレビュー | `docs/246_DESIGN_LINE_POST_REQUEST_2026-05-21.md` |
| 🆕 | T_LINE投稿依頼テーブル / 2 SystemSettings (`LINE_POST_ASSETS_FOLDER_ID` / `LINE_POST_NOTIFY_EMAIL`) / 6 admin API actions | `docs/03_DATA_MODEL.md` §4 |
| 🐛 | build pruner が関数内 `if (action === ...)` を dispatcher case と誤認する問題を回避するため、handler のパラメータ名を `action` → `transAction` に変更 | — |
| 🐛 | build parser が regex literal `/.../` を line comment と誤認する問題を回避するため、handler 内 regex を String 操作に置換 | — |

デプロイ: integrated/public `@346` x2 / member `@103` / admin `@155`

---

## v374 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 📝 | WCAG 2.2 AA 自動アクセシビリティテスト基盤導入（`@axe-core/playwright`、`scripts/test-a11y.mjs`、CI gate 対応） | `docs/244` |
| 📝 | 新 UI 追加時の必須回帰チェックリスト整備 | `docs/245` |
| 📝 | レスポンシブテストを `npm run test:responsive` / `:admin` / `:member` へ昇格 | — |
| 🐛 | 入会 hero badge `bg-emerald-600` (4.46:1, AA 未達) → `bg-emerald-700` (5.7:1, AA 準拠) | `src/public-portal/App.tsx` |
| 🐛 | `responsive-test.mjs` の sr-only skip link false-positive 解消 → 21/21 セル合格 | — |
| 🎉 | **WCAG 2.2 AA 自動検出範囲で違反ゼロ達成**（本番 a11y scan で critical/serious/moderate/minor=0 確認） | — |

デプロイ: integrated/public `@344→@345` x2 (legacy + 正式)、member `@102` 維持、admin `@153` 維持。

---

## v373.7 — 2026-05-20 🎉 Sprint S5 完了

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 2 弾: GAS バックエンドの旧 RosterExport コードを完全削除（-1,599 行 + 自動 pruning で 315 関数削減） |
| 🔧 | ALLOWED_ACTIONS マップから 10 action 削除、dispatcher case 群削除 |
| 🔧 | `initializeSchema_` の旧キー seed 撤去、`SystemSettings.rosterTemplateSsId` pass-through 撤去 |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md`
デプロイ: integrated/public `@344` x2 / member `@102` / admin `@153`

---

## v373.6 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 1 弾: 旧 RosterExport の front-end を完全削除（4 component / 137 行の UI / 10 ApiClient メソッド / 5 旧型定義、計 -2,447 行） |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md`

---

## v373.5 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | パスワード pepper を Google Cloud Secret Manager 連携化（CacheService → SM → Script Properties の 3 階層 fail-soft） |
| 🔒 | 3 split に `cloud-platform` OAuth scope 追加 |
| 🔒 | `healthCheckPasswordPepper` admin top-level 関数追加（fingerprint 比較で値の一致性検証） |
| 📝 | 次段階 Cloud Run Argon2id 外部 KDF の完全設計書 + 実装雛形（`cloud-run/password-hash-service/`） |

operator 対応: GCP 利用判断時に `docs/239` 30 分手順を実施。
詳細: `docs/241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md` / `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`

---

## v373.4 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 行フィルタ no-code UI 化（演算子記号 `=, >, <, ≥, ≤` を日本語ラベル化、enum/boolean 演算子廃止、年度フィールド除外、否定全廃） |

詳細: `docs/238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md`

---

## v373.3 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 条件付き書式 UX 微調整（year picker / equals 削除 / 否定削除 / filterYear 自動 prefill） |

詳細: `docs/237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md`

---

## v373.2 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🐛 | PDF 出力で全件が出ない問題を React Portal + `display: none` パターンで修正（`position: absolute` を撤去・MDN/react-to-print 既知問題対応） |
| 🔧 | 条件付き書式 UI を Airtable 風（フィールド + 演算子 + 値 + プリセット）に刷新、式入力を完全廃止 |
| 🔧 | 計算列を 8 プリセット選択化、textarea 廃止 |
| 🔧 | drag handle 改善（左端に全高 grip カラム、`cursor: grab/grabbing`） |

詳細: `docs/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md`

---

## v373.1 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 PDF 出力（`window.print()` + 動的 `@page` CSS、用紙 A4/A3/B5・縦横・フォントサイズ） |
| 🐛 | v373.2 で PDF Portal 化に修正 |

詳細: `docs/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md`

---

## v373 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 計算式 + 条件付き書式（jsep + 自前 AST walker、eval/Function/MemberExpression 全 reject、関数 allowlist 16 種、AST 深さ 32 上限、攻撃シナリオ含む 33 unit tests） |
| 🔒 | Web 検索 2026-05-20 ベースで `expr-eval`(RCE 2026) / `jse-eval`(no sandbox) を不採用、`jsep` のみ採用 |

詳細: `docs/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md`

---

## v372.9 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 出力列を `@dnd-kit` で drag-drop 並び替え |

デプロイ: admin split `@145`。詳細: `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`

---

## v372.8 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 列幅 (60-320px) + 日付/数値書式設定 |

詳細: `docs/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`

---

## v372.7 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | 第三者評価 2026-05-20 指摘 #1 対応: `getFileThumbnail_()` / `getFileBytes_()` の Drive fileId proxy を `T_研修.案内状URL` / `案内状サムネイルURL` 登録 fileId のみに制限（fail-closed） |

詳細: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`

---

## v372 〜 v372.6.1 — 2026-05-19 〜 20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 Visual Designer 骨組み（v372 S1）、フィールド辞書 36 件、テンプレ保存、CSV 出力、Tab UI、出力単位（会員/職員/混合）、列フィルタ |
| 🆕 | 公開ポータルに staffUpdate（既存職員情報変更）追加 |
| 🐛 | UTF-8 文字化けバグ修正 |
| 🔧 | CM 番号 admin 例外バリデーション緩和 |
| 🐛 | 公開ポータル変更申請 送信ボタン disable + ヒント表示 |

詳細: `docs/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md`

---

## v371 系 — 2026-05-18 〜 19（メール送信制御）

| 種別 | 内容 |
|---|---|
| 🔒 | メール送信 4 階層ガード導入（GLOBAL_ENABLED / MODE: LIVE/REDIRECT/SUPPRESS / ALLOWLIST / CATEGORY） |
| 🔒 | 初期値 `MAIL_GLOBAL_ENABLED=false`（safe-stop で着地） |

詳細: `docs/227_MAIL_KILL_SWITCH_2026-05-18.md`

---

## v360 〜 v370 — 2026-05-16 〜 17

研修名簿・出欠管理・一括メール明細・DB schema 変更・dryRun synthetic transaction フレームワーク・転籍時バグ修正。

詳細: `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`（統合 release state）/ `docs/223` / `docs/226`

---

## v320 〜 v358 — 2026-05-11 〜 16

- v320〜v332: モバイル viewport / レスポンシブ全面強化 / WCAG 2.2 AAA / Playwright 自動テスト 98/98 セル / パスワード規約
- v333: 役員向け請求を活動報告 + 経費請求 2 系統化
- v334: 役員管理の状態編集 + 読み込み高速化
- v335: 入会申込キュー化 + 同一人物移行
- v336-v338: 検索改善
- v340-v345: 様々な修正（会員ステータスメモ、年会費管理遷移、schema-shift 構造的防止 等）
- v347-v358: PDF サムネイル + lightbox 反復改善

詳細: 個別 `docs/186-222_*.md` 参照（または `docs/archive/release_history/`）

---

## v260 〜 v319 — 2026-04-24 〜 05-09

セキュリティ是正（第三者評価 docs/109 対応）、認証認可、ポータル分離、パスワードハッシュ PBKDF2 移行、OAuth スコープ最小化、CI セキュリティゲート、admin/member ポータル split 化等。

詳細: 個別 `docs/139-196_*.md` 参照（または `docs/archive/release_history/`）

---

> **過去のリリース** (v200 以下) は `docs/archive/release_history/` に保管しています。
