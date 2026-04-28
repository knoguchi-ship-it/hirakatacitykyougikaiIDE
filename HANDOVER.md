# 開発引継ぎ

更新日: 2026-04-28
現行本番: `v288`（統合プロジェクト GAS version 287 / 会員 split GAS version 39 / 管理者 split GAS version 46）
固定 deployment: 統合（公開ポータル）`@287` × 2本 / 会員 split `@39` / 管理者 split `@46`

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- 関数本体 pruning は v283 で破損したため停止中。wrapper / alias / 再代入 / trigger / Apps Script 直接実行関数を扱える依存解析ができるまで再開しない。

## 2. 最初に読む順序

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `docs/166_RELEASE_STATE_v288_2026-04-28.md`
11. `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md`
12. `docs/164_RELEASE_STATE_v287_2026-04-28.md`
13. `docs/163_RELEASE_STATE_v286_2026-04-28.md`
14. `docs/162_RELEASE_STATE_v285_2026-04-27.md`
15. `docs/161_RELEASE_STATE_v284_2026-04-27.md`
16. `docs/160_RELEASE_STATE_v283_2026-04-27.md`
17. `docs/159_RELEASE_STATE_v282_2026-04-27.md`
18. `docs/158_RELEASE_STATE_v281_2026-04-27.md`
19. `docs/157_RELEASE_STATE_v280_2026-04-27.md`
20. `docs/156_RELEASE_STATE_v279_2026-04-27.md`
21. `docs/155_RELEASE_STATE_v278_2026-04-27.md`
22. `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
23. `docs/09_DEPLOYMENT_POLICY.md`
24. `docs/05_AUTH_AND_ROLE_SPEC.md`
25. `docs/04_DB_OPERATION_RUNBOOK.md`
26. `docs/03_DATA_MODEL.md`
27. `docs/00_DOC_INDEX.md`

## 3. 配信境界

| 用途 | Project | Deployment ID | Access |
|---|---|---|---|
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` |
| 公開ポータル | 統合 public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` |

## 4. 直近リリース

- `v288`: 統合プロジェクトへ push する artifact を public-only `Code.gs` に縮退。公開ポータル URL / deployment ID は維持し、統合 fixed deployment 2本を `@287` へ同期。member split `@39` と admin split `@46` は未変更。詳細: `docs/166_RELEASE_STATE_v288_2026-04-28.md`
- `v287-partial`: member split の生成済み `Code.gs` から境界外関数を物理削除。admin split は `@47` でホワイトアウトしたため `@46` へロールバック済み。統合/公開は `@285` 維持。詳細: `docs/164_RELEASE_STATE_v287_2026-04-28.md`
- `v286`: `saveMemberCore_` の admin-only 代表者検証・監査ログを option 明示化。会員セルフ更新の機能変更なし。詳細: `docs/163_RELEASE_STATE_v286_2026-04-28.md`
- `v285`: `updateMember_` を admin wrapper、`saveMemberCore_` を実保存 core に分離。詳細: `docs/162_RELEASE_STATE_v285_2026-04-27.md`
- `v284`: v283 の member function pruning を撤回し、`addPublicStaffMember_ is not defined` を解消。詳細: `docs/161_RELEASE_STATE_v284_2026-04-27.md`
- `v283`: member split の到達不能トップレベル関数削除を試行。v284 で撤回。詳細: `docs/160_RELEASE_STATE_v283_2026-04-27.md`
- `v282`: member/admin split の境界外 action handler 分岐を生成時に削除。詳細: `docs/159_RELEASE_STATE_v282_2026-04-27.md`
- `v281`: member/admin split の境界外 action registry を物理的に空化。詳細: `docs/158_RELEASE_STATE_v281_2026-04-27.md`
- `v280`: 会員ログイン画面から管理者ログイン UI を除去。詳細: `docs/157_RELEASE_STATE_v280_2026-04-27.md`
- `v279`: app 境界 API gate を追加。詳細: `docs/156_RELEASE_STATE_v279_2026-04-27.md`
- `v278`: 研修表示・申込判定モデルを lifecycle と application availability に分離。詳細: `docs/155_RELEASE_STATE_v278_2026-04-27.md`

## 5. 既知の重要事項

- `v288 third-party assessment`: 旧統合 URL の public artifact には admin/member action handler と HTML は残っていないが、`google.script.run` で呼べる `rebuildDatabaseSchema` / `getDbInfo` が残存。public separation は完了扱いにしない。詳細: `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod`（88737175415）で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- Google API 依存機能の障害では、コード調査前に GCP API 有効化、OAuth scope、Workspace 管理設定、実行ユーザー権限を確認する。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。

## 6. 操作者確認待ち

- `v288`: 公開ポータルで研修一覧、外部申込/取消、会員登録申請、公開変更申請、OTP 導線が従来どおり動くこと。
- `v288`: 旧統合 URL が public-only 画面を返し、会員ログイン画面や管理者ログイン画面を返さないこと。
- `v288`: 会員 split `@39` と管理者 split `@46` の実ブラウザ動作が従来どおり維持されること。
- `v287-partial`: 会員マイページでログイン、研修一覧、申込済み研修、会員情報更新が従来どおり動くこと。
- `admin rollback`: 管理者ポータルが `@46` 復元後に表示されること。
- `v287-partial`: 会員マイページに管理者ログイン導線が表示されないこと。
- `v278`: 研修登録後、公開・受付条件を満たす研修が会員マイページに表示されること。
- DriveApp: 必要に応じて管理設定の研修ファイル保存先フォルダ作成、PDF アップロード、サムネイル生成を確認すること。

# Next Handover Note

- 最優先: `v289` で public artifact から `rebuildDatabaseSchema` / `getDbInfo` を除去し、build 後の public top-level callable allowlist 検査を追加する。
- v288 で public portal の integrated artifact は public-only へ縮退済み。次担当者は `docs/166_RELEASE_STATE_v288_2026-04-28.md` と `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md` を読むこと。
- canonical full source は `gas-src/Code.full.gs`。`backend/Code.gs` は `npm run build:gas` で生成される public-only artifact として扱う。
- admin `@47` はホワイトアウト発生済み。原因特定まで admin physical pruning を再デプロイしない。
