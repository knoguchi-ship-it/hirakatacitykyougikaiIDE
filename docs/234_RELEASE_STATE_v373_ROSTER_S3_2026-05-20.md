# 234. v373 release state — 名簿出力 Visual Designer S3（計算式 + 条件付き書式）

更新日: 2026-05-20
リリース: **v373**
反映対象: admin split のみ（integrated/public・member split は v372.9 のまま）

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@341**（変更なし） | — |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@341**（変更なし） | — |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@99**（変更なし） | — |
| **admin split** | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@146** | ✅ redeployed |

## 2. 変更概要

`docs/228_ROSTER_REDESIGN_2026-05-19.md` Sprint S3 を本リリースで完遂。

- **計算列（formula source）** — 列の `source: 'formula'` を実配線。`{fieldKey}` 構文でフィールド参照、`if/and/or/not/len/upper/lower/trim/concat/coalesce/num/str/formatDate/contains/startsWith/endsWith` の 16 関数 + 算術/比較/論理/三項を許可。
- **条件付き書式（ConditionalRule[]）** — 列ごとに「最初に一致したルール」を採用（Google Sheets / Excel 標準動作）。WCAG 2.2 §1.4.1 準拠のプリセット 5 種（赤/黄/緑/青/灰）を提供。色＋背景＋太字の組合せで色覚多様性に配慮。
- **プレビュー反映** — 条件付き書式は admin 画面のプレビューにのみ反映。CSV は値のみ出力（プレーンテキスト規格遵守）。

## 3. セキュリティ設計（最重要）

**Threat model**: admin ユーザーが作成した formula が T_システム設定 に永続化され、admin shell 内で再評価される。admin 権限を持つアカウントのみが書込み可能だが、以下を前提に防御:

| 攻撃ベクタ | 対策 |
|---|---|
| eval / new Function 経由の RCE | jsep で AST にパースし、自前 walker で評価。`eval`/`Function`/`require`/`fetch` は識別子として未許可 |
| プロトタイプ汚染 | `MemberExpression` ノードを `validateAst` で reject（`obj.constructor` 等不可） |
| グローバル参照 | `Identifier` は `__f\d+`（フィールド参照）と allowlist 関数名のみ通過 |
| 配列/オブジェクトリテラル | `ArrayExpression`/`ObjectExpression`/`Compound` を reject |
| 任意関数呼び出し | `CallExpression.callee` は `Identifier` 限定 + 名前が `ALLOWED_FUNCTIONS` (16 関数) のホワイトリストに含まれることを必須 |
| DoS（深いネスト） | `MAX_AST_DEPTH = 32`、`MAX_STRING_LENGTH = 10,000` |
| タグ付きテンプレートリテラル | jsep が未対応 → 構文エラーで reject |

**ライブラリ選定根拠（2026-05-20 Web 検索）**:
- `expr-eval` は 2026 に RCE 脆弱性発覚（SC Media）→ 不採用
- `jse-eval` は「sandbox は提供しない」と明記 → 不採用
- `jsep` は AST 生成のみ（評価器を含まない）+ 10 年運用実績 + ~10KB minified → 採用、評価器は自前

## 4. 実装ファイル

| ファイル | 内容 |
|---|---|
| `src/lib/formulaEval.ts` | jsep AST walker、allowlist 16 関数、`compileFormula` / `evaluateFormula` / `evaluateCondition` / `FORMULA_FUNCTIONS` を export |
| `src/components/RosterDesigner.tsx` | `valueFor` に formula ブランチ追加、計算列追加ボタン、formula textarea + リアルタイム検証、条件付き書式エディタ、プレビュー table セルへ style 反映 |
| `scripts/test-formula-eval.mts` | 33 test (セキュリティ攻撃シナリオ 9 件 + 機能 24 件) — `npm run test:formula` |
| `package.json` | `jsep ^1.4.0` 追加 / `test:formula` script 追加 / `prerelease` に組込 |

型定義 `ConditionalRule` / `RosterColumnDef.formula` / `conditionalStyle` は v372 で既に存在しており、配線のみ追加。バックエンド (`gas-src/Code.full.gs`) は **無変更**。テンプレ JSON 構造は後方互換。

## 5. テスト結果

```
$ npm run test:formula
# tests 33
# pass 33
# fail 0
```

| カテゴリ | 件数 | 内訳 |
|---|---:|---|
| セキュリティ reject | 9 | eval, Function, member access, this, array, 未許可関数, 未許可演算子, 空式, 過剰長, DoS ネスト |
| 機能テスト | 24 | リテラル、フィールド参照、結合、算術、比較、論理、三項、if/and/or/coalesce/len/upper/lower/trim/concat/formatDate/contains/startsWith/endsWith、null 系、evaluateCondition |

`npm run typecheck` / `npm run security:admin-boundary` / `npm run test:search` も全 pass。

## 6. UX デザイン根拠（2026-05-20 Web 検索）

- **traffic-light パターン** (red / yellow / green) — Excel/Sheets/Google ベストプラクティスで universally understood
- **色だけに頼らない** — WCAG 2.2 §1.4.1 / Microsoft Accessibility — bold/icon/border 併用を UI でガイダンス表示
- **「最も具体的 → 一般」順で評価** — Sheets/Excel 互換動作（最初に一致したルールを採用）
- **プリセット提供 + カラーピッカー** — 自由度と「壊さない」既定値の両立

## 7. 動作確認手順（操作者）

1. admin shell をブラウザで開く（`@146` が反映済みか確認）
2. 名簿出力 → ① テンプレ設計 → 出力列の末尾「＋ 計算列を追加」をクリック
3. 式を `if({annualFeeStatus} === 'PAID', '○', '×')` に変更 → リアルタイムでプレビュー値が変化
4. 既存列「年会費」を選択 → 「🎨 条件付き書式」展開 → 「＋ ルールを追加」 → `{annualFeeStatus} === 'UNPAID'` + 赤プリセット
5. ② プレビュー & 出力タブ → プレビューで条件に該当するセルが赤背景になることを確認
6. CSV ダウンロード → 値のみ出力されることを確認（色情報は持たない設計）

## 8. 未確認 / 既知の制約

- **PDF 出力（S4）未実装**: 条件付き書式の PDF 反映は S4 で `@page` + print CSS を用いて実装予定
- **集計関数 (SUM/AVG)**: 設計書通り未サポート（プリ計算 or layout レベル件数表示で代替）
- **フィールド名にドットを含むキー**: 現在の getRosterFieldDictionary はドット含むキーを発行しないため未検証。将来発行する場合は `{feeStatus.2026}` 形式で対応可能（パーサ側は処理済み）

## 9. 残タスク（v374 以降）

| 優先度 | 内容 |
|---|---|
| High | 本番ブラウザでの計算式 / 条件付き書式 動作確認（実機） |
| Medium | S4: PDF 出力 + レイアウト（A4/A3/縦横/フォントサイズ） |
| Medium | S5: Excel 出力再評価 + 旧 RosterExport.tsx 等の完全削除 |
| Low | 関数 allowlist の拡張要望（now()/round/min/max 等） |

## 10. ロールバック手順

```
cd gas/admin
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 145 --description "Rollback v373→v372.9"
```

admin split のみの変更のため public/member への影響なし。
