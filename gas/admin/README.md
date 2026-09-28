# gas/admin — 管理者 split の生成物

**このディレクトリの `.gs` と `index.html` はすべて `npm run build:gas:admin` の生成物。手で編集しない。**
正本は `gas-src/Code.full.gs` と `scripts/gas-boundary-utils.mjs`。
（`appsscript.json` / `.clasp.json` / この README だけは生成対象外で、ビルドしても消えない。）

## ファイルの分かれ方

GAS は同一プロジェクト内の全 `.gs` がグローバルスコープを共有するので、
どのファイルに置いても動作は変わらない。**分けているのは人が役割を取り違えないため。**

**分け方の軸は「本番データを変えるか」と「誰が動かすか」。**

| ファイル | 中身 | 本番データ | 何で決まるか |
|---|---|---|---|
| `Code.gs` | `doGet` / `processApiRequest` と、すべての helper・定数 | — | 残り全部 |
| **`jobs.gs`** | **定期ジョブ**（トリガーが叩く）＋ トリガー設定 ＋ 死活確認 | 変える | `ADMIN_SCHEDULED_JOB_FUNCTIONS` |
| **`maintenance.gs`** | **保守ツール**（backfill / 復元 / テストデータ削除 / スキーマ救済） | **変える** | `ADMIN_MAINTENANCE_TOOL_FUNCTIONS` |
| `dryrun.gs` | dryRun E2E（作って自分で消す）と読み取り専用の診断 | 変えない* | `ADMIN_OPERATOR_TOOL_FUNCTIONS` |
| `index.html` | 管理ポータルの SPA（圧縮済み） | — | `dist-admin/` |

※ dryRun E2E は合成データを作るが、対になる cleanup で自分で消す。

preview（`_LOG`）と apply（`_APPLY`）の対は**同じファイルに置く**。片方を分けると、
実行前に確認するはずの preview を探しに行かなくなる。

分けた経緯: もともと `doGet` / `processApiRequest` 以外は全部 `dryrun.gs` に入っていた。
本番のトリガーが叩く関数も、`deleteTestData_APPLY` のような破壊的な保守ツールも、
「dryrun」という名前のファイルに同居していた。**ファイル名が役割を偽ると、
消してよいもの・試すだけのものに見える。** 実際、トリガーのハンドラがビルドの pruning で
生成物から消えていたことに長期間気づけなかった（`docs/289`）。
v376.105 で `jobs.gs`、v376.106 で `maintenance.gs` を切り出した。

`ADMIN_OPERATOR_TOOL_FUNCTIONS` は `ADMIN_TOP_LEVEL_FUNCTIONS` から
`doGet` / `processApiRequest` と `jobs.gs` / `maintenance.gs` 行きを除いた**残り**として導出する。
列挙を増やさない（増やすと必ず片方だけ更新されて食い違う）。

## 定期ジョブを足すとき

1. `gas-src/Code.full.gs` に関数を書く。
2. `SCHEDULED_JOBS_` 登録簿（同ファイル）に名前・表示名・許容間隔を足す。
3. `scripts/gas-boundary-utils.mjs` の `ADMIN_TOP_LEVEL_FUNCTIONS` と
   `ADMIN_SCHEDULED_JOB_FUNCTIONS` に足す。
   （保守ツールを足すときは `ADMIN_MAINTENANCE_TOOL_FUNCTIONS`、
   診断・dryRun はどちらにも足さなければ自動的に `dryrun.gs` へ入る。）
4. `npm run build:gas:admin` → `jobs.gs` に入る。
5. editor で `setupScheduledTriggers` を実行してトリガーを作る。

2〜3 を飛ばすと `npm run test:scheduled-jobs` が落ちる（生成物から消えたことを検知する）。

**定期ジョブを公開・会員 split に置いてはいけない。** 公開プロジェクトは匿名アクセスで、
GAS はサーブしているページから `google.script.run.<任意のトップレベル関数>()` を呼べる。
`assertAllowedTopLevelFunctions` が守っているのはこの境界。

## 運用

- **`clasp deploy` は禁止**（新 ID が発行され URL が変わる）。更新は `clasp redeploy`。
  手順の正本は `docs/09_DEPLOYMENT_POLICY.md`。
- `appsscript.json` はこのディレクトリ固有（`backend/` からコピーしない）。
  管理者 split だけが `gmail.settings.basic` を持つ。
- 境界の検査は `npm run security:split-boundary`。4 ファイルそれぞれの中身まで見る。
