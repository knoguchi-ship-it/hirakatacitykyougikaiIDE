# 認証・権限仕様書

## 1. 目的
- 会員ログインと管理者ログインの方式を明確に分離し、判定ロジックの齟齬を防ぐ。
- 管理者が自分の会員マイページも利用できる要件を運用ルールとして固定する。

## 2. 認証方式
1. 会員ログイン
- 方式: `ログインID + パスワード`
- 使用テーブル: `T_認証アカウント`（`認証方式=PASSWORD`）
- Googleログインは使用しない。

2. 管理者ログイン
- 方式: Googleアカウント認証（IDトークン検証）
- 使用テーブル: `T_管理者Googleホワイトリスト`
- 許可条件:
  - Google主体（`GoogleユーザーID`）がホワイトリストに存在
  - `有効フラグ=true`
  - `紐付け認証ID` / `紐付け会員ID` が整合

## 3. 権限表示ルール
1. 会員マイページ種別
- 個人会員
- 事業所会員（管理者）
- 事業所会員（メンバー）

2. 左メニュー表示
- 会員ログイン: `会員マイページ` のみ
- 管理者ログイン: `会員マイページ` + `管理者ページ`

3. 管理者の会員情報紐付け
- 管理者アカウントにも必ず `会員ID` を紐付ける。
- 管理者ログイン中も、自分の会員情報を会員マイページで参照できる。

## 4. 会費・研修の表示仕様
1. 年会費
- 引き落とし機能は実装しない。
- 未納時のみ振込先口座を表示する。

2. 研修
- 受付中研修は `概要/詳細` を表示する。
- 案内文PDFを閲覧できるリンクを表示する。

## 5. 受け入れ基準（DoD）
1. 認証
- 会員ID/PWでログイン成功し、Googleログインなしで会員利用可能。
- ホワイトリスト外Googleアカウントは管理者ログイン不可。

2. 権限
- 管理者ログイン時のみ `管理者ページ` が左メニューに出る。
- 管理者ログイン時に `会員マイページ` も利用可能。

3. 監査
- `T_ログイン履歴` に `認証方式` が記録される。

4. 会費・研修
- 未納時のみ振込先表示が出る。
- 受付中研修の詳細とPDFが閲覧できる。

## 6. 設定済みサービス・権限一覧（2026-02-28時点）
対象プロジェクト: `uguisu-gas-exec-20260225191000`

### 6.1 GCP API（有効化済み）
1. `script.googleapis.com`（Apps Script API）
2. `drive.googleapis.com`（Google Drive API）
3. `logging.googleapis.com`（Cloud Logging API）

証跡:
- `docs/assets/gcp-setup-2026-02-28/01_cloud_logging_api_enabled.png`
- `docs/assets/gcp-setup-2026-02-28/02_apps_script_api_enabled.png`
- `docs/assets/gcp-setup-2026-02-28/03_drive_api_enabled.png`

### 6.2 Google Auth Platform（OAuth）
1. 対象ユーザー: `内部（Internal）`
2. OAuthクライアント（主要）
- `admin-google-login-web`（種類: ウェブ アプリケーション）
- JavaScript 生成元: `https://script.google.com`
3. 既存クライアント
- `Apps Script`（自動生成）
- `デスクトップ クライアント: 1`（clasp ログイン用途）

証跡:
- `docs/assets/gcp-setup-2026-02-28/04_auth_audience_internal.png`
- `docs/assets/gcp-setup-2026-02-28/05_auth_clients_list.png`

### 6.3 Apps Script 側（高度なサービス）
1. 高度なサービス: `Drive API` を追加済み

証跡:
- `docs/assets/gcp-setup-2026-02-28/06_apps_script_drive_service.png`

### 6.4 clasp 認証で要求される主なスコープ
1. `https://www.googleapis.com/auth/script.projects`
2. `https://www.googleapis.com/auth/script.deployments`
3. `https://www.googleapis.com/auth/script.webapp.deploy`
4. `https://www.googleapis.com/auth/drive.file`
5. `https://www.googleapis.com/auth/drive.metadata.readonly`
6. `https://www.googleapis.com/auth/logging.read`
7. `openid`, `email`, `profile`, `userinfo.email`, `userinfo.profile`
8. `https://www.googleapis.com/auth/cloud-platform`

## 7. 現在設定状況の確認方法
1. GCP API確認
- Google Cloud Console > `API とサービス` > `有効な API とサービス`
- `Apps Script API / Google Drive API / Cloud Logging API` が Enabled であること

2. OAuth設定確認
- Google Cloud Console > `Google Auth Platform` > `対象`
- `内部` になっていること
- Google Cloud Console > `Google Auth Platform` > `クライアント`
- `admin-google-login-web` が存在すること

3. Apps Script 高度なサービス確認
- Apps Script エディタ左ペイン `サービス`
- `Drive` が表示されること

4. ローカルCLI確認（補助）
- `gcloud config get-value project` が `uguisu-gas-exec-20260225191000` を返す
- `gcloud auth list` の ACTIVE が `k.noguchi@uguisunosato.or.jp` である
- `npx clasp apis` で `drive` が有効表示される
