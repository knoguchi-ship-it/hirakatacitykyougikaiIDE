# 引継ぎ書（次担当者向け）

更新日: 2026-03-11
対象: 枚方市介護支援専門員連絡協議会 会員システム

## 1. 先に必ず読む文書（順番固定）
1. `docs/12_ENGINEERING_RULEBOOK.md`（最上位ルール）
2. `docs/10_SOW.md`（スコープ・品質保証）
3. `docs/09_DEPLOYMENT_POLICY.md`（本番デプロイ標準）
4. `docs/05_AUTH_AND_ROLE_SPEC.md`（認証/権限仕様）
5. `docs/04_DB_OPERATION_RUNBOOK.md`（DB運用）
6. `docs/11_WITHDRAWAL_DELETION_POLICY.md`（退会/削除ポリシー）

## 2. 現在の運用要点
- 認証方式:
  - 管理者: Googleアカウントログイン
  - 会員: ID/パスワードログイン
- DB整合性ポリシー:
  - マスタ定義・テーブル定義・型定義・実装を同時更新
  - 既存DBは再作成前提ではなく、追記/移行で整合維持
- ドキュメント運用:
  - 正本は `docs/00_DOC_INDEX.md` を参照
  - 不要文書は `docs/archive/` へ退避
  - 人間確認用HTMLは保持（削除しない）

## 3. 本番デプロイの現状（2026-03-11時点）
- `clasp` 認証ユーザー: `k.noguchi@uguisunosato.or.jp`
- デプロイ一覧（抜粋）:
  - `AKfycbw2QYvMovSCkXtSpGAro1drZqonpXjf_zTpa-ylsUIYZhzrlDgGds7jurGHKuKCY4xU` @57
  - `AKfycby8Uc8RMNpRrcQIV-DePe3ZzoDMglSnB9EBO5GXzTn3VNyJT1lUBcpEpjiodjqbzCpF` @56
- `/exec` 疎通確認:
  - `AKfycbw2.../exec` -> HTTP 403（認可ありURLとして応答）
  - `AKfycby8.../exec` -> HTTP 404

## 4. 次担当者の最初の作業
1. `docs/12_ENGINEERING_RULEBOOK.md` と `docs/09_DEPLOYMENT_POLICY.md` を読み、固定URL運用ルールを確認
2. Apps Script `Manage deployments` で本番として扱うDeployment IDを確認
3. `/exec` をブラウザで確認（404でないこと）
4. `npx clasp run healthCheck` と `npx clasp run getDbInfo` を実行
5. 問題なければ開発再開

## 5. 標準コマンド
```bash
# フロント/GASビルド
npm run build
npm run build:gas

# GAS反映
cd backend
npx clasp show-authorized-user
npx clasp push --force
npx clasp version "<release note>"

# 疎通確認
npx clasp run healthCheck
npx clasp run getDbInfo
```

## 6. デプロイ時の禁止事項（再掲）
- 事前合意なしで本番Deployment IDを変更しない
- 404未解消のまま本番完了にしない
- ドキュメント更新なしで完了扱いにしない

## 7. 直近の変更履歴（Git）
- `8406f7b` docs整理: 正本とアーカイブを再編しルールブックを追加
- `7f6d365` デプロイ方針書の本番固定IDをv57へ更新
- `bf1ffcb` 会員退会ポリシーと研修履歴仕様を実装

## 8. 補足
- 既存の履歴文書は `docs/archive/docs_history/` に保存
- 本書は再開時の最初の確認資料として維持し、更新時は日付を更新する
