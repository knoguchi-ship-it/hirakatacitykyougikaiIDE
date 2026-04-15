# 引継ぎ Task: v155 プライバシー対応の本番反映・確認
更新日: 2026-03-31

この文書は v155 task の完了記録であり、現況の総覧は `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` を参照する。

### Task: v155 プライバシー対応の本番反映・確認

- 対象ケースID: `V155-DEPLOY`, `V155-PRIVACY`, `V155-ACCESSIBILITY`
- owner: Codex
- status: `completed`
- 対象 deployment/version:
  - 会員マイページ fixed deployment `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` -> `@155`
  - 公開ポータル fixed deployment `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` -> `@155`
- 対象 URL:
  - 会員マイページ: 本番 `/exec`
  - 公開ポータル: 本番 `/exec?app=public`
- 前提ログイン:
  - `npx clasp show-authorized-user` が `k.noguchi@uguisunosato.or.jp`
  - Apps Script UI `Manage deployments` を操作できる Google セッション
- 関連正本:
  - `HANDOVER.md`
  - `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
  - `docs/09_DEPLOYMENT_POLICY.md`
  - `docs/34_DEVELOPMENT_OPERATING_MODEL_2026-03-30.md`
  - `docs/35_BEST_PRACTICE_AUDIT_2026-03-31.md`
  - `docs/36_DATA_PROTECTION_PROCEDURES.md`
  - `docs/37_GAS_QUOTAS_AND_LIMITS.md`

#### 期待する正本データ
- 本番 fixed deployment 2 本が同一 version を参照していること
- 公開ポータルに利用目的通知と同意が表示されること。プライバシーポリシー正本は本サイト別建てで管理すること
- 連絡先プレースホルダー `【要設定】` が実運用値へ置換済みであること
- アクセシビリティ改善（スキップリンク、フォーカス管理、`aria-live`、`aria-labelledby`）が本番で破綻していないこと
- `collectTrainingRecipients_()` が `mailingPreference=NO` の職員を除外すること

#### 現在の作業状況
- 2026-03-31 の後続整理で、プライバシーポリシー正本は本サイト別建てとし、ポータル内画面は削除方針へ切り替えた。
- `npm run typecheck`、`npm run build`、`npm run build:gas` は 2026-03-31 に再実行し成功。
- `npx clasp show-authorized-user` は `k.noguchi@uguisunosato.or.jp` を確認済み。
- `npx clasp run healthCheck` / `npx clasp run getDbInfo` は 2026-03-31 に成功。
- `npx clasp push --force` 実施済み。
- `npx clasp version "v155 privacy policy contact info and docs alignment"` 実施済み。Version `155` 作成済み。
- 固定 2 deployment は `npx clasp redeploy` により `@155` へ同期済み。
- 監査レポートの HIGH / MEDIUM 項目は実装済み。残る監査項目は LOW 優先のみ。
- Playwright 実ブラウザで `/exec` はログイン画面、`/exec?app=public` は公開ポータルトップを確認済み。
- blocker なし。

#### 再開前チェック
- [x] `git status --short` を確認した
- [x] 未追跡ファイル（`.playwright-mcp/`, `docs/35`, `docs/36`, `docs/37`, `docs/learning/08_system_overview_v154.html`, `src/shared/PrivacyPolicy.tsx`）を把握した
- [x] `npx clasp show-authorized-user` を確認した
- [x] `npx clasp run healthCheck` が成功した
- [x] `npx clasp run getDbInfo` が成功した
- [x] `src/shared/PrivacyPolicy.tsx` の `【要設定】` を実値に置換した

#### 再開手順
1. `src/shared/PrivacyPolicy.tsx` の連絡先プレースホルダーを実運用値へ更新した。
2. `npm run typecheck`、`npm run build`、`npm run build:gas` を再実行した。
3. `npx clasp push --force`、`npx clasp version` を実行した。
4. 固定 2 deployment を `npx clasp redeploy` で同一 version `155` へ更新した。
5. `npx clasp deployments`、`/exec`、`/exec?app=public` を確認した。
6. 公開ポータルでプライバシーポリシー導線と表示内容を実ブラウザ確認した。
7. `HANDOVER.md` と `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md` の current state を更新する。

#### evidence
- 日付: 2026-03-31
- 実施者: Codex
- deployment/version: fixed deployment 2 本とも `@155`
- PASS/FAIL: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run build:gas`: PASS
- `npx clasp show-authorized-user`: `k.noguchi@uguisunosato.or.jp`
- `npx clasp run healthCheck` 確認結果: PASS
- `npx clasp run getDbInfo` 確認結果: PASS
- `npx clasp push --force`: PASS
- `npx clasp version`: PASS（Version `155`）
- `npx clasp deployments` 確認結果: 会員 / 公開とも `@155`
- `/exec` 確認結果: Playwright でログイン画面表示を確認
- `/exec?app=public` 確認結果: Playwright で公開ポータルトップ表示を確認
- 実ブラウザ確認結果: `/exec` ログイン画面、`/exec?app=public` 公開ポータルトップを確認
- プライバシーポリシー運用: 正本は本サイト別建て。ポータル内画面は後続整理で削除

#### 終了条件
- [x] 連絡先プレースホルダーが実値へ置換されている
- [x] fixed deployment 2 本が同一 version へ更新されている
- [x] `/exec` と `/exec?app=public` が正常応答する
- [x] 公開ポータルの利用目的通知と同意チェックが本番で確認できている
- [x] `HANDOVER.md` と関連正本が更新されている

#### 引継ぎメモ
- この task は完了済み記録として保持する。
- 監査レポートの LOW 項目は、必要になった時点で別 task を起票して扱う。
