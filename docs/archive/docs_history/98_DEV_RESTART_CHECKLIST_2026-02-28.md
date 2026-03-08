# 開発再開チェックリスト（2026-02-28）

## 1. 本日確認した事実
- 引き継ぎ書:
  - `HANDOVER.md`
  - `docs/99_HANDOVER_2026-02-25.md`
- ローカルビルド: `npm run build` 成功
- `clasp` ログインユーザー: `k.noguchi@uguisunosato.or.jp`
- `clasp` トラッキング対象:
  - `backend/appsscript.json`
  - `backend/Code.gs`
  - `backend/index.html`
- `clasp run --nondev getDbInfo` は失敗を再現:
  - `Script function not found. Please make sure script is deployed as API executable.`

## 2. 再開時の最優先タスク（運用）
1. Apps Script エディタで `cleanupDatabaseSheets()` を実行し、不要シートを除去する。
2. Apps Script のデプロイ設定で `API executable` を有効化する。
3. `npx clasp run --nondev getDbInfo` が成功することを確認する。
4. 本番 Web アプリ URL が 404 でないことを確認する。

## 3. 再開時の最優先タスク（開発）
1. フロントの「研修申込が画面遷移後に戻る」不具合を再現・修正する。
2. `fetchAllData` / `updateMember` の永続化処理を `backend/Code.gs` に実装する。
3. 認証導入までの暫定アクセス制御方針を決める。

## 4. 技術的注意点
- `src/services/geminiService.ts` は `process.env.API_KEY` を参照しているため、Vite 実行時の環境変数取り扱いを再確認すること。
- `backend/Code.ts` は TODO が残る雛形で、実運用コードは `backend/Code.gs`。
- `clasp` の確認コマンドは `whoami` ではなく `show-authorized-user` を使う。

## 5. 再開コマンド（そのまま実行可）
```bash
npm run build
npx clasp status
npx clasp show-authorized-user
npx clasp deployments
npx clasp run --nondev getDbInfo
```

## 6. 疎通確認の実測結果（2026-02-28）
- `npm run build:gas` 成功
- `npx clasp push --force` 成功（3ファイル反映）
- `npx clasp deploy -d "api executable enablement"` 成功
  - 新規デプロイ: `AKfycbwSgcMLEeXxn0SS9dS93A4ME_Mg9Gyd8TByEvjY0h-T6Q1nYChRlKDcRJPkSnUaKb_R`（@7）
- `npx clasp run --nondev getDbInfo`:
  - 失敗継続: `Script function not found. Please make sure script is deployed as API executable.`
- `npx clasp run getDbInfo`:
  - 失敗: `Unable to run script function. Please make sure you have permission to run the script function.`
- WebアプリURL疎通 (`curl -I`):
  - `https://script.google.com/macros/s/AKfycbx9BzrySHJ7eTKDclSRWkwtFAYT7EE5QUIyPEf7ijY/exec` -> `404 Not Found`
  - `https://script.google.com/macros/s/AKfycbwSgcMLEeXxn0SS9dS93A4ME_Mg9Gyd8TByEvjY0h-T6Q1nYChRlKDcRJPkSnUaKb_R/exec` -> `404 Not Found`

## 9. ブラウザ操作での設定実施結果（2026-02-28）
- Apps Script エディタに `k.noguchi@uguisunosato.or.jp` でログインし、`Deploy` から新規デプロイを作成。
- 新規 Webアプリデプロイ（version 8）:
  - Deployment ID: `AKfycbxxc07c1nty2-e-45HIlDV6THjzpOIj7z_Li6lyhMdSG7fgJHmxhbrY02xvOF7duApJ`
  - URL: `https://script.google.com/a/macros/uguisunosato.or.jp/s/AKfycbxxc07c1nty2-e-45HIlDV6THjzpOIj7z_Li6lyhMdSG7fgJHmxhbrY02xvOF7duApJ/exec`
  - Playwright 上で `/exec` 画面表示を確認（404解消）。
- API executable デプロイ（`AKfycbw...`）は `redeploy` で version 8 に更新済み。

## 10. 未解消事項
- `npx clasp run --nondev getDbInfo` は継続して失敗:
  - `Script function not found. Please make sure script is deployed as API executable.`
- `npx clasp run getDbInfo` も権限エラー:
  - `Unable to run script function. Please make sure you have permission to run the script function.`

## 11. 追加で実施したこと（2026-02-28）
- Apps Script の `プロジェクトの設定` で GCP を `デフォルト` から `標準` に切替:
  - プロジェクト番号: `995586177540`
  - プロジェクトID: `uguisu-gas-exec-20260225191000`
- `.clasp.json` に `projectId` を設定済み（`npx clasp apis` が実行可能化）。
- API executable デプロイ `AKfycbw...` を更新し、アクセス範囲を以下まで拡張:
  - `自分のみ` -> `うぐいすの里 内の全員` -> `Google アカウントを持つ全員`
- Apps Script エディタ上で `getDbInfo` の手動実行は成功（関数自体は正常）。

## 12. API実行の診断結果
- Execution API 直接呼び出し（`AKfycbw...:run`）は `403 PERMISSION_DENIED`。
- `Script ID + devMode=false` は `404 NOT_FOUND`、`devMode=true` は `403`。
- つまり、Webアプリ(`/exec`)は正常だが、Execution API の呼び出し主体認可で拒否されている。

## 13. 残課題の本命
- Execution API 呼び出しに使っている OAuth クライアント/資格情報と、標準GCPへ切替後の実行許可ポリシーが一致していない可能性が高い。
- `clasp run` のエラーメッセージは抽象的だが、直接API呼び出しで `PERMISSION_DENIED` を再現済み。

## 7. 現時点の結論
- CLI からの push/deploy は成功しているが、Apps Script 側の実行公開設定が未完了で、`clasp run` と Web URL の疎通が成立していない。
- 次に必要なのは Apps Script エディタ上の手動設定（`API executable` / Webアプリ公開設定）の確認と再デプロイ。

## 8. 手動設定手順（Apps Script UI）
1. `https://script.google.com/d/11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL/edit` を開く。
2. 右上 `Deploy` → `Manage deployments` を開く。
3. `New deployment` を押し、`Type` に `API executable` を選択してデプロイする。
4. 続けて `New deployment` で `Web app` を作成する。
5. `Execute as` は運用アカウント、`Who has access` は要件に沿って設定して保存する。
6. 発行された `/exec` URL を控える（404確認に使用）。
