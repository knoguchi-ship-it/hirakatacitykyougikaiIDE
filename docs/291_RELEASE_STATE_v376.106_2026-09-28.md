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

これは `docs/archive/release_history/289` の事故と同じ形の危うさで、実際そこでは
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

## 6. 片付け（2026-09-28）

### 重複データの実態 — 想定と違った

`docs/288` §4-1 で直した「同じ人が申し込むたびに外部申込者が増える」バグについて、
**既に増えてしまった分が残っていないか**を数えた。

| 対象 | 結果 |
|---|---|
| `T_外部申込者` | **有効 0 行**（重複以前にデータが無い）|
| `T_研修申込` | 4 行、すべて `MEMBER` 区分 |
| **重複申込** | **1 件**（会員 4539021 が T004 に 2 回。2026-04-17 と 2026-04-20）|

公開ポータルからの研修申込がまだ実運用されていないため、外部申込者の重複は生まれていなかった。
代わりに出ていたのは**管理画面からの重複申込**で、これは v376.104 で重複検査を入れる前のデータ。

後から入った `AP-9EB21B05E6` を `cancelRosterEntry` でキャンセルした。
物理削除ではなく `CANCELED` ＋ 取消日時 ＋ 備考に理由を残す形なので経緯を追える。

### テストデータ

実アドレスを持つ検証用会員のうち、保留していた 2 件（4146466 / 99498417）を論理削除した。
バッチID `73fbf83e-2180-4411-a8dd-5ec074d13d57`（会員 2・事業所職員 1・認証 2）。
**残っているテスト会員は 8299257 だけ**で、最終確認が終わったら削除する。

### 管理画面の動作確認

v376.105 で `getAdminInitData` に定期ジョブの死活チェックを足したため、
管理画面が正常に開くことを実画面で確認した（サイドバー・会員一覧まで描画）。

## 7. operator 作業の進捗（`docs/archive/release_history/289` §1-7）

| 手順 | 状態 |
|---|---|
| 1. 統合／公開の `warmUp` トリガーを削除 | **完了**（2026-09-28 operator 報告）|
| 2. 管理者で `setupScheduledTriggers` を実行 | 未 |
| 3. `setupPendingThumbnailsTrigger` を実行（未登録なら）| 未 |
| 4. `checkScheduledJobHealth` で心拍を確認 | 未 |

2 をやるまで日次ジョブ（退会予定→退会確定の昇格）は動かない。
管理画面を開くたびに Chat へ「定期ジョブが動いていません」が 1 日 1 回流れるのは正しい振る舞い。
関数は `jobs.gs` にある。
