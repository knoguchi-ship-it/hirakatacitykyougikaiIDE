# 開発引継ぎ

更新日: 2026-05-08
現行本番: `v316` / integrated-public GAS version `290` / member split GAS version `44` / admin split GAS version `76`
fixed deployment: integrated/public `@290` x2 / member split `@44` / admin split `@76`

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- split project の広範な関数本体 pruning は v283 で破損したため停止中。public artifact は v289 で comment/string を除外した依存解析と top-level callable allowlist 検査を導入済み。
- release 前に `npm run security:public-boundary` / `npm run security:split-boundary` を実行し、public/member/admin 境界が崩れていないことを確認する。
- member/admin split artifact の top-level callable は `doGet` / `processApiRequest` のみに制限済み。
- `v309`: 年会費管理コンソールに管理者共有メモ（申し送りホワイトボード）を追加。admin split `@69`。詳細: `docs/194_RELEASE_STATE_v309_2026-05-08.md`
- `v308`: 会員詳細編集画面の年会費表示を、2024 年度以降、当年度から過去 4 年分へ修正。admin split `@68`。詳細: `docs/193_RELEASE_STATE_v308_2026-05-06.md`

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
10. `docs/193_RELEASE_STATE_v308_2026-05-06.md`
11. `docs/192_RELEASE_STATE_v307_2026-05-06.md`
12. `docs/191_ADMIN_MEMBER_DETAIL_ANNUAL_FEE_EDIT_2026-05-06.md`
13. `docs/190_RELEASE_STATE_v306_2026-05-06.md`
14. `docs/189_ADMIN_CONSOLE_REFRESH_UNSUPPORTED_ACTION_FIX_2026-05-05.md`
15. `docs/188_RELEASE_STATE_v305_2026-05-05.md`
16. `docs/186_RELEASE_STATE_v304_2026-05-05.md`
17. `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`
18. `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
19. `docs/09_DEPLOYMENT_POLICY.md`
20. `docs/05_AUTH_AND_ROLE_SPEC.md`
21. `docs/04_DB_OPERATION_RUNBOOK.md`
22. `docs/03_DATA_MODEL.md`
23. `docs/00_DOC_INDEX.md`
24. `docs/archive/historical/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`（補足状態サマリ。正本は `HANDOVER.md`）

## 3. 配信境界

| 用途 | Project | Deployment ID | Access | Current version |
|---|---|---|---|---|
| 公開ポータル | integrated/public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` | `@290` |
| 公開ポータル legacy | integrated/public | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `ANYONE_ANONYMOUS` | `@290` |
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` | `@44` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` | `@76` |

## 4. 直近リリース

- `v313`: 名簿出力コンソールを自動ロード・クライアント側フィルタリング・テーブル表示バグ修正。admin split `@73`
- `v312`: 名簿出力コンソールに在籍判定年度ドロップダウン＋年会費多年度条件ビルダーを追加（宛名リストと同仕様）。admin split `@72`
- `v311`: 宛名リスト年会費フィルターの初期値を選択年度・全状態にデフォルト設定。admin split `@72`
- `v310`: 宛名リスト出力コンソールの年会費納入フィルターを、複数年度・AND条件に対応した条件ビルダーに刷新。admin split `@70`。詳細: `docs/195_RELEASE_STATE_v310_2026-05-08.md`
- `v309`: 年会費管理コンソールに管理者共有申し送りメモ（ホワイトボード型）を追加。MASTER/ADMIN が書き込み可、60秒自動ポーリング＋手動更新、楽観的排他制御。admin split `@69`。詳細: `docs/194_RELEASE_STATE_v309_2026-05-08.md`
- `v308`: 会員詳細編集画面の年会費表示を 2024 年度以降、当年度から過去 4 年分へ修正。admin split `@68`。詳細: `docs/193_RELEASE_STATE_v308_2026-05-06.md`
- `v307`: 会員詳細編集画面に年会費の表示・編集セクションを追加。admin split `@67`。詳細: `docs/192_RELEASE_STATE_v307_2026-05-06.md`
- `v306`: 管理コンソール保存後再読込の `unsupported_action` fatal error を防止。admin split `@66`。詳細: `docs/190_RELEASE_STATE_v306_2026-05-06.md`
- `v305`: 宛名リスト・名簿出力の年度基準判定と共有検索を修正。admin split `@65`。詳細: `docs/188_RELEASE_STATE_v305_2026-05-05.md`
- `v304`: 会員管理コンソールの事業所職員一覧 UI を修正。admin split `@64`。詳細: `docs/186_RELEASE_STATE_v304_2026-05-05.md`
- `v303`: `adminDashboard` 旧 cache が `staffRows` なしで残る場合の再生成 guard を追加。admin split `@63`。詳細: `docs/184_RELEASE_STATE_v303_2026-05-04.md`
- `v302`: 事業所職員一覧を `T_事業所職員` 由来の `staffRows` で表示するよう修正。admin split `@62`。詳細: `docs/183_RELEASE_STATE_v302_2026-05-04.md`
- `v301`: v300 相当の admin artifact を再生成し、管理者 fixed deployment を再同期。admin split `@61`。詳細: `docs/182_RELEASE_STATE_v301_2026-05-04.md`
- `v300`: 事業所会員ビューを事業所職員一覧へ修正。admin split `@60`。詳細: `docs/181_RELEASE_STATE_v300_2026-05-04.md`
- `v299`: 会員管理コンソールに事業所会員ビューを追加。admin split `@59`。詳細: `docs/180_RELEASE_STATE_v299_2026-05-04.md`
- `v298`: 振込口座管理タブの事業所職員役員対応を修正。admin split `@58`。詳細: `docs/178_RELEASE_STATE_v298_2026-05-04.md`
- `v297`: 事業所職員を役員に割当て可能にし、関連 DB 3 テーブルへ `職員ID` を追加。member split `@44` / admin split `@57`。詳細: `docs/177_RELEASE_STATE_v297_2026-05-04.md`
- `v291`: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新し、split boundary audit を prerelease gate 化。詳細: `docs/173_RELEASE_STATE_v291_2026-05-01.md`

## 5. 既知の重要事項

- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- `PASSWORD_HASH_PEPPER_V1` は integrated/public・member split・admin split の 3 project に同一値で設定済みという前提で運用する。値は Git、handover、docs、ログ、チャット、生成物へ記録しない。
- Secret Manager 化および外部 KDF / managed identity の検討は必須 security backlog。完了または明示的な代替設計決定まで削除・完了扱いにしない。詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `v288` 第三者評価で検出された public callable `rebuildDatabaseSchema` / `getDbInfo` は v289 で public artifact から除去済み。
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod` で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- admin split `@47` は whiteout 実績があるため、原因特定まで admin physical pruning の再デプロイは禁止。

## 6. DB とスキーマ状態

- 本番 DB スプレッドシート ID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`（固定・変更禁止）
- ログ SS ID: `1NmVv483UeehF8dqCdyNKOqOtv_fPKROhHN7011N23lw`
- v295 DB マイグレーションは 2026-05-03 に Apps Script エディタ（admin split）から `runRebuildSchemaForV295` を手動実行済み。
- v297 DB マイグレーションは 2026-05-04 に Apps Script エディタ（admin split）から `runRebuildSchemaForV297` を手動実行済み。
- v305 / v306 / v307 / v308 は物理 DB スキーマ変更なし。v305 は `getMemberFiscalSnapshot_()` による年度基準派生モデルの修正、v306 は管理コンソール再読込状態管理の修正、v307/v308 は既存年会費 API を使う会員詳細 UI と表示年度修正のみ。
- `T_役員` / `T_振込口座` / `T_請求` の人物識別は `会員ID` または `職員ID` の XOR 制約を守る。

## 7. 操作者確認待ち

実ブラウザ確認は操作者側で実施する。

- 会員マイページ OAuth 再承認: member split に `drive` scope が追加済みのため、未実施環境では再承認が必要。
- v304: 会員管理コンソールの「事業所職員」一覧で、事業所名クリックだけが詳細遷移し、メール配信変更が一括保存後も保持されること。
- v305: 宛名リストで対象年度の年度外会員が出ないこと、年度内退会者が対象に残ること、氏名検索がスペース有無に依存しないこと。
- v306: 管理コンソールで全体データ読込後に年会費コンソール等を保存しても `unsupported_action` の全画面エラーにならず、再ログイン不要で継続操作できること。
- v307: 会員詳細編集画面で年会費ステータス、納入確認日、備考を年度行ごとに保存でき、年会費管理コンソール側にも反映されること。
- v310: 宛名リストで「+ 条件を追加」から年度と状態を選択して絞り込めること。複数条件が AND で機能すること。アクティブフィルターチップが条件ごとに表示・個別削除できること。
- v309: 年会費管理コンソールで申し送りメモパネルが表示・保存・自動更新されること。複数アカウントで同時編集して競合バナーが出ること。
- v308: 会員詳細編集画面の年会費セクションで、2024 年度以降、当年度から過去 4 年分までの行が表示されること。

## 8. 次担当者の最初の一手

1. `git status --short` で既存差分と未追跡ファイルを確認する。
2. `HANDOVER.md`、`docs/194_RELEASE_STATE_v309_2026-05-08.md`、`docs/09_DEPLOYMENT_POLICY.md` を読む。
3. 実装・構成・デプロイ前に不明点を確認する。
4. 変更前に関連正本を読み、コード・データ・デプロイ・UI・認証・運用手順を変える場合は同ターンで正本を更新する。
5. 本番系 `clasp` コマンドは最初から承認済みの安定経路で実行する。

## 9. 標準確認コマンド

```bash
git status --short
git diff
npm run typecheck
npm run build:gas:admin
npm run security:public-boundary
npm run security:split-boundary
```

本番反映時は `docs/09_DEPLOYMENT_POLICY.md` の `build -> push -> version -> fixed deployment sync -> verification -> document update` を完了条件とする。
