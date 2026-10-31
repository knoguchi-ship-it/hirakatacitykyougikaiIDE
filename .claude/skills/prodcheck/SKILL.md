---
name: prodcheck
description: Playwright MCP のログイン済みブラウザで本番を確かめる手順。google.script.run での読み取り・診断ツールの実行、clasp run での未リリース（push 済み HEAD）の保守ツールの実行、画面操作の確認、読み込み時間の計測、ロール視点プレビュー、スマホ幅の確認。「本番で確認して」「実機で見て」「操作者確認を代行して」「計測して」と言われたとき、リリース後の検証に使う。
---

# 本番をブラウザで確かめる（Playwright MCP）

**読むだけなら AI が代行できる。書くなら `/dbops` を通す。** ブラウザから本番の書き込みを呼ぶと
hook（`.claude/hooks/guard-browser.mjs`）が operator 確認を出す。

## 0. 前提

- ログインは **operator が** Playwright のブラウザで行う。AI は資格情報を扱わない（AGENTS L0.1）。
  `scripts/auth-bootstrap-admin-auto.mjs` は Google ログインが通らないことが多い。
- 管理 URL・会員 URL は別（管理者と会員は完全分離・L0.2）。管理画面で会員マイページは見られない。
- URL は HANDOVER.md と `src/config/publicPortal.ts` を見る。ここには書かない。

## 1. google.script.run を呼ぶ

アプリは入れ子の iframe の中にある。`browser_run_code` で一番深いフレームを探して呼ぶ。

```js
async (page) => {
  let frame = null;
  for (const f of page.frames().slice().reverse()) {   // 深い方から
    if (await f.evaluate(() => !!(window.google && google.script && google.script.run)).catch(() => false)) { frame = f; break; }
  }
  if (!frame) return 'google.script.run を持つフレームが無い（ログイン前・読み込み中）';
  return frame.evaluate(() => new Promise((res) =>
    google.script.run.withSuccessHandler(res).withFailureHandler((e) => res({ error: String(e) }))
      .previewTestDataPurge_LOG()));
}
```

- 起動直後は 10〜30 秒かかる（コールドスタート）。タイムアウトをすぐ失敗とみなさない。
- `processApiRequest` は管理画面と同じ payload で呼べる。**action の名前が `get*` `list*` などで始まるものだけが読み取り**
  （`PREVIEW_READ_ACTION_PREFIXES`）。それ以外は書き込みとして扱う。
- **action 名は文字列で直接書く**（`processApiRequest('getTrainingManagementData', null)`）。
  補助関数に変数で渡すと hook が action を読めず、読み取りでも確認が出る（2026-10-19）。
- **確認ダイアログ（confirm / alert）は MCP が自動で閉じる。** ダイアログの先にある操作は、
  同じ API を直接呼んで確かめる（2026-10-10 の LINE 投稿依頼で実施）。

## 1.5 clasp run で HEAD を実行する（2026-10-31 確立）

**どちらを使うか**: `google.script.run`（§1）は固定 deployment の**版**を実行する。push しただけで
リリースしていない関数（新しい保守ツールなど）は呼べない。**push 済みの HEAD を実行するのは `clasp run`**
（devMode）とエディタの ▶ だけ。

**ログインは 2 つを名前で分けて持つ。** 1 つにまとめない（片方のログインがもう片方を上書きして push か run が壊れる）。

| 用途 | ユーザー名 | ログイン（operator が `!` で実行・ブラウザで承認） |
|---|---|---|
| push・version・redeploy・release:verify | 既定 | `npx clasp login`（既定クライアント。`script.projects` 等の clasp のスコープ） |
| run（admin split） | `run` | `cd gas/admin && npx clasp -u run login --creds ../../.tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes` |

- **専用 OAuth クライアント（`.tmp/oauth-client-hcmn-member-system-prod.json`・GCP `hcmn-member-system-prod`）でなければ
  `scripts.run` は「Unable to run script function」で落ちる**（`docs/archive/incidents/16_*`）。中身は読まない（AGENTS L0.1）。
- **`--use-project-scopes` はカレントの manifest のスコープを取る。** admin split だけが `gmail.settings.basic`・
  `script.scriptapp` を持つので、**`gas/admin` に移動してから**ログインする。リポジトリ直下で取ると root の manifest
  のスコープになり、admin の関数が足りないスコープで落ちうる。
- **`-P gas/admin` は使わない。** clasp 3.4.1 が `srcDir "" escapes project root` で拒否する。`cd` で移動する。
- `--use-project-scopes` で既定ユーザーにログインすると push 用スコープが無くなり、`release:push` が
  「Request had insufficient authentication scopes」で落ちる（2026-10-31 に発生）。そのときは `! npx clasp login` で戻す。

**実行**（AI が実行してよい。`_APPLY` は hook が operator 確認を出す）:

```bash
cd gas/admin && npx clasp -u run show-authorized-user   # k.noguchi@hcm-n.org・client が user-provided であること
cd gas/admin && npx clasp -u run run describeDatabaseState_LOG   # 疎通（読むだけ）
cd gas/admin && npx clasp -u run run <関数名>                    # 引数は -p '[...]'（JSON 配列）
```

- 実行者は clasp のログインユーザー。`assertMasterOperator_` は MASTER として通る。
- 対象は **push 済みの HEAD**。push していない変更は実行されない。先に `npm run release:push`（承認制）。
- `--nondev`（版の実行）は失敗する（未解消・不要）。版を確かめるときは §1 の `google.script.run`。
- 戻り値は標準出力に出る。大きいときはスクラッチパッドのファイルへ落としてから読む。個人情報を含む戻り値をチャットへ貼らない。

## 2. 書き込みを伴う確認

`/dbops` の手順をそのまま通す: 書き込みの有無をコードで確認 → 影響範囲の提示 → **承認** →
スナップショット → 実行 → 全列差分。メールが飛ぶ可能性があれば `mailDeliveryState` を止めてから。
テスト会員は `/dbops`「テストデータを作る場合」の印（★＋@example.invalid）で作り、物理削除で片付ける。

**ロール視点プレビュー中の操作は、そのロールの権限で本番を変え、メールも送る**（`docs/246` §11）。

## 2.5 MASTER 以外の権限で見る（2026-10-20 確定）

- **「ロール視点プレビュー」で見る。** 管理画面上部の選択欄でロールを選ぶと、サーバーの判定もそのロールで行う
  （`buildPreviewAdminSession_`）。選択欄は押したときにロール一覧を読む（`dispatchEvent('mousedown')` で出る）。
  **プレビュー中にボタンを押すと、そのロールで本番を変え、メールも送る。** 読むだけにする。
- **自分の権限を下げて試さない。** `saveAdminPermission_` に「最後の MASTER を下げる」を止める仕組みが無く、
  権限管理は MASTER しか開けないので、画面から戻せず締め出される。
- 別の Google アカウントを同じブラウザに足しても、Apps Script は 1 つ目のアカウントで開く。

## 2.6 ブラウザが開けないとき

- `Failed to launch the browser process`・「既存のブラウザ セッションで開いています」は、Playwright 用の Chrome 画面が
  MCP との接続が切れたまま残っている。`--user-data-dir=...mcp-chrome-...` の Chrome を閉じてから開き直す
  （ログインはプロファイルに残る）。operator のふだんの Chrome は閉じない。

## 3. 画面の確認

- スマホ幅: `browser_resize` で 360×800。横スクロールが無いこと（`document.documentElement.scrollWidth <= innerWidth`）。
- スクリーンショットに個人情報が写る。リポジトリに保存しない。
- 「ある・表示された」だけでなく、**期待値を数字で**比べる（件数・合計・差分 0 など）。

## 4. 読み込み時間の計測

- 指標は「ページを開いてから目的の画面が出るまで」。同じ条件で 3 回以上取り、中央値で比べる。
- 修正前の値と計測の考え方は `docs/301_RELEASE_STATE_v376.113_2026-10-09.md` §3。
- **デプロイ直後の初回だけ 2 分以上止まった**事例がある（`docs/302` §2・未解明）。
  リリース直後は 1 回目を必ず計り、再試行の帯（「再試行しています（n/5）」）が出るかも見る。

## 5. 記録

確認した項目・結果・確認できなかったもの（と理由）を `docs/` の記録へ残す（例: `docs/302`）。
**確認できなかったものを「確認済み」に混ぜない。**
