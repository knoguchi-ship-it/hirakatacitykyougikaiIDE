# 268. 仕様トレーサビリティ一覧（2026-09-04）

枚方市介護支援専門員連絡協議会 会員システム
版数: 1.0 ／ 作成: 2026-09-04 ／ 対象: `docs/spec/` の 5 文書（SOW / RD / TRD / UI-UX / データIF）

> **本書の位置づけ**: `docs/267` テンプレート v3.0 §4 の最終成果物である
> **「要件ID → 検証方法 → 実装の所在」の対応表**。
> **要件の本文は書かない**（5 文書が正本）。本書は**追跡のための索引**であり、
> 要件を読むときは必ず正本の文書へ戻ること。
> 仕様書を 5 文書から増やさないため、`docs/spec/` 直下ではなく `docs/` 直下に置き、
> [`docs/00_DOC_INDEX.md`](00_DOC_INDEX.md) から辿れるようにしている。

## 改訂履歴

| 版 | 日付 | 変更内容 |
|---|---|---|
| 1.0 | 2026-09-04 | 初版。`docs/267` §4 の整合確認と同時に作成 |

---

## 0. 読み方

- **検証方法**: `npm run <script>` は自動テスト、`dryRun*_LOG` は operator が Apps Script エディタから実行する
  実 DB に対する非破壊検証、「レビュー」は人手、「**未検証**」は理由つきで明示する（空欄を認めない）。
- **実装の所在**: `gas-src/Code.full.gs` は 3 split すべての唯一のソース。行番号は変わるため**関数名・定数名で示す**。
- **状態**: ✅ 実装済み ／ ⚠️ 実装済みだが検証が自動化されていない ／ ⛔ 未実装（SOW §8 の U-ID を併記）

## 1. 非機能要件（SOW §6 が正本）

| ID | 要件（要約） | 検証方法 | 実装の所在 | 状態 |
|---|---|---|---|---|
| NF-01 | 可用性は Workspace / Apps Script に準ずる | **未検証**（目標値そのものが未合意・U-06） | — | ⛔ U-06 |
| NF-02 | 応答時間（公開 3 秒 / 管理 12 秒） | 手動計測。**自動計測は未整備** | 呼び出し回数を減らす設計（TRD 第1部 §1.6・統合 API） | ⚠️ U-18 |
| NF-03 | 現行規模で無理なく動作する | 実測値の記録のみ。継続監視は未実装 | — | ⚠️ |
| NF-04 | 3 境界の分離を機械検査で担保 | `npm run security:public-boundary` ／ `security:split-boundary` | `PUBLIC_ALLOWED_ACTIONS`（18）／ `MEMBER_ALLOWED_ACTIONS`（19）／ `ADMIN_ACTION_PERMISSIONS`（118）、`scripts/gas-boundary-utils.mjs` | ✅ |
| NF-05 | 同じ値・判定を 2 箇所で決めない | `npm run test:single-source` ／ `test:menu-registry` ／ `test:gas-artifact-refs` | `src/shared/*`（ビルド注入）／ `scripts/menu-registry.mjs` | ✅ |
| NF-06 | 新機能は GCP でも実装可能なもののみ | 設計時のレビュー（`AGENTS.md` §4.8）。**機械検査なし** | — | ⚠️ |
| NF-07 | WCAG 2.2 AA・自動検査で違反 0 | `npm run test:a11y` ＋ 半期の手動レビュー | `scripts/test-a11y.mjs` | ✅ |
| NF-08 | 360〜1920px で破綻しない | `npm run test:responsive` ／ `:member` ／ `:admin`（7 VP） | `scripts/responsive-test*.mjs`。判定は `.test-out/result*.json` の `fatal` / `consoleErrors` | ✅ |
| NF-09 | 画面表示は日本語を既定 | レビュー。**機械検査なし** | `AGENTS.md` §4.4 ／ UI/UX §8 | ⚠️ |
| NF-10 | 誤送信・誤削除から復旧できる | 手順の存在をレビューで確認。**復旧訓練は未実施** | メール全体停止スイッチ／削除バッチ単位の復元／`clasp redeploy` によるロールバック | ⚠️ |
| NF-11 | 破壊的操作の前にバックアップ | 実施記録のみ。**自動化されていない** | スプレッドシートの複製（手動） | ⚠️ |

## 2. 業務ルール（RD §9〜§12 が正本）

| ID | ルール（要約） | 検証方法 | 実装の所在 | 状態 |
|---|---|---|---|---|
| BR-01 | 会員種別ごとにできること | `npm run test:batch-edit` ／ レビュー | 会員セルフサービス系 action（`gas-src`）／ `src/components` の編集可否 | ✅ |
| BR-02 | 事業所会員の正本ルール（代表者 1 名・自動同期） | `npm run test:application-receipt` ／ レビュー | `staff.role='REPRESENTATIVE'` 判定 | ✅ |
| BR-03 | 会員ステータスと日付の扱い | `npm run test:member-fiscal-status` | `WITHDRAWAL_SCHEDULED` / `TRANSFERRED` の遷移処理 | ✅ |
| BR-04 | 事業所情報の扱い | `npm run test:single-source`（検証パターン）／ レビュー | `src/shared/validators.ts` | ✅ |
| BR-05 | 発送・通信ルール（事業所は代表者のみへ通知） | `npm run test:mailing-list` ／ `test:application-receipt` | `deliverMail_` ／ 宛先選定処理 | ✅ |
| BR-06 | 事業所会員のロール変更ルール | **未検証**（サーバー側の検証はあるが単体テストが無い） | 職員ロール更新の action | ⚠️ |
| BR-07 | CM 番号は管理者のみ変更可 | `npm run test:batch-edit` | 一括編集の書き換え可能項目リスト | ✅ |
| BR-08 | 同一人物の移行ポリシー | **未検証**（実 DB の dryRun のみ） | 人物統合処理・`T_人物統合ログ` | ⚠️ |
| BR-09 | 役員の活動報告・経費請求 | **未検証** | 請求系 action ／ `M_業務分類` の単価 | ⚠️ |
| BR-10 | 会計年度の在籍判定 | `npm run test:member-fiscal-status` ／ `test:mailing-list` | `src/shared/memberFiscalStatus.mjs`（ビルド注入） | ✅ |
| BR-11 | 会員状態の 3 段階と退会取消 | `npm run test:member-fiscal-status` | 退会申請・撤回の action | ✅ |
| BR-12 | 削除フラグの運用（翌年 4/1 で自動適用） | `npm run test:member-fiscal-status` ／ 削除 cascade の dryRun | リクエスト冒頭の自動適用処理 | ✅ |
| BR-13 | 年会費コンソールからの前年度末退会 | 削除 cascade の dryRun | 年会費一括保存の処理 | ⚠️ |
| BR-14 | 外部申込者データの自動削除 | **未検証**（時間経過を伴うため） | `T_外部申込者` の削除フラグ自動適用 | ⚠️ |
| BR-15 | 保存時の検証: 個人・賛助（カナは全角カタカナへ正規化） | `npm run test:kana` ／ `test:single-source` | `src/shared/validators.ts` の `KATAKANA_PATTERN` ／ `normalizeAndValidateKana_` | ✅ |
| BR-16 | 保存時の検証: 事業所 | `npm run test:single-source` ／ サーバー側はレビュー | 同上 ＋ 事業所番号の検証 | ✅ |
| BR-17 | パスワードの文字数規則 | `npm run test:login-lockout`（周辺）／ レビュー | 資格情報生成・パスワード変更の action | ⚠️ |
| BR-18 | 最終判定は必ずサーバー側 | `npm run security:split-boundary` ／ レビュー | `processApiRequest` の認証・認可段 | ✅ |

## 3. 認証・認可（SOW §4 が正本）

| 項目 | 検証方法 | 実装の所在 | 状態 |
|---|---|---|---|
| 3 境界の分離（public / member / admin） | `npm run security:public-boundary` ／ `security:split-boundary` | 3 Apps Script プロジェクト（`AGENTS.md` §4.2） | ✅ |
| メニュー単位 RBAC（action → menu → allowedMenus） | `npm run test:menu-registry` | `scripts/menu-registry.mjs`（MENU_REGISTRY 17・ADMIN 15 メニュー・ACTION_TO_MENU 118） | ✅ |
| 会員パスワード認証（PBKDF2 + pepper） | レビュー ／ `PASSWORD_HASH_PEPPER_V1` の設定確認（値は見ない） | `gas-src` の認証処理 ／ Script Properties | ✅ |
| **ログイン試行の時限解除**（成功で 0 復帰・20 回で恒久ロック） | `npm run test:login-lockout` | `T_認証アカウント.ロック解除予定日時`（v376.71） | ✅ |
| なりすまし対策（クライアント申告の ID を信用しない） | `npm run security:split-boundary` ／ レビュー | セッションから解決した principal で上書き（データIF §5.5） | ✅ |
| Argon2id の有効化 | — | Cloud Run `hcmn-password-hash`（**フラグ無効**） | ⛔ U-04 |
| 恒久ロックの管理画面からの解除 | — | 未実装（現在は資格情報の再発行のみ） | ⛔ U-26 |

## 4. 画面（UI/UX が正本）

画面ごとの個別テストは持たない。**まとめて機械検証する**。

| 範囲 | 検証方法 | 実装の所在 | 状態 |
|---|---|---|---|
| SCR-01〜08（公開ポータル 8 画面） | `npm run test:a11y`（違反 0）／ `test:responsive`（7 VP）／ `test:deeplink`（直リンク名の許可リスト） | `src/public-portal/App.tsx` | ✅ |
| SCR-10〜12（会員マイページ 3 画面） | `npm run test:responsive:member`（storageState 必須） | `src/App.tsx`（会員側） | ✅ |
| SCR-20〜63（管理ポータル 18 画面） | `npm run test:responsive:admin`（storageState 必須。**データ出力 SCR-63 は対象外**・U-25） | `src/App.tsx`（管理側）／ `BREADCRUMB_MAP` | ⚠️ U-25 |
| 通知の規約・表記のルール | レビュー。**機械検査なし** | UI/UX §6・§8 | ⚠️ |

## 5. データ・インターフェース（データIF が正本）

| 項目 | 検証方法 | 実装の所在 | 状態 |
|---|---|---|---|
| 列定義（28 業務テーブル / 17 マスタ / 13 アーカイブ） | `npm run test:er-sync`（ER 図とのドリフト検査） | `gas-src/Code.full.gs` の `テーブル定義` / `マスタ定義` | ✅ |
| キーの規約（ID 列・行番号を使わない） | レビュー ／ `test:er-sync` | 同上 | ✅ |
| **申込ID の採番統一** | — | `applyTraining_`（`AP-`）／ `applyTrainingExternal_`（素の UUID） | ⛔ U-24 |
| 応答の形（`success` / `data` / `error`） | `npm run typecheck` ／ `test:gcp-transport` | `src/services/api.ts` の `ApiClient` | ✅ |
| 入力検証パターン | `npm run test:single-source`（二重定義の検出） | `src/shared/validators.ts` | ✅ |
| メール差し込みタグ | `npm run test:mail-merge-tags` ／ `test:mailrender` | `src/shared/mailTemplates.ts` ／ `renderMergeTags_` | ✅ |
| メール送信の出口（4 段ガード） | `npm run test:mail-settings` ／ `test:mail-settings:e2e` ／ dryRun | `deliverMail_` → `sendEmailWithValidatedFrom_` | ✅ |
| CSV 出力（UTF-8 BOM・20,000 行上限・除外テーブル） | `npm run test:data-export` | データ出力の action | ✅ |
| 削除のアーカイブ移動と復元 | 削除 cascade の dryRun | `ARCHIVE_SOURCE_TABLES`（13） | ⚠️ |

## 6. スキーマ・設定の変更手順（TRD 第1部 §17 が正本）

| ID | 検証方法 | 戻し方 | 状態 |
|---|---|---|---|
| MG-01 列の追加・改名・削除 | `npm run test:er-sync` ／ `runRebuildSchemaForV<版>` の戻り値 | 前版へ `clasp redeploy`（列は残るが空。破壊的でない） | ✅ |
| MG-02 システム設定値の追加 | dryRun で既定値が入ることを確認 | 前版へ redeploy | ✅ |
| MG-03 権限・メニューの追加 | `npm run test:menu-registry` | 前版へ redeploy | ✅ |

## 7. 用語（SOW §2 が正本）

TM-01〜TM-13 は**検証の対象ではない**（定義であり、実装を持たない）。
ただし `AGENTS.md` §4.4 の表記規約に従い、**画面文言のレビュー時に同義語の混入を確認する**。

## 8. 未確定事項の追跡

**正本は SOW §8（U-01〜U-26）**。本書は再掲しない。
状態・取得方法は差分台帳 [`docs/261`](261_SPEC_CODE_DIFF_2026-09-03.md) を参照する。

## 9. この一覧の保守

- **要件を足したら、同じターンでこの表にも 1 行足す**（`AGENTS.md` §3 の同期則）。
- 検証方法の欄を空欄にしない。自動化できない場合は「**未検証**」と理由を書く。
- ⚠️ / ⛔ が付いた行は**放置しない**。解消したら状態を ✅ に更新し、`docs/portal/test-report.html` を再生成する。
- この表の機械検査は無い（U-22 の `test:docs-single-source` を実装する際に、
  **5 文書の ID がすべて本書に現れることの検査**を併せて入れる）。
