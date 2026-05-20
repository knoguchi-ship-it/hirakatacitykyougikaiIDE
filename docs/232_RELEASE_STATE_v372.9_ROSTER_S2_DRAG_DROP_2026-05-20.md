# 232. v372.9 release state: Roster Designer S2 drag-drop

更新日: 2026-05-20
対象: 名簿出力 Visual Designer Sprint S2 完了分
本番反映: integrated/public `@341` x2（変更なし） / member split `@99`（変更なし） / admin split `@145`

## 1. 目的

名簿出力 Visual Designer の出力列を、既存の上下ボタンに加えて drag-drop で並び替えられるようにする。

DB スキーマ変更、認証境界変更、public/member 変更は行わない。

## 2. 実装

- `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities` を追加。
- `src/components/RosterDesigner.tsx`
  - 出力列リストを `DndContext` + `SortableContext` に変更。
  - 各列に drag handle を追加。
  - `PointerSensor` は誤操作防止のため 6px 移動後に drag 開始。
  - `KeyboardSensor` + `sortableKeyboardCoordinates` でキーボード並び替えに対応。
  - 既存の ↑ / ↓ ボタンは残置し、drag が使いにくい環境でも操作可能にした。
- `gas/admin/index.html`
  - admin artifact を再生成。

## 3. 検証

- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`: 成功、audit 0 vulnerabilities。
- `npm run typecheck` PASS
- `npm run build` PASS
- `npm run build:gas:admin` PASS
- `npm run prerelease` PASS

## 4. デプロイ

- `gas/admin`: `npx clasp push --force`
- Apps Script version: `145`
- admin fixed deployment: `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os @145`
- `npx clasp deployments --json` で対象 deployment が `versionNumber: 145`, `description: "v372.9 roster S2 drag drop"` であることを確認済み。

## 5. 残確認

- 操作者による本番ブラウザでの drag-drop 並び替え確認。
- キーボード操作での並び替え確認。

## 6. 次工程

名簿出力の次フェーズは S3（計算式・条件付き書式）。S2 の大きな残作業はなし。S3 着手前に、本番ブラウザで列追加、上下移動、drag-drop、テンプレ保存、CSV 出力を一連で確認する。
