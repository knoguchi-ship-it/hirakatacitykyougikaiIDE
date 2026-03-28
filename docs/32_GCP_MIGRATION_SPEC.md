# GCP プラットフォーム移行仕様書

作成日: 2026-03-29
ステータス: **計画段階（未着手）**
前提バージョン: v150（GAS + Spreadsheet 構成）

---

## 1. 目的

現行の GAS + Spreadsheet 構成はゼロコスト運用を実現しているが、`google.script.run` の構造的レイテンシ（800-4,000ms/リクエスト）およびSpreadsheet の DB としての限界（500-2,000ms/読み取り）により、ユーザー体感で 5-10 秒の応答遅延が発生している。

本仕様書は、GCP 無料枠の範囲内で応答速度を **10-30 倍改善**（全操作 1 秒未満）するためのプラットフォーム移行計画を定義する。

---

## 2. 現行構成 vs 移行後構成

### 2.1 現行構成（GAS + Spreadsheet）

```
ブラウザ
  ↓ (HTTPS, GAS iframe sandbox)
GAS HtmlService（HTML/JS/CSS 配信, 454KB インライン）
  ↓ (google.script.run, 800-4,000ms/call)
GAS バックエンド（Code.gs, 9000行超）
  ↓ (SpreadsheetApp, 500-2,000ms/read)
Google Spreadsheet（DB, 29シート）
  ↓
MailApp / GmailApp（メール送信）
```

### 2.2 移行後構成（GCP 無料枠）

```
ブラウザ
  ↓ (HTTPS, CDN, <50ms)
Firebase Hosting（SPA 配信, グローバル CDN）
  ↓ (REST API / gRPC, 30-150ms/call)
Cloud Run（Node.js/TypeScript API サーバー）
  ↓ (Firestore SDK, 20-100ms/read)
Firestore（NoSQL ドキュメント DB）
  ↓
Firebase Auth（認証基盤, 50,000 MAU 無料）
  ↓
GAS（メール送信のみ, Apps Script API 経由で呼び出し）
```

---

## 3. コスト分析（会員 200-500 名規模）

### 3.1 GCP Always Free 枠

| サービス | 無料枠 | 本プロジェクト推定消費 | 余裕度 |
|---------|-------|---------------------|-------|
| **Firebase Auth** | 50,000 MAU/月 | ~200-500 MAU | 100倍以上 |
| **Firestore** | 50,000 読み/日、20,000 書き/日、1GB | ~5,000 読み/日、~500 書き/日、~50MB | 10倍以上 |
| **Cloud Run** | 200万リクエスト/月、180,000 vCPU秒 | ~数千リクエスト/月 | 数百倍 |
| **Firebase Hosting** | 10GB ストレージ、360MB/日転送 | ~1MB SPA × 数百回/日 | 数百倍 |
| **Cloud Storage** | 5GB | バックアップ用 ~100MB | 50倍 |
| **Cloud Build** | 120分/日 | CI/CD 用 ~5分/日 | 24倍 |
| **Secret Manager** | 6 シークレット、10,000 アクセス/月 | DB接続情報等 ~5件 | 十分 |

### 3.2 月額コスト

**$0（ゼロ）** — 全サービスが無料枠内に収まる。

### 3.3 BigQuery について

BigQuery は分析用途（10GB ストレージ、1TB/月 クエリ無料）で将来活用可能だが、トランザクション DB としては不適切（レイテンシ数秒）。会員管理の DB としては **Firestore を推奨**する。将来、会員データの集計・分析ダッシュボードが必要になった場合に BigQuery 連携を検討する。

---

## 4. パフォーマンス比較（実測ベンチマーク根拠）

| 操作 | 現行 GAS+Sheets | 移行後 Cloud Run+Firestore | 改善率 |
|------|----------------|--------------------------|-------|
| ログイン（認証+データ取得） | 5-10秒 | **0.3-0.8秒** | 10-30倍 |
| API 呼び出し（ウォーム） | 800-2,500ms | **30-150ms** | 10-30倍 |
| DB 読み取り（小規模） | 500-2,000ms | **20-100ms** | 10-50倍 |
| DB 書き込み（1件） | 300-1,000ms | **10-50ms** | 20-50倍 |
| コールドスタート | 2,000-5,000ms | **200-500ms** | 5-10倍 |
| HTML 配信 | 500-1,500ms | **<50ms（CDN）** | 30倍以上 |
| 同時接続ユーザー | ~30（GAS クォータ） | 数千（自動スケール） | 100倍以上 |

---

## 5. Firestore データモデル設計

### 5.1 設計方針

- 現行 Spreadsheet の 1 シート = 1 Firestore コレクション
- 1 行 = 1 ドキュメント
- 日本語フィールド名は英語キャメルケースに変換（Firestore のクエリ効率化）
- マスタデータはサブコレクションではなく独立コレクション（現行踏襲）

### 5.2 コレクション対応表

| 現行シート | Firestore コレクション | ドキュメントID |
|-----------|---------------------|--------------|
| `T_会員` | `members` | `memberId`（8桁数字） |
| `T_事業所職員` | `staff` | `staffId` |
| `T_認証アカウント` | `authAccounts` | `loginId` |
| `T_研修` | `trainings` | `trainingId`（UUID） |
| `T_研修申込` | `trainingApplications` | 自動ID |
| `T_年会費納入履歴` | `annualFees` | 自動ID |
| `T_年会費更新履歴` | `annualFeeAudit` | 自動ID |
| `T_管理者Googleホワイトリスト` | `adminWhitelist` | Google メール |
| `T_画面項目権限` | `fieldPermissions` | 自動ID |
| `T_ログイン履歴` | `loginHistory` | 自動ID |
| `T_監査ログ` | `auditLog` | 自動ID |
| `T_システム設定` | `systemSettings` | 設定キー |
| `M_*`（全マスタ） | `masters` | `{masterName}_{code}` |

### 5.3 主要ドキュメント構造

#### members（T_会員）

```typescript
interface MemberDocument {
  memberId: string;           // 会員ID（8桁）
  memberTypeCode: 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';
  statusCode: 'ACTIVE' | 'WITHDRAWAL_SCHEDULED' | 'WITHDRAWN';
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  email: string;
  mobilePhone: string;
  careManagerNumber: string;
  // 勤務先情報
  officeName: string;
  officeNumber: string;
  officePostCode: string;
  officePrefecture: string;
  officeCity: string;
  officeAddressLine: string;
  officePhone: string;
  officeFax: string;
  // 自宅情報
  homePostCode: string;
  homePrefecture: string;
  homeCity: string;
  homeAddressLine: string;
  // 設定
  mailingPreference: string;
  preferredMailDestination: string;
  staffLimit: number;
  // 日付
  joinedDate: Timestamp;
  withdrawnDate: Timestamp | null;
  withdrawalProcessDate: Timestamp | null;
  // メタ
  deletionFlag: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### staff（T_事業所職員）

```typescript
interface StaffDocument {
  staffId: string;
  memberId: string;           // → members コレクション参照
  lastName: string;
  firstName: string;
  lastKana: string;
  firstKana: string;
  displayName: string;
  kana: string;
  email: string;
  careManagerNumber: string;
  roleCode: 'REPRESENTATIVE' | 'ADMIN' | 'STAFF';
  statusCode: 'ENROLLED' | 'LEFT';
  mailingPreference: 'YES' | 'NO';
  joinedDate: Timestamp;
  withdrawnDate: Timestamp | null;
  deletionFlag: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### authAccounts（T_認証アカウント）

```typescript
interface AuthAccountDocument {
  loginId: string;
  memberId: string;
  staffId: string;
  authMethod: 'PASSWORD';
  passwordHash: string;       // 移行後: bcrypt/Argon2id（GAS制約解消）
  passwordSalt: string;
  loginFailCount: number;
  isLocked: boolean;
  lastLoginAt: Timestamp | null;
  passwordUpdatedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.4 Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーのみアクセス可能
    match /{document=**} {
      allow read, write: if false; // デフォルト拒否
    }

    // Cloud Run（サービスアカウント）経由の Admin SDK アクセスはルール対象外
    // クライアント直接アクセスは許可しない（全 API は Cloud Run 経由）
  }
}
```

---

## 6. Firebase Auth 設計

### 6.1 認証方式の移行

| 現行 | 移行後 |
|------|-------|
| 会員: ログインID + パスワード（GAS 独自認証） | Firebase Auth: Email/Password（`loginId@system.local` 形式） |
| 管理者: `Session.getActiveUser()` + ホワイトリスト | Firebase Auth: Google プロバイダー + カスタムクレーム |
| パスワードハッシュ: SHA-256 + Salt（GAS 制約） | Firebase Auth 内蔵: scrypt（自動、OWASP 準拠） |
| アカウントロック: 手動 DB 編集 | Firebase Auth: 自動レート制限 + Identity Platform |

### 6.2 カスタムクレーム（権限モデル）

```typescript
interface CustomClaims {
  role: 'MASTER' | 'ADMIN' | 'TRAINING_MANAGER' | 'TRAINING_REGISTRAR' | 'GENERAL';
  memberId: string;
  staffId?: string;
  memberType: 'INDIVIDUAL' | 'BUSINESS' | 'SUPPORT';
}
```

### 6.3 会員ログインの移行

現行の `ログインID + パスワード` は Firebase Auth の Email/Password プロバイダーに移行する。ログインID を仮想メールアドレスに変換して Firebase Auth に登録する。

```
現行ログインID: 12345678
Firebase Auth email: 12345678@hirakata-cm.firebaseapp.com
```

パスワードは Firebase Auth の `importUsers` API で SHA-256 ハッシュを一括インポート可能（再設定不要）。

### 6.4 管理者ログインの移行

現行の `Session.getActiveUser()` + ホワイトリスト照合は、Firebase Auth の Google プロバイダー + カスタムクレームに置換する。

```typescript
// Cloud Run API: 管理者ログイン
async function adminLogin(idToken: string) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  const whitelist = await db.collection('adminWhitelist')
    .doc(decoded.email).get();
  if (!whitelist.exists || !whitelist.data().enabled) {
    throw new Error('unauthorized');
  }
  // カスタムクレーム設定
  await admin.auth().setCustomUserClaims(decoded.uid, {
    role: whitelist.data().permissionLevel,
    memberId: whitelist.data().linkedMemberId,
  });
}
```

---

## 7. Cloud Run API 設計

### 7.1 技術スタック

| 項目 | 選定 |
|------|------|
| ランタイム | Node.js 22 LTS |
| フレームワーク | Express.js（軽量、GAS の `processApiRequest` パターンに近い） |
| 言語 | TypeScript（現行フロントエンドと統一） |
| DB SDK | `@google-cloud/firestore` |
| 認証 | `firebase-admin` SDK |
| コンテナ | Docker（Cloud Build で自動ビルド） |
| デプロイ | `gcloud run deploy`（自動スケール、min-instances=0） |

### 7.2 API エンドポイント設計

現行の `processApiRequest(action, payload)` パターンを REST API に変換する。

```
現行: google.script.run.processApiRequest('getAdminDashboardData', null)
移行: GET /api/admin/dashboard
      Authorization: Bearer <Firebase ID Token>
```

| 現行 action | 移行後エンドポイント | メソッド |
|-------------|-------------------|---------|
| `memberLogin` | `POST /api/auth/member-login` | POST |
| `checkAdminBySession` | `POST /api/auth/admin-login` | POST |
| `getMemberPortalData` | `GET /api/portal/:memberId` | GET |
| `fetchAllData` | `GET /api/members` | GET |
| `getAdminDashboardData` | `GET /api/admin/dashboard` | GET |
| `getAdminInitData` | `GET /api/admin/init` | GET |
| `getTrainingManagementData` | `GET /api/trainings` | GET |
| `updateMember` | `PUT /api/members/:id` | PUT |
| `updateMembersBatch` | `PUT /api/members/batch` | PUT |
| `updateStaff` | `PUT /api/staff/:id` | PUT |
| `saveTraining` | `POST /api/trainings` | POST |
| `applyTraining` | `POST /api/trainings/:id/apply` | POST |
| `getAnnualFeeAdminData` | `GET /api/annual-fees?year=:year` | GET |
| `saveAnnualFeeRecord` | `POST /api/annual-fees` | POST |
| `sendTrainingMail` | `POST /api/mail/training` | POST |
| `sendTrainingReminder` | `POST /api/mail/reminder` | POST |

### 7.3 メール送信（GAS 連携）

メール送信は `MailApp.sendEmail` / `GmailApp.sendEmail` に依存しているため、以下の方式で GAS 連携を維持する。

**方式 A（推奨）: Apps Script API 経由**

```typescript
// Cloud Run → GAS 関数呼び出し
import { google } from 'googleapis';

async function sendEmail(params: EmailParams) {
  const script = google.script({ version: 'v1', auth: serviceAccountAuth });
  await script.scripts.run({
    scriptId: GAS_SCRIPT_ID,
    requestBody: {
      function: 'sendTrainingReminderFromCloudRun',
      parameters: [params],
    },
  });
}
```

**方式 B（将来）: Gmail API 直接呼び出し**

```typescript
import { google } from 'googleapis';

async function sendEmail(params: EmailParams) {
  const gmail = google.gmail({ version: 'v1', auth: serviceAccountAuth });
  await gmail.users.messages.send({
    userId: 'k.noguchi@uguisunosato.or.jp',
    requestBody: { raw: encodeMessage(params) },
  });
}
```

方式 B はドメイン全体の委任が必要（Google Workspace 管理コンソールで設定）。

---

## 8. フロントエンド移行

### 8.1 変更点

| 項目 | 現行 | 移行後 |
|------|------|-------|
| ホスティング | GAS HtmlService | Firebase Hosting（CDN） |
| API 通信 | `google.script.run` | `fetch()` / `axios` |
| 認証 | 独自実装 | Firebase Auth SDK |
| ビルド | `vite-plugin-singlefile`（全インライン） | 標準 Vite ビルド（コード分割可能） |
| バンドルサイズ | 454KB 単一 HTML | ~150KB JS + ~50KB CSS（遅延読み込み可） |

### 8.2 API クライアント変更

```typescript
// 現行（GAS）
const result = await api.memberLogin(loginId, password);
// 内部: google.script.run.processApiRequest('memberLogin', ...)

// 移行後（REST API）
const response = await fetch('/api/auth/member-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ loginId, password }),
});
const result = await response.json();
```

### 8.3 Firebase Auth 統合

```typescript
// 会員ログイン
import { signInWithEmailAndPassword } from 'firebase/auth';

const credential = await signInWithEmailAndPassword(
  auth,
  `${loginId}@hirakata-cm.firebaseapp.com`,
  password
);
const idToken = await credential.user.getIdToken();
// 以降、全 API リクエストに Authorization: Bearer <idToken> を付与

// 管理者ログイン
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const result = await signInWithPopup(auth, new GoogleAuthProvider());
const idToken = await result.user.getIdToken();
```

---

## 9. データ移行計画

### 9.1 移行ツール

GAS 上で動作するデータエクスポート関数を作成し、Firestore に一括投入する。

```typescript
// GAS: エクスポート関数
function exportAllDataForMigration() {
  const ss = getOrCreateDatabase_();
  const tables = [
    'T_会員', 'T_事業所職員', 'T_認証アカウント',
    'T_研修', 'T_研修申込', 'T_年会費納入履歴',
    'T_管理者Googleホワイトリスト', 'T_画面項目権限',
    'T_システム設定', 'T_監査ログ', 'T_ログイン履歴',
  ];
  const result = {};
  tables.forEach(function(name) {
    result[name] = getRowsAsObjects_(ss, name);
  });
  return JSON.stringify(result);
}

// Node.js: インポートスクリプト
async function importToFirestore(exportedJson: string) {
  const data = JSON.parse(exportedJson);
  const db = admin.firestore();
  const batch = db.batch();
  // T_会員 → members
  data['T_会員'].forEach((row) => {
    const ref = db.collection('members').doc(row['会員ID']);
    batch.set(ref, mapMemberToFirestore(row));
  });
  await batch.commit();
}
```

### 9.2 パスワード移行

Firebase Auth の `importUsers` API は SHA-256 ハッシュのインポートをサポートしている。

```typescript
import { getAuth } from 'firebase-admin/auth';

await getAuth().importUsers(
  users.map(u => ({
    uid: u.loginId,
    email: `${u.loginId}@hirakata-cm.firebaseapp.com`,
    passwordHash: Buffer.from(u.passwordHash, 'hex'),
    passwordSalt: Buffer.from(u.passwordSalt, 'utf8'),
  })),
  {
    hash: {
      algorithm: 'SHA256',
      rounds: 1,
    },
  }
);
```

### 9.3 移行チェックリスト

- [ ] Firestore コレクション作成（セキュリティルール含む）
- [ ] GAS エクスポート関数でデータ抽出
- [ ] Node.js インポートスクリプトで Firestore に投入
- [ ] Firebase Auth にユーザー一括インポート（パスワードハッシュ含む）
- [ ] 管理者ホワイトリスト → カスタムクレーム設定
- [ ] Cloud Run API デプロイ・疎通確認
- [ ] フロントエンド API クライアント切り替え
- [ ] Firebase Hosting デプロイ
- [ ] DNS / URL 切り替え（固定 Deployment ID → Firebase Hosting URL）
- [ ] メール送信疎通確認（GAS 連携 or Gmail API）
- [ ] 全機能テスト
- [ ] 旧 GAS Web App を読み取り専用に変更

---

## 10. 段階的移行フェーズ

### Phase 0: 準備（現行 GAS 運用継続）

- [ ] GCP プロジェクト設定（Firebase 有効化、Firestore 作成）
- [ ] Firebase Auth セットアップ
- [ ] Cloud Run 環境構築
- [ ] データ移行スクリプト開発・テスト

### Phase 1: フロントエンド分離

- [ ] Firebase Hosting にフロントエンドをデプロイ
- [ ] API 通信を `google.script.run` → `fetch()` に切り替え
- [ ] バックエンドは引き続き GAS（CORS 設定追加）
- **効果**: HTML 配信が CDN 経由で即時化、コード分割可能

### Phase 2: DB 移行

- [ ] Firestore にデータ投入
- [ ] Cloud Run API サーバーをデプロイ
- [ ] フロントエンドの API 接続先を Cloud Run に切り替え
- [ ] GAS はメール送信のみ残す
- **効果**: 全 API 呼び出しが 30-150ms に改善

### Phase 3: 認証移行

- [ ] Firebase Auth にユーザー移行
- [ ] 認証フローを Firebase Auth SDK に切り替え
- [ ] パスワードハッシュを bcrypt/Argon2id に段階的アップグレード
- **効果**: OWASP 準拠、自動レート制限、MFA 対応可能

### Phase 4: GAS 完全撤去（任意）

- [ ] メール送信を Gmail API 直接呼び出しに移行
- [ ] GAS Web App を無効化
- [ ] Spreadsheet はバックアップ/閲覧専用として保持
- **効果**: GAS 依存ゼロ、完全にモダンスタック

---

## 11. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| Firebase 無料枠の将来的な変更 | コスト発生 | Blaze プラン（従量課金）でも月額 $1 未満の見込み。予算アラート設定 |
| GAS → Cloud Run 移行中の二重運用 | 運用負荷 | Phase 1-2 は並行稼働期間を最小化（1-2 週間） |
| Firestore のクエリ制約 | 複雑な検索が困難 | 複合インデックス設計、非正規化で対応 |
| メール送信のドメイン認証 | SPF/DKIM 不整合 | 移行前にドメイン認証設定を確認 |
| 会員の URL 変更 | ブックマーク切れ | 旧 URL から新 URL へのリダイレクト設定 |

---

## 12. 現行 GAS 構成との互換性維持

移行期間中、以下の互換性を維持する。

- **固定 Deployment ID**: 移行完了まで現行 URL を維持
- **認証方式**: 会員 = ログインID + パスワード、管理者 = Google 認証（方式は変わるがUXは同一）
- **5 段階権限モデル**: MASTER/ADMIN/TRAINING_MANAGER/TRAINING_REGISTRAR/GENERAL をカスタムクレームで再現
- **データ整合**: Spreadsheet と Firestore の双方向同期は行わない。移行は一方向（Sheets → Firestore）のカットオーバー方式

---

## 13. 参照ドキュメント

- `docs/02_ARCHITECTURE.md` — 現行アーキテクチャ
- `docs/03_DATA_MODEL.md` — 現行データモデル
- `docs/05_AUTH_AND_ROLE_SPEC.md` — 現行認証仕様
- `docs/09_DEPLOYMENT_POLICY.md` — 現行デプロイポリシー
- `docs/08_GCP_SETUP_RUNBOOK_2026-02-28.md` — GCP プロジェクト設定手順

### 外部参照

- [Google Cloud Free Tier](https://cloud.google.com/free)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Firestore Pricing](https://cloud.google.com/firestore/pricing)
- [Firebase Auth Import Users](https://firebase.google.com/docs/auth/admin/import-users)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
