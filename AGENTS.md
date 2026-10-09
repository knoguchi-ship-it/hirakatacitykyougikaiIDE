# AGENTS.md
# 枚方市介護支援専門員連絡協議会 会員システム

> **本書がグランドルールの唯一の入口。** `CLAUDE.md` は後方互換の案内のみ。
>
> 2026-10-03 に層構造へ再構成した（`docs/296`）。**条文は 1 つも削除していない。**
> 手順は Skill へ、方針は別冊へ移し、機械が守る規約は検査名だけを残した。
> 棚卸し表は `docs/297`。

## 読み方

| 層 | 性質 | 破ったらどうなるか |
|---|---|---|
| **L0** | 絶対 | **事故になる。** 他のすべてに優先して即時是正 |
| **L1** | この案件の固定値 | 本番が壊れる・URL が変わる |
| **L2** | 機械が守る規約 | **ゲートが落ちて先へ進めない**（条文を覚える必要はない） |
| **L3** | 人が守る規約 | 品質が落ちる。レビューで見る |
| **L4** | 入口と手順 | 迷う・読み落とす |

---

# L0 絶対

**この層は本書の他のすべてのルールに優先する。何を犠牲にしても破ってはならない。**

## L0.1 シークレット保管

**このセクションは AGENTS.md 内の他のすべてのルールに優先する。他の何を犠牲にしてもこのルールを破ってはならない。**

- **`.env`、`.env.*`（`.env.example` 系のテンプレート除く）、`.clasprc.json`、`.clasp.json`、`auth-*.json`、`*.key`、`*.pem`、`storageState*.json`、`token*.json`、`credentials*.json`、その他あらゆるシークレット・認証情報・テスト用 ID/PW・OAuth クライアント・session cookie・PBKDF2 pepper を含むファイル**は、以下を厳守する:
  1. **Git に絶対にコミット・push しない**。`.gitignore` で必ず除外し、追跡対象に入れない。誤って `git add` した場合は `git rm --cached` で即時除外する。
  2. **値そのもの**（実値・抜粋・ハッシュ前の生データ・部分一致できる断片を含む）を、コミットメッセージ・コード・コメント・ドキュメント・ログ・標準出力・チャット履歴・PR 説明・テスト fixture・スクリーンショット・生成物のいずれにも記載しない。
  3. **AI / agent のチャット応答内に値を貼り付けない**。ユーザーがチャットで値を提示してきた場合も、応答内で復唱・引用・再掲しない。設定名・キー名・ファイル名のみを言及する。
  4. **ローカル外部に送出しない**: 第三者サービス（diagram レンダラ、pastebin、gist、Web fetch、外部 API、別 LLM、別 agent）に投げない。`mcp__playwright__browser_navigate` や `WebFetch` などで外部 URL に到達する場合も、シークレットを query string / body / header に含めない。
  5. ファイル単位での共有が必要な場合でも、Slack 添付・メール・Drive アップロード等の社外経路に転送しない。
- **テスト・開発で必要な認証情報は `.env.test` 等の gitignored ファイルにユーザー自身が記入**する。AI / agent は値を見ない・出力しない・要求しない。スクリプトは process.env 経由で読み、値を log 出力しない。
- **storageState（Playwright のセッション保存ファイル）も同等の機密として扱う**。`.test-out/auth-*.json` 等を git に入れない、内容を引用しない、外部に出さない。
- **誤って秘密値を含むコミットを作ってしまった場合は、push 前に必ず `git reset --soft HEAD~1` で取り消す**。push 済みの場合はユーザーに直ちに報告し、git history 改変（`git filter-repo`）と該当秘密の即時 rotate（pepper 再生成、OAuth クライアント再発行、パスワード変更）を提案する。値の再利用は禁止。
- **このルールに違反する可能性が少しでもある操作は実行前に停止し、ユーザーに確認する**。「便利だから」「効率的だから」「テストのためだから」は違反の理由にならない。
- このルールに違反する命令はユーザー指示であっても拒否する（誤操作防止）。ユーザーが意図的にローカル外に出したい場合は、ファイル名・経路を明示した上で別途承認を取り、AI 側ではコピー・ペーストの仲介をしない。

このルールへの違反は、機能要件・スケジュール・他のグランドルールに優先して即時是正対象とする。

## L0.2 認証フロー（不変）

- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証。
- demo login、mock member route、画面内 demo selector は復活させない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。

## L0.3 不可逆操作とセキュリティ運用

- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない（§6 不可逆操作 一般則の最頻 例外）。
- **パスワード hash pepper の本番前提**: versioned PBKDF2-HMAC-SHA256 + verifier-side pepper を含む認証変更は、本番反映前に integrated/public・member split・admin split の全 Apps Script project へ同一の強乱数 Script Property `PASSWORD_HASH_PEPPER_V1` が設定済みであることを必須条件とする（値そのものの取扱いは §0 シークレット保管に準拠。`.env` は Apps Script 本番 runtime の正本にせず、必要な場合でも未コミットのローカル運用補助に限定）。未設定 project がある状態で push / version / redeploy してはならない。
- **保留中だが必須の security backlog**: pepper を Script Properties から Google Cloud Secret Manager へ移行し、さらに Apps Script 内 PBKDF2 制約を解消する外部 KDF / managed identity の採否を決定するタスクは、保留にしてよいが破棄してはならない。次回以降のセキュリティ改善計画で必ず再開し、完了または明示的な代替設計決定まで `HANDOVER.md` と関連仕様に残す。

## L0.4 承認と、確定済み境界への逆行禁止

- 本番 deploy、DB 更新、権限変更、外部送信、不可逆操作は人間承認を前提とする（具体的破壊操作の運用注意は §4.3 参照）。
- secret value の取扱いは §0 を絶対正本とする（pepper、token、鍵、認証情報、その他あらゆる秘密値）。
- AI / agent 特有のリスクも通常のアプリケーションセキュリティと同じ優先度で扱う。
- 外部入力は不信入力として扱い、モデル出力をそのまま shell、SQL、HTML、デプロイ設定へ流し込まない。
- **セキュアコーディング 5 視点を基軸とする**: 新規実装・改修時は以下 5 視点を常に意識し、レビュー時もこの 5 軸で確認する:
  1. **入力検証 (Input Validation)**: 外部入力（HTTP request / フォーム / ファイル / API 戻り値 / URL パラメータ）を信頼せず、許可リスト方式で型・範囲・長さ・形式を検証。未知の値は deny-by-default
  2. **認証・認可 (Authentication & Authorization)**: 機能ごとに必要な権限を **server side で強制**（§4.2 認証フロー + RBAC `docs/246` 遵守）。frontend での UI 非表示は二重防御の一部であって単独防御にしない
  3. **機密データ保護 (Data Protection)**: パスワードハッシュ・トークン・PII は最小権限で扱う、伝送・保存時に暗号化 / ハッシュ化（§0 シークレット保管 + §4.3 pepper 運用に従う）
  4. **エラー処理・ログ (Error Handling & Logging)**: 例外情報の詳細を end user に露出しない、内部ログには秘密値を含めない（§0 シークレット保管）、例外時は fail close で deny-by-default
     - **条件を確認できないときは、検証を飛ばして通してはならない（2026-10-02 確定）。**
       参照先の行が見つからない・ID が空・シートが無い——いずれも「確認できなかった」であって
       「条件を満たした」ではない。**確認できない旨を明示して止める**（fail-closed）。
     - **入れ子の `if` で起きやすい。** 権限や存在のガードを `if (a) { if (b) { if (c) { throw ... } } }`
       と書くと、a・b・c のどれが欠けても**何も検証せず素通り**する。
       ガードは早期 return / 早期 throw で平らに書き、各条件が満たせないときの拒否理由を個別に出す。
       実例: 事業所の退会申請「代表者のみ」が、認証アカウントに職員IDが無いと素通りしていた（v376.110 で是正）。
  5. **セキュア通信・依存 (Secure Communication & Dependencies)**: HTTPS / TLS / signed token のみ使用、npm 依存は `npm audit --audit-level=high` で定期監査、外部ライブラリ採用前に `import.meta` 等の build trap を grep 確認（参考: MEMORY `feedback_pdfjs_dist_vite_singlefile_trap.md`）
- **確定済みセキュリティ境界への逆行案提示禁止**: 第三者評価（`docs/109`）や設計決定（`docs/111`）で確定した認証境界・アクセス制御・プロジェクト分離に反する案を「選択肢の一つ」として対等に提示してはならない。利便性はセキュリティ境界を崩す理由にならない。やむを得ず言及する場合は「**非推奨・セキュリティリスクあり**」を冒頭に明示し、推奨しないことを基本姿勢とする。
- **このプロジェクトの確定済み境界**: admin（DOMAIN・Google セッション・管理専用）/ member（匿名・ID/PW・会員専用）/ public（完全匿名・申込専用）。3境界の混在・統合提案は上記ルールに従う。

---

# L1 この案件の固定値

版依存の現況値（現行 version・fixed deployment の向き先）は本書に書かない。
正本は `HANDOVER.md`。

## L1.1 Deploy SOP

- **手順の正本は Skill `/release`。** ここには崩してはいけない固定だけを置く。
- **fixed deployment は 4 本**（統合・公開 ×2 / member ×1 / admin ×1）。毎リリース同一版へ同期し、一部だけ更新しない。
  本数と ID の正本は `docs/09_DEPLOYMENT_POLICY.md` §2、現行の向き先は `HANDOVER.md`。
- **`clasp deploy` は全形式禁止**（新 ID が生成され固定 URL が変わる）。更新は `npx clasp redeploy`。
  PreToolUse hook（`.claude/hooks/guard-bash.mjs`）が拒否する。
- Apps Script UI の `Manage deployments` 手更新は障害復旧時の補助手段としてのみ扱う。
- 認証・認可・DB 整合・deployment 検証は Apps Script 実行系で確認する。

## L1.2 参照先の正本

- 最初に読む入口は常にこの `AGENTS.md`（リポジトリ直下）。
- 常設指示はリポジトリ直下の `AGENTS.md` と `CLAUDE.md` の 2 本だけ。
  `GLOBAL_GROUND_RULES/` には**詳細ルールと知識ベースしか置かない**（常設指示の写しを増やさない）。
- 詳細ルールは `GLOBAL_GROUND_RULES/docs/AI_RULES/` 配下を正とする。
- システム仕様、運用値、固定値、現行状態は `HANDOVER.md` と `docs/*` の案件正本を正とする。
- グランドルールには版依存の現況値を埋め込まず、現行 version、fixed deployment の向き先、最新 release state の参照先は `HANDOVER.md` を都度更新して管理する。
- `AGENTS.md` と詳細ルールが衝突した場合は、詳細ルールを優先する。

---

# L2 機械が守る規約

**この層の条文を覚える必要はない。逸脱すればゲートが落ちる。**
落ちたときに「何を守らせたかったのか」を読む場所として残す。

| 守らせたいこと | 検査 |
|---|---|
| 入力検証・会員種別・会計年度判定などの単一情報源 | `npm run test:single-source` |
| 業務ルール BR-xx が実際に効いていること | `npm run test:validation-matrix` |
| DB の参照整合性・ER 図と実装の一致 | `npm run test:db-relations` / `test:er-sync` |
| 3 split 生成物が gas-src と同期していること | `npm run test:gas-build-sync` |
| 生成物の内部で参照が解決すること | `npm run test:gas-artifact-refs` |
| 3 split の境界（公開に業務バッチを置かない等） | `npm run security:public-boundary` ほか 2 本 |
| build ヘルパの複製禁止 | `npm run test:build-helper-single-source` |
| 新規文書の索引登録・要件 ID のトレーサビリティ | `npm run test:docs-single-source` |
| action の分類漏れ（二重実装の検出） | `npm run test:feature-inventory` |
| `clasp deploy` の直叩き・資格情報ファイルへの書き込み・ゲート未通過の push | PreToolUse hook（`.claude/hooks/`） |
| 依存の脆弱性（**出荷物は常に厳格**／開発依存は期限つき受容） | `npm run security:audit` |

すべて `npm run prerelease` に連なる。**exit 0 でなければリリースに進めない。**

### 依存の脆弱性ゲート（2026-10-03 改修）

`npm audit` を直接ゲートにするのをやめ、`scripts/security-audit.mjs` を挟んだ。
**npm audit は素のまま全件実行する**（`--audit-level` を下げない・`--omit` で外さない）。
情報は全部受け取り、**何をもって失敗とするかだけ**をこちらで決める。

| 条件 | 結果 |
|---|---|
| **本番依存**の high 以上 | **常に落とす。** 受容リストに書いてあっても落とす |
| 開発依存の high 以上で、受容リストに無い | 落とす |
| 受容リストにあり `reviewBy` 以内 | 通す（1 行表示） |
| 受容リストにあり `reviewBy` 超過 | **落とす**（再審査を強制） |
| 受容リストにあるが検出されない | 警告のみ（掃除を促す） |

受容は `security-advisories.json` に **到達経路・なぜ直せないか・再審査期限**を書く。
「無視する」ではなく「評価した。期限までに見直す」という意味。

**なぜ必要になったか**: `npm audit` には ID 単位の抑制が無く、`--audit-level` を下げるか
`--omit=dev` で丸ごと外すかしかない。どちらも新しい危険まで見えなくなる。
加えて外部 DB を引くため、**コードを変えていないのに結果が変わる**
（2026-10-03 に、1 日の途中から落ち始めた）。判断を Git に残せる形にした。

**諦めたこと**: 開発依存の供給網リスクを自動では止めない。受容リストに載せた分は
`reviewBy` まで通る。期限が来れば必ず止まる。

## L2.1 単一情報源のレジストリ

逸脱は `npm run test:single-source` が検出して落とす。**新しい画面・機能でローカルに再定義しない。**

| 対象 | 正本 | GAS への共有方法 |
|---|---|---|
| 入力検証パターン（メール/電話/郵便番号/介護支援専門員番号/カナ/事業所番号） | `src/shared/validators.ts` | GAS 側は各関数内ローカル（regex の build pruner 罠のため。変更時は同時更新） |
| 会員種別ラベル・年会費既定値・年会費整形 | `src/shared/memberTypes.mjs` | build 注入（`__MEMBER_TYPES_BUILD_INJECT_*`） |
| 会計年度の在籍判定 | `src/shared/memberFiscalStatus.mjs` | build 注入 |
| メール差し込みタグのカタログ | `src/shared/mailTemplates.ts` | UI は必ず参照（直書き禁止） |
| RBAC の action→menu | `scripts/menu-registry.mjs` | build 注入 |
| メール送信の出口 | `deliverMail_`（→ `sendEmailWithValidatedFrom_`） | 直接 `MailApp`/`GmailApp` を呼ばない |
| メール本文の差し込み描画 | `renderMergeTags_` / `renderConfiguredMail_` | 独自の置換実装を書かない |
| 会員種別ごとの年会費の実値 | DB `M_会員種別.年会費金額` | `readMemberTypeAnnualFees_` 経由 |

（2026-09-03 監査で確立・`docs/260`）

## L2.2 ドキュメント形式

- **文書を書く・直す・整理する手順は Skill `/doc` が正本。** docs を触る前に呼ぶ。
  ER 図の自動生成（手書き禁止）、docs/portal の再生成、置き場所とアーカイブ、索引登録、
  文字コードと改行コードの扱いを含む。（2026-10-02 に本節から移送。`docs/296`）
- ER 図の正本は `gas-src` のテーブル定義 ＋ `docs/er-metadata.json`。ドリフトは `npm run test:er-sync` が落とす。
- 新規文書は `docs/00_DOC_INDEX.md` へ登録する。未登録は `npm run test:docs-single-source` が落とす。

---

# L3 人が守る規約

機械では測れないもの。**根拠（どの事故から来たか）を併記する。**

## L3.1 進め方

- **確認は「設計判断が分岐する点」だけに絞る（2026-10-02 確定・operator 指示）。**
  - **作業の都度は確認しない。** ファイルアクセス・書き換え・コマンド実行の一つ一つで止まらず、
    ひと段落するまで一気に進める（MEMORY のユーザー設定を優先する）。
  - **不明点があれば必ず確認する。** 複数の解釈が成立し、**どちらを採るかで成果物が変わる**ときは
    推測で実装しない。箇条書きで簡潔に、YesNo または選択肢で答えられる形にする。
  - 判断が分岐しない作業（調査・実装の細部・検証手順）は自分で決めて進め、
    採った前提を完了報告に明記する。
  - 詳細は `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md §実装開始前の必須確認` を参照。
- まず関連ファイルだけを読む。推測で壊さない。
- 技術、法務、セキュリティ、運用の提案前に、必要なら Web で最新の一次ソースを確認する。
- 外部標準は採用するが、案件正本と衝突する場合は案件正本を優先し、差分を記録する。
- 既存コード、prompt、運用手順の修正は差分修正を原則とする。
- **DRY 原則を実装の基本とする**: 同一処理・同一定数の繰り返しは禁止し、共通関数・共通モジュール・共通定数に集約する。新規追加時は既存の共通化候補を必ず先に grep で探す。ただし「本質的に異なる処理」を無理に共通化して分岐だらけにすることは避ける（判断軸は MEMORY フィードバック `feedback_consolidation_philosophy.md` 参照）。
- **単一情報源のレジストリ（2026-09-03 監査で確立・`docs/260`）**: 次の値・判定は**必ず下記の正本を経由**する。
  新しい画面・機能でローカルに再定義してはならない（`npm run test:single-source` が検出して落とす）。

  | 対象 | 正本 | GAS への共有方法 |
  |---|---|---|
  | 入力検証パターン（メール/電話/郵便番号/介護支援専門員番号/カナ/事業所番号） | `src/shared/validators.ts` | GAS 側は各関数内ローカル（regex の build pruner 罠のため。変更時は同時更新） |
  | 会員種別ラベル・年会費既定値・年会費整形 | `src/shared/memberTypes.mjs` | build 注入（`__MEMBER_TYPES_BUILD_INJECT_*`） |
  | 会計年度の在籍判定 | `src/shared/memberFiscalStatus.mjs` | build 注入 |
  | メール差し込みタグのカタログ | `src/shared/mailTemplates.ts` | UI は必ず参照（直書き禁止） |
  | RBAC の action→menu | `scripts/menu-registry.mjs` | build 注入 |
  | メール送信の出口 | `deliverMail_`（→ `sendEmailWithValidatedFrom_`） | 直接 `MailApp`/`GmailApp` を呼ばない |
  | メール本文の差し込み描画 | `renderMergeTags_` / `renderConfiguredMail_` | 独自の置換実装を書かない |
  | 会員種別ごとの年会費の実値 | DB `M_会員種別.年会費金額` | `readMemberTypeAnnualFees_` 経由 |

- **「同じことを別ルートで決めていないか」を実装前に確認する**: 値やラベル、判定を書く前に上表と grep で正本を探す。
  無ければ**まず正本を作ってから**使う。過去の本番障害（v376.46 の在籍中人数のぶれ、v376.66 の事業所メールだけ
  タグ未置換、v376.67 の研修リマインダーのカテゴリ誤り）はいずれもこの確認を飛ばしたことが原因。
- **テストが本体と関わる方法は 3 通りしかなく、使い分けを固定する（2026-10-02 確定）。**
  1. **ミラー（テスト側で同じロジックを再実装）— 禁止。** 確かめているのはコピーの挙動で、
     本体を直してもテストは古い挙動を守り続ける。
  2. **文字列照合（ソースを grep して含まれるかを見る）— 構造の確認に限る。**
     「allowlist に入っている」「3 split すべてに定義が残っている」など**配置・配線**にだけ使う。
     **判定の正しさを文字列照合で代用しない。**
  3. **実行（本体を取り出して動かす）— 判定ロジックには必須。** `gas-src` の関数は実ソースから
     抽出して評価し、入力 → 受理／拒否 を突き合わせる（`scripts/test-validation-matrix.mts` の方式）。

  **1 と 2 は対で塞ぐ。** ミラーだけを禁じると逃げ場が文字列照合しか残らず、
  「そう書いてある」ことを確かめて満足するテストが量産される。実例: `test:office-affiliation` は
  `fields.phone = ''` を送ると**書いてある**ことを検査して緑を保ち続けたが、その空文字は承認側で
  黙って捨てられており、退職しても前職の電話が消えない不具合が本番に居続けた（v376.110 で発覚）。
- **ハードコーディング原則禁止**: 識別子（URL / ID / メールアドレス / パス / マジック数値・文字列）はソースコード本体に直接埋め込まない。定数化・設定経由・環境変数のいずれかとし、やむを得ず本体に書く場合は事前にユーザー確認を取る。**シークレットは確認の有無に関わらず絶対にハードコーディングしない**（§0 シークレット保管に従い、`.env*` / Script Properties / Secret Manager 経由のみ。GitHub には絶対に出さない）。
- **影響範囲の事前確認 + 既存挙動を破壊しないことの保証**: 変更前に grep / typecheck / 関連 unit test の実行で影響範囲を可視化する。変更後は完了条件 §5 のチェックリストで既存挙動が破壊されていないことを最終確認する。「コミットしてから問題発覚」を許容しない。
- Git 管理の原則は「追跡すべきものは全て追跡する」。未追跡のまま許容してよいのは、生成物・ローカルメモ・資格情報・一時ファイルなど、案件ルールまたは `.gitignore` / 正本文書で例外として明示されたものだけとする。
- 実ブラウザでの実行確認は操作者側が行うことを既定とし、AI / agent はコード上の整合確認、build、Apps Script 実行系コマンド確認、取得できるエラーの調査を担当する。
- コード、データ、デプロイ、UI、認証、運用手順を変えたら、関連正本を同ターンで更新する。
- **文書作成・更新時の文字コード統一は絶対ルールとする。** 今後作成・更新する Markdown / HTML / text 系ドキュメントは、現在正常に日本語表示できている既存正本文書と同じ文字コード（原則 UTF-8）で保存する。PowerShell 等の既定エンコーディングに依存した読み書きを避け、保存後は文字化けがないことを確認する。文字化けが疑われる場合は、その文書の更新を完了扱いにせず、先に復旧する。
- 文字化け、参照切れ、版ずれ、古い入口があれば先に直す。

## L3.2 DB 制約の限界

- **シートの入力規則（`入力規則定義`）は検証の代わりにならない。**
  止められるのは人が手でセルを編集するときだけで、**Apps Script の `setValues` は素通りする**。
  入力規則だけで値域を縛る設計にしない。
- マスタを参照するコード値は、**保存する関数側でマスタに実在するかを確かめる**（`isKnownMasterCode_`）。
  入力規則は手編集に対する保険として併用する。
- **ID 参照（会員ID・職員ID・研修ID など）に外部キー制約は張れない。** 整合はコードの責任。
  どこが保証されていないかは `npm run test:db-relations` が一覧として固定しており、
  **強制されない参照を増やすと落ちる**。増やすのは意識的な判断であるべき。
- 規約の正本は `docs/spec/02_RD.md` BR-18 / BR-20。

## L3.3 UI/UX 規約

- **画面表示は日本語を既定とする（2026-09-02 operator 決定・英語のデフォルト化禁止）**: 本システムの利用者は日本語話者の会員・事務局であり、**画面に出る文字列は日本語を第一言語とする**。
  1. **装飾目的の英語を置かない**: 見出し上の英字ラベル（例: 画面タイトル「設定」の上に `SYSTEM SETTINGS`）のような、情報を増やさない英字は追加しない。既存分は見つけ次第削除する。
  2. **日本語で言えるものは日本語にする**: `allowlist`→「許可リスト」、`ON/OFF`→「有効/無効」など、定訳のある語をそのまま英字で置かない。
  3. **英字を使ってよい場合**: ①**内部値・識別子をそのまま示す必要がある**とき（`LIVE` / `REDIRECT` / `SUPPRESS` のような保存値、シート列名、ID、URL）②**日本語化するとかえって通じない定着語**（Excel / PDF / CSV / Drive / メール / ログイン など）。①の場合は**日本語ラベルを主・英字を従**（補足の小さい表記や括弧書き）とし、英字だけを主ラベルにしない。
  4. **大文字化の装飾を使わない**: 日本語見出しに `uppercase tracking-wide` を当てても効果がなく、英字だけが不自然に強調される。英字ラベルを消すのと同時に不要な `uppercase` も外す。
  5. 新規画面・改修時はこの規約に反する文字列を残さない。レビュー時も確認項目とする。

- **公開ポータルカード追加時の必須セット実装**: 公開ポータル（`src/public-portal/App.tsx`）にカードを追加する場合、必ず管理設定（`src/App.tsx` の公開ポータル設定セクション）に以下をセットで実装すること:
  1. メニュー表示トグル（表示/非表示）
  2. 補助ラベル（バッジ）の表示トグルと文言
  3. 見出し（タイトル）の表示トグルと文言
  4. 説明文の表示トグルと文言
  5. ボタン文言
  - 対応する `SystemSettings` 型フィールド（`src/types.ts`）、GAS バックエンドの `PUBLIC_PORTAL_DEFAULTS`・`getPublicPortalSettings_`・`getSystemSettings_`・`updateSystemSettings_`・`initializeSystemSettings_` も同時に更新する。
  - 片方だけの実装は不完全とみなし、完了条件を満たさない。
- **レスポンシブ対応は必須機能**: 公開ポータル・会員マイページ・管理者ポータルのすべての画面・新規実装・既存改修は、必ずスマートフォン（最小幅 360px）から PC（1920px 以上）まで破綻なく表示・操作できるように設計・実装すること。「PC で動いた」だけでは完了としない。
  1. **GAS server-side viewport**: 各 `doGet()` で `HtmlOutput#addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')` を必ず呼ぶ。GAS の外側 iframe ラッパーは HTML 内の `<meta viewport>` を無視するため、これを欠かすとモバイルで白ページや極端な縮小表示になる。3 プロジェクト（integrated/public・member split・admin split）の `doGet()` すべてで維持する。なお `addMetaTag()` が受け付ける `name` は `viewport` / `apple-mobile-web-app-capable` / `mobile-web-app-capable` / `google-site-verification` の 4 種のみ。それ以外（例: `theme-color`、`description` 等）を渡すと `Exception: 指定したメタタグはこのコンテキストでは使用できません` で WebApp が完全に表示不能になるため、絶対に追加しない。
  2. **Mobile-first レイアウト**: Tailwind の unprefixed クラス（モバイル用）を基準に書き、`sm:` / `md:` / `lg:` で大画面へ段階拡張する。`md:grid-cols-2` のように `md:` 以上でしかカラム化しない設計は避け、可能な限り `sm:` から有効化する。
  3. **タップターゲット**: 主要 CTA・ナビゲーション・フォーム入力の操作要素は WCAG 2.2 / Apple HIG 準拠で最小 44×44px（推奨 48×48px）を確保する。`min-h-[44px]` 等で明示する。
  4. **横スクロール禁止**: ルート要素に `overflow-x-hidden` を含め、長い文字列・URL・コード片には `break-words` / `break-all` を付ける。
  5. **動的ビューポート単位**: 全画面高は `min-h-screen` ではなく `min-h-[100dvh]`（または `min-h-svh`）を使い、iOS Safari のアドレスバー高さ変動で要素が切れないようにする。
  6. **WCAG 2.2 §1.4.10 リフロー**: 320px 幅・200% ズーム時に横スクロールなく、機能損失なく利用できることを設計時に意識する。
  7. **完了条件**: モバイル幅（360〜414px）で実機またはブラウザ devtools により表示・操作確認したことを最低条件とする。スマホ未確認のまま「完了」と報告しない。
  - 上記いずれかが満たされない実装は不完全とみなし、完了条件を満たさない。

## L3.4 ランタイム契約

- **boot loader 契約（v375〜確定）**: `scripts/compress-html.mjs` が admin / member / public 3 split の HTML に注入する起動ローダーは以下 6 要素を必ず備えること。1 つでも欠落させてはならない（Safari iOS 初回ホワイトアウト再発防止のため）。
  1. **CSS-only loading splash**: `<body>` 直後に `<div id="__boot_splash__">` を注入。spinner + 進捗ラベル + サブラベルを HTML/CSS のみで描画。JS 評価開始前から可視であること。
  2. **try/catch + 可視エラー UI**: async IIFE 全体・decompress promise・`new Function()` eval をすべて try/catch で包み、失敗時は splash を `.__err` 状態にして「再読み込みする」ボタン付きの明示エラー UI に切り替える。silent fail 禁止。
  3. **DecompressionStream feature detect**: `typeof DecompressionStream !== 'function'` および `new DecompressionStream('deflate-raw')` 構築 try/catch の両方で検査し、未サポート時は「iOS 16.4 以降の Safari、または最新の Chrome / Edge / Firefox を」とブラウザ更新を促すメッセージを表示する（DOM 準備後に実行すること）。
  4. **死んだ importmap の除去**: `<script type="importmap">` は `vite-plugin-singlefile` バンドルが自己完結のため不要。regex で必ず削除する（admin shell の parse コスト削減）。
  5. **Google Fonts 非ブロック化**: `<link rel="stylesheet" href="fonts.googleapis.com/...">` は `media="print" onload="this.media='all'"` + `preconnect` (fonts.googleapis.com + fonts.gstatic.com crossorigin) + `<noscript>` フォールバックの組合せに置換する。render-blocking な原形のまま残してはならない。
  6. **`requestIdleCallback` 分散**: `atob` / `DecompressionStream` pipe / `new Function()` eval は `requestIdleCallback`（fallback: `setTimeout`）で分散実行し、splash がリペイントされ続けるようにする。ブロッキング同期チェーンに戻してはならない。
  - 上記契約はリリース判定の必須条件とする。compress-html.mjs を編集する際は本契約を破らないこと。違反した実装は不完全とみなし、完了条件を満たさない。
  - v375 以前（v374 までの単純 IIFE）には決して戻さない。

---

# L4 入口と手順

## L4.1 最初に読むもの

> §1 のとおり **入口は本書**。この分け方が本リポジトリの唯一の正本であり、
> `README.md` や `docs/ONBOARDING.md` に別の順序を書かない。

**必ず読む 3 本**（2026-10-02 確定。13 本の通読は形骸化していたため絞った）

1. 本書 `AGENTS.md`
2. `HANDOVER.md` — 現況・次の作業・現行 version・残課題
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` — 本案件の固定運用

**作業に応じて開く**（読まずに触らない。該当する作業に入る前に必ず開く）

| 作業 | 開く文書 |
|---|---|
| リリース・デプロイ | `docs/09_DEPLOYMENT_POLICY.md`、`HANDOVER.md` 記載の最新 release state |
| 仕様の確認・変更 | `docs/spec/README.md` → 対象の正本（全体レビュー時は SOW / RD / TRD / UI-UX / データIF の 5 文書） |
| DB・スキーマ | `docs/03_DATA_MODEL.md`、`docs/04_DB_OPERATION_RUNBOOK.md` |
| 新機能の追加 | `docs/288_FEATURE_INVENTORY.md`（二重実装の確認） |
| セキュリティ・承認 | `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md` |
| 品質・ワークフロー | `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md` |
| 過去の失敗を踏まないため | `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`、MEMORY のフィードバック |
| 文書の書き方 | `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md` |
| 日次運用 | `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` |
| 体制・役割 | `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md` |

`docs/archive/` は過去の記録置き場であり、**現況・仕様の参照先にしない**（`HANDOVER.md` §5）。
個別の経緯を追うときだけ `docs/archive/00_ARCHIVE_INDEX.md` から開く。

## L4.2 手順は Skill が正本

| Skill | いつ呼ぶか |
|---|---|
| `/release` | リリース・デプロイ・本番反映・ロールバック |
| `/doc` | docs を書く・直す・整理する、ER 図・portal の再生成 |
| `/spec-change` | 業務ルール（BR-xx）を新設・変更・撤回する。仕様と実装の食い違いを直す |
| `/dbops` | **本番 DB に書き込む**。データ修正・変更申請の承認・テストデータ・dryRun・実データ検証 |

**`/dbops` はテストのときだけの話ではない。** operator 依頼の 1 セル修正も同じ手順を通す。

**Skill はセッション開始時に読み込まれる。** 作成直後の同一セッションでは呼べない。

## L4.3 完了条件

- **「動いた」だけでは完了としない。**
- **リリースの手順は Skill `/release` が正本。** リリース・デプロイ・本番反映に入る前に必ず呼ぶ。
  build → push → version → fixed deployment 4 本同期 → 検証 → 文書更新、E2E 回帰、ロールバック手順を含む。
  （2026-10-02 に本節から移送。毎ターン読む必要が無い手順のため。`docs/296`）
- **prerelease を通していない HEAD は push できない**（PreToolUse hook が拒否する）。
- **未検証・残課題・承認待ちは必ず明記する。** 黙って埋めたことにしない。

## L4.4 補助参照

- 文書索引: `docs/00_DOC_INDEX.md`
- 現況の正本: `HANDOVER.md`
- 日次運用: `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
- 条文棚卸し: `docs/297_RULES_INVENTORY_2026-10-02.md`（生成物）
- 再構成の設計: `docs/296_RULES_ARCHITECTURE_DESIGN_2026-10-02.md`
- 開発拠点・GCP 移植ゲート（方針）: `docs/298_POLICY_WORKSPACE_AND_GCP_GATE_2026-10-03.md`
