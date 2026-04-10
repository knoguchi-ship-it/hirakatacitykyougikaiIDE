# ベストプラクティス監査レポート

実施日: 2026-03-31
対象: 枚方市介護支援専門員連絡協議会 会員システム（v154）
実施方法: Web検索による最新一次ソース確認 + 現行ドキュメント・コードとの差分分析

---

## 調査範囲

5領域について、2025-2026年時点のグローバル標準・業界標準・日本の実務水準を調査し、現行プロジェクトとの差分を評価した。

1. セキュリティ（OWASP Top 10 2025、GAS Web App認証、パスワードハッシュ）
2. アクセシビリティ（WCAG 2.2、JIS X 8341-3、React 19/Tailwind CSS）
3. 法令遵守（個人情報保護法、医療介護ガイダンス、特定電子メール法）
4. ドキュメント品質（ADR、SRE引継ぎ、README、Diataxis）
5. パフォーマンス（GAS CacheService、クォータ、Vite最適化）

---

## 1. セキュリティ

### 適合項目

| 観点 | 現行 | 根拠 |
|------|------|------|
| 管理者認証 (`Session.getActiveUser()`) | 同一ドメインWL照合 | GAS唯一の安定方式。ポリシー変更なし |
| GIS廃止 (v118) | iframe sandbox制約で廃止 | GAS iframe sandbox では GIS 動作不可（変更なし） |
| RBAC | 5段階 + アクション単位チェック | OWASP A01:2025 準拠 |
| 固定Deployment ID | UI手動更新 | Google推奨パターン |
| V8ランタイム | 使用中 | Rhino 2026/1/31 終了。V8必須 |

### 要改善項目

| ID | 観点 | 現行 | 標準 | 対応方針 |
|----|------|------|------|---------|
| S-01 | パスワードハッシュ | SHA-256 + salt (1回) | OWASP: Argon2id > bcrypt > scrypt > PBKDF2 | GCP移行で Firebase Auth に統合。中間対策として computeDigest ループ疑似PBKDF2 or Cloud Function 経由 |
| S-02 | アカウントロックアウト | 手動解除のみ | 時間ベース自動解除推奨 | 自動解除タイマー追加 |
| S-03 | npm依存関係監査 | 未ドキュメント化 | OWASP A08 (Supply Chain) 定期 `npm audit` 推奨 | `npm audit` 定期実行の仕組み化 |

**主要ソース:**
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Top 10:2025: https://owasp.org/Top10/2025/
- Apps Script Release Notes: https://developers.google.com/apps-script/release-notes

---

## 2. アクセシビリティ

### 適合項目

| 観点 | 現行 | 根拠 |
|------|------|------|
| Tailwind CDN廃止→ビルド済みCSS | v153で実施 | Tailwind公式: CDNは開発用のみ。ビルド済みが本番標準 |
| スケルトンUI | v150で導入 | WCAG 2.2 準拠。`aria-busy="true"` の確認は必要 |
| aria/role属性 | 76箇所 (9ファイル) | 基本的なカバレッジはあり |

### 要改善項目

| ID | 観点 | 現行 | WCAG基準 | 優先度 |
|----|------|------|---------|--------|
| A-01 | スキップリンク | ✅ 実装済み (v155) | WCAG 2.4.1 (Level A) | ~~HIGH~~ 完了 |
| A-02 | SPA画面遷移時フォーカス管理 | ✅ 実装済み (v155) — `useEffect` + `mainRef.focus()` | WCAG 2.4.3 | ~~MEDIUM~~ 完了 |
| A-03 | `aria-live` の網羅性 | ✅ 実装済み (v155) — 両ポータルに `aria-live="polite"` リージョン追加 | SPA全画面で必要 | ~~MEDIUM~~ 完了 |
| A-04 | フォーカストラップ (モーダル) | ✅ 対応済み — native `<dialog>` + `showModal()` がブラウザネイティブにトラップ提供。`aria-labelledby` 追加 (v155) | WCAG 2.4.3 | ~~MEDIUM~~ 完了 |
| A-05 | `document.title` 動的更新 | ✅ 実装済み (v155) — ビュー遷移時に `document.title` を動的設定 | WCAG 2.4.2 | ~~MEDIUM~~ 完了 |
| A-06 | ターゲットサイズ監査 | 未実施 | WCAG 2.5.8 (24x24 CSS px) | LOW |

**参考:** JIS X 8341-3:2016 は WCAG 2.0 相当。日本の実務上は WCAG 2.1 AA が事実上の目標。2024年4月の障害者差別解消法改正で民間事業者にも「合理的配慮」が義務化。

**主要ソース:**
- WCAG 2.2 W3C Recommendation: https://www.w3.org/TR/WCAG22/
- W3C WAI Japan Policies: https://www.w3.org/WAI/policies/japan/

---

## 3. 法令遵守

### 適合項目

| 観点 | 現行 | 根拠 |
|------|------|------|
| 公開申込フォームの同意チェック | 実装済み | APPI 21条 |
| `mailingPreference` (opt-out) | DBフィールド実装済み | 特定電子メール法（ただし非営利は適用除外の可能性あり） |
| Honeypot ボット対策 | 実装済み | ベストプラクティス |
| RBAC 5段階権限 | 実装済み | APPI 23条 安全管理措置 |

### 要改善項目

| ID | 観点 | 法的根拠 | 優先度 |
|----|------|---------|--------|
| L-01 | プライバシーポリシー正本への導線整理が必要 | APPI 21, 32条 | ~~**HIGH**~~ ✅ 完了 (v155) |
| L-02 | 入会申込フォームに利用目的の通知がない | APPI 21条 | ~~**HIGH**~~ ✅ 完了 (v155) |
| L-03 | 保有個人データ開示等の手続が未整備 | APPI 32-39条 | ~~**HIGH**~~ ✅ 完了 (v155) |
| L-04 | 委託先管理（Google Workspace）の記録なし | APPI 25条 | ~~MEDIUM~~ ✅ 完了 (v155) — `docs/36_DATA_PROTECTION_PROCEDURES.md` §1 |
| L-05 | `collectTrainingRecipients_()` が `mailingPreference` 未チェック | 自システムの仕様矛盾 | ~~MEDIUM~~ ✅ 完了 (v155) |
| L-06 | PPC漏えい報告手順の未整備 | APPI 26条 | ~~MEDIUM~~ ✅ 完了 (v155) — `docs/36_DATA_PROTECTION_PROCEDURES.md` §2 |
| L-07 | メールフッターに組織名・連絡先なし | ベストプラクティス | LOW |
| L-08 | データ所在地（Google Spreadsheet）の文書化なし | APPI 28条 | LOW |

**備考:** 2026年1月に個人情報保護委員会が「制度改正方針」を公表。課徴金制度・団体訴訟が2027-2028年に導入見込み。現時点での対応がより重要。

**主要ソース:**
- 個人情報保護委員会 医療介護ガイダンス: https://www.ppc.go.jp/personalinfo/legal/iryoukaigo_guidance/
- Google Cloud APPI Compliance: https://cloud.google.com/security/compliance/appi-japan
- BUSINESS LAWYERS 2026 APPI Overview: https://www.businesslawyers.jp/articles/1485

---

## 4. ドキュメント品質

### 適合項目

| 観点 | 根拠 |
|------|------|
| ADR (決定記録) パターン | AWS/Microsoft 推奨形式に準拠 |
| Diataxis分離 (学習HTML / 正本MD) | Canonical/Ubuntu/Django で採用の Diataxis フレームワーク準拠 |
| 引継ぎ文書 (HANDOVER.md) | Google SRE Service Takeover ガイダンスに準拠 |
| ドキュメント索引 | 単一入口 + カテゴリ分類 |

### 改善推奨項目

| ID | 観点 | 推奨 | 優先度 |
|----|------|------|--------|
| D-01 | デプロイロールバック手順 | `docs/09_DEPLOYMENT_POLICY.md` に追記 | ~~MEDIUM~~ ✅ 完了 (v155) |
| D-02 | GASクォータ/制限の文書化 | キャパシティ計画文書の新設 | ~~MEDIUM~~ ✅ 完了 (v155) — `docs/37_GAS_QUOTAS_AND_LIMITS.md` |
| D-03 | 障害モード文書 ("How it breaks") | SRE標準。既存 Incident Log を体系化 | MEDIUM |
| D-04 | 用語集 | 日英混在プロジェクトで特に重要 | LOW |
| D-05 | ADR用サブフォルダ分離 | `docs/decisions/` に DECISION_RECORD_* を移動 | LOW |
| D-06 | 文書間相互参照リンク | 各文書から関連文書へのリンク追加 | LOW |
| D-07 | 文書鮮度表示 | last-verified vs last-edited の区別 | LOW |

**主要ソース:**
- Diataxis Framework: https://diataxis.fr/
- Google SRE Book: https://sre.google/sre-book/service-best-practices/
- AWS ADR Best Practices: https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/

---

## 5. パフォーマンス

### 適合項目

| 観点 | 現行 | 根拠 |
|------|------|------|
| CacheService チャンクサイズ (90KB) | 100KB上限に対し10%マージン | 安全マージンとして適切 |
| `putAll` バッチ書き込み | 実装済み | memcache 1回呼び出し、正しい |
| Spreadsheet バッチ読み書き | `getValues()`/`setValues()` 使用 | GAS公式ベストプラクティス |

### 改善推奨項目

| ID | 観点 | 現行 | 推奨 | 優先度 |
|----|------|------|------|--------|
| P-01 | `build.target` | 未設定 | Vite 既定 target を明示するか、サポートブラウザ方針に合わせて固定する。公開ポータルがあるため `esnext` への単純変更は推奨しない | LOW |
| P-02 | キャッシュTTL | 300秒 | 書き込み時 invalidation 実装済みなら 600秒に延長可 | LOW |
| P-03 | 単一HTMLサイズ | 510KB | 許容範囲だが成長を監視。1MB超で体感劣化の可能性 | 監視 |

**主要ソース:**
- Apps Script CacheService Limits: https://justin.poehnelt.com/posts/exploring-apps-script-cacheservice-limits/
- Apps Script Best Practices: https://developers.google.com/apps-script/guides/support/best-practices
- Apps Script Quotas: https://developers.google.com/apps-script/guides/services/quotas

---

## 対応優先順位

### HIGH（法的義務・基本要件）

1. ~~**L-01 + L-02 + L-03**~~: ✅ 完了 (v155-v156 方針確定) — 本サイト別建ての正本を参照する運用 + MemberApplicationForm 同意チェック + 開示手続案内
2. **S-01**: パスワードハッシュ強化（OWASP 2025 非準拠。GCP移行で解消予定だが中間対策を検討）

### MEDIUM（品質向上・リスク低減）

3. ~~**A-01**~~: ✅ 完了 (v155) — スキップリンク実装
4. ~~**A-02 + A-03 + A-04 + A-05**~~: ✅ 完了 (v155) — フォーカス管理 + aria-live + dialog aria-labelledby + document.title
5. ~~**L-05**~~: ✅ 完了 (v155) — mailingPreference チェック追加
6. ~~**L-04 + L-06**~~: ✅ 完了 (v155) — `docs/36_DATA_PROTECTION_PROCEDURES.md` に委託先管理 + PPC漏えい報告手順を文書化
7. ~~**D-01**~~: ✅ 完了 (v155) — ロールバック手順追加。 ~~**D-02**~~: ✅ 完了 (v155) — `docs/37_GAS_QUOTAS_AND_LIMITS.md`

### LOW（推奨・最適化）

8. **P-01 + P-02**: build.target 方針明文化 + TTL延長の是非再評価
9. **D-04 〜 D-07**: 用語集、ADR分離、相互参照、鮮度表示
10. **L-07 + L-08**: メールフッター、データ所在地文書化

---

## 次回監査の推奨時期

- APPI 改正法成立後（2026年後半〜2027年前半予定）
- GCP移行実施後
- A-06（ターゲットサイズ監査）を含む残アクセシビリティ監査完了後

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-31 | 初版作成。v154 時点の5領域監査 |
