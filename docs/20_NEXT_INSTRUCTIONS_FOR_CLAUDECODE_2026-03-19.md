# ClaudeCode 次作業指示書（2026-03-20 更新）

## 0. 目的

Claude Code がこのリポジトリで次の開発を安全に再開するための、短い実務指示書。
最初に `HANDOVER.md` を読み、その後この文書を確認すること。

---

## 1. 現在の確定状態

- ブランチ: `main`
- 最新本番反映: `v111`（会員一括編集初版 + webapp manifest 復旧）
- GitHub のコミット/Push 状態は作業終了時点の `git log -1 --oneline` / `git status --short` を正とする
- 作業ツリーは変更が入りうるため、再開時に必ず `git status --short` を確認する
- 本番固定 Deployment:
  - 会員マイページ: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` → `@111`
  - 公開ポータル: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` → `@111`
- v106 バックエンドテスト: B-01〜B-10 全10件 PASS（2026-03-20）
- v106 フロントエンドテスト: F-01〜F-12 全11件 PASS + 1件 SKIP（2026-03-20、@108）
- v111 デプロイチェック: 会員ログイン画面表示 / 公開ポータルトップ表示 / `healthCheck` / `getDbInfo` 成功（2026-03-20）
- v105 MCP テスト: 管理者/個人会員/事業所一般職員の3パターン全て PASS（2026-03-20）

---

## 2. 最初の行動

1. `HANDOVER.md`
2. `GLOBAL_GROUND_RULES/CLAUDE.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/09_DEPLOYMENT_POLICY.md`
5. `docs/05_AUTH_AND_ROLE_SPEC.md`
6. `docs/04_DB_OPERATION_RUNBOOK.md`

次に以下を実行すること。

```bash
git status --short
cd backend
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
```

期待値:
- `git status --short` は空
- `show-authorized-user` は `k.noguchi@uguisunosato.or.jp`
- `healthCheck` / `getDbInfo` は成功

---

## 3. 直近で触った重要点（v104〜v106）

- v111: 管理トップに会員一括編集パネルを追加。`updateMembersBatch_` で代表メール・発送方法・郵送先・会員状態・入退会日を最大100件まで一括保存可能。`appsscript.json` に `webapp` manifest を追加し、旧固定 Deployment の 404 から新規 Deployment 2 本へ切り替えて復旧済み。
- v106→v108: フィールドレベルアクセス制御拡張（NIST RBAC）。ロール別職員 allowlist、退職日/登録日自動記録、退職者年度フィルタ、STAFF 自己編集、職員別研修モーダル。v108 で ADMIN ロールコンボ disabled 修正 + REPRESENTATIVE ラベル追加。仕様書: `docs/21_IMPL_SPEC_FIELD_ACCESS_CONTROL_v106.md`。テスト仕様書: `docs/22_TEST_SPEC_v106_FIELD_ACCESS_CONTROL.md`。**全テスト PASS・@108 デプロイ済み**。
- v105: フィールドレベルアクセス制御（OWASP A01/CWE-915）。サーバーサイド allowlist + `updateMemberSelf_` で会員自身の更新を安全に処理。管理者専用フィールドをフロントエンドで非活性化。
- v104: 退会機能（年度末退会予約方式）。`WITHDRAWAL_SCHEDULED` 状態で年度末まで保留、自動昇格で `WITHDRAWN` に遷移。パスワード再認証必須。
- 公開ポータルは「枚方市介護支援専門員連絡協議会お申込みポータル」。`研修を申し込む` / `新規入会を申し込む` を選ぶ構成。
- `submitMemberApplication` はログイン不要の公開 API。
- `updateMember_` には代表者ロール制約のバックエンド強制が入っている。
- 不要ファイルは `Dust/` に退避済み（`.gitignore` 済み）。

---

## 4. 次の優先タスク

優先度順:

1. 管理コンソール UI/UX の継続改善
2. 必要なら会員一括編集（`updateMembersBatch_`）の対象項目拡張
3. 必要なら公開ポータルの文言・導線改善

注意:
- 認証方式の二重構造は崩さない
- 固定 2 Deployment ID は変更しない
- `clasp deploy --deploymentId` は使わない
- 仕様変更時は正本ドキュメントを同時更新する

---

## 5. 完了条件

作業完了扱いにする前に、最低でも以下を満たすこと。

- `npm run typecheck`
- `npm run build:gas`
- `npx clasp run healthCheck`
- `npx clasp run getDbInfo`
- 必要な正本ドキュメント更新
- 固定 2 Deployment の Version 同期確認
- 実ブラウザで会員側 / 公開側の表示確認

---

## 6. 補足

- ルート `CLAUDE.md` は互換入口として扱い、グランドルール判断は `GLOBAL_GROUND_RULES/` 配下を優先すること。
- 迷ったら `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` を基準とすること。
