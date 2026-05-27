# 開発引継ぎ（Current State）

> このファイルは「**現時点で本番がどうなっているか / 何をすべきか**」だけを記載します。
> 経緯・履歴・設計詳細は別ドキュメントへ。リンク先は §6 参照順序を参照。
> 更新原則: 本番デプロイのたびに §1 / §2 を更新。週次以上の頻度で見直す。

最終更新: **2026-05-27**
最新リリース: **`v376.16`**（研修管理 新規入力を画面表示中は保持・既存研修選択でリセットしない）

---

## 1. 現行本番デプロイ

| 配信 | Deployment ID | Version |
|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@348** |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@348** |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@107** |
| admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@176** |

3 project 構成（integrated/public・member split・admin split）の固定 deployment 運用。詳細は `docs/09_DEPLOYMENT_POLICY.md`。

---

## 2. 操作者の即時対応タスク

### 2-1. 未完了（優先度 High → Low）

| # | タスク | 詳細 / 参照 |
|---|---|---|
| 1 | v375 実機 Safari iOS 確認 | 本番 URL（admin / member / public 全 3）を Safari iOS から再読込なしで開き、splash → React マウントまで滞りなく進むこと、初期化中文字が一瞬出るが白画面ではないことを確認 |

### 2-2. 延期中（再開条件付き）

| タスク | 再開条件 | 参照 |
|---|---|---|
| GCP Secret Manager セットアップ + Cloud Run Argon2id 反映 | GCP 利用判断時 | `docs/239` (手順), `docs/240` (Cloud Run 設計), `docs/172` (必須・破棄禁止 backlog) |
| WCAG 2.2 AA 手動検証（NVDA / VoiceOver / キーボード） | 半期レビュー (2026-11) or 大規模 UI 改修時 | `docs/244` §3, `docs/245` §3 |

### 2-3. 半期レビュー（5 月 / 11 月）

| 項目 | コマンド / 手順 |
|---|---|
| 自動 a11y スキャン | `npm run test:a11y` → `.test-out/a11y-report.md` 確認 |
| 自動レスポンシブ | `npm run test:responsive` (+ `:admin` / `:member`) |
| 手動 SR テスト | NVDA + Chrome / VoiceOver + Safari の 3 シナリオ |
| 適合声明更新 | `docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md` を bump |

---

## 3. 開発再開時の必須コマンド

```bash
# 認証確認
npx clasp show-authorized-user            # k.noguchi@hcm-n.org であること

# 開発フロー
npm run typecheck                          # TypeScript 型検査
npm run test:formula                       # 33 unit tests
npm run test:search                        # 16 unit tests
npm run security:public-boundary           # public top-level callable 監査
npm run security:split-boundary            # member + admin 監査
npm run prerelease                         # 全 release gate（上記をまとめて）

# 本番デプロイ（3 split それぞれ）
npm run build:gas                          # public ビルド
npm run build:gas:member                   # member ビルド
npm run build:gas:admin                    # admin ビルド
(cd gas/admin && npx clasp push --force && npx clasp version "..." && npx clasp redeploy <ID> --versionNumber <N>)
# 同様に member / 統合 public

# 自動 a11y / レスポンシブ（live URL 必須）
npm run test:a11y                          # 公開ポータルのみ（auth 不要）
npm run test:responsive                    # 公開ポータルのみ
npm run test:responsive:admin              # 要 storageState
npm run test:responsive:member             # 要 storageState
```

---

## 4. 既知の運用注意事項

| # | 注意点 |
|---|---|
| **メール送信は safe-stop** | 本番初期値 `MAIL_GLOBAL_ENABLED=false`。送信再開時は admin → システム設定 → メール通知 → 「メール送信制御」セクションで切替。詳細 `docs/227_MAIL_KILL_SWITCH_2026-05-18.md` |
| **PDF サムネイル** | Drive thumbnailLink の遅延で `案内状サムネイルURL` が空着地することあり。`processPendingThumbnails` trigger（10 分毎）で自動修復。trigger 未登録なら admin editor で `setupPendingThumbnailsTrigger` を 1 回 Run |
| **介護支援専門員番号** | 公開ポータルは 8 桁数字厳格。admin (MASTER/ADMIN) のみ 1-10 桁英数字を許容（HN/HS プレフィックス対応）。詳細 `docs/03_DATA_MODEL.md` §4.1 |
| **clasp 認証 RAPT 期限切れ** | デプロイ時 `invalid_grant` で失敗した場合 `npx clasp login` で再ログイン |
| **build:gas は backend/Code.gs のみ** | admin/member の Code.gs / index.html を更新するには `build:gas:admin` / `build:gas:member` を別途実行 |
| **clasp deploy 全面禁止** | 新 ID 生成で固定 URL が変わるため。Version 更新は `clasp redeploy` のみ |
| **Secret 系ファイルは絶対に Git に入れない** | `.env*` / `.clasprc.json` / `.clasp.json` / `auth-*.json` / `storageState*.json` / pepper / token。詳細 `AGENTS.md` §0 |

---

## 5. 確定済みアーキテクチャ境界（崩してはいけない）

| 境界 | 仕様 |
|---|---|
| 3 境界分離 | **public**（匿名・申込専用）/ **member**（匿名+ID/PW・会員専用）/ **admin**（DOMAIN+Google セッション+ホワイトリスト・管理専用） |
| 会員ログイン | `loginId + password` のみ（Google ログイン不使用） |
| 管理者ログイン | `Session.getActiveUser()` + ホワイトリスト照合（GIS 廃止済） |
| 管理者と会員は完全分離 | admin shell では会員マイページを表示しない（v250〜確定） |
| public callable 関数 | `doGet` / `processApiRequest` / `healthCheck` のみ（厳格制限） |
| パスワードハッシュ | PBKDF2-HMAC-SHA256 10,000 反復 + pepper（v262〜）。Argon2id 移行は backlog |
| OAuth scope | 境界ごと最小化（v263〜確定 + v373.5 で `cloud-platform` 追加） |
| 詳細 | `docs/05_AUTH_AND_ROLE_SPEC.md`、`docs/02_ARCHITECTURE.md` |

---

## 6. 次担当者が読む順序

| # | ドキュメント | 目的 |
|---|---|---|
| 1 | `AGENTS.md` §0 | シークレット絶対ルール（破ったら即時是正） |
| 2 | 本 `HANDOVER.md` | 現状把握（このファイル） |
| 3 | `docs/00_DOC_INDEX.md` | 全ドキュメントの Diataxis 索引 |
| 4 | `docs/ONBOARDING.md` | 新規開発者向け（Day 1 / Week 1 / Week 2-3 / Week 4） |
| 5 | `docs/02_ARCHITECTURE.md` / `docs/03_DATA_MODEL.md` / `docs/05_AUTH_AND_ROLE_SPEC.md` | リファレンス（必要時） |
| 6 | `docs/12_ENGINEERING_RULEBOOK.md` / `docs/09_DEPLOYMENT_POLICY.md` | 開発・デプロイ規約 |
| 7 | `docs/release-notes-2026.md` | 直近の release history（時系列ログ） |
| 8 | `docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md` | WCAG 適合状態 |
| 9 | `docs/245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md` | 新 UI 追加時の必須セット |

---

## 7. 直近メジャーリリース（参考）

詳細は `docs/release-notes-2026.md` または個別 `docs/2XX_RELEASE_STATE_*.md`。

| Version | 日付 | 概要 |
|---|---|---|
| **v376.16** | 2026-05-27 | 研修管理（管理者）新規研修登録の入力中に一覧から既存研修を選んでも入力が消えないよう、新規入力を `pendingNewForm` へ退避し、詳細モーダルを閉じると右ペインへ復元（画面を開いている間は保持）。新規作成成功後は空フォームへ戻し連続登録に対応（v376.15 で混入した作成後の右ペイン空白化も解消）。削除・復元後も退避中の新規入力を保持。admin split のみ @176 |
| v376.15 | 2026-05-27 | 研修管理（管理者）右ペインを「新規登録専用エリア」として固定。v376.11 で編集・名簿・メールがモーダルへ移行済のため、右ペインは新規登録フォームのみ表示する1状態に簡素化（プレースホルダー／空表示の宙ぶらりんなデッド状態を解消）。既存研修選択モーダルを閉じると `startNew()` で新規フォームへリセット＆一覧選択解除。到達不能だった inline panelView 分岐も除去。admin split のみ @175 |
| v376.14.2 | 2026-05-27 | 研修管理 全機能ドライランテストを本番で実施 → 15/15 PASS（v376.12 STAFF メール個人解決の回帰確認含む）。テストデータ全 run 分を物理削除済。cleanup を DRYRUN_ プレフィックス sweep 方式に強化（孤児回収・冪等）。`dryRunTrainingManagement()` / `cleanupDryRunTrainingManagement()` は operator が editor から実行 |
| v376.13 | 2026-05-26 | メール送信のチェックボックス再選択バグ修正 — 全員選択モード (excludedIds による除外管理) で一度クリックで除外した行を再クリックしても除外解除されないバグを修正 |
| v376.12 | 2026-05-26 | メール送信バグ修正 — 事業所職員 (STAFF) の申込が legacy `getApplicationApplicantType_` で誤って MEMBER 判定され、事業所代表メール宛に送信されていた問題を解消。`getCanonicalApplicantRef_` (v360 modern 3-FK XOR) に置換し staffMap lookup 追加。`getTrainingApplicants_` と `sendTrainingMail_` 両方修正。区分バッジに「事業所職員」を追加 |
| v376.11 | 2026-05-26 | 既存研修選択時を大画面モーダル表示に変更（モバイル full-screen / デスクトップ 95vw 95vh）。ESC・backdrop click・focus restore・body scroll lock を備えた a11y 準拠モーダル。新規登録は inline 維持 |
| v376.10 | 2026-05-26 | 研修管理 UX 微調整 — 研修選択時の既定ビューを「名簿・出欠」へ変更（業務頻度最高の操作）。ボタン順を「名簿/出欠 → メール送信 → 編集 → 削除」へ並び替え |
| v376.9 | 2026-05-26 | パフォーマンス監査と最適化 — `approveAdminChangeRequest_` の staffRemove ループで sheet を毎回読込していた箇所をホイスト（N→1）/ admin の loadAppData 呼出のうち SystemSettings 取得が不要な 3 箇所で `includeAdminSettings:false` 化（合計 3 個 API 往復削減） |
| v376.8 | 2026-05-26 | 研修名簿・メール送信 UX 全面改修 — Salesforce Lightning / Mobbin segmented control / NN/g filter pattern 準拠。重複タイトル削除・選択ベース一括操作・ボタン階層化 |
| v376.7 | 2026-05-26 | 研修管理にフィルター（年度/状態/キーワード）+ soft delete + 復元機能を追加。グローバル UX best practice（current fiscal year default 等）準拠 |
| v376.5/.6 | 2026-05-26 | ChangeRequestConsole の `{}` 表示バグ・「処理中…」滞留・承認後の二重押下バグを修正 |
| v376.3/.4 | 2026-05-26 | テストデータ棚卸し・soft delete (T_外部申込者 3 件削除)。dryRun manifest 確認関数追加 |
| v376.1/.2 | 2026-05-25 | `backfillKanaToFullwidth_APPLY` ラッパー追加 + admin editor keep-list 追加 |
| **v376** | 2026-05-23 | フリガナ（セイ/メイ/フリガナ）の保存形式を全角カタカナに統一。ひらがな・半角カナ・全角カナの混在入力を受け付け、保存時に NFKC + ひらがな→カタカナ + 全角スペース正規化を適用。`backfillKanaToFullwidth` 移行関数で T_会員 180 / T_事業所職員 173 / T_外部申込者 3 件を変換済（計 356 rows / 804 cells）。19 ケースの単体テスト追加 (`scripts/test-kana-normalize.mts`) |
| v375 | 2026-05-21 | boot loader 全面改修（`scripts/compress-html.mjs`）— Safari iOS 初回ホワイトアウト解消（CSS splash + try/catch + DecompressionStream feature detect + 死んだ importmap 削除 + Google Fonts 非ブロック + requestIdleCallback 分散）。3 split 同時リリース |
| v374.1.1 | 2026-05-21 | Sidebar に LINE 投稿依頼を表示する修正 (App.tsx の VIEW_META と src/components/Sidebar.tsx の NavGroup は二重管理) |
| v374.1 | 2026-05-21 | 公式LINE投稿依頼コンソール追加（管理者ポータル / 3 状態ライフサイクル / Drive 添付 / Polymorphic association） |
| v374 | 2026-05-21 | WCAG 2.2 AA 自動テスト基盤 + レスポンシブ回帰運用化 + badge contrast 修正 |
| v373.7 | 2026-05-20 | Sprint S5 完了（GAS バックエンド旧 RosterExport 完全削除） |
| v373.6 | 2026-05-20 | Sprint S5 第 1 弾（front-end 旧 RosterExport 削除） |
| v373.5 | 2026-05-20 | Secret Manager 連携 + Cloud Run Argon2id 設計 |
| v373〜v373.4 | 2026-05-20 | 名簿出力 Visual Designer S3-S5（計算式・条件付き書式・PDF・row filter） |
| v372 系 | 2026-05-19 〜 20 | 名簿出力 Visual Designer 骨組み + S2（drag-drop / 列幅 / 書式） |

完全な履歴は `docs/release-notes-2026.md`。

---

## 8. 開発スタック早見表

| 領域 | 技術 |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Google Apps Script (GAS) + Google Spreadsheet (DB) |
| 認証 | 会員 ID/PW、管理者 Session + ホワイトリスト |
| Mail | `MailApp.sendEmail` (GAS ネイティブ・GmailApp 不使用) |
| GCP プロジェクト | `hcmn-member-system-prod` (#88737175415) |
| DB スプレッドシート | `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` (固定) |
| 運用アカウント | `k.noguchi@hcm-n.org` |
| GAS Project | `11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL` |

---

**お知らせ**: ドキュメント体系は 2026-05-21 に Diátaxis フレームワークに沿って刷新済み。本書 (`HANDOVER.md`) は「現状」のみ、`docs/00_DOC_INDEX.md` が全体索引、`docs/ONBOARDING.md` が新規参加者向けチュートリアル。
