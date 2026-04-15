# 引継ぎ Task

更新日: 2026-04-09

### Task: v177 会員画面の実ブラウザ最終確認

- 対象ケースID: `OPS-BROWSER-CONFIRM-2026-04-09`
- owner: 次担当者
- status: `todo`
- 対象 deployment/version: member `@177` / public `@177`
- 対象 URL: member `/exec`
- 前提ログイン: 会員 `loginId + password`
- 関連正本:
  - `HANDOVER.md`
  - `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
  - `docs/09_DEPLOYMENT_POLICY.md`
  - `docs/05_AUTH_AND_ROLE_SPEC.md`
  - `docs/04_DB_OPERATION_RUNBOOK.md`
  - `docs/03_DATA_MODEL.md`

#### 期待する正本データ
- `現在の会員ステータス` にログイン中本人の氏名が表示される。
- 年会費が未納の場合、`納入方法を見る` から共通振込先が表示される。
- `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` の変更が会員画面へ反映される。

#### 実施前チェック
- [ ] `git status --short` を確認した
- [ ] `HANDOVER.md` の再開時チェックを実施した
- [ ] 対象会員が未納状態であることを確認した
- [ ] テスト後に戻す設定値を控えた

#### 実施手順
1. 会員ログイン済みの実ブラウザで member `/exec` を開く。
2. `現在の会員ステータス` に本人氏名が表示されることを確認する。
3. `納入方法を見る` を開き、振込先表示を確認する。
4. `T_システム設定.ANNUAL_FEE_TRANSFER_ACCOUNT` を一時変更し、会員画面に反映されるか確認する。
5. 必要なら設定値を元へ戻し、evidence を記録する。

#### evidence
- 日付:
- 実施者:
- deployment/version:
- PASS/FAIL:
- 実ブラウザ確認:
- 取得ログ/スクリーンショット:
- データ復旧:

#### 終了条件
- [ ] 本人氏名表示を確認した
- [ ] 振込先表示を確認した
- [ ] 設定変更反映を確認した
- [ ] 必要な復旧と正本転記が完了した

#### 引継ぎメモ
- 状況: `v177` のコード・文書・fixed deployment 同期は完了済み。
- 未了理由: Playwright セッションでは会員ログイン状態の共有に制約があり、実ブラウザの最終目視確認を人間操作前提で残している。
- 次担当者の最初の一手: 会員ログイン済みブラウザで member `/exec` を開く。
- ブロッカー: なし
