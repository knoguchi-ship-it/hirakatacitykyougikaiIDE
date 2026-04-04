# 開発引継ぎ

更新日: 2026-04-05
現行本番: `v170`
固定 deployment: member `@170` / public `@170`
補足: 管理コンソール年度フィルタ不具合修正と「全期間」表示修正を fixed deployment まで反映済み。DB は同日中にユーザー主導でロールバックされ、現在は整合性が合う状態。

## 1. 最初に読むもの
1. `HANDOVER.md`
2. `GLOBAL_GROUND_RULES/CLAUDE.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
5. `docs/45_RELEASE_STATE_v170_2026-04-04.md`
6. `docs/09_DEPLOYMENT_POLICY.md`
7. `docs/05_AUTH_AND_ROLE_SPEC.md`
8. `docs/04_DB_OPERATION_RUNBOOK.md`
9. `docs/03_DATA_MODEL.md`

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- `docs/45_RELEASE_STATE_v170_2026-04-04.md` は 2026-04-04 時点のコード版と DB 基準を固定記録した保存版。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 既存 worktree には無関係な差分がある。明示指示なしに revert しない。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@170` を向いている前提で引継ぐ。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。

## 4. 直近の重要履歴
### v170
- 2026-04-04 build / push / version / fixed deployment sync を実施。
- 管理コンソールの年度別会員表示で、過去年度時点で在籍していた退会者が current status により除外される不具合を修正。
- ダッシュボードの `ALL` 選択時ヘッダーを最新年度ではなく `全期間` 表示に修正。
- `npx clasp deployments --json`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` で反映確認済み。
- その後、2026-04-04 中にユーザーが DB 復旧作業をロールバックし、現在の本番 DB は整合性が取れている前提に更新。

### v169
- 2026-04-04 build / push 実施。
- 2026-03-26 時点の外部バックアップから DB を復元。
- `appendRowsByHeaders_` の復旧系不具合を修正。
- 復旧支援用 helper を追加。
- fixed deployment 反映は未実施。

### v168
- 2026-04-03 に fixed deployment まで反映済み。
- `backend/Code.gs` の欠落事故から復旧し、`v167` の変更を安全に再適用。

### v167
- business `ADMIN` の role 変更ルールを実装。
- `updateMemberSelf_` の欠落初期化不具合を修正。
- テスト仕様は `docs/41_TEST_SPEC_v167_BUSINESS_ADMIN_ROLE_CHANGE.md` を参照。

## 5. 再開時チェック
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
- fixed deployment 2 本が `@170`

## 6. 現時点の注意事項
- 2026-04-04 時点で DB はユーザーによるロールバック後の整合済み状態。
- 2026-04-04 時点では、直前の復旧作業で混入した不整合は解消済みとして扱う。
- 今後 DB を更新する場合は、必ず事前バックアップとロールバック手順を記録する。
- demo account は追加済み。資格情報は `docs/43_DEMO_ACCOUNTS.md` を参照。
- 管理コンソールの会員一覧は既定値 `全期間`。年度指定時は current status ではなく当該年度時点の在籍状態で判定する。

## 7. 次担当者の最初の一手
1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. 触る機能に対応する正本を再確認する。
3. task がある場合は `docs/31_HANDOVER_TASK_TEMPLATE.md` から個票を作る。
4. 変更後は `HANDOVER.md` と関連正本を同ターンで更新する。
