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

# 任意: ローカル開発時にモックデータを使用するかどうか (true にするとGASと通信せずモックを使用します)
VITE_USE_MOCK=true
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

### 4. Google AI Studio Build Preview 用ビルド
Google AI Studio の Build Preview でモックアップを確実に表示するため、以下を使用します。
```bash
npm run build:preview
```
`.env.preview` で `VITE_USE_MOCK=true` を固定しているため、GAS未接続でもUI確認が可能です。

## GASへのデプロイ (clasp)
本プロジェクトは `vite-plugin-singlefile` を使用しており、ビルドすると1つの `index.html` にJS/CSSがインライン化されます。

1. `npm run clasp:login` でGoogleアカウントにログイン
2. `npm run clasp:setup -- <GAS_SCRIPT_ID>` で `.clasp.json` を生成
3. `npm run clasp:push` でビルドとGASへのアップロードを実行
4. 初回のみ `npx clasp deploy -d "initial deploy"` でWebアプリをデプロイ

`clasp:push` は `backend/Code.gs` と `backend/index.html` をGASへ反映します。
デプロイ後、Apps Script のデプロイ設定画面でアクセス権を用途に合わせて設定してください
（例: 組織内限定 or 一般公開）。`clasp` からはアクセス範囲を直接指定できません。

### DB(スプレッドシート)初期化
GAS側にDBシートを自動作成するには、以下を実行します。
```bash
npx clasp run setupDatabase
```
この関数は Script Properties に `DB_SPREADSHEET_ID` を保存し、`Members` / `Trainings` シートを作成します。
初回はデモ用データも投入されます。

## ドキュメント
詳細な仕様や設計については、`docs/` ディレクトリを参照してください。
- [要件定義書 (PRD)](./docs/01_PRD.md)
- [アーキテクチャ設計](./docs/02_ARCHITECTURE.md)
- [データモデル設計](./docs/03_DATA_MODEL.md)
- [ロードマップ](./docs/04_ROADMAP.md)

- [引き継ぎ書（2026-03-06 v26）](./docs/99_HANDOVER_2026-03-06_v26.md)
- [引き継ぎ書（2026-03-06 v24/v25）](./docs/99_HANDOVER_2026-03-06.md)
- [引き継ぎ書（2026-03-05）](./docs/99_HANDOVER_2026-03-05.md)
