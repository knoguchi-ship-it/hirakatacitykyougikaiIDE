# 235. v373.1 release state — 名簿出力 Visual Designer S4（PDF 出力 + レイアウト）

更新日: 2026-05-20
リリース: **v373.1**
反映対象: admin split のみ（integrated/public・member split は v372.9 のまま）

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| 統合 public legacy | — | **@341**（変更なし） | — |
| 統合 public 正式 | — | **@341**（変更なし） | — |
| member split | — | **@99**（変更なし） | — |
| **admin split** | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@147** | ✅ redeployed |

## 2. 変更概要

`docs/228_ROSTER_REDESIGN_2026-05-19.md` Sprint S4 を本リリースで完遂。

- **PDF 出力ボタン有効化** — `window.print()` 経由でブラウザ印刷ダイアログを開く。「PDF として保存」を選択することでクライアント側 PDF 生成。
- **レイアウト UI 拡張** — 用紙サイズ (A4 / A3 / B5) / 向き (縦 / 横) / フォントサイズ (8〜14pt) を選択 UI に追加。
- **動的 `@page` CSS 生成** — `buildPrintStyleCss(layout)` で選択値から `@page { size: ... ; margin: 12mm }` を組み立て、`<style dangerouslySetInnerHTML>` で注入。値は controlled enum のみ受理し XSS を排除。
- **印刷専用 DOM** — `.roster-print-root` を画面上は `display:none`、`@media print` 時のみ visibility 切替で表示。全 `effectiveRows`（プレビュー 5 件制限なし）を出力。
- **条件付き書式の PDF 反映** — S3 で導入した `cellStyleFor()` をそのまま再利用。`-webkit-print-color-adjust: exact` / `print-color-adjust: exact` で印刷時の色情報保持を強制（WCAG 2.2 §1.4.1 要件と合致）。
- **テーブル改ページ最適化** — `<thead>` に `display: table-header-group` で各ページ先頭にヘッダ繰返し。`<tr>` に `break-inside: avoid` + 旧 `page-break-inside: avoid` 併用でクロスブラウザ対応。
- **印刷時ヘッダ** — テンプレ名（H1）+ 出力日時 + 出力件数 + 説明文 を上部に固定表示。

## 3. 印刷スタイル設計（2026-05-20 Web 検索ベース）

| 項目 | 採用 | 不採用 | 根拠 |
|---|---|---|---|
| 印刷起動 | `window.print()` | `react-to-print` 等の追加ライブラリ | bundle 増加 (~10KB) を回避。プレーンな DOM + CSS で十分 |
| 用紙指定 | `@page { size: A4 portrait }` | 既定（ブラウザダイアログ依存） | テンプレ保存時に正本化、ダイアログでも変更可能 |
| UI 非表示 | `body * { visibility: hidden } / .roster-print-root * { visibility: visible }` | `display:none` 切替 | 既存 DOM 構造を変えず、レイアウト崩れリスク最小 |
| ヘッダ繰返し | `<thead> { display: table-header-group }` | 手動繰返し | ブラウザ標準動作、追加 JS 不要 |
| 行分割回避 | `break-inside: avoid` + `page-break-inside: avoid` | 改ページマーカー手入れ | MDN 推奨パターン、レガシーブラウザ互換 |
| 色保持 | `print-color-adjust: exact` + `-webkit-` prefix | デフォルト依存 | Chrome/Edge は省略時に背景色を白に上書きするため必須 |
| ページ番号 | ブラウザの印刷ダイアログ既定（オプション扱い） | CSS `@page @bottom-right` counter | Chrome/Edge/Firefox は `@bottom-*` 領域未実装。互換性優先 |
| Excel 出力 | S5 で再評価 | — | v361 の `import.meta.url` 罠を踏まないため別 sprint |

**XSS 対策**: 動的 CSS は `enum` 検証後の値しか挿入しない。`paperSize` は `['A4', 'A3', 'B5'].includes(...)`、`orientation` は `=== 'landscape'` 判定、`fontSize` は 8〜14 の数値範囲チェック。式文字列・テンプレ名等は `<style>` には流れない。

## 4. 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/RosterDesigner.tsx` | `PAPER_SIZES` / `FONT_SIZES` 定数、`buildPrintStyleCss(layout)`、レイアウト UI 3 controls、PDF 出力ボタン配線、`.roster-print-root` DOM、`<style>` 注入 |

バックエンド (`gas-src/Code.full.gs`) は **無変更**。テンプレ JSON 構造は v372 時点から既存の `layout.paperSize` / `layout.orientation` / `layout.fontSize` を初めて UI から書き込めるようになっただけで、保存形式に変更なし。後方互換あり。

## 5. テスト結果

- `npm run typecheck` ✅
- `npm run test:formula` 33/33 ✅
- `npm run test:search` 16/16 ✅
- `npm run security:admin-boundary` ✅

print 出力自体の実機確認は操作者タスク（次項）。

## 6. 動作確認手順（操作者）

1. admin shell をブラウザで開き、名簿出力 → ① テンプレ設計 → レイアウトセクションを開く
2. 用紙サイズ「A4」/ 向き「縦」/ フォントサイズ「10pt」が選択されていることを確認
3. ② プレビュー & 出力 タブ → 「PDF 出力」ボタン（青）をクリック
4. ブラウザ印刷ダイアログが開く → 「送信先 = PDF として保存」を選択
5. プレビューに以下を確認:
   - テンプレ名（H1）+ 出力日時 + 件数 がページ先頭に表示
   - テーブルヘッダがページごとに繰返し表示
   - 条件付き書式（赤/黄/緑等の背景色）が印刷プレビューに反映
   - 行が中央で分断されていない（break-inside: avoid が効いている）
6. 用紙を「A3 横」に変更して再 print → 用紙サイズと向きが切替わることを確認

**ブラウザ別注意**:
- Chrome / Edge: 既定で印刷時の背景色を保持。ダイアログの「詳細設定」→「背景のグラフィック」を ON にする必要がある場合あり
- Firefox: 既定で背景色を保持しない設定の可能性。同様にダイアログから ON
- Safari: 印刷プレビューで背景色がデフォルトで保持される

## 7. 既知の制約

- **ページ番号** は CSS `@page @bottom-right` の Chrome/Edge/Firefox 未実装のため、ブラウザの印刷ダイアログ既定機能（ヘッダ/フッタ ON 時）に委譲。手動で「ヘッダーとフッター」を有効にするとブラウザがページ番号を自動付与
- **A3 横 + 大量行** で巨大 DOM を生成する場合、`effectiveRows` を 1000 件以下に絞ることを推奨（メモリ・印刷時間）
- **iframe 制約**: GAS Apps Script は iframe sandbox 配信のため、外側ページの header / footer は印刷されない。これは仕様通り

## 8. 残タスク（v374 以降）

| 優先度 | 内容 |
|---|---|
| High | 本番ブラウザでの PDF 出力 実機確認（操作者） |
| Medium | S5: Excel 出力再評価 + 旧 RosterExport.tsx 等の完全削除（xlsx は v361 の `import.meta` 罠を再確認） |
| Low | CSS `@page @bottom-right { content: counter(page) "/" counter(pages) }` のブラウザ対応進展時に再導入 |
| Low | 1 名 1 PDF の個別出力（現状は 1 PDF にまとめ） |

## 9. ロールバック手順

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 146 --description "Rollback v373.1→v373"
```

admin split のみの変更のため public/member への影響なし。
