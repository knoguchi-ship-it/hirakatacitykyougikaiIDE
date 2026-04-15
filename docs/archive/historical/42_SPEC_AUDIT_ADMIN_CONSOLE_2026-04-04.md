# 仕様監査レポート: 管理コンソール表示異常と仕様乖離

作成日: 2026-04-04
対象バージョン: v170
ステータス: `対応済み・記録用`

---

## 0. 概要

ユーザー報告:
- 管理コンソールで引っ張ってくるデータが非常に少ない
- スプレッドシート上はデータがある
- 管理権限に紐づく会員 ID がおかしい
- 「以前の仕様が勝手に変更されている」

本監査では、コード・DB・ドキュメントを横断調査し、以下 5 件の問題を確認した。

---

## 1. [CRITICAL-1] seedDemoData が本番 DB を上書きした

### 発生状況

前セッション（2026-04-03）の Playwright UI テスト準備で `npx clasp run seedDemoData` を実行した。
この関数は以下のテーブルを **全削除してデモデータで置き換える**。

```
T_会員
T_事業所職員
T_認証アカウント
T_ログイン履歴
T_管理者Googleホワイトリスト   ← ここが問題
T_研修
T_研修申込
T_年会費納入履歴
```

### 影響

| テーブル | 変更前 | 変更後 |
|---------|--------|--------|
| T_会員 | 本番会員データ（複数） | デモ 3 件（12345678, 87654321, 99999999） |
| T_管理者Googleホワイトリスト | 本番ホワイトリスト | WL-001: k.noguchi → 紐付け会員ID=`99999999` |
| T_事業所職員 | 本番職員データ | S1(代表)/S2(管理者)/S3(一般) のデモ 3 件 |

「管理権限に紐づく会員 ID がおかしい」の直接原因。

### ドキュメント上の問題

`seedDemoData` がどのテーブルを削除するか記載したドキュメントが **存在しない**。
`docs/04_DB_OPERATION_RUNBOOK.md` にも警告なし。

### 対応結果

1. 同日中にユーザーが DB 復旧作業をロールバックし、現時点の本番 DB は整合済み状態へ戻した。
2. 以後の本番 DB 基準は、2026-04-04 ロールバック後の状態とする。
3. `docs/04_DB_OPERATION_RUNBOOK.md` に `seedDemoData` の破壊的スコープと事前バックアップ必須を追記した。
4. コード側の追加防護は別タスク候補として残す。

---

## 2. [CRITICAL-2] seedDemoData の破壊的スコープが未定義・未文書

### 問題

`backend/Code.gs` の `seedDemoData()` 関数（約 1207 行目）は本番運用 DB に直接接続して 8 テーブルを全削除する破壊的操作だが、以下の箇所にその旨が記載されていない。

- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `HANDOVER.md`
- 関数コード内のコメント

また、権限チェックにより `seedDemoData` は `MASTER` 権限を持つ管理者のみ実行可能（Code.gs 行 709）だが、これがデモ・テスト専用であることも明示されていない。

### 対応結果

`docs/04_DB_OPERATION_RUNBOOK.md` に危険操作セクションを追加し、`seedDemoData()` が本番固定 DB を破壊する操作であることを明記した。

```
## 危険操作リスト

### seedDemoData
- 対象: 本番 DB（DB_SPREADSHEET_ID_FIXED）
- 動作: 8 テーブルを全削除してデモデータに置き換える（ロールバック不可）
- 用途: 開発・テスト時のみ（本番環境での実行禁止）
- 保護: 実行前に必ずスプレッドシートの版歴をバックアップすること
```

---

## 3. [SPEC CHANGE-1] 管理コンソールの会計年度フィルタ初期値が無断変更

### 変更内容

コミット `2c3a223`（2026-03-30）で `src/App.tsx` の変更：

```diff
- const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>('ALL');
+ const [memberListFiscalYearFilter, setMemberListFiscalYearFilter] = useState<string>(DEFAULT_MEMBER_FISCAL_YEAR_FILTER);
```

`DEFAULT_MEMBER_FISCAL_YEAR_FILTER = String(getFiscalYearForDate(new Date()))` → 本日は 2026-04-04 なので `'2026'`。

### フィルタロジック（src/App.tsx 行 476-486）

```ts
if (memberListFiscalYearFilter !== 'ALL') {
  const fy = Number(memberListFiscalYearFilter);
  const fyStart = new Date(fy, 3, 1);      // 4月1日
  const fyEnd = new Date(fy + 1, 2, 31);   // 翌3月31日
  const joined = member.joinedDate ? new Date(member.joinedDate) : null;
  if (!joined || isNaN(joined.getTime()) || joined > fyEnd) return false;
  // 退会済みで退会日が年度開始前なら除外
  if (member.status === 'WITHDRAWN' && member.withdrawnDate) {
    const wd = new Date(member.withdrawnDate);
    if (!isNaN(wd.getTime()) && wd < fyStart) return false;
  }
}
```

フィルタの意味: **「指定年度終了日より前に入会した、かつ指定年度開始前に退会していない会員」を表示**。
すなわち FY2026（2026-04-01〜2027-03-31）なら「2027-03-31 以前に入会した全員（ただし 2026-04-01 前に退会済みは除外）」。

→ 2024 年入会メンバーも含まれる。データ隠れの原因ではないが、**ダッシュボード数値の計算方法が変わった**（下記）。

### ダッシュボード数値の変化

コミット前: `renderAdminPage` はバックエンドの `adminDashboardData` の数値をそのまま表示（全アクティブ会員ベース）。
コミット後: `filteredDashboardMetrics`（フロントエンド計算）を使用。フィルタ結果に連動する。

| 状況 | 変更前の表示 | 変更後の表示 |
|------|------------|------------|
| フィルタなし（初期状態） | バックエンド集計値（全アクティブ） | FY2026 フィルタ適用後の件数 |
| ステータスフィルタ = ACTIVE | バックエンド集計値 | フロントフィルタ適用後 |

### ドキュメント上の問題

- `docs/02_ARCHITECTURE.md` の管理コンソール構成に会計年度フィルタの仕様が**未記載**
- `docs/01_PRD.md` にも未記載
- この変更が仕様として意図されたものか、バグかが判断できない状態

### 確認結果

ユーザー確認後、既定値は `ALL`、年度指定時は「当該年度時点の在籍状態」で判定する仕様に確定した。
- `src/App.tsx` を修正済み
- `docs/02_ARCHITECTURE.md` に仕様反映済み

---

## 4. [SPEC CHANGE-2] GLOBAL_GROUND_RULES のプロジェクトルールが v166 のまま

### 問題

`GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` の「Current Operating Assumptions」が：

```
Production is `v166` and both fixed deployments are at `@166`.
```

監査実施時点の本番は `v168` / `@168` だった。

### 対応結果

`05_PROJECT_RULES_HIRAKATA.md` の Operating Assumptions を `v170 / @170` に更新した。

---

## 5. [UNDEFINED] 管理コンソール会計年度フィルタ動作が仕様書に未定義

### 問題

`src/App.tsx` に会計年度フィルタ UI が存在するが、以下の仕様が未記載：

| 項目 | 仕様書 | 現状 |
|------|--------|------|
| デフォルト表示年度 | 未定義 | コードで "現在年度" に固定 |
| フィルタの意味（入会年度 vs 在籍年度） | 未定義 | 「退会前かつ入会日が指定年度以前」 |
| ダッシュボード数値とフィルタの連動 | 未定義 | フロントエンド再計算で連動 |
| 「全件表示」に戻す手段 | 未定義 | ドロップダウンで 'ALL' を選択 |

### 対応結果

`docs/02_ARCHITECTURE.md` §2.1 に会計年度フィルタの仕様を追記済み。

---

## 6. 対応優先度

| 状態 | 番号 | 結果 | 担当 |
|------|------|------|------|
| 完了 | CRITICAL-1 | ユーザーが DB ロールバックを実施し、本番 DB を整合済み状態に復元 | ユーザー |
| 完了 | SPEC CHANGE-2 | `05_PROJECT_RULES_HIRAKATA.md` を `v170 / @170` に更新 | ClaudeCode |
| 完了 | SPEC CHANGE-1 | FY フィルタ既定値を `ALL` とし、年度時点判定へ修正 | ClaudeCode |
| 完了 | CRITICAL-2 | `docs/04_DB_OPERATION_RUNBOOK.md` に seedDemoData 警告追記 | ClaudeCode |
| 完了 | UNDEFINED | `docs/02_ARCHITECTURE.md` に FY フィルタ仕様追記 | ClaudeCode |

---

## 7. クローズ時点の結論

- DB 影響はユーザーによるロールバックで解消済み。
- FY フィルタ仕様は `ALL` 既定、年度指定時は在籍時点判定で確定。
- ダッシュボード `ALL` 時のヘッダーは `全期間` 表示で確定。
- 本文書は監査記録として残し、現在の運用前提は `HANDOVER.md` と関連正本を参照する。

---

## 8. 参照ファイル

| ファイル | 関連箇所 |
|---------|---------|
| `backend/Code.gs` | `seedDemoData()` 行 1207、`clearTableData_` 呼び出し 行 1212-1221 |
| `backend/Code.gs` | `getAdminDashboardData_()` 行 2821 — 全会員を返す（フィルタなし） |
| `src/App.tsx` | `memberListFiscalYearFilter` 行 123、`filteredAdminMemberRows` 行 471-494 |
| `src/App.tsx` | `filteredDashboardMetrics` 行 519+、`renderAdminPage` 行 1587 |
| `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` | Current Operating Assumptions（監査時点では v166 と記載） |
