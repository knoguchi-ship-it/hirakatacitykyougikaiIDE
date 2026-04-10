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
- **管理コンソール構成**:
  - 会員管理コンソール
  - 年会費管理コンソール
  - 研修管理コンソール
  - 一括メール送信コンソール（v195追加・MASTER/ADMIN限定）
  - 名簿出力コンソール（v196追加・MASTER/ADMIN限定）
  - システム権限コンソール
  - システム設定
  - いずれも同一の管理者認証判定で保護する。
  - 会員管理コンソールの対象年度フィルタはデフォルトを `全期間` とする。
  - 対象年度を指定した場合、会員一覧とダッシュボードは「その年度時点で在籍していたか」を基準に集計する。現在の `WITHDRAWN` 状態だけで過去年度の在籍者を除外しない。
  - ダッシュボードのヘッダーは対象年度フィルタと同じ表示を使い、`全期間` 選択時は `全期間` と表示する。

### 2.2 バックエンド (API)
- **技術**: **Google Apps Script (GAS)**
  - `doGet` / `doPost` 関数を用いて、フロントエンドからのリクエストを処理するAPIエンドポイントとして機能する。
  - `doGet` は `index.html`（React SPA）を配信する。
  - データ通信はすべて `google.script.run.processApiRequest(action, payload)` を経由する（`doPost` は未使用）。
  - 認証は以下の2系統を提供する。
    - 会員向け: `ログインID + パスワード` 認証（Googleログインは使わない）
    - 管理者向け: **セッション認証**（`checkAdminBySession_` / `Session.getActiveUser()`）のみ。IDトークン検証（`adminGoogleLogin_`）は v118 で廃止済み。

### 2.3 データベース
- **技術**: **Google スプレッドシート**
  - 個人会員、事業所会員、研修データなどを別々のシートで管理する。
  - 事務局スタッフが直接閲覧・編集・バックアップを行うことが容易。

### 2.4 メール配信・通知
- **既存リマインダー**: `MailApp.sendEmail`（変更なし）
  - 研修リマインダー等の定期送信に使用。
  - ドライランは API/CLI 実行のみ（UIボタンは実装しない）。
- **管理コンソール メール送信機能（研修申込者向け）**: `GmailApp.sendEmail`（2026-03-13 追加）
  - 研修申込者への一斉・個別メール送信に使用。
  - `from` オプションでスクリプトオーナーの Gmail エイリアスを選択可能（`GmailApp.getAliases()` で取得）。
  - `replyTo` オプションにログイン中管理者のメールアドレス（`Session.getActiveUser().getEmail()`）を自動設定。
  - 必要追加スコープ: `https://www.googleapis.com/auth/gmail.send`（`appsscript.json` の `oauthScopes` に追記）。
- **会員一括メール送信機能（v195 追加）**: `GmailApp.sendEmail`
  - 会員（個人/賛助/事業所職員）への一斉メール送信。`BulkMailSender.tsx` コンソール経由。
  - INDIVIDUAL/SUPPORT: T_会員.代表メールアドレス宛。BUSINESS: T_事業所職員（メール配信希望コード ≠ 'NO'）。
  - Drive自動添付（フォルダID設定時）: ファイル名に `姓名`（スペースなし）が含まれるファイルを自動照合。
  - 送信結果を `T_メール送信ログ` に記録（個人情報は記録しない）。閲覧権限は `EMAIL_LOG_VIEWER_ROLE` で動的制御。
- **PDF名簿出力機能（v196 追加）**: `UrlFetchApp` + `SpreadsheetApp`
  - テンプレートスプレッドシート（`ROSTER_TEMPLATE_SS_ID`）を一時コピーし、`_DATA` シートにデータ充填 → flush() → UrlFetchApp でPDF blob取得。
  - 全対象のPDFを `Utilities.zip()` でZIP化 → DriveApp.createFile → DLリンク返却。
  - 上限50件（6分制限対策）。事業所会員は REPRESENTATIVE→ADMIN→STAFF 順で職員一覧をPDF内展開。
  - スコープ: `https://www.googleapis.com/auth/drive`（v194 で追加済み）。

## 3. ディレクトリ構成

### 3.1 現行構成（2026-03-30 時点）
```text
/
├── src/
│   ├── components/              # 会員マイページ用 UI コンポーネント
│   ├── public-portal/           # 公開ポータル用 React ソース
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── services/                # 会員マイページ側 API / AI 連携
│   ├── shared/                  # 共通型定義・API ラッパー
│   │   ├── api-base.ts
│   │   └── types.ts
│   ├── App.tsx                  # 会員マイページ ルート
│   ├── index.tsx                # 会員マイページ エントリポイント
│   └── types.ts                 # 会員マイページ側型定義
├── backend/                     # GAS バックエンド / デプロイ成果物
│   ├── Code.gs
│   ├── appsscript.json
│   ├── index.html
│   └── index_public.html
├── scripts/                     # build / GAS 反映補助
├── docs/                        # 正本ドキュメント
├── index.html                   # 会員ポータル用エントリ
├── index_public.html            # 公開ポータル用エントリ
└── vite.config.ts               # Vite 設定
```

### 3.2 ビルド戦略
- Vite は `VITE_APP` 環境変数でビルド対象を切り替える。
  - 未設定または `member`: `index.html` → `dist/index.html`
  - `public`: `index_public.html` → `dist-public/index_public.html`
- `scripts/build-all.mjs` は会員ポータルと公開ポータルを順番にビルドする。
- `scripts/build-gas.mjs` は両ポータルをビルド後、`backend/index.html` と `backend/index_public.html` にコピーする。
- `vite-plugin-singlefile` により、各 HTML は JS/CSS を内包した自己完結ファイルになる。

## 4. 状態管理 (State Management)
- **Source of Truth**: `App.tsx` 内のグローバルステート（`members`, `trainings` 等）。
- **データフロー**:
  1. 未認証時は `getAuthConfig` だけを取得し、ログイン画面を先に表示する。
  2. 管理者ログイン直後の管理トップは `getAdminDashboardData` と `getSystemSettings` を優先し、集計・一覧サマリーだけを先に表示する。
  3. 研修管理コンソールは `getTrainingManagementData` で研修一覧だけを先に読み込み、研修詳細編集に不要な会員データ読込を避ける。
  4. `profile` / `training-apply` は会員単位の軽量 API `getMemberPortalData` を呼び出し、対象会員の情報と研修一覧だけを取得する。
  5. 管理者ログイン成功時も `getMemberPortalData(memberId)` を先に読み込み、左メニューに紐付け済みの会員・職員名を表示できる状態を作る。
  6. `system-permissions` は `getAdminPermissionData` で `T_管理者Googleホワイトリスト` と紐付け候補を取得し、その場で追加・更新・削除する。
  7. 管理者が会員詳細編集など全件データを必要とする画面へ進んだ時点で `fetchAllData` を呼び出す。
  8. 取得したデータを `App.tsx` のステートに格納し、Props として子コンポーネントへ伝播する。
  9. 変更時は `processApiRequest(action, payload)` を呼び出してスプレッドシートを更新し、レスポンス後に必要なローカルステートとキャッシュを同期する。
- **年会費管理コンソール**:
  - 会員マイページ向けの `annualFeeHistory` は過去2年の簡易表示に限定する。
  - 管理者向けの年会費一覧・監査履歴は専用 API で取得する。
  - 年度選択時は対象年度の一覧だけを取得し、不要な全年度データの転送を避ける。
  - 一覧の各行で `納入状況 / 納入確認日 / 備考` を直接編集し、その行単位で保存する。
  - 金額は `M_会員種別` の `年会費金額` を参照し、画面入力では変更させない。
- **API通信プロトコル**: `google.script.run.processApiRequest(action, JSON.stringify(payload))`
  - レスポンスは JSON 文字列 `{"success": bool, "data": any}` または `{"success": false, "error": string}`。
  - `doPost` は使用しない（`google.script.run` でのみ通信）。
- **キャッシュ戦略（v150）**:
  - `CacheService.getScriptCache()` で API レスポンスを TTL 300 秒でキャッシュする。
  - 100KB 超のレスポンスは `putChunkedCache_` / `getChunkedCache_` でチャンク分割（90KB/chunk）して格納する。
  - `warmUp()` トリガー関数でキャッシュをプリウォームできる。
- **複合 API（v150）**: ログイン直後の round-trip を削減するため、以下の統合 API を提供する。
  - `getAdminInitData`: ダッシュボード + 設定を 1 回で返す
  - `memberLoginWithData`: 会員認証 + ポータルデータを 1 回で返す
  - `adminLoginWithData`: 管理者認証 + ポータルデータを 1 回で返す
- **スケルトン UI（v150）**: ローディング中に骨格表示（WCAG 2.2 準拠）を行い、体感速度を改善する。

## 5. API アクション一覧（`processApiRequest` ルーティング）

`google.script.run.processApiRequest(action, JSON.stringify(payload))` で呼び出せるアクション。

| action | 役割 | 主な権限 |
|---|---|---|
| `fetchAllData` | 全データ一括取得（会員・研修・ユーザー情報） | 全員 |
| `getAdminDashboardData` | 管理トップ用の軽量集計・会員一覧サマリー・研修サマリー取得 | MASTER/ADMIN |
| `getAdminInitData` | 管理者初期データ統合API（dashboard + settings を1回で返す）(v150) | MASTER/ADMIN |
| `getTrainingManagementData` | 研修管理コンソール用の研修一覧取得 | 管理者（研修権限含む） |
| `getMemberPortalData` | 会員マイページ/研修申込画面用の対象会員データ取得 | 会員/管理者 |
| `memberLogin` | 会員ログイン（ID + PW） | 未認証 |
| `memberLoginWithData` | 会員ログイン+ポータルデータ統合API（round-trip削減）(v150) | 未認証 |
| `checkAdminBySession` | 管理者 Google ログイン（セッション方式・本番標準） | 未認証 |
| `adminLoginWithData` | 管理者ログイン+ポータルデータ統合API（round-trip削減）(v150) | 未認証 |
| `changePassword` | パスワード変更（現在PW照合あり） | 会員 |
| `updateMember` | 会員情報更新（管理者用 allowlist でサニタイズ）(v143) | MASTER/ADMIN |
| `updateMembersBatch` | 会員一括更新（最大100件） | MASTER/ADMIN |
| `updateMemberSelf` | 会員自身のプロフィール更新（サーバーサイド allowlist フィルタ、loginId→会員ID照合） | 会員 |
| `createMember` | 入会処理（会員+認証レコード作成） | MASTER/ADMIN |
| `withdrawMember` | 退会処理（管理者操作） | MASTER/ADMIN |
| `scheduleWithdrawMember` | 退会予約（翌年度4/1に退会） | MASTER/ADMIN |
| `cancelScheduledWithdraw` | 退会予約の取消（管理者操作） | MASTER/ADMIN |
| `updateStaff` | 職員個別更新（権限・状態・氏名等） | MASTER/ADMIN |
| `removeStaffFromOffice` | 職員除籍（認証アカウント無効化連動） | MASTER/ADMIN |
| `getAdminPersonList` | フラット人物リスト取得（個人+賛助+職員を人物単位で表示） | MASTER/ADMIN |
| `updatePersonsBatch` | 人物一括更新 | MASTER/ADMIN |
| `convertMemberType` | 会員種別変更（個人⇔事業所職員の双方向転換） | MASTER/ADMIN |
| `saveTraining` | 研修の新規登録・更新 | 管理者（研修権限含む） |
| `uploadTrainingFile` | 研修案内状（PDF）のアップロード → Drive保存 → URL返却 | 管理者（研修権限含む） |
| `applyTraining` | 研修申込 | 会員 |
| `cancelTraining` | 研修申込取消 | 会員 |
| `sendTrainingReminder` | 研修リマインダーメール送信（ドライラン対応） | MASTER/ADMIN/TRAINING_MANAGER |
| `getTrainingApplicants` | 申込者一覧（会員・非会員統合ビュー） | 管理者（研修権限含む） |
| `getAdminEmailAliases` | スクリプトオーナーの Gmail エイリアス一覧取得（`GmailApp.getAliases()`） | MASTER/ADMIN/TRAINING_MANAGER |
| `sendTrainingMail` | 研修申込者への一斉・個別メール送信（GmailApp使用、添付・差し込み対応） | MASTER/ADMIN/TRAINING_MANAGER |
| `getSystemSettings` | システム設定取得（職員数上限・研修履歴参照期間） | MASTER/ADMIN |
| `updateSystemSettings` | システム設定更新 | MASTER/ADMIN |
| `getAdminPermissionData` | システム権限コンソール用のホワイトリスト一覧・紐付け候補取得 | MASTER/ADMIN |
| `saveAdminPermission` | 管理者Googleホワイトリストの追加・更新 | MASTER/ADMIN |
| `deleteAdminPermission` | 管理者Googleホワイトリストの削除（論理削除） | MASTER/ADMIN |
| `getAnnualFeeAdminData` | 年会費管理コンソール用の対象年度一覧・監査履歴取得 | MASTER/ADMIN |
| `saveAnnualFeeRecord` | 年会費レコードの新規登録・更新 | MASTER/ADMIN |
| `saveAnnualFeeRecordsBatch` | 年会費一括保存（Partial Success 対応）(v124) | MASTER/ADMIN |
| `getDbInfo` | DB接続情報・スキーマ確認 | MASTER/ADMIN |
| `getMembersForBulkMail` | 会員一括メール用宛先一覧取得（フィルタ付き）(v195) | MASTER/ADMIN |
| `sendBulkMemberMail` | 会員一括メール送信 + T_メール送信ログ記録 (v195) | MASTER/ADMIN |
| `getEmailSendLog` | メール送信ログ取得（EMAIL_LOG_VIEWER_ROLE 動的権限チェック）(v195) | 設定依存 |
| `getMembersForRoster` | PDF名簿出力用対象一覧取得（フィルタ付き）(v196) | MASTER/ADMIN |
| `generateRosterZip` | テンプレートSS → PDF → ZIP生成 → DriveURL返却 (v196) | MASTER/ADMIN |
| `getPublicTrainings` | 公開ポータル用：受付中研修一覧取得 | 不要（公開） |
| `applyTrainingExternal` | 非会員研修申込（`T_外部申込者` 作成 + `T_研修申込` 追加） | 不要（公開） |
| `cancelTrainingExternal` | 非会員申込取消（申込ID + 登録メール一致で本人確認） | 不要（公開） |
| `submitMemberApplication` | 公開ポータル用：新規入会申込（個人/事業所/賛助） | 不要（公開） |
| `withdrawSelf` | 会員自身の退会申請（年度末退会予約） | 会員 |
| `cancelWithdrawalSelf` | 退会予約の取消 | 会員 |

## 6. 認証・認可アーキテクチャ

### 6.1 会員認証
- 会員は `T_認証アカウント` の `認証方式=PASSWORD` で認証する。
- `ログインID` は表示のみ、パスワードはハッシュ比較で検証する。
- パスワード変更は `currentPassword` を必須入力とし、`changePassword_()`（GAS）で現在PWハッシュ照合後に更新する。

### 6.2 管理者認証
- **方式A（本番標準）: セッション認証**
  - フロントエンドは `google.script.run.processApiRequest('checkAdminBySession', ...)` を呼び出す。
  - GAS サーバー側で `Session.getActiveUser().getEmail()` により呼び出し元のブラウザ Google セッションのメールアドレスを取得する。
  - 取得したメールを `T_管理者Googleホワイトリスト` のメール列と突合し、`有効フラグ=true` のレコードが存在すれば認証成功。
  - **採用理由**: GAS Web App は `script.googleusercontent.com` ドメインに埋め込まれるため、OAuth ポップアップ（GIS: Google Identity Services）が Same-Origin 制限で開けない。`google.script.run` の呼び出し元セッションを利用するこの方式が唯一の安定した手段。
- **方式B（v118 で廃止済み）: IDトークン検証**
  - ~~フロントエンドが Google Sign-In で取得した ID トークンを `adminGoogleLogin_()` に渡す方式。~~
  - v118 で GIS（Google Identity Services）が GAS iframe sandbox origin では動作しないことが確定し、廃止。`processApiRequest` のルーティングからも削除済み。
- **共通の紐付け検証**: ホワイトリスト照合後、`紐付け認証ID` → `T_認証アカウント`、`紐付け会員ID` → `T_会員` の整合性を確認し、不整合は拒否する。

### 6.3 認可
- 管理者ログイン時は `管理者ページ` と `会員マイページ` の両方を表示可能にする。
- 管理者ログイン後の左メニュー表示名は、`T_管理者Googleホワイトリスト` に紐付く `T_認証アカウント` / `T_会員` / `T_事業所職員` から解決した会員・職員名を優先表示する。
- 会員マイページは3種類（個人会員 / 事業所会員管理者 / 事業所会員メンバー）として表示制御する。
- 年会費管理コンソールとシステム権限コンソールは管理者ログイン時のみ表示し、会員ログインでは導線を出さない。

## 6.1 年会費管理アーキテクチャ（2026-03-15 追加）
- 元データ: `T_年会費納入履歴`
- 監査データ: `T_年会費更新履歴`
- 金額マスタ: `M_会員種別.年会費金額`
- 一意性: `会員ID + 対象年度` の組み合わせで論理的に一意とする。
- 表示方式:
  - 対象年度ごとに全会員を 1 行ずつ表示する。
  - 当該年度レコードが未作成の会員は、未保存の仮想行として表示し、そのまま保存時に新規作成する。
- 更新方式:
  - `processApiRequest` の管理者判定で認可し、年会費処理関数では不要な再認証を避ける。
  - GAS 側で `会員ID + 対象年度` の重複を検査する。
  - 更新時は `LockService` により同時更新競合を抑止する。
  - 年会費一覧は対象年度単位で構築し、キャッシュで短時間再利用する。
  - 更新後は監査ログを `T_年会費更新履歴` に追記する。

## 7. 公開ポータル構成（2026-03-17 更新）

### 7.1 URL 構成
| URL | 役割 |
|-----|------|
| `.../exec` | 会員ポータル（現行・ログイン必須） |
| `.../exec?app=public` | 「枚方市介護支援専門員連絡協議会お申込みポータル」（ログイン不要） |

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
| 初期画面で「研修申込」または「新規入会申込」を選択 | 不要 | 全員 |
| 受付中研修一覧の閲覧 | 不要 | 全員 |
| 非会員として研修申込 | 不要（氏名・メール等入力） | 非会員 |
| 非会員申込の取消 | 申込ID + 登録メール一致 | 非会員本人 |
| 新規入会申込（個人/事業所/賛助） | 不要 | 全員 |
| 研修の新規登録・編集 | 管理者 Google 認証 | 管理者のみ |

### 7.4 個人情報保護法対応（公開フォーム必須事項）
根拠：個人情報保護法・医療介護関係事業者ガイダンス（2025年6月改正版）

| 要件 | 実装方針 |
|------|----------|
| **利用目的の明示** | フォーム内に「収集した個人情報は研修申込の受付・確認連絡のみに使用します」を表示 |
| **同意取得** | 送信ボタン前に同意チェックボックスを必須配置。未チェックの場合は送信不可 |
| **データ保管期間** | 研修終了日の翌年4月1日以降に `削除フラグ=true` を自動適用（退会ポリシーに準拠） |
| **プライバシーポリシー** | ポータル内に内包せず、本サイト別建ての正本を参照させる |
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
