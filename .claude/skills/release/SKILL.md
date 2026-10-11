---
name: release
description: 本番リリースの手順。build → push → version → fixed deployment 4 本同期 → 検証 → 文書更新。デプロイ・リリース・本番反映・clasp redeploy・ロールバックを行うとき、または「デプロイして」「リリースして」「本番に上げて」と言われたときに使う。
---

# リリース手順（この案件の正本）

`AGENTS.md` §5 完了条件と §4.1 Deploy SOP をここへ移した（2026-10-02 / `docs/296`）。
毎ターン読む必要のない「手順」なので常設から外し、リリースのときだけ読む。

**「動いた」だけでは完了としない。**

## 0. 前提の確認

```bash
npx clasp show-authorized-user   # k.noguchi@hcm-n.org であること
```

- **clasp の認証は 1〜2 日で切れる**（`invalid_rapt` / `invalid_grant`）。AI はログインできないので、
  operator に `! npx clasp login` を頼む。切れたまま push すると途中で失敗する。

- 現行 version と fixed deployment の向き先は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` が正本。
  この手順書には固定値を書かない。
- **fixed deployment は 4 本**（統合・公開 ×2 / member ×1 / admin ×1）。
  毎リリース同一版へ同期し、一部だけ更新しない。本数と ID の正本は `docs/09_DEPLOYMENT_POLICY.md` §2。
- `npx clasp create-version` / `redeploy` / `list-deployments` / `run` など Apps Script API に到達する
  コマンドは、最初から承認済みの安定した実行経路で流す。失敗してから二度打ちを標準にしない。

## 1. ビルド（gas-src を触ったら必須）

```bash
npm run build              # vite（member / public）
npm run build:gas          # backend/Code.gs
npm run build:gas:member   # gas/member/Code.gs
npm run build:gas:admin    # gas/admin/Code.gs + jobs.gs + maintenance.gs + dryrun.gs
```

**`npm run build` だけでは GAS 用の HTML も Code.gs も更新されない。** 4 つとも実行する。
frontend build を `build:gas` より先に。生成物は deflate 圧縮されるので grep が 0 件でも異常ではない。

> 2026-10-02 以降は `npm run test:gas-build-sync` が build 忘れを検出する。
> gas-src を編集したまま prerelease が通ってしまう穴は塞いだが、**先にビルドするのが本筋**。

## 2. 全ゲート

```bash
npm run prerelease     # exit 0 であること
```

47 本以上の連鎖（security audit / boundary×3 / typecheck / 各 unit test / er-sync / menu-registry /
validation-matrix / db-relations / gas-build-sync）。1 本でも落ちたら止まる。

- 送信・描画・変換など**純ロジックを変更した場合は、その回帰を機械検証する unit test
  （`scripts/test-*.mts`）を追加**し prerelease 連鎖に組み込む。
- 判定ロジックのテストは**実行して確かめる**。文字列照合は配置・配線の確認に限る（`AGENTS.md` L3）。
- **業務ルール（BR-xx）を新設・変更したら**、`test:validation-matrix` にケースを足し、
  `docs/spec/02_RD.md` の検証方法欄と `docs/268` のトレーサビリティへ登録する。

## 3. 3 split 生成物の健全性（デプロイ前必須）

gas-src を変更したら、**トップレベル定義と新規追加関数が public・member・admin の
3 つの生成 Code.gs すべてに残存**することを grep で確認してから push する。

```bash
for f in backend/Code.gs gas/member/Code.gs gas/admin/Code.gs; do
  printf "%-22s %s\n" "$f" "$(grep -c '<新しく足した関数名>' $f)"
done
```

build pruner による誤削除の早期検知（`feedback_build_pruning_bug`）。
**0 が正しいこともある**——その split に経路が無い関数は入らない。
「なぜ 0 なのか」を説明できない 0 は異常として扱う。

## 4. push → version → 4 本同期

**3 つとも push に成功してから version を作る。** push と version を交互にしない。

```bash
# 1) push（3 プロジェクトを順に。全部成功したときだけ記録が残る）
npm run release:push

# 2) version（リポジトリ直下 = 統合・公開 / gas/member / gas/admin）
npx clasp create-version "<vX.Y 要約>"
cd gas/member && npx clasp create-version "<vX.Y 要約>"
cd gas/admin  && npx clasp create-version "<vX.Y 要約>"

# 3) fixed deployment 4 本を同じリリースへ（ID は docs/09 §2）
npx clasp redeploy <deploymentId> -V <version> -d "<vX.Y 要約>"
```

- **直接の `clasp push` は hook が拒否する。** `release:push` は prerelease 通過済みの HEAD・
  生成物がコミット済みであることを確かめ、clasp の成功文言まで見てから記録を残す。
- **記録と手元のファイルが 3 つとも一致しない `create-version` は hook が拒否する。**
  2026-10-10 に admin の push 失敗に気づかず version を作り、古いコードの admin @287 ができた（使わない版）。
- **`clasp deploy` は全形式禁止**（新 ID が生成され固定 URL が変わる）。hook が拒否する。
- 一覧は `npx clasp list-deployments`（**`--json` オプションは無い**）。
- `create-version` が `The service is currently unavailable.` を返すことがある。再実行でよい。
- **`npm run prerelease` と `git push` はリポジトリ直下から**打つ（`cd gas/admin` の後に続けない）。

## 5. デプロイ後の検証

1. **公開 E2E（認証不要）**: `npm run test:a11y`（違反 0）と `npm run test:responsive`（全 VP）。
   **初回はコールドスタートのスキーマ初期化で 45〜60s 超のタイムアウトが起こり得る。
   ウォーム後に再実行して判定する**（タイムアウト＝即失敗とみなさない）。
2. **会員 / 管理の書込フロー**: 書込フローを変更・新設したら
   `test:responsive:member` / `test:responsive:admin`。storageState が無く Playwright E2E を
   実行できない場合は、そのフローを通す backend dryRun（`dryRun*_LOG`）を用意し operator が実行する。
   **公開ポータルの a11y/responsive だけ実行して admin/member 書込を未検証のまま完了するのは禁止**
   （v376.44 の LINE 投稿保存不可の見逃し再発防止）。
3. **送信系・スキーマ系・DB 状態起因**: 実送信は非送信 dryRun を用意。
   シートのヘッダー欠落・列ドリフト等は**実 DB に対する dryRun E2E（行を作って読んで消す）で必ずカバー**。
   実送信検証は `MAIL_GLOBAL_ENABLED=false` / `REDIRECT` 下でのみ。
4. **実データ確認**: 認証済みブラウザ（Playwright MCP）から `google.script.run` で
   読み取り専用 action を叩き、**変更前後を全列で突き合わせる**（手順は `/prodcheck`）。
   「意図した列だけが変わり、巻き添えが 0 であること」を数字で示す。

### 不具合を検知したら

**原因調査より先にロールバックする。**

```bash
npx clasp redeploy <deploymentId> -V <直前の正常版> -d "rollback"
```

白画面・`ReferenceError`・認証不能・送信不能はこれに該当する。

## 6. 文書更新（同ターン）

| 文書 | 内容 |
|---|---|
| `HANDOVER.md` §0 | 現行版・4 本の version・ロールバック先・直近リリースの要約・残課題 |
| `docs/09_DEPLOYMENT_POLICY.md` | ヘッダの Production 行 ＋ `### <日付> <版> ← current production` |
| `docs/release-notes-2026.md` | 時系列エントリ（🆕🔧🐛🔒📝🎉 の凡例に従う） |
| `docs/2XX_RELEASE_STATE_*.md` | 背景・設計判断・検証結果。`docs/00_DOC_INDEX.md` へ登録 |

- **HANDOVER を更新したら `npm run release:verify`。** 本番の 4 本の向き先を読み、
  HANDOVER の「本番」行と一致すること（4 本がそろっていること・文書の更新漏れ）を確かめる。
- **未検証・残課題・承認待ちは必ず明記する。** 黙って埋めたことにしない。
- 実ブラウザ確認が未実施でも、コード上の検証結果と確認待ち範囲を明記し、
  operator が引き継げる状態で完了報告する。

## 7. push 前の確認

- `git diff` で作業ツリー全体を見る。自分の変更以外の未コミット変更があれば影響範囲を評価する。
- `git status --short` の未追跡ファイルは、追跡対象か例外かを必ず判定する。
- **prerelease を通していない HEAD は push できない**（PreToolUse hook が拒否する）。
  コミット後に `npm run prerelease` を実行し直す。

## 8. 認証変更を含むリリース

password verifier / credential generation を変更する release では、
`PASSWORD_HASH_PEPPER_V1` が integrated/public・member split・admin split の
Script Properties に**同一値で設定済み**であることを、**値を表示・記録せず**確認する。
未設定の project がある状態で push / version / redeploy してはならない。
