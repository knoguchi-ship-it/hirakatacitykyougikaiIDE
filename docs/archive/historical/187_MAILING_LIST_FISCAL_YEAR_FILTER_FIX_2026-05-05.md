# 宛名リスト年度基準・検索共通化修正

作成日: 2026-05-05
状態: 実装済み・production deploy 済み（v305 / admin @65）

## 1. 背景

宛名リスト出力コンソールで、年会費納入フィルターを「未納」にした際、選択年度に会員ではなかった者が未納として表示される可能性があった。

原因は、宛名リスト候補生成が現在の `会員状態コード` だけを見ており、`入会日` / `退会日` を選択年度に対して判定していなかったこと。また対象年度の `T_年会費納入履歴` がない会員を、年度内会員かどうかに関係なく `UNPAID` として扱っていたこと。

## 2. 修正方針

- 年度基準の会員判定を `getMemberFiscalSnapshot_(memberRow, fiscalYear)` に集約する。
- 年度内に会員だった者は、年度途中退会者を含めて対象とする。
- 年度開始前に退会済み、または年度末後に入会した者は対象外とする。
- 年会費の「履歴なし = 未納」は、年度内会員と判定された者にのみ適用する。
- 氏名検索はスペース有無に依存しない共通検索正規化を使う。

## 3. 変更内容

- `gas-src/Code.full.gs`
  - `getMemberFiscalSnapshot_()` を追加。
  - `isAnnualFeeEligibleMemberForYear_()` を共通 snapshot 判定へ委譲。
  - `buildMailingListCandidates_()` を年度 snapshot 判定へ変更。
  - `getMembersForRoster_()` も年度 snapshot 判定へ変更。
  - GAS 側検索用に `matchesSearchQuery_()` を追加し、削除コンソール検索へ適用。
  - `normalizeDateInput_()` は `YYYY-MM-DD` を厳密に処理し、日付だけの文字列比較で年度境界がずれないようにした。
- `src/utils/search.ts`
  - `matchesSearchQuery()` を追加。`姓 名` と `姓名`、`セイ メイ` と `セイメイ` の両方に対応。
- `src/components/MailingListExport.tsx`
  - キーワード検索を共通検索関数へ変更。
  - 状態表示を年度基準の「年度内退会」へ調整。
- `src/components/AnnualFeeManagement.tsx` / `BulkMailSender.tsx` / `OfficerManagement.tsx` / `MemberDetailAdmin.tsx` / `src/App.tsx`
  - 既存の `toLowerCase().includes()` 検索を共通検索関数へ寄せた。

## 4. 検証

- `npm run build:gas:admin`: PASS
- `npm run typecheck`: PASS
- `npm run security:admin-boundary`: PASS
- `git diff --check`: PASS（CRLF warning のみ）
- `cd gas/admin && npx clasp push`: PASS
- `cd gas/admin && npx clasp version "v305 mailing list fiscal-year filter and shared search fix"`: PASS。Created version `65`
- `cd gas/admin && npx clasp redeploy ... --versionNumber 65`: PASS。admin fixed deployment `@65`
- `cd gas/admin && npx clasp deployments --json`: admin `@65` を確認。
- `cd gas/member && npx clasp deployments --json`: member `@44` 維持を確認。
- `npx clasp deployments --json`: integrated/public `@290` x2 維持を確認。

## 5. Operator Verification Pending

実ブラウザ確認は操作者側で実施する。

- 宛名リストで `2025年度`、年会費納入 `未納` を選び、年度開始前退会者・年度末後入会者が候補外になること。
- 年度途中退会者が候補に残り、状態が「年度内退会」と表示されること。
- 年会費履歴なしが「未納」になるのは年度内会員だけであること。
- 氏名検索で `山田太郎` と `山田 太郎` の双方が同じ対象にヒットすること。

## 6. Documentation Alignment

- `docs/188_RELEASE_STATE_v305_2026-05-05.md` に production deploy 証跡とドキュメント整合更新を記録済み。
- `docs/02_ARCHITECTURE.md` に年度基準判定と共有検索の処理図を追記済み。
- `docs/03_DATA_MODEL.md` に物理スキーマ変更なし、派生モデル `MemberFiscalSnapshot`、ER補助図を追記済み。
- `docs/04_DB_OPERATION_RUNBOOK.md` に運用確認手順を追記済み。
- `docs/39_IMPLEMENTATION_BEST_PRACTICES_2026-03-31.md` に共通ロジック品質ルールを追記済み。
- `docs/63_SOW_ROSTER_PDF_AND_BULK_MAIL_2026-04-10.md` と `docs/66_ROSTER_TEMPLATE_GUIDE_2026-04-10.md` に現行 semantics を追記済み。