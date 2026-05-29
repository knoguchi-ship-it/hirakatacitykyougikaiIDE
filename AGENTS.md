# AGENTS.md
# 枚方市介護支援専門員連絡協議会 会員システム

> このファイルを唯一のグランドルール入口とする。
> `CLAUDE.md` は後方互換用の案内のみとし、実体ルールはここへ集約する。

## 0. 最優先・絶対ルール（シークレット保管）

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

## 1. 入口の原則
- 最初に読む入口は常にこの `AGENTS.md`。
- 詳細ルールは `GLOBAL_GROUND_RULES/docs/AI_RULES/` 配下を正とする。
- システム仕様、運用値、固定値、現行状態は `HANDOVER.md` と `docs/*` の案件正本を正とする。
- グランドルールには版依存の現況値を埋め込まず、現行 version、fixed deployment の向き先、最新 release state の参照先は `HANDOVER.md` を都度更新して管理する。
- `AGENTS.md` と詳細ルールが衝突した場合は、詳細ルールを優先する。

## 2. 最初に読む順序
1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `HANDOVER.md` に記載された最新の release state 文書
11. `docs/09_DEPLOYMENT_POLICY.md`
12. `docs/05_AUTH_AND_ROLE_SPEC.md`
13. `docs/04_DB_OPERATION_RUNBOOK.md`
14. `docs/03_DATA_MODEL.md`
15. `docs/archive/historical/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`（補足状態サマリ。正本は `HANDOVER.md`）

## 3. 行動原則
- **実装・構成・デプロイに進む前に不明点を必ず確認する。** 複数の解釈が成立する場合は推測で実装せず、箇条書きで簡潔に質問し、YesNo または選択肢で答えられる形で確認を取る。この確認ステップを省略してよいのは、仕様・データ型・既存コードから100%確定できる場合のみ。詳細は `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md §実装開始前の必須確認` を参照。
- まず関連ファイルだけを読む。推測で壊さない。
- 技術、法務、セキュリティ、運用の提案前に、必要なら Web で最新の一次ソースを確認する。
- 外部標準は採用するが、案件正本と衝突する場合は案件正本を優先し、差分を記録する。
- 既存コード、prompt、運用手順の修正は差分修正を原則とする。
- Git 管理の原則は「追跡すべきものは全て追跡する」。未追跡のまま許容してよいのは、生成物・ローカルメモ・資格情報・一時ファイルなど、案件ルールまたは `.gitignore` / 正本文書で例外として明示されたものだけとする。
- 実ブラウザでの実行確認は操作者側が行うことを既定とし、AI / agent はコード上の整合確認、build、Apps Script 実行系コマンド確認、取得できるエラーの調査を担当する。
- コード、データ、デプロイ、UI、認証、運用手順を変えたら、関連正本を同ターンで更新する。
- **文書作成・更新時の文字コード統一は絶対ルールとする。** 今後作成・更新する Markdown / HTML / text 系ドキュメントは、現在正常に日本語表示できている既存正本文書と同じ文字コード（原則 UTF-8）で保存する。PowerShell 等の既定エンコーディングに依存した読み書きを避け、保存後は文字化けがないことを確認する。文字化けが疑われる場合は、その文書の更新を完了扱いにせず、先に復旧する。
- 文字化け、参照切れ、版ずれ、古い入口があれば先に直す。

## 4. この案件で崩してはいけない固定運用

### 4.1 Deploy SOP
- 現行本番 version と fixed deployment の向き先は `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` を正とし、この文書には固定で埋め込まない。
- fixed deployment 2 本運用を維持し、片系だけ更新しない。
- production の fixed deployment 同期は `npx clasp redeploy` を標準とし、Apps Script UI の `Manage deployments` 手更新は障害復旧時の補助手段としてのみ扱う。
- `npx clasp version` / `npx clasp redeploy` / `npx clasp deployments --json` / `npx clasp run ...` など Apps Script API に到達する本番系コマンドは、同じネットワーク失敗を避けるため、最初から承認済みの安定した実行経路で流す。失敗してから通常経路→昇格経路の二度打ちを標準にしない。
- 認証、認可、DB 整合、deployment 検証は Apps Script 実行系で確認する。

### 4.2 認証フロー（不変）
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証。
- demo login、mock member route、画面内 demo selector は復活させない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。

### 4.3 セキュリティ運用
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない（§6 不可逆操作 一般則の最頻 例外）。
- **パスワード hash pepper の本番前提**: versioned PBKDF2-HMAC-SHA256 + verifier-side pepper を含む認証変更は、本番反映前に integrated/public・member split・admin split の全 Apps Script project へ同一の強乱数 Script Property `PASSWORD_HASH_PEPPER_V1` が設定済みであることを必須条件とする（値そのものの取扱いは §0 シークレット保管に準拠。`.env` は Apps Script 本番 runtime の正本にせず、必要な場合でも未コミットのローカル運用補助に限定）。未設定 project がある状態で push / version / redeploy してはならない。
- **保留中だが必須の security backlog**: pepper を Script Properties から Google Cloud Secret Manager へ移行し、さらに Apps Script 内 PBKDF2 制約を解消する外部 KDF / managed identity の採否を決定するタスクは、保留にしてよいが破棄してはならない。次回以降のセキュリティ改善計画で必ず再開し、完了または明示的な代替設計決定まで `HANDOVER.md` と関連仕様に残す。

### 4.4 UI/UX 規約
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

### 4.5 ランタイム契約

- **boot loader 契約（v375〜確定）**: `scripts/compress-html.mjs` が admin / member / public 3 split の HTML に注入する起動ローダーは以下 6 要素を必ず備えること。1 つでも欠落させてはならない（Safari iOS 初回ホワイトアウト再発防止のため）。
  1. **CSS-only loading splash**: `<body>` 直後に `<div id="__boot_splash__">` を注入。spinner + 進捗ラベル + サブラベルを HTML/CSS のみで描画。JS 評価開始前から可視であること。
  2. **try/catch + 可視エラー UI**: async IIFE 全体・decompress promise・`new Function()` eval をすべて try/catch で包み、失敗時は splash を `.__err` 状態にして「再読み込みする」ボタン付きの明示エラー UI に切り替える。silent fail 禁止。
  3. **DecompressionStream feature detect**: `typeof DecompressionStream !== 'function'` および `new DecompressionStream('deflate-raw')` 構築 try/catch の両方で検査し、未サポート時は「iOS 16.4 以降の Safari、または最新の Chrome / Edge / Firefox を」とブラウザ更新を促すメッセージを表示する（DOM 準備後に実行すること）。
  4. **死んだ importmap の除去**: `<script type="importmap">` は `vite-plugin-singlefile` バンドルが自己完結のため不要。regex で必ず削除する（admin shell の parse コスト削減）。
  5. **Google Fonts 非ブロック化**: `<link rel="stylesheet" href="fonts.googleapis.com/...">` は `media="print" onload="this.media='all'"` + `preconnect` (fonts.googleapis.com + fonts.gstatic.com crossorigin) + `<noscript>` フォールバックの組合せに置換する。render-blocking な原形のまま残してはならない。
  6. **`requestIdleCallback` 分散**: `atob` / `DecompressionStream` pipe / `new Function()` eval は `requestIdleCallback`（fallback: `setTimeout`）で分散実行し、splash がリペイントされ続けるようにする。ブロッキング同期チェーンに戻してはならない。
  - 上記契約はリリース判定の必須条件とする。compress-html.mjs を編集する際は本契約を破らないこと。違反した実装は不完全とみなし、完了条件を満たさない。
  - v375 以前（v374 までの単純 IIFE）には決して戻さない。

## 5. 完了条件
- 「動いた」だけでは完了としない。
- release 完了条件は `build -> push -> version -> fixed deployment sync -> verification -> document update`。
- **push 前に `git diff` で作業ツリー全体を確認し、自分の変更以外の未コミット変更が存在する場合はその影響範囲を評価する。** 問題がある場合はファイル単位で push 範囲を限定するかユーザーに確認してから進む。
- **`git status --short` で未追跡ファイルが出た場合は、追跡対象か例外かを必ず判定する。** 追跡対象なら同ターンで追加・記録し、未追跡でよい場合はその根拠を `.gitignore` または案件正本へ明示する。
- fixed deployment sync は既知の deployment ID に対する `npx clasp redeploy ... --versionNumber ...` を正とし、結果は `npx clasp deployments --json` で確認する。
- 毎回更新する文書は `HANDOVER.md`、`docs/09_DEPLOYMENT_POLICY.md`、必要に応じた release state 文書とし、`AGENTS.md` や案件固定ルールは運用原則が変わった場合にのみ更新する。
- 実ブラウザ確認が未実施でも、コード上の検証結果と確認待ち範囲を必ず明記し、操作者による確認に引き継げる状態で完了報告する。
- password verifier / credential generation を変更する release では、`PASSWORD_HASH_PEPPER_V1` が integrated/public・member split・admin split の Script Properties に同一値で設定済みであることを、値を表示・記録せず確認する。
- 未検証、残課題、承認待ちは必ず明記する。

## 6. セキュリティと承認
- 本番 deploy、DB 更新、権限変更、外部送信、不可逆操作は人間承認を前提とする（具体的破壊操作の運用注意は §4.3 参照）。
- secret value の取扱いは §0 を絶対正本とする（pepper、token、鍵、認証情報、その他あらゆる秘密値）。
- AI / agent 特有のリスクも通常のアプリケーションセキュリティと同じ優先度で扱う。
- 外部入力は不信入力として扱い、モデル出力をそのまま shell、SQL、HTML、デプロイ設定へ流し込まない。
- **確定済みセキュリティ境界への逆行案提示禁止**: 第三者評価（`docs/109`）や設計決定（`docs/111`）で確定した認証境界・アクセス制御・プロジェクト分離に反する案を「選択肢の一つ」として対等に提示してはならない。利便性はセキュリティ境界を崩す理由にならない。やむを得ず言及する場合は「**非推奨・セキュリティリスクあり**」を冒頭に明示し、推奨しないことを基本姿勢とする。
- **このプロジェクトの確定済み境界**: admin（DOMAIN・Google セッション・管理専用）/ member（匿名・ID/PW・会員専用）/ public（完全匿名・申込専用）。3境界の混在・統合提案は上記ルールに従う。

## 7. 補助参照
- 文書索引: `docs/00_DOC_INDEX.md`
- 現況の正本: `HANDOVER.md`
- 日次運用: `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
