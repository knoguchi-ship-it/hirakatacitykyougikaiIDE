# v376.105 — 二重実装の解消と、送信記録（2026-09-27）

`docs/288` §4 に挙げた残り 4 件と、`docs/289` で入れた定期ジョブの置き場所の是正。
個別の背景はそれぞれの節に書く。

## 1. 定期ジョブを `jobs.gs` へ分けた（`docs/289` §1 の追補）

v376.104 で定期ジョブを管理者 split へ移したが、ビルドの分離規則により
`dryrun.gs`（診断 / dryRun / backfill ツールの置き場）へ入っていた。

**本番のトリガーが叩く関数が「dryrun」という名前のファイルに居るのは良くない。**
名前から役割を誤解し、消してよいものに見える。実際、トリガーハンドラが
pruning で消えていたことに長期間気づけなかった。

`gas/admin/` の生成物を 3 つに分けた。

| ファイル | 中身 | 正本の配列 |
|---|---|---|
| `Code.gs` | `doGet` / `processApiRequest` と全 helper | — |
| **`jobs.gs`** | **本番の定期ジョブ・トリガー設定・死活確認** | `ADMIN_SCHEDULED_JOB_FUNCTIONS` |
| `dryrun.gs` | 診断 / dryRun / backfill の operator ツール | `ADMIN_OPERATOR_TOOL_FUNCTIONS` |

`jobs.gs` の中身: `dailyWithdrawalPolicyTrigger` / `processPendingThumbnails` /
`setupScheduledTriggers` / `setupPendingThumbnailsTrigger` / `checkScheduledJobHealth`。

`ADMIN_OPERATOR_TOOL_FUNCTIONS` は `ADMIN_TOP_LEVEL_FUNCTIONS` から
`doGet` / `processApiRequest` と定期ジョブを除いた残りとして導出する（列挙を増やさない）。
`audit-admin-boundary.mjs` が 3 ファイルそれぞれの中身を検査する。

## 2. 自動通知に送信記録を残す（`docs/288` §4 外・v376.103 の教訓）

`T_メール送信ログ` に書いていたのは一括メールだけで、受付確認などの自動通知は
**成功しても失敗しても何も残らなかった**。これが「公開ポータル発のメールが
長期間 1 通も届いていない」ことに誰も気づけなかった構造的な理由。

`deliverMail_` の 3 つの出口すべてで `recordAutomatedMailLog_` を呼ぶ。

| 出口 | 記録 |
|---|---|
| 種別 OFF で送らない | `AUTO_SUPPRESSED:category_disabled` |
| 配信停止 / 集約で送らない | `AUTO_SUPPRESSED:<理由>` |
| 送信が例外 | `AUTO_FAILED`（Chat の「要確認」にも流れる）|
| 送信成功 | `AUTO_SENT`（`/ALIAS` か `/DEFAULT` を付ける）|

**個人情報は載せない。** 宛先も、差し込み済みの件名・本文も書かない
（件名には `{{氏名}}` が入りうる）。残すのは「いつ・どの種別が・どの経路で・どうなったか」だけ。
一括メールは自前で明細付きの集計行を書くので、ここでは扱わない（二重記録を作らない）。
記録の失敗で業務処理は止めない。

## 3. 公開ポータルが入力検証の正本を使っていなかった（`docs/288` §4-2）

`src/public-portal/components/MemberUpdateForm.tsx` が介護支援専門員番号を
`/^\d{8}$/` と直書きしていた（4 箇所）。正本は `src/shared/validators.ts` の
`CARE_MANAGER_NO_PATTERN`。公開ポータルからは `validators.ts` を 1 箇所も import していなかった。

v376.101 で直した不具合（`MemberForm.tsx` が独自のカナ正規表現を持っていて
賛助会員が保存できなかった）と**同じ形**。import に置き換えた。

## 4. 認証アカウントのログインID書き換えが 3 箇所（`docs/288` §4-3）

会員のCM番号 / 事業所番号 / 職員のCM番号 で、3 箇所が別々に
`T_認証アカウント` のシートを叩いていた。**重複回避が入っていたのは職員だけ。**

DRY の線引き: 「行を探して書き戻す」機械的な部分だけを `updateAuthAccountLoginId_` に集約し、
**新しいIDを何にするかは呼び出し元に残した**。CM番号は 8 桁で衝突時に先頭へ 1〜9 を付ける、
事業所番号は 10 桁英数字をそのまま、と規則が本質的に違う。混ぜると分岐だらけになる。

あわせて**衝突時は書き換えない**ようにした。同じログインIDが 2 つできると
どちらもログインできなくなる（v376.73 で実際に起きた）。事業所番号が衝突した場合は
据え置いたうえで Chat の「要確認」へ流す。

## 5. build の pruner が 3 ファイルに複製 — **実際に食い違っていた**（`docs/288` §4-4）

`gas-boundary-utils.mjs` / `build-admin-gas.mjs` / `build-member-gas.mjs` に
同じ実装が並び、コードには「this pruner is duplicated in ... **Keep the three in step**」
という申し送りコメントがあった。

**揃っていなかった。**

| 関数 | 差分 |
|---|---|
| `pruneUnreachableFunctionDeclarations` | **`gas-boundary-utils.mjs` だけ v292/v296 の修正が無い**（文字列リテラルを除いてからマッチする処理） |
| `collectReachableFunctions` | 実装は同じ。失われていたのは申し送りコメントの本文だけ |
| `findBlockEnd` / `collectFunctionDeclarations` | エラーメッセージと整形のみ |

`build-gas.mjs`（公開ビルド）は `gas-boundary-utils.mjs` から import している。
つまり **公開の生成物だけが古い pruner で作られていた**。v292 の事故
（`'getDbInfo'` のような文字列キーへ誤マッチして変数宣言ごと削除する）が
公開側では直っていなかったことになる。

- 正本を修正版に揃え、`removeTopLevelFunctionDeclarations` も正本へ移した。
- 2 つの build からローカル複製を削除し import に置き換えた
  （pruner 7 本に加え、`replaceObjectLiteral` / `assertAllowedTopLevelFunctions` /
  `removeDisallowedActionHandlers` / `removeIfBlock` も重複していたので同時に解消）。
- **申し送りコメントは守られない**ので、`test:build-helper-single-source` で機械的に落とす。
  ビルドスクリプトがヘルパーを自前定義したら FAIL、正本に export が無ければ FAIL、
  v292/v296 の修正が消えたら FAIL。

## 6. 一括メールの差し込みタグがカタログ外（`docs/288` §4-5）

`BulkMailSender.tsx` が `const MERGE_TAGS = ['{{氏名}}', …]` と自前で列挙していた。
他のメール設定カードは `src/shared/mailTemplates.ts` のカタログから引く。
タグを足したとき一括メールだけ古いまま残る形だった（v376.67 に `App.tsx` で起きたのと同じ）。

一括メールは「設定画面で文面を編集する自動通知」ではないので `MailTemplateCategory` には入れず、
同じモジュールに `BULK_MAIL_MERGE_TAGS` を置いた。`test:mail-merge-tags` に 2 件追加:

- 画面がカタログを参照している（直書きしていない）
- カタログのタグと、送信側 `sendBulkMemberMail_` の `mergeVars` が**双方向で一致**する
  （案内しているのに解決できない／解決できるのに案内していない、の両方を落とす）

## 7. 検証

- prerelease PASS、typecheck PASS。
- 新規テスト: `test:build-helper-single-source` 4 件、`test:mail-merge-tags` に 2 件追加。
- 既存テスト: `test:staff-login-id-sync` 6/6（`updateAuthAccountLoginId_` 集約後）、
  `test:scheduled-jobs` 8/8（`jobs.gs` 分離後）。
- 3 split を再生成し、`jobs.gs` に定期ジョブが、`dryrun.gs` に診断ツールが入ることを確認。
