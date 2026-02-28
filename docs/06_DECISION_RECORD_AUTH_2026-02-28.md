# 認証/権限制御 方針決定記録（2026-02-28）

## 1. 決定事項
1. 会員ログインは `ログインID + パスワード` を採用する。
2. 管理者ログインは Google アカウント認証 + ホワイトリスト照合を採用する。
3. 管理者は `管理者ページ` と `会員マイページ` の両方を利用可能とする。
4. 年会費未納時は振込先口座情報を表示する。引き落とし機能は持たない。
5. 受付中研修は詳細本文と案内PDFを表示可能にする。

## 2. 設計上の理由
1. 認証方式を分離することで、会員向け運用（ID/PW）と管理者向け運用（Google）を明確化できる。
2. 管理者をGoogle主体で認証しつつ、業務データ側は会員IDに紐付けることで監査性を担保できる。
3. 未納時のみ振込先表示にすることで、誤解を生む「引き落とし」導線を排除できる。

## 3. 受け入れ指標（運用KPI）
1. 認証拒否率: ホワイトリスト外Googleアカウントの管理者ログイン成功率 0%。
2. 認証成功率: 正常な会員ID/PW入力時の成功率 99.9%以上（障害時除外）。
3. 権限表示: 管理者ログイン時のみ左メニューに `管理者ページ` が表示される。
4. 紐付け整合: 管理者ログインセッションの100%で `認証ID` と `会員ID` が取得できる。
5. 会費UI: 未納時のみ振込先口座が表示される（納入済では非表示）。
6. 研修UI: 受付中研修で詳細本文とPDFリンクが表示される。

## 4. 参照した一次情報
1. Google Identity: IDトークン検証要件（`aud` `iss` `exp` `hd`）
   - https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
   - https://developers.google.com/identity/sign-in/web/backend-auth
2. Apps Script Web App 実行権限と実行主体
   - https://developers.google.com/apps-script/guides/web
   - https://developers.google.com/apps-script/manifest/web-app-api-executable
3. Apps Script Session 制約（メール取得が空になる条件）
   - https://developers.google.com/apps-script/reference/base/session
4. パスワード保管ベストプラクティス
   - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
