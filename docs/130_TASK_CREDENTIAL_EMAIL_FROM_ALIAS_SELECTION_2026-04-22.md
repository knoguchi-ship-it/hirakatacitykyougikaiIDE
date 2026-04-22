# 入会通知メール 送信元アドレス設定・エイリアス選択タスク

最終更新: 2026-04-22
状態: ローカル実装済み / 未デプロイ

## 1. 背景

- 管理画面の「入会通知メール」設定では、送信有無・件名・本文は変更できるが、送信元メールアドレスは固定だった。
- 実運用では、担当者の主メールアドレスではなく、事務局 alias や代表アドレスから送信したい需要がある。
- 送信元の自由入力は誤設定リスクが高いため、実行アカウントで実際に利用可能な send-as alias のみを選べる構成が必要。

## 2. 実装方針

- `T_システム設定.CREDENTIAL_EMAIL_FROM` を追加し、入会通知メールの送信元アドレスを保持する。
- 設定画面は `getAdminEmailAliases()` を再利用し、**主メールアドレス + Gmail send-as alias** を選択肢として表示する。
- backend 側では:
  - 保存時に `validateRequestedFromAddress_()` で利用可能 alias かを検証
  - 実送信時にも `sendEmailWithValidatedFrom_()` を経由して再検証
- 送信元が主メールアドレスの場合は `MailApp.sendEmail`、alias の場合は `GmailApp.sendEmail({ from })` を既存ヘルパー経由で使い分ける。

## 3. 一次ソース

- Apps Script `GmailApp.getAliases()`
  - Gmail に設定された alias を取得し、`sendEmail(..., { from })` に利用できる。
  - https://developers.google.com/apps-script/reference/gmail/gmail-app
- Gmail API: send-as aliases
  - 各アカウントには主メールアドレスを表す alias が最低 1 件あり、send-as alias は事前作成と必要に応じた検証が必要。
  - https://developers.google.com/workspace/gmail/api/guides/alias_and_signature_settings
- Gmail Help: Send emails from a different address or alias
  - ユーザーが Gmail の `Send mail as` に送信元アドレスを追加し、必要なら確認を完了してから利用する運用。
  - https://support.google.com/mail/answer/22370
- Google Workspace Admin Help: Add or delete an alternate email address
  - 管理者がユーザー alias を追加しても、送信にはユーザー側の `Send mail as` 設定が必要。
  - https://support.google.com/a/answer/33327

## 4. 実装内容

- frontend:
  - 「入会通知メール」セクションに `送信元メールアドレス` セレクトを追加
  - alias 一覧の再取得ボタンを追加
  - alias 取得失敗時は warning を表示
- backend:
  - `CREDENTIAL_EMAIL_FROM` の初期化・読込・保存対応
  - `sendCredentialEmail_()` を alias 対応の共通送信ヘルパーへ接続
  - 保存時・送信時の二重検証を追加
- docs:
  - `HANDOVER.md`
  - `docs/03_DATA_MODEL.md`
  - `docs/05_AUTH_AND_ROLE_SPEC.md`

## 5. 未実施

- `npm run typecheck`
- `npm run build`
- `npm run build:gas`
- 操作者による実ブラウザ確認
- Apps Script への push / version / redeploy
