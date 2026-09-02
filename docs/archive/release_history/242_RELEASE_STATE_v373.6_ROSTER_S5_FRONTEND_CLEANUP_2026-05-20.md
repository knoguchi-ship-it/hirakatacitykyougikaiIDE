# 242. v373.6 release state — 名簿出力 Sprint S5 第 1 弾（front-end 完全削除）

更新日: 2026-05-20
リリース: **v373.6**
反映対象: **3 split 全て**（integrated/public・member split・admin split）
契機: `docs/228` Sprint S5 完了の第 1 段階。front-end 側を完全クリーンアップ

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@343** | ✅ redeployed |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@343** | ✅ redeployed |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@101** | ✅ redeployed |
| admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@152** | ✅ redeployed |

## 2. 削除範囲（front-end）

### 2-1. 削除した React コンポーネント（4 ファイル）

- `src/components/RosterExport.tsx` — 旧 PDF 名簿出力（外部 Google Sheets テンプレ依存）
- `src/components/TemplateValidationPanel.tsx` — 旧テンプレ検証パネル
- `src/components/TemplateHelpPage.tsx` — 旧テンプレヘルプページ
- `src/components/RosterTemplateHelpDialog.tsx` — 旧テンプレヘルプダイアログ

### 2-2. App.tsx の関連 UI 削除

- `currentView === 'template-help'` view（行 3162-3172）
- `currentView === 'roster-export-legacy'` view（行 5007-5021）
- 「テンプレートライブラリ」セクション（旧設定 UI、行 3346-3482 = 137 行）
- 関連 state: `rosterTemplates` / `templateLibBusy` / `templateLibError` / `templateAddForm` / `templateEditId` / `templateEditForm` の 6 つ
- `setRosterTemplates(systemSettings.rosterTemplates ?? [])` 呼び出し
- import 文: `RosterExport` / `TemplateHelpPage` / `TemplateValidationPanel` / `RosterTemplate`

### 2-3. ApiClient (`src/services/api.ts`) のメソッド削除

interface + 実装の両方を削除:

- `getMembersForRoster()`
- `initRosterExport()` / `processRosterChunk()` / `finalizeRosterExport()` / `cleanupRosterExport()`
- `validateTemplateSpreadsheet()`
- `getRosterTemplateList()` / `saveRosterTemplate()` / `deleteRosterTemplate()` / `setDefaultRosterTemplate()`

合わせて型 import からも `RosterTemplate` / `RosterTarget` / `TemplateValidationResult` / `TemplateValidationKind` を除去。

### 2-4. 型定義 (`src/types.ts` / `src/shared/types.ts`)

- `interface RosterTemplate` 削除
- `interface RosterTarget` 削除
- `type TemplateValidationKind` 削除
- `interface TemplateValidationCheck` 削除
- `interface TemplateValidationResult` 削除
- `type TemplateValidationStatus` 削除
- `SystemSettings.rosterTemplates` フィールド削除

`SystemSettings.rosterTemplateSsId` と `reminderTemplateSsId` は **pass-through 用に型のみ維持**（GAS 側の `T_システム設定` 行が残るため、次セッションで GAS と同時に撤去予定）。

### 2-5. その他

- `scripts/replace_roster.mjs`（v205 時代の一回限り migration スクリプト・dead code）削除

## 3. 残した範囲（あえて触らない）

| 項目 | 状態 | 理由 |
|---|---|---|
| GAS `gas-src/Code.full.gs` の旧 roster export handler 関数群 | **保持** | バックエンド側は影響範囲が広く、関数依存・migration 履歴・schema 整合性を別途確認する必要あり。次セッションで個別対応 |
| GAS audit allowlist (`scripts/audit-admin-boundary.mjs` の `allowedAdminActions`) | **保持** | GAS 側に handler が残っているため、allowlist を縮めると boundary audit が fail する |
| `T_システム設定` の `ROSTER_TEMPLATE_LIST` / `ROSTER_TEMPLATE_SS_ID` / `REMINDER_TEMPLATE_SS_ID` 行 | **保持** | スプレッドシート行データを残す（rollback 容易・データ保全） |
| `runRebuildSchemaForV360` 内の `addMailingListCategoryToTemplates_()` 呼び出し | **保持** | 過去 migration の一部、削除前に依存解析が必要 |

これらは **次セッションで Phase 2** として個別に対応:
1. GAS handler 削除（`generateRosterPdf` / `processRosterChunk_` / etc.）
2. audit allowlist の縮減
3. SystemSettings.rosterTemplateSsId / reminderTemplateSsId 型撤去
4. （任意）`T_システム設定` 行のクリーンアップ手順を operator 向けに用意

## 4. テスト結果

| 項目 | 結果 |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run test:formula` | ✅ 33/33 pass |
| `npm run test:search` | ✅ 16/16 pass |
| `npm run security:public-boundary` | ✅ PASS |
| `npm run security:member-boundary` | ✅ PASS |
| `npm run security:admin-boundary` | ✅ PASS |
| `npm run build:gas` / `:gas:admin` / `:gas:member` | ✅ 全 pass |

## 5. 影響評価

| 観点 | 評価 |
|---|---|
| 機能影響 | **ゼロ**。旧 RosterExport は v372 で既に Sidebar 非表示化済み = エンドユーザーから到達不能の dead code 化していた。今回はその UI とコンポーネントを正式に削除しただけ |
| バックエンド影響 | **ゼロ**。GAS 側は無変更 |
| データ影響 | **ゼロ**。`T_システム設定` 行は保持 |
| デプロイ影響 | フロントエンド bundle が縮小（admin/member 両方）|
| 後方互換 | 旧 URL の `roster-export-legacy` ハッシュは「unknown view」扱いで何も表示されない（既に到達不能だった） |

## 6. 動作確認手順（操作者）

軽い確認のみ:

1. admin shell をリロード（@152）
2. 「名簿出力」サイドバーから新 Visual Designer が今まで通り使えることを確認
3. 「設定」→「帳票出力」セクションを開き、**「テンプレートライブラリ」項目が消えている**ことを確認
4. ブラウザコンソールでエラーが出ないことを確認

## 7. 残タスク（次セッション以降）

### Phase 2: GAS バックエンド側 cleanup

| # | 内容 | 影響範囲 |
|---|---|---|
| P2-1 | gas-src/Code.full.gs から旧 GAS handler 関数群を削除 | `processApiRequest` action dispatcher の case 群 + 個別関数 |
| P2-2 | scripts/audit-admin-boundary.mjs の allowedAdminActions から旧 action を除去 | audit script のみ |
| P2-3 | gas-src/Code.full.gs の `addMailingListCategoryToTemplates_` 等 migration helper を削除 | runRebuildSchemaForV360 経路 |
| P2-4 | `SystemSettings.rosterTemplateSsId` / `reminderTemplateSsId` 型と GAS pass-through 撤去 | types + getSystemSettings_/updateSystemSettings_ |
| P2-5 | （任意）operator 向け `T_システム設定` 行のクリーンアップ手順 | operator のみ |

## 8. ロールバック

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 151 --description "Rollback v373.6→v373.5"
```

member / public も同様に旧 version (member @100 / public @342) に戻す。
