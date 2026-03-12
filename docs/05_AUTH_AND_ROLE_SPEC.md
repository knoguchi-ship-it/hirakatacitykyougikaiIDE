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
- 方式A（**本番標準**）: **セッション認証** — `google.script.run` 経由で `checkAdminBySession_()` を呼び出し、`Session.getActiveUser().getEmail()` で呼び出し元の Google メールを取得し、`T_管理者Googleホワイトリスト` のメール列と突合する。
  - フロントエンドから IDトークンを送信する必要がない。
  - GAS の iframe sandbox 制約（`script.googleusercontent.com` origin）で OAuth ポップアップが開けないため、この方式を採用。
- 方式B（**補完/レガシー互換**）: **IDトークン検証** — `adminGoogleLogin_()` で Google ID トークンを受け取り、`verifyGoogleIdToken_()` で検証後、`GoogleユーザーID` または `Googleメール` でホワイトリスト照合する。
- 使用テーブル（共通）: `T_管理者Googleホワイトリスト`
- 許可条件（共通）:
  - `T_管理者Googleホワイトリスト` に `有効フラグ=true` で Googleメールが存在
  - `紐付け認証ID` → `T_認証アカウント` に紐付きレコードが存在
  - `紐付け会員ID` → `T_会員` に紐付きレコードが存在
- セキュリティ留意点:
  - 方式Aは `google.script.run` の呼び出し元認証に依存するため、GAS Web App を `Execute as: Me / Who has access: Anyone` で公開した状態でも、セッションが取得できるのはブラウザでログイン中の Google ユーザーのみ。
  - 方式Bの IDトークン検証は GAS 組込みの `UrlFetchApp` を使用して Google の公開鍵と突合する。

## 2.1 パスワードセキュリティ仕様
- **ハッシュ方式**: `SHA-256`（GAS 組込み `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ...)`）+ ランダムソルト（UUID形式）
  - **GAS 制約**: GAS ネイティブは `Utilities.computeDigest` のみ提供。Argon2id / bcrypt / scrypt は **未サポート**。
  - **OWASP 2025 勧告**: パスワードハッシュには `Argon2id`（第1推奨）/ `bcrypt`（第2推奨）を使用すること（[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)）。
  - **リスク**: SHA-256 + Salt はブルートフォース攻撃に対して bcrypt より脆弱。GAS 外部 API 呼び出し（Apps Script → Node.js 等）によるハッシュ計算への移行を将来検討課題とする。
- **パスワード平文送信**: ログイン・変更時はJSON ペイロードに含めて送信（HTTPS 必須）。GAS 側でハッシュ化後、平文は保持しない。
- **アカウントロック**: `T_認証アカウント.ログイン失敗回数` でカウント、`ロック状態=true` でログイン拒否する機能を実装済み。
  - **⚠️ 既知課題**: ロック解除は DB を直接編集（手動）のみ。自動解除（時間ベース）・管理 UI は未実装。
- **パスワード変更フロー（⚠️ 仕様不整合あり）**:
  - **実装**: `changePassword_()` の入力は `{loginId, newPassword}` のみ。**現在のパスワード検証なし**。
  - **PRD §5 要件**: 「現在PW不一致時は変更不可」と定義されているが、バックエンドでは未実装。
  - **リスク**: ログイン済みセッション内での権限付与確認は現状フロントエンド依存。GAS API 直接呼び出し時に現在PW検証が行われない。
  - **対処推奨**: `changePassword_()` に `currentPassword` パラメータを追加し、バックエンドでハッシュ照合後に変更を許可するよう修正する。
  - **現在の挙動**: 新PW生成 → ハッシュ保存 → `パスワード更新日時` 更新 → ログイン失敗回数リセット → ロック解除。

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
  - **現状**: 本番標準はセッション認証（方式A）に移行済みのため、このクライアントは方式B（IDトークン検証）用途で保持。削除しない。
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

## 8. 公開ポータルのセキュリティ・個人情報保護法対応（2026-03-12 追加）

### 8.1 認証方針
| 操作 | 認証 | 検証場所 |
|------|------|----------|
| 受付中研修一覧の閲覧 | 不要 | — |
| 非会員として研修申込 | 不要（個人情報入力で代替） | `applyTrainingExternal_()` でサーバー側バリデーション |
| 非会員申込の取消 | 申込ID + 登録メール一致 | `cancelTrainingExternal_()` でサーバー側検証 |
| 研修の登録・編集 | 管理者 Google 認証 | `checkAdminBySession_()` 必須（会員ポータルと同一） |

### 8.2 個人情報保護法対応（必須要件）
根拠：個人情報保護法 第17条（利用目的の特定）・第18条（利用目的の通知）・医療介護関係事業者ガイダンス（2025年6月改正）

| 要件 | 実装方針 | 根拠条文 |
|------|----------|----------|
| 利用目的の明示 | フォームに「収集した個人情報は研修申込の受付・確認連絡のみに使用します」を明記。抽象的表現禁止 | 法第17条 |
| 同意取得 | 送信ボタン前に「プライバシーポリシーに同意する」チェックボックスを必須配置。未チェックは送信不可 | 法第17条・18条 |
| データ保管期間 | 研修終了日の翌年4月1日以降に `削除フラグ=true` を自動適用（`applyWithdrawalDeletionPolicy_()` 拡張） | 法第19条（利用する必要がなくなったときは速やかに消去する努力義務） |
| 第三者提供の禁止 | 収集データは本システム内のみ。外部サービス・第三者への提供なし | 法第27条 |
| 同意日時の記録 | `T_外部申込者.同意日時` に記録し、同意証跡を保持 | ガイダンス準拠 |

### 8.3 入力バリデーション（OWASP準拠）
根拠：[OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

- **サーバー側バリデーション必須**（クライアント側のみでは不十分）
- メールアドレス: 正規表現 + 最大長チェック
- 電話番号: 数字・ハイフンのみ許容
- 氏名: 最大長チェック（スクリプトインジェクション対策）
- 申込期間: `申込開始日`〜`申込締切日` をサーバー側で必ず検証

### 8.4 スパム・ボット対策
GAS の制約（外部 JS サービス利用不可）のため以下の実装可能な手段で対応：
- **Honeypot フィールド**: フォームに `display:none` の隠し入力フィールドを設置。入力値が空でない場合はサーバー側で申込を無条件拒否
- **重複申込チェック**: 同一メールアドレス + 同一研修 ID の重複申込を `applyTrainingExternal_()` でサーバー側検出・拒否
- **申込期間チェック**: 期間外申込はサーバー側で拒否

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
