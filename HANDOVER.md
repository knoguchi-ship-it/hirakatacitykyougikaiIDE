# 引継ぎ書（次担当者向け）

更新日: **2026-03-20（v108 フィールドレベルアクセス制御拡張 + F-05バグ修正）**
対象: 枚方市介護支援専門員連絡協議会 会員システム

---

## ⚠️ Claude Code 引継ぎ担当者へ — 最初に必読

本書は **Codex（OpenAI）→ Claude Code** への引継ぎ用に更新した。
次担当者は、まず本書と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を読み、現在の本番状態と次作業の境界を把握してから着手すること。

### Claude Code 向け引継ぎ注意事項

| 項目 | 内容 |
|------|------|
| 参照順序 | `HANDOVER.md` → `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` → `docs/12_ENGINEERING_RULEBOOK.md` の順で確認 |
| ブラウザ自動化 | Playwright/MCP は利用可。ただし Apps Script の `Manage deployments` は最終的に UI 確認が必要 |
| デプロイ方法 | `clasp push` + `clasp version` の後、固定 2 Deployment を同一 Version に揃えること |
| Git 状態 | `main` の最新コミットは `1f43c0f`（v106 テスト完了・@108 デプロイ済み）。**GitHub push は未実施** — 次担当者は `git push origin main` を実行すること |
| 作業ツリー | **クリーン**。`Dust/` は不要ファイル退避用で `.gitignore` 済み |
| 作業ディレクトリ | `C:\VSCode\CloudePL\hirakatacitykyougikaiIDE`（Windows） |
| シェル | PowerShell（必要に応じて bash 互換コマンドも可） |

---

## 1. 先に必ず読む文書（順番固定）

前提グランドルール:
- 技術選定・仕様提案・運用判断の前に、必ず Web 検索で最新の一次ソースを確認すること。
- 技術選定・仕様提案では、ベストプラクティスを模索し、本案件に適した案として提案すること。
- 根拠提示のない提案は、実装着手や完了判断の根拠にしないこと。
- 外部ベストプラクティスと案件正本が衝突した場合は、案件正本を優先し、差分を記録すること。

1. `docs/12_ENGINEERING_RULEBOOK.md`（**最上位ルール**。ここが全ての基準）
2. `docs/10_SOW.md`（スコープ・品質保証）
3. `docs/09_DEPLOYMENT_POLICY.md`（本番デプロイ標準・禁止事項）
4. `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`（根本エラー対応の標準）
5. `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`（`clasp run` 障害の実例）
6. `docs/05_AUTH_AND_ROLE_SPEC.md`（認証/権限仕様・変更禁止）
7. `docs/04_DB_OPERATION_RUNBOOK.md`（DB運用）
8. `docs/03_DATA_MODEL.md`（スキーマ定義）

> 矛盾が生じたら上位文書を正とし、下位文書を即日修正する。

---

## 1.1 次担当者向け・最短状況サマリ（このまま新スレッドへ貼付可）

- 本番Web URLは固定2本（会員/公開）で **@108 同期済み**（v106 フィールドレベルアクセス制御拡張）。
- テスト結果: バックエンド B-01〜B-10 全10件 PASS、フロントエンド F-01〜F-12 全11件 PASS + 1 SKIP、デプロイチェック D-01〜D-11 全11件 PASS。テスト仕様書: `docs/22_TEST_SPEC_v106_FIELD_ACCESS_CONTROL.md`。
- `main` 最新コミット `1f43c0f`、`git status --short` は空。**GitHub push 未実施** — 次担当者は最初に `git push origin main` を実行すること。
- `clasp run` 障害は、既定OAuthクライアントが組織でブロックされたことが原因。
- 復旧済み手順:
  - `npx clasp logout`
  - `npx clasp login --creds .tmp/oauth-client-uguisu-gas-exec.json --use-project-scopes --no-localhost`
  - `npx clasp run healthCheck` 成功、`npx clasp run getDbInfo` 成功を確認済み。
- 追加費用: この復旧対応自体では **発生なし**。
- 参照:
  - `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`
  - `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`

## 1.2 この時点の引き継ぎポイント

- スレッドを切っても問題ない状態まで、正本と引き継ぎは同期済み。
- 現在の本番固定 Deployment は会員/公開ともに **@108**。
- 公開ポータルは 2026-03-20 に MCP Playwright で再表示確認済み。
- 負荷試験用データは投入済み。`seedPerformanceTestData()` により、`個人会員 300名 / 事業所会員 30件 / 事業所職員 205名 / 認証 505件 / 年会費 660件 / 申込 378件` の状態で検証している。
- 直近の性能改善は反映済み。
  - 管理トップ: 軽量 API 化 + 50件デフォルトページング
  - 年会費管理: 対象年度取得の軽量化 + 25/50/100件切替 + ページング + 一括保存
  - 研修管理: `getTrainingManagementData` による軽量読込
- v97 で管理コンソール（会員管理）を全面リニューアル。
  - ダッシュボード6カード化（総会員数/個人会員数/事業所会員数/事業所会員メンバー数/今年度入会数/今年度退会数）
  - 多条件検索（会員種別/会員状態/入会年度/キーワード）+ フィルターチップUI
  - 全カラムソート（会員番号/氏名/種別/研修参加数/継続年数/状態）
  - 行クリックで会員詳細編集画面に遷移（MemberDetailAdmin）
  - 入会処理（`createMember_`）/ 退会処理（`withdrawMember_`）をバックエンド実装
  - 設定画面を独立ビュー（`admin-settings`）に分離
  - 年会費情報は年会費管理コンソールに完全移管（管理コンソールから削除）
- v99 で入会申込フォームを統合。個人会員/事業所会員/賛助会員の3種別対応マルチステップウィザード形式。
  - 事業所職員の権限を代表者/管理者/メンバーの3段階に拡張（`StaffRole = 'REPRESENTATIVE' | 'ADMIN' | 'STAFF'`）
  - `createMember_` の認証レコード書き込みバグ修正（`T_認証` → `T_認証アカウント`）
  - T_会員に `事業所番号` 列、T_事業所職員に `介護支援専門員番号` 列を追加
  - 入会完了時にログイン情報をメール送信（`sendCredentialEmail_`）
- v100 で公開ポータルを「枚方市介護支援専門員連絡協議会お申込みポータル」に再編。
  - 初期画面で「研修申込」「新規入会申込」を選択するトップ画面を追加
  - 新規入会を管理コンソールから削除し、公開ポータルへ移設
  - `submitMemberApplication` を公開 API 化し、ログイン不要で新規入会申込可能に変更
  - `updateMember_` に代表者権限制約のバックエンド強制を実装
- v104 で退会機能（年度末退会予約方式）を実装。
  - 会員マイページから退会申請・取消が可能
  - `WITHDRAWAL_SCHEDULED` 状態で年度末まで保留、自動昇格で `WITHDRAWN` に遷移
  - 事業所会員は代表者のみ退会申請可能、パスワード再認証必須
- v105 でフィールドレベルアクセス制御を実装（OWASP A01/CWE-915 準拠）。
  - サーバーサイド allowlist による Mass Assignment 防止（`updateMemberSelf_`）
  - 会員マイページの管理者専用フィールド（入会日・退会日・会員状態・年度中退会）を非活性化
  - `updateMember` は管理者専用（`ADMIN_REQUIRED_ACTIONS`）、会員は `updateMemberSelf` を使用
- v106 でフィールドレベルアクセス制御を拡張（NIST RBAC モデル準拠）。
  - `careManagerNumber` / `officeName` / `officeNumber` を会員 allowlist から除外
  - ロール別職員 allowlist 新設（`STAFF_WRITABLE_FIELDS_REPRESENTATIVE_` / `ADMIN_` / `SELF_`）
  - `updateMemberSelf_` に呼び出し元ロール判定を追加、STAFF は自分の氏名・フリガナ・メールのみ変更可
  - 退職日の自動記録（`ENROLLED→LEFT` 遷移時にバックエンドで自動セット）
  - 登録日の自動記録（新規職員作成時にバックエンドで自動セット）
  - 退職者の年度フィルタ（翌年度4/1からAPI応答に含めない、データは保持）
  - 職員削除ボタン廃止（退職ステータスで運用）
  - 退会日・年度中退会フィールドをフロントエンドから除去（全会員種別）
  - 権限変更は代表者のみ、状態変更は代表者・管理者のみ
  - STAFF 自己編集UI（自分の行のみハイライト+編集可）
  - 職員別研修モーダル新設（`StaffTrainingView.tsx`）
  - 仕様書: `docs/21_IMPL_SPEC_FIELD_ACCESS_CONTROL_v106.md`
- 未実装: 会員一括編集（`updateMembersBatch_`）は提案済み・未実装。
- 次の主作業は **会員一括編集（`updateMembersBatch_`）** および **UI/UX 継続改善**。
- Claude Code への次指示は `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` に整理済み。
- ただし修正後は毎回、`docs/09_DEPLOYMENT_POLICY.md` の事前チェック/完了判定に従って再確認すること。
- 2026-03-19 時点で **不要ファイルは `Dust/` に退避済み**。記録用スクリーンショット（`v98-*`）のみリポジトリ管理対象。

---

## 2. プロジェクト概要

### 2.1 システム構成

| レイヤー | 技術 | 用途 |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS | 会員マイページ・公開ポータル |
| Backend | Google Apps Script (GAS) + Google Spreadsheet | API + DB |
| メール | `MailApp.sendEmail` / `GmailApp.sendEmail` | リマインダー・確認メール・管理メール |
| 認証（会員） | ログインID + パスワード（SHA-256 ハッシュ） | `T_認証アカウント` テーブル |
| 認証（管理者） | Google アカウント + ホワイトリスト照合 | `checkAdminBySession_()` |

### 2.2 重要な固定値

| 項目 | 値 |
|---|---|
| Apps Script ID | `11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL` |
| DB スプレッドシート ID | `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` |
| GCP プロジェクト | `uguisu-gas-exec-20260225191000` |
| 運用アカウント | `k.noguchi@uguisunosato.or.jp` |

---

## 3. 本番デプロイの現状（2026-03-20 引継ぎ時点）

### 3.1 固定 Deployment ID（**絶対に変更禁止**）

| 用途 | Deployment ID | 現在 Version | URL |
|---|---|---|---|
| **会員マイページ** | `AKfycbycE2_ythCYSPwmPxvyfRzNLhWM7J1cX41TA2wjYgZgdI-P2uknYfQGh3AHrecCQ1Gk` | **@108** | `.../exec` |
| **公開ポータル** | `AKfycbxKoni2vBdvRbQWR6NyrroPHyNmElJNkJ5OTNOJMQ0k0z-Ae-oGeclrN3kxsE9yIXVr` | **@108** | `.../exec?app=public` |

> **鉄則**: 2 つの Deployment ID は常に同一バージョンへ同時更新。片方だけ更新禁止。
> `npx clasp deployments` では表示名が実UIの `Manage deployments` と一致しないことがある。最終判断は Apps Script UI の固定2 Deployment を正とする。

### 3.2 最新リリース（v106→v108）の変更内容

#### v106→v108（フィールドレベルアクセス制御拡張: NIST RBAC モデル準拠）
- v105 のフィールドレベルアクセス制御を NIST RBAC モデルに拡張
- ロール別職員 allowlist 新設（REPRESENTATIVE / ADMIN / STAFF の3段階）
- `careManagerNumber` / `officeName` / `officeNumber` を会員 allowlist から除外
- STAFF は自分の氏名・フリガナ・メールのみ変更可（他者データ変更拒否）
- 退職日の自動記録（`ENROLLED→LEFT` 遷移時）、登録日の自動記録（新規職員作成時）
- 退職者の年度フィルタ（翌年度4/1からAPI応答に含めない、データは保持）
- 職員削除ボタン廃止（退職ステータスで運用）
- 退会日・年度中退会フィールドをフロントエンドから除去
- 権限変更は代表者のみ、状態変更は代表者・管理者のみ
- 職員別研修モーダル新設（`StaffTrainingView.tsx`）
- v108 で F-05 バグ修正: `activeStaffRole` prop → `currentStaff?.role` state（デモ用操作ユーザー切替の追従修正）
- 操作ユーザーラベルに「(代表者)」表示を追加
- 仕様書: `docs/21_IMPL_SPEC_FIELD_ACCESS_CONTROL_v106.md`
- テスト仕様書: `docs/22_TEST_SPEC_v106_FIELD_ACCESS_CONTROL.md`

#### v105（フィールドレベルアクセス制御: OWASP A01/CWE-915 準拠）
- サーバーサイドフィールド allowlist パターンによる Mass Assignment 防止
- `updateMemberSelf_()` 新設: loginId→会員ID照合（なりすまし防止）+ allowlist フィルタ後に `updateMember_()` へ委譲
- `MEMBER_WRITABLE_FIELDS_` / `MEMBER_WRITABLE_STAFF_FIELDS_` をサーバー側定数として定義
- `updateMember_()` に `skipAdminCheck` パラメータを追加（`updateMemberSelf_` 内部呼び出し用）
- フロントエンド: `isAdmin` prop で管理者専用フィールド（入会日・退会日・会員状態・年度中退会チェックボックス・職員状態）を非活性化
- `isReadOnly` 判定に REPRESENTATIVE ロールを追加（事業所代表者も編集可能に修正）
- API クライアント: `updateMemberSelf()` メソッド追加、`handleMemberSave` でロール別 API 選択

#### v104（退会機能: 年度末退会予約方式の実装）
- 会員マイページに退会セクションを追加。会員自身が退会申請・取消を実行可能
- 年度末退会予約方式（`WITHDRAWAL_SCHEDULED`）: 退会申請すると年度末（3/31）まで退会予定状態、年度末経過後に自動的に退会確定
- 退会予定中もログイン・サービス利用が可能（`T_認証アカウント.アカウント有効フラグ` は変更しない）
- 退会予定中に会員自身で退会取消が可能（管理者介入不要）
- 事業所会員は代表者（REPRESENTATIVE）のみが退会申請可能
- パスワード再認証による本人確認を必須化（OWASP準拠）
- 会員状態バッジ: 在籍中（緑）/ 退会予定（橙）/ 退会済（赤）の3状態表示
- バックエンド: `withdrawSelf_()`, `cancelWithdrawalSelf_()`, `promoteScheduledWithdrawals_()` を追加
- 日付フォーマット修正: `mapMembersForApi_` の入会日・退会日を `normalizeDateInput_()` に統一（Date オブジェクトの文字列化バグ修正）
- v101〜v103 で発見・修正されたバグ: フロントエンドビルド成果物のバックエンドコピー漏れ、Date 表示フォーマット不正

#### v100（公開ポータル統合・公開入会導線・代表者権限制約実装）
- 公開ポータルの名称を「枚方市介護支援専門員連絡協議会お申込みポータル」に変更
- 公開ポータルの初期画面で「研修申込」「新規入会申込」を選択するトップ画面を追加
- 新規入会導線を管理コンソールから削除し、公開ポータルへ統合
- `submitMemberApplication_()` を公開 API として利用可能に変更（ログイン不要）
- `updateMember_()` に代表者権限制約のバックエンド強制を追加
- React 公式の conditional rendering / state reset と Apps Script Deployments 公式を根拠に、既存 `?app=public` を拡張する方針を採用
- 本番テスト: 管理画面から新規入会導線削除、公開ポータル表示、管理者セッション・`clasp run` 疎通まで PASS

#### v99（入会申込フォーム統合・3段階職員権限・認証レコード修正）
- 管理コンソール「+ 新規入会」から Googleフォーム風マルチステップウィザード形式の入会申込フォームを実装
- 3種別対応（個人会員/事業所会員/賛助会員）、種別ごとに異なるステップ構成
- 事業所職員の権限を代表者/管理者/メンバーの3段階に拡張（`StaffRole` 型変更）
- `createMember_` が `T_認証` に書き込んでいたバグを修正（正しくは `T_認証アカウント`）
- T_会員に `事業所番号` 列、T_事業所職員に `介護支援専門員番号` 列を追加（`rebuildDatabaseSchema` 実施済み）
- 新規 API: `submitMemberApplication_()` — 会員レコード・事業所職員レコード・認証アカウントレコードを一括作成
- 新規関数: `sendCredentialEmail_()` — 入会完了時にログインID/初期パスワードをメール送信
- 新規コンポーネント: `src/components/application/MemberApplicationForm.tsx`, `src/components/application/types.ts`
- 本番テスト: 個人会員の入会申込 → 会員番号自動生成 → 認証レコード作成 → メール送信 まで全行程 PASS

#### v98（hotfix: cache.put 100KB 超過対策）
- `CacheService.put()` が 100KB を超えると `引数が大きすぎます: value` エラーで alert が発生し、データ返却不能になる問題を修正
- 4箇所の `cache.put()` を try-catch で防御（`fetchAllDataFromDb_`, `getAdminDashboardData_`, `getTrainingManagementData_`, `getAnnualFeeData_`）
- v97 の 36.9 秒エラー → v98 で 15〜20 秒正常表示に改善

#### v97（管理コンソール（会員管理）全面リニューアル）
- ダッシュボード6カード（総会員数/個人/事業所/メンバー/今年度入会/退会）
- 多条件検索（会員種別/会員状態/入会年度/キーワード）+ フィルターチップUI
- 全カラムソート（会員番号/氏名/種別/研修参加数/継続年数/状態）
- 行クリックで会員詳細編集画面遷移（MemberDetailAdmin）
- 入会処理（`createMember_`）/ 退会処理（`withdrawMember_`）バックエンド実装
- 設定画面を独立ビュー（`admin-settings`）に分離

#### v96
- 年会費管理コンソールに列ソート・一括保存・楽観更新を実装

---

## 4. 絶対ルール（違反禁止）

### 4.1 デプロイ

- `clasp deploy --deploymentId` **使用禁止**（Web App → API Executable に変換するバグあり）
- 本番更新は必ず **Apps Script UI の `Manage Deployments`** から手動操作
- 両 Deployment ID を **同時に同一バージョンへ更新**
- デプロイ後 `/exec` の疎通確認必須（404 のまま完了扱い禁止）

### 4.2 認証（変更禁止）

- **会員ログイン**: ログインID + パスワードのみ（Google ログイン不使用）
- **管理者ログイン**: `checkAdminBySession_()` → `Session.getActiveUser().getEmail()` → `T_管理者Googleホワイトリスト` 照合
- この 2 方式の分離は絶対に崩さない

### 4.3 DB 整合性

- 型定義・マスタ・シート列・API 実装は**常に同一変更セットで更新**
- `T_研修申込` は `申込者区分コード`（MEMBER/EXTERNAL）+ `申込者ID` のポリモーフィック設計を維持
- 既存の `会員ID` のみレコードは `backfillApplicationApplicantIdentity_()` で自動補完（`MEMBER` + `会員ID`）
- 既存 DB は「追記/移行で整合維持」（再作成前提禁止）

### 4.4 メール

- 既存リマインダーは `MailApp.sendEmail` を使用
- 管理コンソールの個別/一斉メール送信は `GmailApp.sendEmail` を使用（エイリアス送信元対応）
- スコープ: `script.send_mail` と `gmail.send` を `appsscript.json` で管理

### 4.5 ドキュメント

- 仕様変更時は実装と同時に正本ドキュメントを更新（後回し禁止）
- 技術選定・仕様提案は Web 検索で最新確認し、ベストプラクティスを比較した根拠つきで記録する
- 正本一覧: `docs/00_DOC_INDEX.md` 参照

---

## 5. 標準コマンド

```bash
# ─── 前提確認 ───────────────────────────────────────
# 認証アカウント確認（必ず k.noguchi@uguisunosato.or.jp であること）
cd backend
npx clasp show-authorized-user

# `clasp run` が 403/404 の場合（認証復旧）
npx clasp logout
npx clasp login --creds .tmp/oauth-client-uguisu-gas-exec.json --use-project-scopes --no-localhost
npx clasp show-authorized-user

# 疎通確認
npx clasp run healthCheck
npx clasp run getDbInfo

# ─── フロントエンドビルド ─────────────────────────────
# 会員マイページ用ビルド（dist/ に出力）
npm run build

# GAS 組み込み用ビルド（backend/index.html, backend/index_public.html に出力）
npm run build:gas

# ─── GAS 反映手順 ────────────────────────────────────
# 1. コードをプッシュ
cd backend
npx clasp push --force

# 2. バージョン作成
npx clasp version "fix: <説明>"

# 3. デプロイ確認（両 ID が同じ @N であること）
npx clasp deployments

# 4. GAS UI で Manage Deployments → 両 ID を最新バージョンへ更新（手動）

# ─── DB 操作 ────────────────────────────────────────
# スキーマ再構築（スキーマ変更後に必要）
npx clasp run rebuildDatabaseSchema

# デモデータ投入
npx clasp run seedDemoData

# 負荷試験用データ投入（既存の LT... 系データのみ置換）
npx clasp run seedPerformanceTestData

# DB タイムゾーン設定（一度だけ実行。既に v74 で実施済み）
npx clasp run setSpreadsheetTimezone

# ─── ユーティリティ ───────────────────────────────────
# ドライランメール
npx clasp run dryRunTrainingReminderT001
npx clasp run sendTrainingReminderToNoguchiTest
```

---

## 6. デプロイ手順（詳細）

### 6.0 毎回の予防チェック

```bash
# 0. 事前確認
git status --short
npm run typecheck
npm run build
npm run build:gas
npx clasp show-authorized-user
npx clasp deployments
```

確認ポイント:
- `npx clasp show-authorized-user` が運用アカウントであること
- 固定 2 Deployment ID が存在すること
- ローカルの `typecheck / build / build:gas` が成功していること

### 6.1 通常リリース

```bash
# 1. ビルド
npm run build:gas

# 2. GAS へプッシュ
cd backend
npx clasp push --force

# 3. バージョン作成
npx clasp version "リリース内容を記述（v75 等）"

# 4. バージョン番号を確認
npx clasp versions
```

**以降は Apps Script UI で手動操作:**

```
5. ブラウザで Apps Script エディタを開く
   https://script.google.com/home/projects/11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL/edit

6. Deploy > デプロイを管理

7. アクティブリストから「公開ポータル」の Deployment ID を選択
   → 編集 → バージョンを最新に変更 → デプロイ → 完了

8. アクティブリストから「会員マイページ」の Deployment ID を選択
   → 編集 → バージョンを最新に変更 → デプロイ → 完了

9. npx clasp deployments で両 ID の @N が一致していることを確認
```

### 6.2 疎通確認

```bash
# GAS 疎通
npx clasp run healthCheck
npx clasp run getDbInfo

# ブラウザ確認（手動）
# 公開ポータル: https://script.google.com/macros/s/AKfycbxKoni2vBdvRbQWR6NyrroPHyNmElJNkJ5OTNOJMQ0k0z-Ae-oGeclrN3kxsE9yIXVr/exec?app=public
# 会員マイページ: https://script.google.com/macros/s/AKfycbycE2_ythCYSPwmPxvyfRzNLhWM7J1cX41TA2wjYgZgdI-P2uknYfQGh3AHrecCQ1Gk/exec
```

### 6.3 繰り返し起きやすい問題

- `/exec` が 404
  - まず `Manage deployments` で固定 Deployment ID が `Web app` のままか確認する
- `clasp run` が失敗
  - まず `npx clasp show-authorized-user` を確認し、必要なら `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` の手順で再認証する
- 会員側/公開側のどちらかだけ古い
  - 固定 2 Deployment ID の Version が一致しているか確認する
- ドキュメント更新後の文字化け
  - UTF-8 で再読込して確認し、崩れていたらその場で修正する

---

## 7. アーキテクチャ概要

### 7.1 URL ルーティング

```
/exec              → doGet() → app != 'public' → index.html   (会員マイページ)
/exec?app=public   → doGet() → app == 'public' → index_public.html (公開ポータル)
```

### 7.2 API 通信プロトコル

- 全リクエスト: `POST /exec` に JSON ボディ `{ action: string, payload?: object }`
- 全レスポンス: `{ success: boolean, data?: any, error?: string }`
- アクセス制御: `processApiRequest_()` で action ごとに認証チェック
  - 公開 API（認証不要）: `getPublicTrainings`, `applyTrainingExternal`, `cancelTraining`
  - 会員 API（セッション必須）: `getMemberDashboard`, `applyTraining`, 等
  - 管理 API（管理者セッション必須）: `saveTraining`, `sendTrainingMail`, 等

### 7.3 主要ファイル構成

```
hirakatacitykyougikaiIDE/
├── CLAUDE.md               # AI エージェント向け憲法（このファイルは保持する）
├── HANDOVER.md             # 本書
├── backend/
│   ├── Code.gs             # GAS バックエンド全体（単一ファイル）
│   ├── appsscript.json     # GAS マニフェスト
│   ├── index.html          # 会員マイページ HTML（ビルド成果物）
│   └── index_public.html   # 公開ポータル HTML（ビルド成果物）
├── src/
│   ├── components/         # 会員マイページ用コンポーネント
│   │   ├── application/    # 入会申込フォーム（MemberApplicationForm, types）
│   │   └── StaffTrainingView.tsx  # v106: 職員別研修申込モーダル
│   ├── public-portal/      # 公開ポータル React ソース
│   ├── services/           # 会員マイページ側 API / 外部連携
│   ├── shared/             # 共通型定義・API ユーティリティ
│   ├── App.tsx             # 会員マイページ ルート
│   └── index.tsx           # 会員マイページ エントリポイント
├── docs/                   # 正本ドキュメント群
└── vite.config.ts          # Vite ビルド設定
```

- **バックエンド正本**: `backend/Code.gs` のみを編集対象とする（`Code.js` はGit管理対象外、`Code.ts` は廃止）。

---

## 8. DB スキーマ要点

### 8.1 主要テーブル

| テーブル | 用途 |
|---|---|
| `T_会員` | 個人会員・事業所会員のマスタ |
| `T_事業所職員` | 事業所に所属するスタッフ |
| `T_認証アカウント` | ログインID/パスワードハッシュ |
| `T_研修` | 研修マスタ（開催日・定員・費用JSON・項目設定JSON 等） |
| `T_研修申込` | 会員・外部申込者の申込（ポリモーフィック設計） |
| `T_外部申込者` | 公開ポータルから申し込んだ非会員の個人情報 |
| `T_管理者Googleホワイトリスト` | 管理者として許可された Google メール一覧 |

### 8.2 v99 で追加された列

| テーブル | 追加列 | 用途 |
|---|---|---|
| `T_会員` | `事業所番号` | 事業所会員の事業所番号 |
| `T_事業所職員` | `介護支援専門員番号` | 職員の介護支援専門員番号（8桁、ログインIDとしても使用） |

### 8.3 T_研修 の列順（DB_SCHEMA_VERSION = 2026-03-15-02）

```
研修ID, 研修名, 開催日, 開催終了時刻, 定員, 申込者数, 開催場所, 研修状態コード,
主催者, 法定外研修フラグ, 研修概要, 研修内容, 費用JSON,
申込開始日, 申込締切日, 講師, 案内状URL, 項目設定JSON,
作成日時, 更新日時, 削除フラグ
```

- `費用JSON`: `[{"label":"会員","amount":0},{"label":"非会員","amount":1000}]`
- `項目設定JSON`: `{"fieldConfig":null,"cancelAllowed":true,"inquiryPerson":"","inquiryContactType":"EMAIL","inquiryContactValue":""}`
- **開催形式コードは廃止**（列なし）

### 8.4 タイムゾーン（v74 で修正済み）

- DB スプレッドシートのタイムゾーン = `Asia/Tokyo`（`setSpreadsheetTimezone()` で設定済み）
- GAS 側も `Utilities.formatDate(val, 'Asia/Tokyo', ...)` で統一
- 新たに日時値を書き込む際は `Utilities.parseDate(str, 'Asia/Tokyo', fmt)` を使うこと

---

## 9. 認証仕様詳細

### 9.1 会員認証

```
ログインID + パスワード
→ T_認証アカウント で SHA-256 ハッシュ照合
→ セッション Cookie（GAS Session）でステート管理
```

### 9.2 管理者認証

```
Googleアカウントでアクセス
→ checkAdminBySession_() が Session.getActiveUser().getEmail() を取得
→ T_管理者Googleホワイトリスト のメールと照合
→ 一致すれば管理者セッション確立
```

- WL-001 登録アカウント: `k.noguchi@uguisunosato.or.jp`（sub: `110446186080909614640`）
- **GIS（Google Identity Services）は廃止**（GAS iframe sandbox では OAuth 不可）

---

## 10. 既知の課題・技術的負債

### 10.1 セキュリティ

| # | 内容 | 優先度 |
|---|------|--------|
| S-02 | パスワードハッシュが SHA-256 単回（OWASP 2025 は Argon2id 推奨。GAS 制約で移行困難） | 中 |
| S-03 | ログインロック解除が DB 直接編集のみ（管理画面に unlock 機能が必要） | 中 |
| S-04 | IDトークン直入力 UI（保守用）が本番でも表示される（環境変数フラグで非表示化推奨） | 低 |

> S-01（パスワード変更時の現在PW未検証）は解消済み（フロントエンド入力必須 + バックエンド照合実装）。

### 10.2 未実装機能

| # | 機能 |
|---|------|
| F-01 | パスワード初期化メール送信（DB 手動設定のみ） |
| F-02 | 振込先情報の会員向け UI |
| F-03 | 職員「退職済み」自動削除 |
| F-04 | キャンセル禁止設定の管理 UI（`cancelAllowed` フラグは DB に保存可だが管理画面なし） |
| F-05 | 代表者権限制約のバックエンド強制（`updateMember_` で代表者変更は代表者のみ可、管理者は代表者ロール変更不可） |

---

## 11. デモ用ログイン情報

| 種別 | ログインID | パスワード | 氏名 |
|---|---|---|---|
| 個人会員 | `12345678` | `demo1234` | 山田 太郎 |
| 個人会員 | `87654321` | `demo1234` | 鈴木 花子 |
| 事業所管理者 | `11223344` | `demo1234` | 佐藤 次郎 |
| 事業所スタッフ | `support-99999999-s2` | `demo1234` | — |

---

## 12. 開発再開チェックリスト

### 12.1 再開前

- [ ] `docs/12_ENGINEERING_RULEBOOK.md` を再読した
- [ ] `docs/09_DEPLOYMENT_POLICY.md` を再読した
- [ ] `cd backend && npx clasp show-authorized-user` が `k.noguchi@uguisunosato.or.jp` であることを確認した
- [ ] `npx clasp run healthCheck` が成功した
- [ ] `npx clasp run getDbInfo` が成功した

### 12.2 変更作業中

- [ ] DB 関連変更は「型/マスタ/シート/API」を同一変更セットで更新した
- [ ] 管理者=Google認証、会員=ID/パス認証の仕様を崩していない
- [ ] メール送信実装が仕様どおりである（リマインダー=MailApp / 管理コンソール=GmailApp）
- [ ] 変更内容を正本ドキュメントへ追記した

### 12.3 本番反映前

- [ ] `npm run build:gas` が成功した
- [ ] `npx clasp push --force` が成功した
- [ ] `npx clasp version "..."` で新バージョンを作成した

### 12.4 本番反映（GAS UI — 必ず 2 回実施）

- [ ] **公開ポータル** Deployment ID を最新バージョンに更新した
- [ ] **会員マイページ** Deployment ID を最新バージョンに更新した
- [ ] `npx clasp deployments` で両 ID の `@N` が一致していることを確認した

### 12.5 本番反映後

- [ ] 公開ポータル `/exec?app=public` を実ブラウザで確認し 404 でないことを確認した
- [ ] 会員マイページ `/exec` を実ブラウザで確認し 404 でないことを確認した
- [ ] `npx clasp run healthCheck` が成功した
- [ ] 変更内容を `HANDOVER.md` か関連正本へ記録した

---

## 13. 直近の変更履歴

| バージョン | 内容 |
|---|---|
| **v106→v108** | フィールドレベルアクセス制御拡張（NIST RBAC）: ロール別職員allowlist、STAFF自己編集、退職日/登録日自動記録、退職者年度フィルタ、職員別研修モーダル、ADMIN権限コンボdisabled修正（v108）、REPRESENTATIVEラベル追加 |
| **v105** | フィールドレベルアクセス制御（OWASP A01/CWE-915）: `updateMemberSelf_` サーバーサイド allowlist、loginId→会員ID照合、管理者専用フィールド非活性化、REPRESENTATIVE 編集権限修正 |
| **v104** | 退会機能（年度末退会予約方式）: 会員マイページから退会申請・取消、WITHDRAWAL_SCHEDULED 3状態管理、代表者権限制約、パスワード再認証、日付フォーマット修正 |
| **v100** | 公開ポータルを「お申込みポータル」に再編し、トップ画面に「研修申込」「新規入会申込」を追加。新規入会を公開ポータルへ統合し、`submitMemberApplication` を公開化。`updateMember_` に代表者権限制約のバックエンド強制を実装 |
| **v99** | 入会申込フォーム統合（個人/事業所/賛助3種別マルチステップウィザード）、事業所職員3段階権限（代表者/管理者/メンバー）、認証レコード書込バグ修正、T_会員に事業所番号列・T_事業所職員に介護支援専門員番号列追加 |
| **v98** | cache.put 100KB超過対策（4箇所try-catch）、管理コンソール15〜20秒正常表示に復旧 |
| **v97** | 管理コンソール（会員管理）全面リニューアル: 6カードダッシュボード/多条件検索/全カラムソート/詳細遷移/入退会処理/設定分離 |
| **v77** | 公開申込の申込状態コードを `APPLIED` に統一（表示文言混在を解消） |
| **v76** | 公開取消不具合修正（`申込状態コード: 取消` → `CANCELED`） |
| **v74** | DBスプレッドシートタイムゾーン Asia/Tokyo 設定・開催日時/終了時刻ズレ修正 |
| v73 | formatTimeOnly_() 追加・seedDemoData の開催日 Utilities.parseDate 対応 |
| v72 | 公開ポータル v72 両 ID デプロイ（前セッション作業） |
| v69 | 公開ポータル / 会員 URL 分離・2 Deployment 固定運用開始 |
| v67 | sendTrainingMail_ 戻り値修正（B-02） |
| v66 | sendTrainingMail_ DB参照 recipients 構築（B-01） |
| v65 | GmailApp → MailApp 切替（B-03） |
| v62 | T_外部申込者 フリガナ列追加 |

---

## 14. リリース記録（最新）

### 14.0 v106→v108

- **実施日**: 2026-03-20
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @108
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @108
- **備考**: v105 のフィールドレベルアクセス制御を NIST RBAC モデルに拡張。ロール別職員 allowlist 新設（REPRESENTATIVE/ADMIN/STAFF 3段階）。`careManagerNumber`/`officeName`/`officeNumber` を会員 allowlist から除外。STAFF は自分の氏名・フリガナ・メールのみ変更可。退職日/登録日の自動記録。退職者の年度フィルタ。職員削除ボタン廃止（退職ステータスで運用）。退会日・年度中退会フィールドをフロントエンドから除去。職員別研修モーダル（`StaffTrainingView.tsx`）新設。v108 で F-05 バグ修正（`activeStaffRole` prop → `currentStaff?.role` state）および REPRESENTATIVE ラベル追加。
- **テスト結果**: バックエンド B-01〜B-10 全10件 PASS、フロントエンド F-01〜F-12 全11件 PASS + 1 SKIP（賛助会員テストデータなし）、デプロイチェック D-01〜D-11 全11件 PASS。回帰テスト R-01〜R-02, R-07〜R-08 PASS（本番データ影響のある R-03〜R-06, R-09〜R-10 は PENDING）。テスト仕様書: `docs/22_TEST_SPEC_v106_FIELD_ACCESS_CONTROL.md`。
- **Git コミット**: `1f43c0f` on `main`（**GitHub push 未実施**）

### 14.0a v105

- **実施日**: 2026-03-20
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @105
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @105
- **備考**: フィールドレベルアクセス制御を実装（OWASP A01 Broken Access Control / CWE-915 Mass Assignment 対策）。サーバーサイドに `MEMBER_WRITABLE_FIELDS_` / `MEMBER_WRITABLE_STAFF_FIELDS_` allowlist を定義し、`updateMemberSelf_()` で loginId→会員ID照合（なりすまし防止）後、allowlist でペイロードをフィルタして `updateMember_()` に委譲。`updateMember` は `ADMIN_REQUIRED_ACTIONS` に所属（管理者専用）、`updateMemberSelf` は非管理者アクション。フロントエンドでは `isAdmin` prop で管理者専用フィールド（入会日・退会日・会員状態・年度中退会・職員状態）を disabled 化。`isReadOnly` に REPRESENTATIVE を追加して事業所代表者の編集権限を修正。MCP Playwright で両 Deployment @105 同期確認済み。
- **MCP テスト結果**: 管理者ビュー（全フィールド編集可）、個人会員ビュー（管理者専用フィールド disabled + 年度途中退会非表示）、事業所一般職員ビュー（全フィールド disabled + 閲覧専用モードアラート）の3パターン全て PASS。

### 14.0a v104

- **実施日**: 2026-03-19
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @104
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @104
- **備考**: 退会機能（年度末退会予約方式）を実装。会員マイページに退会セクションを追加し、`withdrawSelf_()` / `cancelWithdrawalSelf_()` / `promoteScheduledWithdrawals_()` をバックエンドに実装。会員状態を ACTIVE / WITHDRAWAL_SCHEDULED / WITHDRAWN の3状態管理に拡張。事業所会員は代表者のみ退会申請可能、パスワード再認証必須。`mapMembersForApi_` の日付フォーマットを `normalizeDateInput_()` に統一。v101〜v103 でフロントエンドビルドコピー漏れと Date 表示バグを修正。MCP Playwright で全ライフサイクル（申請→バッジ確認→取消→復帰）を検証済み。

### 14.0a v100

- **実施日**: 2026-03-18
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @100
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @100
- **備考**: 公開ポータルを「枚方市介護支援専門員連絡協議会お申込みポータル」に再編。トップ画面に「研修申込」「新規入会申込」を追加し、新規入会を管理コンソールから削除して公開ポータルへ統合。`submitMemberApplication` を公開 API 化。`updateMember_` に代表者権限制約のバックエンド強制を追加。MCP で会員/公開両 URL の表示と管理画面導線削除を確認。2026-03-19 に `main` `38b7da7` を GitHub push 済み、作業ツリー clean を確認。

### 14.1 v99

- **実施日**: 2026-03-17
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @99
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @99
- **備考**: 入会申込フォーム統合（個人/事業所/賛助3種別マルチステップウィザード）。事業所職員を代表者/管理者/メンバーの3段階権限に拡張。`createMember_` の認証レコード書込先を `T_認証` → `T_認証アカウント` に修正。T_会員に `事業所番号`列、T_事業所職員に `介護支援専門員番号`列を追加（`rebuildDatabaseSchema` 実施済み）。本番で個人会員入会申込の全行程テスト PASS。

### 14.1 v98

- **実施日**: 2026-03-17
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @98
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @98
- **備考**: cache.put 100KB超過対策（4箇所 try-catch）。v97の36.9秒エラー→v98で15〜20秒正常表示。全テスト(P0:5件/P1:10件)PASS。

### 14.1a v97

- **実施日**: 2026-03-17
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @97
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @97
- **備考**: 管理コンソール（会員管理）全面リニューアル。ダッシュボード6カード/多条件検索/全カラムソート/行クリック詳細遷移/入会・退会処理/設定画面分離。

### 14.1b v96

- **実施日**: 2026-03-16
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @96
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @96
- **備考**: 年会費コンソールに列ソート・金額列削除・一括保存・楽観更新を実装。バックエンドに `saveAnnualFeeRecordsBatch` API を追加し保存速度を改善。Playwright MCP で反映確認済み。

### 14.2 v95

- **実施日**: 2026-03-15
- **担当者**: Claude Code (claude-opus-4-6)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @95
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @95
- **備考**: 年会費管理コンソール UI/UX 全面改善（サマリー4分割、種別バッジ、isDirty制御、ページネーション «/» ジャンプ、監査ログカラーバッジ、ストライプ行）。不要デプロイ履歴を13→3に削減。Playwright MCP で反映確認済み。

### 14.2 v94

- **実施日**: 2026-03-15
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @94
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @94
- **備考**: 管理トップ会員一覧に会員種別フィルタ・検索・25件ページングを追加し、年会費管理コンソールに 25/50/100 件切替とページングを追加。Playwright MCP で管理トップの `1 - 25 件を表示 / 全 334 件`、年会費一覧の `1 - 25 件を表示 / 全 334 件` と次ページ遷移、公開ポータル表示を確認。

### 14.3 v93

- **実施日**: 2026-03-15
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @93
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @93
- **備考**: `seedPerformanceTestData()` で負荷試験データを生成し、会員画面を `getMemberPortalData` の会員単位取得へ切替。負荷データ投入後も個人/事業所会員ログイン、管理トップ、年会費管理コンソール、研修管理コンソール、公開ポータルの表示を Playwright MCP で確認。

### 14.4 v92

- **実施日**: 2026-03-15
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbxKoni2...IXVr` → @92
- **会員マイページ ID**: `AKfycbycE2_...1Gk` → @92
- **備考**: 研修管理コンソールを軽量 API `getTrainingManagementData` へ切替。Playwright MCP 実測で管理トップまで約 4.5 秒、研修管理コンソールまで約 3.5 秒を確認。

> v91 以前のリリース記録は `git log` を参照。v89 で旧 Deployment ID 廃止 → 現行固定 ID に移行。v74 で DB タイムゾーン修正。
