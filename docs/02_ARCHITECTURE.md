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
  - 認証は以下の2系統を提供する。
    - 会員向け: `ログインID + パスワード` 認証（Googleログインは使わない）
    - 管理者向け: Google IDトークン検証 + `T_管理者Googleホワイトリスト` 照合

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

## 5. 認証・認可アーキテクチャ
### 5.1 会員認証
- 会員は `T_認証アカウント` の `認証方式=PASSWORD` で認証する。
- `ログインID` は表示のみ、パスワードはハッシュ比較で検証する。
- パスワード変更APIは「現在PW照合 -> 新PW保存（ハッシュ）」で処理する。

### 5.2 管理者認証
- 管理者は Google アカウントでサインインし、IDトークンをサーバー側で検証する。
- 検証済み Google主体を `T_管理者Googleホワイトリスト` と突合し、許可された場合のみ管理者セッションを発行する。
- さらに `紐付け認証ID` / `紐付け会員ID` と `T_認証アカウント` の一致を検証し、不一致は拒否する。

### 5.3 認可
- 管理者ログイン時は `管理者ページ` と `会員マイページ` の両方を表示可能にする。
- 会員マイページは3種類（個人会員 / 事業所会員管理者 / 事業所会員メンバー）として表示制御する。

## 4. AI連携 (Gemini API)
- `@google/genai` SDKを使用。
- `services/geminiService.ts` にロジックをカプセル化。
- 主に事務局機能（研修案内メールの自動生成）で利用。プロンプトエンジニアリングにより、対象者の属性に合わせた丁寧な文面を出力する。
