# 単一情報源（DRY）棚卸し監査 — 2026-09-03

> operator 指示: 「開発開始当初、DRY 原則などのコーディング原則を盛り込まずに進めたため、
> 同様の重複処理や、同様の処理でも別ルートを通る可能性がある。根本から是正すること。
> 見たふりは厳禁、ゼロベースで評価・確認」

本書は**実測に基づく棚卸し**である。各項目に「どう測ったか」を残す。

---

## 0. 監査の方法

| 観点 | 測り方 |
|---|---|
| メール送信の出口 | `MailApp\.|GmailApp\.` の grep（直接送信の有無）と `deliverMail_(` の呼び出し数 |
| 差し込み描画 | `render.*Template|merge` に一致する関数の列挙と呼び出し元の追跡 |
| テンプレートと送信カテゴリの対応 | `renderConfiguredMail_(… '<CAT>_SUBJECT')` の各行から前方 60 行の `deliverMail_('X'` を突合 |
| 検証パターン | `src/**` 全 ts/tsx/mjs を走査し regex リテラル定義を列挙、共有モジュールと比較 |
| 会員種別ラベル | `'個人会員'` の出現をファイル単位で列挙（front / gas-src 双方） |
| UI が案内するタグ | `MergeTags items={[`（直書き）と `MAIL_TEMPLATE_MERGE_TAGS`（カタログ）の使用数 |

---

## 1. 是正した項目（本リリース v376.67）

### 1-1. 会員種別ラベルが 16 箇所で個別に決まっていた 🔴

- **実測**: front 9 ファイル（`'個人会員'` を含む）＋ gas-src 7 箇所（三項演算子・独自マップ）。
  しかも DB の正本 `M_会員種別.名称` を**どこも見ていなかった**（マスタで名称を変えても画面は変わらない）。
- **実害**: `BulkMailSender` だけ短縮ラベル（`個人` / `事業所` / `賛助`）を持ち、同一ファイル内でも
  「個人会員」と「個人」が混在していた。
- **是正**: `src/shared/memberTypes.mjs` を新設（`MEMBER_TYPE_LABELS` / `memberTypeLabel()` /
  `MEMBER_TYPE_ANNUAL_FEE_DEFAULTS` / `formatAnnualFee()`）。フロントは import、GAS は
  **build 時に注入**（`memberFiscalStatus.mjs` と同方式・マーカー `__MEMBER_TYPES_BUILD_INJECT_*`）。
  GAS 側は `memberTypeLabel_(code, overrides)` の `overrides` にマスタ名称を渡せば**マスタが優先**される。

### 1-2. 入力検証が画面ごとに別実装で、実挙動が食い違っていた 🔴

- **実測**: `src/shared/validators.ts` が既にあるのに 3 画面が自前定義していた。
- **食い違いの実害**:

| 項目 | 公開申込 | 管理 2 画面 | 共有（未使用だった） |
|---|---|---|---|
| 郵便番号 | `^\d{3}-\d{4}$`（ハイフン必須） | `^\d{3}-?\d{4}$`（任意） | — |
| 電話 | `^[0-9-]+$`（桁数無制限・`+` 不可） | 同左 | `^[0-9+\-() ー−]{6,}$` |

  → **同じ「郵便番号」なのに公開だけ `5730000` を弾く**。電話は共有パターンが誰にも使われず死んでいた。
- **是正**: 共有へ集約し、`POSTAL_CODE_PATTERN`（ハイフン任意）＋`normalizePostalCode()`（`123-4567` へ正規化）、
  `KATAKANA_PATTERN` / `OFFICE_NO_PATTERN` / `CARE_MANAGER_NO_RELAXED_PATTERN` を追加。3 画面は import に変更。

### 1-3. メール差し込みタグのカタログが二重管理だった 🔴

- **実測**: 共有カタログ `src/shared/mailTemplates.ts` があるのに、`App.tsx` が Tier1 の 4 カテゴリを
  **インラインで別途列挙**（`<MergeTags items={[…]}>`）。
- **実害**: v376.66 で事業所メールにタグを追加した際、**インライン側だけが更新されカタログと食い違った**
  （＝是正作業そのものが二重管理に足を取られた）。
- **是正**: インライン 4 箇所をカタログ参照へ。複数カードで凡例を共有する箇所は `mergeTagUnion()` で結合。
  カタログ側の `BIZ_REP` / `BIZ_STAFF` にも `{{会員種別}}` `{{年会費}}` を追加して実装と一致させた。

### 1-4. 研修リマインダーが誤ったカテゴリで送信されていた 🔴（新規発見・実害）

- **実測**: `renderConfiguredMail_(… 'TRAINING_REMINDER_SUBJECT' …)` で描画しながら
  `deliverMail_('BULK_MAIL', …)` で送っていた（gas-src 2661 → 2696）。
- **実害**: `deliverMail_` はカテゴリ別 ON/OFF を `<CATEGORY>_ENABLED` で判定するため、
  1. 設定「**研修リマインダーメール**」の有効/無効トグルが**まったく効いていなかった**（死んだ設定）
  2. 「**一括メール送信**」を無効にすると**研修リマインダーまで止まる**
  3. 送信ログのカテゴリが誤記録され、集計・監査が不正確
- **是正**: `deliverMail_('TRAINING_REMINDER', …)` へ修正。同型を検出するゲートを追加（§2-6）。

### 1-5. 汎用レンダラが「事業所専用」の名前だった 🟡

- `renderBizEmailTemplate_` は実際には事業所メール・研修メール・研修リマインダーが共用する汎用実装。
  名前が用途を限定して見えるため、**別機能が独自の置換を書く誘因**になっていた（v376.66 の遠因）。
- **是正**: `renderMergeTags_` へ改名し、「メール本文の差し込みは必ずこの関数を通す」とコメントで明記。

### 1-6. テストが本体のミラー実装を持っていた 🟡

- `scripts/test-mail-template-render.mts` が「gas-src と同一ロジック」を**再実装**していた。
  本体を直してもテストが古い挙動を守り続ける危険がある（テスト自体が二重管理）。
- **是正**: 実ソースから関数を抽出して評価する方式へ変更。**ミラーを外しても 5/5 PASS**＝等価だったことも確認。

### 1-7. 年会費の既定値が 5 箇所にあった 🟡

- front 3（`App.tsx` / `public-portal/App.tsx` / `MemberApplicationForm.tsx`）＋ GAS 2。
  うち 3 箇所は v376.64 で**私が追加した**もの。共有モジュールへ一本化した。

---

## 2. 新設したゲート（`npm run test:single-source`・prerelease 連鎖）

| # | 検査内容 |
|---|---|
| 1 | 検証パターン（メール/郵便番号/電話/介護支援専門員番号）を `shared/validators.ts` の外で定義していない |
| 2 | 会員種別ラベルを `shared/memberTypes.mjs` の外でマップ定義・三項分岐していない |
| 3 | 年会費の既定値を共有モジュールの外に書いていない |
| 4 | UI がマージタグを直書きしていない（カタログ参照のみ） |
| 5 | カタログのカテゴリ一覧が GAS の `MAIL_TEMPLATE_CATEGORIES_` と一致する |
| 6 | メール送信が `deliverMail_ → sendEmailWithValidatedFrom_` の一本道である（キルスイッチと未解決タグ除去を迂回する経路が増えていない） |
| 7 | GAS 側も注入された `memberTypeLabel_` / `formatAnnualFee_` を使っている |
| 8 | `<CAT>_SUBJECT/BODY` を描画したメールは同じ `<CAT>` で送信している（§1-4 の再発防止） |

---

## 3. 「問題なし」と確認できた項目（見たふりをしないための記録）

| 項目 | 実測結果 |
|---|---|
| メール送信の出口 | `MailApp.sendEmail` / `GmailApp.sendEmail` は `sendEmailWithValidatedFrom_` の中の 2 箇所のみ。同関数の呼び出し元は `deliverMail_` だけ。**全 16 カテゴリが単一の出口を通る** |
| 一括メール（管理） | `氏名` / `事業所名` / `会員番号` を差し込み済み（gas-src 23785）。UI の案内と一致 |
| 研修メール送信 | `氏名` / `事業所名` を差し込み済み（gas-src 18277）。仕様書 `docs/06` §3.2 の記載とも一致 |
| 在籍中（会計年度）判定 | `src/shared/memberFiscalStatus.mjs` に集約済み（v376.46）。front は import、GAS は build 注入。**あるべき姿の先行事例** |
| RBAC の action→menu | `scripts/menu-registry.mjs` に集約済み。build 注入＋等価性テストあり |
| 年会費金額の正本 | `M_会員種別.年会費金額` の 1 列。公開・管理とも `readMemberTypeAnnualFees_` 経由（v376.64） |

---

## 4. 未着手（operator 判断が要るもの）

| # | 内容 | なぜ判断が要るか |
|---|---|---|
| 1 | **研修メール送信（`sendTrainingMail_`）のカテゴリ** | 現在 `TRAINING_REMINDER`。§1-4 の修正で自動リマインダーと同じトグルに乗る。分けるなら新カテゴリ（設定キー＋UI トグル）の追加が必要＝運用が 1 つ増える |
| 2 | **日付整形の共通化** | `Utilities.formatDate` が 48 箇所。`formatTrainingDate_` / `formatDateForApi_` / `formatTimeOnly_` の 3 関数はあるが全箇所が通っていない。表示ゆれは実害として報告されていないため、影響範囲が広い割に効果が読みにくい |
| 3 | **`getRowsAsObjects_` からの行→オブジェクト変換** | テーブルごとに個別実装。共通化すると型の緩さが増す恐れがあり、設計判断が必要 |

---

## 5. GCP 移植メモ（`AGENTS.md` §4.8）

- 本リリースの是正はすべて**共有モジュール化とゲート追加**であり、GAS 固有機能に依存しない。
- `src/shared/*` は GCP でも **Cloud Run サービスと Firebase Hosting の双方から import する共通パッケージ**として
  そのまま移せる（現在の「build 時に GAS へ注入」が「npm ワークスペース参照」へ変わるだけ）。
- **むしろ移行を楽にする方向の変更**である: 会員種別ラベル・年会費・検証パターン・メールタグが 1 箇所に集まったため、
  Firestore 移行時に読み替える箇所が減る。
- NG パターン非該当。
