# v376.142 リリース記録（2026-11-04）

本番は public @452×2 / member @210 / admin @309（commit `26b731d`）。
ロールバック先は v376.141（public @451×2 / member @209 / admin @308）。スキーマ版は
`2026-10-25-screen-text-templates-v376.135` のまま、表・列の変更は無い（戻すときの事前処理は不要）。

## 1. 中身

| 項目 | 内容 | 正本・検査 |
|---|---|---|
| 開催日時の確認（Codex 3d65ee4） | 保存時、開催日時は `yyyy-MM-ddTHH:mm` の実在する日付と 00:00〜23:59 の時刻だけ受け付ける（99:99 などを日付部分だけで通していた） | RD BR-22・`test:training-registration` |
| 日付を確かめられない研修（b8f6044） | 開催日が空・読めない研修は受け付けず、取消もさせない。申込開始日・締切日は空なら制限なし、値があって読めなければ受け付けない（以前は判定を飛ばして受け付けていた・fail-closed） | RD BR-22（改訂 2.4）・`test:training-registration` |
| 研修一覧のキャッシュ（b707ce0） | **v376.141 の不具合**: 一覧のキャッシュの鍵を `_v3` にしたのに消す側が `_v2` のままで、研修の保存・削除・申込の後も管理画面の研修一覧が最大 10 分古かった。鍵の版を 1 か所の定数にした | `test:training-registration` |
| 研修の物理削除（26b731d） | 研修専用の保守ツール `previewTrainingTestDataPurge_LOG` / `executeTrainingTestDataPurge_APPLY`（★＋問い合わせメール @example.invalid の研修）と、既存のデモ研修を消す一度きりの `previewDemoTrainingPurge_LOG` / `executeDemoTrainingPurge_APPLY`（作成日時 2026-11-03 以前）。admin split の maintenance.gs だけに置く | `docs/319` §7.1・`docs/04` §5.2.2a・`test:test-data-purge` |
| 旧研修ドライランの撤去（Codex 3d65ee4） | `dryRunTrainingManagement` / `cleanupDryRunTrainingManagement` を本番から外した（印を確かめずに消す後片付けを持っていた） | `test:test-data-purge` |
| 開発の仕組み（98270dd） | 担当交代レビューの hook（H10）: 相手がレビューを終えずに去っても、次に起動した担当に相手の作業を通知する | `test:guards` |

## 2. リリース前の確認

| 項目 | 結果 |
|---|---|
| 全ゲート | `npm run prerelease` exit 0（HEAD `26b731d0`） |
| 新しい検査 | 直す前のコードで新しい検査が落ちることを確認（受付・取消 2 本、キャッシュの鍵 1 本、H10 2 本）。物理削除は安全装置 5 か所をそれぞれ壊すと検査が落ちることを確認 |
| 3 split の生成物 | 物理削除の関数は admin の maintenance.gs だけ（公開・会員は 0）。公開・会員に入るのは説明のコメントと定数 3 つ |
| スキーマ・認証 | 変更なし |

## 3. デプロイ後の確認

| 項目 | 結果 |
|---|---|
| 向き先 | `release:verify` で 4 本と HANDOVER の一致を確認 |
| 公開ポータル | `test:a11y` 違反 0・`test:responsive` 7 画面幅 合格 |
| 管理画面（MCP） | 5.7 秒で開き、`getTrainingManagementData` が成功。研修 5 件（表示中 4・削除済み 1）はすべて開催日を読め、受付は「開催日を過ぎています」。新しい「確認できない」で止まる研修は無い |
| `test:responsive:admin` | **56/56 合格**（7 画面幅 × 8 画面・横スクロール 0・はみ出し 0）。リリース直後は保存したログイン情報（2026-11-02 12:05）が切れて 7 画面幅とも「App frame did not appear within 50s」だった（MCP では開いた）。operator が `auth-bootstrap-admin-auto.mjs` で取り直した後に流した |

## 4. 未検証・次にやること

- 研修の保存のあとに一覧がすぐ変わること（キャッシュの修正）の本番での目視。本番に研修の書き込みを伴うので、★テスト研修で行う。
- 既存のデモ研修の削除: `previewDemoTrainingPurge_LOG` の一覧を operator が確かめ、承認を得て `executeDemoTrainingPurge_APPLY`（`/dbops`）。消し終えたら 2 関数と `DEMO_*` を撤去する。
- `npm run security:secrets` は Windows の cmd で `|` を解釈できず必ず落ちる（以前から・prerelease には入っていない）。bash で同じコマンドを流すと該当 0 件。
