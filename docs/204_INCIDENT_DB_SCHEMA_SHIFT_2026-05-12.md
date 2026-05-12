# Incident — T_会員 DB schema-shift data corruption (2026-05-12)

Status: **closed**。データ復旧 100% 完了。診断/復旧関数の cleanup は local commit `1da2fa2` 済み、v337 として admin fixed deployment `@95` へ反映済み。

## 復旧確定済み

| テーブル | 影響 | 復旧 | バックアップ |
|---|---|---|---|
| T_会員（232 行） | 列 6 以降が右シフト 1 列ズレ | ✅ `repairSchemaShiftForV336` で復旧、verify OK | `T_会員_backup_20260512_000201` |
| M_組織マスタ（8 行） | 列 5 以降が右シフト 1 列ズレ | ✅ 同関数で復旧 + `全役員表示フラグ` を UI 経由で正しい値に設定 | `M_組織マスタ_backup_20260512_014831` |
| T_請求 / T_振込口座 / T_変更申請 | データなし | ✅ 影響なし確認 | — |
| T_役員 | 8 行存在、kind 検出で全列正常 | ✅ 影響なし確認 | — |
| T_事業所職員 / T_認証アカウント / T_研修 / T_年会費納入履歴 / M_役職マスタ / M_支払い種別マスタ 等 | v288 以降 schema 変更なし | ✅ 影響なし | — |

## M_組織マスタ 全役員表示フラグ 最終状態（UI 設定後）

| 組織コード | 組織名 | 全役員表示フラグ |
|---|---|---|
| HQ | 本部 | true（表示） |
| DIRECTORS | 理事会 | true（表示） |
| AUDITORS | 監事会 | false（所属者のみ） |
| SECRETARIAT | 事務局 | true（表示） |
| REGIONAL | 圏域委員会 | false（所属者のみ） |
| PR | 広報組織化委員会 | false（所属者のみ） |
| TRAINING | 研修委員会 | false（所属者のみ） |
| RESEARCH | 調査研究委員会 | false（所属者のみ） |

## 概要

v335 リリース（2026-05-12）で `T_会員` に `移行日` 列を position 6 へ挿入したスキーマ変更を行った。`initializeSchemaIfNeeded_` の `normalizeTableColumns_` による data-shift マイグレーションが実態として走らなかった結果、シートの header 行（row 1）だけが新スキーマ（34 列）に更新され、データ行（row 2 以降 232 行）が旧スキーマ（33 列）の column 順のまま残っていた。

結果、管理者ポータルの会員管理コンソールおよび会員詳細編集画面で、`勤務先名` セルに郵便番号、`勤務先都道府県` セルに市区町村、`携帯電話番号` セルに事業所名、`削除フラグ` セルに介護支援専門員番号などが表示される事象が発生（[image: 添付画面 2/3/4]）。

## 影響範囲

| テーブル | 影響 | 状態 |
|---|---|---|
| `T_会員`（232 行） | 全データ行で column 6〜33 が右シフト 1 列ズレ | **復旧済み（要 UI 確認）** |
| `T_組織マスタ` | v333 で `全役員表示フラグ` 列追加 → 同症状の疑い | **未検証** |
| `T_請求` | v333 で `請求種別 / 業務分類コード / 単価 / 数量` 列追加 → 同症状の疑い | **未検証** |
| `T_事業所職員` | 直近のスキーマ列追加なし | 影響なしと想定 |

## 根本原因

`normalizeTableColumns_` は header 名ベースで data-shift マイグレーションを行う設計だが、本件では次の状況により migration を「不要」と判定して早期 return したと推定される:
- 何らかの過去操作で sheet の header 行が新スキーマ（`移行日` を含む 34 列）と一致する状態に既になっており、`normalizeTableColumns_` の冒頭の `currentHeaders === targetHeaders` チェックが true を返した
- その結果、各データ行の `移行日` 列以降が旧スキーマ位置のまま残置された

詳細な原因は schema_initialized_version プロパティの状態と migrate トリガの履歴が必要だが、再発防止策（次セクション）の方が優先のため未深掘り。

## 復旧手順（実施済み）

1. 診断関数 `diagnoseTKaiInSchemaForV336` を admin に push し、`clasp run` で T_会員 の header/data 不整合を確認（headerDiff `mismatched: []`、sample 3 行で `削除フラグ` に CM 番号・`勤務先名` に郵便番号が混入）
2. 復旧関数 `repairSchemaShiftForV336(payload)` を実装。`payload = { mode: 'dryRun'|'execute', table, insertedAtPosition }`
3. **2026-05-12 04:02:06 UTC**: `repairSchemaShiftForV336({ mode:'execute', table:'T_会員', insertedAtPosition:6 })` を実行
   - 同 SS 内に `T_会員_backup_20260512_000201` を自動複製（ロールバック用）
   - 232 行を右シフト書き戻し
   - 直後の再読込で `verified: true`
   - adminDashboard / fetchAllData キャッシュをクリア

## 残作業

- [x] T_会員 UI 確認（押江 朋子 等の表示が正常であることを Playwright で確認済）
- [x] T_組織マスタ の同症状検証 → execute（8 行復旧）
- [x] T_請求 / T_振込口座 / T_変更申請: データなし確認
- [x] T_役員: kind 検出で全列正常確認
- [x] M_組織マスタ 全役員表示フラグ 3 行を UI から設定（HQ / DIRECTORS / SECRETARIAT を true に）
- [x] 診断/復旧関数 4 つを `gas-src/Code.full.gs` から削除（local commit `1da2fa2` 済み）
- [x] `scripts/build-admin-gas.mjs` および `scripts/audit-admin-boundary.mjs` の allowlist 整理
- [x] typecheck / build:gas:admin / 全 boundary audit PASS
- [x] **v337 リリース**: Git push → admin push → version `95` → admin fixed deployment `@95` redeploy 完了（詳細: `docs/205_RELEASE_STATE_v337_2026-05-12.md`）
- [ ] **バックアップシートの保管期限**: `T_会員_backup_20260512_000201` と `M_組織マスタ_backup_20260512_014831` は最低 2 週間（2026-05-26 まで）残置を推奨。安全性確認後は削除可
- [ ] **再発防止策の実装**（v338 以降）: `writeSheetHeaders_` の name-based data-shift 追加、または `initializeSchema_` 内の呼び出し順序変更

## 再発防止策（提案）

1. `normalizeTableColumns_` に強制マイグレーション flag を追加し、`DB_SCHEMA_VERSION` 変更時は header 一致でも data-shift 検査を実施
2. シート列追加リリース時の deploy checklist として、`runRebuildSchemaForV<N>` を必ず手動実行する手順を `docs/09_DEPLOYMENT_POLICY.md` に追記
3. データ書き込み前の sanity check: `削除フラグ` カラム値が `true/false` 以外の場合に warning ログを出す

## 復旧コマンド再掲（同類事象の参考用）

```powershell
# dryRun
$p = '[{\"mode\":\"dryRun\",\"table\":\"T_テーブル名\",\"insertedAtPosition\":N,\"sampleSize\":3}]'
npx clasp run repairSchemaShiftForV336 --params $p

# execute (バックアップ自動作成・5分間 guard 付き)
$p = '[{\"mode\":\"execute\",\"table\":\"T_テーブル名\",\"insertedAtPosition\":N}]'
npx clasp run repairSchemaShiftForV336 --params $p
```

実行には **clasp project-scoped OAuth** が必要:
```powershell
npx clasp login --creds .tmp\oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost
```
push は標準 OAuth (`k.noguchi@hcm-n.org`) で行うため、auth ping-pong が発生する。
