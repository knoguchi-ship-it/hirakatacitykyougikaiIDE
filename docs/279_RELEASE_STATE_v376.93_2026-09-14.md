# v376.93 リリース状態（2026-09-14）

## 1. 結論

正規 E2E で作成した会員テストデータのうち、承認済み入会申請が会員削除後も残る問題を解消した。E2E 専用の管理者operator関数を追加し、会員・認証・職員・変更申請を同じ厳格な識別条件で soft delete できるようにした。

## 2. 安全設計

- 対象識別子は `test-member-*.invalid` の完全一致のみ。
- 旧デモ、Dry-run、外部申込者、通常会員は対象外。
- プレビュー関数で件数だけを確認してから実行関数を使う。
- 実行は削除フラグの更新だけで、物理削除しない。
- operator関数は admin split にのみ含め、公開・会員splitには露出しない。

## 3. 検証

- `npm run prerelease`: PASS
- `test:test-data-cleanup`: PASS（完全一致、旧一括テスト削除との分離、変更申請のプレビュー／実行を検査）
- `test:gas-artifact-refs`、`test:action-dispatch`: PASS
- 3 split を再生成し、admin生成物だけにoperator関数が含まれることを確認。

## 4. デプロイ実績

| 対象 | version | fixed deployment |
|---|---:|---|
| integrated/public | @402 | 2 本 |
| member split | @160 | 1 本 |
| admin split | @257 | 1 本 |

`clasp push --force`、version作成、4本のfixed deployment同期を完了した。専用プレビューは会員1件・承認済み入会申請3件（認証・職員は各0件）を返し、実行後の再プレビューで全項目0件を確認した。

## 5. GCP 移植メモ

Firestoreではテスト専用メール形式を完全一致条件にした管理者限定のバッチ更新として実装する。通常データ・旧デモ・外部申込者の対象集合を混在させない設計を維持する。
