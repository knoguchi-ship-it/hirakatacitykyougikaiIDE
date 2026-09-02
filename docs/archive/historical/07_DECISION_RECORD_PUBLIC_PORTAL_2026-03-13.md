# 公開ポータル追加 方針決定記録（2026-03-13）

## 1. 決定事項

1. 同一 GAS プロジェクト内に公開ポータル（非会員向け）を追加する。
2. 研修登録フォームは `src/shared/TrainingForm.tsx` として単一コンポーネント化し、両ポータルで共有する。
3. 非会員申込データは `T_外部申込者`（新設）に保管し、`T_研修申込` のポリモーフィック設計（`申込者区分コード` + `申込者ID`）で会員申込と統合管理する。
4. 定員は会員・非会員の申込を合算で管理する。
5. 管理者の研修登録は両ポータルから可能とし、認証は `checkAdminBySession_()` で統一する。
6. 公開フォームは個人情報保護法・医療介護関係事業者ガイダンス（2025年6月改正）に準拠する。

## 2. 設計上の理由

### 同一 GAS を選択した理由
- DB（Spreadsheet）を共有するため、別 GAS にしても実質的な分離メリットがない。
- `checkAdminBySession_()` は GAS のセッション機構に依存するため、同一 GAS が信頼性上有利。
- 固定 Deployment ID 運用ルール（`docs/09_DEPLOYMENT_POLICY.md`）を維持できる。
- clasp・Deployment の管理対象を増やさない。
- 根拠調査：Vite multi-entrypoint + vite-plugin-singlefile の動作を調査エージェントで確認済み（2026-03-13）。

### ポリモーフィック DB 設計を選択した理由
- NULL 列を持たない設計により、申込者数カウント・リマインダー送信ロジックを `申込者区分コード` での分岐のみで統一できる。
- 別テーブル方式（`T_会員申込` / `T_外部申込`）では GAS での集計コストが高い。
- 根拠：Background agent による DB 設計調査（2026-03-13）でポリモーフィック方式を推奨と確認。

### 共有コンポーネント方式の根拠
- `src/shared/` + `@shared` エイリアスは Vite プロジェクトにおける標準的な共有設計。
- 追加ツールチェーン（Turborepo/nx 等）不要でプロジェクト規模に適合。
- 構造的に TrainingForm の乖離が不可能になる（両ポータルが同一ファイルを import）。

## 3. 個人情報保護法対応の決定内容

| 要件 | 実装方針 | 根拠 |
|------|----------|------|
| 利用目的の明示 | フォームに収集目的を日本語で明記 | APPI 第17条 |
| 同意チェックボックス | 送信ボタン前に必須配置 | APPI 第17・18条 |
| 保管期間 | 研修終了日の翌年4月1日に `削除フラグ=true` を自動適用 | APPI 第19条 |
| 同意日時の記録 | `T_外部申込者.同意日時` に保存 | 介護ガイダンス準拠 |
| 第三者提供禁止 | 外部提供なし。システム内のみ | APPI 第27条 |

## 4. スコープ変更

- `docs/10_SOW.md` §1 に公開ポータル追加を記載済み（2026-03-12）。
- 本決定記録が追加仕様の一次ソースとなる。

## 5. 実装時の同時整合性要件（RULEBOOK §3）

以下を**同一変更セット**で実装すること：

- `backend/Code.gs`
  - `マスタ定義` に `M_申込者区分` 追加
  - `テーブル定義` に `T_外部申込者` 追加・`T_研修申込` 変更（`申込者区分コード`・`申込者ID` 追加）
  - `マスタ初期値` に `M_申込者区分` 初期値追加
  - 新 API 関数：`getPublicTrainings_()`・`applyTrainingExternal_()`・`cancelTrainingExternal_()`・`getTrainingApplicants_()`
  - `doGet()` に公開ポータルルーティング追加
- `src/shared/types.ts`（`types.ts` から移動）
  - `ExternalApplicant` 型追加
  - `Training申込` 型の `applicantType` フィールド追加
- `src/shared/TrainingForm.tsx`（`components/TrainingManagement.tsx` から切り出し）
- `vite.config.ts` マルチエントリポイント設定
- `tsconfig.json` の `paths` に `@shared` 追加
- `index_public.html` 新設
- `src/public-portal/` 新設
- `rebuildDatabaseSchema()` 実行（本番 Spreadsheet へのスキーマ反映）

## 6. 受け入れ指標（DoD）

1. 公開ポータル（`?app=public`）で受付中研修一覧が認証なしで表示される。
2. 非会員が氏名・メール・電話番号・事業所名を入力して申込できる。
3. 申込確認メールが登録メールアドレスへ送信される。
4. 管理者が両ポータルから研修登録フォームを操作できる（同一 UI）。
5. 管理画面の申込一覧に会員・非会員が統合表示される。
6. 定員は会員・非会員の合算で管理される（超過時は申込不可）。
7. Honeypot フィールド入力がある申込はサーバー側で拒否される。
8. 個人情報の取り扱い同意チェックなしでは送信できない。プライバシーポリシーの正本は本サイト別建てとする。

## 7. 参照した一次情報

1. Vite multi-entrypoint + vite-plugin-singlefile 動作確認（Background agent, 2026-03-13）
2. 個人情報保護法ガイドラインQ&A：https://www.ppc.go.jp/personalinfo/faq/APPI_QA/
3. 医療・介護関係事業者ガイダンス（2025年6月改正）：https://www.ppc.go.jp/personalinfo/legal/iryoukaigo_guidance/
4. OWASP Input Validation Cheat Sheet：https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
5. GAS multi-page serving セキュリティ考慮事項（Background agent, 2026-03-13）
