# 243. v373.7 release state — 名簿出力 Sprint S5 第 2 弾（GAS バックエンド完全削除）

更新日: 2026-05-20
リリース: **v373.7**
反映対象: **3 split 全て**（integrated/public・member split・admin split）
契機: v373.6 (front-end 削除) の続編。GAS バックエンド側の旧 RosterExport コードを完全撤去

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@344** | ✅ redeployed |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@344** | ✅ redeployed |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@102** | ✅ redeployed |
| admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@153** | ✅ redeployed |

## 2. 削除範囲（GAS バックエンド）

### 2-1. ALLOWED_ACTIONS マップから 10 action 削除

`gas-src/Code.full.gs` のアクセス制御マップから:

- `getMembersForRoster`
- `generateRosterZip`
- `validateTemplateSpreadsheet`
- `initRosterExport`
- `processRosterChunk`
- `finalizeRosterExport`
- `cleanupRosterExport`
- `getRosterTemplateList`
- `saveRosterTemplate`
- `deleteRosterTemplate`
- `setDefaultRosterTemplate`

### 2-2. processApiRequest dispatcher case 削除

10 個の `if (action === '...')` 分岐を削除。

### 2-3. 関数本体 4 ブロック (合計 -1,599 行)

| ブロック | 範囲 | 内容 | 行数 |
|---|---|---|---|
| 1. v316 テンプレートライブラリ | `getRosterTemplateList_` / `saveRosterTemplate_` / `deleteRosterTemplate_` / `setDefaultRosterTemplate_` | 115 |
| 2. テンプレ検証 + helpers | `validateTemplateSpreadsheet_` / `normalizeSpreadsheetIdInput_` / `buildTemplateValidationCheck_` / `getTemplateSheetsByRule_` / `summarizeTemplateValidationStatus_` | 151 |
| 3. v194 PDF名簿対象取得 | `getMembersForRoster_` | 116 |
| 4. v205 PDF chunk + helpers + template builders | `initRosterExport_` / `processRosterChunk_` / `finalizeRosterExport_` / `cleanupRosterExport_` / `generatePdfsForIds_` / `resolveRosterTemplatePrefix_` / `captureRosterSheetVisibility_` / `restoreRosterSheetVisibility_` / `isTemplateInternalSheet_` / `getTemplateSheetMetadataMap_` / `getRosterTemplateDataSheet_` / `ensureRosterTemplateDataSheet_` / `applyRosterSheetVisibility_` / `selectRosterDisplaySheets_` / `createRosterTemplateExample` (×2 重複) / `setupRosterTemplateMemberSheet_` / `setupRosterTemplateStaffSheet_` / `setupRosterTemplateDataSheet_` / `setupReminderTemplateDataSheet_` / `setupReminderTemplateSheet_` / `setupReminderGuideSheet_` / `setupRosterTemplateGuideSheet_` / `setTemplateSheetMetadata_` / `selectRosterDisplaySheetsV2_` / `createRosterReminderTemplateExample` | 1,186 |
| **合計** | | | **1,568** |

加えて `migrateRosterTemplateLibraryCategoryForV360_` (28 行) と `runRebuildSchemaForV360` の Step 7 呼出し (3 行) を撤去。

### 2-4. スキーマ初期化エントリ削除

`initializeSchema_` 内の 2 箇所:

- `newKeys` 配列から `ROSTER_TEMPLATE_SS_ID` / `REMINDER_TEMPLATE_SS_ID` / `ROSTER_TEMPLATE_LIST` の 3 つを削除
- 旧形式 `if (!byKey['ROSTER_TEMPLATE_SS_ID']) appendRowsByHeaders_(...)` の 2 ブロック削除

### 2-5. getSystemSettings_ / updateSystemSettings_ の pass-through 削除

- `rosterTemplateSsId: rosterTemplateSsId` / `reminderTemplateSsId: reminderTemplateSsId` / `rosterTemplates: getRosterTemplateList_()` を削除
- `request.rosterTemplateSsId` / `request.reminderTemplateSsId` の handle を削除

### 2-6. audit-admin-boundary.mjs から 9 action 削除

`scripts/audit-admin-boundary.mjs` の `allowedAdminActions` から削除:

- `getMembersForRoster`, `validateTemplateSpreadsheet`, `initRosterExport`, `processRosterChunk`, `finalizeRosterExport`, `cleanupRosterExport`, `getRosterTemplateList`, `saveRosterTemplate`, `deleteRosterTemplate`, `setDefaultRosterTemplate`

### 2-7. App.tsx / types.ts 残置 pass-through 撤去

- `SystemSettings.rosterTemplateSsId` / `reminderTemplateSsId` 型削除
- `rosterTemplateSsIdInput` / `reminderTemplateSsIdInput` state 削除
- updateSystemSettings 呼出しの送出フィールド削除

## 3. データ保全

`T_システム設定` シートに残存する **行データは触らない**:

| 設定キー | 状態 |
|---|---|
| `ROSTER_TEMPLATE_SS_ID` | 行残置（rollback 用） |
| `REMINDER_TEMPLATE_SS_ID` | 行残置 |
| `ROSTER_TEMPLATE_LIST` | 行残置（旧テンプレ JSON 配列） |

これらはコード側から読み書きされないため業務影響ゼロ。operator が必要なら GUI で手動削除可能。

## 4. 自動 pruning

build script `pruneUnreachableFunctionDeclarations` (admin/member/public 共通) が、削除した dispatcher case から到達不能になった依存関数 (e.g., `mapRosterTargetsForLegacy_` 等) を自動で除去。今回ビルド時のログ:

- admin: **Pruned 315 unreachable function declarations** (v373.6 時点の 338 から 23 個増えた)
- public: 同様に増加

## 5. テスト結果

| 項目 | 結果 |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run test:formula` | ✅ 33/33 pass |
| `npm run test:search` | ✅ 16/16 pass |
| `npm run security:public-boundary` | ✅ PASS |
| `npm run security:member-boundary` | ✅ PASS |
| `npm run security:admin-boundary` | ✅ PASS |
| `npm run build:gas` / `:gas:admin` / `:gas:member` | ✅ 全 pass |

## 6. 削減統計（v373 シリーズ全体）

| リリース | 内容 | 削除行数 |
|---|---|---|
| v373.6 | front-end 削除 | -2,447 行 |
| v373.7 | GAS バックエンド削除 | **-1,599 行** + 自動 pruning |
| **合計** | | **-4,046 行** + pruning |

`gas-src/Code.full.gs`: **27,341 行 → 25,742 行**（直接削除分のみ）

## 7. 影響評価

| 観点 | 評価 |
|---|---|
| 機能影響 | **ゼロ**。front-end (v373.6) で既に API を呼ばなくなっていた → 今回サーバー側削除で完全終了 |
| データ影響 | **ゼロ**。T_システム設定 行データは保全 |
| デプロイ影響 | admin/member/public 全 split で bundle 縮小 |
| 後方互換 | client から旧 action を呼ぼうとすると `unsupported_action` で reject される（既に front-end からは呼ばない）|

## 8. 動作確認手順（operator）

軽い確認のみで OK（v373.6 で機能テスト済み）:

1. admin shell をリロード（@153）
2. 「名簿出力」サイドバーから新 Visual Designer が今まで通り使えることを確認
3. 「設定」→「帳票出力」セクションを開き、旧 UI が無いことを確認
4. ブラウザコンソールでエラーが出ないことを確認

## 9. Sprint S5 完了宣言

`docs/228` で計画した **Sprint S5「Excel 出力再評価 + 旧 RosterExport 等の完全削除」のうち削除部分は完了**。Excel 出力は v361 の `import.meta.url` 罠を再評価する必要があるが、CSV + PDF 出力で実用上カバーできているため、別途要望が出るまで保留。

```
Sprint S1 ████████████ DONE  骨組み (v372)
Sprint S2 ████████████ DONE  drag-drop / 列幅 / 書式 (v372.8/v372.9)
Sprint S3 ████████████ DONE  計算式 + 条件付き書式 (v373)
Sprint S4 ████████████ DONE  PDF 出力 + レイアウト (v373.1/v373.2)
Sprint S5 ████████████ DONE  旧 RosterExport 完全削除 (v373.6/v373.7)
                              Excel 出力は保留 (CSV+PDF で実用カバー)
```

## 10. ロールバック

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 152 --description "Rollback v373.7→v373.6"
```

member / public も同様。Code.full.gs の変更は git revert で復元可能。
