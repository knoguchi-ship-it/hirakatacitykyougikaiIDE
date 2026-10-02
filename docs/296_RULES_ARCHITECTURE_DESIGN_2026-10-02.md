# グランドルール再構築 設計書（2026-10-02）

operator 指示: ルールが膨大になったので整理する。追記では直らない。
機械的チェックは Skill へ出せないか。MCP は主体にしない。

## 0. 判断軸

**規約を増やすのではなく、守られているかを機械が測れる形にする。**
v376.100〜110 の 11 リリースで、不具合の出どころは実装の拙さではなく
「決めたことが守られているかを測っていなかった」ことに集中していた（`docs/295`）。

`AGENTS.md` §6 には既に「入力検証は deny-by-default」「例外時は fail close」と書いてある。
**v376.110 で見つかった未達 6 件のうち 4 件はこの 2 行の違反だった。**
ルールが足りなかったのではない。ルールと実装の差を測る手段が無かった。

## 1. 現状の実測

| | |
|---|---|
| 常設指示の総量 | 39,092 字 / 8 ファイル |
| うち `AGENTS.md` | **24,563 字（63%）** |
| AGENTS と詳細ルールの重複 | **9%**（183 行中 16 行） |
| 条文（30 字以上の箇条書き） | **242 件** |
| うち根拠が辿れるもの | **50 件（21%）** |

**膨張の原因は重複ではない。** `AGENTS.md` 1 本に 63% が集中し、
性質の違うもの（絶対ルール / 固定値 / 設計規約 / 手順 / 方針 / 事例）が同じ階層に並んでいる。
読み手は「どれを破ると事故で、どれが努力目標か」を区別できない。

## 2. 層の定義

| 層 | 実体 | 強制力 | トークン | 無い環境で効くか |
|---|---|---|---|---|
| **強制A** | npm scripts（`prerelease` 47 本） | ◎ 落ちる | 0 | ◎ どこでも |
| **強制B** | Hook（`.claude/settings.json`） | ◎ 拒否 | 0 | × Claude Code 内のみ |
| **想起** | Skill | × 無視可 | 呼んだ時だけ | × |
| **常設** | `AGENTS.md` | × 無視可 | 常時 | ◎ |
| **能力** | MCP | — | 常時 | × |

### 割り当て規則

| 守りたいもの | 置き場所 |
|---|---|
| 成果物の正しさ | **強制A（npm）** |
| 危険な操作の阻止 | **強制B（Hook）＋ 強制A に同じ検査を二重化** |
| 作業の進め方・手順 | **想起（Skill）** |
| 破ると事故になる原則 | **常設（AGENTS.md）。短く** |
| 外部到達が要る検証 | **能力（MCP）。土台にしない** |

**機械的チェックを Skill へ移さない。** Skill には終了コードが無く、
「落ちる仕組み」が「AI に検査するよう伝える仕組み」に変わる。強制が努力目標になる。

**MCP を土台にしない。** 常時スキーマ費用がかかり、可用性が不安定で
（本セッション中に Google Drive の MCP が 2 回切断・再接続した）、
CI や別マシンには存在しない。「MCP が繋がっているときだけ効くルール」はルールではない。
一方、他に手段が無い能力には最適（v376.110 の実データ検証は Playwright MCP でしか到達できなかった）。

## 3. 強制B — Hook 設計

### 3.1 契約（2026-10-02 に公式ドキュメントで確認）

- **`exit 2` が拒否。** stderr が理由として Claude に返る
- JSON で `hookSpecificOutput.permissionDecision: "deny"` ＋ `permissionDecisionReason` でも拒否できる
- `exit 0` かつ JSON 出力なし＝判断せず通常の権限フローへ
- stdin に `{ tool_name, tool_input, cwd, ... }` が JSON で渡る
- `matcher` はツール名（`"Bash"` / `"Edit|Write"` / 正規表現）。`if` で `Bash(rm *)` のような絞り込みも可
- 配置は `.claude/settings.json`。`${CLAUDE_PROJECT_DIR}` が使える

実装言語は **node**（jq も入っているが、Windows の引用符問題を避ける）。

### 3.2 H1 — `clasp deploy` の直叩きを拒否

**理由**: 新しい deployment ID が生成され固定 URL が変わる。MEMORY L4 の絶対ルール。
**現状**: `npm run clasp:deploy` は失敗するようにしてあるが、`npx clasp deploy` は素通り。

```
matcher: Bash
拒否条件: コマンド文字列が clasp の deploy / create-deployment を呼んでいる
通すもの: redeploy / update-deployment / list-deployments / create-version
理由文: 固定 URL が変わります。固定 deployment の更新は
        npx clasp redeploy <deploymentId> -V <version> を使ってください（docs/09）
```

### 3.3 H2 — 秘密ファイルへの書き込みを拒否

**理由**: `AGENTS.md` §0。AI は資格情報ファイルを書かない（ユーザーが手で記入する）。

```
matcher: Edit|Write|NotebookEdit
拒否条件: file_path が .env / .env.* / .clasprc.json / .clasp.json /
          storageState（.test-out/auth*）に該当（.env.example 等のテンプレートは除く）
理由文: 資格情報ファイルは AI が書きません。ユーザーが手で記入してください（AGENTS §0）
```

### 3.4 H3 — ゲート未通過の push を拒否

**理由**: `AGENTS.md` §5「コミットしてから問題発覚を許容しない」。現状は打ち忘れを防げない。

```
前提: prerelease の成功時に .tmp/prerelease-ok.json を書く
      { "head": "<git HEAD sha>", "at": "<ISO8601>" }
matcher: Bash
拒否条件: コマンドが git push を含み、かつ
          .tmp/prerelease-ok.json が無い、または head が現在の HEAD と不一致
理由文: この HEAD で prerelease が通っていません。npm run prerelease を実行してください
除外:   --dry-run
```

> `.tmp/` は gitignore 済み。マーカーは共有しない（各自の環境で通すべきもの）。

### 3.5 H4 — 本番 DB の破壊操作に確認を挟む

**理由**: MEMORY L0「DB 全削除・全更新は必ず事前許可」。

```
matcher: Bash
対象: clasp run で seedDemoData / deleteTestData_APPLY /
      executeStrictE2ETestMemberCleanup_APPLY / rebuildDatabaseSchema を呼ぶもの
判定: deny ではなく permissionDecision: "ask"（operator に確認を出す）
理由文: 本番 DB を変更します。対象テーブルと不可逆性を確認してください（MEMORY L0）
```

**限界を明記する**: 管理画面の `google.script.run` 経由（MCP Playwright）は
Bash を通らないため H4 では止まらない。そちらは AGENTS の L0 条文と
「プレビュー → 承認 → 実行 → 差分確認」の手順（Skill `/dbops`）で担保する。

## 4. 強制A — npm 層の補強 2 件

### 4.1 `test:gas-build-sync`（新設）— 生成物の陳腐化を検出

**今日実際に踏んだ穴。** `gas-src/Code.full.gs` を編集した状態で `prerelease` が exit 0 で通り、
`backend/Code.gs` などは古いままだった。既存の `test:gas-artifact-refs` は
**生成物の内部整合**を見ており、**gas-src とのずれ**は誰も見ていない。

```
やること: 3 split の Code.gs を一時ディレクトリへ生成し、コミット済みのものとバイト比較
不一致なら: 「gas-src を編集後に build:gas / build:gas:member / build:gas:admin を
            実行していません」と言って落とす
注意:      HTML（vite 経由）は重いので対象外。Code.gs の生成だけを比較する。
           そのため build スクリプトに「生成先を差し替えるモード」が要る
```

### 4.2 prerelease の成功マーカー

H3 のために `prerelease` の末尾で `.tmp/prerelease-ok.json` を書く。
失敗時は書かない（`&&` で繋がっているので自然にそうなる）。

## 5. 想起 — Skill 設計

Skill は「毎ターン抱えない手順書」。`AGENTS.md` には **1 行の呼び出し指示だけ**を残す。

| Skill | 吸収する節 | 字数 | 内容 |
|---|---|---|---|
| `/release` | §5 完了条件 ＋ §4.1 Deploy SOP | 3,915 | build → push → version → 4 本同期 → 検証 → 文書更新。E2E 回帰 5 項目。ロールバック手順 |
| `/doc` | §4.6 ドキュメント形式規約 | 1,902 | 文書の置き場所・索引登録・文字コード・改行コード・ER の生成 |
| `/spec-change` | 新規（B2 で追加した規約） | — | BR 追加・変更時: 仕様書 → 実行検査を作る → `docs/268` トレーサビリティ登録 → 未検証なら明示 |
| `/dbops` | 新規（MEMORY L0 の手順化） | — | 本番 DB を触る: プレビュー → 件数と対象の提示 → operator 承認 → 実行 → 全列差分で確認 |

`AGENTS.md` に残す形:

```
- リリースは必ず `/release` を呼ぶ。手順の正本はそこにある。
- 本番 DB を変更する作業は必ず `/dbops` を呼ぶ。
```

**Skill の弱点（呼ばれなければ読まれない）の緩和**:
`/release` の手順を踏まずに `git push` すると H3 が拒否する。
つまり**重要な手順は Hook と対にする**。

## 6. 常設 — 新しい `AGENTS.md`

### 6.1 目次

```
L0 絶対（破ると事故・即時是正）
   0.1 秘密の取り扱い
   0.2 認証境界（admin / member / public の 3 分離）
   0.3 不可逆操作（本番 DB・デプロイ）
   0.4 セキュリティ境界への逆行案を出さない

L1 この案件の固定値
   1.1 fixed deployment 4 本・コマンド・ロールバック
   1.2 OAuth スコープと 3 split の違い
   1.3 参照先の正本（HANDOVER / docs/09 / docs/spec）

L2 機械が守る規約（1 行 + 検査名。本文を持たない）
   例: 入力検証パターンの単一情報源 → test:single-source
       BR-xx の実効性              → test:validation-matrix
       DB の参照整合性              → test:db-relations
       生成物の鮮度                 → test:gas-build-sync
       3 split の境界               → security:*-boundary

L3 人が守る規約（根拠つきで短く）
   3.1 DRY と単一情報源（表）
   3.2 テストの 3 分類（ミラー禁止 / 照合は構造のみ / 判定は実行）
   3.3 既存データを人質にしない
   3.4 fail-closed
   3.5 確認の粒度

L4 入口と手順の呼び出し
   必ず読む 3 本 / 作業別に開く表 / Skill の呼び出し
```

### 6.2 移送表（1 条も削除しない）

| 現在 | 字数 | 行き先 |
|---|---|---|
| §0 秘密保管 | 1,639 | L0.1（ほぼそのまま） |
| §1 入口の原則 | 430 | L4 |
| §2 読む順序 | 1,238 | L4（改訂済み） |
| §3 行動原則 | 3,356 | L2 / L3 へ分割。事例の語りは `docs/295` へ |
| §4.1 Deploy SOP | 644 | **Skill `/release`**（L1 に 1 行） |
| §4.2 認証フロー | 216 | L0.2 |
| §4.3 セキュリティ運用 | 736 | L0.3 |
| §4.3.1 DB 制約の限界 | 450 | L3（BR-18/20 へ参照） |
| §4.4 UI/UX 規約 | 2,606 | L3（短縮。詳細は `docs/spec/04_UIUX.md` へ） |
| §4.5 ランタイム契約 | 1,493 | L2（boot loader 6 要素は検査可能にする） |
| §4.6 ドキュメント形式規約 | 1,902 | **Skill `/doc`** |
| §4.7 開発拠点 | 1,463 | **別冊**（方針） |
| §4.8 GCP 移植ゲート | 3,006 | **別冊**（方針） |
| §5 完了条件 | 3,271 | **Skill `/release`**（L4 に 1 行） |
| §6 セキュリティと承認 | 1,852 | L0.4 ＋ L3.4 |

**見込み**: 24,563 字 → **8,000 字前後**。
内訳は Skill へ 5,817 / 別冊へ 4,469 / L2 の 1 行化で約 4,000 / 事例を docs・MEMORY へ約 3,500。
**削除による減は 0。**

## 7. 棚卸しの扱い

条文 242 件のうち根拠が辿れるのは 21%。残り 192 件は、読んでも
過去の事故の瘢痕か思いつきか区別できない。**判断で落とすと半年後に同じ事故が起きる。**

したがって:

1. 242 条文を機械抽出し、「分類 / 根拠 / 今も効くか / 検査で守られているか」の表を作る
2. **落とす候補は AI が決めない。** 一覧にして operator 判断を仰ぐ
3. 落とした条文は削除せず、理由つきで廃止ログに残す

## 8. 実施順と理由

| | 内容 | 理由 |
|---|---|---|
| 1 | Hook 4 本（H1〜H4）＋ prerelease マーカー | **最も危険な穴が塞がる。** 効果が即出る |
| 2 | `test:gas-build-sync` | 今日踏んだ穴。リリース事故に直結 |
| 3 | Skill 2 本（`/release` `/doc`） | AGENTS から手順が抜けて軽くなる |
| 4 | 条文棚卸し表 | 全体像が見えてから配る |
| 5 | `AGENTS.md` 再構成 ＋ 別冊化 | 上が揃ってから最後に |
| 6 | Skill 2 本（`/spec-change` `/dbops`） | 新設手順。運用して形を決める |

**穴を塞ぐのが先、整理は後。** 整理の途中で事故が起きるのがいちばん悪い。

## 9. リスクと緩和

| リスク | 緩和 |
|---|---|
| Hook が過剰に止めて作業が進まない | 拒否条件を狭く始める。`ask` で済むものは `deny` にしない。除外（`--dry-run` 等）を明示 |
| Hook は Claude Code 内でしか効かない | 同じ検査を npm 側にも置き二重化する。人間の手打ちは止められないと明記 |
| Skill が呼ばれず手順が飛ぶ | 重要な手順は Hook と対にする（`/release` ↔ H3） |
| 再構成で条文が失われる | 棚卸し表を作り、落とす判断は operator。廃止ログに残す |
| `test:gas-build-sync` が遅い | Code.gs のみ比較し、HTML（vite）は対象外にする |

---

# 実装記録

## 実施 1 — Hook 4 本（2026-10-02 完了）

### 配置と Git 管理

`.gitignore` が `.claude/` をディレクトリごと除外しており、**Hook を置いても共有されない**状態だった。
Git はディレクトリを除外すると配下を再包含できないため、`.claude/*` 形式へ変更して
`settings.json` と `hooks/` だけを追跡対象にした（個人設定 `settings.local.json` は除外のまま）。

```
.claude/*
!.claude/settings.json
!.claude/hooks/
```

### 実装

| ファイル | 内容 |
|---|---|
| `.claude/settings.json` | `PreToolUse` を Bash と Edit/Write/NotebookEdit に登録 |
| `.claude/hooks/guard-bash.mjs` | H1（`clasp deploy`）/ H3（push ゲート）/ H4（破壊的 `clasp run`） |
| `.claude/hooks/guard-write.mjs` | H2（資格情報ファイル） |
| `scripts/write-prerelease-marker.mjs` | `prerelease` 成功時に `.tmp/prerelease-ok.json` へ HEAD を記録 |

**ガード自身は fail-open にした。** ガードの不具合で作業が止まるほうが害が大きく、
止めるべき操作は npm 側にも検査を置いて二重化する方針のため。

### 誤検知対策 — ヒアドキュメントを除外

素朴に文字列照合すると、**ドキュメントに `npx clasp deploy` と「書く」行為まで拒否**してしまう
（実際に本リポジトリの docs にこの文字列がある）。
`guard-bash.mjs` はヒアドキュメント本文を落としてから、`&&` `;` `|` 改行で区切り、
**コマンドの先頭に来ている語**だけを見る。`npx` / 環境変数代入 / `sudo` は剥がす。

### 検証結果

```
── 止める ──                      ── 通す ──
DENY  npx clasp deploy            通過  npx clasp redeploy ... -V 421
DENY  clasp create-deployment     通過  npx clasp create-version
DENY  cd backend && npx clasp deploy  通過  npx clasp list-deployments
ASK   clasp run seedDemoData      通過  npx clasp delete-deployment
                                  通過  npx clasp run healthCheck
                                  通過  npm run build:gas
                                  通過  heredoc 内の clasp deploy（文書に書くだけ）

── push ゲート ──                 ── 資格情報 ──
DENY  記録なしで push             DENY  .env / .env.test / .env.production
DENY  古い記録で push             DENY  .clasprc.json / .clasp.json
通過  現 HEAD の記録で push       DENY  .test-out/auth-admin.json / storageState.json
通過  git push --dry-run          通過  .env.example / .env.test.template
通過  git status                  通過  通常のソース・文書
```

実装中に 1 件直した: `.test-out/` の判定が先頭スラッシュを必須にしており、
相対パス `.test-out/auth-admin.json` が素通りしていた。

## 実施 2 — `test:gas-build-sync`（2026-10-02 完了）

ビルドの入力をハッシュし、生成物の先頭へ `// BUILD_INPUT_SHA256: <64 桁>` を刻む。
検査側で再計算して突き合わせる。ヘルパは `scripts/gas-boundary-utils.mjs`
（build ヘルパの正本。`test:build-helper-single-source` が複製を禁じている）へ追加した。

入力に含めたもの: `gas-src/Code.full.gs` / 各ビルドスクリプト / `gas-boundary-utils.mjs`。
**menu-registry や `src/shared` の注入元は含めていない**——含めすぎると誤検知が増え、
ゲートが信用されなくなる。この限界はテストの冒頭に明記した。

検査が機能することを、**先に落として**確認した（刻印前は 4 件すべて fail）。

## 残り

| | 内容 |
|---|---|
| 3 | Skill 2 本（`/release` `/doc`） |
| 4 | 条文棚卸し表（242 件） |
| 5 | `AGENTS.md` 再構成 ＋ 別冊化 |
| 6 | Skill 2 本（`/spec-change` `/dbops`） |

