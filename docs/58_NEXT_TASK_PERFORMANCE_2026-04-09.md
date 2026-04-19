# Next Task: サイト全体の読み込み・書き込み速度改善

作成日: 2026-04-09
依頼者: 野口 健太
現行本番: v187 / @187
ステータス: `phase1-2 complete / compression v191 / admin-login v192-v193 / phase3 B-02 released in v242`

## 背景・目的

読み込み・書き込み速度が非常に長く、使う側の強い負担となっている。
Google Apps Script (GAS) + Google Spreadsheet という構成固有の制約を前提として、
実装可能な範囲で体感速度を最大化することが目的。

## GAS 固有の制約（前提知識）

| 制約 | 内容 |
|---|---|
| コールドスタート | GAS 実行環境は一定時間後に破棄される。次の呼び出し時に再起動で +1〜3秒 |
| Spreadsheet API コスト | 1シート読み込み（`getValues()`）= 数百ms〜1秒 |
| `google.script.run` | 1回の API 呼び出しで最低 1〜3秒かかる |
| CacheService 上限 | 1エントリ 100KB 制限（現在はチャンキングで対応済み） |
| 実行時間上限 | 6分 |
| フロントエンド配信 | GAS iframe 内で毎回 HTML をダウンロード（CDN なし） |

## 現状のボトルネック分析（調査済み）

### 高優先度

#### B-01: `getMemberPortalData_()` が全研修データを毎回読み込む
- **場所**: `backend/Code.gs` の `getMemberPortalData_()`（line ~2663）
- **問題**: 会員マイページ表示のたびに `T_研修` 全件を `getRowsAsObjects_()` で読み込んでいる。
  会員が申し込んでいる研修だけを返せばよいのに、全研修を返している。
- **影響**: 研修数が増えるほどスキャン量と転送量が増大する。
- **対策**: 会員の `participatedTrainingIds`（申し込み済み研修ID）に一致する行だけをフィルタして返す。
  または、会員マイページ用に返す研修データを「申し込みステータスが必要な研修のみ」に限定する。

#### B-02: `fetchAllDataFromDbFresh_()` が6シートを順次スキャン
- **場所**: `backend/Code.gs` の `fetchAllDataFromDbFresh_()`（line ~2629）
- **問題**: `T_会員`・`T_事業所職員`・`T_認証アカウント`・`T_研修`・`T_研修申込`・`T_年会費納入履歴` の
  6シートを順次 `getRowsAsObjects_()` で読み込む。1シートあたり `getLastRow()` + `getLastColumn()` +
  `getRange().getValues()` の 3回 Spreadsheet API 呼び出し = 合計18回。
- **影響**: キャッシュミス時（コールドスタート直後・5分経過後）の初回ロードが 5〜10秒以上になる。
- **対策**:
  - `Spreadsheet.getSheets()` で全シートを一度に取得して参照を使い回す。
  - ヘッダー行と値を1回の `getRange(1, 1, lastRow, lastCol).getValues()` でまとめて読む（既存実装確認済み）。
  - 読み込み不要な列（削除済み会員の詳細など）をスキップする列フィルタを検討。

#### B-03: ウォームアップトリガーが実質機能していない
- **場所**: `backend/Code.gs` の `warmUp()`（line ~6954）
- **問題**: `CacheService.getScriptCache().get('warmup')` だけを実行しており、GAS実行環境のウォームアップ
  （JVM/V8の初期化、SpreadsheetApp の接続確立）には寄与していない。
- **影響**: 定期的にアクセスがない時間帯の初回アクセスに +2〜3秒のコールドスタートが発生。
- **対策**: `warmUp()` 内で `SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED)` を呼び、
  接続を確立しておく。または `fetchAllDataFromDb_()` を呼んでキャッシュを温める。
  GAS の時間ベーストリガーで5〜10分おきに実行する（トリガー設定は Apps Script UI で行う）。

### 中優先度

#### B-04: CacheService TTL が短い（300秒=5分）
- **場所**: `backend/Code.gs` line 14: `ALL_DATA_CACHE_TTL_SECONDS = 300`
- **問題**: 書き込み時はキャッシュクリアされるので整合性は保たれるが、
  5分ごとにキャッシュが切れて再スキャンが発生する。
- **対策**: 書き込み後クリアの実装が完全であることを確認したうえで、
  TTL を 600〜900秒（10〜15分）に延長する。
  年会費管理コンソールの TTL (`ANNUAL_FEE_CACHE_TTL_SECONDS = 300`) も同様に延長を検討。

#### B-05: 管理者ビュー切り替え時の不必要な `loadAppData` 呼び出し
- **場所**: `src/App.tsx` の `useEffect`（line ~548）
- **問題**: `fullDataLoaded` が false の場合、ビュー切り替えごとに `loadAppData` を呼ぶ。
  本来は一度ロードすれば足りるが、条件分岐が複雑で無用な呼び出しが発生するケースがある。
- **対策**: `loadAppData` の呼び出し条件を整理し、不必要な API 呼び出しを削減する。
  `appDataRequestRef` による de-duplicate は実装済みだが、`force: true` の呼び出しが多い箇所を確認する。

#### B-06: フロントエンドバンドルサイズ（528KB / gzip 131KB）
- **場所**: `vite.config.ts`、`src/` 全体
- **問題**: GAS iframe はキャッシュが制限されており、毎回 HTML をダウンロードする可能性がある。
  528KB（非圧縮）は大きく、低速回線や初回表示に影響する。
- **対策**:
  - Tailwind CSS の purge 設定が有効であることを確認（`vite build` で自動実行されている）。
  - 使用していない大型ライブラリがあれば削除または軽量代替を検討。
  - React DevTools の Bundle Analyzer（`vite-bundle-visualizer`など）でボトルネックを特定する。

### 低優先度

#### B-07: 管理コンソール会員一覧のレンダリング負荷
- 会員数が増えた場合、DOM ノード数が多くなり描画が遅くなる可能性がある。
- 仮想スクロール（react-virtual など）やページネーションの導入を検討。
- 現時点では会員数が少ないため、まず B-01〜B-05 の対策を優先する。

## 提案する実装順序

### Phase 1: バックエンド即効修正（効果大、リスク低）

1. **B-03 ウォームアップ強化**（所要: 30分）
   - `warmUp()` に `SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED)` を追加。
   - Apps Script UI でトリガーを確認・再設定（5〜10分おきに実行）。

2. **B-01 会員マイページ研修データ最適化**（所要: 1〜2時間）
   - `getMemberPortalData_()` の研修取得を会員申し込み分のみに絞る。
   - `getTrainingApplicationRows_` で取得した `applicationRows` の研修IDに一致する
     `T_研修` 行だけを返す実装に変更。
   - 会員マイページ用に「開催中・近い将来の研修」のみを含める選択肢も検討。

3. **B-04 キャッシュ TTL 延長**（所要: 15分）
   - `ALL_DATA_CACHE_TTL_SECONDS` を 300→600 に変更。
   - `ANNUAL_FEE_CACHE_TTL_SECONDS` を 300→600 に変更。
   - 各キャッシュクリア箇所（`clearAllDataCache_()` 等）が網羅されていることを再確認。

### Phase 2: フロントエンド改善（効果中、リスク低）

4. **B-05 `loadAppData` 呼び出し整理**（所要: 1〜2時間）
   - `force: true` の呼び出しを必要最小限に絞る。
   - 特に `openMemberDetail`（line ~722）が毎回 `force: true` で全データを再取得している点を改善。
     メンバーが既に `members` state に存在する場合はキャッシュを使う。

5. **B-06 バンドルサイズ調査**（所要: 1時間）
   - `npx vite-bundle-visualizer`（または同等ツール）で構成を分析する。
   - 削減可能な部分を特定してから対策を決定する。

### Phase 3: バックエンド中規模改修（効果大、リスク中）

6. **B-02 fetchAllDataFromDbFresh_ の最適化**（2026-04-19 ローカル実装）
   - `fetchAllDataFromDbFresh_()` で `T_会員`・`T_事業所職員`・`T_認証アカウント`・`T_研修`・`T_研修申込`・`T_年会費納入履歴`・`T_外部申込者` を batch 読込する経路を追加。
   - `getTrainingApplicationRows_()` に事前読込済み `rows/context` を渡せるようにし、`fetchAllDataFromDbFresh_()` 内の重複読込を回避。
   - `getRowsAsObjects_()` は共通の `getDataRange()` ベース読込ヘルパーへ集約。
   - release: `v242` / fixed deployment `@242`
   - 未実施: 実ブラウザ体感確認。

## 成功基準

| 指標 | 現状（推定） | 目標 |
|---|---|---|
| 会員マイページ初回ロード（キャッシュなし） | 5〜10秒 | 3秒以内 |
| 会員マイページ再ロード（キャッシュあり） | 1〜2秒 | 1秒以内 |
| 管理ダッシュボード初回ロード（キャッシュなし） | 8〜15秒 | 5秒以内 |
| フロントエンドバンドル（gzip） | 131KB | 100KB 以下 |

※ 測定方法: ブラウザの DevTools > Network タブで GAS `doGet` のレスポンス時間を計測。

## 実施前チェックリスト

- [x] `git status --short` で作業ツリーを確認した（v188）
- [x] `npx clasp show-authorized-user` で `k.noguchi@uguisunosato.or.jp` を確認した
- [x] `npx clasp run healthCheck` が通ることを確認した
- [x] Phase 1-2 実施: B-01, B-03, B-04, B-05, B-06, Terser, AI→GAS（v188 反映済み）
- [x] Phase 3: B-02 (`fetchAllDataFromDbFresh_` 最適化) は `v242` で本番反映済み

## 関連正本

- `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- `backend/Code.gs`（実装対象）
- `src/App.tsx`（実装対象）
- `src/services/api.ts`

## 次担当者の最初の一手

1. `HANDOVER.md` で本番 version と deployment を確認する。
2. この文書（`docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`）を読む。
3. Phase 1 の B-03（ウォームアップ強化）から着手する。最も低リスクで即効性がある。
4. 各 Phase 完了後に `HANDOVER.md` を更新し、本文書の完了項目を チェックする。

## Task カード

```md
### Task: サイト全体の読み込み・書き込み速度改善

- 対象ケースID: PERF-001
- owner: 次担当者
- status: `todo`
- 対象 deployment/version: v187 / @187 を起点
- 対象 URL:
  - member portal: /exec（AKfycbywpWoYxij6A-...）
  - public portal: /exec?app=public（AKfycbxyuUXg...）
- 前提ログイン: k.noguchi@uguisunosato.or.jp（管理者）
- 関連正本:
  - `HANDOVER.md`
  - `docs/58_NEXT_TASK_PERFORMANCE_2026-04-09.md`
  - `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
  - `docs/09_DEPLOYMENT_POLICY.md`

#### 期待する改善後の状態
- 会員マイページ初回ロード 3秒以内（キャッシュなし）
- 管理ダッシュボード初回ロード 5秒以内（キャッシュなし）
- ウォームアップトリガーが 5〜10分おきに動作し、コールドスタートを抑制している

#### 終了条件
- [x] Phase 1〜2 の施策が実装・本番反映された（v188 @188）
- [x] HTML 圧縮: deflate-raw+base64（`scripts/compress-html.mjs`）、GAS CSP 互換（v191）member 206kB / public 150kB
  - v189 の `vite-plugin-singlefile-compression` は blob: import が GAS CSP でブロックされ失敗（即時 v190 で復旧）
  - v191 でカスタム圧縮スクリプトに切り替え、`new Function()` 実行で CSP 互換を実現
- [x] 管理者ログイン分離: `checkAdminBySession` のみ（auth + data 一括廃止）（v192）
- [x] 管理者認証キャッシュ: whitelist/auth rows を CacheService で 300s キャッシュ（v193）
- [x] HANDOVER.md と本文書が最新状態に更新された
- [ ] ブラウザ実確認（v193 管理者ログイン速度・両ポータル表示）— ユーザーが確認
- [x] Phase 3 B-02 実装（`v242` で本番反映済み。実ブラウザ確認待ち）

#### 引継ぎメモ
- 状況: 2026-04-09 v188〜v193 で Performance Phase 1-2 + 圧縮 + 管理者ログイン改善完了。2026-04-19 に Phase 3 (B-02) を `v242` として本番反映。
- 完了済み: B-01, B-03, B-04 (backend), B-05, B-06 (frontend), Terser minification, Gemini AI to GAS, HTML 圧縮 (v191), 管理者ログイン分離 (v192), 管理者認証キャッシュ (v193)
- バンドルサイズ: member HTML 522→206 kB (-60%), public HTML 317→150 kB (-52%)
- 目標 100 kB gzip は現行機能セットで singlefile 制約下では非現実的（要アーキテクチャ変更）
- GEMINI_API_KEY: Script Properties への設定が別途必要（AI機能を使う場合）
- 次担当者の最初の一手: 実ブラウザで会員マイページ / 管理画面の初回ロード体感を確認し、必要なら次の性能課題を task 化する。
```
