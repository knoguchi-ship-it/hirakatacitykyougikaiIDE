# 05_PROJECT_RULES_HIRAKATA

## 位置づけ
- この文書は、このリポジトリ固有のグランドルールを定義する。
- 汎用ルールは `GLOBAL_GROUND_RULES/AGENTS.md`、`GLOBAL_GROUND_RULES/CLAUDE.md`、`GLOBAL_GROUND_RULES/docs/AI_RULES/*.md` を参照する。
- この案件で判断に迷った場合は、まずこの文書と現行正本を照合する。

## 最初に読む順序
1. `GLOBAL_GROUND_RULES/CLAUDE.md`
2. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
3. `HANDOVER.md`
4. `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
5. `docs/09_DEPLOYMENT_POLICY.md`
6. `docs/10_SOW.md`
7. `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
8. `docs/05_AUTH_AND_ROLE_SPEC.md`
9. `docs/04_DB_OPERATION_RUNBOOK.md`
10. `docs/03_DATA_MODEL.md`

## この案件の最上位原則
- 技術選定、仕様提案、運用判断、障害切り分けの前に、必ず Web で最新の一次ソースを確認する。
- 調査では、最新情報の確認だけでなく、世界標準、業界標準、日本の実務水準に照らしてベストプラクティスを比較する。
- 提案では、外部根拠と、この案件の正本ドキュメントとの整合をセットで示す。
- 根拠のない提案は、仕様決定、実装着手、完了判定の根拠にしない。
- 外部ベストプラクティスと案件文書が衝突した場合は、この案件の正本を優先し、差分と採否理由を記録する。

## この案件の正本
- `HANDOVER.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `docs/10_SOW.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`

## ルール衝突時の扱い
- 行動ルール、判断ルール、承認ルールは `GLOBAL_GROUND_RULES/` 配下を最優先とする。
- システム仕様、運用値、固定値、現行状態は `HANDOVER.md` と `docs/*` の案件正本を正とする。
- `GLOBAL_GROUND_RULES/` 配下と案件正本が衝突した場合は、より安全側かつ案件正本に整合する判断を採用する。
- 衝突を見つけた場合は、下位または古い文書を同日中に修正する。

## プロジェクト固有の絶対ルール

### 認証
- 会員ログインは `ログインID + パスワード` のみとする。Google ログインは使わない。
- 管理者ログインは Google アカウント + ホワイトリスト照合で行う。
- この 2 方式の分離は崩さない。
- 管理コンソールの認証判定は `checkAdminBySession_()` に統一する。
- 管理者ログイン中でも、自分の会員マイページを利用できる構成を維持する。

### データとスキーマ
- 型定義、マスタ、シート列、API 実装は同一変更セットで更新する。
- 既存 DB は再作成前提にしない。追記と移行で整合を維持する。
- `T_研修申込` は `申込者区分コード` + `申込者ID` のポリモーフィック設計を維持する。

### デプロイ
- 本番 URL は固定 2 Deployment ID 運用とする。URL は絶対に変えてはならない。
- 会員マイページ Deployment ID:
  - `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx`
- 公開ポータル Deployment ID:
  - `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp`
- 2 つの Deployment は常に同一 Version へ同時更新する。片方だけ更新しない。
- デプロイ前に `docs/09_DEPLOYMENT_POLICY.md` を必ず再確認する。

#### デプロイ時の正しい手順（厳守）
1. `npm run build:gas` → `npx clasp push` → `npx clasp version "説明"` でバージョンを作成
2. **Apps Script UI**（`Manage deployments`）で固定 2 Deployment ID の Version を手動更新
3. `npx clasp deployments` で固定 2 ID が同一 Version であることを確認
4. `/exec` と `/exec?app=public` の疎通確認
- ステップ 2 は Apps Script の Web UI でしか実行できない。CLI では代替不可。
- AI エージェントが単独でデプロイ完了できないことを認識し、ステップ 2 はユーザーに依頼する。

#### デプロイ禁止事項（絶対禁止）
- **`clasp deploy`（全形式）は禁止。** フラグの有無を問わず、`clasp deploy` は新しい Deployment ID を生成するか、既存の Web App を API Executable に変換する。どちらもURLが変わるか機能が壊れる。
- `clasp deploy -V <version>` も禁止（新 ID 生成される）。
- `clasp deploy --deploymentId` も禁止（Web App → API Executable 変換リスク）。
- `clasp redeploy` だけで本番完了扱いにしない。
- 本番 Deployment ID を事前合意なく変更しない。
- `/exec` または `/exec?app=public` が 404 のまま完了扱いにしない。
- 本番反映後は `/exec` と `/exec?app=public` の疎通確認結果を記録する。

### メール
- 既存リマインダーは `MailApp.sendEmail` を使う。
- 管理コンソールの個別送信、一斉送信は `GmailApp.sendEmail` を使う。
- メール関連スコープと `webapp` manifest は `backend/appsscript.json` と実装を整合させる。

### ドキュメント
- 仕様変更時は、実装と同時に正本ドキュメントを更新する。
- ドキュメント更新なしで仕様変更を完了扱いにしない。
- 旧ルール文書は `Dust/` に退避し、現行ルールは `GLOBAL_GROUND_RULES/` を参照する。

## 再開時の標準確認
```bash
git status --short
cd backend
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
```

期待値:
- `git status --short` は意図しない差分がない
- `show-authorized-user` は `k.noguchi@uguisunosato.or.jp`
- `healthCheck` / `getDbInfo` は成功

## 本番完了条件
以下が揃って初めて本番完了とする。

1. `npm run typecheck`
2. `npm run build`
3. `npm run build:gas`
4. `npx clasp push --force`
5. 新 Version 作成
6. 固定 2 Deployment ID が同一 Version を参照
7. Apps Script UI で両 Deployment が `Web app` であることを確認
8. `/exec` と `/exec?app=public` が 404 でない
9. `npx clasp run healthCheck`
10. `npx clasp run getDbInfo`
11. 実ブラウザで会員側、公開側を最低 1 画面ずつ確認
12. GitHub へのコミット、プッシュ
13. `/exec` と `/exec?app=public` の疎通確認結果を記録
14. 正本ドキュメント更新

## 例外運用
- 例外を使えるのは、標準手順で復旧不能と確認できた場合のみ。
- 例外実行前に、以下を必ず記録する。
  1. 症状
  2. 実施した標準切り分け
  3. 復旧不能の根拠
  4. 例外内容
  5. 承認者
- 例外実施後は、この文書と関連正本の固定値、運用値、手順を同時更新する。

## 現在の確定運用状態
- ブランチ: `main`
- 本番反映: `v124`
- 5 段階権限モデル（v118〜v120）、年会費コンソール改善（v122〜v124）が反映済み
- DB_SCHEMA_VERSION: `2026-03-22-01`
- 次の優先タスク:
  1. 管理コンソール UI/UX の継続改善
  2. 必要に応じて会員一括編集対象項目の拡張
  3. 必要に応じて公開ポータルの文言、導線改善

## 障害対応
- 再発性のある障害は `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` と `GLOBAL_GROUND_RULES/docs/04_KNOWN_ERRORS.md` に反映する。
- `clasp run`、Deployment、認証、404 は、コード改変より先に認証、権限、Version、Deployment 種別を疑う。
