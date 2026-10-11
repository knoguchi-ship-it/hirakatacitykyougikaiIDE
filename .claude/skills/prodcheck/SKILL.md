---
name: prodcheck
description: Playwright MCP のログイン済みブラウザで本番を確かめる手順。google.script.run での読み取り・診断ツールの実行、画面操作の確認、読み込み時間の計測、ロール視点プレビュー、スマホ幅の確認。「本番で確認して」「実機で見て」「操作者確認を代行して」「計測して」と言われたとき、リリース後の検証に使う。
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
- **確認ダイアログ（confirm / alert）は MCP が自動で閉じる。** ダイアログの先にある操作は、
  同じ API を直接呼んで確かめる（2026-10-10 の LINE 投稿依頼で実施）。

## 2. 書き込みを伴う確認

`/dbops` の手順をそのまま通す: 書き込みの有無をコードで確認 → 影響範囲の提示 → **承認** →
スナップショット → 実行 → 全列差分。メールが飛ぶ可能性があれば `mailDeliveryState` を止めてから。
テスト会員は `/dbops`「テストデータを作る場合」の印（★＋@example.invalid）で作り、物理削除で片付ける。

**ロール視点プレビュー中の操作は、そのロールの権限で本番を変え、メールも送る**（`docs/246` §11）。

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
