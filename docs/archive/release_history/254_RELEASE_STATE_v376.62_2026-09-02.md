# Release state: v376.62（2026-09-02・リリース済）

## 状態

**本番反映完了。** fixed deployment 4 本を同期済み。

| 配信 | Version |
|---|---|
| 統合 public legacy / 正式 | **@367**（2 本とも） |
| member split | **@126** |
| admin split | **@223** |

ロールバック先: public **@366×2** / member **@125** / admin **@222**。

## 背景（発見の経緯）

v376.61 の検証中、管理画面「メール通知」の各カードに `テンプレート一覧の取得に失敗しました` が出ていることに気づき、
本番 admin @222 に対して `listMailTemplates` を全 14 カテゴリで実測したところ、**すべて
`mailTemplateRecordFromRow_ is not defined`** を返していた（DB には有効テンプレートが 2 件ある＝
D-01 dryRun の `activeTemplateCounts {CREDENTIAL:1, STAFF_ADD_REP:1}`）。

## 根本原因

build pruner の到達性判定（`collectReachableFunctions`）が **`name(` の呼び出し構文しか参照と見なしていなかった**。
`gas-src/Code.full.gs` の

```js
var list = rows.map(mailTemplateRecordFromRow_);   // 関数を「値」として渡す参照
```

はこの判定に掛からず、当該関数は到達不能と判断されて **3 split すべてから削除**されていた。
`git log -S` で確認したところ、この関数は**生成物に一度も含まれたことがない**（機能追加の v376.42 以降ずっと）。

既存の boundary 監査はトップレベル callable と action 許可リストを見るもので、
**helper が解決できるかは見ていない**ため検知できなかった。

## 変更

| 対象 | 内容 |
|---|---|
| `scripts/gas-boundary-utils.mjs` / `scripts/build-admin-gas.mjs` / `scripts/build-member-gas.mjs` | 到達性判定に**値としての参照**を追加（`referencePattern`）。プロパティアクセス（`obj.name`）は除外。**pruner はこの 3 ファイルに複製されているため 3 箇所すべてを同一内容で修正**（複製自体は既存の負債。§残課題） |
| 同上（admin / member の複製） | 参照走査を `maskCommentsAndStrings` 経由に変更。**コメントや文字列内の関数名が到達性を生まないようにする**（値参照を数え始めると、コメントの言及だけで禁止トップレベル関数まで残ってしまうため。実際に member ビルドが `runThumbnailGeneration` を残して境界チェックで停止した） |
| `gas-src/Code.full.gs` | `addDeleteLogSheet` の実体を private の `addDeleteLogSheet_` に分離し、削除 cascade の実行時パスは private 側を呼ぶ。公開名は `ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS` で admin 生成物から削除されるため、`T_削除ログ` 未作成時に **ReferenceError になる潜在バグ**だった（新ゲートが検出） |
| `scripts/test-gas-artifact-refs.mjs`（新規） | **生成物が参照する gas-src 関数を、その生成物が宣言しているか**を検査する release gate。admin は `Code.gs` + `dryrun.gs` を同一スコープとして扱う。gas-src 側はトップレベル宣言のみを対象（入れ子 helper 名の誤検出を避ける） |
| `package.json` | `test:gas-artifact-refs` を追加し `prerelease` 連鎖へ組込 |

**`rows.map(mailTemplateRecordFromRow_)` は意図的にそのまま残した。** 呼び出し構文に書き換えると
pruner 修正と新ゲートが実ケースで検証されなくなるため、根本原因側だけを直している。

## 同時に解消した欠落（新ゲートが検出）

| 生成物 | 欠落していた関数 | 影響 |
|---|---|---|
| admin | `mailTemplateRecordFromRow_` | **メールテンプレート一覧が常に取得失敗**（本件） |
| member | `normalizeClaimRecord_` | 請求記録の正規化。member split の請求一覧経路が実行されると ReferenceError |
| admin | `addDeleteLogSheet` → `addDeleteLogSheet_` へ分離で解消 | `T_削除ログ` 未作成時のみ発火する潜在 ReferenceError |

## 検証

- `npm run prerelease` **全ゲート PASS**（新 `test:gas-artifact-refs` を含む）。
- **新ゲートの有効性**: 修正前の生成物に対して実行すると上表 3 件を FAIL として検出し、修正後は 3 split とも PASS。
- **3 split 生成物**: `var テーブル定義 = {` / `processApiRequest` は 3/3 で残存。admin に
  `mailTemplateRecordFromRow_` / `normalizeClaimRecord_` / `addDeleteLogSheet_`、member に
  `normalizeClaimRecord_` が入ったことを確認。public は当該関数を参照しないため非搭載（ゲート PASS）。
- **サイズ**: member −644 byte / admin −196 byte / public +1 byte。コメント内の言及で残っていた死にコードが
  正しく削除された分、むしろ縮小している（member の pruned 数 559→570、admin 320→322）。
- 境界監査は public / member / admin すべて PASS。member のトップレベルは `doGet, processApiRequest` のまま。

## デプロイ実施記録（2026-09-02）

1. 3 split を push → `npx clasp version "v376.62 pruner reachability fix (listMailTemplates)"`
   → public **@367** / member **@126** / admin **@223**。
2. fixed deployment 4 本を redeploy し、3 project の `deployments --json` で一致を確認。

## デプロイ後の live 検証

| 項目 | 結果 |
|---|---|
| **本件の直接確認**: 全 14 カテゴリの `listMailTemplates`（逐次＋一括の 2 パターン） | **全件 `status:ok`**。件数も DB 実態と一致（CREDENTIAL:1 / STAFF_ADD_REP:1、他 0）。**修正前は全 14 件が `mailTemplateRecordFromRow_ is not defined`** |
| 公開 `test:a11y` | 違反 **0** |
| 公開 `test:responsive` | **7VP 全 PASS**（スキップ 0・console error 0） |
| `test:responsive:member` | **7VP 全 PASS**（1 回目に 1VP がログインタイムアウト＝連続ログインによる一過性。再実行で解消） |
| `test:responsive:admin` | **7VP × 8 コンソール = 56 view 全 PASS**（横スクロール 0・タップターゲット違反 0・console error 0） |
| `test:mail-settings:e2e` | **E2E-01〜05 全 PASS** |
| `dryRunTrainingEndTimeV376_61_LOG` | **`passed:true`**・`testRowCleanedUp:true`・`corruptedEndTimeCount:0`・`emptyEndTimeCount:0` |
| `dryRunMailTemplatesV376_43_LOG` | **`passed:true`**・`guardOk:true`・Tier2 6 カテゴリすべて `ok:true`（差し込み欠落なし） |

デプロイ直後に管理画面へ到達できない事象が出たが、原因は**保存済み Google セッションの失効**（画面は `Signed out`）で、
デプロイ起因ではない。operator の再ログイン後は上記のとおり全て PASS。

## 残課題

- **pruner の三重複製**: `gas-boundary-utils.mjs` / `build-admin-gas.mjs` / `build-member-gas.mjs` に
  同等実装が 3 本ある（`pruneUnreachableFunctionDeclarations` / `findBlockEnd` などは既に内容が乖離している）。
  AGENTS §3 の DRY 原則に反しており、本件のような修正漏れを生みやすい。共通実装への一本化を別タスクとして残す。
