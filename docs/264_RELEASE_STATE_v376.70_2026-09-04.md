# v376.70 リリース状態（2026-09-04）

- 本番 fixed deployment: **public @379 ×2 / member @138 / admin @235**
- ロールバック先: **public @378 ×2 / member @137 / admin @234**（v376.69）
- 位置づけ: **仕様書の巻き直しに伴う UI 不整合の修正**（機能追加なし・スキーマ変更なし）

---

## 1. 背景

仕様書（`docs/spec/04_UIUX.md`）を実装から起こす過程で、画面まわりの不整合が 3 件見つかった。
いずれも v376.68 でデータ出力の画面を追加したときの取りこぼしと、古い死んだコードである。

## 2. 修正内容

| # | 内容 | 影響 |
|---|---|---|
| 1 | `View` 型に `'data-export'` を追加 | 型としては到達不能な画面が実際には動いていた。直前の分岐で `currentView` が `never` に絞られるため **TypeScript の検査をすり抜けていた**（`tsc --noEmit` は通っていた） |
| 2 | `BREADCRUMB_MAP` に `'data-export'` を追加 | **データ出力（CSV）の画面だけパンくずが出ていなかった** |
| 3 | ログイン画面の未使用変数 `loginTitle` / `loginDescription` を削除 | 描画に使われない英語文言が残っていた（`AGENTS.md` §4.4 の日本語優先に反する死んだコード） |

### なぜ型検査で気付けなかったか（再発防止のための記録）

`renderContent()` は `currentView === '...'` の分岐を積み上げる構造で、
`'data-export'` の判定に到達する時点で **`currentView` の型は `never` に絞り込まれている**。
`never` は任意の値と比較できるため、`View` に無い文字列と比較しても TS2367 が出ない。

**画面を追加したときは、型・パンくず・サイドバー・権限マッピングの 4 か所を必ず揃える。**

## 3. 検証

### 3.1 デプロイ前

| ゲート | 結果 |
|---|---|
| `npm run prerelease`（18 スイート） | **PASS（exit 0・fail 0）** |
| 3 split ビルド ＋ 境界検査（public / member / admin） | **PASS** |

### 3.2 デプロイ後 live

| 対象 | 結果 |
|---|---|
| 公開ポータル アクセシビリティ | **違反 0**（critical / serious / moderate / minor すべて 0） |
| 公開ポータル responsive（7 viewport） | **7/7 PASS** |
| 管理ポータル responsive | **未実施**（Google セッション失効。§5-1） |

## 4. 同時に入れた文書変更

仕様書を `docs/spec/` の 5 文書へ一本化し、重複する旧仕様書 6 本を `docs/archive/spec_history/` へ退避した。
詳細は `HANDOVER.md` の 2026-09-04 の項。**本番コードへの影響は §2 の 3 件のみ**。

## 5. 残作業

| # | 内容 |
|---|---|
| 1 | **管理ポータルの live 検証**（responsive 7 viewport ＋ データ出力画面のパンくず表示確認）。Google セッション再取得後に実施 |
| 2 | **`test:responsive:admin` が fatal でも exit 0 を返す**。アプリのフレームに到達できなくても「done.」で終わるため、ログを見ただけでは PASS と誤読する。**終了コードで落とすように直す** |
