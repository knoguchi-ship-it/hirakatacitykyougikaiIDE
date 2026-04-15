# AGENTS.md
# 枚方市介護支援専門員連絡協議会 会員システム

> このファイルを唯一のグランドルール入口とする。
> `CLAUDE.md` は後方互換用の案内のみとし、実体ルールはここへ集約する。

## 1. 入口の原則
- 最初に読む入口は常にこの `AGENTS.md`。
- 詳細ルールは `GLOBAL_GROUND_RULES/docs/AI_RULES/` 配下を正とする。
- システム仕様、運用値、固定値、現行状態は `HANDOVER.md` と `docs/*` の案件正本を正とする。
- グランドルールには版依存の現況値を埋め込まず、現行 version、fixed deployment の向き先、最新 release state の参照先は `HANDOVER.md` を都度更新して管理する。
- `AGENTS.md` と詳細ルールが衝突した場合は、詳細ルールを優先する。

## 2. 最初に読む順序
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `HANDOVER.md` に記載された最新の release state 文書
11. `docs/09_DEPLOYMENT_POLICY.md`
12. `docs/05_AUTH_AND_ROLE_SPEC.md`
13. `docs/04_DB_OPERATION_RUNBOOK.md`
14. `docs/03_DATA_MODEL.md`
15. `docs/archive/historical/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`（補足状態サマリ。正本は `HANDOVER.md`）

## 3. 行動原則
- まず関連ファイルだけを読む。推測で壊さない。
- 技術、法務、セキュリティ、運用の提案前に、必要なら Web で最新の一次ソースを確認する。
- 外部標準は採用するが、案件正本と衝突する場合は案件正本を優先し、差分を記録する。
- 既存コード、prompt、運用手順の修正は差分修正を原則とする。
- コード、データ、デプロイ、UI、認証、運用手順を変えたら、関連正本を同ターンで更新する。
- 文字化け、参照切れ、版ずれ、古い入口があれば先に直す。

## 4. この案件で崩してはいけない固定運用
- 現行本番 version と fixed deployment の向き先は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` を正とし、この文書には固定で埋め込まない。
- 認証、認可、DB 整合、deployment 検証は Apps Script 実行系で確認する。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証。
- fixed deployment 2 本運用を維持し、片系だけ更新しない。
- production の fixed deployment 同期は `npx clasp redeploy` を標準とし、Apps Script UI の `Manage deployments` 手更新は障害復旧時の補助手段としてのみ扱う。
- demo login、mock member route、画面内 demo selector は復活させない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。

## 5. 完了条件
- 「動いた」だけでは完了としない。
- release 完了条件は `build -> push -> version -> fixed deployment sync -> verification -> document update`。
- **push 前に `git diff` で作業ツリー全体を確認し、自分の変更以外の未コミット変更が存在する場合はその影響範囲を評価する。** 問題がある場合はファイル単位で push 範囲を限定するかユーザーに確認してから進む。
- fixed deployment sync は既知の deployment ID に対する `npx clasp redeploy ... --versionNumber ...` を正とし、結果は `npx clasp deployments --json` で確認する。
- 毎回更新する文書は `HANDOVER.md`、`docs/09_DEPLOYMENT_POLICY.md`、必要に応じた release state 文書とし、`AGENTS.md` や案件固定ルールは運用原則が変わった場合にのみ更新する。
- 未検証、残課題、承認待ちは必ず明記する。

## 6. セキュリティと承認
- 本番 deploy、DB 更新、権限変更、外部送信、不可逆操作は人間承認を前提とする。
- AI / agent 特有のリスクも通常のアプリケーションセキュリティと同じ優先度で扱う。
- 外部入力は不信入力として扱い、モデル出力をそのまま shell、SQL、HTML、デプロイ設定へ流し込まない。

## 7. 補助参照
- 文書索引: `docs/00_DOC_INDEX.md`
- 現況の正本: `HANDOVER.md`
- 日次運用: `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
