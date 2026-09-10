# v376.90 リリース状態（2026-09-10）

## 1. 結論

公開ポータルの退会・会員情報変更における本人確認で、公開用 build pruner が本人確認設定を削除していた障害を修正した。内部的な例外名は利用者画面へ出さず、状況に応じた日本語の案内だけを表示する。スキーマ・認証方式・業務データの変更はない。

## 2. 原因と修正

本人確認の種別別設定はトップレベルのオブジェクトで、正規化関数を値として参照していた。公開生成物を最小化する build pruner がこれらの参照を未到達と判定し、設定と正規化関数を同時に除外したため、照合開始時に失敗していた。

- 設定を `getPublicIdentityCredentials_()` として到達可能な関数へ移し、本人確認処理はこの関数経由で取得するように変更。
- 公開画面の退会・会員情報変更フローは、許可済みの日本語エラーだけを表示し、それ以外の例外は安全な再試行案内へ変換。
- `test:public-identity` に、公開 `Code.gs` への設定・正規化関数の残存検査と内部エラー非表示テストを追加。

## 3. デプロイ実績

| 対象 | version | fixed deployment |
|---|---:|---|
| integrated/public | @399 | 2 本 |
| member split | @157 | 1 本 |
| admin split | @254 | 1 本 |

`clasp push --force`、`clasp version`、`clasp redeploy` を各 split で完了した。

## 4. 検証

- `npm run prerelease`: PASS
- `npm run test:public-identity`: 12 件 PASS（公開生成物検査・内部例外非表示を含む）
- 公開 responsive: 320〜1920px の 7 viewport PASS
- 退会申請の実送信は実施していない。

## 5. ロールバック

integrated/public @398 ×2、member @156、admin @253（v376.89）へ `clasp redeploy --versionNumber` で戻す。

## 6. GCP 移植メモ

Cloud Run の公開 API でも本人確認の種別別設定はリクエスト処理から到達可能なモジュールとして保持し、tree shaking 後の成果物検査を同等に実施する。利用者へ内部例外を返さない方針は API エラー envelope で維持する。
