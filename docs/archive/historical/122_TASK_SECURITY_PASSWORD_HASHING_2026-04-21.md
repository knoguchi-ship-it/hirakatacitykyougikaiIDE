# タスク: パスワードハッシュを memory-hard KDF へ移行

優先度: High
種別: セキュリティ是正
起票日: 2026-04-21
根拠: docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md §5.3
OWASP: Authentication Cheat Sheet / ASVS password storage requirements

## 問題

現在の実装（`backend/Code.gs:9372-9374`）は `Utilities.computeDigest(SHA_256, ...)` + salt。

- salt はある（`generateSalt_()`）
- しかし単発 SHA-256 は memory-hard ではなく、漏えい後の offline cracking に弱い
- 現行標準: Argon2id > scrypt > bcrypt > PBKDF2-HMAC-SHA-256（高反復）

## 是正内容

### 1. 目標アルゴリズム

GAS 環境（`Utilities` API のみ、native Argon2 なし）の制約を考慮した現実的な選択:

**第一候補: PBKDF2-HMAC-SHA-256 高反復実装**
```js
function hashPassword_(password, salt) {
  var key = password + ':' + salt;
  var iterations = 100000;  // NIST SP 800-132 推奨 100k+
  var hash = key;
  for (var i = 0; i < iterations; i++) {
    hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      hash + salt
    );
  }
  return Utilities.base64Encode(hash);
}
```

注意: GAS の `Utilities.computeDigest` は byte array を返すため、
反復ごとに適切な型変換が必要。パフォーマンス測定を先行して実施すること。

**第二候補: 外部 KDF サービス呼び出し**（UrlFetchApp 経由、セキュリティ要件と運用コストのトレードオフが高い）

### 2. login 時 rehash migration

```js
function authenticateMember_(loginId, password) {
  var authRow = findAuthRowByLoginId_(loginId);
  var storedHash = authRow['ハッシュ化パスワード'];
  
  // 既存 SHA-256 ハッシュとの照合（移行期間中）
  var legacyHash = computeLegacyHash_(password, authRow['ソルト']);
  if (storedHash === legacyHash) {
    // 認証成功 → 新方式でハッシュし直して保存
    var newHash = hashPassword_(password, authRow['ソルト']);
    updateAuthRowHash_(authRow, newHash, 'PBKDF2');
    return { success: true };
  }
  
  // 新方式でも照合
  var newHash = hashPassword_(password, authRow['ソルト']);
  if (storedHash === newHash) {
    return { success: true };
  }
  
  return { success: false };
}
```

### 3. ハッシュ方式フラグ

`T_認証` に `ハッシュ方式` カラムを追加（`SHA256` / `PBKDF2`）して移行状況を管理。

## 実装注意

- GAS の実行時間制限（6分/実行）に注意。高反復は1回ログインあたり数秒かかる可能性。
- 初回実装前に `Logger.log(new Date())` で反復数とパフォーマンスを計測すること。
- `T_認証` スキーマ変更を伴うため、`rebuildDatabaseSchema` 実行が必要。
- 変更前に本番 DB のバックアップを取ること。

## 完了条件

- 新規パスワード設定は PBKDF2（または同等以上）で保存される
- 既存 SHA-256 ハッシュは login 時に自動的に新方式へ rehash される
- 移行完了後、全 auth row が新方式で保存されていることを確認
- ハッシュ方式フラグで移行状況を追跡できる
