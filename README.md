# 枚方市介護支援専門員連絡協議会 会員管理システム

## プロジェクト概要
本プロジェクトは、枚方市介護支援専門員連絡協議会の会員管理、研修申込、および年会費管理を効率化するためのWebアプリケーションです。
従来のアナログ（郵送・紙ベース）な管理体制から、デジタル（メール・Webシステム）への移行を促進し、事務局および会員双方の負担を軽減することを目的としています。

## 主な機能
- **会員マイページ**: 登録情報の確認・変更、年会費の納入状況確認
- **研修管理**: 開催中の研修へのオンライン申込、受講履歴の確認
- **事務局ダッシュボード**: 会員統計の可視化、会員データベースの管理
- **AIアシスト**: Gemini APIを活用した、研修案内メール等の自動生成

## 技術スタック
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Backend (Planned)**: Google Apps Script (GAS) / Spreadsheet or Firebase

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
2. `.clasp.json.example` を `.clasp.json` にリネームし、`scriptId` を設定
3. `npm run clasp:push` でビルドとGASへのアップロードを実行

## ドキュメント
詳細な仕様や設計については、`docs/` ディレクトリを参照してください。
- [要件定義書 (PRD)](./docs/01_PRD.md)
- [アーキテクチャ設計](./docs/02_ARCHITECTURE.md)
- [データモデル設計](./docs/03_DATA_MODEL.md)
- [ロードマップ](./docs/04_ROADMAP.md)
