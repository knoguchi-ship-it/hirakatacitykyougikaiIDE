# v376.64 リリース状態（2026-09-02）

- 本番 fixed deployment: **public @369 ×2 / member @128 / admin @225**
- ロールバック先: **public @368 ×2 / member @127 / admin @224**（v376.63）
- 位置づけ: 機能追加（会費設定）＋既存不具合の是正（スキーマ初期化による金額上書き）

---

## 1. 背景

公開ポータルの入会申込画面に、個人会員・事業所会員・賛助会員の**会費を知る手段が無かった**（operator 指摘）。
会費は運用で変わりうるため、金額は設定画面からいつでも変更できる必要がある。

## 2. 設計判断: 正本を増やさない

年会費は既に `M_会員種別.年会費金額` に存在し、**年会費請求（`getAnnualFeeAmountMap_` / `resolveAnnualFeeAmount_`）と
メール差し込み**がこの列を読んでいた。ここで `T_システム設定` に金額キーを新設すると正本が 2 つになり、
「申込画面には 3,000 円と出ているのに請求は 4,000 円」という食い違いが必ず起きる。

したがって:

- **金額の正本は `M_会員種別.年会費金額` の 1 列だけ**とし、設定画面はこの列を編集する UI とした。
- `T_システム設定` に増やしたのは表示制御のみ: `MEMBERSHIP_FEE_PUBLIC_VISIBLE` / `MEMBERSHIP_FEE_NOTE`。
- 公開・管理の双方が同じ読み出し関数 `readMemberTypeAnnualFees_(ss)` を通る（DRY）。
- unit test で「金額を設定キーに二重定義していないこと」をソース契約として固定した。

## 3. 同時に直した既存不具合（重要）

`ensureMemberTypeAnnualFeeAmounts_` は **スキーマ初期化のたびに 3000 / 8000 / 5000 で無条件に上書き**していた。
このままでは設定画面から金額を変えても、次回の admin ログイン（`initializeSchema_`）で元に戻り、設定として成立しない。

- 「**未設定（空欄・非数値）のときだけ既定値を補完**」に変更。
- `Number('')` が 0 になるため、**空欄と 0 円（会費無料として設定済み）を生値で区別**する。
- この 2 点を unit test で回帰固定した（`scripts/test-membership-fee.mts`）。

## 4. 変更点

| 層 | 内容 |
|---|---|
| GAS | `MEMBER_TYPE_ANNUAL_FEE_DEFAULTS` / `MEMBERSHIP_FEE_DEFAULTS` / `readMemberTypeAnnualFees_` / `setMemberTypeAnnualFeeAmounts_` / `normalizeAnnualFeeAmount_` を追加。`ensureMemberTypeAnnualFeeAmounts_` を補完のみに変更 |
| GAS | `getSystemSettings_` に `memberTypeAnnualFees` / `membershipFeePublicVisible` / `membershipFeeNote` を追加。`updateSystemSettings_` で受け取り（検証 → シート書込の順序で部分適用を防止） |
| GAS | `getPublicPortalSettings_` に `membershipFees` / `membershipFeeVisible` / `membershipFeeNote` を追加（**新 public action は増やさない**＝境界不変） |
| 管理 UI | 設定サブナビに「会費設定」を新設。種別ごとの金額（0〜1,000,000 円）・公開表示トグル・補足文。「年会費の納入案内」「共通振込先」を基本設定から移設 |
| 公開 UI | 入会申込の会員種別カードに「年会費 N,NNN円」を表示＋カード下に補足文。カードを `sm:` から 3 列化 |
| テスト | `test:membership-fee`（6 件）を prerelease に追加。`dryRunMembershipFeeV376_64_LOG`（実 DB 往復・非送信・原状復帰）を追加 |

## 5. 検証結果

### 5.1 デプロイ前ゲート

| ゲート | 結果 |
|---|---|
| `npm run prerelease`（新ゲート `test:membership-fee` 含む） | **PASS（exit 0）** |
| 3 split ビルド＋生成物 grep（新規関数・定数の残存） | **PASS**（public/admin に必要関数、3 split すべてに定数） |
| `test:er-sync` | **PASS**（列変更なし・stale 0） |

### 5.2 デプロイ後 live E2E（影響範囲に限定）

| 対象 | 結果 |
|---|---|
| 公開ポータル a11y（home / 入会申込 / 重要事項モーダル） | **違反 0** |
| 公開ポータル responsive 7VP × 3 画面 | **全 PASS** |
| **入会申込カードの会費表示（実測）** | **PASS** — `3,000円` / `8,000円` / `5,000円`、補足文表示、console error 0 |
| 管理ポータル responsive（7VP × 8 コンソール） | **56 view 全 PASS**（console error 0） |
| 管理 メール設定 E2E（設定画面の到達・非破壊） | **5/5 PASS** |
| `dryRunMembershipFeeV376_64_LOG`（実 DB 往復・非送信） | **`passed:true` / `restored:true`** — 7 チェック全 PASS |

- 管理側は初回、admin URL が `Sign in - Google Accounts`（`Signed out`）を返して到達できなかった。
  **アプリ障害ではなくセッション期限切れであることを実測で切り分け**、operator ログイン後に全て実行して PASS（`HANDOVER.md` §3-2 の既知事象）。
- dryRun の内訳: 退避（3000/8000/5000）→ 検証値で保存 → 読み戻し一致 → 公開ポータル設定に同値 → **スキーマ初期化を通しても戻らない**
  → 範囲外を拒否 → **原状復帰（3000/8000/5000）**。実行後の DB は実行前と同一。

## 6. 残作業（operator）

1. 実際の会費が既定値（3,000 / 8,000 / 5,000 円）と違う場合は、設定 → 会費設定 で実額へ更新する。
2. 会費を公開したくない期間は「入会申込画面に年会費を表示する」を無効にする（金額は保持される）。
