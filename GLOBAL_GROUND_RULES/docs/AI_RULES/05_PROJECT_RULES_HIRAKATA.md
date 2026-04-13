# 05_PROJECT_RULES_HIRAKATA

更新日: 2026-04-14

## 目的
- この文書は、枚方市介護支援専門員連絡協議会 会員システムにおける案件固有ルールの正本である。
- グローバルルールと外部標準を前提にしつつ、この案件で絶対に崩してはいけない運用固定値を定義する。

## 最初に読む順序
> **読み込み順序の正本は `AGENTS.md §2` を参照すること。**
> この文書はセッション開始時点で既に読み込み済みのはずなので、以下は補足参照のみ。

補足: この案件で追加で参照する文書（`AGENTS.md §2` の順序に含まれないもの）:
- `docs/10_SOW.md` — スコープ定義と受入条件
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` — 障害復旧プレイブック
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` — 補足状態サマリ（HANDOVER.md を正本とする）

## この案件の判断原則
- 技術、法務、セキュリティ、運用の推奨を行う前に、必要なら最新の一次ソースを確認する。
- 外部標準は採用するが、案件の固定運用と衝突する場合は案件正本を優先し、差分を明記する。
- コード、データ、デプロイ、UI、認証、運用手順を変えたら、関連正本を同じターンで更新する。
- 版番号、fixed deployment の向き先、最新 release state 参照は固定ルールへ埋め込まず、`HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` を都度更新して管理する。
- 文字化け、参照切れ、版ずれ、古い handover 入口を見つけたら先に直す。
- この案件では「動いた」だけでは完了としない。Apps Script 実行系と固定 deployment の整合まで確認して完了とする。

## 案件正本
- `HANDOVER.md`
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- `HANDOVER.md` に記載された最新の release state 文書
- `docs/10_SOW.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`

## ランタイム固定ルール
- 認証、認可、DB 整合、deployment 検証は static mock ではなく Apps Script 実行系で確認する。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証。
- 本番 URL は fixed deployment 2 本で管理し、`docs/09_DEPLOYMENT_POLICY.md` に従う。
- 本番の fixed deployment 更新は `npx clasp redeploy` を標準とし、Apps Script UI の `Manage deployments` 手更新は障害復旧または緊急迂回時だけに限定する。
- release 完了条件は `build -> push -> version -> fixed deployment sync -> verification -> document update`。
- fixed deployment sync の確認は `npx clasp deployments --json` を正とする。
- 毎回更新する文書は `HANDOVER.md`、`docs/09_DEPLOYMENT_POLICY.md`、必要に応じた release state 文書とし、この固定ルール文書は運用原則変更時のみ更新する。

## 現行の本番前提
- 現行本番 version と fixed deployment の向き先は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` を正とし、この文書には固定で埋め込まない。
- demo login、mock member route、画面内 demo selector は廃止済み。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- business member の事業所情報は office 正本に従い、`officeNumber` は必須。
- business member の送付先・通知系挙動は固定表示ルールで扱い、会員編集で可変化しない。
- business `ADMIN` は他者の `STAFF <-> ADMIN` 変更のみ可。自分自身、`REPRESENTATIVE` 行、`REPRESENTATIVE` 付与は不可。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして扱う。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- production DB の基準状態は 2026-04-04 のロールバック後整合済み状態であり、後続の文書化された DB 操作がない限りこれを正とする。

## 外部標準の取り込み方
- NIST AI RMF / SSDF / SSDF-AI に合わせて、設計・開発・評価・運用・改善を分離して記録する。
- OWASP GenAI の観点に合わせて、prompt injection、sensitive data disclosure、supply chain、improper output handling、excessive agency を毎回点検対象に入れる。
- Agentic な振る舞いを伴う場合は、tool misuse、identity / privilege abuse、memory / context poisoning まで評価対象を広げる。
- OpenAI / Anthropic の prompting guidance に合わせて、曖昧な指示ではなく、成功条件・出力形式・例・検証方法を明示する。

## 再開時の最低チェック
```bash
git status --short
cd backend
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
npx clasp deployments --json
```

期待値:
- authorized user が運用アカウント
- health check が成功
- fixed deployment 2 本が `HANDOVER.md` 記載の現行 target version を向いている
