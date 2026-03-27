# 引継ぎ Task: v142 残ケース再検証と本番 Deployment 確認

更新日: 2026-03-28

この文書は次担当者向けの実行 task であり、現況の正本は `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を優先する。

### Task: v142 残ケース再検証と本番 Deployment 確認

- 対象ケースID: `P-03`, `I-04`, `D-02`, `R-03`, `R-05`, `R-07`, `R-08`, `R-09`
- owner:
- status: `todo`
- 対象 deployment/version:
  - 会員メニュー fixed deployment `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` -> `@142`
  - 公開ポータル fixed deployment `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` -> `@142`
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

#### 期待する正本データ
- 固定 2 Deployment はともに `@142` である。
- Apps Script UI `Manage deployments` では `Web app` / `Version 142` である。
- 説明名は `会員メニュー (prod) v142 annual fee console` と `公開ポータル (prod) v142 annual fee console` である。
- `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` の 39 ケースはセクション 8 まで記録済みで、残件は上記 8 ケースのみである。
- 年会費管理コンソールの最新仕様は v142 反映済みであり、対象年度の前年度末以前に退会した会員は年会費対象外である。

#### 実行前チェック
- [ ] `git status --short` が空である
- [ ] `git log -1 --oneline` が handover 準備を含む最新 commit を指している
- [ ] `npx clasp show-authorized-user` が正しい Google アカウントである
- [ ] `npx clasp deployments` で fixed deployment 2 本が `@142` を向いている

#### 実行順
1. `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を読み、現況と残ケースを再確認する。
2. `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` の対象ケースだけを実施する。
3. 会員メニュー URL と公開ポータル URL を実画面確認する。
4. Apps Script UI `Manage deployments` で fixed deployment 2 本の `Web app` / `Version 142` / 説明名を確認する。
5. 結果を `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` と `HANDOVER.md` に反映する。
6. 必要なら build, push, version, redeploy を同一セッションで行い、再度 evidence を取り直す。

#### evidence
- 日付:
- 実施者:
- deployment/version:
- PASS/FAIL:
- ブラウザ確認結果:
- Apps Script UI 確認結果:
- テストケース反映先:
- データ復旧:

#### 終了条件
- [ ] 対象 8 ケースの PASS/FAIL が `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` に記録されている
- [ ] `HANDOVER.md` の最優先タスク欄が最新状態に更新されている
- [ ] fixed deployment 2 本の現況が `@142` もしくは更新後の同一 version に揃っている
- [ ] 変更があれば GitHub に push 済みである

#### 引継ぎメモ
- 本 task は「残件再検証」と「deployment 現況確認」を一体で扱う。
- 画面確認だけで完了扱いにせず、Apps Script UI とテスト仕様書反映まで終えて閉じる。
- 追加の残件が出た場合は、この文書を複製せず `HANDOVER.md` と該当テスト仕様書を正本更新したうえで次 task を新規起票する。
