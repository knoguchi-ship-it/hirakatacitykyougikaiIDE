# Business Member Directory View Phase 1

作成日: 2026-05-04
状態: `v299` として admin split `@59` へ反映済み。`v300` で事業所単位の表示専用ビューから、事業所職員単位の一覧・一括編集/一括保存へ拡張済み。`v302` 以降は `adminDashboardData.staffRows` を正とし、`v303` で旧 cache 対策済み。

## 1. 目的

会員管理コンソールで事業所会員を探しにくい問題を、既存会員管理内の「事業所会員」ビューで改善する。

## 2. 採用方針

- v299 / v300 時点では新規 GAS API は追加しない。v302 で既存 `getAdminDashboardData_()` の返却値に `staffRows` を追加した。
- DB スキーマは変更しない。
- 管理者認証・認可・保存 API は変更しない。
- 現行は `adminDashboardData.staffRows` を優先し、未提供時のみ既存の `members` state に fallback する。
- 編集は既存の `MemberDetailAdmin` へ遷移して行う。
- `v300` 以降、氏名・カナ・メール・区分・在籍状況は一覧上の一括編集/一括保存にも対応する。保存時のみ既存 `updateStaff` API を呼び出す。
- タブ切替、検索、ページングでは GAS API を呼ばない。

## 3. 速度・堅牢性の条件

- 検索入力は React `useDeferredValue` で一覧再計算を低優先化する。
- 表示は既存のページサイズ設定を使い、1ページ最大 100 行に抑える。
- 現行の検索対象は事業所番号、事業所名、職員ID、職員氏名、職員カナ、職員メール、CM番号、区分、在籍状況とする。
- v299 の表示専用ビューでは代表者不在、メール未設定、事業所番号なしを一覧上で検出した。v300 以降の現行一覧は職員単位の編集対象に絞る。
- 速度改善目的で `fetchAllDataFromDb_()`、CacheService、認証境界、保存 API を変更しない。

## 4. 変更ファイル

| File | Change |
|---|---|
| `src/App.tsx` | 会員管理内に「会員一覧 / 事業所会員」表示切替を追加。事業所会員ビューを既存 state から派生。 |
| `gas/admin/index.html` | admin artifact 再生成。 |

## 5. 検証

- `npm run typecheck`: PASS
- `npm run build:gas:admin`: PASS

## 6. 操作者確認待ち

- 実ブラウザ確認は未実施。操作者確認では、タブ切替・検索・ページングで追加 API 通信が発生しないこと、行クリックで既存会員詳細へ遷移することを確認する。
