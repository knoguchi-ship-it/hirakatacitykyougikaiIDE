# アーキテクチャ設計書

## 1. システム全体構成 (Google Workspace for Nonprofits 構成)
本システムは、ランニングコストを抑えるため、外部のレンタルサーバーやクラウドデータベースを使用せず、**Google Workspace for Nonprofits (GWNP)** の標準機能のみで構築する。

```text
[ Client (Browser) ]
       |
       | (HTTPS)
       v
[ Google Apps Script (Web App) ] --- (HTML/JS/CSSを配信)
       |
       | (API通信 / GAS内部処理)
       v
[ Google Spreadsheet (Database) ]
       |
       +--- [ Gmail (メール配信) ]
```

## 2. 各コンポーネントの技術選定と役割

### 2.1 フロントエンド (UI)
- **技術**: React 19, TypeScript, Vite, Tailwind CSS
- **ホスティング**: **Google Apps Script (HTML Service)**
  - Viteのビルド設定(`vite-plugin-singlefile`等)を用いて、JSとCSSをインライン化した単一の `index.html` を生成し、GASのWebアプリとしてデプロイ・配信する。レンタルサーバーは不要。

### 2.2 バックエンド (API)
- **技術**: **Google Apps Script (GAS)**
  - `doGet` / `doPost` 関数を用いて、フロントエンドからのリクエストを処理するAPIエンドポイントとして機能する。

### 2.3 データベース
- **技術**: **Google スプレッドシート**
  - 個人会員、事業所会員、研修データなどを別々のシートで管理する。
  - 事務局スタッフが直接閲覧・編集・バックアップを行うことが容易。

### 2.4 メール配信・通知
- **技術**: **Gmail (`GmailApp` API)**
  - 研修の申込完了通知や、Gemini APIで生成した案内文の送信をGAS経由でGmailから実行する。GWNPの高い送信上限を活用する。

## 3. ディレクトリ構成
```text
/
├── src/
│   ├── components/      # UIコンポーネント
│   ├── services/        # 外部通信ロジック (api.ts, geminiService.ts)
│   ├── types.ts         # TypeScript型定義
│   ├── constants.ts     # モックデータ定義 (開発用)
│   ├── App.tsx          # ルートコンポーネント、グローバルState管理
│   └── index.tsx        # エントリポイント
├── backend/             # GASバックエンド用コード (Code.gs 等)
├── docs/                # ドキュメント群
├── index.html           # HTMLテンプレート
└── vite.config.ts       # Viteビルド設定 (単一ファイル出力設定を追加予定)
```

## 4. 状態管理 (State Management)
- **Source of Truth**: `App.tsx` 内の `members`, `trainings` ステート。
- **データフロー**:
  1. 初期マウント時にGASのAPI(`doGet`)を呼び出し、スプレッドシートのデータを取得。
  2. 取得したデータをPropsとして子コンポーネントへ伝播。
  3. 変更時はGASのAPI(`doPost`)へデータを送信し、スプレッドシートを更新後、ローカルのStateを同期する。

## 4. AI連携 (Gemini API)
- `@google/genai` SDKを使用。
- `services/geminiService.ts` にロジックをカプセル化。
- 主に事務局機能（研修案内メールの自動生成）で利用。プロンプトエンジニアリングにより、対象者の属性に合わせた丁寧な文面を出力する。
