---
name: gas-admin-tool
description: gas-src に管理者向けの関数を足すときの手順。エディタの ▶ で実行する保守・診断ツール（_LOG / _APPLY）、定期ジョブ、processApiRequest の新しい action を追加・改名・削除するとき、または「管理画面から〇〇を実行できるように」「保守ツールを作って」と言われたときに使う。
---

# 管理者向けの関数を足す（2026-10-11 確定）

**`_` で終わらないトップレベル関数は、画面を開いた人全員に公開される。** Apps Script は
`google.script.run` から名前で呼べるようにする。管理 web app は組織内公開（DOMAIN）なので、
**管理者リストに無い組織アカウントでも、開発者ツールから直接実行できる。**
2026-10-10 まで保守ツール 24 本がこの状態だった（v376.115 で是正・`docs/302` §2）。

## 1. 名前で性質を決める（機械がこの名前を信じる）

| 名前 | 意味 | 誰が信じているか |
|---|---|---|
| 末尾が `_` | 非公開（内部関数） | Apps Script |
| `xxx_LOG` | **読むだけ**。戻り値を実行ログで見る | hook が確認なしで通す（`.claude/hooks/hook-shared.mjs`） |
| `xxx_APPLY` | 書き込む・消す。エディタ ▶ は引数なしで実行される | hook が operator 確認を出す |
| action `get*` `list*` `search*` `fetch*` `check*` `load*` `preview*` | **読むだけ** | ロール視点プレビューの権限判定と hook（`PREVIEW_READ_ACTION_PREFIXES`） |

**`_LOG` や `get*` の名前で書き込んではならない。** プレビュー中の書き込みが監査ログに残らず、
ブラウザからの実行が確認なしで通る。書くなら名前を変える。

## 2. 公開関数の先頭で実行者を確かめる

```
保守・診断ツール   var session = assertMasterOperator_('関数名');   // MASTER 以外・リスト外を止める
定期ジョブ         assertTriggerOrMasterOperator_(e, '関数名');      // 実在のトリガーか MASTER
```

**最初の文**でなければ `npm run test:operator-tool-guard` が落ちる。
実行者の本人は `session.loginId`（**`email` は無い**。`npm run test:single-source` が落とす）。

## 3. 登録する（1 か所）

`scripts/gas-boundary-utils.mjs` の共有定数だけを更新する。build・境界監査・hook がすべてここを読む。

| 足すもの | 定数 |
|---|---|
| エディタ ▶ の関数 | `ADMIN_TOP_LEVEL_FUNCTIONS` ＋ `ADMIN_MAINTENANCE_TOOL_FUNCTIONS` か `ADMIN_OPERATOR_TOOL_FUNCTIONS` |
| 定期ジョブ | `ADMIN_TOP_LEVEL_FUNCTIONS` ＋ `ADMIN_SCHEDULED_JOB_FUNCTIONS` |
| 管理の action | `ADMIN_ALLOWED_ACTIONS_LIST` ＋ gas-src の `ADMIN_ACTION_PERMISSIONS` ＋ `scripts/menu-registry.mjs` ＋ `scripts/feature-inventory.mjs` の分類 |

- **公開（public）や会員（member）の seed には足さない。** 匿名で叩ける（`feedback_scheduled_job_pruning_trap`）。
- このファイルには NUL バイトが 1 つ入っている。置換スクリプトはバイトを保って書く。

## 4. 書き方の約束

- **監査ログは `appendAuditLogEntries_` だけで書く**（`npm run test:single-source` が落とす）。
- 行を物理削除するときは `takeRowsByMatch_` を通す（空いた行もシートから消える）。
- 不可逆な操作は「確認（`_LOG`）→ 実行（`_APPLY`）」の 2 段にし、確認した内容の指紋・期限・実行者を
  実行時に照合する（実例: `previewTestDataPurge_LOG` / `executeTestDataPurge_APPLY`）。
- build pruner の罠: 関数内の正規表現リテラル `/.../` と、引数名 `action` は build を壊す
  （`feedback_build_pruner_regex_action_traps`）。`String.indexOf` と `*Action` を使う。
- 判定ロジックは実ソースから関数を取り出して動かすテストを書く（ミラー禁止・AGENTS L3.1）。

## 5. 確かめる

```bash
npm run build:gas:admin
grep -c "function 関数名(" backend/Code.gs gas/member/Code.gs gas/admin/Code.gs   # admin だけ 1
npm run test:operator-tool-guard
npm run test:guards
```

関数を**消す**ときは、`gas-boundary-utils.mjs`・hook の明示リスト・Skill・docs から名前を消す。
`npm run test:skills` と `npm run test:guards` が残骸を見つける。消す前に operator へ声を掛ける（AGENTS L3.1）。
