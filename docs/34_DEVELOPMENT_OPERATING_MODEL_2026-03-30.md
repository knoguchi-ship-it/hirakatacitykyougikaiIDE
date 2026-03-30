# 開発再開運用体制

更新日: 2026-03-30
対象: 枚方市介護支援専門員連絡協議会 会員システム
位置づけ: 開発再開時の実務体制を 1 枚で確認するための運用正本

---

## 1. 目的

- 引継ぎ書、正本、デプロイ手順、確認責務を 1 か所に集約し、再開直後の迷いをなくす。
- 「誰が何を確認したら開発着手・本番完了とみなすか」を明確にする。
- コード差分だけで完了判定しない体制を固定する。

---

## 2. この文書が扱う範囲

- 開発再開前の確認順
- 役割分担
- task 起票ルール
- 本番反映の責務分離
- 完了条件

システム仕様、認証仕様、DB 運用、デプロイ詳細手順そのものは以下を正本とする。

- `HANDOVER.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/10_SOW.md`
- `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/03_DATA_MODEL.md`

---

## 3. 再開時の参照順

1. `HANDOVER.md`
2. `GLOBAL_GROUND_RULES/CLAUDE.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/34_DEVELOPMENT_OPERATING_MODEL_2026-03-30.md`
5. `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
6. `docs/09_DEPLOYMENT_POLICY.md`
7. `docs/05_AUTH_AND_ROLE_SPEC.md`
8. `docs/04_DB_OPERATION_RUNBOOK.md`

---

## 4. 現在の運用前提

- 開発ブランチは `main` を基準とする。
- 本番固定 Deployment は 2 本構成を維持する。
- GAS Version 151 は作成済みだが、固定 Deployment の `@151` 同期は未完了で、ユーザー作業待ちである。
- v147-v151 は `clasp push` 済みで Git 未コミットである。
- 本番完了判定には Apps Script UI の `Manage deployments` 確認と実ブラウザ確認が必須である。

---

## 5. 役割分担

### 5.1 開発担当

- 実装、差分確認、ローカル検証、GAS 反映準備を行う。
- `build -> push -> version` までは担当できるが、単独で本番完了扱いにしない。
- 仕様変更時は正本ドキュメントを同一変更セットで更新する。

### 5.2 本番反映担当

- Apps Script UI `Manage deployments` で固定 2 Deployment を同一 Version へ更新する。
- 両 Deployment が `Web app` のままであることを確認する。
- `/exec` と `/exec?app=public` の疎通確認を行う。

### 5.3 実機確認担当

- 会員側、公開側を最低 1 画面ずつ実ブラウザで確認する。
- 認証、画面遷移、主要表示崩れ、404 の有無を確認する。
- 変更に応じて対象データを元に戻す。

### 5.4 記録担当

- `HANDOVER.md`、必要な `docs/*`、task 文書に絶対日付で記録する。
- 記録項目は最低でも `version`, `deployment`, `PASS/FAIL`, `実施者`, `未了事項` を含める。
- チャットだけで終了扱いにしない。

同一人物が複数役割を兼務してもよいが、`本番反映担当` と `記録担当` の確認観点は省略しない。

---

## 6. 再開前の最小チェック

以下が揃うまで実装を始めない。

- [ ] `git status --short` を確認した
- [ ] `npx clasp show-authorized-user` が `k.noguchi@uguisunosato.or.jp` である
- [ ] `npx clasp run healthCheck` が成功した
- [ ] `npx clasp run getDbInfo` が成功した
- [ ] `HANDOVER.md` と本書の current state を確認した
- [ ] 作業対象 task がある、または新規 task の終了条件を先に言語化した

---

## 7. task 管理ルール

- 手動確認を伴う作業は、必ず task 単位で持つ。
- task 書式は `docs/31_HANDOVER_TASK_TEMPLATE.md` を使う。
- 少なくとも以下を埋める。
  - `対象ケースID`
  - `owner`
  - `status`
  - `対象 deployment/version`
  - `前提ログイン`
  - `期待する正本データ`
  - `終了条件`
  - `evidence`

task を作らずに口頭やチャットだけで引き継がない。

---

## 8. 本番反映フロー

1. 開発担当が `npm run typecheck`、`npm run build`、`npm run build:gas` を完了する。
2. 開発担当が `npx clasp push --force` と `npx clasp version` を実行する。
3. 本番反映担当が Apps Script UI で固定 2 Deployment を同じ Version に更新する。
4. 本番反映担当が `npx clasp deployments`、`/exec`、`/exec?app=public` を確認する。
5. 実機確認担当が会員側 / 公開側を確認する。
6. 記録担当が `HANDOVER.md` と関連正本を更新する。

この 1〜6 が揃うまで、本番完了扱いにしない。

---

## 9. 完了条件

- [ ] コード差分が意図どおりである
- [ ] 必要な正本ドキュメントが更新されている
- [ ] 固定 2 Deployment が同一 Version を参照している
- [ ] 両 Deployment が `Web app` である
- [ ] `/exec` と `/exec?app=public` が 404 でない
- [ ] `npx clasp run healthCheck` が成功している
- [ ] `npx clasp run getDbInfo` が成功している
- [ ] 実ブラウザ確認が終わっている
- [ ] 未了事項があれば task と `HANDOVER.md` に明記されている

---

## 10. 現時点の残課題

- 固定 Deployment の `@151` 同期
- v147-v151 の Git 整理とコミット
- 継続改善タスクの task 化
  - 管理コンソール UI/UX 改善
  - 会員一括編集対象項目の拡張検討
  - 公開ポータル文言 / 導線改善

---

## 11. 運用メモ

- AI エージェントは Apps Script UI の最終反映確認を代替できない前提で動く。
- `clasp deploy` は使わない。
- ドキュメント更新後は UTF-8 で再読込し、文字化けを残さない。
- 例外運用が発生した場合は `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` と関連正本へ即日反映する。
