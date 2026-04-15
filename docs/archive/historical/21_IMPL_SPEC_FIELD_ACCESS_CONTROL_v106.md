# 実装仕様書: フィールドレベルアクセス制御拡張（v106）

作成日: 2026-03-20
ステータス: **実装完了（ビルド通過・デプロイ前）**
前提: v105（`MEMBER_WRITABLE_FIELDS_` / `updateMemberSelf_` 実装済み）

---

## 0. 準拠規格・根拠

本仕様は以下の外部標準を根拠とする。

| 規格 | 適用箇所 | URL |
|------|----------|-----|
| OWASP Top 10 2021 A01 (Broken Access Control) | サーバーサイド allowlist によるフィールド制御 | https://owasp.org/Top10/A01_2021-Broken_Access_Control/ |
| OWASP Mass Assignment Cheat Sheet | allowlist パターン（denylist 非推奨） | https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html |
| CWE-915 (Mass Assignment) | ペイロードフィルタリングの必須化 | https://cwe.mitre.org/data/definitions/915.html |
| NIST RBAC (INCITS 359-2012) | ロール別パーミッションの設計 | https://csrc.nist.gov/projects/role-based-access-control |
| OWASP Authorization Cheat Sheet | サーバーサイド認可の原則 | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html |
| 個人情報保護法 第19条 | 退職者データの論理削除・保持 | https://www.ppc.go.jp/personalinfo/legal/ |
| 厚生労働省 医療・介護関係事業者ガイダンス | 介護分野の記録保持（最低2年、推奨5年） | https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000027272.html |

**本案件との整合**:
- サーバーサイド allowlist パターンは v105 で導入済み。本仕様はこれをロール別に拡張する。
- フロントエンドの `disabled` は UX 補助であり、**セキュリティ境界はバックエンドが担う**（OWASP 原則）。
- 退職者データは論理削除（`削除フラグ`）+ 非表示で対応。物理削除は保持期間経過後に別途検討。

---

## 1. 変更概要

v105 からの差分を一覧化する。

### 1.1 全会員種別共通

| 変更項目 | 現行（v105） | 変更後（v106） |
|----------|-------------|----------------|
| `careManagerNumber` | `MEMBER_WRITABLE_FIELDS_` に含まれる | **allowlist から除外**。マイページでは disabled |
| `joinedDate`（入会日） | disabled（`isAdminField`） | **表示のみ（編集不可）**。ラベル変更なし |
| `withdrawnDate`（退会日） | disabled（`isAdminField`） | **非表示**（フロントエンドで描画しない） |
| `midtermWithdrawal`（年度中退会） | `isAdmin` 時のみ表示 | **廃止**（フロントエンド・バックエンドから除去） |

### 1.2 事業所会員 — 事業所情報

| 変更項目 | 現行（v105） | 変更後（v106） |
|----------|-------------|----------------|
| `officeName`（事業所名） | 編集可（全ロール） | **表示のみ（編集不可）**。変更は問い合わせ窓口で受付 |
| `officeNumber`（事業所番号） | 編集可（全ロール） | **表示のみ（編集不可）**。同上 |

### 1.3 事業所会員 — 所属職員一覧

| 変更項目 | 現行（v105） | 変更後（v106） |
|----------|-------------|----------------|
| 職員 `role`（権限） | 代表者・管理者とも編集可 | **代表者のみ編集可**。ADMIN は表示のみ |
| 職員 `status`（退職操作） | `isAdminField` で disabled | **代表者・管理者が操作可**。退職にした日付をバックエンドで自動記録 |
| 職員 `joinedDate` | `isAdminField` で disabled | **「登録日」ラベルで表示のみ**。作成時にバックエンドで自動セット |
| 職員 `withdrawnDate` | `isAdminField` で disabled | **非表示**。退職操作時にバックエンドで自動記録 |
| 職員 `midYearWithdrawal` | `isAdmin` 時のみ表示 | **廃止** |
| 職員削除ボタン | 表示あり（代表者・管理者） | **廃止**。退職ステータスで運用 |
| 退職者の表示 | 常に表示 | **翌年度（4/1〜）から非表示**。データは保持 |
| 一般職員（STAFF）の編集 | 全フィールド `isReadOnly` | **自分の氏名・フリガナ・メールアドレスのみ編集可** |

### 1.4 研修申込（事業所会員）

| 変更項目 | 現行（v105） | 変更後（v106） |
|----------|-------------|----------------|
| 研修申込の表示 | 操作ユーザー切替で同一画面内 | **別画面で職員個人ごとに表示** |
| 閲覧範囲 | 操作ユーザーの分のみ | 代表者・管理者: **全員分**。一般: 自分のみ |
| 申込・取消操作 | 操作ユーザー切替で実行 | 代表者・管理者: 全員分。一般: **自分の分のみ** |

---

## 2. バックエンド実装仕様（`backend/Code.gs`）

### 2.1 allowlist 変更

```
// 変更前（v105）
var MEMBER_WRITABLE_FIELDS_ = [
  'lastName','firstName','lastKana','firstKana','careManagerNumber',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','mobilePhone',
  'officeName','officeNumber','officePostCode','officePrefecture',
  'officeCity','officeAddressLine','phone','fax',
  'email','mailingPreference','preferredMailDestination',
];

// 変更後（v106）
var MEMBER_WRITABLE_FIELDS_ = [
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','phone','fax',
  'email','mailingPreference','preferredMailDestination',
];
```

除外されたフィールド:
- `careManagerNumber` — ログインIDと紐づくため
- `officeName` — 問い合わせ窓口経由で変更
- `officeNumber` — 同上

### 2.2 ロール別 allowlist（新設）

NIST RBAC モデルに準拠し、ロール別の職員フィールド allowlist を定義する。

```
// 職員フィールド: 代表者・管理者用
var STAFF_WRITABLE_FIELDS_ADMIN_ = ['id','name','kana','email','status'];

// 職員フィールド: 代表者専用（上記に加えて権限変更可）
var STAFF_WRITABLE_FIELDS_REPRESENTATIVE_ = ['id','name','kana','email','status','role'];

// 職員フィールド: 一般職員用（自分の分のみ適用）
var STAFF_WRITABLE_FIELDS_SELF_ = ['id','name','kana','email'];
```

`updateMemberSelf_()` 内で、呼び出し元の `staffRole` に応じて適用する allowlist を切り替える。

### 2.3 退職日の自動記録

`updateMemberSelf_()` または `updateMember_()` 内で、職員の `status` が `ENROLLED` → `LEFT` に変更された場合:

1. `T_事業所職員.退会日` に現在日（`Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')`）を自動セット
2. フロントエンドからの `withdrawnDate` 送信は無視（allowlist に含めない）

### 2.4 登録日の自動記録

職員レコード新規作成時（`createMember_()` または職員追加処理）:

1. `T_事業所職員.入会日` に現在日を自動セット
2. フロントエンドからの `joinedDate` 送信は無視

### 2.5 退職者の年度フィルタ

`mapMembersForApi_()` で職員データを返却する際:

```
// 年度境界: 4月1日
var currentFiscalYearStart = getFiscalYearStart_(new Date());

staffRows = staffRows.filter(function(st) {
  if (String(st['職員状態コード'] || '') !== 'LEFT') return true;
  var withdrawnDate = normalizeDateInput_(st['退会日']);
  if (!withdrawnDate) return true;
  // 退職日が今年度の開始日より前なら非表示
  return new Date(withdrawnDate) >= currentFiscalYearStart;
});
```

`getFiscalYearStart_()` は当年4月1日を返すユーティリティ。1〜3月の場合は前年4月1日。

### 2.6 一般職員の自己編集制御

`updateMemberSelf_()` 内で、呼び出し元が STAFF ロールの場合:

1. `STAFF_WRITABLE_FIELDS_SELF_` で職員フィールドをフィルタ
2. **自分の職員ID以外の職員データ変更を拒否**（なりすまし防止）
3. 会員基本情報・事業所情報の変更は一切拒否（ペイロードから除去）

---

## 3. フロントエンド実装仕様（`src/components/MemberForm.tsx`）

### 3.1 全会員種別共通

| 対象 | 変更内容 |
|------|----------|
| `careManagerNumber` 入力 | 全ロールで `disabled` を追加（現行は `isReadOnly` のみ） |
| `joinedDate` 入力 | 全ロールで `disabled` を維持。ラベルはそのまま「入会日」 |
| `withdrawnDate` 入力 | **描画自体を削除**（`{false && ...}` ではなく JSX から除去） |
| `midtermWithdrawal` チェックボックス | **描画自体を削除** |
| `midYearWithdrawal`（職員） | **描画自体を削除** |

### 3.2 事業所会員 — 事業所情報

| 対象 | 変更内容 |
|------|----------|
| `officeName` 入力 | 事業所会員（`isBusiness`）の場合は `disabled` を追加 |
| `officeNumber` 入力 | 同上 |
| 注記 | disabled フィールドの下に「変更をご希望の場合はお問い合わせください」を表示 |

### 3.3 事業所会員 — 所属職員一覧

| 対象 | 変更内容 |
|------|----------|
| `role` セレクト | `activeStaffRole !== 'REPRESENTATIVE'` の場合は `disabled` |
| `status` セレクト | `isAdminField` 条件を削除し、代表者・管理者は編集可に変更 |
| `joinedDate` | ラベルを「登録日」に変更。全ロールで `disabled` |
| `withdrawnDate` | **描画自体を削除** |
| `midYearWithdrawal` | **描画自体を削除** |
| 削除ボタン（`TrashIcon`） | **描画自体を削除** |
| `removeStaff()` 関数 | 呼び出し箇所削除（関数定義は残してもよい） |

### 3.4 一般職員（STAFF）の自己編集

現行: `isReadOnly = true` で全フィールド disabled。

変更後:
- `isReadOnly` の判定は維持（画面全体の保存ボタン制御等に使用）
- 職員一覧内で、**自分の行（`staff.id === operatingStaffId`）** の `name` / `kana` / `email` のみ `disabled` を解除
- 自分の行以外は従来通り disabled
- 保存時は `updateMemberSelf_` に自分の職員データのみ送信

```tsx
// 例: 職員行ごとの制御
const isOwnStaff = staff.id === operatingStaffId;
const isStaffEditable = !isReadOnly || (currentStaff?.role === 'STAFF' && isOwnStaff);
```

### 3.5 研修申込 — 別画面化

現行: MemberForm 内に研修申込セクションが埋め込み。

変更後:
- 職員一覧の各職員名をクリック可能にする（リンク / ボタン）
- クリック時、**職員個人の研修申込画面**に遷移（新コンポーネント or モーダル）
- 画面には対象職員の研修一覧・申込・取消を表示
- 閲覧権限: 代表者・管理者 → 全員分、一般 → 自分のみ
- 操作権限: 代表者・管理者 → 全員分の申込・取消可、一般 → 自分のみ

---

## 4. DB スキーマへの影響

本仕様では **スキーマ変更なし**。既存の列を活用する。

| テーブル | 列 | 変更 |
|----------|------|------|
| `T_事業所職員.入会日` | 既存 | 新規作成時にバックエンドで自動セット（現行は手動可） |
| `T_事業所職員.退会日` | 既存 | 退職操作時にバックエンドで自動セット（現行は手動可） |
| `T_事業所職員.職員状態コード` | 既存 | 変更なし（ENROLLED / LEFT） |

---

## 5. セキュリティ設計原則

OWASP / NIST の要件を本システムにどう適用するかを明示する。

### 5.1 多層防御（Defense in Depth）

```
[ブラウザ] → disabled / 非表示（UX層・バイパス可能）
    ↓
[GAS API] → allowlist フィルタ（セキュリティ境界）
    ↓
[Spreadsheet] → 書き込み
```

- **フロントエンドのみの制御は無効**。DevTools でフィールドを有効化し、直接 API を叩くことで回避可能。
- サーバーサイドの allowlist が唯一のセキュリティ境界。

### 5.2 ロール別 allowlist の適用フロー

```
1. クライアントがペイロードを送信
2. updateMemberSelf_() が loginId → 会員ID を照合（なりすまし防止）
3. 会員フィールドを MEMBER_WRITABLE_FIELDS_ でフィルタ
4. 呼び出し元の staffRole を判定
5. 職員フィールドを staffRole に応じた allowlist でフィルタ
   - REPRESENTATIVE → STAFF_WRITABLE_FIELDS_REPRESENTATIVE_
   - ADMIN → STAFF_WRITABLE_FIELDS_ADMIN_
   - STAFF → STAFF_WRITABLE_FIELDS_SELF_（自分の職員IDのみ）
6. フィルタ後のペイロードを updateMember_() に委譲
```

### 5.3 拒否されたフィールドの扱い

OWASP 推奨に従い、**サイレントに除去**する（エラーは返さない）。
ただし、STAFF が他人の職員データを変更しようとした場合はエラーを返す。

---

## 6. 退職者データ保持方針

個人情報保護法第19条（努力義務）および厚生労働省ガイダンスに基づく。

| 段階 | 対応 | 根拠 |
|------|------|------|
| 退職操作時 | `職員状態コード=LEFT`、`退会日=操作日` を記録。認証アカウントは有効のまま（年度末まで利用可） | 本システムの年度末退会予約方式 |
| 今年度中（〜3/31） | 一覧に表示。ログイン・サービス利用可 | 会員扱い継続の業務要件 |
| 翌年度以降（4/1〜） | 一覧から非表示（データは保持） | 個人情報保護法19条・論理削除方式 |
| 5年経過後 | 物理削除を検討（別途バッチ処理） | 厚労省ガイダンス・介護分野の実務基準 |

---

## 7. テスト計画

### 7.1 バックエンド（API レベル）

| # | テストケース | 期待結果 |
|---|-------------|----------|
| B-01 | `updateMemberSelf` に `careManagerNumber` を含むペイロードを送信 | サイレントに除去され、DB に反映されない |
| B-02 | `updateMemberSelf` に `officeName` を含むペイロードを送信（事業所会員） | サイレントに除去 |
| B-03 | STAFF ロールで他人の職員 `name` を変更するペイロードを送信 | エラー返却 |
| B-04 | STAFF ロールで自分の `name`, `kana`, `email` を変更 | 正常に更新される |
| B-05 | ADMIN ロールで職員 `role` を変更するペイロードを送信 | サイレントに除去 |
| B-06 | REPRESENTATIVE ロールで職員 `role` を変更 | 正常に更新される |
| B-07 | 職員 `status` を `ENROLLED` → `LEFT` に変更 | `T_事業所職員.退会日` が自動セットされる |
| B-08 | 新規職員追加 | `T_事業所職員.入会日` が自動セットされる |
| B-09 | 翌年度の日付環境で退職済み職員を含むデータを取得 | 退職済み職員が応答に含まれない |

### 7.2 フロントエンド（UI レベル）

| # | テストケース | 期待結果 |
|---|-------------|----------|
| F-01 | 個人会員でマイページ表示 | 退会日が非表示、入会日が表示のみ、介護支援専門員番号が disabled |
| F-02 | 賛助会員でマイページ表示 | F-01 と同一（介護支援専門員番号は任意表記） |
| F-03 | 事業所代表者で事業所名フィールド確認 | disabled、「お問い合わせください」注記あり |
| F-04 | 事業所代表者で職員 `role` セレクト | 編集可（管理者/一般） |
| F-05 | 事業所管理者で職員 `role` セレクト | disabled |
| F-06 | 事業所一般職員で自分の氏名・フリガナ・メール | 編集可 |
| F-07 | 事業所一般職員で他人の行 | 全フィールド disabled |
| F-08 | 職員一覧に削除ボタンが表示されない | 全ロールで確認 |
| F-09 | 退会日・年度中退会が表示されない | 全会員種別で確認 |
| F-10 | 職員名クリックで研修申込別画面に遷移 | 対象職員の研修一覧が表示される |

---

## 8. 変更対象ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `backend/Code.gs` | allowlist 変更、ロール別 allowlist 新設、退職日自動記録、登録日自動記録、年度フィルタ |
| `src/components/MemberForm.tsx` | フィールド disabled 制御、描画削除、STAFF 自己編集、事業所名/番号 disabled |
| `src/components/StaffTrainingView.tsx` | **新規作成**: 職員個人の研修申込別画面 |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 本仕様の確定内容を反映（賛助会員セクション確定含む） |
| `docs/02_ARCHITECTURE.md` | 新規 API アクション追記（必要に応じて） |
| `HANDOVER.md` | v106 リリースノート追記 |

---

## 9. 実装しないこと（スコープ外）

| 項目 | 理由 |
|------|------|
| 事業所名・事業所番号の問い合わせ窓口 UI | 方法は別途検討。v106 では disabled + 注記のみ |
| 退職者の物理削除バッチ | 5年後の要件。v106 では非表示のみ |
| 賛助会員の仕様確定 | 比較表をもとに別途決定予定。v106 では個人会員と同一動作を維持 |
| `midtermWithdrawal` のバックエンド完全除去 | フロントエンド非表示のみ。バックエンドの列・ロジックは互換性のため残置可 |
