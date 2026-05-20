# 237. v373.3 release state — 条件付き書式の UX 微調整

更新日: 2026-05-20
リリース: **v373.3**
反映対象: admin split のみ（integrated/public・member split は v372.9 のまま）
契機: 操作者からの v373.2 実機フィードバック 4 件

## 1. デプロイ結果

| 配信 | Version |
|---|---|
| 統合 public legacy / 正式 | @341（変更なし） |
| member split | @99（変更なし） |
| **admin split** | **@149** ✅ redeployed |

## 2. 修正内容

| # | 報告 | 対応 |
|---|---|---|
| 1 | 年度フィールドの値欄が「値」テキスト入力（Image 4） | `valuePicker: 'year'` を条件付き書式の値入力にも適用し、年度プルダウン化。single/double（範囲）両対応 |
| 2 | 文字列の「等しい」が不要（Image 5） | 条件付き書式専用の `operatorsForStyle(type)` を新設、string 型から `equals` のみ除外。**行フィルタには「等しい」を残存**（正確な一致を抽出に使うケースのため） |
| 3 | 否定トグル不要（Image 6） | 条件付き書式の構造化ルール UI から否定ボタンと負ロジックを完全除去。**行フィルタには否定を残存**（v372.3 仕様維持）。`negate` プロパティは legacy 互換のため評価器に保持 |
| 4 | 年度は出力年度（filterYear）が入る前提（Image 7） | year picker フィールドが選択されたら値を **自動的に画面上部の「在籍判定年度」（filterYear）に prefill**。手動で他年度に変更も可能。ルール追加時に既定フィールドが year picker なら同じく prefill |

## 3. 実装ポイント

- 既存 `OPERATORS_BY_TYPE` を破壊せず、ラッパー `operatorsForStyle` で string 型のみ `equals` を `filter()` 除外。行フィルタは無影響
- フィールド変更時のハンドラ `handleFieldChange` を新設し、型変更で旧 operator が使えなくなる場合は新型の先頭 operator にフォールバック + value/values/value2 をリセット + year picker なら filterYear を prefill
- `negate` フィールドは型定義に残し、`evalStructuredRule` も legacy データ向けに `rule.negate ? !result : result` を維持。UI からの新規入力経路のみ閉鎖

## 4. テスト

| カテゴリ | 結果 |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run test:formula` | ✅ 33/33 pass |
| `npm run security:admin-boundary` | ✅ PASS |

## 5. 動作確認手順（操作者）

1. admin shell をリロード（@149）
2. 列「年会費対象年度」のカードを展開 → 「🎨 条件付き書式」→ 「＋ ルールを追加」
3. **値欄が `2026年度` のプルダウンになっており、画面上部の「在籍判定年度」と同じ値が初期表示** されることを確認
4. 文字列フィールド（事業所名など）でルール追加 → 演算子プルダウンから **「等しい」が消えている** ことを確認（「含む / 始まる / 終わる / 空 / 空でない」のみ）
5. すべての条件付き書式ルールに **「否定」ボタンが表示されない** ことを確認
6. 行フィルタ側（列カード下部の「条件:」セクション）には引き続き「等しい」「否定」が残ることを確認

## 6. 後方互換

- 既存テンプレに保存されている `negate: true` の条件付き書式は評価器がそのまま反転動作（読み込み専用）
- 既存テンプレの string + `equals` ルールは引き続き評価されるが、UI で編集すると operator 一覧に無くなるため自動で `contains` に置き換わる（フィールド再選択時）

## 7. ロールバック

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 148 --description "Rollback v373.3→v373.2"
```
