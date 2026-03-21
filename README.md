# 枚方市介護支援専門員連絡協議会 会員管理システム

## プロジェクト概要
本プロジェクトは、枚方市介護支援専門員連絡協議会の会員管理、研修申込、および年会費管理を効率化するためのWebアプリケーションです。
従来のアナログ（郵送・紙ベース）な管理体制から、デジタル（メール・Webシステム）への移行を促進し、事務局および会員双方の負担を軽減することを目的としています。

## 主な機能
- **会員マイページ**: 登録情報の確認・変更、年会費の納入状況確認
- **研修管理**: 開催中の研修へのオンライン申込、受講履歴の確認
- **事務局ダッシュボード**: 会員統計の可視化、会員データベースの管理
- **AIアシスト**: Gemini APIを活用した、研修案内メール等の自動生成

## 認証方針
- 会員機能は **Googleアカウント不要**（ログインID + パスワード）
- 管理者ページは **Googleアカウント認証** を使用
- Googleログイン後、`T_管理者Googleホワイトリスト` との照合で管理権限を判定
- 管理者ログイン中も会員マイページを利用可能（会員ID紐付け前提）

## 技術スタック
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Backend**: Google Apps Script (GAS) + Google Spreadsheet

## 作業開始前の確認順
作業を始める前に、以下をこの順で確認してください。

グランドルール:
- 技術選定・仕様提案・運用判断の前に、必ず Web 検索で最新の一次ソースを確認し、根拠を示してください。
- 技術選定・仕様提案では、ベストプラクティスを模索し、この案件に適した案として提案してください。
- 外部ベストプラクティスと案件正本が衝突する場合は、案件正本を優先し、差分を記録してください。

1. `HANDOVER.md`
2. `GLOBAL_GROUND_RULES/CLAUDE.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/10_SOW.md`
5. `docs/09_DEPLOYMENT_POLICY.md`
6. `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`

デプロイ、認証、DB整合、障害対応の判断は上記を正本とします。`README.md` は入口案内であり、運用判断の最上位ではありません。ただし、技術選定と仕様提案では Web 検索による最新確認、ベストプラクティスの模索、根拠提示を必須とします。

## 開発環境のセットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
ルートディレクトリに `.env` ファイルを作成し、以下の変数を設定してください。
```env
# 必須: Gemini APIキー (AI機能用)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

### 4. ローカル検証
```bash
npm run typecheck
npm run build
```

`npm run build` は会員ポータルと公開ポータルの両方をビルドします。ローカルでは UI の疑似動作確認を行わず、構文・型・ビルド成立の確認に限定します。

### 5. Build Preview 用ビルド
Google AI Studio の静的確認が必要な場合のみ、以下を使用します。
```bash
npm run build:preview
```
このビルドは見た目確認用です。動作確認は GAS 上で行います。

## GASへのデプロイ (clasp)
本プロジェクトは `vite-plugin-singlefile` を使用しており、ビルドすると1つの `index.html` にJS/CSSがインライン化されます。

1. `npm run clasp:login` でGoogleアカウントにログイン
2. `npm run clasp:setup -- <GAS_SCRIPT_ID>` で `.clasp.json` を生成
3. `npm run build:gas` で GAS 組み込み用HTMLを生成
4. `cd backend && npx clasp push --force` でコードを反映
5. `cd backend && npx clasp version "<release note>"` で新Versionを作成
6. Apps Script UI の `Manage deployments` で、固定2 Deployment ID を同じVersionへ更新

重要:
- `clasp deploy --deploymentId` は使用禁止です。
- 本番運用は固定2 Deployment ID を同時更新します。
- 正式な手順と禁止事項は `docs/09_DEPLOYMENT_POLICY.md` を参照してください。

### DB(スプレッドシート)初期化
GAS側にDBシートを自動作成するには、以下を実行します。
```bash
npx clasp run setupDatabase
```
この関数は Script Properties に `DB_SPREADSHEET_ID` を保存し、`Members` / `Trainings` シートを作成します。
初回はデモ用データも投入されます。

## ドキュメント
現行の正本一覧は `docs/00_DOC_INDEX.md` を参照してください。特に以下が重要です。

- `HANDOVER.md`
- `GLOBAL_GROUND_RULES/CLAUDE.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
- `docs/10_SOW.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`

## 運用メモ（2026-03-07追加）
- 本番 `/exec` が 404 の場合は、まず `Manage deployments` で **Web app** デプロイになっているか確認してください。
- 既定の切り分けは `npx clasp deployments` → `getWebAppEndpointInfo()` → `/exec` 疎通確認の順です。
- 研修登録/変更では、任意項目のラベル横「非表示」で項目を隠せます（表示設定パネルで再表示可）。

## デプロイ運用の公式ルール（2026-03-08以降）
- 本番URLは固定運用です。新規Deploymentを毎回作成しません。
- 手順は `docs/09_DEPLOYMENT_POLICY.md` を唯一の正本として参照してください。
- SOW要件は `docs/10_SOW.md` に明記しています。

## オンライン前提の開発フロー
1. `HANDOVER.md`、`GLOBAL_GROUND_RULES/CLAUDE.md`、`GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` を再読する。
2. `cd backend && npx clasp show-authorized-user` で運用アカウントを確認する。
3. `npx clasp run healthCheck` と `npx clasp run getDbInfo` を実行し、オンライン疎通を確認する。
4. 実装変更を行う。
5. `npm run typecheck` と `npm run build` でローカル静的検証を行う。
6. `npm run build:gas` → `cd backend && npx clasp push --force` → `npx clasp version "..."` を実行する。
7. Apps Script UI の `Manage deployments` で固定2 Deployment ID を同一Versionへ更新する。
8. 実ブラウザで `/exec` と `/exec?app=public` を確認し、最後に `npx clasp run healthCheck` を再実行する。
9. `HANDOVER.md` と関連正本を更新する。
