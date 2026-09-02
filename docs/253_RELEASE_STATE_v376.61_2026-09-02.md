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

## 残タスク（operator）

- admin editor で `dryRunTrainingEndTimeV376_61_LOG` を ▶ 実行し `passed:true` を確認する（**メール送信なし**・検証行は物理削除）。
  同時に出力される `corruptedEndTimeIds` が課題B の対象研修 ID。

## フォローアップ

1. **課題B（本番データ復元・operator 作業）**: `T_研修` の `開催終了時刻` が壊れている 3 セル。復元値は GCP 作業場で導出済み（T001→12:00 / T004→16:30 / T473A9682→12:40。正しい時刻値が入っている 2 件で式を検証済）。**書き込む前に案内状・実施記録と突き合わせること。** 同期 SA は本番シートに閲覧者のみのため GCP 側からは書き込めない。
   - 本修正の適用後、壊れたセルは API 上「空文字」になる（誤った文字列は出なくなるが、値は空のまま）。**セルを直して初めて終了時刻が表示・保存される。**
2. **課題C（GCP 作業場）**: `tools/contract-check-member/mapping.mjs` を再実行し、`date` 全件一致と `endTime` 差分の解消を確認する。
3. v376.60 から継続: 管理画面 storageState の再取得 → admin E2E 再実行、Execution API 実行権限の復旧 → D-01 / D-02 の dryRun 実行。あわせて本リリースの `dryRunTrainingEndTimeV376_61_LOG` も実行する。
