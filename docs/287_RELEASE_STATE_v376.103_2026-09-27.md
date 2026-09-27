# v376.103 — エイリアス送信を Gmail REST API へ切り替え（2026-09-27 本番反映）

## 1. 何が起きていたか

公開ポータルから入会申込・変更申請を出しても、申請者にメールが 1 通も届かなかった。
一方で Google Chat の変更通知は届いていた。つまり「処理は通っているのにメールだけ来ない」。

v376.102 で送信失敗を Chat の「要確認」へ流すようにしたところ、次が出た。

```
【会員手続き 要確認】
メール種別: APPLICATION_RECEIPT
送信経路: GmailApp（送信元エイリアス指定）
エラー: Specified permissions are not sufficient to perform the action.
Required permissions: (https://mail.google.com/
  || https://www.googleapis.com/auth/gmail.settings.basic
  || https://www.googleapis.com/auth/gmail.readonly
  || https://www.googleapis.com/auth/gmail.modify)
```

## 2. 根本原因

`sendEmailWithValidatedFrom_` は、送信元エイリアスが指定されている場合に
`GmailApp.sendEmail(to, subject, body, { from: ... })` を使っていた。

**`GmailApp` は送信前に「送信者のエイリアス一覧」を読んで `from` を照合する。**
この照合のために `mail.google.com` / `gmail.settings.basic` / `gmail.readonly` /
`gmail.modify` のいずれかを要求する。送信そのものではなく、照合が要求元である。

3 split のスコープはこうなっている（`appsscript.json`）:

| split | gmail.send | gmail.settings.basic |
|---|---|---|
| 統合（公開） | ✅ | ❌ |
| 会員 | ✅ | ❌ |
| 管理者 | ✅ | ✅ |

つまり **管理者 split だけが `GmailApp` のエイリアス送信を通せる**。
公開ポータル発のメール（受付確認・変更申請受付）は公開 split で送られるため、
毎回この例外で落ちていた。

operator の「私の権限ならばエイリアス送信はできていた」という認識は正しい。
できていたのは管理画面（管理者 split）からの送信であって、公開側ではない。

**なぜ気づけなかったか**: 呼び出し側が例外を `Logger.log` で握りつぶしており、
画面にも DB にも何も残らなかった。v376.102 の Chat 通知が入って初めて見えた。

## 3. 直し方

`users.messages.send`（Gmail REST API）は **`gmail.send` だけで呼べる**。
エイリアスの「管理」には設定系スコープが要るが、「送信」には要らない。
`From` が送信者の検証済みエイリアスであれば Gmail が受け付ける。

3 split とも `gmail.send` と `script.external_request` を既に持っているので、
**スコープ追加もキュー機構も無しで公開側から送れる**。

この呼び出し方（`UrlFetchApp` + `ScriptApp.getOAuthToken()` で Gmail REST を叩く）は
`listAvailableSendAsAddresses_` で既に使っている。新しい手口ではない。

### 変更点（`gas-src/Code.full.gs`）

- `GmailApp.sendEmail` 分岐を削除し、`sendMailViaGmailApi_` に置き換えた。
- 新設ヘルパー 3 本:
  - `encodeMimeWord_` — 件名・表示名・添付ファイル名を RFC 2047 encoded-word にする。ASCII だけならそのまま通す。
  - `wrapBase64_` — base64 を 76 桁で折る。
  - `buildRfc822Message_` — RFC822 を組み立てる。添付があれば `multipart/mixed`。
- `sendMailViaGmailApi_` は非 2xx のとき HTTP コードと Gmail のエラー文を載せて throw する。これが v376.102 の Chat「要確認」へそのまま流れる。

### 添付を 1 本にまとめた理由

一斉送信（`BULK_MAIL`）は添付付きで、かつ送信元エイリアスを指定する。
「管理者は `GmailApp`、公開は REST」と分けると添付の組み立てが二重実装になる。
`deliverMail_` → `sendEmailWithValidatedFrom_` は呼び出し 1 箇所なので、
REST 側で `multipart/mixed` まで持たせて経路を 1 本に保った。

エイリアス未指定（送信元＝実行ユーザー）の場合は従来どおり `MailApp.sendEmail`。
こちらは `script.send_mail` だけで動き、MIME を組む必要もない。

## 4. 検証

- `test:gmail-api-send` 10 件を新設し prerelease へ連鎖。gas-src から実ソースを切り出して評価する（ミラー実装を書かない）。
  - RFC 2047 エンコード（日本語／ASCII）
  - 添付なし＝`text/plain`・本文が復元できる
  - 添付あり＝`multipart/mixed`・boundary で 3 パートに分かれる・添付が復元できる
  - base64 76 桁折り返し
  - `users.messages.send` を Bearer トークン付きで叩く／`raw` が base64url
  - 非 2xx で Gmail のエラー文を載せて throw
  - **`GmailApp` に戻せないことの固定**（スコープ事故の再発防止）
- `test:mail-failure-chat` の送信経路ラベルを `Gmail API` へ追従。
- prerelease PASS。
- 実データ検証: 公開ポータルから変更申請を 1 件出し、`k.noguchi@uguisunosato.or.jp` への着信を確認する（結果は §5）。

## 5. 実データ検証の結果

（デプロイ後に記入）

## 6. 採らなかった案

### キュー + 管理者 split のトリガー送信

当初はこれで行く方針だった（公開側に一切の送信権限を渡さず、
`T_メール送信キュー` に積んで管理者 split の時間トリガーが拾って送る）。

採らなかった理由:

- **スコープ追加が要らないのに機構を増やすことになる**。REST で直接送れるなら、
  キュー・状態遷移（PENDING→SENDING→SENT/FAILED）・リトライ上限・滞留監視・
  PII の事後削除・`DB_SCHEMA_VERSION` 更新がすべて不要。
- **即時性が落ちる**。時間トリガーの最短間隔は 1 分。受付確認メールが遅れる。
- **失敗の見え方が悪くなる**。キューだと「積まれたまま動かない」状態が生まれ、
  それを見張る仕組み（滞留監視）自体を作り込む必要がある。

ただしキュー案には固有の利点がある（送信の再試行、日次上限に当たったときの持ち越し、
トリガー実行時間 6h/日の配分）。**一斉送信の規模が大きくなり
1 回の実行が 6 分を超えるようになった場合は、一斉送信だけキュー化する**のが順当。
その時点で本書のこの節を起点に再検討すること。

## 7. 残っている前提

**OAuth grant は manifest を変えても自動更新されない。**
`gmail.send` は 3 split の manifest に既にあるが、公開 split の現在の grant が
それを含んでいるかは manifest からは分からない。含んでいなければ
`users.messages.send` は 403 を返す（そのときも Chat の「要確認」に出る）。

その場合の手当て: myaccount.google.com/permissions で当該アプリのアクセス権を
失効させ、Web App を開き直して再承認する。
