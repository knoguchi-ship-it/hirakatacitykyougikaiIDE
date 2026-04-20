# 開発引継ぎ

更新日: 2026-04-20
現行本番: `v248`（GAS version 248）
固定 deployment: member `@248` / public `@248`

## 0. v248 本番稼働中

**詳細リリース記録: `docs/114_RELEASE_STATE_v248_2026-04-20.md`**

### v248（2026-04-20）— セキュリティ是正: 会員セッショントークン・deny-by-default 完成

- **IDOR 修正**: 会員 API に `CacheService` ベースセッショントークン検証ゲートを追加。クライアント申告の `loginId/memberId/staffId` をサーバー値で上書き
- **管理者ログイン修正**: `checkAdminBySession` / `adminLoginWithData` が deny-by-default で blocked になっていたバグを `ADMIN_LOGIN_ACTIONS` 新設で修正
- **管理者機能修正**: `fetchAllData` + roster系5アクション + `generateMailingListExcel` がレジストリ未登録だった問題を修正
- **sessionToken 発行**: `memberLogin_` がログイン成功時に UUID を発行し CacheService に 30分保存
- **フロントエンド**: `GasApiClient` に `setMemberSessionToken` を追加し、全会員 API に自動付与
- **CM番号タスク記録**: `docs/113_TASK_CM_NUMBER_EDIT_POLICY_2026-04-20.md` に次フェーズ課題として記録
- **fixed deployment**: member / public ともに `@248` へ同期済み

### v247（2026-04-20）— 職員氏名/フリガナ入力を分割 UI に統一

### v247（2026-04-20）— 職員氏名/フリガナ入力を分割 UI に統一

- **会員マイページ**: `src/components/MemberForm.tsx` の職員欄を `氏 / 名 / セイ / メイ` 分割入力へ変更
- **管理者コンソール**: `src/components/MemberDetailAdmin.tsx` の「新規職員追加」も同じ分割入力へ変更
- **backend 互換維持**: 保存時は `name` / `kana` を再合成して既存 API・既存データ構造と整合
- **fixed deployment**: member / public ともに `@247` へ同期済み
- **補足**: `clasp run healthCheck` / `getDbInfo` は今回 `Unable to run script function. Please make sure you have permission to run the script function.` で未確認

### v246（2026-04-19）— 会員マイページ保存の loginId アンカー統一・旧 version 整理

- **保存経路修正**: `src/App.tsx` の会員保存で `authenticatedContext.memberPortalLoginId` を優先して `updateMemberSelf` へ渡すよう統一
- **表示と保存のアンカー整合**: `MemberForm` に渡す `loginId` も同じ解決ルールへ変更
- **旧 version 整理**: Apps Script Project History で古い version を削除し、現在は `227`〜`246` の 20 件だけを保持
- **fixed deployment**: member / public ともに `@246` へ同期済み

### v245（2026-04-19）— MemberForm 職員行 UI 全面改修・バリデーション根本修正

- **根本バグ修正**: `handleSubmit` で `isNew` strip 後に `validate()` を呼んでいたためメール/CM番号バリデーションが無効化されていた → `validate()` を先に呼ぶよう修正
- **介護支援専門員番号フィールド**: 新規追加行に必須入力として追加（8桁半角数字チェック）
- **カード型2列グリッドレイアウト**: 氏名/フリガナ2列、メール全幅、CM番号+状態/権限2列
- **取消ボタン**: カードヘッダー右端に配置
- GAS 200バージョン上限に到達 → 操作者が古いバージョンを手動削除して v245 作成

### v244（2026-04-19）— `MemberForm.tsx` isNew ドラフト職員行の修正（部分的・v245で完全修正）

会員マイページ（MemberForm.tsx）の事業所職員追加 UX を修正。
- 完全空白の追加行は保存時にスキップ（バリデーションをブロックしない）
- 追加行に「取消」ボタンを追加（行を削除可能）
- 非空白の追加行にはメールアドレス必須チェックを適用
- v243 で管理者コンソール（MemberDetailAdmin.tsx）に適用した isNew 概念を会員マイページ側にも展開
- v239〜v243 の git 未コミット状態を一括解消（コミット `cf503e9`）

### 2026-04-20 追記 — セキュリティ是正の準備文書を追加

- `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md`: 最新一次ソース基準の第三者評価
- `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md`: 公開 URL 維持を前提にした是正計画
- `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`: 次担当がそのまま実装に着手するための詳細設計
- 方針は `public / member / admin` の3境界を最終形とし、実装は段階分離で進める
- 公開ポータルは匿名アクセスを維持するが、匿名許可 action は公開申請系だけに限定する

### このセッション（2026-04-18〜19）で解決した問題

**v238 — 会員種別変換に再活性化パターン導入（設計変更）**
- 個人⇔事業所職員の往復変換を繰り返すと T_会員・T_事業所職員 の行が無限に蓄積していた根本問題を解消。
- `convertStaffToIndividual_`: CM番号で既存 WITHDRAWN 行を探し、あれば再活性化（ACTIVE に戻す）。ない場合のみ新規作成。
- `convertIndividualToStaff_`: CM番号 × 事業所で既存 LEFT 行を探し、あれば再活性化（ENROLLED に戻す）。ない場合のみ新規作成。
- 入会日は再活性化日（today）。年会費履歴は memberId 再利用により**自動継承**（コード変更不要）。
- 両方向ともに DB 変更前の事前チェックに統一。危険な post-check は廃止。

**v237 — 転籍ドロップダウン検索・CM番号重複修復 API**
- 「既存個人会員を転籍モーダル」に名前・会員番号でのリアルタイム検索フィルタを追加。
- `repairMemberCareManagerDuplicates_()` を MASTER 専用 API・UI として追加（データ管理コンソール）。

**v236 — 事業所会員ページから個人/賛助会員を転籍できる機能追加**
- 事業所会員詳細に「既存会員を転籍」ボタン追加。
- 職員追加フォームの CM 番号フィールド追加・DB 保存バグ修正。
- 賛助会員転籍時の CM 番号入力フロー整備。

### データ管理コンソール 修復機能（v238 時点）

| ボタン | 対象 | 権限 |
|---|---|---|
| 重複在籍レコードを修復する | T_事業所職員 ENROLLED 重複 | MASTER |
| 研修申込の申込者IDを修復する | T_研修申込 申込者ID≠会員ID | MASTER |
| 会員CM番号重複を修復する | T_会員 同一CM番号 ACTIVE 重複 | MASTER |

### v235 以前の主要履歴（継続有効）

- **v235**: loginId をセッションアンカーに変更。ロール変換後のマイページ表示不整合を修正。詳細: `docs/98_RELEASE_STATE_v235_2026-04-18.md`
- **v234**: `migrateTrainingApplications_` に申込者ID同期追加。`repairTrainingApplicationApplicantIds_()` 追加。
- **v233**: 事業所職員重複バグ修正 + `repairDuplicateStaffRecords_()` 追加。
- **v232**: MASTER 専用物理削除機能（データ管理コンソール）。T_削除ログ初回は `npx clasp run addDeleteLogSheet` が必要。
- **v231〜v226**: 郵便番号標準化・公開ポータル文言設定・入会申込フォーム改善。詳細: `docs/94_RELEASE_STATE_v231_2026-04-17.md` 〜 `docs/89_RELEASE_STATE_v226_2026-04-17.md`

## 1. 最初に読むもの

**再開直後は必ずこの順で確認する:**

1. `HANDOVER.md`（本ファイル）
2. `AGENTS.md`（グランドルール）
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`（作業プロセス正本）
5. **`docs/114_RELEASE_STATE_v248_2026-04-20.md`** ← **最新（v248）セキュリティ是正: 会員セッショントークン・IDOR修正**
6. `docs/108_RELEASE_STATE_v247_2026-04-20.md`（v247: 職員氏名/フリガナ入力を分割 UI に統一）
6. `docs/107_RELEASE_STATE_v246_2026-04-19.md`（v246: 会員マイページ保存の loginId アンカー統一・旧 version 整理）
7. `docs/106_RELEASE_STATE_v245_2026-04-19.md`（v245: 会員マイページ職員追加 UI 全面改修・バリデーション根本修正）
8. `docs/105_RELEASE_STATE_v244_2026-04-19.md`（v244: 会員マイページ職員追加 UX 修正・git 未コミット解消）
9. `docs/104_RELEASE_STATE_v243_2026-04-19.md`（v243: 管理者コンソール職員追加 UX 修正）
10. `docs/103_RELEASE_STATE_v242_2026-04-19.md`（v242: batch read 最適化 + v239〜v241 本番反映）
11. `docs/102_RELEASE_STATE_v241_2026-04-19.md`（v241: 単一運用URLを正本化）
12. `docs/101_RELEASE_STATE_v240_2026-04-19.md`（v240: 管理者セッション識別子分離・管理権限即時反映）
13. `docs/100_RELEASE_STATE_v239_2026-04-19.md`（v239: 事業所職員メール必須化・空行許容・メール欄拡張）
14. `docs/99_RELEASE_STATE_v238_2026-04-19.md`（v236〜v238: 再活性化パターン・転籍検索・修復API）
15. `docs/98_RELEASE_STATE_v235_2026-04-18.md`（v232〜v235: 物理削除・重複修正・セッション設計刷新）
16. `docs/94_RELEASE_STATE_v231_2026-04-17.md`（v231: 郵便番号標準化 + 年会費連続年度表示）
16. `docs/92_RELEASE_STATE_v229_2026-04-17.md`（v229: 年会費表示修正）
17. `docs/91_RELEASE_STATE_v228_2026-04-17.md`（v228: 公開入会申込 完了画面 + 住所改善）
18. `docs/90_RELEASE_STATE_v227_2026-04-17.md`（v227: 公開ポータル文言設定）
19. `docs/79_HANDOVER_2026-04-15.md` ← 機能一覧・運用・落とし穴まとめ（v208 時点、現在も有効）
20. `docs/09_DEPLOYMENT_POLICY.md`（デプロイ標準・**`clasp deploy` 全面禁止**の根拠）
21. `docs/05_AUTH_AND_ROLE_SPEC.md`
22. `docs/04_DB_OPERATION_RUNBOOK.md`
23. `docs/03_DATA_MODEL.md`（スキーマ）
- v225〜v226 記録: `docs/88_RELEASE_STATE_v225_2026-04-17.md` / `docs/89_RELEASE_STATE_v226_2026-04-17.md`
- v209〜v224 記録: `docs/80〜87_RELEASE_STATE_*`
- v197〜v208 記録: `docs/75〜79_*` または `docs/archive/release_history/`

## 2. 現在の引継ぎ結論
- 開発の入口は `HANDOVER.md`、運用手順の正本は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`。
- 本番状態の判断は `HANDOVER.md`、作業の進め方と完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` に記録する。
- 最新の release state 文書は `HANDOVER.md` の「最初に読むもの」に記載されたものを参照する。
- task 単位の個票は `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して管理する。
- 2026-04-10 の引継ぎ確認ログは `docs/archive/historical/65_HANDOVER_TASK_DEV_SETUP_2026-04-10.md` を参照する。
- 2026-04-19 に非引継ぎ文書の棚卸しを実施済み。再開直後は本書と release state 群だけで開始し、個別論点が発生した時だけセクション 8 の対応表から深掘り先を開けばよい。

## 3. 現在の本番状態
- ブランチ運用の基準は `main`。
- 両 fixed deployment は `@247` を向いている（GAS version 247）。差異が出た場合はセクション 6 の runtime 確認結果を優先する。
- **操作者の正規入口 URL は単一で** `https://script.google.com/a/macros/hcm-n.org/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec` を用いる。`?app=public` を付けた同一 base URL を公開ポータルとして扱う。
- fixed deployment の標準同期方法は `npx clasp redeploy`。Apps Script UI `Manage deployments` は障害復旧時の補助手段に限定する。
- member portal は sidebar logout を採用済み。
- デモログイン、mock member route、画面内 demo selector は廃止済み。
- business member は `REPRESENTATIVE` 行を代表者情報の正本とする。
- 個人会員 / 居宅介護支援事業者所属でない会員は、`officeName` が空または `????` の場合に所属なしとして正規化する。
- デモアカウント（本番 DB）: `demo-ind-001` / `demo1234`（個人会員）、`demo-ind-002` / `demo1234`（個人会員）。
- 管理者ログイン: `checkAdminBySession`（auth のみ）。会員データは遷移後の遅延取得。
- フロントエンド HTML 圧縮: deflate-raw + base64（`scripts/compress-html.mjs`）。member ~230 kB / public ~155 kB。
- **公開ポータル文言設定**: `T_システム設定` の `PUBLIC_PORTAL_*` キーで、トップ補助ラベル・トップ見出し・トップ説明文・入会カードの補助ラベル/見出し/説明文/CTA を管理。管理者画面から表示ON/OFFと文言変更が可能。
- **設定保存**: `getSystemSettingMap_` + `batchUpsertSystemSettings_` による 1 パス処理（旧 N+1 解消済み）。
- **セイ・メイ入力**: 入力中は全文字許可。保存時に全角カナ・ひらがな → 半角カナへ自動変換（v220〜）。
- **年度集計**: ダッシュボードのカード数値はフロントエンドが `memberRows` から再計算（バックエンドの `individualCount` 等は UI 未使用）。

## 4. 直近の重要履歴

### v243（2026-04-19）— 詳細: `docs/104_RELEASE_STATE_v243_2026-04-19.md`
事業所会員詳細の新規職員追加 UI を修正。完全空白行は保存前に除外し、部分入力行には `氏名 / フリガナ / メールアドレス / 介護支援専門員番号` の必須チェックを適用。`取消` ボタンがモーダル幅で見切れにくい配置に修正した。
ただし、操作者実ブラウザ確認では「会員マイページから事業所会員情報を変更する際の問題」が未解決のまま残った。管理者 Google ログインでも通常の会員 `ID/パスワード` ログインでも同じ結果で、スーパーリロード後も改善しなかったため、次担当者はキャッシュ以外の真因を再鑑定すること。

### v242（2026-04-19）— 詳細: `docs/103_RELEASE_STATE_v242_2026-04-19.md`
`fetchAllDataFromDbFresh_()` の batch read 最適化を本番反映。あわせて v239〜v241 相当の未反映差分を `@242` に統合し、事業所職員メール必須化、管理者セッション識別子分離、単一運用 URL を本番状態として揃えた。

### v241（2026-04-19）— 詳細: `docs/102_RELEASE_STATE_v241_2026-04-19.md`
運用上の正本 URL を `AKfycbxy.../exec` に統一。コード上の `MEMBER_PORTAL_URL`、会員向け導線、文書の入口を運用実態に合わせて揃えた。

### v240（2026-04-19）— 詳細: `docs/101_RELEASE_STATE_v240_2026-04-19.md`
管理者 Google セッションの識別子と会員マイページ用 loginId を分離。管理者がプロフィール画面へ入ると `認証アカウントが見つかりません` になる不具合を修正し、管理権限変更時の `admin_wl_v1` / `admin_auth_v1` キャッシュを即時無効化。

### v239（2026-04-19）— 詳細: `docs/100_RELEASE_STATE_v239_2026-04-19.md`
事業所職員追加でメールアドレスを必須化。完全空白の追加行は保存対象から除外し、メール欄の視認性を改善。個人/賛助会員からの転籍は、転籍元会員にメールアドレスが未登録なら拒否する。

### v238（2026-04-18）— 詳細: `docs/99_RELEASE_STATE_v238_2026-04-19.md`
会員種別変換に**再活性化パターン**を導入。往復変換によるレコード蓄積を根絶。年会費履歴が memberId 再利用で自動継承。

### v237（2026-04-18）— 詳細: `docs/99_RELEASE_STATE_v238_2026-04-19.md`
転籍ドロップダウンに検索フィルタ追加。`repairMemberCareManagerDuplicates_()` を MASTER API・UI として追加。

### v236（2026-04-18）— 詳細: `docs/99_RELEASE_STATE_v238_2026-04-19.md`
事業所会員ページから既存個人/賛助会員を転籍できる機能追加。CM番号フィールドのバグ修正。

### v235（2026-04-18）— 詳細: `docs/98_RELEASE_STATE_v235_2026-04-18.md`
loginId をセッションアンカーに変更。ロール変換後のマイページ表示不整合を修正。

### v232〜v234（2026-04-18）— 詳細: `docs/98_RELEASE_STATE_v235_2026-04-18.md`
- v234: 研修申込 申込者ID同期修正 + `repairTrainingApplicationApplicantIds_()` 追加
- v233: 事業所職員重複バグ修正 + `repairDuplicateStaffRecords_()` 追加
- v232: MASTER専用物理削除機能（データ管理コンソール）。T_削除ログ初回は `npx clasp run addDeleteLogSheet` が必要

### v229（2026-04-17）— 詳細: `docs/92_RELEASE_STATE_v229_2026-04-17.md`
会員マイページの年会費履歴で前年・前々年が欠落しないよう修正。振込先フォールバック修正。

### v228（2026-04-17）— 詳細: `docs/91_RELEASE_STATE_v228_2026-04-17.md`
公開入会申込 完了画面制御 + 住所入力改善（勤務先必須化条件の修正）。

v209〜v226（2026-04-16〜17）の詳細は各 `docs/80〜89_RELEASE_STATE_*` を参照。
v195〜v208 の詳細は `docs/79_HANDOVER_2026-04-15.md` または `docs/archive/release_history/` を参照。

---

## 5. 現時点の注意事項（2026-04-20 更新）

- **fixed deployment 2 本は `@248`**（GAS version 248）。再開時は必ず `npx clasp deployments --json` で実測確認する。
- **Apps Script version 保持数**: 現在は `227`〜`248` の 22 件を保持。次回 version 作成前に必要なら古い version を再整理する。
- **会員セッショントークン（v248〜）**: ログイン成功時に UUID を発行し CacheService に 30分保存。会員 API は sessionToken 必須。フロントエンドは `GasApiClient.memberSessionToken` に保持。
- **操作者の正規入口 URL は単一で** `https://script.google.com/a/macros/hcm-n.org/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec` を用いる。
- **会員種別変換の設計（v238〜）**: 再活性化パターンにより、往復変換でも T_会員・T_事業所職員 の行は増えない。過去の重複 WITHDRAWN 行はデータ管理コンソール「会員CM番号重複修復」で整理できる。
- **v206 DB 適用済み**: `T_会員` に `勤務先住所2` / `自宅住所2` 列が追加済み。`addAddressLine2Columns` の再実行は不要。
- **名簿出力コンソール（RosterExport）**: システム設定で `ROSTER_TEMPLATE_SS_ID` を登録すること。
- **一括メール送信（BulkMailSender）**: Drive 自動添付を使う場合は `BULK_MAIL_AUTO_ATTACH_FOLDER_ID` を登録すること。
- **公開ポータル文言変更**: 管理設定 → 公開ポータル メニュー表示設定 → 保存 → 公開ポータルをリロード。
- **GAS キャッシュ TTL 600秒**: 一般データキャッシュは最大 600 秒残る。管理者 Google ホワイトリスト / 認証紐付け変更は v240 で即時 invalidation 対応済み。
- **AI 案内メール**: `GEMINI_API_KEY` が Script Properties に未設定だと動作しない。
- **joinedDate 未設定会員**: 数名程度残存。v221 修正で集計は正常化済みだが、管理コンソールから直接補完が望ましい。
- **B-02**: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md` の `fetchAllDataFromDbFresh_` 最適化は `v242` で本番反映済み。実ブラウザ体感確認は操作者側で継続確認する。
- **未解決課題**: 会員マイページから事業所会員情報を変更する際の問題は、`v243` 後も未解決。管理者 Google ログイン固有ではなく、通常の会員 `ID/パスワード` ログインでも再現し、スーパーリロード後も継続した。次フェーズで最優先調査対象とする。
- **第三者評価（2026-04-20）**: `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` を追加。匿名公開 Web アプリに対する backend API の認可境界不足が重大所見。次フェーズは機能追加より先に `processApiRequest` の deny-by-default 化と会員 API の server-side principal 強制を優先する。
- **T_削除ログ**: `addDeleteLogSheet` 実施済み（v232 以降）。再実行不要。

## 6. 再開時チェック

```bash
git status --short
npx clasp show-authorized-user
npx clasp deployments --json
npx clasp run healthCheck
npx clasp run getDbInfo
```

**期待値（v247 時点）:**
- authorized user: `k.noguchi@hcm-n.org`
- fixed deployment 2 本が `@247`（versionNumber: 247）
- `npx clasp run healthCheck` / `getDbInfo` は、認証状態によっては `Unable to run script function. Please make sure you have permission to run the script function.` で失敗し得る。失敗時は認証状態を再点検する。

**⚠️ `clasp run` が "Unable to run script function" で失敗する場合:**
```bash
npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost
```
ブラウザ認証後、リダイレクト URL の `code=` 値をターミナルにペーストする。

2026-04-20 確認結果（v248 リリース後）:
- `npx clasp deployments --json` → member + public ともに `versionNumber: 248` ✅
- `npx clasp show-authorized-user` → `k.noguchi@hcm-n.org` ✅
- `npm run typecheck` ✅
- `npm run build:gas` ✅
- `npx clasp push --force` ✅（4 files pushed）
- `npx clasp version` ✅（version 248 created）
- `npx clasp run healthCheck` → 認証状態次第で失敗し得る（再認証後に再試行すること）
- 実ブラウザ確認 → 操作者側で実施すること（確認ポイントは docs/114 参照）

## 7. 次担当者の最初の一手

1. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` の「作業開始チェック」を実施する。
2. セクション 6 の再開時チェックを実行し、deployment が `@247` であることを実測確認する。
3. **`clasp run` が失敗する場合**: 上記 `clasp login --creds` コマンドで project-scoped OAuth を再取得する。
4. **データ管理コンソールで修復を実行**（v236〜v238 で生じた既存の CM 番号重複行がある場合）:
   - 管理者ログイン → データ管理 → 「会員CM番号重複修復」ボタンを実行
   - 修復件数と対象会員 ID を確認する
5. **変換動作を実ブラウザで確認**（v238 再活性化パターン）:
   - 個人会員 → 事業所職員 転籍 → 個人会員 に戻す、を1会員で実施
   - T_会員・T_事業所職員 の行が増えていないこと（WITHDRAWN 行が再利用されること）を確認
6. 残課題に着手する場合: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`（B-02）を参照する。
7. **変更後は必ず `HANDOVER.md` と関連 docs を同ターンで更新する。**
8. **最優先の未解決調査**: 会員マイページから事業所会員情報を変更する際の問題を再現し、`getMemberPortalData` 返却、`updateMemberSelf_` 保存結果、`T_会員 / T_事業所職員 / T_認証アカウント` 実データ、会員画面の表示状態を突き合わせて真因を特定する。管理者ログイン固有問題・単純キャッシュ問題として片付けない。
   - 2026-04-19 対応メモ: `src/App.tsx` では保存時にログイン画面の `memberLoginId` を優先して `updateMemberSelf` へ渡していたため、`authenticatedContext.memberPortalLoginId` を優先する実装修正を `v246` として本番反映済み。次担当者は実ブラウザで再現有無を確認し、未解決なら backend 側の保存結果と DB 実データまで掘ること。
9. 次フェーズで「デモデータ削除 / DB デバッグ機能」に着手する場合は、実装前に task 個票を切り、承認境界・対象テーブル・バックアップ前提・ロールバック方法を先に整理する。

## 8. 論点別の深掘り先
- プロダクト要件・役割整理: `docs/01_PRD.md`
- UI/API/コンソール構成: `docs/02_ARCHITECTURE.md`
- スキーマ・列定義・JSON仕様: `docs/03_DATA_MODEL.md`
- DB 操作、初期化、バックアップ、復旧: `docs/04_DB_OPERATION_RUNBOOK.md`
- 認証・認可・管理者 Google whitelist: `docs/05_AUTH_AND_ROLE_SPEC.md`
- 本番 deploy / redeploy / `/exec` 404 切り分け: `docs/09_DEPLOYMENT_POLICY.md`
- 退会・削除フラグ・年度末自動昇格: `docs/11_WITHDRAWAL_DELETION_POLICY.md`
- `clasp run` 権限障害の復旧: `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`
- 障害対応の RCA 標準手順: `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`
- 年会費管理コンソールの設計意図: `docs/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md`
- 公開ポータル申込統合の設計意図: `docs/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md`
- 個人情報保護・保管期間・外部申込者運用: `docs/36_DATA_PROTECTION_PROCEDURES.md`
- GAS 制約・タイムアウト前提: `docs/37_GAS_QUOTAS_AND_LIMITS.md`
- 実装時の共通注意: `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md`
- 未完了の性能課題 B-02: `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`
- 名簿出力 / 一括メールの SOW 完了設計: `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md`
- 名簿テンプレートの作り方・検証方法: `docs/66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md`

## 9. 引継ぎ体制メモ
- 入口は `HANDOVER.md`、日次運用は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`、固定記録は `HANDOVER.md` に記載された最新の release state 文書を参照する。
- グランドルール入口は `AGENTS.md` のみ。`CLAUDE.md` は `AGENTS.md` へつなぐ互換入口としてのみ保持する。
- 新規 task は現行テンプレート `docs/31_HANDOVER_TASK_TEMPLATE.md` を複製して起票する。
- push や deploy 前は `git diff` でスコープを確認してからファイル単位でステージングすること。

## 2026-04-15 GCP / CLI migration note
- Current operational Google account for CLI and Cloud is `k.noguchi@hcm-n.org`.
- Current linked standard GCP project is `hcmn-member-system-prod`.
- Current linked GCP project number is `88737175415`.
- Apps Script project settings were switched from old project number `995586177540` to `88737175415` on 2026-04-15.

## 2026-04-16 deployment note (v216)
- Production release `v216` is now deployed.
- Fixed deployments were synced as member `@216` / public `@216`.
- Personal-member validation rules were revised in both member portal and admin console.
- Latest release-state reference: `docs/83_RELEASE_STATE_v216_2026-04-16.md`

## 2026-04-16 deployment note (v217–v219)
- v217: ブラウザタブ title カスタマイズ（favicon は GAS 制約で断念）
- v218: favicon PNG data URI テスト → GAS は全形式の data URI を拒否（`setFaviconUrl()` は外部 HTTPS URL のみ）
- v219: 入会メール マージタグ（`{{会員種別}}` / `{{年会費}}`）+ テンプレート保存/読み込み機能
- Latest release-state reference: `docs/83_RELEASE_STATE_v216_2026-04-16.md`（v216 記録）

## 2026-04-16 deployment note (v220–v221)
- v220 (GAS 220): セイ・メイ自動変換 + 年度内在籍判定修正
- v221 (GAS 221): 年度集計 joinedDate 空会員バグ修正（フロントエンド主因 + バックエンド日付パース修正）
- Both fixed deployments redeployed to GAS version 221 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 221`.
- Latest release-state reference: `docs/84_RELEASE_STATE_v221_2026-04-16.md`

## 2026-04-16 deployment note (v222)
- v222 (GAS 222): 公開ポータルの新規入会申込フォーム先頭に「事務局からのお願い」を追加
- 重要事項の確認チェックを入れるまで会員種別選択を不可に変更
- 協議会ホームページ導線は Google Sites 直リンクへ変更
- Both fixed deployments redeployed to GAS version 222 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 222`.
- Latest release-state reference: `docs/85_RELEASE_STATE_v222_2026-04-16.md`

## 2026-04-16 deployment note (v223)
- v223 (GAS 223): 公開ポータルの入会前案内をダイアログ方式へ変更
- 「変更・退会の手続き」カード内に協議会ホームページ導線を配置
- ダイアログ内に定款リンクを追加
- Both fixed deployments redeployed to GAS version 223 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 223`.
- Latest release-state reference: `docs/86_RELEASE_STATE_v223_2026-04-16.md`

## 2026-04-16 deployment note (v224)
- v224 (GAS 224): 一括メール送信コンソールにテンプレート保存・読込・削除 UI を追加
- バックエンドに `BULK_MAIL_TEMPLATES` キーを用いたテンプレート保存 API を追加
- Drive フォルダからの個別自動添付は既定値を `OFF` に変更し、明示チェック時のみ有効
- Both fixed deployments redeployed to GAS version 224 on 2026-04-16.
- `npx clasp deployments --json` confirmed: member + public both at `versionNumber: 224`.
- Latest release-state reference: `docs/87_RELEASE_STATE_v224_2026-04-16.md`

## 2026-04-17 task note
- Public `submitMemberApplication_` now has released transition logic keyed by `介護支援専門員番号` and `事業所番号`.
- Implemented locally:
  - business staff -> individual member
  - individual/support member -> applied business staff
  - business staff -> another business office staff
  - duplicate individual registration rejection
  - duplicate business office registration rejection by `事業所番号`
- Representative transfer now auto-picks a successor when the source office still has enrolled staff, and withdraws the source office when no staff remain.
- Local verification completed:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:gas`
- Release verification completed on Apps Script execution path and fixed deployment sync.

## 2026-04-17 deployment note (v225)
- v225 (GAS 225): 公開入会申込の会員種別遷移ルール、重要事項ダイアログ、一括メールテンプレート保存を本番反映。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@225` に同期。
- Verification passed:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:gas`
  - `npx clasp deployments --json`
  - `npx clasp run healthCheck`
  - `npx clasp run getDbInfo`
- Latest release-state reference: `docs/88_RELEASE_STATE_v225_2026-04-17.md`
- Detailed task handover: `docs/archive/historical/89_HANDOVER_TASK_v225_PUBLIC_MEMBERSHIP_TRANSITIONS_2026-04-17.md`

## 2026-04-17 deployment note (v226)
- v226 (GAS 226): 個人/賛助会員入会申込フォームの住所・連絡情報ステップを統合。フロントエンドのみの変更。
- 変更内容: 郵送先ラジオカード選択・事業所名任意化・電話番号OR必須・メールアドレスをStep2に統合・発送方法ラジオカード化。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@226` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅ (4 files pushed)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 226)
  - `npx clasp run healthCheck` ❌ (project-scoped OAuth 再設定が必要 — 次セッション開始時に再試行すること)
- Latest release-state reference: `docs/89_RELEASE_STATE_v226_2026-04-17.md`

## 2026-04-17 deployment note (v227)
- v227 (GAS 227): 公開ポータルのトップ案内文・入会カード文言を設定画面から変更可能にし、英語ラベルの既定値と冗長文言を整理。
- 既定値: `APPLICATION PORTAL` 非表示、`MEMBERSHIP` → `入会申込`、入会カードCTA → `入会申込へ進む`。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@227` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅
  - `npx clasp version` ✅ (version 227 created)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 227)
  - `npx clasp run healthCheck` ❌ (`Unable to run script function` — project-scoped OAuth 再設定が必要)
  - `npx clasp run getDbInfo` ❌ (`Unable to run script function` — 同上)
- Latest release-state reference: `docs/90_RELEASE_STATE_v227_2026-04-17.md`

## 2026-04-17 deployment note (v228)
- v228 (GAS 228): 公開入会申込の完了画面ログイン情報表示トグル、メール案内/振込案内メッセージ整理、勤務先郵送時の事業所名必須化、非選択住所の郵便番号バリデーション誤爆修正、勤務先・所属情報と郵送先住所のUI分離を本番反映。
- member/public の両 fixed deployment を `npx clasp redeploy` で `@228` に同期。
- Verification:
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` ✅
  - `npx clasp version` ✅ (version 228 created)
  - `npx clasp deployments --json` ✅ (member + public both at versionNumber: 228)
  - `npx clasp run healthCheck` ❌ (`Unable to run script function` — project-scoped OAuth / permission issue 継続)
  - `npx clasp run getDbInfo` ❌ (`Unable to run script function` — 同上)
- 実ブラウザ確認は既定どおり操作者側で実施する。AI / agent 側ではコード上の検証と Apps Script 実行系コマンド確認まで完了。
- Latest release-state reference: `docs/91_RELEASE_STATE_v228_2026-04-17.md`

## 2026-04-18 deployment note (v232)
- v232 (GAS 232): MASTER権限専用の物理削除機能を追加。
- 変更内容:
  - バックエンド: T_削除ログ テーブル定義追加 / searchMembersForDelete_ / previewDeleteMember_ / executeDeleteMember_ / getDeleteLogs_ / addDeleteLogSheet() 関数追加
  - フロントエンド: MemberDeleteConsole.tsx 新規作成 / Sidebar MASTER専用メニュー追加 / App.tsx view ルーティング追加
  - api.ts: MemberDeleteSearchResult / MemberDeletePreview / MemberDeleteResult / DeleteLogEntry 型追加 + API メソッド追加
- リリース手順（clasp 再認証後に実施）:
  1. `npx clasp push --force`
  2. `npx clasp version "v232 MASTER物理削除機能追加"`
  3. `npx clasp redeploy <member-deploy-id> --versionNumber 232`
  4. `npx clasp redeploy <public-deploy-id> --versionNumber 232`
  5. `npx clasp run addDeleteLogSheet`（T_削除ログ シート新設）
  6. `npx clasp deployments --json` で両 deployment が @232 であることを確認
- Verification（コード上）:
  - `npm run typecheck` ✅
  - `npm run build:gas` ✅
  - `npx clasp push --force` → 未実行（clasp 再認証待ち）
  - 実ブラウザ確認 → 操作者側で実施（MASTER権限でログイン → サイドバー「データ管理コンソール」表示確認）
- Latest release-state reference: `docs/98_RELEASE_STATE_v235_2026-04-18.md`

## 2026-04-20 member split side-by-side deployment note
- 既存 production fixed deployments は変更していない。現行 production は従来どおり member/public ともに `@247`。
- 会員マイページ分離用の別 Apps Script project を新規作成した。
  - Script ID: `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ`
  - Local root: `gas/member`
  - Local clasp config: `gas/member/.clasp.json`
- side-by-side deployment を version `1` で作成した。
  - Deployment ID: `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g`
  - Description: `member split side-by-side initial deployment from v247 baseline`
- 実施コマンド:
  - `npm run build:gas:member`
  - `npx clasp push --force` (`gas/member`)
  - `npx clasp version "member split side-by-side initial deployment from v247 baseline"` (`gas/member`) → version `1`
  - `npx clasp deploy -V 1 -d "member split side-by-side initial deployment from v247 baseline"` (`gas/member`)
  - `npx clasp deployments` (`gas/member`) ✅
- 確認結果:
  - 新規 member split project 側の deployment 一覧で `@1` を確認。
  - `curl -I https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec` は `403 Forbidden`。HEAD 応答のみの確認であり、実ブラウザの GET 疎通確認は未実施。
- 未了:
  - Apps Script UI で Web app の access / execute-as 表示確認
  - 実ブラウザで member split URL の表示確認
  - 必要に応じて member split project 専用 `appsscript.json` の scope 最小化

## 2026-04-20 admin split side-by-side deployment note
- 既存 production fixed deployments は変更していない。admin 分離は side-by-side のみ。
- admin 専用 build root と script project を追加した。
  - Local root: `gas/admin`
  - Local clasp config: `gas/admin/.clasp.json`
  - Script ID: `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi`
- 実施コマンド:
  - `npm run typecheck` ✅
  - `npm run build:gas:admin` ✅
  - `npx clasp push --force` (`gas/admin`) ✅
  - `npx clasp version "admin split side-by-side initial deployment from v247 baseline"` (`gas/admin`) → version `1`
  - `npx clasp deploy -V 1 -d "admin split side-by-side initial deployment from v247 baseline"` (`gas/admin`) ✅
  - `npx clasp deployments` (`gas/admin`) ✅
- 作成された deployment:
  - Deployment ID: `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os`
  - Description: `admin split side-by-side initial deployment from v247 baseline`
- 確認結果:
  - `npx clasp deployments` では `@1` を確認。
  - ただし `/exec` は generic URL / domain URL ともに `404 Not Found`。
  - したがって deployment object は存在するが、Web app としての到達確認は未完了。
- 未了:
  - Apps Script UI `Deploy > Manage deployments` で admin split deployment が Web app として作成されているか確認
  - 必要なら UI で Web app deployment を作り直し、確定した URL を記録
  - 実ブラウザで Google 管理者ログイン導線と主要画面（dashboard, training-manage）を確認
- 次担当者は、分離作業専用 handover として `docs/112_HANDOVER_TASK_PROJECT_SPLIT_SIDE_BY_SIDE_2026-04-20.md` を必ず参照すること。
- `docs/112_HANDOVER_TASK_PROJECT_SPLIT_SIDE_BY_SIDE_2026-04-20.md` には、次担当者の固定再開順、admin `/exec` 404 の切り分け順、UI 混線防止、response/performance guardrail を追記済み。分離作業はこの手順から外れないこと。
