# ClaudeCode 次作業指示書（2026-03-30 更新）

## 0. 目的

Claude Code がこのリポジトリで次の開発を安全に再開するための、短い実務指示書。
最初に `HANDOVER.md` を読み、その後この文書を確認すること。

---

## 1. 現在の確定状態

- ブランチ: `main`
- 最新本番反映: `v154`（会員管理ダッシュボードの今年度統一 + 一覧フィルタ連動）。固定 deployment @154 同期済み
- GAS Version 154 作成済み。固定 deployment 2本は @154 同期済み
- GitHub のコミット/Push 状態は作業終了時点の `git log -1 --oneline` / `git status --short` を正とする
- 作業ツリーは変更が入りうるため、再開時に必ず `git status --short` を確認する
- 現時点の未追跡ファイル: `.playwright-mcp/`
- 本番固定 Deployment:
  - 会員マイページ: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` → `@154`
  - 公開ポータル: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` → `@154`
- DB_SCHEMA_VERSION: `2026-03-26-03`

### テスト状態

- v106 バックエンドテスト: B-01〜B-10 全10件 PASS（2026-03-20）
- v106 フロントエンドテスト: F-01〜F-12 全11件 PASS + 1件 SKIP（2026-03-20、@108）
- **v136-v140 テスト: 全 39 ケース PASS 完了**（`docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` セクション8）
- 初回（2026-03-27）は PASS 30 / FAIL 9。FAIL は全て Playwright MCP セッション切断が原因。`S-04` は構造修正を入れて `v141` で PASS（2026-03-27）。残 8 ケースは追試（2026-03-28, @144）で全 PASS

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

### 引継ぎ運用ルール

- 本ルールは 2026-03-27 時点の Google SRE / GitHub Docs の公開ガイダンスを参照し、今回の手動本番検証フローに合わせて定義している。
- この案件の handoff は `HANDOVER.md`、この文書、`docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` セクション8 を正本とする。
- 残件を進めたら、会話だけで済ませず、絶対日付・deployment version・PASS/FAIL・データ復旧状態を正本へ即時反映する。
- 手動 UI 確認を伴う task は、対象 URL、ログイン方法、確認観点、終了条件を先に文書化してから着手する。
- 本番反映を伴う場合は `build -> push -> version -> fixed deployment 同期 -> 実ブラウザ確認` を 1 セットで扱い、途中状態を完了扱いにしない。

---

## 3. 次の最優先タスク: ドキュメント整合と人間確認用 HTML 更新

### 概要

次担当者は、直近の実装・デプロイ実績に合わせて、正本ドキュメント群と人間確認用 HTML 群の整合を取る。

対象:
1. `docs/00_DOC_INDEX.md`
2. `README.md`
3. `docs/02_ARCHITECTURE.md`
4. `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
5. `docs/learning/index.html`
6. 必要に応じて `docs/learning/07_system_overview_v151.html` の後継 HTML

### 作業手順

1. `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` を正として、現行本番状態 `@154` を確認する
2. 古い version/deployment 記述（`@146` `@151` など）を入口文書から除去または履歴化する
3. 「人間が見る用の HTML」の対象一覧と更新責任を明文化する
4. 必要なら `docs/learning/` 配下に最新版 HTML を追加し、索引から辿れるようにする
5. 更新後に UTF-8 / 文字化け / リンク切れを再確認する

### 作業上の注意

- 入口文書は「現況」と「履歴」を混在させない
- 実装変更を伴わない回でも、正本の絶対日付と version 表記は必ず更新する
- 人間確認用 HTML は削除せず、索引と対応関係を明示する
- 文字化けが出た文書は再保存だけで済ませず、表示確認まで行う

### 完了条件

1. ドキュメント索引から現行正本と人間向け HTML に辿れる
2. 入口文書の deployment/version 表記が `v154` / `@154` に揃っている
3. 次担当者が読む順番と次アクションが 1 画面で分かる
4. 必要ならコミット → Push

---

## 4. 直近で触った重要点（v136〜v140）

- **v141**: `selectedMemberForDetail` をオブジェクト保持から ID 保持へ変更し、`members` から派生させる構造へ修正。`StaffDetailAdmin` 保存後も会員詳細一覧が同じ source of truth を参照するため、`S-04` を解消。
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
