# v376.104 — 止まっていた定期ジョブと、3 つある研修申込（2026-09-27）

## 1. 定期ジョブが動いていなかった

### 1-1. 何が起きていたか

統合／公開プロジェクトの実行ログが、5 分おきに同じ行だけで埋まっていた。

```
NOTICE  2026-09-27T13:15:16  warmUp  Authorization is required to perform that action.
NOTICE  2026-09-27T13:20:16  warmUp  Authorization is required to perform that action.
...
```

取得できたログの全範囲で成功が 1 件もない。ログに出てくる関数は `warmUp` だけだった。

### 1-2. 根本原因 — ビルドの pruning がハンドラごと消していた

| 関数 | 役割 | 生成物に存在したか |
|---|---|---|
| `warmUp` | 5 分ごとのキャッシュ暖機 | **3 split すべてに無し** |
| `dailyWithdrawalPolicyTrigger` | 日次 02:00 の退会ポリシー適用 | **無し** |
| `setupScheduledTriggers` | 上 2 本のトリガーを作り直す | **無し** |

`gas-src/Code.full.gs` には在るが、`backend/Code.gs` / `gas/admin/Code.gs` / `gas/member/Code.gs`
のどれにも無い。公開ビルドの pruning seed は `['doGet', 'processApiRequest', 'healthCheck']` だけで、
そこから到達できない関数は落とされる。**トリガーだけが本番に残り、存在しない関数を叩き続けていた。**

作り直すための `setupScheduledTriggers` も一緒に消えていたので、自力では復旧できない状態だった。

これは既知の罠（`feedback_admin_editor_keep_list` — editor 直叩き関数は keep-list に入れないと
pruner に消される）と同じ形で、**トリガーハンドラだけが keep-list に入っていなかった**。

### 1-3. 業務影響

`dailyWithdrawalPolicyTrigger` は退会ポリシーを適用する。その中身は 2 つ:

1. **退会予定 → 退会確定の昇格**（退会日を過ぎた `WITHDRAWAL_SCHEDULED` を `WITHDRAWN` に）
2. 退会済みの行に翌 4 月で削除フラグを付ける

実データを数えたところ、**滞留 0 件**だった（`WITHDRAWAL_SCHEDULED` が 0 件、`ACTIVE` 201 / `WITHDRAWN` 24）。
今回たまたま被害は出ていないが、次に誰かが年度末退会を申請したら止まったままだった。

### 1-4. 直し方

**定期ジョブは管理者 split にだけ置く。**

公開プロジェクトは `ANYONE_ANONYMOUS` で、GAS は**サーブしているページから
`google.script.run.<任意のトップレベル関数>()` を呼べる**。だから業務バッチを公開側に
置くと匿名の利用者が叩けてしまう。`assertAllowedTopLevelFunctions` が守っているのはこの境界で、
「pruning で消えたから seed に足す」と素直にやると境界を壊す。

- `dailyWithdrawalPolicyTrigger` / `setupScheduledTriggers` / `checkScheduledJobHealth` を
  `ADMIN_TOP_LEVEL_FUNCTIONS`（seed・assertAllowed・audit・dryrun 分離の単一情報源）へ追加。
- **`warmUp` は廃止した。** 暖める `CacheService` はプロジェクトごとに別なので公開側にしか
  置けないが、そこへ置くと匿名の利用者が重い DB 全読みを叩ける。消えたまま長期間動いておらず、
  体感の悪化も報告されていない。
- 旧世代の `runThumbnailGeneration` / `generateMissingThumbnails_` / `setupThumbnailGenerationTrigger_`
  も削除した。作成元は `rebuildDatabaseSchema` だけで、それはどの生成物にも入っていない
  （＝もう作られない）死んだ経路。現行は `processPendingThumbnails`。
- `setupScheduledTriggers` は、廃止した `warmUp` と `runThumbnailGeneration` のトリガーが
  残っていれば削除する。**ハンドラ名は `'warm' + 'Up'` のように分割して書いてある** —
  pruner が文字列中の識別子も「参照」とみなすため、そのまま書くと削除したはずの実体が復活する。

### 1-5. 二度と黙って止まらないようにする

失敗が見えなかったことが本体の問題なので、そこを直した。

| 仕掛け | 内容 |
|---|---|
| 登録簿 `SCHEDULED_JOBS_` | ジョブ名・表示名・許容間隔。**ここが正本** |
| 心拍 `recordJobHeartbeat_` | 成功のたびに `ScriptProperties` へ時刻を残す |
| 失敗通知 `runScheduledJob_` | 例外を Chat の「要確認」へ流して投げ直す（メール失敗通知 v376.102 と同じ考え方）|
| 遅れ通知 `reportOverdueScheduledJobs_` | 許容間隔を超えたジョブを Chat へ。同じジョブは 1 日 1 回まで |
| 手動確認 `checkScheduledJobHealth` | operator が editor から引数なしで実行 |

**遅れの見張りをトリガーに置かないのが肝。** 見張り役をトリガーにすると、それ自身が
死んだときに誰も気づけない（今回がまさにそれ）。**人が管理画面を開く経路**
（`getAdminInitData`）で評価する。トリガーが全滅していても届く。

心拍が 1 度も無いジョブは「一度も成功していない」として遅れ扱いにする。
トリガーが作り直されていない状態を、黙って正常に見せないため。

### 1-6. 回帰テスト `test:scheduled-jobs`（8 件）

1. `ScriptApp.newTrigger('X')` の X は登録簿か廃止簿に必ず載っている
2. 登録簿のジョブは gas-src に実体がある
3. **登録簿のジョブは管理者 split の生成物に残っている**（今回の事故を直接止める）
4. 定期ジョブを公開・会員 split に置かない
5. 廃止したハンドラはどの生成物にも残っていない
6. `setupScheduledTriggers` が廃止ハンドラのトリガーを掃除する（実際に動かして確認）
7. 失敗と遅れが Chat へ流れる配線がある
8. 死活確認と再作成が admin から実行できる

### 1-7. operator にお願いする手順

1. **統合／公開プロジェクト**のトリガー画面で、`warmUp` のトリガーを削除する
   （関数がもう無いので失敗し続ける）。`runThumbnailGeneration` があれば同じく削除。
2. **管理者プロジェクト**のスクリプトエディタで `setupScheduledTriggers` を 1 回実行する
   → `dailyWithdrawalPolicyTrigger` が毎日 02:00 に作られる。
3. `processPendingThumbnails` のトリガーが無ければ `setupPendingThumbnailsTrigger` も実行。
4. `checkScheduledJobHealth` を実行して、両ジョブの心拍が付くのを確認する。

手順 2 をやるまでは、管理画面を開くたびに Chat へ「定期ジョブが動いていません」が
1 日 1 回流れる。これは正しい振る舞い（実際に動いていないため）。

## 2. 研修申込が 3 実装だった

### 2-1. 何が違っていたか

申込の入口は 3 つ（会員マイページ / 公開ポータル / 管理画面の名簿追加）。

| | 会員 | 公開 | 管理 |
|---|---|---|---|
| 重複申込チェック | 有り | 有り | **無し** |
| 定員チェック | 有り | 有り | **無し** |
| 同一人物の解決 | — | **毎回新規作成** | **毎回新規作成** |

いちばん重いのは 3 行目。公開申込は既存の外部申込者をメールで探しておきながら、
**見つかっても必ず新しい行を作っていた**。同じ人が別の研修に申し込むたびに
`T_外部申込者` が増え、名簿でも宛先でも 1 人が複数人に見える。
`repairTrainingApplicationApplicantIds` という修復ツールが admin にあるのは、この後始末のため。

管理画面のゲスト追加も同じで、公開ポータルから申し込んだ人を管理画面で追加すると 2 人になった。

### 2-2. 寄せ方

入口ごとの手続き（本人確認・権限・メール）は本質的に違うので共通化しない。
**判定だけ**を `countAppliedApplicants_` の隣に集めた。

| 共通ルール | 何を決めるか |
|---|---|
| `resolveOrCreateExternalApplicant_` | メール（大小・前後空白を無視）で同一人物を突き合わせ、居れば再利用。連絡先は空でない値だけ更新する |
| `findExistingTrainingApplication_` | 同じ研修に同じ人の申込があるか。`申込者ID` と `外部申込者ID` の両方を見る（経路によってどちらに入るかが違うため）|
| `evaluateTrainingCapacity_` | 定員。数え上げはここだけ |

**operator 判断**:

- 「どこから登録しようとも 1 人の申し込みは 1 人」→ **重複は入口を問わず必ず弾く**。
- 「管理画面から意図的に増やす分は OK。ただし基本は定員を広げること」→
  管理画面からは定員を超えて追加できるが、**黙っては通さない**。超過したことを返し、
  画面に「定員そのものを広げてください」と出す。会員・公開は従来どおり定員で弾く。

管理画面の重複は `already_applied` を返し、画面では
「この方は既にこの研修に申し込み済みです。名簿を確認してください。」と出る。

### 2-3. 回帰テスト `test:training-apply-rules`（10 件）

メールの正規化 / 会員の重複検出 / 外部申込者の重複検出（両方の列）/ 空ID を重複扱いしない /
定員の数え方が 1 つ / **3 経路すべてが重複判定を通る** / 外部申込者を作り直さない /
定員判定も共通 / 管理は超過を返す / 会員・公開は弾く。

## 3. 片付け

- v376.103 の検証で出した変更申請 2 件を却下（承認していないので会員データは不変）。
- 実アドレスを持つ検証用会員 3 件を論理削除（会員 3 行・認証 3 行、復元用バッチID
  `8b422caf-c1af-4635-994c-373299f154d3`）。**使用中の 8299257 は残している。**

## 4. 検証

- prerelease PASS、`test:scheduled-jobs` 8/8、`test:training-apply-rules` 10/10、typecheck PASS。
- 3 split 生成物に定期ジョブが正しく入っている／公開・会員には入っていないことを確認。
- **実データ確認は未実施**（トリガー再作成が operator 手順のため、§1-7 のあと）。
