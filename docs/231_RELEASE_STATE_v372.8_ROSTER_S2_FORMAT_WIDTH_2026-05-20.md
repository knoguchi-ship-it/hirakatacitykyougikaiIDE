# 231. v372.8 release state: Roster Designer S2 format and width controls

更新日: 2026-05-20
対象: 名簿出力 Visual Designer Sprint S2 部分対応
本番反映: integrated/public `@341` x2（変更なし） / member split `@99`（変更なし） / admin split `@144`

## 1. 目的

名簿出力 Visual Designer の Sprint S2 で予定していた「列幅・配置・日付/数値書式」を、既存テンプレート JSON の `width` / `align` / `format` フィールドで実用化する。

DB スキーマ変更、認証境界変更、public/member 変更は行わない。

## 2. 実装

- `src/components/RosterDesigner.tsx`
  - 列ビルダーに列幅入力を追加（60〜320px、未入力は自動幅）。
  - 列ビルダーに書式 select を追加。
  - 日付書式: 標準 / `yyyy-MM-dd` / `yyyy/MM/dd` / `yyyy年M月D日`。
  - 数値書式: 標準 / `#,##0` / `円` 表示。
  - プレビュー表の `th` / `td` に列幅と配置を反映。
  - CSV 出力にも書式反映後の値を使用。
- `gas/admin/index.html`
  - admin artifact を再生成。

## 3. デプロイ

- `npm run build:gas:admin` PASS
- `npm run prerelease` PASS
- `gas/admin`: `npx clasp push --force`
- Apps Script version: `144`
- admin fixed deployment: `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os @144`
- `npx clasp deployments --json` で対象 deployment が `versionNumber: 144`, `description: "v372.8 roster S2 format width"` であることを確認済み。

## 4. 未実施

- S2 の drag-drop は未実装。依存追加（`@dnd-kit/core` / `@dnd-kit/sortable`）を伴うため、次工程で導入可否を確認して実施する。
- 本番ブラウザでの列幅・書式・CSV 出力の目視確認は操作者確認待ち。
