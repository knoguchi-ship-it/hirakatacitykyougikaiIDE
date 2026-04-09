# 開発引継ぎ・運用プレイブック

更新日: 2026-04-08
目的: 担当者が変わっても、同じ入口・同じ完了条件・同じ証跡で開発を継続できる状態を維持する。

## 1. この文書の役割
- `HANDOVER.md`: 現在の本番状態、直近履歴、次担当者の最初の一手を書く。
- この文書: 日々の開発フロー、役割分担、証跡、handover 更新ルールを書く。
- task 個票: `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製し、案件単位の途中経過を書く。

## 2. 開発体制
- 依頼者: 要件の優先順位、業務判断、デプロイ可否を決める。
- 実装担当: 調査、実装、ローカル検証、正本更新を担当する。
- デプロイ担当: `docs/09_DEPLOYMENT_POLICY.md` に従い push/version/fixed deployment 更新を担当する。
- 確認担当: 実ブラウザ確認、データ影響確認、evidence 整理を担当する。

補足:
- 小規模作業では 1 人が複数役割を兼務してよい。
- 兼務しても、判断・実装・確認の区切りは記録上分ける。

## 3. 作業開始チェック
1. `git status --short` で既存差分を把握する。
2. `HANDOVER.md` を読み、本番 version と pending を確認する。
3. `AGENTS.md` と案件ルールを読む。
4. 対象機能の正本を読む。
5. 必要なら task 個票を作成する。
6. オンライン作業前は `npx clasp show-authorized-user`、`npx clasp run healthCheck`、`npx clasp run getDbInfo` を実行する。

## 4. 作業中ルール
- 仕様変更前に、対応する正本の記述有無を確認する。
- 正本が不足している場合、コード変更と同じターンで追記する。
- 既存の unrelated diff は触らない。
- demo/mock の復活は不可。
- business member の代表者情報は `REPRESENTATIVE` 行を正本とする。
- task 単位で証跡を残し、結果だけでなく復旧内容も記録する。

## 5. 完了条件
### 実装完了
- 必要コードが反映されている。
- 対応する正本が更新されている。
- 影響範囲と未了事項が明記されている。

### ローカル検証完了
- `npm run typecheck`
- `npm run build`
- 必要時のみ `npm run build:gas`

### 本番反映完了
- `npx clasp push --force`
- `npx clasp version "<release note>"`
- `npx clasp redeploy <memberDeploymentId> --versionNumber <version> --description "<release note>"`
- `npx clasp redeploy <publicDeploymentId> --versionNumber <version> --description "<release note>"`
- `npx clasp deployments --json` で反映確認
- 必要な `/exec` 実ブラウザ確認

## 6. 記録の更新順
1. task 個票を更新する。
2. `HANDOVER.md` に current state と pending を転記する。
3. 関連する正本仕様を更新する。
4. `docs/00_DOC_INDEX.md` に新規正本を追加する。

## 7. 証跡の最低要件
- 絶対日付
- 対象 version
- 実行コマンド
- PASS / FAIL
- 確認した UI / API
- データを変更した場合の復旧有無
- スクリーンショットまたはログの保存先

## 8. 引継ぎメモの書き方
- 「何をしたか」より先に「今どの状態か」を書く。
- 相対表現ではなく `2026-04-04` のような絶対日付を使う。
- `デプロイした` だけで終わらせず、`fixed deployment が @171` のように version まで書く。
- 未了項目は「次担当者の最初の一手」がそのまま行動できる粒度で書く。

## 9. 新しい task を切る条件
- 仕様確認だけで終わらない作業。
- 複数日にまたがる作業。
- データ変更、デプロイ、権限、認証、本番確認を含む作業。
- 途中停止時に文脈喪失リスクがある作業。

## 10. この案件の運用禁止事項
- `clasp deploy --deploymentId` を使わない。
- Apps Script UI の `Manage deployments` 手更新を通常リリースの標準経路にしない。
- fixed deployment を片方だけ更新しない。
- 本番データ確認なしに demo seed や mock 経路を持ち込まない。
- 正本未更新のまま handover 完了扱いにしない。
