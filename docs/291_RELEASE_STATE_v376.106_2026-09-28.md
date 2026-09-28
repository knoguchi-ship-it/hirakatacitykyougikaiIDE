# v376.106 — 管理者 split の `.gs` を役割で分ける（2026-09-28）

## 1. 何が問題だったか

もともと管理者 split の生成物は 2 つだけだった。

- `Code.gs` — `doGet` / `processApiRequest` と helper
- `dryrun.gs` — **それ以外の全部**

「それ以外」には性質の違うものが混ざっていた。

| 中身 | 例 | 実際にやること |
|---|---|---|
| 本番の定期ジョブ | `dailyWithdrawalPolicyTrigger` | トリガーが自動で叩く |
| トリガー設定 | `setupScheduledTriggers` | トリガーを作り直す |
| 破壊的な保守 | `deleteTestData_APPLY` | **本番 DB を soft delete する** |
| 復元 | `restoreLastArchiveBatch_APPLY` | **本番 DB を書き戻す** |
| backfill | `regenerateAllThumbnails` | **本番 DB を書き換える** |
| dryRun E2E | `dryRunApplicationScenarios` | 合成データを作って自分で消す |
| 読み取り専用の診断 | `diagnoseMemberDeleteDebt_LOG` | 何も変えない |

**ファイル名が役割を偽っていた。** 「dryrun」は試すだけに見えるが、中身の半分は本番データを変える。
そして本番のトリガーが叩く関数まで同じ場所にあった。

これは `docs/289` の事故と同じ形の危うさで、実際そこでは
トリガーのハンドラがビルドの pruning で生成物から消えていたことに長期間気づけなかった。

## 2. 分け方

**軸は「本番データを変えるか」と「誰が動かすか」。**

| ファイル | 中身 | 本番データ | 正本の配列 |
|---|---|---|---|
| `Code.gs` | `doGet` / `processApiRequest` と helper・定数 | — | 残り全部 |
| `jobs.gs` | 定期ジョブ ＋ トリガー設定 ＋ 死活確認 | 変える | `ADMIN_SCHEDULED_JOB_FUNCTIONS` |
| **`maintenance.gs`** | **保守ツール**（backfill / 復元 / テストデータ削除 / スキーマ救済） | **変える** | `ADMIN_MAINTENANCE_TOOL_FUNCTIONS` |
| `dryrun.gs` | dryRun E2E と読み取り専用の診断 | 変えない※ | `ADMIN_OPERATOR_TOOL_FUNCTIONS` |

※ dryRun E2E は合成データを作るが、対になる cleanup で自分で消す。

`jobs.gs` は v376.105、`maintenance.gs` は本リリースで切り出した。

### `maintenance.gs` の中身

`regenerateAllThumbnails` / `backfillKanaToFullwidth`(+`_APPLY`) /
`forceMarkSchemaInitializedToCurrent` / `listArchiveBatches_LOG` /
`restoreLastArchiveBatch_APPLY` / `diagnoseMemberDeleteDebt_LOG` /
`deleteTestDataPreview_LOG` / `deleteTestData_APPLY` /
`previewStrictE2ETestMemberCleanup_LOG` / `executeStrictE2ETestMemberCleanup_APPLY`

**preview（`_LOG`）と apply（`_APPLY`）の対は分けない。** 片方を別ファイルに置くと、
実行前に確認するはずの preview を探しに行かなくなる。
だから `_LOG` が読み取り専用でも、対になる `_APPLY` と同じ `maintenance.gs` に置く。

### 列挙を増やさない

`ADMIN_OPERATOR_TOOL_FUNCTIONS`（`dryrun.gs` 行き）は `ADMIN_TOP_LEVEL_FUNCTIONS` から
`doGet` / `processApiRequest` と `jobs.gs` / `maintenance.gs` 行きを除いた**残り**として導出する。
4 つ目の列挙を持つと、必ず片方だけ更新されて食い違う。

## 3. 検査

`audit-admin-boundary.mjs` が 4 ファイルそれぞれの公開関数を正本の配列と突き合わせる。
どれか 1 つでもずれたら FAIL。`test:scheduled-jobs` も 4 ファイルを結合して読む。

## 4. 動作は変わらない

GAS は同一プロジェクト内の全 `.gs` がグローバルスコープを共有するので、
どのファイルに置いても実行時の挙動は同じ。**分けているのは人が役割を取り違えないため。**

## 5. 検証

- prerelease PASS、`audit-admin-boundary` PASS（4 ファイル分離の検査を含む）、
  `test:scheduled-jobs` 8/8。
- `gas/admin/README.md` を 4 ファイル構成へ更新。ここが「どのファイルに何を置くか」の入口。

## 6. operator 作業の進捗（`docs/289` §1-7）

| 手順 | 状態 |
|---|---|
| 1. 統合／公開の `warmUp` トリガーを削除 | **完了**（2026-09-28 operator 報告）|
| 2. 管理者で `setupScheduledTriggers` を実行 | 未 |
| 3. `setupPendingThumbnailsTrigger` を実行（未登録なら）| 未 |
| 4. `checkScheduledJobHealth` で心拍を確認 | 未 |

2 をやるまで日次ジョブ（退会予定→退会確定の昇格）は動かない。
管理画面を開くたびに Chat へ「定期ジョブが動いていません」が 1 日 1 回流れるのは正しい振る舞い。
関数は `jobs.gs` にある。
