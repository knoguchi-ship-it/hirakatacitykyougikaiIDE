# gas/admin — 管理者 split の生成物

**このディレクトリの `.gs` と `index.html` はすべて `npm run build:gas:admin` の生成物。手で編集しない。**
正本は `gas-src/Code.full.gs` と `scripts/gas-boundary-utils.mjs`。
（`appsscript.json` / `.clasp.json` / この README だけは生成対象外で、ビルドしても消えない。）

## ファイルの分かれ方

GAS は同一プロジェクト内の全 `.gs` がグローバルスコープを共有するので、
どのファイルに置いても動作は変わらない。**分けているのは人が役割を取り違えないため。**

| ファイル | 中身 | 何で決まるか |
|---|---|---|
| `Code.gs` | `doGet` / `processApiRequest` と、すべての helper・定数 | 残り全部 |
| **`jobs.gs`** | **本番で動く定期ジョブ**、そのトリガー設定、死活確認 | `ADMIN_SCHEDULED_JOB_FUNCTIONS` |
| `dryrun.gs` | editor から ▶ 実行する診断 / dryRun / backfill ツール | `ADMIN_OPERATOR_TOOL_FUNCTIONS` |
| `index.html` | 管理ポータルの SPA（圧縮済み） | `dist-admin/` |

`jobs.gs` を `dryrun.gs` から分けたのは 2026-09-27（v376.105）。
本番のトリガーが叩く関数が「dryrun」という名前のファイルに居ると、
**消してよいものに見える**。実際、トリガーのハンドラがビルドの pruning で
生成物から消えていたことに長期間気づけず、存在しない関数を 5 分ごとに叩き続けていた
（`docs/289`）。

`ADMIN_OPERATOR_TOOL_FUNCTIONS` は `ADMIN_TOP_LEVEL_FUNCTIONS` から
`doGet` / `processApiRequest` と定期ジョブを除いた残りとして導出する。列挙を増やさない。

## 定期ジョブを足すとき

1. `gas-src/Code.full.gs` に関数を書く。
2. `SCHEDULED_JOBS_` 登録簿（同ファイル）に名前・表示名・許容間隔を足す。
3. `scripts/gas-boundary-utils.mjs` の `ADMIN_TOP_LEVEL_FUNCTIONS` と
   `ADMIN_SCHEDULED_JOB_FUNCTIONS` に足す。
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
- 境界の検査は `npm run security:split-boundary`。3 ファイルそれぞれの中身まで見る。
