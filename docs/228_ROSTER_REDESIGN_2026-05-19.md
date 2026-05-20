# 228. 名簿出力コンソール 全面刷新設計書

更新日: 2026-05-19
対象リリース: v372 〜 v376（Sprint S1〜S5）
方針: Visual Template Designer 内蔵化（外部 Google Sheets 依存廃止）

## 0. 設計判断サマリ

| 判断点 | 採用 | 不採用 | 理由 |
|---|---|---|---|
| テンプレ保管場所 | T_システム設定 (`ROSTER_TEMPLATE_LIBRARY_V2` JSON) | 別シート T_名簿テンプレ / 外部 SS | 既存パターン踏襲・キャッシュ統合 |
| フィールド辞書 | バックエンド宣言（`getRosterFieldDictionary_()`）| ハードコード Front-end | スキーマ単一情報源・追加コスト最小化 |
| 列定義 | 宣言的 JSON（type + key + format + formula） | コード生成 | 保存・共有・複製容易 |
| 計算式エンジン | 内製簡易式（参照 + 算術 + if/and/or） | Excel 完全互換 | スコープを抑え保守可能 |
| 条件付き書式 | ルールベース（when + style） | 完全 CSS 自由記述 | 安全性・predictable |
| PDF 描画 | クライアントサイド `window.print()` + 印刷専用 CSS | @react-pdf/renderer / puppeteer / GAS HTMLService | 既存技術スタック内・ライブラリ追加最小 |
| CSV 出力 | 既存 BOM 付き CSV 機構流用 | 新規開発 | 実績あり |
| Excel 出力 | 既存 `src/lib/xlsx.ts` 流用（再評価必要） | 新規導入 | v361 で除去された経緯あり・再評価 |
| 旧テンプレ廃止 | S5 で完全削除（即時宣言・段階撤去） | 永久後方互換 | ユーザー指示「Q2.F」+「現状名簿機能停止中」 |

## 1. アーキテクチャ概観

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Admin React UI（admin split）                    │
│                                                                        │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────────┐   │
│  │ フィルタ        │  │ 列ビルダー         │  │ プレビュー           │   │
│  │ (種別/在籍/年会費)│→│(drag-drop列追加)│→ │ (先頭 5 件即時表示) │   │
│  └──────────────┘  └───────────────────┘  └──────────────────────┘   │
│         ↓                  ↓                         ↓                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │            テンプレライブラリ（保存・読み込み・複製）            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│         ↓                                                              │
│  ┌─────────────┬────────────────┬──────────────────┐                 │
│  │ PDF 出力     │ CSV 出力       │ Excel 出力        │                 │
│  │ (window.print)│ (BOM)         │ (xlsx)            │                 │
│  └─────────────┴────────────────┴──────────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
                                ↑↓ google.script.run
┌──────────────────────────────────────────────────────────────────────┐
│                          GAS Backend                                   │
│                                                                        │
│  getRosterFieldDictionary_() ──→ フィールド辞書（メタ + サンプル）       │
│  getMembersForRoster_()      ──→ 全フィールド値（DB スプレッドシート）   │
│  saveRosterTemplate_()       ──→ T_システム設定.ROSTER_TEMPLATE_LIBRARY_V2 │
│  loadRosterTemplates_()      ──→ JSON 配列                              │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. データモデル

### 2.1 フィールド辞書（`RosterFieldDef`）

```ts
type RosterFieldType = 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'array';

interface RosterFieldDef {
  key: string;              // 'memberId', 'lastName', 'careManagerNumber', 'feeStatus.2026' 等
  label: string;            // 表示名「会員ID」
  group: 'member' | 'office' | 'staff' | 'fee' | 'computed';
  type: RosterFieldType;
  enumLabels?: Record<string, string>;  // enum なら {ACTIVE: '在籍中'}
  sample: string;           // プレビュー用サンプル値
  description?: string;     // tooltip
}
```

バックエンドで全候補を宣言。**新フィールド追加 = 辞書追加のみ**でフロントエンド改修不要。

### 2.2 列定義（`RosterColumnDef`）

```ts
interface RosterColumnDef {
  id: string;               // uuid（ローカル一意）
  source: 'field' | 'formula' | 'literal';
  fieldKey?: string;        // source='field' のとき
  formula?: string;         // source='formula' のとき例: "{lastName} + ' ' + {firstName}"
  literal?: string;         // source='literal' のとき
  label: string;            // 出力時のヘッダー
  width?: number;           // px 単位、PDF/Excel で参照
  align?: 'left' | 'center' | 'right';
  format?: string;          // 'yyyy-MM-dd' / '#,##0' / 'percent' 等
  conditionalStyle?: ConditionalRule[];
}

interface ConditionalRule {
  when: string;             // 例: "{feeStatus} === 'UNPAID'"
  style: { color?: string; bgColor?: string; bold?: boolean };
}
```

### 2.3 テンプレ定義（`RosterTemplateV2`）

```ts
interface RosterTemplateV2 {
  id: string;
  name: string;
  description?: string;
  target: 'PERSONAL_SUPPORT' | 'BUSINESS' | 'ALL';
  columns: RosterColumnDef[];
  layout: {
    paperSize: 'A4' | 'A3' | 'B5';
    orientation: 'portrait' | 'landscape';
    fontSize: number;        // 8〜14pt
    rowsPerPage?: number;
    showRecordCount?: boolean;  // 出力件数を表示するか（default true）
    recordCountPosition?: 'header' | 'footer' | 'both';  // 表示位置
    recordCountFormat?: string; // 例: '出力対象: {{count}} 名' / '計 {{count}} 件'（差込変数 {{count}}）
  };
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

保存先：`T_システム設定` キー `ROSTER_TEMPLATE_LIBRARY_V2` に JSON 配列で。旧 `ROSTER_TEMPLATE_LIST` は S5 で削除。

## 3. 計算式エンジン（簡易式言語）

### 3.1 サポート機能

| カテゴリ | 例 | 説明 |
|---|---|---|
| フィールド参照 | `{lastName}` | フィールド辞書のキー |
| 文字列結合 | `{lastName} + ' ' + {firstName}` | + 演算子 |
| 算術 | `{annualFee} * 1.1` | + - * / |
| 比較 | `{feeStatus} === 'UNPAID'` | === !== < > <= >= |
| 論理 | `{a} && {b}` / `{a} \|\| {b}` | AND / OR |
| 条件式 | `if({feeStatus} === 'PAID', '○', '×')` | 三項相当 |
| 関数 | `len({memo})` `upper(...)` `formatDate({joinedDate}, 'yyyy-MM-dd')` | 限定セット |

### 3.2 サポートしないこと（明示的）

- 集計関数（SUM, AVG, COUNT 等の formula 内利用）→ プリ計算で対応
  - **例外**: 件数表示は formula ではなく **layout レベルの機能** として実装（`showRecordCount` + `recordCountFormat`）。テンプレ設定でヘッダ/フッタに「出力対象: N 名」を自動表示。
- ループ
- 任意の JavaScript 実行
- 外部 API 呼び出し

### 3.3 実装方針

- パーサ: 内製・~200 行想定（jsep 等の軽量ライブラリ採用も検討）
- 評価: AST → 値、行ごとに評価
- セキュリティ: eval 禁止、関数は allowlist のみ

## 4. PDF 描画

### 4.1 採用方式：クライアントサイド `window.print()` + 印刷専用 CSS

**理由**:
- GAS 外部ライブラリ追加不要
- WCAG 準拠の HTML → 印刷時もアクセシブル
- A4/A3/縦横/フォントサイズはユーザーブラウザのプリンタダイアログで調整可能（or CSS `@page` で固定）
- 大量データ（数百件）でも paging で対応

**フロー**:
1. プレビュータブで HTML/CSS 完全レンダリング
2. 「PDF 出力」クリック → 専用印刷ビュー → `window.print()`
3. ユーザーが「PDF として保存」を選択（OS 機能）

**制約**:
- ZIP 一括出力（複数件まとめて 1 PDF）は対応継続。「対象選択した全件を 1 PDF」がデフォルト
- 個別 PDF 分割（1 人 1 ファイル）は別途実装（client で件数分 print 繰り返し or バックエンド ZIP）

### 4.2 既存 ZIP チャンク方式の扱い

現状の「250件/chunk + Drive 一時フォルダ + 統合 ZIP」フローは**廃止**。理由:
- 新方式は 1 PDF にまとめる（複数ファイルではなく見開きで連続）
- 個別 PDF 分割が必要なケースは S4 改修時に再評価

## 5. UI ワイヤーフレーム

```
┌────────────────────────────────────────────────────────────────────┐
│ 名簿出力コンソール                                          [ヘルプ] │
├────────────────────────────────────────────────────────────────────┤
│ ① テンプレート選択                                                   │
│   [ ▼ 新規 / 既存テンプレ ▼ ] [複製] [削除] [新規作成]                │
├────────────────────────────────────────────────────────────────────┤
│ ② 出力対象フィルタ（既存維持）                                       │
│   種別 □個人 □事業所 □賛助 / 在籍状態 [▼] / 年会費条件 [+追加]      │
├────────────────────────────────────────────────────────────────────┤
│ ③ 列ビルダー                                                        │
│   ┌─────────────────────┬──────────────────────────────────┐      │
│   │ 利用可能フィールド    │ 出力列（drag-drop で並び替え）     │      │
│   │ ─────────────       │ ─────────────────────────       │      │
│   │ □ 会員ID            │ [≡] 氏名 (lastName+firstName)    │      │
│   │ □ 姓               │ [≡] CM 番号                       │      │
│   │ □ 名               │ [≡] 事業所名 [編集] [削除]         │      │
│   │ □ CM 番号          │ [≡] 年会費 [編集] [削除]           │      │
│   │ ...                 │ [+ 計算列を追加]                  │      │
│   └─────────────────────┴──────────────────────────────────┘      │
├────────────────────────────────────────────────────────────────────┤
│ ④ レイアウト                                                        │
│   用紙 [A4 ▼] 向き [縦 ▼] フォントサイズ [10pt ▼]                  │
├────────────────────────────────────────────────────────────────────┤
│ ⑤ プレビュー（先頭 5 件）                                           │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │ 氏名       │ CM 番号    │ 事業所名      │ 年会費          │    │
│   ├─────────────────────────────────────────────────────────┤    │
│   │ 山田 太郎  │ 27000001  │ ケアプランA   │ ○（2026）       │    │
│   │ 鈴木 花子  │ 27000002  │ ケアプランB   │ ×（2026）       │    │
│   └─────────────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────────────┤
│ ⑥ 保存 & 出力                                                       │
│   [テンプレを保存] [PDF 出力] [CSV ダウンロード] [Excel ダウンロード]│
└────────────────────────────────────────────────────────────────────┘
```

## 6. WCAG 2.2 AA 準拠

- フォーカス可視（focus-visible ring）
- キーボード操作完結（drag-drop は @dnd-kit の `KeyboardSensor` でキーボード対応）
- 44×44 px タップターゲット（既存 CopyButton と同等）
- aria-label / aria-describedby 適切付与
- コントラスト 4.5:1 以上
- スクリーンリーダ: 列の並び替えを aria-live で通知

## 7. ライブラリ採択

| 用途 | ライブラリ | サイズ | 採用理由 |
|---|---|---|---|
| Drag-drop | `@dnd-kit/core` + `@dnd-kit/sortable` | ~10KB gzip | a11y 標準・キーボード対応 |
| Formula parser | 内製 or `jsep` | 0 / ~3KB | 学習コストとカスタマイズ性 |
| Excel 出力 | 既存 `src/lib/xlsx.ts` 再評価 | 検証要 | v361 で除去経緯あるため要確認 |
| CSV | 既存 BOM 機構 | 0 | 実績あり |

xlsx 採用は **再評価が必要**: v361 ロールバックは「`pdfjs-dist` 由来の `import.meta.url` が `vite-plugin-singlefile` でクラッシュ」が原因。xlsx 自体に同問題はないが、念のため検証してから採用。

## 8. Sprint 計画

### S1（次セッション・**ここから着手**）
- **目標**: 設計確定 + 骨組み実装（既存と並行動作可能）
- 内容:
  - フィールド辞書バックエンド (`getRosterFieldDictionary_`)
  - TypeScript 型定義（`RosterFieldDef` / `RosterColumnDef` / `RosterTemplateV2`）
  - 新 React コンポーネント `RosterDesigner.tsx`（骨組み・既存 RosterExport は Sidebar から非表示化）
  - フィルタ・対象選択は既存ロジック流用
  - 列ビルダー UI（**フィールド辞書から選択・並び替えのみ**、計算式はまだ）
  - **出力件数表示** layout 設定（showRecordCount + recordCountFormat、CSV ヘッダコメント行 / プレビュー上部に反映）
  - CSV 出力（列定義反映、即実用可、件数表示込み）
  - 保存 API: `saveRosterTemplate` / `loadRosterTemplates`
- 完了条件: フィールド ON/OFF + 並び替え + CSV 出力（件数表示込み）+ テンプレ保存が動く

### S2
- **目標**: プレビュー + drag-drop UI 完成
- 内容:
  - @dnd-kit 導入
  - リアルタイムプレビュー（先頭 5 件）
  - 列幅・align・format（日付 / 数値書式）
  - テンプレ複製機能

進捗（2026-05-20 v372.8）:
- 列幅・align・format（日付 / 数値書式）は実装済み。プレビューと CSV 出力へ反映済み。
- テンプレ複製機能は v372.2 時点で実装済み。
- @dnd-kit drag-drop は未実装。依存追加を伴うため次工程で実施。

### S3
- **目標**: 計算式・条件付き書式
- 内容:
  - 計算式パーサ実装（内製 or jsep 検討）
  - 計算列追加 UI（formula エディタ + sample 確認）
  - 条件付き書式ルール UI

### S4
- **目標**: PDF 出力 + レイアウト
- 内容:
  - 印刷専用 HTML/CSS（`@media print` + `@page`）
  - `window.print()` 起動
  - A4/A3/縦横/フォントサイズ反映
  - ヘッダー/フッター（ページ番号・出力日時）

### S5
- **目標**: Excel 出力 + 旧テンプレ機能完全削除
- 内容:
  - xlsx 出力（既存 `src/lib/xlsx.ts` 評価後）
  - 旧 RosterExport.tsx / RosterTemplateHelpDialog.tsx / TemplateValidationPanel.tsx / TemplateHelpPage.tsx 削除
  - 旧 GAS 関数 (`generateRosterPdf` / `initRosterExport` 等) 削除
  - `ROSTER_TEMPLATE_SS_ID` / `ROSTER_TEMPLATE_LIST` 旧キー削除
  - 旧 docs 整理

## 9. 移行・後方互換

ユーザー判断「Q2.F = 既存廃止」採用。ただし**段階削除**:

| Sprint | 旧機能の状態 |
|---|---|
| S1 | 旧 RosterExport.tsx と新 RosterDesigner.tsx が並列稼働可能（Sidebar に両方表示） |
| S2-S3 | 新コンソールがほぼ機能完備、旧は引き続き残置（事故防止） |
| S4 | 新で PDF 出力可能になった時点で旧を「非推奨」表示 |
| S5 | 旧を完全削除 |

「現状名簿機能停止中」というユーザー報告から、S1 着手日から旧機能を **隠す**（Sidebar から除外）のは合意済み。コード自体は S5 まで残し、復帰可能性を確保。

## 10. リスク評価

| リスク | 影響度 | 軽減策 |
|---|---|---|
| 計算式パーサのセキュリティ | 高 | eval 禁止、AST 評価のみ、関数 allowlist |
| Drag-drop の a11y | 中 | @dnd-kit の KeyboardSensor + aria-live |
| `window.print` のブラウザ間差異 | 中 | Chrome/Safari/Edge で目視確認、CSS `@page` 標準化 |
| 大量データの client-side 処理 | 中 | プレビューは先頭 5 件、本出力は最大 1000 件目安・超過時 paging |
| xlsx ライブラリ問題再発 | 中 | S5 で実機テスト後判断、不可なら CSV のみで割切 |
| 既存テンプレからの移行データ | 低 | F 採用＝廃止のため移行不要 |

## 11. 確定済み仕様の要点

- **保存先**: `T_システム設定` シートのキー `ROSTER_TEMPLATE_LIBRARY_V2`（JSON 配列）
- **フィールド辞書**: バックエンド宣言、フロントエンドは購読のみ
- **計算式**: 内製簡易式、eval なし、関数は allowlist
- **PDF**: `window.print()` + 印刷専用 CSS
- **CSV**: UTF-8 BOM、列定義反映
- **Excel**: S5 で再評価
- **旧機能**: S1 で UI 非表示 → S5 で完全削除
- **WCAG**: 2.2 AA 全準拠
- **後方互換**: なし（旧テンプレデータ移行なし）

## 12. 次のアクション

操作者の確認待ち：
1. 本設計書 §0〜§11 の合意
2. S1 着手の承認

承認後、S1 を 1 セッション内で完遂予定。
