# 開発再開チェックリスト（2026-03-05）

## 1. 本日時点サマリ
- 作業ディレクトリ: `C:\VSCode\CloudePL\hirakatacitykyougikaiIDE`
- ベースブランチ: `main`
- 参照優先ドキュメント:
  - `docs/99_HANDOVER_2026-03-01.md`
  - `docs/05_AUTH_AND_ROLE_SPEC.md`
  - `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md`

## 2. 本日実測した結果
1. ローカルビルド
- `npm run build` は成功（Vite build 完了）

2. clasp状態
- `npx clasp status` で追跡対象は `backend/appsscript.json`, `backend/Code.gs`, `backend/index.html`
- `npx clasp show-authorized-user` は `k.noguchi@uguisunosato.or.jp`
- `npx clasp deployments` は 8件を確認（`@12` を含む）

3. API実行確認
- `npx clasp run getDbInfo` は成功（MCPで `clasp login --creds ... --use-project-scopes` を再認可後）
- `npx clasp run --nondev getDbInfo` は失敗
  - `Script function not found. Please make sure script is deployed as API executable.`
- `npx clasp run healthCheck` は成功（Execution API の devMode 実行は正常）
- `npx clasp run --nondev healthCheck` は失敗（`--nondev` 経路のみ失敗）

4. WebアプリURL
- `curl -I https://script.google.com/macros/s/AKfycbwSgcMLEeXxn0SS9dS93A4ME_Mg9Gyd8TByEvjY0h-T6Q1nYChRlKDcRJPkSnUaKb_R/exec`
  - `404 Not Found`
- 他デプロイIDはネットワーク不達が混在し、同一条件で再測定が必要

## 3. 現在の判断
1. ローカル開発再開は可能
- フロント開発・型修正・UI修正は即着手可能

2. GAS連携検証は未整備
- `clasp run` の通常経路は解消済み
- `clasp run --nondev` のみ未解消
- `/exec` は少なくとも1デプロイIDで 404

3. 追加の確定診断
- Apps Script UI で `実行可能 API` の新規デプロイ（@15）を作成済み
- 直接API呼び出し（`scripts/{deploymentId}:run`）では `healthCheck` が成功
- 一方で `scripts/{scriptId}:run` + `devMode=false` は `404 NOT_FOUND`
  - このため `clasp run --nondev` は継続失敗
- `getDbInfo` は `scripts/{deploymentId}:run` でも `AuthRequiredError`（spreadsheets権限不足）
- 上記権限不足は `--use-project-scopes` 再認可で解消済み

## 4. 再開時の実行手順（この順で）
1. ローカル確認
```bash
npm run build
npx clasp status
npx clasp show-authorized-user
npx clasp deployments
```

2. Apps Script UIで権限再同意
- `getDbInfo` か `setupDatabase` を Apps Script エディタから1回実行
- スプレッドシート権限同意ダイアログを完了

3. API executable / Web app の再デプロイ確認
- `Deploy` > `Manage deployments` で `API executable` と `Web app` を確認
- `Web app` を新規発行し `/exec` を即時検証

4. CLI再確認
```bash
npx clasp run getDbInfo
npx clasp run --nondev getDbInfo
```

5. 追加切り分けコマンド（必要時）
```bash
npx clasp run healthCheck
npx clasp run --nondev healthCheck
```

## 5. 次担当が最初に見るべきポイント
1. `backend/appsscript.json` の `executionApi.access` は `MYSELF`（運用要件に合うか要確認）
2. `backend/Code.gs` は DB固定ID運用（`DB_SPREADSHEET_ID_FIXED`）になっている
3. 既存ワークツリーには本件と無関係な変更が混在しているため、コミット時は対象ファイルを限定する
