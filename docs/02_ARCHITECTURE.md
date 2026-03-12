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
       +--- [ MailApp (メール配信) ]
```

## 2. 各コンポーネントの技術選定と役割

### 2.1 フロントエンド (UI)
- **技術**: React 19, TypeScript, Vite, Tailwind CSS
- **ホスティング**: **Google Apps Script (HTML Service)**
  - Viteのビルド設定(`vite-plugin-singlefile`等)を用いて、JSとCSSをインライン化した単一の `index.html` を生成し、GASのWebアプリとしてデプロイ・配信する。レンタルサーバーは不要。

### 2.2 バックエンド (API)
- **技術**: **Google Apps Script (GAS)**
  - `doGet` / `doPost` 関数を用いて、フロントエンドからのリクエストを処理するAPIエンドポイントとして機能する。
  - `doGet` は `index.html`（React SPA）を配信する。
  - データ通信はすべて `google.script.run.processApiRequest(action, payload)` を経由する（`doPost` は未使用）。
  - 認証は以下の2系統を提供する。
    - 会員向け: `ログインID + パスワード` 認証（Googleログインは使わない）
    - 管理者向け: **セッション認証**（`checkAdminBySession_` / `Session.getActiveUser()`）を標準とする。IDトークン検証（`adminGoogleLogin_`）は補完的に保持。

### 2.3 データベース
- **技術**: **Google スプレッドシート**
  - 個人会員、事業所会員、研修データなどを別々のシートで管理する。
  - 事務局スタッフが直接閲覧・編集・バックアップを行うことが容易。

### 2.4 メール配信・通知
- **技術**: **MailApp (`MailApp.sendEmail`)** ※GmailApp は使用しない
  - 研修リマインダー等の送信をGAS組込みの `MailApp.sendEmail` で実行する。
  - ドライランは API/CLI 実行のみ（UIボタンは実装しない）。

## 3. ディレクトリ構成

### 3.1 現行（会員ポータルのみ）
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
└── vite.config.ts       # Viteビルド設定 (単一ファイル出力設定を追加済み)
```

### 3.2 公開ポータル追加後（設計）
```text
/
├── src/
│   ├── shared/                    # 【新設】両ポータル共通
│   │   ├── components/
│   │   │   └── TrainingForm.tsx   # 研修登録フォーム（唯一の正本）
│   │   ├── types.ts               # 共通型定義（現 types.ts から移動）
│   │   └── api-base.ts            # processApiRequest 共通ラッパー
│   ├── member-portal/             # 【移動】現行アプリ
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── public-portal/             # 【新設】公開ポータル
│       ├── components/
│       │   ├── PublicTrainingList.tsx
│       │   └── ExternalApplyForm.tsx
│       ├── App.tsx
│       └── index.tsx
├── backend/
├── docs/
├── index.html           # 会員ポータル用エントリ
├── index_public.html    # 【新設】公開ポータル用エントリ
└── vite.config.ts       # マルチエントリポイント設定へ更新
```

**`vite.config.ts` マルチエントリ設定（予定）:**
```typescript
resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
build: {
  rollupOptions: {
    input: {
      member: resolve(__dirname, 'index.html'),
      public: resolve(__dirname, 'index_public.html'),
    }
  }
}
```
> `vite-plugin-singlefile` はマルチエントリに対応済み。各 HTML は独立した自己完結バンドルとなり、共有コードは両バンドルに重複して含まれる（GAS デプロイモデルの制約上許容）。`tsconfig.json` の `paths` も `@shared` を追加する。

## 4. 状態管理 (State Management)
- **Source of Truth**: `App.tsx` 内のグローバルステート（`members`, `trainings` 等）。
- **データフロー**:
  1. 初期マウント時に `google.script.run.processApiRequest('fetchAllData', ...)` を呼び出し、スプレッドシートの全データを一括取得。
  2. 取得したデータを `App.tsx` のステートに格納し、Props として子コンポーネントへ伝播。
  3. 変更時は `processApiRequest(action, payload)` を呼び出してスプレッドシートを更新し、レスポンス後にローカルのステートを同期する。
- **API通信プロトコル**: `google.script.run.processApiRequest(action, JSON.stringify(payload))`
  - レスポンスは JSON 文字列 `{"success": bool, "data": any}` または `{"success": false, "error": string}`。
  - `doPost` は使用しない（`google.script.run` でのみ通信）。

## 5. API アクション一覧（`processApiRequest` ルーティング）

`google.script.run.processApiRequest(action, JSON.stringify(payload))` で呼び出せるアクション。

| action | 役割 | 主な権限 |
|---|---|---|
| `fetchAllData` | 全データ一括取得（会員・研修・ユーザー情報） | 全員 |
| `memberLogin` | 会員ログイン（ID + PW） | 未認証 |
| `adminGoogleLogin` | 管理者 Google ログイン（IDトークン方式） | 未認証 |
| `checkAdminBySession` | 管理者 Google ログイン（セッション方式・本番標準） | 未認証 |
| `changePassword` | パスワード変更（⚠️ 現在PW検証なし — 要改修） | 会員 |
| `updateMember` | 会員情報更新 | 会員/管理者 |
| `saveTraining` | 研修の新規登録・更新 | 管理者 |
| `uploadTrainingFile` | 研修案内状（PDF）のアップロード → Drive保存 → URL返却 | 管理者 |
| `applyTraining` | 研修申込 | 会員 |
| `cancelTraining` | 研修申込取消 | 会員 |
| `sendTrainingReminder` | 研修リマインダーメール送信（ドライラン対応） | 管理者/CLI |
| `getAuthConfig` | 管理者 Google Client ID 等の認証設定取得 | 全員 |
| `getSystemSettings` | システム設定取得（職員数上限・研修履歴参照期間） | 管理者 |
| `updateSystemSettings` | システム設定更新 | 管理者 |
| `getDbInfo` | DB接続情報・スキーマ確認 | 管理者/CLI |
| `seedDemoData` | デモデータ投入 | CLI のみ |
| `getPublicTrainings` | 公開ポータル用：受付中研修一覧取得 | 不要（公開） |
| `applyTrainingExternal` | 非会員研修申込（`T_外部申込者` 作成 + `T_研修申込` 追加） | 不要（公開） |
| `cancelTrainingExternal` | 非会員申込取消（申込ID + 登録メール一致で本人確認） | 不要（公開） |
| `getTrainingApplicants` | 申込者一覧（会員・非会員統合ビュー） | 管理者 |

## 6. 認証・認可アーキテクチャ

### 5.1 会員認証
- 会員は `T_認証アカウント` の `認証方式=PASSWORD` で認証する。
- `ログインID` は表示のみ、パスワードはハッシュ比較で検証する。
- パスワード変更APIは「現在PW照合 -> 新PW保存（ハッシュ）」で処理する。

### 5.2 管理者認証
- **方式A（本番標準）: セッション認証**
  - フロントエンドは `google.script.run.processApiRequest('checkAdminBySession', ...)` を呼び出す。
  - GAS サーバー側で `Session.getActiveUser().getEmail()` により呼び出し元のブラウザ Google セッションのメールアドレスを取得する。
  - 取得したメールを `T_管理者Googleホワイトリスト` のメール列と突合し、`有効フラグ=true` のレコードが存在すれば認証成功。
  - **採用理由**: GAS Web App は `script.googleusercontent.com` ドメインに埋め込まれるため、OAuth ポップアップ（GIS: Google Identity Services）が Same-Origin 制限で開けない。`google.script.run` の呼び出し元セッションを利用するこの方式が唯一の安定した手段。
- **方式B（補完/レガシー互換）: IDトークン検証**
  - フロントエンドが Google Sign-In で取得した ID トークンを `adminGoogleLogin_()` に渡す。
  - GAS 内で `verifyGoogleIdToken_()` を呼び出し、Google の公開鍵で署名を検証する。
  - 検証済み `sub`（GoogleユーザーID）または `email` でホワイトリスト照合する。
- **共通の紐付け検証**: ホワイトリスト照合後、`紐付け認証ID` → `T_認証アカウント`、`紐付け会員ID` → `T_会員` の整合性を確認し、不整合は拒否する。

### 5.3 認可
- 管理者ログイン時は `管理者ページ` と `会員マイページ` の両方を表示可能にする。
- 会員マイページは3種類（個人会員 / 事業所会員管理者 / 事業所会員メンバー）として表示制御する。

## 7. 公開ポータル構成（2026-03-12 設計確定）

### 7.1 URL 構成
| URL | 役割 |
|-----|------|
| `.../exec` | 会員ポータル（現行・ログイン必須） |
| `.../exec?app=public` | 公開ポータル（新設・ログイン不要） |

### 7.2 doGet ルーティング
```javascript
function doGet(e) {
  var app = (e && e.parameter && e.parameter.app) || 'member';
  var allowedApps = { 'member': 'index', 'public': 'index_public' };
  var file = allowedApps[app] || 'index';  // ホワイトリスト必須
  return HtmlService.createHtmlOutputFromFile(file)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```
> セキュリティ原則：`e.parameter.app` を直接 `createHtmlOutputFromFile` に渡さない。ホワイトリスト検証必須。

### 7.3 公開ポータルの機能範囲
| 機能 | 認証 | 対象 |
|------|------|------|
| 受付中研修一覧の閲覧 | 不要 | 全員 |
| 非会員として研修申込 | 不要（氏名・メール等入力） | 非会員 |
| 非会員申込の取消 | 申込ID + 登録メール一致 | 非会員本人 |
| 研修の新規登録・編集 | 管理者 Google 認証 | 管理者のみ |

### 7.4 個人情報保護法対応（公開フォーム必須事項）
根拠：個人情報保護法・医療介護関係事業者ガイダンス（2025年6月改正版）

| 要件 | 実装方針 |
|------|----------|
| **利用目的の明示** | フォーム内に「収集した個人情報は研修申込の受付・確認連絡のみに使用します」を表示 |
| **同意取得** | 送信ボタン前に同意チェックボックスを必須配置。未チェックの場合は送信不可 |
| **データ保管期間** | 研修終了日の翌年4月1日以降に `削除フラグ=true` を自動適用（退会ポリシーに準拠） |
| **プライバシーポリシー** | フォームにリンクを表示（URLは運用側で設定） |
| **第三者提供の禁止** | 収集データは本システム内のみで使用。外部提供なし |

### 7.5 スパム・ボット対策
GAS の制約（外部 JS 読み込み制限）上、reCAPTCHA 等の外部サービスは利用不可。以下で対応：
- **Honeypot フィールド**: フォームに非表示フィールドを設置。ボットが入力した場合はサーバー側で申込を拒否
- **重複申込チェック**: 同一メールアドレス + 同一研修 ID での重複申込をサーバー側で検出・拒否
- **申込期間チェック**: `申込開始日`〜`申込締切日` をサーバー側で必ず検証

## 8. AI連携 (Gemini API)
- `@google/genai` SDKを使用。
- `services/geminiService.ts` にロジックをカプセル化。
- 主に事務局機能（研修案内メールの自動生成）で利用。プロンプトエンジニアリングにより、対象者の属性に合わせた丁寧な文面を出力する。
