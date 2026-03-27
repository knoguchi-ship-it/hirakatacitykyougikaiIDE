# ClaudeCode 次作業指示書（2026-03-27 更新）

## 0. 目的

Claude Code がこのリポジトリで次の開発を安全に再開するための、短い実務指示書。
最初に `HANDOVER.md` を読み、その後この文書を確認すること。

---

## 1. 現在の確定状態

- ブランチ: `main`
- 最新本番反映: `v140`（インライン職員編集サイレントリロード修正）
- GitHub のコミット/Push 状態は作業終了時点の `git log -1 --oneline` / `git status --short` を正とする
- 作業ツリーは変更が入りうるため、再開時に必ず `git status --short` を確認する
- 本番固定 Deployment:
  - 会員マイページ: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` → `@140`
  - 公開ポータル: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` → `@140`
- DB_SCHEMA_VERSION: `2026-03-27-01`

### テスト状態

- v106 バックエンドテスト: B-01〜B-10 全10件 PASS（2026-03-20）
- v106 フロントエンドテスト: F-01〜F-12 全11件 PASS + 1件 SKIP（2026-03-20、@108）
- **v136-v140 テスト: 未実施**（テスト仕様書 `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` 作成済み）
- v140 デプロイ検証: Playwright MCP でインライン職員区分変更→ローディングスピナー非表示→即座にDB保存→サイドバー権限表示更新を確認（2026-03-27）

---

## 2. 最初の行動

以下の文書を順番に読むこと。

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
- `git status --short` は意図しない差分がない
- `show-authorized-user` は `k.noguchi@uguisunosato.or.jp`
- `healthCheck` / `getDbInfo` は成功

---

## 3. 次の最優先タスク: v136-v140 テスト実施

### 概要

v136-v140 で実装した以下の機能のテストを実施する。

1. **権限階層修正**: MASTER/ADMIN のシステム権限がメンバーレベルの職員ロールで上書きされていた問題の修正
2. **インライン職員編集**: 管理コンソール会員詳細の職員一覧に、区分/状態のドロップダウンセレクターを追加
3. **サイレントリロード**: インライン編集後のバックグラウンドデータリフレッシュ時に、ローディングスピナーを表示しない修正

### テスト手順

1. テスト仕様書を読む: `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md`
2. 実装仕様書を読む: `docs/29_IMPL_SPEC_INLINE_STAFF_EDIT_v136_v140.md`
3. テスト仕様書に定義された全テストケースを実施する
4. Playwright MCP を使用してブラウザ自動化テストを行う
5. テスト結果を `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` のセクション8に記録する
6. テスト中に発見した不具合があれば、修正→再テスト→結果記録のサイクルを回す

### テスト実施上の注意

- **テストで変更したデータは必ず元に戻す**（特に野口 健太の区分は「管理者」が正）
- 状態変更テスト（I-04）でconfirmダイアログの「OK」を押した場合、テスト後に必ず「在籍」に戻す
- Playwright MCP は GAS iframe の二重構造（`#sandboxFrame` > `#userHtmlFrame`）に対応が必要
- Chrome プロファイルロック発生時はブラウザ再起動で解消

### テスト完了後

テスト全件 PASS の場合:
1. テスト結果を `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` に記録
2. `HANDOVER.md` にテスト完了を記録
3. コミット → Push

テスト中に不具合が見つかった場合:
1. 不具合を修正
2. `npm run typecheck` → `npm run build` → コピー → `npx clasp push --force` → `npx clasp version`
3. 固定 2 Deployment を新 Version に更新（Apps Script UI で手動）
4. 再テスト → 結果記録

---

## 4. 直近で触った重要点（v136〜v140）

- **v140**: `loadAppData` に `silent` オプション追加。`silent: true` 時は `setIsLoading`/`setInitError` をスキップし、MemberDetailAdmin のアンマウントを防止。`MemberDetailAdmin` に `useEffect(() => setForm({...member}), [member])` を追加し props→form 再同期。
- **v136-v137**: MASTER/ADMIN のシステム権限判定に `adminPermissionLevel` チェックを追加（`member-detail`, `staff-detail`, `admin-settings` の3ビュー）。MemberDetailAdmin の職員一覧テーブルに区分/状態のインラインドロップダウンを追加（`handleInlineStaffUpdate` 関数）。楽観的 UI 更新 + `onSaved()` でバックグラウンドリフレッシュ。
- **v135**: `mapMembersForApi_()` に `careManagerNumber` を追加。MemberDetailAdmin の連絡設定セクションを事業所会員で非表示化。
- **v133**: T_事業所職員に `メール配信希望コード` カラムを追加。StaffDetailAdmin に「メールの配信」セクションを追加。
- **v132**: ソース名簿から T_事業所職員の入会日を補正（136件更新）。
- **v131**: 管理コンソール年度対応、事業所会員フィールドブランク化、入会日補正。

### ビルドパイプライン注意

Vite は `dist/` に出力するが、`clasp push` は `backend/` から push する。ビルド後に手動コピーが必要:

```bash
npm run build
cp dist/index.html backend/index.html
cp dist-public/index_public.html backend/index_public.html
npx clasp push --force
```

v139 でこのコピーが漏れ、v140 で修正した経緯がある。

---

## 5. その他の優先タスク

テスト完了後、以下を優先度順に検討する。

1. 管理コンソール UI/UX の継続改善
2. 必要に応じて会員一括編集対象項目の拡張
3. 必要に応じて公開ポータルの文言、導線改善

注意:
- 認証方式の二重構造は崩さない
- 固定 2 Deployment ID は変更しない
- `clasp deploy`（全形式）は絶対に使わない
- 仕様変更時は正本ドキュメントを同時更新する

---

## 6. 完了条件

作業完了扱いにする前に、最低でも以下を満たすこと。

- `npm run typecheck`
- `npm run build:gas`
- `npx clasp run healthCheck`
- `npx clasp run getDbInfo`
- 必要な正本ドキュメント更新
- 固定 2 Deployment の Version 同期確認
- 実ブラウザで会員側 / 公開側の表示確認

---

## 7. 補足

- ルート `CLAUDE.md` は互換入口として扱い、グランドルール判断は `GLOBAL_GROUND_RULES/` 配下を優先すること。
- 迷ったら `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` を基準とすること。
