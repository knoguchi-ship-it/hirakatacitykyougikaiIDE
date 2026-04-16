# 開発引継ぎ

更新日: 2026-04-16
現行本番: `v214`
固定 deployment: member `@214` / public `@214`
補足: v210〜v214 で公開ポータルメニュー表示設定・設定保存 N+1 修正・FOIC 修正を実施。

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/81_RELEASE_STATE_v210-v214_2026-04-16.md` ← **v214 current**（公開ポータル FOIC 修正・設定保存改善）
6. `docs/80_RELEASE_STATE_v209_2026-04-16.md`（v209 record: 入会時認証情報メール送信制御）
7. `docs/79_HANDOVER_2026-04-15.md` ← 引継ぎ資料（v208 時点）— 機能一覧・運用・落とし穴まとめ
8. `docs/78_RELEASE_STATE_v208_2026-04-15.md`（v208 record）
9. `docs/77_RELEASE_STATE_v207_2026-04-15.md`（v207 record）
10. `docs/76_RELEASE_STATE_v206_2026-04-15.md`（v206 record）
11. `docs/75_RELEASE_STATE_v205_2026-04-14.md`（v205 record）
12. `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` ← **全フェーズ完了（Phase 1〜3）**
13. `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02 未着手・残課題）
14. `docs/09_DEPLOYMENT_POLICY.md`
15. `docs/05_AUTH_AND_ROLE_SPEC.md`
16. `docs/04_DB_OPERATION_RUNBOOK.md`
17. `docs/03_DATA_MODEL.md`
- v197〜v204 記録: `docs/archive/release_history/`（67〜74）
- v170〜v196 記録: `docs/archive/release_history/`（45〜66）

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- 最新の release state 文書は `HANDOVER.md` の「最初に読むもの」に記載されたものを参照する。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 2026-04-10 の引継ぎ確認ログは `docs/65_HANDOVER_TASK_DEV_SETUP_2026-04-10.md` を参照する。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@214` を向いている。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。
- デモアカウント（本番 DB）: `demo-ind-001` / `demo1234`（個人会員）、`demo-ind-002` / `demo1234`（個人会員）。
- 管理者ログイン: `checkAdminBySession`（auth のみ）。会員データは遷移後の遅延取得。
- フロントエンド HTML 圧縮: deflate-raw + base64（`scripts/compress-html.mjs`）。member ~230 kB / public ~155 kB。
- **公開ポータル メニュー表示設定**: `T_システム設定` の `PUBLIC_PORTAL_TRAINING_MENU_ENABLED` / `PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED` で管理。管理者が ON/OFF 切替可能。
- **設定保存**: `getSystemSettingMap_` + `batchUpsertSystemSettings_` による 1 パス処理（旧 N+1 解消済み）。

## 4. 直近の重要履歴

### v210〜v214（2026-04-16）
詳細は `docs/81_RELEASE_STATE_v210-v214_2026-04-16.md` を参照。

#### v214 — 公開ポータル FOIC 修正・Skeleton UI
- 設定 API 応答前に全カードが表示される FOIC を修正
- `useState(true)` → `useState<boolean | null>(null)`（未確定を `null` で表現）
- 設定未確定中は Skeleton UI（`animate-pulse`）を表示、確定後に正しいカードだけ描画
- API 失敗時は fail-open（全表示）

#### v213 — 設定保存ボタン変更検知（dirty state）
- `settingsIsDirty` state を追加。変更があった場合のみ保存ボタンが有効化される
- ボタンラベル: 変更あり→「設定を保存」／変更なし→「変更なし」
- 全入力フィールド（20 箇所）に `setSettingsIsDirty(true)` を追加

#### v212 — 設定保存 N+1 問題解消
- `getSystemSettingMap_(ss)`: T_システム設定を 1 回で全読み込み → `{キー: 値}` マップ返却
- `batchUpsertSystemSettings_(ss, updates)`: 全更新をメモリ上で処理し `setValues()` 1 回で書き込み
- 設定保存 API calls: ~70 → ~4、処理時間: ~14〜35 秒 → 1〜2 秒

#### v211 — build:gas 適用漏れ修正
- `npm run build`（vite のみ）ではなく `npm run build:gas` を使う教訓。`backend/index*.html` を更新するのは `build:gas` のみ。

#### v210 — 公開ポータル メニュー表示設定
- `getPublicPortalSettings_()` 公開 API 新設
- T_システム設定 に 2 キー追加（`insertSystemSettingKeysForV210` 実行済み）
- 管理設定画面にトグル追加、公開ポータルに条件レンダリング追加

### v209（2026-04-16）
- 入会時ログイン情報メール送信制御（`CREDENTIAL_EMAIL_ENABLED` T_システム設定 キー）
- メール件名・本文のカスタマイズ（マージタグ方式）

### v208（2026-04-15）
- 2026-04-15 宛名リスト 2 バグ修正。GCP / CLI 移行（`k.noguchi@uguisunosato.or.jp` → `k.noguchi@hcm-n.org`）。
- **Bug 1**: 事業所会員の名前が `姓名` になっていた → `勤務先名` に修正
- **Bug 2**: 住所不備シートに書き込んでも xlsx に反映されない → `setValues()` 後に `SpreadsheetApp.flush()` を追加

### v207（2026-04-15）
- 宛名リスト Excel 出力コンソール（`MailingListExport.tsx`）を追加。
- `generateMailingListExcel_()` / `_fillMailingSheet_()` 新規追加
- 発送区分: 広報誌発送（KOHOUSHI）/ お知らせ発送（OSHIRASE）

### v206（2026-04-15）
- T_会員 に住所 2 列（建物名）追加。`addAddressLine2Columns()` マイグレーション実行済み。

### v205（2026-04-14）
- PDF 出力 1000 件対応アーキテクチャ刷新（chunked + all-or-nothing + retry）

### v204（2026-04-14）
- 名簿 PDF 出力の 50 件上限廃止。並列バッチ処理へ変更。

### v203（2026-04-10）
- Phase 3（PDF 名簿出力コンソール）完了。SOW 全フェーズ完了。

---
v195〜v202、v170〜v193 の詳細は `HANDOVER.md` 旧版（`docs/79_HANDOVER_2026-04-15.md`）または `docs/archive/release_history/` を参照。

## 5. 現時点の注意事項（v214 更新）

- fixed deployment 2 本は `@214` を向いている。
- **v206 DB 適用済み**: `npx clasp run addAddressLine2Columns` は実行完了。本番 `T_会員` に `勤務先住所2` / `自宅住所2` 列が追加されている。
- **v194 リリース済みのため、本番管理者（`k.noguchi@hcm-n.org`）は次回 `/exec` アクセス時に `gmail.send + drive` の同意画面が表示される場合がある。** 未承認の場合は必ず承認すること。
- **名簿出力コンソール（RosterExport）使用前提条件**: システム設定画面で `ROSTER_TEMPLATE_SS_ID`（テンプレートスプレッドシート ID）を登録すること。
- **一括メール送信（BulkMailSender）使用前提条件**: Drive 自動添付を使う場合は `BULK_MAIL_AUTO_ATTACH_FOLDER_ID`（Drive フォルダ ID）を登録すること。
- **公開ポータル メニュー設定反映手順**: 管理設定 → 公開ポータル メニュー表示設定 → 変更 → 「設定を保存」→ 公開ポータルをリロード。
- データ移行期バリデーション緩和は全主要編集フォーム（StaffDetailAdmin / MemberForm / MemberDetailAdmin）に適用完了。
- GAS キャッシュ（TTL 600 秒）が切れるまで旧データが表示される場合がある。
- AI 案内メール機能（「AI 案内メール作成」ボタン）は `GEMINI_API_KEY` が Script Properties に設定されていないと動作しない。
- **残課題**: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` の B-02（`fetchAllDataFromDbFresh_` 最適化）は未着手。

## 6. 再開時チェック
```bash
git status --short
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

期待値:
- authorized user が運用アカウント（`k.noguchi@hcm-n.org`）
- health check が成功
- fixed deployment 2 本が `@214`
- `getDbInfo` が本番固定 DB `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` を返す

2026-04-16 確認結果（v214）:
- `npx clasp push --force` → 4 files pushed
- `npx clasp version "v214..."` → version 214 created
- `npx clasp deployments --json` → member / public ともに `versionNumber: 214`
- `npm run typecheck` → pass

## 7. 次担当者（Codex）の最初の一手

1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 再開時チェック（セクション 6）を実行し、deployment が `@214` であることを確認する。
3. **公開ポータルをブラウザで開き**、設定に応じたカードのみ表示されることを実確認する。
   - Skeleton（`animate-pulse`）→ カード描画の流れが正しいか確認
   - 管理設定でトグルを OFF → 保存 → リロードでカードが消えることを確認
4. **管理設定ページで「設定を保存」ボタン**が変更前はグレー（「変更なし」）、変更後に有効化（「設定を保存」）になることを確認する。
5. 残課題 B-02（パフォーマンス）に着手する場合は `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` を参照する。
6. **変更後は必ず `HANDOVER.md` と関連正本を同ターンで更新する。**

## 8. 引継ぎ体制メモ
- 入口は `HANDOVER.md`、日次運用は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`、固定記録は `HANDOVER.md` に記載された最新の release state 文書を参照する。
- グランドルール入口は `AGENTS.md` のみ。`CLAUDE.md` は `AGENTS.md` へつなぐ互換入口としてのみ保持する。
- 新規 task は現行テンプレート `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して起票する。
- push や deploy 前は `git diff` でスコープを確認してからファイル単位でステージングすること。

## 2026-04-15 GCP / CLI migration note
- Current operational Google account for CLI and Cloud is `k.noguchi@hcm-n.org`.
- Current linked standard GCP project is `hcmn-member-system-prod`.
- Current linked GCP project number is `88737175415`.
- Apps Script project settings were switched from old project number `995586177540` to `88737175415` on 2026-04-15.
- `gcloud auth list` active account, `gcloud config get-value project`, `npx clasp show-authorized-user`, `npx clasp run healthCheck`, and `npx clasp run getDbInfo` were reverified on 2026-04-15 under `k.noguchi@hcm-n.org`.
- Required enabled APIs on the new GCP project for current operation: `script.googleapis.com`, `gmail.googleapis.com`.
- `.clasp.json` now points to `projectId: hcmn-member-system-prod`.
- `clasp run` recovery required a project-owned OAuth client. Local credential file used for recovery: `.tmp/oauth-client-hcmn-member-system-prod.json` with `npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes`.
- Fixed deployments were redeployed on 2026-04-15 by `k.noguchi@hcm-n.org` without changing version:
  - member `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx`
  - public `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp`
- Before `clasp redeploy` under the new domain account, user-level Apps Script setting `Google Apps Script API` had to be enabled at `https://script.google.com/home/usersettings`.
