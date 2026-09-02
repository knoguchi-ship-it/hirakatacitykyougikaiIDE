# 236. v373.2 release state — 名簿出力 UX 全面是正（PDF 修正 + プリセット化 + drag-drop 改善）

更新日: 2026-05-20
リリース: **v373.2**
反映対象: admin split のみ（integrated/public・member split は v372.9 のまま）
契機: 操作者からの実機フィードバック 3 件

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| 統合 public legacy | — | **@341**（変更なし） | — |
| 統合 public 正式 | — | **@341**（変更なし） | — |
| member split | — | **@99**（変更なし） | — |
| **admin split** | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@148** | ✅ redeployed |

## 2. フィードバックと対応

| # | 報告内容 | 根本原因 | 採用した修正 |
|---|---|---|---|
| 1 | PDF 出力時に全員分のデータが乗らない・ヘッダも崩れている | `.roster-print-root` に `position: absolute` を当てていた。**絶対配置要素は印刷時にページ分割されず 1 ページ目で切れる**（MDN / react-to-print issue #2 既知問題） | **React Portal** で `<body>` 直下にマウント → `@media print { body > *:not(.roster-print-portal) { display: none } }`。通常フロー配置で自動ページ分割 |
| 2 | 条件付き書式が専門知識（式記法）を要求し、気軽に使えない | 自由記述の `when: string`（例 `{annualFeeStatus} === 'UNPAID'`）を要求 | **Airtable「Color by Conditions」型 UI**: フィールド選択 → 演算子 → 値 → スタイル。式入力 UI を完全廃止。既存 evalRowFilter ロジックを流用 |
| 2-b | 計算列（S3 formula 列）も同様に式入力で難解 | 自由記述の formula textarea | **8 プリセット限定の `<select>`**（年会費○×、未納警告、フリガナ姓+名、住所フル、電話番号優先、事業所+役職、CM+事業所、空欄列） |
| 3 | 列並び替えの drag-drop ハンドルが小さい ↕ ボタンのみで分かりづらい | drag handle が 28px の小ボタン、視認性低 | 左端に **全高の大型 grip カラム（w-8、`⋮⋮`アイコン + 番号バッジ）** を配置。`cursor: grab/grabbing`、focus ring、aria-label 詳細化 |

## 3. Web 検索（2026-05-20）に基づく根拠

### PDF 修正
- **MDN @page / break-inside**: 絶対配置要素はページ分割アルゴリズムの対象外（通常フローのみ評価される）
- **react-to-print issue #2 (2026)**: 同症状の標準解決パターンは「Portal で body 直下にマウント + display:none で兄弟を消す」
- ライブラリ追加なし（`react-to-print` は bundle +10KB なため不採用、`createPortal` のみで実装）

### 構造化条件 UI
- **Airtable「Color by Conditions」**: フィールド+演算子+値の 3 段リストで非エンジニアでも操作可能
- **Notion / Linear filter UI**: 同パターンを採用済み、業界標準
- 既存の `evalRowFilter` ロジックを流用して評価器を統一（コード重複ゼロ）

### 計算列プリセット
- **Microsoft Power Apps / Tableau Calculated Fields**: 上級ユーザー以外は「予め用意された式」から選ぶのが標準
- 8 プリセットは実用頻度の高いものを厳選（年会費状態表示・連絡先優先表示・住所統合 等）
- 既存 formula は `findPresetByFormula` で照合し、一致しないものは「⚠ レガシーカスタム式」として読取専用で保持（後方互換）

### Drag handle UX
- **@dnd-kit 公式 + 2026 best practices**: handle 専用ノードに listeners、視覚的 affordance は `cursor: grab` + grip アイコン
- **Airtable / Linear / Notion**: 全高 grip column（24-32px 幅）が業界標準パターン

## 4. 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `src/types.ts` | `ConditionalRule` に `fieldKey`/`operator`/`value`/`values`/`value2`/`negate` 追加。legacy `when` は optional 化（後方互換） |
| `src/components/RosterDesigner.tsx` | (a) `cellStyleFor` に `row + dictByKey` 追加、structured rule 評価器 `evalStructuredRule` 新設。(b) `FORMULA_PRESETS` 配列 8 件 + `findPresetByFormula` ヘルパー。(c) 計算列 UI を `<select>` に置換、`<textarea>` 廃止。(d) 条件付き書式 UI を構造化（フィールド optgroup 選択 + 演算子 + 値 + スタイルプリセット 5 種 + 太字）。(e) `buildPrintStyleCss` を Portal/`display:none` パターンに刷新。(f) `createPortal` で `<body>` 直下マウント。(g) 列カードを `flex` + 左端 grip 列 (w-8) に再構成、`cursor: grab/grabbing` |

バックエンド (`gas-src/Code.full.gs`) は **無変更**。テンプレ JSON 構造は後方互換あり。

## 5. テスト結果

| カテゴリ | 結果 |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run test:formula` | ✅ 33/33 pass |
| `npm run test:search` | ✅ 16/16 pass |
| `npm run security:admin-boundary` | ✅ PASS |
| プリセット 8 件 compile + evaluate (sample scope) | ✅ 全件 OK / 期待値出力 |

## 6. 動作確認手順（操作者）

### PDF 修正の確認
1. admin shell をブラウザで開く（@148 反映確認）
2. 名簿出力 → ② プレビュー & 出力 → 「PDF 出力」をクリック
3. 印刷プレビューで **全件（193 名）が複数ページに渡って表示** されること
4. 各ページ先頭にテーブルヘッダが繰り返し表示されること
5. テンプレ名・出力日時・件数のヘッダが正しく表示されること

### 条件付き書式の確認
1. 列「年会費」のカードを展開 → 「🎨 条件付き書式」を開く → 「＋ ルールを追加」
2. **フィールド**: 「年会費納入状況」を選択（optgroup 経由でグルーピング表示）
3. **演算子**: 「等しい」を選択
4. **値**: 「未納」を選択（enum なので select で候補表示）
5. **色**: 「赤(警告)」プリセットをクリック
6. プレビュー / PDF で未納者の年会費セルが赤背景になることを確認
7. 式入力 UI が **どこにも表示されない** ことを確認

### 計算列の確認
1. 「＋ 計算列を追加」をクリック
2. 計算列カードのプリセット `<select>` を開き、8 プリセットから選択
3. 列名と値プレビューが即時切替わることを確認
4. textarea が **どこにも表示されない** ことを確認

### Drag-drop の確認
1. 列カード左端の **`⋮⋮`** マークの縦長カラムをマウスでドラッグ
2. cursor が `grab` → `grabbing` に切替わることを確認
3. キーボード操作: grip ボタンに Tab フォーカス → Space → ↑/↓ → Enter で並び替え

## 7. 後方互換

- **既存テンプレ（freeform formula 列）**: `findPresetByFormula` で照合 → 一致なら preset 選択状態、不一致なら「⚠ レガシーカスタム式（読取専用）」表示。実行は引き続き formulaEval が処理
- **既存テンプレ（freeform `when` 条件付き書式）**: ルールカード内に「⚠ レガシー条件式（読取専用）」+ `when` 表示。`新形式に置き換え` ボタンで構造化形式に変換（値はリセット）
- 評価エンジン (`cellStyleFor`) は両形式を同時サポート（fieldKey+operator 優先、なければ legacy when にフォールバック）

## 8. 残タスク（v374 以降）

| 優先度 | 内容 |
|---|---|
| High | 本番ブラウザでの PDF 出力（全件分割）/ 条件付き書式（構造化）/ 計算列（プリセット）/ drag-drop の実機確認 |
| Medium | S5: Excel 出力再評価 + 旧 RosterExport.tsx 削除 |
| Low | プリセット拡充要望対応（新フィールド追加に応じて） |
| Low | レガシーカスタム式の自動変換ロジック（現状は手動「新形式に置換」のみ） |

## 9. ロールバック手順

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 147 --description "Rollback v373.2→v373.1"
```

admin split のみの変更のため public/member への影響なし。
