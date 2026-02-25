# データモデル設計書

本システムで最も複雑かつ重要な「会員（Member）」のデータモデルについて解説する。
型定義の詳細は `src/types.ts` を参照。

## 1. Member オブジェクトの基本構造
すべての会員は `Member` インターフェースを満たす。

```typescript
interface Member {
  id: string; // 8桁の登録番号
  type: MemberType; // 'INDIVIDUAL' (個人) | 'BUSINESS' (事業所)
  status: 'ACTIVE' | 'WITHDRAWN';
  annualFeeHistory: AnnualFeeRecord[]; // 会費納入履歴
  // ... その他基本情報 (住所、連絡先など)
}
```

## 2. 個人会員と事業所会員の構造的差異

本システムの要件上、個人と事業所でデータの持ち方が大きく異なる。

### 個人会員 (`type === 'INDIVIDUAL'`)
- `lastName`, `firstName` は会員本人の氏名。
- 研修の受講履歴は、Memberオブジェクト直下の `participatedTrainingIds` に配列として保持される。
- 連絡先（メールアドレス等）もMemberオブジェクト直下に保持される。

### 事業所会員 (`type === 'BUSINESS'`)
- `lastName`, `firstName` は「事業所の代表者（または主たる連絡担当者）」の氏名。
- **最大の違い**: `staff` プロパティ（`Staff[]`）を持つ。
- 研修の受講履歴は、Member直下ではなく、**各 `Staff` オブジェクトの中の `participatedTrainingIds`** に保持される。
- ログインやシステム操作は「事業所」としてではなく、「事業所に所属する特定の職員（Staff）」として行う設計となっている。

## 3. Staff オブジェクト
事業所会員に紐づく職員のデータモデル。

```typescript
interface Staff {
  id: string;
  name: string;
  email: string; // 職員個別のメールアドレス
  role: 'ADMIN' | 'STAFF'; // 事業所内での権限（管理者は他の職員の情報を編集可能）
  participatedTrainingIds?: string[]; // この職員個人の研修受講履歴
}
```

## 4. 研修 (Training) オブジェクト
```typescript
interface Training {
  id: string;
  title: string;
  date: string;
  capacity: number;
  applicants: number;
  location: string;
  isOnline: boolean;
  status: 'OPEN' | 'CLOSED';
}
```
※ 申込データは中間テーブルを持たず、Member(またはStaff)側の `participatedTrainingIds` に Training の `id` を持たせることで関係性を表現している（NoSQL的なアプローチ）。
