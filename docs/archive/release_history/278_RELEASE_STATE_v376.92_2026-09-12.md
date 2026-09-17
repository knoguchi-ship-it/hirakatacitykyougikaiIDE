# v376.92 リリース状態（2026-09-12）

## 1. 結論

退会申込時に年度末退会／即時退会を選べるようにし、確認画面に表示する項目の表示・非表示と文言を管理画面から設定できるようにした。さらに、入退会および会員情報変更の申請受付時・確定時を Google Chat へ通知する設定可能な共通機構を追加した。

## 2. 変更内容

- 公開ポータルの退会申込に退会方式の選択を追加し、方式に応じた確認内容を表示する。
- 既定の5確認項目は管理画面で表示・非表示と記載内容を編集できる。項目そのものの追加・削除は今回の対象外とした。
- 管理画面で通知の全体有効化、受付時・確定時・異常値時の通知、3種類の本文テンプレートを編集できる。
- 送信先は各 Apps Script project の `CHAT_MEMBERSHIP_WEBHOOK_URL` Script Property のみで管理する。値はシステム設定、ソース、生成物、テスト、ログ、文書に保存しない。
- 通知処理は共通ヘルパーに集約し、送信失敗は会員申請・変更・承認・退会の業務処理を中断しない。

## 3. デプロイ実績

| 対象 | version | fixed deployment |
|---|---:|---|
| integrated/public | @401 | 2 本 |
| member split | @159 | 1 本 |
| admin split | @256 | 1 本 |

`clasp push --force`、`clasp version`、`clasp redeploy` を各 split で完了し、Apps Script API の `clasp deployments --json` で4本すべての固定 deployment が現行版を指すことを確認した。

## 4. 検証

- `npm run prerelease`: PASS
- `test:chat-membership-notifications`: PASS（テンプレート、共通送信経路、業務処理を止めない例外処理、送信先のハードコード不在を検査）
- `test:withdrawal-method`: PASS
- `test:gas-artifact-refs`、`test:action-dispatch`、`test:docs-single-source`、`test:er-sync`: PASS
- 3 split の生成物を再生成して参照整合を確認。

実際の Google Chat 配信は、Webhook を外部に送信する操作となるため agent は実行していない。操作者が管理画面で通知を有効化し、承認済みのテスト操作で受付時と確定時を各1回確認する。

## 5. ロールバック

integrated/public @400 ×2、member @158、admin @255（v376.91）へ `clasp redeploy --versionNumber` で戻す。通知を直ちに停止するだけなら、ロールバックより先に管理画面の「Google Chat 会員手続き通知」を無効にする。

## 6. GCP 移植メモ

Firestore の会員・変更申請ドキュメント更新を Cloud Run の共通 notification service で監視し、設定は Firestore の system settings、送信先は Secret Manager、Google Chat 送信は HTTP client で実装する。通知失敗を業務トランザクションから分離する仕様はそのまま移植できる。
