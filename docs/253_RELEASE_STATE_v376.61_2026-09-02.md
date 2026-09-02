# Release state: v376.61（2026-09-02・リリース済）

## 状態

**本番反映完了。** fixed deployment 4 本を同期済み。

| 配信 | Deployment ID | Version |
|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@366** |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@366** |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@125** |
| admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@222** |

ロールバック先: public **@365×2** / member **@124** / admin **@221**（`npx clasp redeploy <ID> --versionNumber <N>`）。

## スコープ

研修の「開催終了時刻（endTime）」の実害バグ是正。GCP 作業場から申し送られた「本番リポジトリ側で実施する課題A」（2026-08-31 operator 決定）に対応する。

- `mapTrainingRowsForApi_` が `endTime` を `String()` で素通ししていたため、シートのセル値が Date の場合に
  JS Date の文字列表現（`Fri Dec 29 1899 22:00:00 GMT-0500 …`）がそのまま API 応答に出ていた。
- 管理画面（`TrainingManagement.tsx`）は `endTime` を `<input type="time">` に束ねており、`type="time"` は
  `HH:mm` しか受け付けない。そのため入力欄が空表示になり、**そのまま保存すると開催終了時刻が消える**
  （保存は `setCol('開催終了時刻', payload.endTime || '')`）。
- 公開ポータル側（`PublicTrainingList.tsx`）も `isTimeStr` で弾くため、終了時刻が表示されていなかった。

## 変更

| 対象 | 内容 |
|---|---|
| `gas-src/Code.full.gs` | `mapTrainingRowsForApi_` の `endTime` を `formatTimeOnly_()` 経由に変更（1 行）。`formatTimeOnly_` は既存関数（Date 分岐で `Asia/Tokyo` の `HH:mm` を返す）で新規実装なし。もう一方の mapper `getPublicTrainings_` は既に正しく、admin 系 mapper だけが未対応だった |
| `gas-src/Code.full.gs` | `dryRunTrainingEndTimeV376_61_LOG` を追加（operator 実行用・**非送信**。検証行を作成→管理画面と同じ経路で読み戻し→再保存→**物理削除**。あわせて既存行のうちセルが壊れている研修 ID を列挙する） |
| `scripts/gas-boundary-utils.mjs` | 上記 dryRun を `ADMIN_TOP_LEVEL_FUNCTIONS` に登録（build pruner による誤削除防止・`dryrun.gs` へ分離） |
| `scripts/test-training-time.mts` | 新規 unit test。`formatTimeOnly_` を **gas-src の実ソースから抽出して評価**（ミラー実装にせずドリフトを防ぐ）＋「シート列から作る `endTime` は必ず `formatTimeOnly_` を通す」というソース契約を固定 |
| `package.json` | `test:training-time` を追加し `prerelease` 連鎖へ組込 |
| `scripts/responsive-test.mjs` | 公開レスポンシブ計測の偽 FAIL 是正。app frame 検出直後の固定 800ms 待ちでは設定 API の応答前に計測してしまい、VP ごとに合否が揺れていた（実測: 同一ビルドで FAIL 集合が 4VP→2VP→0VP と変動）。主要 CTA の出現を条件待ちしてから計測する |

## 検証

- **回帰ゲートの有効性**: 修正前のコードに戻すと新 unit test が FAIL、修正版で PASS することを実測（ミューテーション確認）。
- `npm run prerelease` **全ゲート PASS**（npm audit 0 / public・member・admin boundary PASS / typecheck / unit 全件 / er-sync PASS: テーブル 57・リレーション 61・stale 0 / menu-registry）。
- **3 split 生成物 grep PASS**: `backend/Code.gs`・`gas/member/Code.gs`・`gas/admin/Code.gs` の 3 つすべてで `var テーブル定義 = {` と `processApiRequest` が残存し、`endTime: formatTimeOnly_` へ置換済み・`endTime: String(` は 0 件。新 dryRun は `gas/admin/dryrun.gs` に分離出力されている。
- **公開 live E2E（現行 v376.60 に対して）**: `test:a11y` 違反 0、`test:responsive` **7VP 全 PASS**（ハーネス是正後・console error 0）。
- **デプロイ後 live E2E（新 version に対して）**:
  - 公開ポータル `test:a11y` — 違反 **0**（critical/serious/moderate/minor すべて 0）。
  - 公開ポータル `test:responsive` — **7VP 全 PASS**（横スクロール 0・タップターゲット違反 0・console error 0・スキップ 0）。
  - 会員ポータル `test:responsive:member` — **7VP 全 PASS**（ログイン〜描画・console error 0）＝member split @125 の非破壊を機械検証。
- 管理画面 Playwright E2E と Execution API dry-run は、認証状態・実行権限が未復旧のため未実行（下記フォローアップ）。

## デプロイ実施記録（2026-09-02）

1. 3 split を `npx clasp push --force` → `npx clasp version "v376.61 training endTime normalization"`
   → public **@366** / member **@125** / admin **@222** を作成。
2. fixed deployment **4 本**を `npx clasp redeploy --versionNumber` で同期。
3. `npx clasp deployments --json` を 3 project で実行し、4 本すべてが上記 version を指すことを確認。
4. デプロイ後に公開 a11y / 公開 responsive / member responsive を実行し全 PASS（上記「検証」）。

## デプロイ後の検証（2026-09-02・追補）

operator のログインで admin ブラウザセッションを取り直したうえで、以下をすべて実施した。

| 項目 | 結果 |
|---|---|
| `dryRunTrainingEndTimeV376_61_LOG`（admin editor から実行） | **`passed:true`** / `testRowCleanedUp:true` / `mailSent:false`。checks は create_returns_id・read_endTime_is_hhmm(16:30)・resave_keeps_endTime(16:30)・cleanup_done がすべて PASS。あわせて `corruptedEndTimeCount:0` / `emptyEndTimeCount:0` |
| `test:responsive:admin`（R-03） | **7VP × 8 コンソール = 56 view 全 PASS**（横スクロール 0・タップターゲット違反 0・console error 0） |
| `test:mail-settings:e2e`（E2E-01〜05） | **全 PASS** |
| `dryRunMailSettingsV376_60_LOG`（D-01） | **`passed:true`**・`mailSent:false`・`dbWritten:false`・`activeTemplateCounts {CREDENTIAL:1, STAFF_ADD_REP:1}` |
| `dryRunApplicationReceiptRoutingV376_59_LOG`（D-02） | **`passed:true`**・`mailSent:false`・`dbWritten:false` |

これにより v376.60 のテスト記録（`docs/portal/test-report.html`）は **全 13 行 PASS** となった。

### 課題B の実施記録（operator 承認済・本番データ変更）

研修管理モーダルの実 UI（終了時刻 → 変更を保存）から入力し、管理 API の再読込で検証した。

| 研修ID | 変更前 | 入力値 | 再読込 |
|---|---|---|---|
| T001 | 空 | 12:00 | **12:00** |
| T004 | 空 | 16:30 | **16:30** |
| T473A9682（削除済） | 空 | 12:40 | **12:40** |

T002=17:00 / T003=16:00 は元から正常で、導出式の検証根拠と一致していることを実測で再確認した。
実施後の dryRun でも `corruptedEndTimeCount:0` となり、壊れたセルは残っていない。

### 検証ハーネスの是正（同日）

- `scripts/test-mail-settings-e2e.mjs`: ①`システム設定` 描画後の固定待ちを条件待ちに変更 ②タブのラベルが実 UI では副題付き（`メール通知 入会メール・事業所メール`）のため前方一致に変更 ③受付カードの特定が最外側の div に一致していたため最小一致へ ④共通送信元の期待文言を実 UI の `自動通知の送信元アドレス（共通）` に修正 ⑤閉じた `<details>` 内のテンプレート管理を開いてから判定。**いずれもハーネス側の誤りで、アプリの不具合ではない**。

## フォローアップ

1. ~~**課題B（本番データ復元）**~~ → **完了（2026-09-02・上記実施記録）**。以下は当初の記載。: `T_研修` の `開催終了時刻` が壊れている 3 セル。復元値は GCP 作業場で導出済み（T001→12:00 / T004→16:30 / T473A9682→12:40。正しい時刻値が入っている 2 件で式を検証済）。**書き込む前に案内状・実施記録と突き合わせること。** 同期 SA は本番シートに閲覧者のみのため GCP 側からは書き込めない。
   - 本修正の適用後、壊れたセルは API 上「空文字」になる（誤った文字列は出なくなるが、値は空のまま）。**セルを直して初めて終了時刻が表示・保存される。**
2. **課題C（GCP 作業場）** → **再突合を実施（2026-09-02・`tools/contract-check-member/mapping.mjs`）**。
   結果: 件数 5/5・ID 集合・並び順すべて一致、`onlyGas` / `onlyGcp` はいずれも空、**31 フィールド中の差分は `endTime` のみ**（`date` は全件一致＝申し送りの確認項目は充足）。
   差分が残るのは **T001 / T004 / T473A9682 の 3 件だけ**で、本日 GAS 側を修正しシートのセルを復元した当の 3 件と一致する。
   すなわち **Firestore ミラーが復元前のスナップショットのまま**であることによる差分で、マッピングの不一致ではない。
   **完全解消には `tools/sync-sheets-to-firestore` で `T_研修` を再同期する必要がある**（`DB_SPREADSHEET_ID` と `SYNC_IMPERSONATE_SA` の供給が要るため operator 判断）。
3. ~~v376.60 から継続の検証負債~~ → **完了（2026-09-02）**。ただし `clasp run` の Execution API 権限は未復旧のままで、dry-run は Apps Script エディタ経由で実行した。CLI から回したい場合は権限復旧が必要。
4. **新規に発見した本番障害（未修正）**: `listMailTemplates` が全カテゴリで `mailTemplateRecordFromRow_ is not defined` を返す。build pruner の到達性判定が `rows.map(mailTemplateRecordFromRow_)` のような値渡し参照を検出できず、v376.42 以降 3 split すべてで当該関数が欠落している。詳細と修正案は `HANDOVER.md` §2-1 の High 行。
