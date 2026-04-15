# 引継ぎ Task: v136-v140 残ケース再検証（@v144）

更新日: 2026-03-28

この文書は次担当者向けの実行 task であり、現況の正本は `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を優先する。

### Task: v136-v140 残ケース再検証（@v144 上）

- 対象ケースID: `P-03`, `I-04`, `D-02`, `R-03`, `R-05`, `R-07`, `R-08`, `R-09`
- owner: Claude Code + Playwright MCP
- status: `done`
- 対象 deployment/version:
  - 会員メニュー fixed deployment `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` -> `@144`
  - 公開ポータル fixed deployment `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` -> `@144`
- 対象 URL:
  - 会員メニュー: 固定 `/exec`
  - 公開ポータル: 固定 `/exec?app=public`
- 作業ログイン:
  - `HANDOVER.md` 記載の管理者アカウントを正本とする
  - `npx clasp show-authorized-user` は `k.noguchi@uguisunosato.or.jp` を確認する
- 関連正本:
  - `HANDOVER.md`
  - `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
  - `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md`
  - `docs/09_DEPLOYMENT_POLICY.md`

#### 前回セッション（2026-03-28）で完了した作業

| 項目 | 結果 |
|------|------|
| v143 実装（管理者フィールド編集オーバーライド） | 完了 |
| v144 実装（ダッシュボード在籍会員のみカウント） | 完了 |
| clasp push + version 144 作成 | 完了 |
| 固定2 Deployment @144 同期（Apps Script UI） | 完了（Playwright MCP で操作） |
| v143 テスト: 事業所/個人会員の状態・日付フィールド編集可能 | PASS |
| v144 テスト: ダッシュボードカード在籍のみ表示（200/170/30/135） | PASS |
| v144 テスト: カードラベル変更確認 | PASS |
| git commit + push | `5c26dfc` |

#### 期待する正本データ
- 固定 2 Deployment はともに `@144` である。
- Apps Script UI `Manage deployments` では `Web app` / `Version 144` である。
- 説明名は `会員メニュー (prod) v144 admin override + active dashboard` と `公開ポータル (prod) v144 admin override + active dashboard` である。
- `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` の 39 ケースはセクション 8 まで記録済みで、残件は上記 8 ケースのみである。
- ダッシュボードは在籍会員のみカウント。退会済み会員は除外。

#### 実行前チェック
- [ ] `git status --short` が空である
- [ ] `git log -1 --oneline` が `5c26dfc` を含む最新 commit を指している
- [ ] `npx clasp show-authorized-user` が正しい Google アカウントである
- [ ] `npx clasp deployments` で fixed deployment 2 本が `@144` を向いている

#### 実行順
1. `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を読み、現況と残ケースを再確認する。
2. `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` の対象ケースだけを実施する。
3. 会員メニュー URL と公開ポータル URL を実画面確認する。
4. 結果を `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` と `HANDOVER.md` に反映する。
5. 必要なら build, push, version, redeploy を同一セッションで行い、再度 evidence を取り直す。

#### evidence
- 日付: 2026-03-28
- 実施者: Claude Code + Playwright MCP
- deployment/version: 固定 2 Deployment `@144`（会員メニュー + 公開ポータル）
- PASS/FAIL: 全 8 ケース **PASS**（P-03, I-04, D-02, R-03, R-05, R-07, R-08, R-09）
- ブラウザ確認結果: Apps Script UI「デプロイを管理」で両 Deployment とも Version 144 / ウェブアプリ / 正しい ID を目視確認
- テストケース反映先: `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` セクション 8（追試 2026-03-28 サブセクション追加済み）
- データ復旧: 友田 善隆→在籍に復旧済み、野口 健太→管理者のまま（変更なし）、事業所番号 4539021→入力済み（空欄復旧不可、バリデーション制約）

#### 終了条件
- [x] 対象 8 ケースの PASS/FAIL が `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` に記録されている
- [x] `HANDOVER.md` の最優先タスク欄が最新状態に更新されている
- [x] fixed deployment 2 本の現況が `@144` もしくは更新後の同一 version に揃っている
- [x] 変更があれば GitHub に push 済みである（`7d4c7dc`）

#### 引継ぎメモ
- v143/v144 の実装・デプロイ・基本テストは 2026-03-28 セッションで完了済み。
- 残件は v136-v140 テスト仕様書の 8 ケースのみ。v143/v144 とは独立したインライン職員編集のテスト。
- 画面確認だけで完了扱いにせず、テスト仕様書反映まで終えて閉じる。
- 追加の残件が出た場合は、`HANDOVER.md` と該当テスト仕様書を正本更新したうえで次 task を新規起票する。
