# Release Notes 2026

このファイルは **時系列の release ログ**です。リリース確定後は本書のエントリだけ更新し、`HANDOVER.md` は「現状」のみ保持してください。
詳細な背景・設計判断・修正コードは個別 `docs/2XX_RELEASE_STATE_*.md` を参照。

凡例:
- 🆕 = 機能追加
- 🔧 = 改善 / リファクタ
- 🐛 = バグ修正
- 🔒 = セキュリティ
- 📝 = ドキュメント / ツール
- 🎉 = マイルストーン

---

## v376.68 / .68.1 / .68.2 — 2026-09-03 🆕 汎用データエクスポート（CSV）（全3split @377×2 / @136 / @233）

GCP 移行の前提機能を GAS 側で先行実装（`docs/261` T-07・operator 判断）。移行後はスプレッドシートを直接開けなくなるため、
任意のテーブルを CSV で取り出す手段を先に用意した。

- **画面**: 管理ポータル → システム → データ出力（CSV）。UTF-8 BOM 付きで Excel がそのまま開ける。
- **権限**: 新メニュー `data-export`。**既定は MASTER のみ**（deny-by-default）。事務局へ渡す場合は権限管理から明示付与。
- **安全設計**: 認証テーブルとそのアーカイブは MASTER でも出力不可／ログ系と設定は MASTER 限定／未知テーブル名を拒否／
  **持ち出しを監査ログに記録**（中身は残さない）／CSV インジェクション対策（`=` `+` `-` `@` を無効化）／1 回 20,000 行の上限。
- **🐛 v376.68.1**: `T_認証アカウント_archive` が出力対象に混入していた（禁止判定が完全一致だったため、
  削除アーカイブがパスワードハッシュを保持したまま出力可能だった）。`_archive` を外してから判定する共通関数へ是正し、
  一覧と出力の両方が同じ判定を通ることを unit test で固定。**live 画面確認で検出**（dryRun では捕捉できていなかった）。
- **🐛 v376.68.2**: 一覧の表示に 20 秒かかっていた（56 シート分の行数取得）。一覧では行数を返さない方式に変更し **5.5 秒**へ。
- **ビルドの罠**: 二重引用符を含む正規表現で関数抽出パーサが壊れ、以降の関数が生成物から消える（operator ツール 4 件が消失）。
  正規表現を使わない実装へ変更し、ソースに警告コメントを残した。恒久対策（パーサ修正）は `docs/260` §4 の残課題。
- **検証**: prerelease 全ゲート PASS（新ゲート `test:data-export` 12 件）。live は dryRun 10 チェック全 PASS／
  管理画面の実動作／**実 CSV の中身**（`コード,名称,表示順,有効フラグ,年会費金額`）／admin 56 view／メール設定 5/5／公開 a11y 0・21 view。
- 詳細は `docs/262_RELEASE_STATE_v376.68_2026-09-03.md`。

---

## v376.67 — 2026-09-03 🔧 DRY 全面是正（単一情報源へ集約）＋研修リマインダーのカテゴリ誤り修正（全3split @374×2 / @133 / @230）

operator 指示による棚卸し監査。実測に基づく監査結果は `docs/260_SINGLE_SOURCE_AUDIT_2026-09-03.md`。

- **🐛 新規発見・実害**: 研修リマインダーが `TRAINING_REMINDER` のテンプレートを描画しながら `deliverMail_('BULK_MAIL', …)` で
  送信していた。`deliverMail_` は `<CATEGORY>_ENABLED` でカテゴリ別 ON/OFF を判定するため、
  設定「研修リマインダーメール」のトグルが**まったく効かず**、逆に「一括メール送信」を切ると研修リマインダーまで止まっていた。
  送信ログのカテゴリも誤記録。`TRAINING_REMINDER` へ是正。
- **🐛 検証の食い違い**: 郵便番号が公開申込 `^\d{3}-\d{4}$`（ハイフン必須）／管理 2 画面 `^\d{3}-?\d{4}$`（任意）で、
  同じ項目なのに公開だけ `5730000` を弾いていた。共有パターン（ハイフン任意＋`normalizePostalCode()`）へ統一。
  電話は共有 `PHONE_PATTERN` が存在するのに誰も使っておらず 3 画面が独自実装だった。
- **集約**: 会員種別ラベル・年会費既定値・年会費整形を `src/shared/memberTypes.mjs` へ（front 9 + GAS 7 箇所の直書きを解消。
  GAS へは build 注入）。メール差し込みタグのカタログを唯一の参照元に（UI の直書き 4 箇所を撤去）。
  汎用レンダラを `renderMergeTags_` へ改名。テストのミラー実装を実ソース抽出へ置換。
- **新ゲート `test:single-source`（8 検査）** を prerelease に追加し、`AGENTS.md` §3 に**正本レジストリ**を明文化。
- **検証**: prerelease 全ゲート PASS。live E2E は 公開 a11y 0／公開 responsive 21 view／admin responsive 56 view／
  メール設定 E2E 5/5／`dryRunMailMergeTagsV376_66_LOG` 7 チェック全 PASS（リファクタ後の非退行を実 DB で確認）。

---

## v376.66 — 2026-09-03 🐛 事業所会員の入会承認メールで差し込みタグが未置換だった本番障害の是正（全3split @373×2 / @132 / @229）

事業所会員へ送る入会承認メールの本文が `平井 ○○様の会員種別は{{会員種別}}となります。その為、年会費は{{年会費}}となります。`
のままで届いていた（operator 報告）。個人会員は正常だった。

- **根本原因**: 承認メールの送信経路が会員種別で 2 本に分かれている。個人/賛助は `sendCredentialEmail_`（両タグを置換）、
  事業所は `renderBizEmailTemplate_(template, bizVars)`。後者は**渡された key だけ**を置換する実装で、
  `bizVars` に `会員種別` / `年会費` が無かったため未知タグとして素通りしていた。値自体は直前で `M_会員種別` から
  取得済み（`memberTypeLabelForEmail` / `annualFeeForEmail`）で、個人向けの `credEmailOpts` にだけ載せていた取りこぼし。
- **修正**: ①`bizVars` に `会員種別` / `年会費` を追加（代表者・メンバー両方）②年会費の整形を `formatAnnualFeeForMail_`
  へ共通化（`3000`→`3,000円`・0/不正値は空文字）③**全メール共通の出口 `deliverMail_` で未解決タグを送信直前に除去**し
  `[mail/unresolved-merge-tag]` をログに残す（本文・宛先は出さない）④管理画面の差し込みタグ案内を送信側と一致させた。
- **クラスの欠陥を塞いだ**: これまでは、どのテンプレートでもタグを打ち間違えれば生の `{{...}}` が会員へ届く状態だった。
- **検証**: prerelease 全ゲート PASS（新ゲート `test:mail-merge-tags` 9 件）。**live 検証（dryRun / メール設定 E2E）は
  admin セッション失効のため未実施**（`HANDOVER.md` §2-1 に残作業として記載）。
- 詳細は `docs/259_RELEASE_STATE_v376.66_2026-09-03.md`。

---

## v376.65 / .65.1 / .65.2 — 2026-09-02 🆕 規程・重要事項マスタ（案C Phase 1）（全3split @372×2 / @131 / @228）

入会申込画面の規定・重要事項を DB 管理にし、事務局が改定できるようにした。同意記録は Phase 2 で未着手。

- **`T_規程` を新設**: 区分（重要事項 / 規程・定款）・タイトル・本文・外部リンク・対象会員種別・版数・施行日・表示順・公開フラグ。
- **本文の正本を 1 箇所へ**: 従来フロントにハードコードされていた `MEMBERSHIP_NOTICE_HIGHLIGHTS` / `INCORPORATION_URL` を廃し、
  取得できないときだけ使う `FALLBACK_REGULATIONS` に降格。初期 seed は現行文面 5 件そのままで**表示内容は不変**。
- **管理 UI**: 設定 → 規程・重要事項（追加・編集・削除・公開/非公開・表示順）。action は `admin-settings` メニュー配下に登録。
- **公開境界は不変**: 読みは `getPublicPortalSettings` に相乗り（公開フラグの立った行のみ）、書きは admin action のみ。**public action は増やしていない**。
- **版数**: タイトル・本文・リンクが変わった保存でだけ +1（Phase 2 の同意記録が指す版）。
- **🐛 v376.65.1**: 新テーブル追加時の `DB_SCHEMA_VERSION` bump 漏れで `T_規程` が作られていなかった（公開側はフォールバック表示のため
  画面上は正常に見えていた。dryRun で検知）。bump して解消。
- **🐛 v376.65.2**: `ADMIN_ALLOWED_ACTIONS_LIST` への登録漏れで、`listRegulations` が実行時に `未実装アクションです` を返し
  管理画面が「読込中...」のまま固まっていた（`ACTION_TO_MENU` / `ADMIN_ACTION_PERMISSIONS` には登録済みだった）。
  許可リストへ追加して解消し、**`test:menu-registry` に「ACTION_TO_MENU の admin action は許可リストにある」ゲートを新設**して再発を防いだ。
- **検証**: prerelease 全ゲート PASS（新ゲート `test:regulations` 9 件）。live E2E は 公開 a11y 0／公開 responsive 21 view／
  重要事項ダイアログの表示を実測／**admin responsive 56 view**／メール設定 E2E 5/5／`dryRunRegulationsV376_65_LOG` 10 チェック全 PASS／管理画面に規程 5 件が並ぶことを実測。
- 詳細は `docs/258_RELEASE_STATE_v376.65_2026-09-02.md`。

---

## v376.64 — 2026-09-02 🆕 会費設定（会員種別ごとの年会費を設定画面から変更・入会申込カードに表示）＋既存不具合の是正（全3split @369×2 / @128 / @225）

公開ポータルの入会申込画面に会員種別ごとの会費を表示し、その金額を管理画面から変更できるようにした。

- **正本を増やさない設計**: 金額は既存の `M_会員種別.年会費金額` の 1 列のみ（年会費請求・メール差し込みと同じ列）。`T_システム設定` に増やしたのは表示制御 `MEMBERSHIP_FEE_PUBLIC_VISIBLE` / `MEMBERSHIP_FEE_NOTE` だけで、**金額は二重に持たない**（unit test でソース契約として固定）。
- **管理 UI**: 設定サブナビに「会費設定」を新設（種別ごとの金額 0〜1,000,000 円・公開表示トグル・補足文）。「年会費の納入案内」「共通振込先」も基本設定からここへ移設。
- **公開 UI**: 入会申込の会員種別カードに「年会費 N,NNN円」を表示。カードを `sm:` から 3 列化。
- **🐛 既存不具合の是正**: `ensureMemberTypeAnnualFeeAmounts_` がスキーマ初期化のたびに 3000/8000/5000 で**無条件上書き**しており、設定しても次回 admin ログインで元に戻る状態だった。「未設定のときだけ補完」に変更し、空欄と 0 円（会費無料）を区別。
- **公開境界は不変**: 会費の読みは `getPublicPortalSettings` に相乗り、書きは既存 `updateSystemSettings` のみ。**新しい public action は追加していない**。
- **検証**: prerelease 全ゲート PASS（新ゲート `test:membership-fee` 6 件を追加）。live E2E は 公開 a11y 0／公開 responsive 7VP／**入会申込カードに 3,000・8,000・5,000 円の表示を実測**／admin responsive 56 view／メール設定 E2E 5/5／`dryRunMembershipFeeV376_64_LOG` が `passed:true`・`restored:true`。
- 詳細は `docs/257_RELEASE_STATE_v376.64_2026-09-02.md`。

---

## v376.63 — 2026-09-02 🔧 管理画面の日本語表記統一＋保守モード解除（全3split @368×2 / @127 / @224）

operator 指摘「わざわざ英語を入れる必要はない／むやみに英語をデフォルトにしない」を受け、管理画面の表示文言を日本語基準に統一した。ロジック・スキーマ・API は無変更。

- **運用ルール変更**: 2026-08-02 に設定した GAS 側「保守モード」を**解除**（運用継続と、GCP 移行完了までの実装需要のため）。以後は通常開発モード。大型の新規 write 機能だけ着手前に GAS/GCP どちらで作るかを operator 確認する。正本 `AGENTS.md` §4.7。
- **語句ルールを明文化**: `AGENTS.md` §4.4 冒頭に「画面表示は日本語を既定とする」を新設（装飾英語禁止／英字は内部値・識別子と定着語のみ／その場合も日本語を主・英字を従／日本語見出しへの `uppercase` 禁止）。
- **是正内容**: `System Settings` 削除、`allowlist`→許可リスト、`ON/OFF`→有効／無効（トグル 19 箇所）、配信モード `LIVE/REDIRECT/SUPPRESS`→通常送信／テスト集約／送信抑止（英字併記）、`Step 1/2/3`→手順1/2/3、`Visual Designer`→レイアウト設計、`FROM/TO`→開始／終了、`AND`/`NOT`/`opt-out`/`SOW` の平文化、日本語要素の `uppercase` 28 箇所除去。対象 17 ファイル。
- **公開ポータル既定値**: `trainingBadgeLabel` を `TRAINING`→`研修申込`（DB 保存値は不変のため、必要なら設定画面で上書き）。
- **検証**: prerelease 全ゲート PASS・3 split 生成物 grep PASS。デプロイ後 live E2E は 公開 a11y 0／公開 responsive 7VP／member responsive 7VP×3画面／admin responsive 56 view／メール設定 E2E 5/5 いずれも PASS（console error 0）。
- 詳細は `docs/archive/release_history/256_RELEASE_STATE_v376.63_2026-09-02.md`。

---

## v376.62 — 2026-09-02 🐛 メールテンプレート一覧が常に取得失敗していた本番障害の是正（全3split @367×2 / @126 / @223）

管理画面「メール通知」の各カードに出ていた `テンプレート一覧の取得に失敗しました` を是正した。**v376.42 の機能追加以降ずっと発生していた**（実測: `listMailTemplates` が全 14 カテゴリで `mailTemplateRecordFromRow_ is not defined`）。

- **根本原因**: build pruner の到達性判定が `name(` の呼び出し構文しか参照と見なしておらず、`rows.map(mailTemplateRecordFromRow_)` のように**関数を値として渡す参照**を検出できなかった。結果、当該関数は到達不能と判断され 3 split すべてから削除されていた（`git log -S` で生成物に一度も入っていないことを確認）。既存の boundary 監査はトップレベル callable と action 許可リストを見るもので、helper が解決できるかは見ていないため検知できなかった。
- **修正**: 到達性判定に値参照を追加。pruner は `gas-boundary-utils.mjs` / `build-admin-gas.mjs` / `build-member-gas.mjs` に**三重複製**されているため 3 箇所すべてに同一修正。あわせて参照走査をコメント/文字列マスク経由に変更（値参照を数え始めると、コメント内の言及だけで死にコードや禁止トップレベル関数が残るため）。
- **新ゲート**: `test:gas-artifact-refs` を新設し `prerelease` に組込。生成物が参照する gas-src 関数を、その生成物が宣言しているかを検査する（admin は `Code.gs`＋`dryrun.gs` を同一スコープ扱い）。
- **同時に解消した欠落**（新ゲートが検出）: member split の `normalizeClaimRecord_`（請求記録正規化が ReferenceError になる経路）と、admin の `addDeleteLogSheet`（`T_削除ログ` 未作成時のみ発火する潜在 ReferenceError。private 実体 `addDeleteLogSheet_` に分離して解消）。
- **検証**: prerelease 全ゲート PASS（新ゲートは修正前生成物で FAIL することを実測）。生成物は縮小（member −644B・admin −196B）。デプロイ後 live で**全 14 カテゴリ `status:ok`**、公開 a11y 0・公開 responsive 7VP・member responsive 7VP・admin responsive 56 view・mail-settings E2E 5/5・dryRun 2 種 `passed:true`。
- 詳細: docs/archive/release_history/254_RELEASE_STATE_v376.62_2026-09-02.md

---

## v376.61 — 2026-09-02 🐛 研修「開催終了時刻」の実害バグ是正（全3split @366×2 / @125 / @222）

管理画面で研修の開催終了時刻が空表示になり、そのまま保存すると値が消える不具合を是正した。GCP 作業場からの申し送り「課題A」（2026-08-31 operator 決定）への対応。

- **endTime の正規化**: `mapTrainingRowsForApi_` がシートのセル値を `String()` で素通ししていたため、セルが Date のとき JS Date の文字列表現が API 応答に出ていた。既存の `formatTimeOnly_()`（`Asia/Tokyo` の `HH:mm`）経由に変更。`<input type="time">` は `HH:mm` しか受け付けないため、これが空表示→保存で終了時刻消失の直接原因だった。公開ポータル側の mapper は元から正しく、admin 系のみ未対応だった。
- **回帰ゲート新設**: `test:training-time` を `prerelease` 連鎖へ追加。`formatTimeOnly_` を **gas-src の実ソースから抽出して評価**し、さらに「シート列から作る endTime は必ず `formatTimeOnly_` を通す」というソース契約を固定。修正前コードで FAIL することを実測して有効性を確認済み。
- **operator 用 dryRun**: `dryRunTrainingEndTimeV376_61_LOG`（非送信）。検証行を作成→管理画面と同じ経路で読み戻し→再保存→物理削除。あわせて壊れたセルを持つ研修 ID を列挙する。
- **テストハーネス是正**: 公開レスポンシブ計測が固定待ち時間のため VP ごとに偽 FAIL していた（同一ビルドで FAIL 集合が変動）。主要 CTA の出現を条件待ちしてから計測するよう変更。
- **検証**: prerelease 全ゲート PASS、3 split 生成物 grep PASS、fixed deployment 4 本同期確認、デプロイ後 live で公開 a11y 違反 0・公開 responsive 7VP・member responsive 7VP 全 PASS。管理画面 E2E と Execution API dry-run は認証・権限待ち。
- **残**: `T_研修` の壊れた 3 セルの復元（課題B・operator 手作業）／GCP 側の再突合（課題C）。
- 詳細: docs/archive/release_history/253_RELEASE_STATE_v376.61_2026-09-02.md

---

## v376.60 — 2026-09-02 🐛 メール設定・自動送信の是正（全3split @365×2 / @124 / @221）

公開ポータルの入会・変更申請に関する自動メールを、設定画面どおりに制御できるよう是正した。

- **受付確認メールのOFFを厳密化**: 保存された Boolean false を未設定扱いしないよう修正。OFFのときは受付確認メールを送らない。
- **事業所の送信先を代表者へ固定**: 申込 staff の先頭ではなく、role=REPRESENTATIVE の職員メールを解決する。代表者が見つからない場合は送らずエラーにする。
- **自動メールの送信元を一元化**: 自動通知だけは共通送信元設定を使用する。明示的な一括メール・手動送信の送信元は上書きしない。
- **OFF中のテンプレート編集を可能化**: 通知をOFFにしたまま、メール内容・保存済みテンプレートを開いて読み込み・編集できる。
- **検証**: 専用unit test、3 split生成物確認、fixed deployment同期、公開a11y（違反0）を完了。管理画面E2EとExecution API dry-runは認証権限待ちのため、FAIL/BLOCKEDとしてHTML記録へ明記。
- 詳細: docs/archive/release_history/252_RELEASE_STATE_v376.60_2026-09-02.md / docs/portal/test-report.html

---

## v376.58 — 2026-07-19 🔧 GCP 移行 Phase 3: GcpApiClient read 実装（全3split @364×2 / @123 / @220・既定 GAS 経路で挙動不変・公開E2E非破壊確認済）

GCP 移行 Phase 3（`docs/250` §5・GCP 作業場 `docs/PHASE3_DESIGN.md` §3）: Phase 1 で用意した transport の器に、**read-only 2 action に限る fetch 実装**を追加した。**既定は従来どおり GAS 経路（GasApiClient）で挙動不変**。gas-src/Code.gs・DB schema・認証は一切不変。

- **`src/shared/api-base.ts` に GCP runtime 分岐** 🔧: `callApi` は `window.__APP_CONFIG__.apiRuntime==='gcp'` の明示時のみ `callGcpApi`（`POST {apiBaseUrl}/api {action,payload}` → GAS 同一 `{success,data|error}` envelope unwrap）へ。**allowlist は portal-api サーバー側と同一の `getPublicTrainings`/`getPublicPortalSettings` のみ**で、allowlist 外 action は fetch を呼ばず deny-by-default reject（クライアント/サーバー二重防御）。
- **`GcpApiClient.callAction` 実装** 🔧: `callGcpApi` への委譲（PHASE3_DESIGN §6 member-read 拡張の呼び口）。`ApiClient` interface の各 method は stub「未実装」reject のまま＝member/admin 挙動不変。`AppRuntimeConfig.apiAuthToken`（ローカル検証専用 Bearer・build 生成物へ非注入）を追加。
- **検証**: 新設 `test:gcp-transport` unit 10/10（envelope unwrap／HTTP エラー経路／apiBaseUrl 未設定／deny-by-default／runtime 分岐＝既定 GAS 経路不変）を prerelease 連鎖に追加し全ゲート PASS。3 split 生成物 grep（`__APP_CONFIG__={apiRuntime:'gas'}` のみ 3/3・apiAuthToken 値非注入・`var テーブル定義` 3/3・boot splash 残存・importmap 除去）PASS。
- **デプロイ後 live E2E**: 公開 `test:a11y` 違反 0／`test:responsive` 全 7VP PASS。member/admin は書込フロー変更なし（transport 追加のみ・stub 到達不能）のため公開 E2E＋prerelease で非破壊を判定。
- ロールバック先: public `@363`×2／member `@122`／admin `@219`。

---

## v376.57 — 2026-07-11 🔧 GCP 移行 Phase 1: frontend transport 分離（全3split @363×2 / @122 / @219・挙動不変・公開E2E＋会員E2E非破壊確認済）

GCP 移行（`docs/250` §12.7 Phase 1・非破壊）の第一歩として、frontend の API 呼び出し層を transport 抽象化した。**既定は従来どおり GAS 経路（GasApiClient）で挙動不変**。gas-src/Code.gs・DB schema・認証は一切不変。

- **`src/services/api.ts` に `createApiClient(config)` factory** 🔧: `window.__APP_CONFIG__.apiRuntime` が `'gcp'` のときのみ `GcpApiClient` を返し、それ以外（`'gas'`・未設定・不正値）は従来の `GasApiClient` を返す fail-safe 設計。
- **`GcpApiClient` の器**: 全 method を GasApiClient prototype から自動導出した未実装 reject stub として用意（Phase 2 以降で実装を差し替え）。現時点で本番から到達不能。
- **`window.__APP_CONFIG__` 型定義追加**＋`scripts/compress-html.mjs` が GAS 配信 build に `window.__APP_CONFIG__={apiRuntime:'gas'}` を注入（3 split 生成物 grep で 3/3 確認）。
- **検証**: `prerelease` 全ゲート PASS／typecheck PASS／3 split build 再現性確認（rebuild 後 `git status` clean）／生成物 grep（`__APP_CONFIG__` 3/3・`var テーブル定義` 3/3・boot loader splash 残存・デプロイ生成物の importmap 除去）PASS。
- **デプロイ後 live E2E**: 公開 `test:a11y` 違反 0／`test:responsive` 全 7VP PASS（横スクロールなし・タップターゲット 44px 以上）／**`test:responsive:member` 全 7VP PASS**（ダミー会員 fixture 経由・新 @122 で会員ログイン〜描画の非破壊を実証）。`test:responsive:admin` は当初 storageState の Google セッション失効（accounts.google.com へリダイレクト実測）で実行不能だったが、**同日 operator ログインで storageState を再取得し実行 → 全 7VP × 8 コンソール = 56 view 全 PASS**（横スクロール 0・タップターゲット違反 0・console error 0）。3 split すべてで非破壊を機械検証済。
- ロールバック先: public `@362`×2／member `@121`／admin `@218`。

---

## v376.56 — 2026-07-10 🆕 認証アカウントの新規発行（未発行の会員本人・事業所職員へ）（全3split @362×2 / @121 / @218・公開E2E非破壊確認済／会員ログインE2Eはoperator検証待ち）

v376.55 のパスワードリセットは「既存の認証アカウント」しか対象にできず、①一度も認証発行されていない会員 ②公開ポータルで後から追加された事業所職員（`addPublicStaffMember_` は認証を作らない設計）③テスト会員 に対して**パスワードを発行できない**という制約があった（operator 指摘）。これを解消する「発行」機能を追加。

- **新 action `adminIssueMemberCredential`（write・MASTER/ADMIN・会員管理メニュー配下）** 🆕: 認証アカウントが無い対象へログインID（CM番号ベース or 自動発番・重複回避）＋初期パスワード（安全乱数15文字）を発行し `T_認証アカウント` に新規行作成。`createPasswordAuthRow_`（`hashPasswordCurrent_` 使用＝ARGON2追従）を再利用。**会員種別からの推測はせず**、個人/賛助=会員本人（staffId なし）・事業所=職員（staffId 必須）を明示指定。代表者は `職員権限コード='REPRESENTATIVE'`→`BUSINESS_ADMIN`、他は `BUSINESS_MEMBER`。既に PASSWORD 認証がある対象は発行不可（リセットへ誘導）。LockService で採番競合防止。平文は戻り値で1度だけ・ログ/監査に値非記録（§0・`CREDENTIAL_ISSUE`）。
- **`getMemberAuthAccounts` 拡張** 🔧: 発行済み（`issued:true`）に加え、**未発行ユニット**（個人/賛助=会員本人、事業所=各職員）を `issued:false` で列挙。
- **UI** 🔧: 「🔑 パスワード管理」パネルで未発行行に「ログインID・パスワードを発行」ボタン、発行済み行に「パスワードリセット」。結果モーダルは発行/リセット共通（新パスワードを一度だけ表示）。
- **検証**: typecheck / prerelease 全ゲート PASS（menu-registry 含む）。3 生成物 grep で admin 限定・dryrun.gs 非混入・member/public 非露出を確認。**デプロイ済（2026-07-10・全3split）＋デプロイ後 live 公開E2E（a11y 0・responsive 7VP overflow 0）で非破壊確認**。**会員ログイン E2E 完全 PASS（2026-07-10・全7VP）**: operator が本機能でダミー会員へ資格情報を発行→その ログインID/PW でログイン→マイページ・研修申込まで描画・overflow 0・login fatal 0（console error 1 は無害な report-only CSP frame-ancestors）。**積年の「member E2E storageState 期限切れ未 PASS」を解消**。パスワード経路（`ARGON2_ENABLED=false`=PBKDF2）の非破壊も同時に実証。

---

## v376.55 — 2026-07-09 🆕 管理者による会員パスワードリセット + dryRun 棚卸し（全3split @361×2 / @120 / @217・公開E2E非破壊確認済／会員ログインE2Eはoperator検証待ち）

会員がパスワードを失念し OTP も使えない場合の救済、およびテスト用会員の資格情報整備のため、admin が会員のパスワードをリセットできる機能を追加。**既存の認証・会員処理は一切変更せず新規 action 追加のみ**（回帰リスク最小）。

- **新 action（admin・MASTER/ADMIN のみ・会員管理メニュー配下）** 🆕:
  - `getMemberAuthAccounts`（read）: 会員に紐づく認証アカウントを列挙（`認証ID`/`ログインID`/`認証方式`/有効/ロック/単位[会員本人・職員]/氏名）。**会員種別からの推測をせず実データ（会員ID一致）で紐付けを列挙**。機密（ハッシュ/ソルト）は返さない。
  - `adminResetMemberPassword`（write）: **`認証ID`（内部一意キー）必須**で対象を一意特定（operator 指摘反映・会員ID/種別からの推測は廃止=誤リセット防止）。新パスワードを `generateCredentialTempPassword_`（安全乱数15文字）で生成→`hashPasswordCurrent_` でハッシュ（ARGON2_ENABLED 状態に自動追従）。同時にロック解除/失敗回数0。平文は戻り値で1度だけ返し、ログ・監査に平文/ハッシュは記録しない（AGENTS §0）。PASSWORD 方式のみ・削除済は不可。監査は `T_監査ログ` に `PASSWORD_RESET`（値非記録）。
- **UI** 🆕: 会員詳細（`MemberDetailAdmin`）に「🔑 パスワード管理」パネル。認証アカウントを遅延読込で一覧表示→行ごとに「パスワードリセット」→新パスワードを一度だけモーダル表示（コピー可）。ログインID=顧客表示用、認証ID=内部特定用の役割分担を UI に反映。
- **dryRun 棚卸し（別コミット `f805a96`・同梱）** 🔧: 完了済み一回性ツール12関数を削除、継続利用24ツールを build 時に `gas/admin/dryrun.gs` へ自動分離。audit-admin-boundary に分離検査を追加。
- **検証**: typecheck / prerelease 全ゲート PASS（security audit・boundary×3・全 unit・er-sync・menu-registry）。3 生成物 grep で admin のみに関数配置・member/public 非露出・dryrun.gs 非混入を確認。**デプロイ済（2026-07-09・全3split）＋デプロイ後 live 公開E2E（a11y 0・responsive 7VP overflow 0）で非破壊確認**。**残（operator）**: ダミー会員作成→本機能でパスワードリセット→`.env.test` 設定→`test:responsive:member` で会員ログイン E2E 実証。

---

## v376.54 — 2026-07-08 🔒🎉 GCP Phase B: Cloud Run Argon2id 連携基盤（全3split @360×2 / @119 / @216・挙動不変）

`docs/250` §5 Phase B 手順 1〜11 を完了。**`ARGON2_ENABLED=false`（既定）のためログイン・credential 発行の挙動は現行 PBKDF2 と完全同一**。有効化は operator 承認後に別途実施（rollback は flag を false に戻すだけ）。

- **scope** 🔒: 3 split manifest に `openid`（identity token 取得用）、public/member に `userinfo.email` 追加（Cloud Run app の `ALLOWED_INVOKERS` email allowlist 維持の設計決定・operator 再同意済・匿名利用者影響なし）。
- **Secret 名是正** 🔧: GAS の Secret Manager 参照を GCP 実体 `PASSWORD_HASH_PEPPER_V1` に一致（旧 `password-hash-pepper-v1` は 404→Properties fallback に倒れていた）。Script Property `PASSWORD_HASH_PEPPER_SECRET_NAME` で上書き可。**dryRun で Secret Manager 経路の取得成功を実測**（これまで実質 Properties 運用だったものが SM 優先に）。
- **Argon2id 連携** 🆕: `hashPasswordCurrent_`（生成13箇所を単一スイッチへ集約・flag OFF=PBKDF2）／`hashPasswordArgon2_`・`verifyPasswordArgon2_`・`callCloudRunHashService_`（identity token 認証・fail-closed・token/password/pepper 値は例外・ログに非出力）／`verifyPassword_` に `argon2id:v1:` prefix 自動判別（flag 無関係に常時検証可＝rollback 後も Argon2 化済ユーザーはログイン可能）＋ PBKDF2 一致時 `isArgon2Enabled_()` なら needsRehash=true（rehash-on-login）。
- **診断** 🆕: `dryRunGcpPhaseB_LOG`（admin build のみ・DB 非破壊）— identity token payload（aud/iss/email 有無）・Secret Manager 取得可否・Cloud Run `/health`・**Argon2 hash→verify 往復＋latency**。実測: 全 PASS・aud=admin OAuth クライアント ID・`/health`=200・hash 646ms / verify 平均 315ms・PHC=OWASP 推奨 `m=19456,t=2,p=1`。
- **Cloud Run 側**（GCP 作業場 rev 00003→00005）: `EXPECTED_AUDIENCE` 複数対応＋`isAudienceAllowed` 二重検証（許可外 audience 拒否 unit test 6/6 PASS）・custom audiences に 3 split 全 OAuth クライアント ID 登録・IAM invoker は実測 principal と一致（変更なし）・未認証 `/health`=403 維持実測。
- **build pruner 罠の修正** 🐛: `ARGON2_HASH_PREFIX` 定数の直前コメントに関数名（admin で pruning される `verifyPassword_`）を書いたため定数ごと削除され admin dryRun が `not defined` で失敗 → コメントから関数名排除で解消（`feedback_build_pruning_bug` と同族の新パターン: **top-level 定数のコメントにも関数名を書かない**）。
- **運用決定** 📝: ログイン試行ロックは現行仕様（5 回連続失敗→無期限ロック・**検証前判定のため Argon2 有効化後も Cloud Run 呼び出しはアカウント毎最大 5 回で頭打ち**）を限定承認。GCP 本番オープン時に 3 回化+時限解除を再検討（`docs/250` §11）。Cloud Run は `--no-allow-unauthenticated`＝IAM 拒否リクエストはコンテナ未到達・課金対象外（一次情報確認済）。
- **検証**: prerelease 全ゲート PASS／3 生成物への関数・定数残存 grep 確認／dryRun E2E 全 PASS（上記）／デプロイ後 live `test:a11y` 違反 0・`test:responsive` 7VP overflow 0。**操作者確認残**: 会員ログイン 1 回の非破壊スポット確認（PBKDF2 経路不変の実機確認）。
- **有効化前ゲート（`ARGON2_ENABLED=true` にする前に）**: ①member/admin の Script Properties に `CLOUD_RUN_HASH_SERVICE_URL`（admin 設定済）＋`ARGON2_ENABLED` を設定 ②限定時間で切替→ログイン/PW変更/credential 発行の実機確認 ③ログイン試行ロック仕様の再確認（docs/250 §11）。

---

## v376.53.2 — 2026-07-05 🐛 REDIRECT 警告バナー不点灯 hotfix（admin @215・live 検証済）

- **バグ** 🐛: v376.53.1 の警告バナーが REDIRECT 中でも表示されない。原因は `App.tsx` の `bulkMailSettings`（手組みオブジェクト）に `mailGlobalEnabled`/`mailDeliveryMode`/`mailRedirectAllowlist` の3値が含まれておらず、バナー条件が常に false だったため。**Playwright MCP の live テスト（実際に REDIRECT へ切替→画面確認→即 LIVE 復旧）が検知**。
- **修正**: `bulkMailSettings` に メール制御3値（loadSystemSettings 時に保存値で初期化される state）を追加。
- **live 実証（@215）**: REDIRECT 切替→バナータイトル/本文表示 ✅・「メール送信制御を開く」ボタン表示+クリックでシステム設定へ遷移 ✅・LIVE 復旧後は非表示 ✅・**検証終了時 mailDeliveryMode=LIVE を API で再確認**（露出約1分・日曜午前）。

---

## v376.53.1 — 2026-07-05 🔧 REDIRECT 警告バナー UX 強化（admin split のみ @214）

一括メール送信コンソールの配信モード警告を、本日付 Web 調査（NN/g Error-Message Guidelines / Red Hat Design System Alert / Mobbin Banner patterns / Google Cloud Console 系の解決アクション付き警告）に基づき日本の標準的ユーザビリティ水準へ引き上げ。

- **表示ポリシー確定（ユーザビリティ最優先）**: この警告は**管理者以上が使う送信コンソール専用**。member/公開ポータル、および申込確認・OTP 等の**ユーザー向け自動返信フローには一切表示しない**（サーバー側 deliverMail_ が静かに policy 適用。エンドユーザーに意味不明な警告を見せない）。コードコメントに明文化。
- **バナー改善**: ①**sticky 常時表示**（スクロールで消えない・非 dismissible）②タイトル+説明の2段構成（「テスト用モード（REDIRECT）で動作中です」+ 何が起きるか）③**解決アクションボタン「メール送信制御を開く」**（1クリックでシステム設定へ遷移・MASTER/ADMIN のみ表示）④**権限別出し分け**: 設定変更できないロールには「マスター/管理者へご連絡ください」⑤アイコン+色の二重表現（⛔停止/⚠️REDIRECT）・44px タップターゲット。送信確認ダイアログ内も同構成に統一。
- **検証**: typecheck / 全ビルド PASS。admin @214 redeploy。LIVE モードでは非表示（正常系）。REDIRECT 切替時の視覚確認は操作者確認（切替→確認→即 LIVE 復帰）。

---

## v376.53 — 2026-07-05 🔧🔒 DRY/ハードコーディング/XFrame 一括是正（全3split @359×2 / @118 / @213）

`docs/248` 第三者評価の残 High/Med を一括クローズするリファクタ＋設定化リリース（挙動互換）。

- **DRY** 🔧: ①`src/services/api.ts` の `google.script.run` boilerplate **90 メソッドを `callAction` へ機械統一（-940 行・2,270→1,332行）**。カスタム既定値/変換を持つ 13 メソッドは意図的に残置。重複 helper `runAction` は委譲化。②メニュー権限判定を `src/shared/rbac-util.ts`（`canAccessMenu`/`canUseLinePost`/`canManageLinePost`）へ集約し、App.tsx（isViewAllowed/pickInitialAdminView/line-post 可視）と Sidebar の inline 再実装を撤去。③検証 regex（EMAIL/PHONE/CM番号）を `src/shared/validators.ts` に集約（api.ts / TrainingManagement の重複定義撤去。GAS 側は pruner regex 罠のため意図的に非注入・コメントで相互参照）。
- **ハードコーディング** 🔧: DB Spreadsheet ID / MEMBER_PORTAL_URL を Script Properties（`DB_SPREADSHEET_ID_OVERRIDE` / `MEMBER_PORTAL_URL_OVERRIDE`）で上書き可能な IIFE 化、doGet の Script ID routes を `SCRIPT_ID_MEMBER/ADMIN/PUBLIC` Properties 対応の動的構築へ（**未設定時は現行既定値 fallback＝挙動不変**）。`waitLock(10000)`×5 を `LOCK_WAIT_TIMEOUT_MS` 定数化。public ビルドの `replaceScriptRoutesWithPublicOnly` を新形状に追従（旧 regex が新形状を誤マッチし doGet を破壊→audit-public-boundary FAIL で検知・修正。member/admin Script ID の public bundle 非混入は grep 0 件で維持確認）。
- **XFrame（docs/248 M1）** 🔒: `setXFrameOptionsMode` を route 条件付き化 — public のみ `ALLOWALL`（第三者サイト埋込想定）、**member/admin は `DEFAULT`**（clickjacking/UI redressing 面を閉鎖）。デプロイ後に admin（認証済）/member/public の 3 画面 live 描画を Playwright で確認し白画面なし。
- **中止判断（docs/248 V9 訂正）**: member split の `drive`/`cloud-platform` scope 削減は**実施せず** — 実コード確認で `drive` は請求添付ファイル（v296 役員自己サービス）で実使用、`cloud-platform` は pepper Secret Manager 経路（Phase D で使用）と判明。M2 所見を訂正。
- **v376.52 の operator 検証を AI が代行完了** 🎉: Playwright MCP の認証済ブラウザから `google.script.run` 直接呼出しで — `dryRunDeleteCascadeV376_52_LOG` **passed:true（18/18 チェック）**（13テーブル移動/purge/live残0/archive13/バッチ復元）・`diagnoseMemberDeleteDebt_LOG`（負債実測: soft-del 会員18/職員30・**孤児参照 16 行のみ**〈年会費3+認証13〉・refMissing 0）・ロール視点プレビュー実機動作（7ロール・一般選択→メニュー1件/非表示15件→復帰）。migrate（`_archive` 13本）も本番適用確認。
- **検証 / デプロイ**: prerelease 全PASS（8 suite fail0・boundary×3・er-sync 57）。public @359（2 deployment）/ member @118 / admin @213 に redeploy。デプロイ後 live: admin/member/public 描画 OK・public a11y 全0（warm）・responsive 21view 全PASS・console エラー0。
- **残課題**: バックフィル（孤児16行・任意）／kana form 前検証適用／CM番号 import プレビュー／er-sync 列順・相互排他拡張／legacy 申込者解決の物理撤去（v377）／PBKDF2→GCP Phase 0（docs/239/240・operator 併走）。

---

## v376.52 — 2026-07-05 🆕🔒 会員系削除 cascade アーカイブ + メール REDIRECT 恒久是正（admin split のみ @212）

`docs/248` 第三者評価のリレーション整合性 High 所見（cascade 未実装＝孤児発生・`_archive` dead code・命名詐称）の恒久是正（設計正本 `docs/249`・a1 単一化モデル）と、2026-07-03 に発覚したメール誤集約事故の再発防止を同梱。

- **スキーマ** 🆕: `_archive` を 2→**13 本**へ拡張（＋認証アカウント/ホワイトリスト/研修申込/年会費納入・更新履歴/役員/振込口座/支払い/支払い明細/請求/変更申請）。gas-src `ARCHIVE_SOURCE_TABLES`（単一情報源）からループ生成し、`scripts/lib/er-model.mjs` をループパターン静的解析に対応（er-sync 57テーブル PASS）。サロゲート3列 `アーカイブID`/**`削除バッチID`**（=T_削除ログ.ログID・会員単位復元キー）/`アーカイブ日時`。`DB_SCHEMA_VERSION=2026-07-03-cascade-archive-schema-v376.52` → admin ログインで migrate（**追加のみ・既存データ不変**）。
- **cascade 本体** 🆕: `executeDeleteMember_` → `runDeleteCascade_` — 支払いID/認証IDを移動前解決し、13テーブルを live から archive へ移動（`moveRowsToArchiveByMatch_`・ヘッダー欠落自己修復）。**T_ログイン履歴は物理 purge**（高volume・PII最小化）。**旧実装の是正**: in-place soft delete のみで 役員/請求/振込口座/支払い/変更申請 が放置され孤児化していた構造欠陥（docs/249 C3）と、`_archive` へ移動しない命名詐称 `archive*ByIds` 4関数（C1）を撤去。
- **復元・運用** 🆕: `restoreArchiveBatch_`（同一 `削除バッチID` の全行を戻す＝会員単位アトミック）＋ operator 5関数（`diagnoseMemberDeleteDebt_LOG` 削除負債診断 / `listArchiveBatches_LOG` / `restoreLastArchiveBatch_APPLY` / `dryRunDeleteCascadeV376_52_LOG` 実DB E2E / `cleanupDryRunDeleteCascade`）。keep-list（`ADMIN_TOP_LEVEL_FUNCTIONS` 単一情報源）登録。退会フローは従来どおり（cascade 不使用・履歴保持）。
- **メール REDIRECT 恒久是正** 🔒: 6/26 のテスト後 `MAIL_DELIVERY_MODE=REDIRECT` が残置され、以降の全メールが Redirect 宛先（旧アドレス）へ集約・実宛先未達なのに UI/送信ログは「成功」と表示していた事故（7/3 発覚・操作者が LIVE 復旧済み）。再発防止: ①`BulkMailSender` に配信モードが LIVE 以外のとき**常時警告バナー**（画面上部＋送信確認ダイアログ）②`sendBulkMemberMail_` が `deliverMail_` の mode/suppressed を無視していた欠陥を修正 — REDIRECT は送信ログ `送信種別=BULK_MEMBER_REDIRECT`、抑止分は成功に数えず、戻り値 `deliveryMode`/`suppressedCount` を UI で警告表示。v376.50 の教訓（受信側の目印廃止）を送信側 UI で担保。
- **その他** 🔧: `getApplicationApplicantType_` に `@deprecated`（v377 撤去予定・新規呼出禁止）。役員 linkage XOR「未検証」は**誤所見**（`assignOfficer_`/`updateOfficerLinkage_` に実装済）と実コード確認し docs/248 V8 訂正。`MemberDeleteConsole` 文言を新挙動（アーカイブ移動/purge/バッチ復元）へ更新。
- **検証 / デプロイ**: prerelease 全PASS（8 suite fail0・boundary×3・er-sync）・3split 生成物 grep 健全（cascade は admin のみ・public/member 漏れなし）。**デプロイ前に DB スプレッドシート複製バックアップ実施**。admin push → version 212 → `redeploy @212`、`clasp deployments --json` で同期確認。**operator 残タスク**（HANDOVER §2-1 #0）: admin ログイン（migrate）→ `dryRunDeleteCascadeV376_52_LOG` ▶ passed:true → `diagnoseMemberDeleteDebt_LOG` ▶ 負債実測（バックフィル要否判断）→ REDIRECT バナー実機確認。member/public は inert 差分のみ未 redeploy。

---

## v376.51 — 2026-06-30 🆕 ロール視点プレビュー（MASTER 専用デバッグ機能・admin split のみ @211）

管理コンソールで、MASTER が各ロール/権限ごとの「見え方」をワンクリックで切り替えて確認できるデバッグ機能を追加した。従来は MASTER 自身の全権ビューしか見られず、カスタムロールや各権限のサイドバー・到達可能画面を実際に確認できなかった課題に対応する。

- **設計方針（重要）** 🔒: **なりすまし（user/role impersonation）ではなく「ロール視点プレビュー（View-as-role）」** を採用。サーバー権限は MASTER のまま不変で、**フロント描画（Sidebar / ルーティング / 機能可視）だけ**を選択ロールの見え方に模擬する。これにより監査証跡の汚染やサーバー強制の弱体化を回避し、確定済み認証境界（admin DOMAIN+Google+whitelist、サーバー強制 `isActionAllowedForSession_`）を一切崩さない（AGENTS §4.2 / §6 準拠）。本日付の一次情報（Authress「full impersonation は回避し permission/専用ダッシュボードを優先」、OneUptime / Microsoft Power Platform / Harness の impersonation ベストプラクティス）に基づく。
- **UI** 🆕: 上部固定バー `src/components/RolePreviewBar.tsx`。ロール選択ドロップダウン（MASTER 復帰＋全ロール・組込/カスタム明示）／プレビュー中は琥珀色バナー化＋「表示メニュー N件／非表示 M件」サマリー／「閲覧のみ」明示／ワンクリック退出。ベストプラクティス上乗せ：常時バナー・即時ロールスイッチ・ephemeral（リロードで自動 MASTER 復帰）・`role="status"`+`aria-live`・44px タップターゲット・360px〜レスポンシブ・色＋テキスト二重識別。
- **状態/配線** 🆕: `src/App.tsx` に `previewRoleId` と `effectiveRbac`（プレビュー時は選択ロールの `allowedMenus`/`isMaster=false`/`roleName`/`trainingEditScope` に差し替え）を追加。`Sidebar` props・`isViewAllowed`・line-post 可視フラグを `effectiveRbac` 駆動化。許可外 view にいた場合は `pickInitialAdminView` で許可内へ自動退避。ログアウト/非 MASTER 化で自動解除。レイアウトを縦 flex 化しバーを挿入（`Sidebar` の `md:h-screen`→`md:h-full`）。バーは実 `isMaster` で表示判定（プレビュー中も退出可能）。
- **閲覧のみガード** 🔒: `src/services/api.ts` に `setApiPreviewReadOnly()` を追加し、API シングルトンの書込メソッドをプレビュー中 deny-by-default で遮断（読取接頭辞 `get`/`list`/`search`/`fetch`/`check`/`load`/`preview` 以外をブロック）。新規追加の書込 API も自動的にブロックされ keep-list ドリフトを起こさない（private dispatch/同期ヘルパーは対象外）。誤操作で実 DB に書込まれる事故を物理的に防止。
- **既知の境界**: メニュー可視性＋ナビゲーションのプレビューであり、サーバー側の拒否そのものの検証ではない（その用途は実アカウントで）。ページ内の旧 `permissionLevel` ベース個別ガードはプレビュー中ルーティングで到達不可のため別途模擬しない（見え方は忠実）。
- **検証 / デプロイ**: `typecheck` / `prerelease`（security audit・boundary×3・unit×7・er-sync・menu-registry 10/10）全 PASS。`build` → `build:gas:admin` / `build:gas:member` で 3split 健全（top-level callable 残存・pruner 誤削除なし）。圧縮 bundle を `inflateRawSync` 展開し機能コード混入（ロール視点プレビュー／閲覧のみガード文字列）を確認。admin split を push → version 211 → `redeploy @211`、`clasp deployments --json` で fixed admin deployment が `versionNumber: 211` に同期したことを確認。**純フロント（DB スキーマ/backend 不変）。member/public は gas-src 由来の inert 差分のみで未 redeploy（次の機能リリースで同梱）。実ブラウザ確認は操作者タスク（storageState 期限切れで AI 未 PASS）**。

---

## v376.50 — 2026-06-26 🔧 REDIRECT モードの件名・本文注釈廃止（admin split のみ @210）

一括メールのテスト送信時に、受信メールの件名へ `[REDIRECT from ...]`、本文先頭へ `--- ORIGINAL TO` / `--- CATEGORY` が表示されていたため、受信者視点の表示確認を妨げていた。

- **修正** 🔧: REDIRECT モードでは宛先だけ `MAIL_REDIRECT_ALLOWLIST` に切り替え、件名・本文は加工しない。元宛先・カテゴリは Apps Script log の `deliverMail_ REDIRECT category=... originalTo=... redirectedTo=...` に記録する。
- **運用文書** 🔧: `docs/227_MAIL_KILL_SWITCH_2026-05-18.md` の REDIRECT 説明を「件名・本文は加工しない」仕様へ更新。
- **検証 / デプロイ**: `build:gas:admin` / REDIRECT 注釈文字列 grep（該当なし） / admin 生成物の `var テーブル定義` / `processApiRequest` / `gmail.send` grep / `typecheck` / `test:mailing-list` / `prerelease` PASS。admin split を push → version 210 → `redeploy @210`、`clasp deployments --json` で `@210`（"v376.50 transparent mail redirect"）同期確認。操作者実機確認で REDIRECT 注釈が表示されないことを確認済。

---

## v376.49 — 2026-06-26 🐛 一括メール送信の Gmail send scope 復旧（admin split のみ @209）

管理ポータルの一括メール送信で、全宛先が `Specified permissions are not sufficient to perform the action` により失敗する障害を修正した。

- **原因** 🐛: admin split の `gas/admin/appsscript.json` に `https://www.googleapis.com/auth/gmail.send` が欠落していた。送信元 `from` を指定する一括メール送信は `sendEmailWithValidatedFrom_()` から `GmailApp.sendEmail` に分岐するため、全件が Gmail 送信 scope 不足で失敗していた。
- **修正** 🔧: admin split manifest に `gmail.send` を復旧。`MailApp.sendEmail`（通常送信） / `GmailApp.sendEmail`（admin split のエイリアス送信）という現行実装前提を `HANDOVER.md` と docs portal 生成元に反映。
- **検証 / デプロイ**: admin manifest JSON check / `build:docs-portal` / `test:er-sync` / `typecheck` / `test:mailing-list` / `prerelease` PASS。`build:gas:admin` 後に admin 生成物の `var テーブル定義` / `processApiRequest` / `MailApp.sendEmail` / `GmailApp.sendEmail` / `gmail.send` を grep 確認。admin split を push → version 209 → `redeploy @209`、`clasp deployments --json` で `@209`（"v376.49 admin Gmail send scope restore"）同期確認。
- **実機確認**: `clasp run healthCheck --json` は Execution API 実行権限で失敗したが、操作者実機確認で一括メール送受信と添付ファイル送信が成功することを確認済。

---

## v376.48 — 2026-06-18 🔧 宛名リスト出力コンソール 発送区分3択化（admin split のみ @208）

v376.47 の下段 `発送対象` フィルター案は、画面構成上の意味が弱いため廃止した。画像指摘どおり、上段の **「発送区分の選択」** で `広報誌発送` / `広報誌のみ発送` / `お知らせ発送` を直接切り分ける設計に修正した。

- **発送区分の追加** 🔧: `MailingListFilterType` に `KOHOUSHI_ONLY` を追加。`KOHOUSHI` は年度対象の全会員、`KOHOUSHI_ONLY` はそのうちお知らせ発送対象外、`OSHIRASE` は事業所会員全員 + 個人/賛助の `発送方法コード='POST'` として GAS 側で再計算する。
- **フロント UI 修正** 🔧: `src/components/MailingListExport.tsx` の上段ラジオに `広報誌のみ発送` を追加し、下段の `発送対象` フィルターは廃止。出力時は従来どおり選択済み `targetKeys` を GAS 側の再計算候補と照合する。
- **テスト**: `scripts/test-mailing-list.mts` を 5 件へ更新し、発送区分 3 択と `広報誌のみ発送` が `お知らせ発送` 対象を除外することを固定。
- **検証 / デプロイ**: `typecheck` / `test:mailing-list` / 3 split build / 3 split `var テーブル定義` and `processApiRequest` grep / `prerelease` PASS。admin split を push → version 208 → `redeploy @208`、`clasp deployments --json` で `@208`（"v376.48"）同期確認。`test:responsive:admin` は再実行したが、保存済み storageState が Google ログインへ戻され全 viewport `App frame did not appear within 50s` のため未 PASS。

---

## v376.47 — 2026-06-18 🔧 宛名リスト出力コンソール 発送対象フィルター追加（admin split のみ @207 / v376.48 で置換済み）

宛名リスト出力コンソールで、広報誌発送候補の中から **`広報誌のみ`** の会員だけを絞り込めるようにした。

- **発送対象分類の追加** 🔧: GAS `buildMailingListCandidates_` で、既存の「お知らせ発送」判定（事業所会員全員、または個人・賛助会員で `発送方法コード='POST'`）を候補属性 `mailingDeliveryScope` として返却。`OSHIRASE` はお知らせ発送対象、`KOHOUSHI_ONLY` は広報誌のみ発送対象。
- **フロント UI** 🔧: `src/components/MailingListExport.tsx` の絞り込みフィルターに `発送対象` を追加。`広報誌のみ` / `お知らせ発送対象` で表示候補を切り替え、既存の `表示中を選択` → Excel 出力の流れで選択対象のみ出力できる。キーワード検索にも両ラベルを追加。
- **DRY / 後方互換** 🔧: 分類フォールバックを `src/shared/mailingList.mjs::resolveMailingDeliveryScope` に集約し、GAS から新フィールドが返らない旧レスポンスでも同じ規則で判定。`src/shared/types.ts` に optional field として追加。
- **テスト**: `scripts/test-mailing-list.mts` 4件を追加し `npm run prerelease` に組込。事業所会員は常にお知らせ発送対象、個人・賛助は `POST` ならお知らせ発送対象、`EMAIL` なら広報誌のみ、GAS レスポンスの分類済みフィールド優先を固定。
- **検証 / デプロイ**: `typecheck` / 3 split build / 3 split `var テーブル定義` 残存 grep / `prerelease` PASS。`npm audit fix`（非 force）で high 脆弱性を解消し、残りは `@google/clasp` 経由の moderate のみ。admin split を push → version 207 → `redeploy @207`、`clasp deployments --json` で `@207`（"v376.47"）同期確認。`clasp run healthCheck` は Execution API 実行権限で失敗。`test:responsive:admin` は通常経路で `ERR_NETWORK_ACCESS_DENIED`、承認経路で timeout のため未完了。実ブラウザ確認は操作者タスク（HANDOVER §2-1 #0）。

---

## v376.46 — 2026-06-11 🔧🐛 会計年度ステータス判定の単一情報源化（DRY 是正）— 「在籍中」人数のぶれ解消（admin split のみ @206）

「在籍中」で絞った人数が **会員リスト** と **宛先リスト出力** で食い違う不具合を、根本原因（DRY 違反）から是正。

- **根本原因**: 会計年度基準の会員ステータス判定が **2 箇所に重複実装**され分岐がドリフト — フロント `src/App.tsx::getMemberStatusAtFiscalYear` と GAS `gas-src/Code.full.gs::getMemberFiscalSnapshot_`。GAS 側に **TRANSFERRED（移行済み）分岐が無く**、移行済み会員が `ACTIVE` に落ちて宛先リストの「在籍中」に混入。加えて `WITHDRAWAL_SCHEDULED` の年度ガード（`fiscalYear>=現年度`）有無も相違。
- **単一情報源化（DRY）** 🔧: `src/shared/memberFiscalStatus.mjs` に正準関数 `computeMemberFiscalStatus(input, fiscalYear, currentFiscalYear) → {status, includeInMailing}` を新設（ISO 日付文字列・辞書順比較で TZ 非依存・自己完結）。
  - **フロント**: 直接 import（`allowJs`+`bundler`）。`getMemberStatusAtFiscalYear` は委譲のみに。
  - **GAS**: build 時に `serializeMemberFiscalStatusForGas()`（`.toString()` を private 名 `computeMemberFiscalStatus_` にリネーム）を `gas-src` のマーカーブロックへ注入（`scripts/gas-boundary-utils.mjs::injectMemberFiscalStatusPlaceholders`、`menu-registry.mjs` と同方式）。`getMemberFiscalSnapshot_` は委譲のみに（返り値形 `{eligible,memberStatus,...}` は維持＝呼出3箇所互換）。3 build スクリプトに注入を配線。
  - 正準ロジックは旧フロント実装が母体（TRANSFERRED・年度ガードを正しく保持）。**会員リストは挙動不変、宛先リストが正準へ寄って一致**。移行済み会員は宛先（在籍中）から除外（別人物へ統合済みのため妥当）。
- **回帰テスト** 🐛: `scripts/test-member-fiscal-status.mts`（11 ケース・prerelease 追加）。ACTIVE/退会予定(当年度・過去年度)/当年度退会/前年度以前退会/**移行済み**/当年度入会/翌年度入会/削除 を検証し、**「TRANSFERRED は決して ACTIVE/宛先対象にならない」を回帰固定**。
- **検証**: `typecheck` / `test:member-fiscal-status`(11) / `prerelease` 全 PASS。`build:gas`×3 後、注入された `computeMemberFiscalStatus_`（`NOT_IN_YEAR` 含む実ロジック）が admin/member の Code.gs に存在・public は未参照で pruned（ダングリング無し）・`var テーブル定義` は3split健在を grep 確認。
- **境界/スコープ**: 会員リスト・宛先リスト・年会費はいずれも admin。DB_SCHEMA_VERSION 不変。**admin split のみデプロイ予定**。member/public は gas-src 由来 inert 差分のみ。
- **デプロイ**: admin split を push → version 206 → `redeploy @206`、`clasp deployments --json` で `@206`（"v376.46"）同期確認。（初回 push 時 clasp RAPT 失効に遭遇 → 操作者 `clasp login` 再認証後にデプロイ完了。）実機確認（会員リスト在籍中＝宛先リスト在籍中の一致）は操作者タスク（HANDOVER §2-1 #0）。

---

## v376.45 — 2026-06-10 🆕🔒 公式LINE投稿: 投稿依頼ワークフロー + LINE投稿権限(RBAC二層) + 可視範囲 + 申込URL自動入力 + 担当者名/日時（admin split のみ @205）

公式LINE投稿依頼コンソールに運用要件を追加。既存のメニュー単位ロール RBAC（`MENU_REGISTRY`/`T_権限ロール`/`checkAdminBySession_`/`isActionAllowedForSession_`）と `T_LINE投稿依頼` データモデルに融合。

- **投稿依頼ワークフロー** 🆕: 新規作成モーダルのフッターを「下書き保存」（DRAFT）＋「投稿依頼をする」（`submitRequest:true`→即 REQUESTED＋通知）の2ボタンに。未投稿のまま放置されず依頼まで一気に行える。`saveLinePostRequest_` に `submitRequest`、通知を `notifyLinePostRequest_` に抽出し transition 'request' と共用（DRY）。
- **LINE投稿権限の二層化（RBAC）** 🔒: ①`line-post`（既存メニュー）＝コンソール閲覧・依頼作成・投稿依頼・**自分の依頼のみ**閲覧/編集/削除。②**新設 `line-post-manage`**＝全件閲覧・「投稿済み」マーク・状態変更（他者依頼含む）。`scripts/menu-registry.mjs` の `MENU_REGISTRY` に追加（権限マトリクスに自動表示・付与可。nav item なしの capability メニュー）。MASTER は allowedMenus=全メニューで自動保持。`LEGACY_ROLE_TO_MENUS.ADMIN`＋`INITIAL_ROLE_DEFINITIONS` の ADMIN に付与（legacy 経路＋新規 seed は全件閲覧維持）。
- **サーバ側強制（二重防御）** 🔒: ヘルパー `lineCanManage_(session)`（MASTER or allowedMenus∋line-post-manage）。`processApiRequest` が渡す `parsedPayload.__adminSession` を各ハンドラで参照。`listLinePostRequests_`＝非 manage は `作成者メール===caller` のみ。`transitionLinePostRequest_`＝`post` は manage 必須／`request`/`withdraw` は所有者 or manage。`saveLinePostRequest_`/`getLinePostRequest_`/`deleteLinePostRequest_`＝非 manage は自分の依頼のみ（IDOR 防止）。フロント（`LinePostConsole` canManage prop）でも「投稿済みにする」を非表示にし UI/サーバ一致。
- **研修申込リンク自動入力（バグ修正）** 🐛: 研修紐づけ時に「研修申込リンク」が空白だった問題を修正。研修選択（`TrainingPicker.onSelect`）と研修起点（`TrainingManagement.handleCreateLinePost`）の両方で `training.applicationUrl`（あれば）→無ければ `buildPublicTrainingApplyUrl(id)`（公開申込ディープリンク）を自動入力。
- **担当者名・依頼日時** 🆕: `T_LINE投稿依頼` に `作成者名`/`投稿マーク者名` 列を追加（`__adminSession.displayName` をデノーマライズ・DB_SCHEMA_VERSION bump・`initializeSchema_` の `normalizeTableColumns_` で name-based shift＝既存行保持）。`rowToLinePostRequest_` に `createdByName`/`postedByName`。`LinePostConsole` 一覧/詳細に **依頼者名・投稿者名・依頼日時** を表示。
- **回帰検知 E2E**: `dryRunLinePostV376_45_LOG`（operator ▶）を追加。合成 `__adminSession` で (a) submitRequest→REQUESTED＋作成者名、(b) 非 manage 他者依頼が見えない可視スコープ、(c) post は manage のみ可、(d) 投稿マーク者名記録、を**実 DB で**検証。`lineCanManage_` ロジックも検証。build keep-list 登録。
- **検証**: `typecheck` / `prerelease` 全 PASS / `test:menu-registry` 10/10 / `test:er-sync`。3 split 生成物に `var テーブル定義` 残存 grep 確認（AGENTS §5）。公開 `test:a11y`（違反 0）で公開ポータル非破壊確認。admin push → version 205 → `redeploy @205`。
- **境界/スコープ**: 公式LINE投稿は admin 専用。admin split のみ @205。member/public は gas-src 由来 inert 差分のみ（未 redeploy・DB_SCHEMA_VERSION 旧のまま再 init せず安全）。共有 DB の列追加は admin の次回 login で適用。
- **操作者要対応**: MASTER が 設定→権限管理 の権限マトリクスで `公式LINE投稿 管理`（line-post-manage）を必要なロールへ付与（既存 `T_権限ロール` 行には自動付与されないため。付与しないと該当ロールは自分の依頼のみ閲覧・投稿済みマーク不可）。

---

## v376.44 — 2026-06-10 🐛 公式LINE投稿依頼の保存不可エラー + プレビュー画像化け修正（admin split のみ @204）

公式LINE投稿依頼コンソールで「保存」が「範囲の列数には1以上を指定してください」で失敗し、添付画像プレビューが壊れて表示される 2 件を修正。E2E回帰の漏れ（admin 書込フロー未テスト）が見逃し原因だったため、その是正も実施。

- **🐛 保存不可（範囲の列数エラー）**: `saveLinePostRequest_` の新規挿入は `appendRowsByHeaders_('T_LINE投稿依頼')` → `sheet.getRange(1,1,1,sheet.getLastColumn())`。`T_LINE投稿依頼` が**ヘッダー欠落（列数0）**状態だと `getLastColumn()===0` で GAS が「範囲の列数には1以上を指定してください」を throw。**根本原因**は `getOrCreateSheet_`（`ensureLinePostRequestSheet_` が使用）が `insertSheet` のみでヘッダーを書かず、`ensureTableSheetsExist_` も既存シートをスキップするため、一度ヘッダー無しで作られると永久に自己修復しない構造的欠陥（v374.1 以来の潜在バグ。直近のメールテンプレート改修とは別コード経路で、その回帰ではない）。**修正**: `ensureLinePostRequestSheet_` を「シート未作成 or 列数0なら テーブル定義 からヘッダー行を書く」自己修復に変更（保存の冒頭で毎回呼ばれるため次回保存で即復旧）。`ensureTableSheetsExist_` も既存だが列数0のシートにヘッダーを補修するよう一般化（将来の同種事故の防御）。DB_SCHEMA_VERSION は不変（保存時自己修復のため再初期化不要）。
- **🐛 プレビュー画像化け**: `LinePreview` が `<img src={attachmentUrl}>` に Drive の `file.getUrl()`（= `/d/<id>/view` のビューアHTMLページ）を渡しており、画像バイトでないため壊れて表示。新規 `driveImageSrc(url)` でファイルIDを抽出し `https://drive.google.com/thumbnail?id=<id>&sz=w1000` へ変換して描画（編集モーダル・投稿依頼詳細の両プレビューに適用）。
- **回帰検知 E2E 追加**: `dryRunLinePostV376_44_LOG`（operator が editor ▶ 実行）でヘッダー自己修復→新規保存→取得→soft delete を**実 DB で**検証。本バグは「シートのヘッダー欠落」という DB 状態起因のためコード単体テストでは捕捉できず、実 DB E2E が必要。build keep-list に登録。
- **テスト方法の漏れ是正** 📝: 今回の見逃し原因は **admin 書込フローの E2E 未実施**（v376.43 の E2E は公開ポータルの a11y/responsive のみ＝認証不要のため。admin/member は storageState 不在で Playwright 未実行）。対策として `AGENTS.md §5` を強化: **storageState が用意できない admin/member の書込フローは、対応する backend dryRun（`dryRun*_LOG`）を用意し operator が実行して検証することを必須**とし、純コード unit test では捕捉できない DB 状態起因バグを実 DB E2E でカバーする方針を明文化。
- **境界/スコープ**: 公式LINE投稿は admin 専用機能。`ensureLinePostRequestSheet_` 自己修復＋`driveImageSrc` は admin 経路。`ensureTableSheetsExist_` 堅牢化は共有 gas-src（次回 member/public デプロイ時に同梱・挙動は idempotent）。admin split のみ @204。共有 DB の `T_LINE投稿依頼` は admin の次回保存/初期化で自己修復され member/public 側も裨益。
- **検証**: `typecheck` / `prerelease` 全 PASS / 3 split 生成物に `var テーブル定義` 残存 grep 確認（AGENTS §5）。admin push → version 204 → `redeploy @204`。

---

## v376.43 / v376.43.1 — 2026-06-10 🆕🔧🐛 全メール種別テンプレート管理 Phase B（ハードコード6メール差し込み化）+ build pruner hotfix（全3split @358/@117/@203）

Phase A（v376.42）で整備した基盤の上に、従来ハードコードだった6メールを差し込みタグ化し、件名/本文編集＋テンプレート管理に対応させた（全メール種別が完了）。E2E回帰でデプロイ後に build pruner 回帰を検知し hotfix。

- **対象6メール（Tier2）の差し込み化** 🆕: 研修申込確認(`TRAINING_APPLY_RECEIPT`) / 研修リマインダー(`TRAINING_REMINDER`) / 公開ポータルOTP(`AUTH_OTP`) / 会員情報変更確認(`MEMBER_UPDATE_CONFIRM`) / 退会申請受付(`WITHDRAWAL_CONFIRM`) / パスワード再設定(`PASSWORD_RESET`)。各々 `<CAT>_DEFAULT_SUBJECT/BODY` 定数（現行文面を `{{タグ}}` 化）を追加し、送信実体を `renderConfiguredMail_(ss, subjKey, bodyKey, defSubj, defBody, vars, requiredValue?)` 経由に rewire。`getSystemSettings_`/`updateSystemSettings_`/`ensureSystemSettingsRows_` に 12 キー追加。
- **安全フォールバック（重要）** 🔒: `renderConfiguredMail_` は `requiredValue`（OTP/確認コード）が描画後本文に含まれない場合、管理者編集テンプレを破棄して既定文面へフォールバック。**管理者が誤って `{{認証コード}}`/`{{確認コード}}` を消してもコードが必ず送信される**。`test:mailrender`(5件) で機械検証。
- **MEMBER_UPDATE_CONFIRM のスコープ**: 個人会員が公開ポータルで自身の登録情報を変更した際の確認メールを対象。事業所登録情報変更・職員追加/除籍に伴う内部通知は別文面（固定）で対象外（意図的分離）。
- **フロント** 🔧: `src/App.tsx` メール通知に「▍その他の自動通知メール」グループを新設し 6 カード（件名/本文エディタ＋`MailTemplateManager`＋`MAIL_TEMPLATE_MERGE_TAGS` 凡例）。ON/OFF は既存カテゴリ別フラグと連動。`types.ts` に 6 Subject/Body。
- **dryRun E2E** 🆕: `dryRunMailTemplatesV376_43_LOG`（非送信・operator が editor ▶ 実行）で全6メールの差し込み描画と必須トークン（OTP/コード）の存在を検証。build keep-list (`gas-boundary-utils.mjs`) に登録。
- **検証**: `typecheck` / `test:mailrender`(5/5) / `prerelease` 全ゲート PASS。デプロイ後 **公開 Playwright `test:a11y`(違反 critical/serious/moderate/minor=0)・`test:responsive`(7 VP)** PASS で公開ポータル非破壊を確認。
- **🐛 hotfix v376.43.1**: v376.43 初版で `テーブル定義` オブジェクトリテラル内のコメントに pruned 関数名（`listMailTemplates_` 等・末尾アンダースコア識別子）を記載。public/member ビルドは admin action 分岐を剥がすためこれらが unreachable 判定となり、build pruner の removable 判定 `\b${name}\b` が**コメント文字列に誤マッチ**して `var テーブル定義 = {…}` 宣言ごと削除。結果 `ReferenceError: テーブル定義 is not defined` で public/member が起動エラー（MEMBER_UPDATE/OTP/退会/申込/PW いずれの doGet も白画面）。**E2E回帰（test:a11y のフレーム未出現→ WebFetch で ReferenceError 確認）で検知**。対応: 即時 public@356 / member@115 へロールバック→ リテラル内コメントから関数名を除去（+ 再発防止コメント明記）→ 再ビルドで全3split に `テーブル定義` 復活を grep 確認 → 再デプロイ（@358/@117/@203）→ 公開 a11y/responsive 再 PASS。`feedback_build_pruning_bug` の再発。**教訓: トップレベルのオブジェクトリテラル/変数宣言の中のコメントに `_` 接尾の関数名を書かない**。

---

## v376.42 — 2026-06-10 🆕🔧 全メール種別テンプレート管理 基盤（Phase A）+ 上書き保存（admin split のみ @201）

メール通知設定のテンプレート管理（名前付きスナップショットの保存/読込/削除）を、従来の「入会メール（個人・賛助）」だけでなく全メール種別へ拡張する基盤を整備。あわせて「上書き編集できない（保存すると常に新規テンプレートが増える）」不具合を解消。Web 調査（2026-06）の「テンプレートは集中バージョン管理し、差し込みは変数/トークンで」という指針に沿い、専用テーブルへ集約した。

- **データモデル**: 専用テーブル `T_メールテンプレート`（`テンプレートID`/`カテゴリ`/`名前`/`件名`/`本文`/`既定フラグ`/`作成日時`/`更新日時`/`削除フラグ`）を新設。`テーブル定義` 追加＋`DB_SCHEMA_VERSION` bump で、`ensureTableSheetsExist_` が次回 admin login の `initializeSchemaIfNeeded_` 時に自動生成。`runtime` のメール本文は従来どおり `T_システム設定` の `<CAT>_SUBJECT/BODY`（編集フォーム現行値）を使用し、本テーブルは保存/読込専用（送信経路の正本にはしない＝既存挙動不変）。
- **汎用 CRUD** 🔧: `listMailTemplates_(category)` / `saveMailTemplate_({id?,category,name,subject,body})` / `deleteMailTemplate_({id})`。**`saveMailTemplate_` は payload.id 一致で上書き update、無ければ UUID 新規 insert**（＝上書き保存の実体）。削除は soft delete。`processApiRequest` に admin action 3つ（`listMailTemplates`/`saveMailTemplate`/`deleteMailTemplate`）を `action === '...'` 完全一致で追加（build pruner 罠回避）。`scripts/gas-boundary-utils.mjs`（admin 許可 action）＋ `scripts/menu-registry.mjs`（admin-settings menu）に登録。
- **移行** 🔧: `migrateCredentialTemplatesToTable_` が旧 `CREDENTIAL_EMAIL_TEMPLATES`（T_システム設定 の JSON 配列）を `カテゴリ=CREDENTIAL` で本テーブルへ移行。id 重複スキップで冪等。旧 JSON キーは rollback 用に残置。旧 credential 3 action（`getCredentialEmailTemplates`/`save`/`delete`）は汎用関数へ委譲し後方互換＋単一情報源を維持。
- **フロント（DRY）** 🔧: 汎用 `src/components/MailTemplateManager.tsx` を抽出（カテゴリ単位で自前に一覧 fetch、global state 非共有）。**「上書き保存」（読込中テンプレを id 指定で更新・確認ダイアログ）＋「＋新規保存」（名前付き別保存）の2ボタン**、読み込む/削除、任意で「デフォルトに戻す」。`EmailCard` の `extra` スロットへ差し込み。credential＋Tier1 7種（事業所代表/メンバー・職員追加職員/代表者・変更申請受付/承認/却下）に付与。`src/shared/mailTemplates.ts` にカテゴリ enum＋「カテゴリ→マージタグ」表を集約。`src/types.ts` の `EmailTemplate` に category/updatedAt 等を後方互換追加。`api.ts` に 3 メソッド追加。
- **既存重複の扱い**: システム設定 'portal' サブタブ内に旧 credential メール編集ブロック（重複）が残存するが、委譲関数経由で動作継続するため Phase A では非改修（要望外）。
- **境界/スコープ**: メール設定は admin 専用。admin Code.gs の boundary・top-level callable 不変。member/public は本機能非該当のため**未 redeploy**（gas-src 由来の inert 差分＝新テーブル定義のみ。旧コードのままなら schema 再初期化は走らず共有 DB の新シートも安全）。
- **Phase B（未着手）**: ハードコード6種（研修申込確認/研修リマインダー/公開ポータルOTP/会員情報変更確認/退会申請受付/パスワード再設定）の差し込みタグ化（DEFAULT 定数化・SystemSettings `<CAT>_SUBJECT/BODY` 追加・送信実体 rewire・UI カード追加）。OTP/PW 再設定コードの欠落は重大のためドライラン必須。
- **検証 / デプロイ**: `typecheck` / `test:menu-registry` 10/10 / `test:er-sync` PASS（46 テーブル・stale=0）/ `prerelease` 全ゲート PASS。`build` → `build:gas`(×3) → `build:docs-portal`（ER 再生成）。admin split を push → version 201 → `redeploy @201`、`clasp deployments --json` で `@201`（"v376.42"）同期確認。**スキーマ移行は操作者 admin login でトリガ**（HANDOVER §2-1 #0）。

---

## v376.41 — 2026-06-09 🐛🔧 公式LINE投稿依頼コンソール 研修選択不具合の修正 + ピッカー UX 改善（admin split のみ @200）

公式LINE投稿依頼コンソールで「研修の投稿」の研修プルダウンが空で選択できない不具合の修正と、運用者要望の UX 改善をまとめて対応。

- **【バグ修正】研修プルダウンが空** 🐛: `src/App.tsx` のデータ読込 effect で、admin の `line-post` ビューが `loadSystemSettings` のみ呼んで**早期 return** しており、`loadAppData`（= `fetchAllData` → trainings）に到達していなかった。そのため `研修管理` や `ダッシュボード`等 trainings を読む画面を先に開いていない限りコンソールの研修候補が常に 0 件だった。`line-post` を早期 return 群から分離し、systemSettings に加えて `loadAppData({ silent:true })` も呼ぶよう修正。
- **研修名で検索できる combobox 化** 🔧: `<select>` を `TrainingPicker`（`src/components/LinePostEditorModal.tsx` 内）に置換。研修名で部分一致検索、キーボード操作（↑↓/Enter/Esc）、選択中チップ＋「選択解除」対応。
- **開催日が過ぎた研修を非表示** 🔧: 当日含む未来の研修のみ候補化（`isPastTraining`：開催日 < 今日0時 を past 判定）。`isDeleted` 除外。**現在選択中の研修は過去・削除済でも候補に保持**（研修管理モーダル経由で過去研修に紐付け編集する場合に表示が消えない）。開催日昇順ソート。
- **「対象」ラジオの既定を TRAINING に** 🔧: `emptyLinePostForm` の既定 `targetType` を `GENERAL` → `TRAINING`（研修の投稿）へ。研修起点の文脈作成は従来どおり initial で明示指定のため不変。
- **添付ファイルをドラッグ&ドロップ対応** 🔧: クリックでファイル選択する `<input type=file>` を、border-dashed のドロップゾーン（onDragOver/onDrop で `handleFile`）＋「ファイルを選択」クリック併存に変更。上限・形式チェック（画像/PDF・10MB）は従来の `handleFile` を共用。
- **境界/スコープ**: 純フロント。line-post ビューは admin 専用で App.tsx 変更も当該ビューに限定。admin Code.gs の boundary・top-level callable 不変。member/public は本機能対象外で**未 redeploy**。
- **検証 / デプロイ**: `prerelease` 全ゲート PASS（security audit/boundary×3・typecheck・test:search/formula/kana/deeplink・er-sync・menu-registry 10/10）。`build` → `build:gas:admin`（boot loader 契約維持・top-level callable セット不変）。admin split を push → version 200 → `redeploy @200`、`clasp deployments --json` で `@200`（description "v376.41"）同期確認。実機確認（admin）は操作者タスク（HANDOVER §2-1 #0）。

---

## v376.40 — 2026-06-09 🔧 公式LINE投稿依頼 UI 文言調整（対象ラベル変更/並び替え + リンク欄の対象連動動的化・admin split のみ @199）

運用者要望に基づく公式LINE投稿依頼まわりの文言・並び順の調整。機能・データ・挙動は不変で、表示文言と並び順のみを変更する純フロント改修。

- **「対象」ラジオの文言変更＋並び替え** 🔧: `src/components/LinePostEditorModal.tsx`。`研修に紐付け`(TRAINING) → **`研修の投稿`** に改称し**先頭**へ、`一般投稿`(GENERAL) → **`登録研修以外`** に改称し**後**へ。`value`（`TRAINING`/`GENERAL`）・onChange・対象研修ピッカー表示条件は不変。
- **コンソール絞り込みフィルタの統一** 🔧: `src/components/LinePostConsole.tsx` の「対象:」絞り込みも同文言・同順へ（`研修` → `研修の投稿`、`一般` → `登録研修以外`、研修を先頭に）。同一概念の用語ドリフトを解消。
- **リンク欄ラベルを「対象」連動の動的表示に** 🔧: GENERAL（登録研修以外）選択時のみ `掲載リンク（資料・申込リンク等）（任意・http(s):// で始まる URL）`、TRAINING（研修の投稿）時は従来どおり `研修申込リンク（任意・…）`。入力フィールド（`trainingApplyUrl`）・`id`・`type="url"` バリデーション・プレビューの 🔗 リンク表示は共通のまま不変。
- **境界/スコープ**: 純フロント。admin Code.gs の boundary・top-level callable 不変。member/public は本機能対象外で**未 redeploy**。
- **検証 / デプロイ**: `prerelease` 全ゲート PASS（security audit/boundary×3・typecheck・test:search/formula/kana/deeplink・er-sync・menu-registry 10/10）。`build` → `build:gas:admin`（boot loader 契約維持）。admin split を push → version 199 → `redeploy @199`、`clasp deployments --json` で `@199`（description "v376.40"）同期確認。実機確認（admin）は操作者タスク（HANDOVER §2-1 #0）。

---

## v376.39 — 2026-06-07 🆕 研修管理から公式LINE投稿依頼を研修紐付けで作成（contextual creation・admin split のみ @198）

研修管理画面から、その研修に紐づいた公式LINE投稿依頼を「文脈起点の作成（contextual creation）」でシームレスに作成できるようにした。要望は「自動で研修に紐づけられた状態で新規投稿依頼がポップアップ」。

- **調査（本日付け Web）**: LINE VOOM/メッセージへの**外部システムからの自動投稿 API は存在しない**（投稿は LINE Official Account Manager / VOOM Studio の手動・予約のみ。Messaging API の VOOM 同時投稿は有料プラン＋従量課金＋単一吹き出し制約）。→ 既存の**手動「投稿依頼」ワークフロー維持が最適**と確認。今回は API 連携ではなく UX 統合に限定。
- **UX**: 研修編集モーダルのアクション列に「📱 LINE投稿依頼」ボタンを追加。押下で `LinePostEditorModal` を**事前入力**で起動：`targetType='TRAINING'` / `targetId=研修ID` / `trainingApplyUrl=buildPublicTrainingApplyUrl(研修ID)` / 本文テンプレ（研修名・開催日・会場）。`z-[60]` で研修モーダル(z-50)上に重畳（新タブ禁止 `feedback_gas_new_tab_auth_trap` 準拠）。保存後 `DRAFT` で投稿依頼コンソールに合流。
- **DRY**: 投稿依頼の編集モーダル＋プレビューを `src/components/LinePostEditorModal.tsx` に抽出し、`LinePostConsole` と研修管理で共用。本文テンプレは `src/shared/lineTemplate.ts`（`buildTrainingLinePostDraft`）に集約（申込リンクは本文に重複させず別フィールドへ）。
- **副次バグ修正** 🐛: `LinePostConsole` の研修ピッカー/ラベルが `t.name`（`Training` に存在せず undefined 表示）→ `t.title` に是正。
- **境界/スコープ**: 純フロント。admin Code.gs の boundary・top-level callable（doGet/processApiRequest ほか）不変。member/public は本機能対象外で**未 redeploy**。
- **検証 / デプロイ**: `prerelease` 全ゲート PASS（security audit/boundary×3・typecheck・test:search/formula/kana/deeplink・er-sync・menu-registry）。`build` → `build:gas:admin`（boot loader 契約維持）。admin split を push → version 198 → `redeploy @198`、`clasp deployments` で `@198` 同期確認。実機確認（admin）は操作者タスク（HANDOVER §2-1 #1）。

---

## v376.38 — 2026-06-06 🧪 テスト観点表評価 + a11y AA コントラスト是正 + npm audit fix（全 3 split @356/@115/@197）

テスト観点表（ISO/IEC 25010:2023）でコード・ドキュメントを評価し、実行可能なギャップを実測・是正。`docs/247_TEST_VIEWPOINT_EVAL_2026-06-06.md` 参照。

- 実測（公開 live @355）: `test:responsive` 全7ビューポート(320-1920) PASS / `test:a11y` critical=0・serious 1件検出。
- 是正: 公開ホーム「TRAINING」バッジ等 `bg-sky-600`+白(≈3.9:1) → `bg-sky-700`(≈5.3:1) で WCAG 2 AA 達成（`src/public-portal/App.tsx` 2箇所）。`npm audit fix` で moderate 7→5（残5は breaking 要・high/critical=0）。
- **デプロイ**: 全 3 split redeploy（public `@356` x2 / member `@115` / admin `@197`）。`npx clasp deployments --json` 一致確認。**デプロイ後 `npm run test:a11y` で critical/serious/moderate/minor=0 を live 再確認**。Code.gs に v376.36 archive 表定義(dormant・DB_SCHEMA_VERSION 不変で未適用)も同梱。typecheck/build/boundary 全 PASS。

---

## v376.37 — 2026-06-03 🏗️ ER 単一情報源化（A+B ハイブリッド）+ ドリフトゲート（**docs/build ツーリングのみ・本番非該当**）

ER 図（docs/03 main + portal）が `gas-src テーブル定義` と乖離する構造問題を根絶。設計→モデリング確認→仕様確認→実装の順で対応。

### アーキテクチャ
- **列の存在/順序** = `gas-src テーブル定義`＋`マスタ定義`（正本・不変）
- **型/PK/FK/コメント/リレーション(48)/分類** = `docs/er-metadata.json`（新規・手書き正本。現行 ER から bootstrap）
- `docs/03` の最初の mermaid ER は **自動生成**（`scripts/generate-er.mjs`・AUTO-GENERATED バナー・手書き禁止）→ build-docs-portal が portal 化
- **ドリフトゲート** `scripts/test-er-sync.mjs`（prerelease 追加）: stale メタ/不正リレーションを FAIL、型未設定を WARN

### ゲートが検出・是正した実ドリフト
- T_会員/T_事業所職員 の `介護支援専門員番号` 等コメント付き列が portal に復活（前段 v376 portal parser fix と合わせ完全反映）
- 旧 ER の誤り列を排除: `T_管理者Googleホワイトリスト` の `GoogleユーザーID`(v118廃止)/`表示名`、`T_監査ログ` の `対象ID/変更前JSON/変更後JSON/実行日時` → 実列（`Googleメール`/`操作日時`/`対象レコードID`/`旧値`/`新値`）へ
- ER 掲載テーブル 40→45（テーブル定義の全テーブル網羅）

### 状態
- `test:er-sync` PASS（45 テーブル/48 リレーション/stale=0）。残 WARN 115（主に M_ マスタ列の型未設定・default string 出力）は情報レベルで順次 metadata 補強。
- **docs/build ツーリングのみ**（GAS テーブル定義 不変・本番デプロイ非該当）。`AGENTS.md §4.6` を「ER は手書き禁止・テーブル定義+er-metadata.json から生成」に改訂。

---

## v376.36 — 2026-06-03 📝 _archive データモデル整備 + 移動ジョブ堅牢化（**未デプロイ / 本番は v376.35 のまま**）

退会会員アーカイブ（`T_会員_archive` / `T_事業所職員_archive`）に関するデータモデル調査・文書化と、移動ジョブのソース堅牢化。**移動ジョブ（`runArchiveOldWithdrawnMembers` / `moveWithdrawnRowsToArchive_`）は build pruner で全 split から除外された dead code**で本番未稼働（archive シートは常に空）。

### 調査結果（重要）
- アーカイブは「退会から3年超 → 本テーブルから**物理削除**して archive へ**移動**」する設計（追記履歴ではない）。よって `会員ID`/`職員ID` は本テーブルと archive の片方にのみ存在し重複しない。
- ただし**移動ジョブは現状 pruned（未デプロイ）**のため、実際には移動は一度も起きていない。

### 変更（source + docs のみ）
- `gas-src` テーブル定義: `T_*_archive` に surrogate `アーカイブID`（PK）+ `アーカイブ日時` を末尾付与。
- `moveWithdrawnRowsToArchive_`: keyCol 冪等化（既archive済はソース除去のみ）/ dst ヘッダーマップ + サロゲート・日時付与 / archive追記を先・ソース削除を後（データ消失防止）。※pruned のため実行時挙動は不変。
- `docs/03_DATA_MODEL.md`: ER に archive surrogate 列追加、§4.10 全面改訂（move 設計 / PK 根拠 / dead-code 状態 / 復活手順 / 履歴との区別）。`docs/portal/*` 再生成。

### デプロイ状態
- **未デプロイ**。実行時挙動が変わらない dormant 変更（移動関数 pruned・`DB_SCHEMA_VERSION` 不変で migration も走らない）かつ clasp RAPT 失効のため、no-op デプロイは見送り。git 側に dormant 差分として保持し、**次の機能リリース、または archive 機能の正式復活時**に同時反映する。
- archive 機能の活性化（pruner keep-list 追加 + 物理削除実行）は破壊的操作のため別途承認事項（`docs/03` §4.10 復活手順参照）。

---

## v376.35 — 2026-06-03 🔧 申込URL 無効時は公開ポータルの申込ボタン自体を非表示（全 3 split @355/@114/@196）

v376.34 では「申込URL 無効＝外部リンクをやめて内部申込ボタンへフォールバック」だったが、利用者の意図（無効にしたら申込ボタンが消えるべき）に合わせ、**申込URL 無効＝公開ポータルでの申込受付 OFF（申込ボタン自体を出さない＝閲覧のみ）**へ仕様変更。

### 申込URL トグルの意味（確定）
| 状態 | 公開ポータルの CTA |
|---|---|
| 有効 ＋ URL 設定あり | 「申込フォームへ」外部リンク |
| 有効 ＋ URL 空 | 「＋申し込む」内部申込フォーム |
| **無効** | **申込ボタンなし（閲覧のみ）** |

### 実装
- `src/shared/trainingOptions.ts`: `effectiveApplicationUrl` を `resolveApplyCta(t): 'none'|'external'|'internal'` へ置換。
- `PublicTrainingList.tsx`: `applyCta==='none'` のとき CTA ブロック自体を描画しない。
- `App.tsx`（公開 deep-link）: `none` は申込画面へ飛ばさず一覧＋「この研修は現在オンライン申込を受け付けていません」通知。
- `TrainingManagement.tsx`: 任意項目設定パネルの説明を新挙動に更新。

### 検証 / デプロイ
- `npm run typecheck` / build / boundary 監査 PASS（純フロント・GAS Code.gs 不変）。回帰なし（`applicationUrl` 既定 `true`・未設定は有効扱いのため既存研修は申込ボタン表示維持）。
- 全 3 split redeploy：integrated/public `@355` x2 / member `@114` / admin `@196`。`npx clasp deployments --json` で一致確認（途中 clasp RAPT 失効で再ログイン後に再開）。

---

## v376.34 — 2026-06-01 🆕 研修任意項目トグルを「有効/無効」化し公開申込画面に反映（全 3 split @354/@113/@195）

研修の任意項目トグル（admin の「表示中」スイッチ）が **admin 編集フォームの表示制御のみ**で公開側に効かず、「`申込URL` を無効にできない（値を消すしかない）」状態だった。config-driven UI の単一情報源化で解消。

### 仕様
- admin トグルを「表示中/非表示中」→「**有効/無効**」に改称（NN/g toggle guidelines）。補助文に「無効にすると申込画面に表示されない」旨を明記。
- 無効にした任意項目は**申込画面（公開ポータル）に表示しない**（Hidden-vs-Disabled: 操作不能な項目は公開側で非表示）。対象: 講師 / 案内PDF / 申込締切 / 詳細内容 / 費用 / 申込URL。
- **`申込URL` は無効時、値が残っていても外部リンク化せず内部申込フロー**へ（可視性と挙動の連動）。値は保持し可逆。

### 実装
- 新規 `src/shared/trainingOptions.ts`: `isTrainingFieldEnabled(optionsJson, key)` / `effectiveApplicationUrl(t)`（項目設定JSON のネスト `fieldConfig` を解釈、未設定/旧データはデフォルト有効）。
- `PublicTrainingList.tsx`: 各任意項目を `isTrainingFieldEnabled` で gate、CTA は `effectiveApplicationUrl` で内部/外部を分岐。
- `App.tsx`（公開 deep-link）: `effectiveApplicationUrl` を使用（無効なら `?t=` で申込画面へ直行）。
- `TrainingManagement.tsx`: トグル表示・title・補助文を有効/無効へ。

### 検証 / デプロイ
- `npm run typecheck` / build / boundary 監査 PASS（純フロント・GAS Code.gs 不変）。
- 全 3 split redeploy：integrated/public `@354` x2 / member `@113` / admin `@195`。`npx clasp deployments --json` で一致確認。
- 会員マイページ（`TrainingApply`）の研修情報表示への同種 gate は未適用（フォローアップ候補。member は applicationUrl 非使用・内部申込のみ）。

---

## v376.33 — 2026-06-01 🐛 研修編集モーダルの入力フォーカス喪失バグ修正（全 3 split @353/@112/@194）

研修編集モーダルで `申込URL` / 問い合わせ窓口（担当者・電話番号・メールアドレス）等に**1文字入力するごとにフォーカスが外れ**、フォームが実質入力不能だった事象を修正。受付開始（必須項目入力）ができない原因でもあった。

### 根本原因
`TrainingDetailModal` / `PdfPreviewModal` の focus 管理 `useEffect` が依存配列に `onClose` を含んでいた。親 `TrainingManagement` の `onClose`(`closeDetail`) は `useCallback` されておらず毎レンダーで参照が変わるため、入力1文字 → `setForm` → 親再レンダー → `onClose` 参照変化 → effect が**毎キーストロークで再実行**。cleanup の `previousFocusRef.current?.focus?.()` と再実行時の `setTimeout(() => closeButtonRef.current?.focus())` で入力欄からフォーカスが閉じるボタンへ奪われていた。

### 対策
`onClose` を `onCloseRef` 経由で参照し、focus/scroll-lock/ESC の effect 依存を `[open]` のみに変更（`open` の遷移時のみ実行）。呼出側のメモ化有無に依存しない堅牢な形。
- `TrainingDetailModal`: 報告バグ本体（研修編集フォーム入力不能）を解消 — admin
- `PdfPreviewModal`: 同根の潜在バグ（入力欄が無いため非顕在）も予防修正 — admin/member/public で使用

### 検証 / デプロイ
- `npm run typecheck` / build / boundary 監査 PASS（純フロント・GAS Code.gs 不変）。
- 全 3 split redeploy：integrated/public `@353` x2 / member `@112` / admin `@194`。`npx clasp deployments --json` で一致確認。
- 実ブラウザ確認は操作者。

---

## v376.32 — 2026-06-01 🆕 公開ポータル研修ディープリンク（全 3 split @352/@111/@193）

公開ポータルが URL パラメータで特定研修・特定画面へ直行できるようになった。従来は `doGet` が「URL パラメータは無視」設計で、どんなパラメータ/ハッシュを付けても常にポータルトップで起動していた（v363 の deep link util は `window.location.hash` を内側 iframe で直読みしており、GAS の二重 iframe では常に空＝機能していなかった）。

### 仕様
- `…/exec?t=<研修ID>` → 該当研修の申込画面（ExternalApplyForm）へ直行。外部申込フォーム（`applicationUrl`）研修は一覧へ誘導、未発見/受付終了は一覧＋通知。
- `…/exec?p=<page>` → 指定画面へ直行。`page` = `training-list` / `member-application` / `member-update` / `withdrawal-request` / `training-cancel`（別名 `trainings`/`join`/`update`/`withdraw`/`cancel`）。
- GAS 予約語 `c` / `sid` は不使用（使用すると 405）。

### 実装
- `gas-src/Code.full.gs` `doGet`: `e.parameter` を許可制 sanitize（英数・`-`・`_`・最大80字・deny-by-default、`sanitizeDeepLinkValue_`）して `window.__DEEPLINK__` を注入。正規表現リテラル不使用（build pruner 罠回避）。
- `src/utils/deepLink.ts`: 壊れた hash 直読みを撤去し `readDeepLink()`/`consumeDeepLink()`/`buildTrainingApplyUrl()`/`buildPageUrl()` へ作り直し。
- `src/public-portal/App.tsx`: ロード完了後に1回だけ deep link を適用（未発見時は一覧＋通知）。
- admin: `src/components/TrainingManagement.tsx` 編集モーダルに「🔗 申込リンク」コピー。クリップボード不可環境では URL を表示し手動コピー可。正式 public URL は `src/config/publicPortal.ts` で定数化（ハードコード回避）。

### 検証 / デプロイ
- `npm run typecheck` PASS / frontend build OK / `security:public-boundary`・`security:split-boundary` PASS（public top-level は `doGet`/`healthCheck`/`processApiRequest` のまま・**新規露出なし**）。
- 圧縮バンドルを `inflateRawSync` で展開し deep link コード実在を確認。
- 全 3 split を redeploy：integrated/public `@352` x2 / member `@111`（共通 doGet 注入のみ・挙動不変）/ admin `@193`。`npx clasp deployments --json` で一致確認。
- 実ブラウザ確認は操作者（`HANDOVER.md` §2-1 #1）。

---

## 2026-05-30〜06-01 🛠️ ER エディタ双方向編集化 + 別プロジェクト化決定（本番コード変更なし）

### 2026-06-01 — 作業区切り + 引継ぎ
- HANDOVER.md / release-notes-2026.md 整備、ER エディタを別プロジェクトとして MEMORY 化
- MEMORY 新規: `project_er_editor_standalone.md` — ER エディタ独立 OSS プロダクト化構想
- 編集中スキーマは user 側で `.dbml` ダウンロード保管（docs/03 への反映は次セッション以降）

### 2026-05-31 — ER エディタ双方向編集化（3 段階の積み上げ）

#### 第1次: 双方向編集 MVP
- モデル単一情報源化（エディタ↔キャンバスを内部表現で同期）
- キャンバス直編集: テーブル/列の追加・名前変更・型変更・削除・PK トグル
- 列ハンドル間ドラッグで FK 作成
- 線クリックで削除
- DBML / Mermaid 双方向同期
- localStorage 自動保存復元 (KEY: `er-editor-state-v2`)

#### 第2次: 視覚強化
- crow's foot カーディナリティ表示 (SVG marker + `orient=auto-start-reverse`)
- 接続線中央に列リンクラベル (`子列 → 親列`)
- テーブル追加を右端外側へ配置 + 自動フォーカス
- ドラッグ中の接続プレビュー線を赤破線 2.5px で強調

#### 第3次: cardinality 編集 + 接続強化
- 接続線クリックで `EdgeEditor` ポップオーバー
- 1対1 / 1対多 / 多対多 切替、向き反転、ラベル編集、削除
- cardinality を文字列依存 → 種別 (`one-one`/`one-many`/`many-many`) へ正規化
- 各列の左右両側にハンドル (id に `L:`/`R:` 接頭辞) + `connectionMode="loose"`
- 位置関係で近い側のハンドルへ自動接続

#### 検証
- Playwright で全機能検証済（多対多 = 両端 crow's foot + DBML `<>`、向き反転、移動後接続 Ref 5→6、loose 接続）

---

## 2026-05-30 📘 ドキュメントポータル拡充 + AGENTS.md 整理（本番コード変更なし）

本日は本番デプロイは行わず、ドキュメントとグランドルール整理に集中。コミット 10 件、本番への影響ゼロ。

### docs/portal/ ドキュメントポータル新設・拡充
- `index.html` — TOC + クイックナビ
- **`interactive-er.html`** — React Flow + ELK で本案件 40 テーブルを全カラム表示、ドラッグ可、クリックでハイライト
- **`er-editor.html`** — **汎用 ER エディタ&ビューア**（DBML/Mermaid 編集、ライブプレビュー、ファイル D&D 対応、サンプル投入、保存ダウンロード）
- `tables.html` — 構造化テキスト設計書（FK 関係クリッカブル）
- `er-diagram.html` — ドメイン別 Mermaid + ELK（6 ドメインに分割）
- `dbml-export.html` — ChartDB / dbdiagram.io / DbSchema / Liam ERD への DBML エクスポート + 誘導
- `specifications.html` — PRD / アーキ / 認証 RBAC / デプロイ / セキュリティ 5 視点 サマリ
- `schema.dbml` — `parseErdSource` 経由で自動生成 (40 table + 40 Ref)
- `scripts/build-docs-portal.mjs` — 単一情報源、 `npm run build:docs-portal` で一括再生成
- 採用 OSS は全て MIT/EPL/BSD（許可的）。ChartDB AGPL は意図的に回避

### AGENTS.md グランドルール整理
- §4 を 5 サブセクション化 (Deploy SOP / 認証フロー / セキュリティ運用 / UI/UX / ランタイム契約 / §4.6 ドキュメント形式規約 新設)
- §6 重複削減（§0 と被る pepper/token 記録禁止を一本化）
- ユーザー指定追加ルール 6 件反映:
  1. DRY 原則を実装の基本とする
  2. ハードコーディング原則禁止（シークレットは絶対禁止）
  3. 影響範囲の事前確認 + 既存挙動を破壊しないことの保証
  4. セキュアコーディング 5 視点（入力検証 / 認証認可 / 機密データ保護 / エラー処理 / セキュア通信）
  5. ER 図・テーブル設計書は HTML 形式必須（§4.6）
  6. AI 用と人間可読版の併設（§4.6）

### MEMORY 整理 + 新規 feedback
- フィードバックメモリを Layer 別 subheading で並び替え（L0 → L3 → L4 → L5 → L6）
- 新規 外部 OSS 採用前にライセンス監査必須（MEMORY `feedback_oss_license_audit`） — AGPL 回避、MIT/EPL/BSD 安全
- 新規 docs/portal/ アーキ概要（MEMORY `project_docs_portal_architecture`） — 6 ページ構成 + 採用ライセンス

### コミット 10 件
- 2327b64 fix: v376.31 initializeSchema_ 堅牢化
- 2e18f59 docs: v376.31 反映
- ffbc2a3 test: dryRun 5/5 + cleanup
- 2a1a07c docs: dryRun PASS 記録
- 50cc0ff docs: AGENTS.md §4 subsection 化 + §6 重複削減
- 64d7a1a docs: AGENTS.md 追加ルール 6 件反映
- 7d18aad docs: 人間向け HTML ポータル新設
- 28e0402 fix: ER 図 拡大縮小パン (svg-pan-zoom)
- 5dd5f9e / 0ed5f44 fix: ER 視認性改善
- 34eb384 feat: tables.html 理路整然版
- e5d3be9 feat: ER ドメイン分割 + ELK
- 981628d feat: DBML エクスポート
- f70d347 feat: ChartDB 互換 interactive-er.html (React Flow + ELK / MIT)
- 7b84e73 feat: 汎用 ER エディタ er-editor.html

### 次セッション最優先候補
ER エディタの深化（SQL CREATE TABLE 解析 / Monaco エディタ / undo / 複数スキーマ管理 / PNG エクスポート）。 OSS として外出し可能性も検討余地。

---

## v376.31.1 — 2026-05-29 ✅ dryRun テスト 5/5 PASS + 物理削除完了

本日実装機能（v376.26〜v376.31）の round-trip 検証を operator が ▶ Run して実施し、全テスト PASS。投入したテストデータ（DRYRUN_v376_30_31_ プレフィックス付き）は物理削除済。

| Test | 検証内容 | 結果 |
|---|---|---|
| 1 | 申込URL round-trip (T_研修 書込 → mapTrainingRowsForApi_ で applicationUrl 読出) | ✅ PASS |
| 2 | T_権限ロール INSERT → listRoles_ で allowedMenus/scope/assignedCount 列挙 | ✅ PASS |
| 3 | getRoleByIdCached_ で roleId resolve（Phase 1-B fallback chain） | ✅ PASS |
| 4 | isActionAllowedForSession_ — 経理ロール (annual-fee 許可 / saveTraining 拒否), MASTER 全許可（Phase 2 hotfix.2 session-resolved authz） | ✅ PASS |
| 5 | 空シート lastColumn=0 が発生し得ることの確認（v376.31 空シート防御の根拠） | ✅ PASS |

### Cleanup 実施結果
- T_研修: 1 行物理削除 (DRYRUN_v376_30_31_T34847518)
- T_権限ロール: 1 行物理削除 (DRYRUN_v376_30_31_role-e9464af5-custom)
- DRYRUN_V376_30_31_MANIFEST Property 削除
- admin_roles_v1 / all_data / training_management / dashboard キャッシュクリア
- 残存テストデータ: なし

これで v376.26 RBAC Phase 2-A 〜 v376.31 schema 堅牢化までの全機能が機械検証 + 物理削除完了状態。

### デプロイ
- dryRun / cleanup の operator 関数（`dryRunV376_30_31` / `cleanupDryRunV376_30_31`）は admin split のみに追加。admin fixed deployment を **@192**（description: `v376.31.1 dryRun test`）へ redeploy 済。
- integrated/public（@351 ×2）・member split（@110）は v376.31 のまま変更なし。本番ユーザー向け機能挙動は v376.31 から不変（追加分は editor から ▶ Run する検証/cleanup 補助関数のみ）。
- ※ 2026-06-01 引継ぎ整合確認で `clasp deployments --json` により admin live=@192 を確認し、HANDOVER / 09 / 00 の admin 版数を @192 に整合（それまで @191 と記載されていた版ずれを是正）。

---

## v376.31 — 2026-05-29 🔒 initializeSchema_ 堅牢化（v376.30.x 根本対応）

v376.30 で再現した「`範囲の列数には 1 以上を指定してください` で研修管理が開けないループ」の根本原因を解消。これで今後の schema 更新時に同じ事象が起きない。

### 根本原因
`protectHeaderRows_` および `applyDataValidationRules_` が `sheet.getRange(1, 1, 1, sheet.getLastColumn())` を空シート（lastColumn=0）で呼ぶと Google Sheets API が `範囲の列数には 1 以上を指定してください` を throw する。一度でも空シートが混入すると `initializeSchema_` 全体が中断され `markSchemaInitialized_` 未到達 → `DB_SCHEMA_INITIALIZED_VERSION` が古いまま残る → 以降毎リクエストで再初期化ループ。

### 対策（2 段構え）

| 種別 | 内容 |
|---|---|
| 🔒 計装 | `initializeSchema_` の各 step を critical/post 2 種に分離。critical（migration / seed）は例外伝播でロールバック維持、post（validation 適用 / 保護 / cleanup / audit）は Logger.log のみで続行 — 補助処理の軽微なエラーで初期化全体を止めない |
| 🔒 空シート防御 | `protectHeaderRows_`: `lastColumn < 1` のシートを skip + Logger.log。`applyDataValidationRules_`: 同じく `lastColumn < 1` の tableSheet を skip + Logger.log |
| 📊 観測性 | `[initializeSchema_] passed=N criticalFailed=M postFailed=K (post detail: [...])` をログ出力 — 次回 schema 更新時に問題発生 step を即座に特定可能 |
| 🚀 デプロイ | 全 3 split（initializeSchema_ は共有コード — 統合 public @351 / member @110 / admin @191）|
| ✅ | typecheck / security:public/member/admin-boundary 全 PASS |

### 既存挙動への影響
- critical 側は変わらず（migration の整合性は引き続き保証）
- post 側は失敗時もログだけ残して続行 → これまで「再初期化ループ」を引き起こしていた条件が無効化
- `DB_SCHEMA_INITIALIZED_VERSION` が確実に更新されるようになり、同じ事象は再発しない

---

## v376.30.1 / v376.30.2 — 2026-05-29 🐛 v376.30 hotfix（schema 診断 + 強制マーク救済）

v376.30 デプロイ後、admin の「研修管理」を開くと「範囲の列数には 1 以上を指定してください」エラーで一覧が表示できない状態が発生。診断の結果、T_研修 schema 自体は 24 列 + 申込URL 列追加 + 5 件データ保持で正常に migrate 済だったが、`DB_SCHEMA_INITIALIZED_VERSION` Property が `2026-05-19-roster-designer-v372`（旧値）のままで、毎リクエストで `initializeSchemaIfNeeded_` が再走 → `initializeSchema_` 内の後処理 step で例外 → エラー画面、というループに陥っていた。

| 種別 | 内容 |
|---|---|
| 🆕 v376.30.1 | `diagnoseSchemaStateV376_30()` — 読取のみの診断関数。`DB_SCHEMA_VERSION` / Properties / 各シート（T_研修・T_権限ロール・whitelist）の列数・行数・実ヘッダ・temp シート残骸を一括出力 |
| 🆕 v376.30.2 | `forceMarkSchemaInitializedToCurrent()` — `DB_SCHEMA_INITIALIZED` = 'true'、`DB_SCHEMA_INITIALIZED_VERSION` = 現在の `DB_SCHEMA_VERSION` に強制セット。シートは触らない（書込は Properties 2 行のみ）|
| ✅ | 両関数を `ADMIN_TOP_LEVEL_FUNCTIONS` keep-list に追加 |
| 🚀 | admin split @189 → @190 |
| 🔍 | 根本原因の特定（initializeSchema_ のどの step が例外を投げているか）は次回 hotfix 候補として未着手。step ごとに try/catch + Logger.log を仕込めば次回 schema 更新時にログから特定可能 |

### 操作者対応（実施済）
1. admin @190 の Apps Script editor から `forceMarkSchemaInitializedToCurrent` を ▶ Run
2. 結果ログで `before.DB_SCHEMA_INITIALIZED_VERSION = '2026-05-19-roster-designer-v372'` → `after.DB_SCHEMA_INITIALIZED_VERSION = '2026-05-29-training-application-url-v376.30'` 確認
3. admin 画面リロード → 研修管理が回復

---

## v376.30 — 2026-05-29 🆕 研修登録に「申込URL」任意項目を追加（外部申込フォーム対応）

Google フォーム等の外部申込フォーム URL を研修に紐付けられるようにする任意項目追加。設定すると公開ポータルの「申し込む」ボタンが外部フォームへのリンクに置換され、内部申込フローをバイパスできる。

| 種別 | 内容 |
|---|---|
| 🆕 | T_研修 schema 末尾に「申込URL」列追加。`normalizeTableColumns_` の name-based shift により既存 5 行データを完全保持 |
| 🆕 | `DB_SCHEMA_VERSION` を `'2026-05-29-training-application-url-v376.30'` に更新 → 次回 admin login 時に `initializeSchemaIfNeeded_` が走り新列を自動追加 |
| 🆕 | `src/types.ts`: `Training.applicationUrl?` / `TrainingFieldConfig.applicationUrl` 追加、`DEFAULT_FIELD_CONFIG.applicationUrl = true`（デフォルト表示）|
| 🆕 | `src/shared/types.ts::PublicTraining.applicationUrl?` 追加 |
| 🆕 | `src/components/TrainingManagement.tsx`: `TRAINING_OPTIONAL_FIELD_DEFS` に追加、`buildEmptyForm` 初期値、案内PDF 直後に URL 入力欄（placeholder + 説明文）|
| 🆕 | `src/public-portal/components/PublicTrainingList.tsx`: `t.applicationUrl` 設定時に「申し込む」ボタンを `target="_blank" rel="noopener noreferrer"` の「申込フォームへ」リンクに置換（外部リンクアイコン + aria-label）|
| 🔧 | `gas-src/Code.full.gs::saveTraining_`: 既存/新規両方の path で 申込URL 列に書込 |
| 🔧 | `fetchAllDataFromDb_`: `applicationUrl` を training オブジェクトで返却 |
| 🔧 | `getPublicTrainings_`: applicationUrl を公開ポータルに返却 |
| ✅ | typecheck / build:gas / build:gas:member / build:gas:admin 全成功 |
| ✅ | security:public/member/admin-boundary 全 PASS |
| 🚀 | デプロイ: 全 3 split（統合 public @350, member @109, admin @188）|

### 使い方
1. admin → 研修管理 → 新規登録 or 既存研修編集 → 「申込URL」入力欄に Google フォーム等の URL を貼付
2. 保存
3. 公開ポータルで該当研修カードの CTA ボタンが「申込フォームへ」に変わり、クリックすると外部フォームが新タブで開く

### 設計判断
- 既存「案内状URL」（PDF アップロード成果物）と並立する別フィールド。混同しないよう列追加で対応
- 任意項目システム（`fieldConfig`）に統合 — admin form で表示/非表示トグル可
- 外部 URL が設定されていれば内部フローを完全バイパス（並列表示しない — UX の明確性優先）
- 値が空文字列なら従来挙動（変更なし）

---

## v376.29 — 2026-05-28 🎉 メニュー単位 RBAC Phase 3 完了（Sidebar 動的化 + permission-aware routing）

`docs/246` Phase 3 完了。これで Phase 1（認可レイヤー）+ Phase 2（ロール CRUD UI）+ Phase 3（動的 Sidebar/Routing）の **全ロードマップが完了**。admin split @187。

| 種別 | 内容 |
|---|---|
| 🆕 | `src/components/Sidebar.tsx` 動的描画モード — 各 `NavItem` に `menuId` フィールド追加。`allowedMenus` props と照合して該当 item を絞り込み、空グループは非表示 |
| 🆕 | 新 props: `isMaster` / `allowedMenus` / `roleName`（後方互換 optional）|
| 🆕 | `src/App.tsx` 新 state `adminSessionRbac` で session 内 RBAC 情報を保持 |
| 🆕 | `pickInitialAdminView` ヘルパー — ログイン直後の初期 view を allowedMenus に基づき優先順位で選択（members-list → training-manage → annual-fee → admin-settings → allowedMenus 先頭）|
| 🆕 | `handleViewChange` に `isViewAllowed` ガード — `viewToMenuId` 逆引きで対象 menu 判定 → 非 MASTER かつ menu ∉ allowedMenus なら遷移拒否（permission-aware routing）|
| 🆕 | Sidebar 表示名 detail に `roleName` 反映 — カスタムロール「経理担当」などが label に出る |
| 🔧 | `src/services/api.ts` の `AdminLoginResult` に optional `roleId` / `roleName` / `isMaster` / `allowedMenus` / `trainingEditScope` 追加（backend は v376.25 から返却済、型を追従）|
| 🔧 | Legacy `isFullAdmin` / `isTrainingOnly` 経路は `allowedMenus` 未取得時の fallback として残置（admin shell 認証直後の白ちら防止）。Sidebar 主要パスは動的描画に移行 |
| ✅ | typecheck / security:admin-boundary PASS、build:gas:admin 成功 |

### Phase 1〜3 通しでの動作
- **MASTER user**: 全メニュー表示・全 view 許可（変わらず）
- **管理者 (ADMIN, role-admin-initial)**: 既存挙動完全維持（Phase 1-A LEGACY 互換 allowedMenus）
- **カスタムロール user**: Sidebar に**自分の許可メニューのみ**表示、URL 直叩きも UI/server 両層で拒否、画面遷移時も routing ガードで防止

### Phase 4 以降（将来課題、docs/246 §10）
- frontend `api.ts` ↔ backend dispatch の codegen 連動
- メニュー × 操作粒度（CRUD）への拡張
- ABAC / ReBAC（事業所スコープ等）への発展余地

---

## v376.28.1 / v376.28.2 — 2026-05-28 🐛 RBAC Phase 2 hotfix 2 件

Phase 2 デプロイ後、本番動作確認で発見した 2 件のバグを修正。admin split @185 → @186。

### v376.28.1 — 🐛 runRebuildSchemaForV246 が T_権限ロール シートを作成していなかった

| 種別 | 内容 |
|---|---|
| 🐛 | Phase 1-B の `runRebuildSchemaForV246` が `normalizeTableColumns_` のみ呼んでいたが、これは既存シートの列正規化専用で、シート自体の作成は別関数（`ensureTableSheetsExist_`）経由のため、T_権限ロール シートが作られていなかった |
| 🔧 | `runRebuildSchemaForV246`: `normalizeTableColumns_` の前に `ss.insertSheet('T_権限ロール') + writeSheetHeaders_` を実行する step を追加 |
| 🔧 | `seedInitialPermissionRoles_`: 防御的にシート未作成なら `insertSheet + writeSheetHeaders_` する処理を追加（idempotent）|
| 💡 | 既存 admin login は Phase 1-B fallback chain により legacy 権限コード経路で稼働継続中だったため、admin ポータルへのアクセスに支障なし |

operator が再度 `runRebuildSchemaForV246` を ▶ Run することで T_権限ロール シート新規作成 + 5 ロール seed 完了。

### v376.28.2 — 🐛 processApiRequest 認可が legacy permLevel を見ていた致命的バグ

| 種別 | 内容 |
|---|---|
| 🐛 | `checkAdminBySession_` で T_権限ロール を正しく解決して session.isMaster / allowedMenus を設定していたのに、`processApiRequest` が session を捨てて legacy `permissionLevel` (whitelist.権限コード) を再参照して `isActionAllowedByMenu_(action, permLevel)` で判定していた |
| 🐛 | 結果: カスタムロールを作成して既存 ADMIN ユーザーに割り当てても、server は LEGACY_ROLE_TO_MENUS の固定マッピングで判定 → カスタムロールの allowedMenus が server enforcement に反映されない |
| 🆕 | 新ヘルパー `isActionAllowedForSession_(action, sessionResult)`: session.isMaster=true なら全許可（MASTER 全権原則維持）、else `ACTION_TO_MENU[action] ∈ session.allowedMenus` を直接評価 |
| 🔧 | `processApiRequest` を `isActionAllowedByMenu_` から `isActionAllowedForSession_` へ切替 |
| 🔧 | `scripts/menu-registry.mjs` にも `isActionAllowedForSession` を追加（GAS と同一実装）|
| ✅ | snapshot test に 10 番目のテスト追加: 「INITIAL_ROLE_DEFINITIONS の各 session 経路で legacy ≡ session resolved」を機械検証 → 10/10 PASS（既存 4 ユーザーへの影響なしを保証）|

### user 確認済設計（最終形）
- **MASTER は必ず全権限**（マスト）→ `session.isMaster=true` で全許可、これは絶対
- **管理者 (ADMIN) は現状のまま** → 初期ロール `role-admin-initial` の allowedMenus が LEGACY 互換のため挙動不変
- **その他カスタムロール** → MASTER が「ロール管理」UI で経理担当・研修委員 等を自由定義 → server enforcement が効く

---

## v376.26〜.28 — 2026-05-28 🎉 メニュー単位 RBAC Phase 2 全完了

`docs/246` Phase 2 を 3 段階で完了。admin split @182 → @183 → @184。

### v376.26 — Phase 2-A: backend ロール CRUD API

| 種別 | 内容 |
|---|---|
| 🆕 | `listRoles` action — T_権限ロール 全件 + MENU_REGISTRY + 各ロールの assignedCount を返却 |
| 🆕 | `saveRole` action — 新規作成/編集（roleId 有無で分岐）|
| 🆕 | `deleteRole` action — soft delete（assignedCount>0 / isBuiltIn=true は拒否）|
| 🆕 | `duplicateRole` action — saveRole_ を再利用してテンプレ複製 |
| 🔒 | server-side で MASTER 限定（`requireMasterForRoleWrite_` — 特権昇格防止）|
| 🔒 | ガードレール: "MASTER" 予約 / 同名禁止 / masterOnly 拒否 / 組込編集削除拒否 / 削除前 assigned チェック |
| 🆕 | `appendRoleAuditLog_` — T_監査ログ に ROLE_CREATE / ROLE_UPDATE / ROLE_DELETE / ROLE_DUPLICATE を記録 |
| 🔧 | `getAdminPermissionData_` の戻り値に `roles` / `menuRegistry` 追加（既存フィールド維持）|
| 🔧 | `saveAdminPermission_` に optional `roleId` 受領。指定があれば validate して ロールID 列書込。未指定なら legacy permissionLevel から `LEGACY_CODE_TO_INITIAL_ROLE_ID` 経由で自動マップ + 同期書込 |
| 🔧 | `getAdminPermissionEntries_` の各エントリに `roleId` 追加 |

### v376.27 — Phase 2-B: ロール管理 UI

| 種別 | 内容 |
|---|---|
| 🆕 | `src/components/RoleManagementPanel.tsx` 新設 |
| 🆕 | 権限管理画面（system-permissions view）の「管理者権限を追加」直前に挿入 |
| 🎨 | ロール一覧テーブル: 名前 / 説明 / 許可メニュー数 / 研修編集スコープ / 割当数 / 操作ボタン（編集/複製/削除）|
| 🎨 | 編集モーダル: ロール名 + 説明 + 研修編集スコープラジオ + 権限マトリクス（メニュー × チェック、group ごとにグルーピング）|
| 🔒 | UI ガードレール: 組込/非MASTER caller では操作ボタン非活性。masterOnly メニューはチェックボックス disabled + tooltip + バッジ表示。assignedCount > 0 のとき削除ボタン非活性 + tooltip |
| 🔧 | `src/types.ts`: `MenuRegistryEntry` / `RoleDefinition` 型を新規定義。`AdminPermissionData.roles` / `menuRegistry` を optional 追加 |
| 🔧 | `src/services/api.ts`: `listRoles` / `saveRole` / `deleteRole` / `duplicateRole` 実装。private `runAction<T>()` ヘルパーで dispatcher を共通化 |

### v376.28 — Phase 2-C: 管理者追加フォーム roleId 選択化

| 種別 | 内容 |
|---|---|
| 🔧 | 「管理者権限を追加」フォーム + 既存管理者編集行の権限選択ドロップダウンを permissionLevel → roleId 選択へ移行 |
| 🔧 | `adminPermissionData.roles` から GENERAL を除外して動的選択肢化。組込ロールには [組込] バッジ |
| 🔧 | 選択時に対応する legacy permissionLevel を自動同期（whitelist 権限コード列との後方互換）|
| 🔧 | roles 未取得時は legacy permissionLevel ドロップダウンに自動 fallback（v376.25.1 以前との互換）|
| 🔧 | `newAdminPermission` state + `adminPermissionDrafts` state + `updateAdminPermissionDraft` ヘルパー + `saveAdminPermission` 型に roleId 追加 |

### 検証
- typecheck / test:menu-registry (9/9) / formula / search / kana 全 PASS
- security:public/member/admin-boundary 全 PASS
- build:gas / build:gas:member / build:gas:admin 全成功
- admin Code.gs に全新規関数（listRoles_ / saveRole_ / deleteRole_ / duplicateRole_ / appendRoleAuditLog_ / requireMasterForRoleWrite_ / validateRolePayload_）の注入を grep で確認

### 次フェーズ
Phase 3: Sidebar 動的化 + permission-aware routing + `isFullAdmin`/`isTrainingOnly` 撤去

---

## v376.25.1 — 2026-05-28 🎉 メニュー単位 RBAC Phase 1-B 完全完了（DB migration 適用）

`docs/246` Phase 1-B の最終締め。operator スクリプトに `Logger.log` 追加で出力可視化（v376.25 で漏れていたため再デプロイ）+ DB migration 完了確認。

| 種別 | 内容 |
|---|---|
| 🐛 | v376.25 operator スクリプト 3 個（`runRebuildSchemaForV246` / `migrateToRoleBasedRBAC_v246_DRYRUN` / `_APPLY`）が戻り値だけで Logger.log を呼んでいなかったため、Apps Script editor の「実行ログ」に何も出ない問題を修正。`_LOG` 慣習に揃えて Logger.log 追加 |
| 🎉 | DB migration 適用完了。`T_権限ロール` 5 行 seed + ホワイトリスト 4 行（MASTER 2 + ADMIN 2）すべて適正 roleId へ紐付け |
| ✅ | `migrateToRoleBasedRBAC_v246_DRYRUN` 再実行で全行 `SKIP（既に正しい）` 確認 = ロールID 経路稼働中。`権限コード` 列は rollback 用に保持 |
| 🚀 | デプロイ: admin split @181（operator script の Logger.log 追加のみ。挙動変更なし）|

### 移行結果

| wlId | email | 旧 permCode | 新 roleId |
|---|---|---|---|
| WL-001 | k.noguchi@hcm-n.org | MASTER | role-master-builtin |
| WL-53aba256 | c.yoshizaki@hcm-n.org | MASTER | role-master-builtin |
| WL-cb77cdb2 | h.otuka@hcm-n.org | ADMIN | role-admin-initial |
| WL-dead6b45 | k.sakurai@hcm-n.org | ADMIN | role-admin-initial |

### Phase 1 完了。次は Phase 2（権限管理コンソール UI）
ロール CRUD + 権限マトリクス UI + masterOnly enforcement + 監査ログ。`docs/246` §6 参照。

---

## v376.25 — 2026-05-28 🆕 メニュー単位 RBAC Phase 1-B コード反映（schema + fallback chain）

`docs/246` Phase 1-B のコード反映。**実 DB migration は operator が次セッションで段階実行**するため、この commit/deploy 単独では挙動完全維持。admin split のみ @180。

| 種別 | 内容 |
|---|---|
| 🆕 | `T_権限ロール` テーブル新設（11 列: ロールID/ロール名/説明/許可メニューJSON/研修編集スコープ/組込フラグ/マスターフラグ/表示順/作成日時/更新日時/削除フラグ）|
| 🆕 | `T_管理者Googleホワイトリスト` に `ロールID` 列追加（並行運用、`権限コード` 列保持） |
| 🆕 | `INITIAL_ROLE_DEFINITIONS` (5 ロール) を `scripts/menu-registry.mjs` で定義。MASTER は `isBuiltIn=true` で編集削除不可。他 4 ロールは編集可能カスタムロール。**allowedMenus は Phase 1-A LEGACY_ROLE_TO_MENUS と完全一致**（挙動完全維持）。決定論的 roleId (`role-master-builtin` 等) で再投入冪等 |
| 🆕 | `LEGACY_CODE_TO_INITIAL_ROLE_ID` mapping (whitelist 移行用) |
| 🆕 | `getRoleByIdCached_(ss, roleId)` — `T_権限ロール` キャッシュ参照 (TTL 300s, `admin_roles_v1`) |
| 🆕 | `seedInitialPermissionRoles_(ss)` — 空テーブル時のみ seed（冪等。既存編集を消さない）|
| 🆕 | `runRebuildSchemaForV246()` (admin top-level) — schema 適用 + ロール seed |
| 🆕 | `migrateToRoleBasedRBAC_v246_DRYRUN()` (admin top-level) — 変換プレビュー JSON |
| 🆕 | `migrateToRoleBasedRBAC_v246_APPLY()` (admin top-level) — ホワイトリストの`ロールID`列を実書込み（冪等。`権限コード`列は保持）|
| 🔧 | `checkAdminBySession_` に fallback chain: `ロールID` 列があれば `T_権限ロール` の値が authoritative、無ければ Phase 1-A LEGACY_ROLE_TO_MENUS にフォールバック。既存 `adminPermissionLevel` フィールドは後方互換維持 |
| 🔧 | `initializeSchema_` に `normalizeTableColumns_(T_権限ロール)` + `seedInitialPermissionRoles_` を組み込み |
| 🔧 | `clearAdminPermissionCaches_` に `admin_roles_v1` キー追加 |
| ✅ | snapshot test 9/9 PASS（INITIAL_ROLE_DEFINITIONS の roleId 一意性 + MASTER 組込 + legacy mapping + allowedMenus 完全一致 をすべて assert）|
| ✅ | typecheck / test:formula / test:search / test:kana 全 PASS。security:public/member/admin-boundary 全 PASS。build:gas / build:gas:member / build:gas:admin 全成功 |
| 🚀 | デプロイ: admin split のみ @180（外部 API 表面は不変。member/public 未 redeploy）|

### 操作者引継ぎ（次セッション）

admin デプロイ (@180) 完了後、Apps Script editor (admin split) を開き、以下を順に ▶ Run:

| Step | 関数 | 目的 | 安全性 |
|---|---|---|---|
| 1 | `runRebuildSchemaForV246` | T_権限ロール シート作成 + ロールID 列追加 + 5 ロール seed | 冪等・既存編集を保護 |
| 2 | `migrateToRoleBasedRBAC_v246_DRYRUN` | ホワイトリスト全行の権限コード→ロールID 変換プレビューを JSON で取得 | 書込なし |
| 3 | (preview を user と確認後) `migrateToRoleBasedRBAC_v246_APPLY` | ホワイトリストの ロールID 列を実書込み | 冪等。権限コード列は保持 |
| 4 | admin login テスト | 挙動完全維持（ロールID 経由 = legacy 経由が同じ結果）| - |
| Rollback | T_管理者Googleホワイトリスト の ロールID 列を全行クリア | fallback chain により legacy 経路に自動復帰 | - |

---

## v376.24 — 2026-05-28 🆕 メニュー単位 RBAC Phase 1-A（認可レイヤー内部置換）

`docs/246` で設計確定したメニュー単位カスタムロール RBAC の **Phase 1-A** を実装。旧 `ADMIN_ACTION_PERMISSIONS` による `action→role` 固定マップ判定を、新 `action→menu→role.allowedMenus` 評価へ内部置換した。**外部 API 表面・DB schema・whitelist 列構成は不変**で、Phase 1-B (T_権限ロール 新設) は次回着手予定。

| 種別 | 内容 |
|---|---|
| 🆕 | `scripts/menu-registry.mjs` 新設（v376.23 単一情報源パターン踏襲）。MENU_REGISTRY（14 メニュー）/ ACTION_TO_MENU / LEGACY_ROLE_TO_MENUS / LEGACY_ROLE_TRAINING_SCOPE / LEGACY_ROLE_DELTA_ACCEPTED を一元管理 |
| 🆕 | `scripts/test-menu-registry.mjs` 新設（snapshot test 7 件）。旧 ADMIN_ACTION_PERMISSIONS と新 menu-based 認可の **全 (action × role) 等価性を機械検証**。許容デルタ以外があれば FAIL でリリースを止める fail-safe。prerelease に統合 |
| 🆕 | `scripts/gas-boundary-utils.mjs::injectMenuRegistryPlaceholders` 追加。build:gas / build:gas:member / build:gas:admin から呼び、`gas-src/Code.full.gs` の placeholder ブロックを実体に置換 |
| 🔧 | `processApiRequest`: `requiredPerms.indexOf(permLevel) === -1` → `!isActionAllowedByMenu_(action, permLevel)`。等価性は snapshot test が保証。`ADMIN_ACTION_PERMISSIONS` は action 集合の whitelist 用途として残置（Phase 1-B で撤去予定） |
| 🔧 | `checkAdminBySession_`: 戻り値に `roleId`/`roleName`/`isMaster`/`allowedMenus`/`trainingEditScope` を追加。既存 `adminPermissionLevel` は後方互換維持（Phase 1-B で T_権限ロール の UUID へ移行） |
| 🔧 | `saveTraining_` (旧 11631-11637) の `adminPerm === 'TRAINING_REGISTRAR'` ハードコードを `trainingEditScope === 'OWN'` 判定へ置換 |
| ⚠️ | 既知デルタ 7 件（LEGACY_ROLE_DELTA_ACCEPTED に明示承認済）。すべて TR/TM が training-manage menu 経由で旧不許可 action にアクセス可能化する単一方向。MA は完全に挙動不変。逆方向（許可→deny）デルタは 0 件 |
| ✅ | 検証: typecheck / test:formula / test:search / test:kana / test:menu-registry 全 PASS。security:public/member/admin-boundary 全 PASS。build:gas / build:gas:member / build:gas:admin 全成功 |
| 🚀 | デプロイ: admin split のみ @179（外部 API 表面・DB schema・whitelist 列が不変のため member/public 未 redeploy） |

### 許容デルタ内訳
- TR: softDeleteTraining / restoreTraining / sendTrainingReminder / getAdminEmailAliases / sendTrainingMail / setupTrainingFileFolder（OWN scope で saveTraining_ は引き続き保護）
- TM: setupTrainingFileFolder（冪等な初回フォルダ設定）
- GENERAL: fetchAllData（GENERAL は `checkAdminBySession_` で弾かれるため到達不能）

### 次回（Phase 1-B）作業
- `T_権限ロール` 新設 + whitelist にロールID列追加（並行運用、権限コード列保持）
- 初期4ロール（ADMIN / TRAINING_MANAGER / TRAINING_REGISTRAR / GENERAL = 編集可能なカスタムロール）+ MASTER built-in
- operator 移行スクリプト `migrateToRoleBasedRBAC_v246_DRYRUN` / `_APPLY`

---

## v376.23 — 2026-05-28 🔧 二重管理の解消⑥: action 許可リストの単一情報源化（A-3）

各境界の `processApiRequest` action 許可リストが build×3（`build-{admin,member,gas}.mjs` の `removeDisallowedActionHandlers` 引数）と audit×3（`audit-{admin,member,public}-boundary.mjs` の expected リスト）の**計6箇所に手書き分散**していたのを、`gas-boundary-utils.mjs` の4定数（`PUBLIC_/MEMBER_/ADMIN_ALLOWED_ACTIONS_LIST` + `ADMIN_LOGIN_ACTIONS_LIST`）に単一情報源化。**生成物に変更なし・再デプロイ不要**。

| 種別 | 内容 |
|---|---|
| 🔧 | build と audit が同一の共有定数を import。新 action 追加/削除は 1 箇所のみ更新すればよくなった（従来は build と audit の両方更新が必要で、漏れると build 成功・audit 失敗のズレが発生していた） |
| 🐛 | `build-admin-gas.mjs` の許可リストに、v373.7 等で撤去済みの action（`getMembersForRoster` / `generateRosterZip` / `validateTemplateSpreadsheet` / `initRosterExport` / `processRosterChunk` / `finalizeRosterExport` / `cleanupRosterExport` / v316 `getRosterTemplateList` 群）が **stale entry として残存**していた（`removeDisallowedActionHandlers` は存在しない action を無視するため no-op で見逃されていた）。共有定数化（実態 = audit リストを正本）により自然に解消 |
| ✅ | 検証: リファクタ後に 3 split をリビルドし `backend/gas-admin/gas-member の Code.gs` が md5 完全一致（build 挙動不変）+ prerelease 全 audit PASS を確認 |

※ frontend `api.ts` 呼び出し ↔ backend `processApiRequest` dispatch の codegen 連動は将来課題として見送り（軽量版スコープ）。

---

## v376.22 — 2026-05-27 🔧 二重管理の解消⑤: 未使用 backend endpoint の削除（B-1 backend）

v376.19 で frontend から削除した未使用 6 API の **backend 側 endpoint と全許可リストを削除**。3 境界（admin/member/public）の dispatch・権限/許可マップ・build/audit スクリプトから一掃。

| 削除 action | 削除箇所 |
|---|---|
| `createMember` / `updateMembersBatch` / `getMemberTrainingHistory` | dispatch + `ADMIN_ACTION_PERMISSIONS` + build-admin/audit-admin 許可リスト |
| `getFileBytes` | dispatch + `PUBLIC_ALLOWED_ACTIONS` + `MEMBER_ALLOWED_ACTIONS` + `ADMIN_ACTION_PERMISSIONS` + build/audit ×3（admin/member/public 全境界） |
| `adminLoginWithData` | dispatch + `ADMIN_LOGIN_ACTIONS` + build-admin/audit-admin |
| `memberLoginWithData` | dispatch + `MEMBER_ALLOWED_ACTIONS` + `LOGIN_ONLY_MEMBER_ACTIONS` + build-member/audit-member |

| 種別 | 内容 |
|---|---|
| 🔧 | 上記に加え、v376.17 で消し忘れていた `sendTrainingMailSegmented` / `getTrainingMailSendLogs` の `ADMIN_ACTION_PERMISSIONS` dead エントリも除去（audit は perm マップを検証しないため見逃されていた） |
| 📝 | 関数本体 `createMember_` / `updateMembersBatch_` / `getFileBytes_` / `getMemberTrainingHistory_` は build pruner が全 3 生成物から自動除去（検証: 生成 Code.gs 内 0 件）。source には残置（切り離された機能実装であり再利用余地あり・二重管理ではない）。完全な source 撤去は軽微なフォローアップ |
| ✅ | 3 split ビルド + prerelease 全通過。3 境界の audit が dispatch==許可リスト整合を検証 |

**挙動変更**: 上記 endpoint は呼ぶと unauthorized/未定義になる（いずれも呼び出し元ゼロを検証済のため実害なし）。**デプロイは全 3 split 必要**（A-2/A-1 の挙動不変分も同梱）。本コミット時点では未デプロイ。

---

## v376.21 — 2026-05-27 🛡 二重管理の解消④: 申込者解決のガードレール（敢えて統合しない判断）

監査で「申込者解決ロジックの重複」とされた箇所を精読した結果、**真の重複ではなく異なる 2 モデルの併存**と判明したため、機械的統合は行わず誤用防止のガードレールを追加した（方針: 無理にまとめない）。

| モデル | 関数 | 用途 |
|---|---|---|
| canonical（v360・STAFF 独立 type） | `getCanonicalApplicantRef_` | 送信先メール・名簿表示・本人解決 |
| legacy（MEMBER + 別途 職員ID） | `getApplicationApplicantType_` / `getApplicationApplicantId_` / `getMemberIdFromApplication_` | 整合性検証 `getTrainingApplicationIntegrityIssues_`・会員申込フィルタ |

| 種別 | 内容 |
|---|---|
| 🛡 | legacy 3 関数と `getCanonicalApplicantRef_` に使い分けの警告コメントを追加。「送信先・名簿・本人解決は必ず canonical を使う／legacy を使うと STAFF 申込が会員誤解決され事業所代表メールへ誤送信（v376.12 で実際に発生）」を明文化 |
| 📝 | 整合性検証は MEMBER/EXTERNAL の 2 分岐のみで legacy モデル前提に組まれており、canonical への機械的置換は検証ロジックを壊す（＝申込有効性ゲートに影響）と確認。よって統合せず温存 |

**コメントのみ・挙動不変**（非コメントのコード行変更ゼロを git diff で確認）。デプロイは A-2 と同様、次の backend 機能変更時に同梱。prerelease 全通過。

---

## v376.20 — 2026-05-27 🔧 二重管理の解消③: シート読取ヘルパーを一本化

backend `gas-src/Code.full.gs` で機能同一だった 2 つのシート読取ヘルパーを統合。`getSheetData_(sheet)`（ヘッダ行→オブジェクト配列化、19 箇所で使用）を、同一実装の `getRowsAsObjectsFromSheet_(sheet)` に置換し `getSheetData_` を削除。

| 種別 | 内容 |
|---|---|
| 🔧 | `getSheetData_` の 18 呼び出しを `getRowsAsObjectsFromSheet_` に置換、定義を削除。両者は「ヘッダ行を key に値をオブジェクト化」する同一ロジック（A1 起点の DB シート前提で出力完全同値）と検証済み |
| 📝 | 全呼び出しが sheet オブジェクトを渡している（ss 誤用なし）ことを事前確認。差分が純粋なリネーム + 定義削除のみであることを git diff で確認 |

**挙動不変**（等価ヘルパーへの置換）。3 split すべての `Code.gs` が変化するが runtime 動作は同一のため、**単独再デプロイは行わず次の backend 機能変更（A-1: 申込者解決の統合）のデプロイに同梱**。typecheck + prerelease 全通過。

---

## v376.19 — 2026-05-27 🔧 二重管理の解消②: 未使用 frontend API メソッド削除

全機能の二重管理監査の是正 第2弾。frontend `api.ts` で**どのコンポーネントからも呼ばれていない 6 メソッド**を削除（grep で呼び出しゼロを検証済）。**機能変更なし・本番再デプロイ不要**（dead code 除去のみ。bundle が縮小するだけで挙動不変）。

| 削除した API メソッド | 備考 |
|---|---|
| `adminLoginWithData` / `memberLoginWithData` | v150 のログイン+ポータル統合 API。`checkAdminBySession` / `memberLogin` に置換済の廃止予定コード |
| `createMember` | 会員作成。入会は公開申込 + 承認フロー（`createMemberApplicationDirect_`）が正路 |
| `updateMembersBatch` | 一括更新。未配線 |
| `getMemberTrainingHistory` | 研修履歴取得。未配線。孤立した型 `TrainingHistoryEntry` も撤去 |
| `getFileBytes` | v357 PDF lightbox 用 bytes proxy。現状は `getFileThumbnail` で代替 |

検証: 各メソッドは backend dispatch handler 以外に内部呼び出しが無いことも確認済（完全デッド）。ただし backend endpoint・権限/許可リストの削除は、同じ action レジストリを触る A-3（action 名の単一情報源化）でまとめて実施するため**本リリースでは frontend のみ**。typecheck + prerelease 全通過。

---

## v376.18 — 2026-05-27 🔧 二重管理の解消①: admin build keep-list の単一情報源化

全機能の二重管理監査（メール送信以外）の是正 第1弾。**生成物に変更はなく本番再デプロイ不要**（build / audit ツールのみの整理。`gas/admin/Code.gs` はバイト単位で不変を確認）。

| 種別 | 内容 |
|---|---|
| 🔧 | admin build が残す top-level callable 関数の許可リスト（22項目）が、`build-admin-gas.mjs` の pruning seed・assertAllowed・`audit-admin-boundary.mjs` の3箇所に同一配列で手書きされていた。`gas-boundary-utils.mjs` の `ADMIN_TOP_LEVEL_FUNCTIONS` に単一情報源化 |
| 🔧 | 強制削除する forbidden top-level 関数リスト（6項目）の build / audit 2コピーを `ADMIN_FORBIDDEN_TOP_LEVEL_FUNCTIONS` に単一情報源化 |
| 📝 | 検証: リファクタ後に `build:gas:admin` を再実行し `gas/admin/Code.gs` の md5 が変化しないこと（挙動不変）+ prerelease 全通過を確認 |

※ `build-admin-gas.mjs` が `gas-boundary-utils.mjs` の utility 関数群（`collectFunctionDeclarations` 等）の独自コピーを持ち実装が乖離している件は別レイヤの重複として残課題（挙動変化リスクがあるため本リリースでは非対象）。

---

## v376.17 — 2026-05-27 🔧 メール送信の整理（差し込み一本化 + 未使用 segment 削除）

メール送信機能の棚卸し。送信の最下層は従来どおり `deliverMail_` → `sendEmailWithValidatedFrom_` → `MailApp/GmailApp` に完全集約されており（全送信箇所が `deliverMail_` 経由）、ここは変更していない。1 段上の重複のみ整理した。

| 種別 | 内容 |
|---|---|
| 🔧 | 差し込みタグ置換（`{{氏名}}` `{{事業所名}}` `{{会員番号}}` 等）を、`sendTrainingMail_` / `sendBulkMemberMail_` のインライン `.replace(/\{\{…\}\}/g, …)` チェーンから、汎用の `renderBizEmailTemplate_(template, vars)` に一本化。タグ追加時の漏れ・不整合を防止。`null/undefined` は空文字に正規化（従来の `"undefined"` 混入も解消） |
| 🔧 | frontend から一切呼ばれていなかった研修メール segment 送信を削除し、研修メール送信を現役の `sendTrainingMail_` に一本化。削除対象: backend `sendTrainingMailSegmented_` / `getTrainingMailSendLogs_` と action handler、`api.ts` の同名メソッド、`types.ts` の `TrainingMailSegment` / `TrainingMailSegmentedPayload` / `TrainingMailLogHeader` / `TrainingMailLogDetail`、`build-admin-gas.mjs` / `audit-admin-boundary.mjs` の許可リスト |
| 📝 | 「まとめない」判断: 宛先構築ロジック（研修=3-FK XOR 申込者解決 / 一括=年度別メーリングリスト）と添付方式（applyId 別 Drive / 姓名部分一致の自動添付）は本質的に異なるため、各送信関数で個別維持（無理な共通化はしない） |

機能変更は admin のみ。デプロイ: admin `@177`（member/public はコメント/bundle 再生成差分のみで未 redeploy、次回機能リリース時に同期）。

---

## v376.16 — 2026-05-27 🐛 研修管理 新規入力を画面表示中は保持

| 種別 | 内容 |
|---|---|
| 🐛 | 新規研修登録の入力中に一覧から既存研修を選ぶと、共有していた `form` state が上書きされ入力内容が消えていた問題を解消 |
| 🔧 | 新規入力を `pendingNewForm` へ退避（`loadTraining`）し、既存研修の詳細モーダルを閉じると右ペインへ復元（`closeDetail`）。研修管理画面を開いている間は新規入力を保持する |
| 🔧 | 既存研修の削除・復元後も `closeDetail` 経由で退避中の新規入力を保持（従来は `startNew` で破棄していた） |
| 🐛 | v376.15 で混入した「新規作成成功後に右ペインが空白化」を解消。新規作成（`isNew`）成功時は空フォームへ戻し `isNew` を維持して連続登録に対応。既存更新（モーダル）はモーダルを開いたまま最新値を反映 |

対象: `src/components/TrainingManagement.tsx`。admin shell のみ。デプロイ: admin `@176`（member/public は据え置き）。

---

## v376.15 — 2026-05-27 🔧 研修管理 右ペインを新規登録専用エリアに固定

| 種別 | 内容 |
|---|---|
| 🐛 | 研修を選択 → 詳細モーダルを閉じると、右ペインがプレースホルダー（「左の一覧から選択するか…」）に戻り、一覧は選択ハイライト維持という宙ぶらりんなデッド状態になっていた問題を解消 |
| 🔧 | v376.11 で既存研修の編集・名簿・メールがすべてモーダルへ移行済のため、右ペイン（`lg:col-span-2`）を「新規登録専用エリア」として固定。プレースホルダー／空表示を含む3状態を、新規登録フォームのみの1状態に簡素化 |
| 🔧 | 既存研修の詳細モーダルを閉じると `startNew()` を呼び、右ペインを新規登録フォームへリセット＆一覧選択を解除（`onClose=startNew`） |
| 🔧 | `isNew` ブランチ内に残っていた到達不能な `panelView === 'roster'/'mail'` 分岐（デッドコード）を除去 |

対象: `src/components/TrainingManagement.tsx`。admin shell のみ。デプロイ: admin `@175`（member/public は据え置き）。

---

## v376.14.2 — 2026-05-27 ✅ ドライランテスト 実施完了 + cleanup 強化

| 種別 | 内容 |
|---|---|
| 🎉 | 研修管理 全機能ドライランテストを本番 DB で実施 → **15/15 PASS**（v376.12 の STAFF メール個人解決の回帰確認を含む）。テストデータは全 run 分を物理削除済（残骸ゼロ） |
| 🔧 | `cleanupDryRunTrainingManagement` を「manifest 参照のみ」から「manifest + DRYRUN_ プレフィックス全研修 sweep」に強化。cleanup 前に再実行して manifest が上書きされても孤児データを確実に回収・物理削除（冪等） |

デプロイ: admin `@174`。

---

## v376.14.1 — 2026-05-27 🐛 ドライランテスト関数の自己バグ修正

| 種別 | 内容 |
|---|---|
| 🐛 | 初回 run で 3 件 FAIL（いずれもテスト構築側の不備、本番コードは正常）。STAFF 申込挿入を `申込者区分コード='STAFF'`（`isTrainingApplicationRowValid_` が弾く）から本番同型（`区分コード='MEMBER'` + `申込者ID=親会員ID` + `職員ID` 併記、canonical ref が職員ID優先で STAFF 解決）に修正 |
| 🐛 | `saveAttendanceBatch_` の payload を生配列から `{ entries: [...] }` 形式に修正 |
| 📝 | この FAIL は `isTrainingApplicationRowValid_`（integrity 検証）が不正な区分コードを正しく除外している証拠でもあった |

デプロイ: admin `@173`。

---

## v376.14 — 2026-05-27 ✅ 研修管理 全機能ドライランテスト基盤

| 種別 | 内容 |
|---|---|
| ✅ | `dryRunTrainingManagement()` を追加 — 15 項目の機能網羅テスト（CREATE/READ/UPDATE/ゲスト追加/STAFF申込/名簿取得/メール対象解決(v376.12回帰)/出欠単・一括/集計/メモ/キャンセル/soft delete/一覧除外/復元） |
| ✅ | `cleanupDryRunTrainingManagement()` を追加 — manifest 記録した training / 申込 / 外部申込者を物理削除（行番号降順 deleteRow） |
| 📝 | メール送信は実行せず `getTrainingApplicants_` の対象解決のみ検証（誤送信なし）。2026 CRUD/integration test best practice 準拠 |
| 🔒 | build keep-list 3 箇所 + audit-admin-boundary allowlist に登録 |

デプロイ: admin `@172`。テスト関数のみ追加・既存挙動への影響なし。

---

## v376.13 — 2026-05-26 🐛 メール送信のチェックボックス再選択バグ修正

| 種別 | 内容 |
|---|---|
| 🐛 | TrainingMailSender の `toggleSelect` で「全員選択モード（excludedIds による除外管理）」のとき、一度 click で除外した行を再 click しても除外解除されないバグを修正 |
| 🔧 | null-branch のロジックを `next.add(applyId)` から `has(applyId) ? delete : add` (toggle) に変更。状態遷移が対称になり、check ↔ uncheck が両方向で動作 |

デプロイ: admin `@171`。UI バグのみ・API/DB 影響なし。

---

## v376.12 — 2026-05-26 🐛 メール送信: 事業所職員の誤送信修正

| 種別 | 内容 |
|---|---|
| 🐛 | **重要バグ修正**: 事業所職員 (STAFF) の研修申込が、メール送信画面で事業所代表 (MEMBER) 扱いされ、送信先が事業所代表メール宛になっていた問題を解消 |
| 🐛 | 原因: `getTrainingApplicants_` / `sendTrainingMail_` 両方が legacy `getApplicationApplicantType_` を使用していた。これは申込レコードに `職員ID` と `会員ID` が両方ある場合、`会員ID` で MEMBER 判定してしまう仕様。`getTrainingRosterDetail_` (名簿) は v360 modern `getCanonicalApplicantRef_` (3-FK XOR) を使うため正常動作していた |
| 🔧 | `getTrainingApplicants_` と `sendTrainingMail_` を `getCanonicalApplicantRef_` ベースに統一し、`T_事業所職員` を staffMap として参照。STAFF は職員姓名・職員個人メール・親事業所の勤務先名で解決 |
| 🎨 | フロント `TrainingApplicantRow.applicantType` を `'MEMBER' \| 'STAFF' \| 'EXTERNAL'` の 3 値に拡張。送信画面の区分バッジに「事業所職員」(violet) を追加 |

デプロイ: admin `@170`。public/member は無変更（fetchAllData 系は別経路）。仕様変更ゼロ・DB 不変・セキュリティ影響なし（職員メールは既に admin が名簿で閲覧可能だった情報）。

---

## v376.11 — 2026-05-26 🎨 研修詳細を大画面モーダルへ

| 種別 | 内容 |
|---|---|
| 🎨 | 既存研修選択時を画面右パネルの圧迫表示から **大画面モーダル** へ移行（モバイル full-screen / デスクトップ 95vw × 95vh max-w-1600px） |
| 🎨 | `TrainingDetailModal.tsx` を新規作成 — ESC / backdrop / focus restore / body scroll lock / sticky header + tabs / iOS safe-area 対応 |
| 🎨 | 編集 form を `renderEditForm()` 関数に extract — inline (新規登録) とモーダル (既存編集) で同じ JSX を共有 |
| 🎨 | inline 右パネルは新規登録時のみ表示。既存選択時はプレースホルダ「← 研修一覧から選択してください」 |
| 📝 | グローバル best practice 準拠 — UXPin 2026 modal a11y guide / WCAG 2.2 / Material UI responsive pattern |

デプロイ: admin `@169`。仕様変更ゼロ・API 不変・新規登録機能は従来通り。

---

## v376.10 — 2026-05-26 🎨 研修管理 UX 微調整

| 種別 | 内容 |
|---|---|
| 🎨 | 研修選択時の既定ビューを `form` (編集) → `roster` (名簿・出欠) に変更。業務頻度の最も高い操作にデフォルト位置を寄せる |
| 🎨 | パネル上部のタブボタン順を **名簿/出欠 → メール送信 → 編集 → 削除** に並べ替え。「日々の運用」操作を左に集めて到達性向上 |

デプロイ: admin `@168`。仕様変更ゼロ・API 不変・DB 影響なし。

---

## v376.9 — 2026-05-26 ⚡ パフォーマンス監査 + 最適化

| 種別 | 内容 |
|---|---|
| ⚡ | **backend** `approveAdminChangeRequest_` の staffRemove ループ内の `getRowsAsObjects_(ss, 'T_事業所職員')` をループ外にホイスト。N 名削除時の sheet 読込回数を N → 1 回に削減 |
| ⚡ | **frontend** 3 箇所の `loadAppData({includeAdminSettings: true})` を `false` に変更。SystemSettings 不変なシナリオで `getSystemSettings` の API 往復を削減（会員詳細を開く時 / 職員一括保存 成功時・エラー時） |
| 📝 | グローバル best practice 準拠 — Google Apps Script: batch read 推奨 + 「Reduce calls to other services」、React 19: useEffect 不要再実行 / dependency 安定化（React Compiler 自動メモ化への準備） |
| 📝 | 採用しなかった項目（記録のみ）: `getMemberPortalData_` の per-user cache 化（invalidation 複雑度 ↑）/ `addPublicStaffMember_` 内 sheet 読込（API 変更必要） |

デプロイ: member `@107` / admin `@167`。public は backend/Code.gs 無変更のため `@348` 維持。仕様変更ゼロ・DB 操作なし・セキュリティ影響なし。

---

## v376.8 (sync) — 2026-05-26 🔧 ドキュメント・成果物整合性

| 種別 | 内容 |
|---|---|
| 🔧 | v376.1〜v376.8 の累積 build 成果物（backend / gas/member / gas/admin Code.gs + index.html）を git に同期。runtime と source の差分ゼロに |
| 🔧 | member split `@106` 再デプロイ（`mapTrainingRowsForApi_` の isDeleted field 追加 + `clearTrainingManagementCache_` 二重 key 対応を反映。member 側は機能影響なし、source-runtime sync 目的） |
| 🔒 | `scripts/audit-admin-boundary.mjs` allow-list に v376 系で追加した admin editor 関数 5 つ + dispatcher action 2 つを登録（prerelease gate PASS 復旧） |
| 📝 | HANDOVER.md / docs/00_DOC_INDEX.md / docs/09_DEPLOYMENT_POLICY.md / release-notes 全てを最新 deployment と整合 |
| 📝 | feedback memory 3 件追加: admin editor keep-list / editor ▶ 引数なし制約 / async busy 解除位置 |

デプロイ後の固定 deployment: public `@348` x2 / member `@106` / admin `@166`。

---

## v376.8 — 2026-05-26 🎨 研修管理 — 名簿・メール送信 UX 改修

| 種別 | 内容 |
|---|---|
| 🎨 | **TrainingRoster**: 二重タイトル削除（タブで明示済）/「研修一覧へ戻る」リンク廃止 / ボタン 3 階層化（primary=申込追加、neutral=CSV・更新、destructive=取消）/ 申込者追加を drop-down 化（会員 / ゲスト） |
| 🎨 | **TrainingRoster**: フィルターを segmented control に（区分・出欠の各 4〜6 個ボタン）。検索 + 件数を別段に分離 |
| 🔒 | **TrainingRoster**: 「表示全員 出席」「表示全員 欠席」一括ボタンを廃止 → **選択ベース**（checkbox で行選択 → selection toolbar で実行）に変更。誤操作リスク低減 |
| 🎨 | **TrainingRoster**: テーブルに checkbox 列追加 + 行 hover ハイライト + ステータス色分け |
| 🎨 | **TrainingMailSender**: 「研修メール送信」見出し削除（タブで明示）/ 全員選択・解除ボタンを segmented 同等スタイルへ |
| 🎨 | **TrainingManagement**: パネル見出しを `編集: タイトル` / `名簿: タイトル` / `メール送信: タイトル` から **タイトル単体** に集約 |
| 📝 | グローバル enterprise UX 準拠 — Salesforce Lightning + Mobbin segmented control + NN/g filter pattern + WCAG 2.2 AA |

デプロイ: admin `@166`。API 変更なし・公開ポータル影響なし。

---

## v376.7 — 2026-05-26 🆕 研修管理 — フィルター + soft delete

| 種別 | 内容 |
|---|---|
| 🆕 | **研修削除機能**を追加（soft delete = `削除フラグ=true`、物理削除しない）。申込実績がある場合は警告ダイアログ。削除済表示時は「復元」ボタンで取消可能 |
| 🆕 | **研修一覧フィルター** UI 追加 — 年度（既定: 今年度・日本式 4 月開始）/ 状態（申込受付中・締切済・削除済）/ キーワード検索（研修名+主催者） |
| 🆕 | 件数表示「フィルター後 N / 全 M 件」で透明性確保 |
| 🔧 | `getTrainingManagementData_` で削除済も含めて返却し `isDeleted` フラグ付与（admin 側のみ。公開ポータルは `fetchAllData_` 別パスで filter 維持・**影響ゼロ**） |
| 🔧 | バックエンドに `softDeleteTraining_` / `restoreTraining_` 追加。権限 `MASTER/ADMIN/TRAINING_MANAGER` のみ（`TRAINING_REGISTRAR` は登録専用） |
| 📝 | DB スキーマ変更ゼロ（`削除フラグ` 既存列を利用）。グローバル UX best practice 準拠（Salesforce/Tableau 既定 = current fiscal year、NN/g filter 7 項目以内、progressive disclosure） |

デプロイ: admin `@165`。

---

## v376.6 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🐛 | 承認/却下 API 完了→`load()` 再取得開始の隙間で「承認してDBに反映」「却下」ボタンが再押下できてしまうバグ修正。`setBusy(null)` を `finally` ブロックのみに戻し、load() 完了（カード filter で消失）まで一貫して disabled を維持 |
| 🔧 | v376.5 で導入した `setBusy(null)` の前倒し配置は二重押下リスクを生んだため、安全側に振り戻し。ボタン文字列「処理中…」は load() 完了まで残るが、これは正しい挙動（処理は実際に継続中） |

デプロイ: admin `@164`。

---

## v376.5 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🐛 | 変更申請の承認/却下後に「処理中…」ボタン文字列が滞留するバグ修正。`setBusy(null)` を `await load()` の前に移動 |
| 🐛 | 承認成功時に空オブジェクト `{}` が緑色のコードブロックで冗長表示されるバグ修正。`actionResult` state + JSON.stringify プリレンダー削除（既に alert で完了通知済） |
| 🔧 | 不要 API 往復洗い出し: 承認後の `await load()` は他 admin との並行整合性のため残置。`loading` / `actionError` / `expanded` state は必須機能のため残置。最終判断: メイン 2 点のみ修正 |

デプロイ: admin `@163`。影響範囲は `src/components/ChangeRequestConsole.tsx` のみ（バックエンド・データロジック影響ゼロ）。

---

## v376.4 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🧹 | テストデータ棚卸し・soft delete 機能を追加（`deleteTestDataPreview_LOG` / `deleteTestData_APPLY`）。条件: T_認証アカウント `demo-*` / T_会員 `DEMO-*` / 上記に紐づく職員 / T_外部申込者 氏名・フリガナに「テスト/ガイブ/セイゴウカクニン」を含む |
| 🎉 | 本番 DB のテストデータ削除実施 — T_外部申込者 3 件（`テスト タロウ` / `ガイブ テストイチロウ` / `セイゴウカクニン タロウ`）を soft delete。demo-* / DEMO-* は検出ゼロ（過去に cleanup 済 or 未投入）|

デプロイ: admin `@162`。

---

## v376.3 — 2026-05-26

| 種別 | 内容 |
|---|---|
| 🔧 | `inspectDryRunManifest_LOG` を追加（`previewDryRunApplicationCleanup` が return のみで Logger.log しない仕様への補助）。実行結果: manifest 未保存を確認（過去 dryRun テストデータの残骸ゼロ）|

デプロイ: admin `@161`。

---

## v376.2 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🎉 | **migration 本実行完了** — T_会員 180 rows / T_事業所職員 173 rows / T_外部申込者 3 rows、計 356 rows / 804 cells を全角カタカナへ変換。エラーゼロ。dryRun と件数完全一致 |
| 🔧 | `backfillKanaToFullwidth_APPLY()` ラッパー追加（editor ▶ ボタンが引数なしで実行する制約を回避し、1-click で本実行を可能化） |

デプロイ: admin `@160`。

---

## v376.1 — 2026-05-25

| 種別 | 内容 |
|---|---|
| 🐛 | `backfillKanaToFullwidth` が build pruner に削除され admin editor の関数選択に出ないバグを修正。`scripts/build-admin-gas.mjs` の keep-list に追加 |

デプロイ: admin `@159`。

---

## v376 — 2026-05-23

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **フリガナ（セイ/メイ/フリガナ）の保存形式を全角カタカナに統一**。ひらがな・半角カナ・全角カタカナの混在入力を受け付け、保存時に NFKC + ひらがな→カタカナ + 全角スペース正規化を適用。中点 `・` と長音 `ー` のみ追加許容、それ以外（漢字・英数字）は throw | `src/utils/kanaNormalize.ts` |
| 🆕 | `normalizeKana()` / `normalizeAndValidateKana_()` を frontend (TS) + backend (GAS) 両方に実装（同一ロジック・冪等性確認済） | — |
| 🆕 | `backfillKanaToFullwidth({dryRun})` 移行関数を追加（T_会員 / T_事業所職員 / T_外部申込者 対象。dryRun=true で件数確認 → admin 承認後 dryRun=false で本実行） | — |
| 🔧 | 旧 `toHalfWidthKana` (frontend) を `normalizeKana` 呼び出しに置換 — MemberForm / MemberDetailAdmin / StaffDetailAdmin / MemberApplicationForm / MemberUpdateForm / TrainingRoster | — |
| 🔧 | バックエンド書込関数（saveMemberCore_ / overwritePublicApplicationMemberFields_ / overwritePublicApplicationStaffFields_ / submitPublicChangeRequest_ / normalizeStaffNameFields_）で正規化 + validation を信頼境界として強制 | — |
| 🔧 | 旧 `isHalfWidthKana` バリデーション（v131 系）を削除。ポリシー反転（半角強制 → 全角強制） | `validateMemberPayload_` |
| 📝 | 19 ケースの Vitest 単体テスト追加 (`scripts/test-kana-normalize.mts`)。`npm run prerelease` gate に組み込み | — |

実装方針: T_変更申請 pending レコードは migration 対象外（承認時 `approveAdminChangeRequest_` → 各 save 関数で正規化されるため）。

デプロイ予定: 3 split を build → push → redeploy → migration dryRun → 確認 → 本実行。

---

## v374.1 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 🆕 | **公式LINE投稿依頼コンソール**を管理者ポータルに新規追加。3 状態ライフサイクル（DRAFT → REQUESTED → POSTED）+ Drive 添付（画像/PDF・10MB）+ Polymorphic association（GENERAL / TRAINING、将来拡張可）+ LINE 風プレビュー | `docs/251_DESIGN_LINE_POST_REQUEST_2026-05-21.md` |
| 🆕 | T_LINE投稿依頼テーブル / 2 SystemSettings (`LINE_POST_ASSETS_FOLDER_ID` / `LINE_POST_NOTIFY_EMAIL`) / 6 admin API actions | `docs/03_DATA_MODEL.md` §4 |
| 🐛 | build pruner が関数内 `if (action === ...)` を dispatcher case と誤認する問題を回避するため、handler のパラメータ名を `action` → `transAction` に変更 | — |
| 🐛 | build parser が regex literal `/.../` を line comment と誤認する問題を回避するため、handler 内 regex を String 操作に置換 | — |

デプロイ: integrated/public `@346` x2 / member `@103` / admin `@155`

---

## v374 — 2026-05-21

| 種別 | 内容 | 参照 |
|---|---|---|
| 📝 | WCAG 2.2 AA 自動アクセシビリティテスト基盤導入（`@axe-core/playwright`、`scripts/test-a11y.mjs`、CI gate 対応） | `docs/244` |
| 📝 | 新 UI 追加時の必須回帰チェックリスト整備 | `docs/245` |
| 📝 | レスポンシブテストを `npm run test:responsive` / `:admin` / `:member` へ昇格 | — |
| 🐛 | 入会 hero badge `bg-emerald-600` (4.46:1, AA 未達) → `bg-emerald-700` (5.7:1, AA 準拠) | `src/public-portal/App.tsx` |
| 🐛 | `responsive-test.mjs` の sr-only skip link false-positive 解消 → 21/21 セル合格 | — |
| 🎉 | **WCAG 2.2 AA 自動検出範囲で違反ゼロ達成**（本番 a11y scan で critical/serious/moderate/minor=0 確認） | — |

デプロイ: integrated/public `@344→@345` x2 (legacy + 正式)、member `@102` 維持、admin `@153` 維持。

---

## v373.7 — 2026-05-20 🎉 Sprint S5 完了

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 2 弾: GAS バックエンドの旧 RosterExport コードを完全削除（-1,599 行 + 自動 pruning で 315 関数削減） |
| 🔧 | ALLOWED_ACTIONS マップから 10 action 削除、dispatcher case 群削除 |
| 🔧 | `initializeSchema_` の旧キー seed 撤去、`SystemSettings.rosterTemplateSsId` pass-through 撤去 |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/archive/release_history/243_RELEASE_STATE_v373.7_ROSTER_S5_GAS_CLEANUP_2026-05-20.md`
デプロイ: integrated/public `@344` x2 / member `@102` / admin `@153`

---

## v373.6 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 Sprint S5 第 1 弾: 旧 RosterExport の front-end を完全削除（4 component / 137 行の UI / 10 ApiClient メソッド / 5 旧型定義、計 -2,447 行） |
| 🔧 | `T_システム設定` の旧キー行は data 保全のため残置 |

詳細: `docs/archive/release_history/242_RELEASE_STATE_v373.6_ROSTER_S5_FRONTEND_CLEANUP_2026-05-20.md`

---

## v373.5 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | パスワード pepper を Google Cloud Secret Manager 連携化（CacheService → SM → Script Properties の 3 階層 fail-soft） |
| 🔒 | 3 split に `cloud-platform` OAuth scope 追加 |
| 🔒 | `healthCheckPasswordPepper` admin top-level 関数追加（fingerprint 比較で値の一致性検証） |
| 📝 | 次段階 Cloud Run Argon2id 外部 KDF の完全設計書 + 実装雛形（`cloud-run/password-hash-service/`） |

operator 対応: GCP 利用判断時に `docs/239` 30 分手順を実施。
詳細: `docs/archive/release_history/241_RELEASE_STATE_v373.5_SECRET_MANAGER_2026-05-20.md` / `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`

---

## v373.4 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 名簿出力 行フィルタ no-code UI 化（演算子記号 `=, >, <, ≥, ≤` を日本語ラベル化、enum/boolean 演算子廃止、年度フィールド除外、否定全廃） |

詳細: `docs/archive/release_history/238_RELEASE_STATE_v373.4_ROSTER_ROW_FILTER_NOCODE_2026-05-20.md`

---

## v373.3 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🔧 | 条件付き書式 UX 微調整（year picker / equals 削除 / 否定削除 / filterYear 自動 prefill） |

詳細: `docs/archive/release_history/237_RELEASE_STATE_v373.3_ROSTER_STYLE_RULE_SIMPLIFY_2026-05-20.md`

---

## v373.2 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🐛 | PDF 出力で全件が出ない問題を React Portal + `display: none` パターンで修正（`position: absolute` を撤去・MDN/react-to-print 既知問題対応） |
| 🔧 | 条件付き書式 UI を Airtable 風（フィールド + 演算子 + 値 + プリセット）に刷新、式入力を完全廃止 |
| 🔧 | 計算列を 8 プリセット選択化、textarea 廃止 |
| 🔧 | drag handle 改善（左端に全高 grip カラム、`cursor: grab/grabbing`） |

詳細: `docs/archive/release_history/236_RELEASE_STATE_v373.2_ROSTER_UX_OVERHAUL_2026-05-20.md`

---

## v373.1 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 PDF 出力（`window.print()` + 動的 `@page` CSS、用紙 A4/A3/B5・縦横・フォントサイズ） |
| 🐛 | v373.2 で PDF Portal 化に修正 |

詳細: `docs/archive/release_history/235_RELEASE_STATE_v373.1_ROSTER_S4_2026-05-20.md`

---

## v373 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 計算式 + 条件付き書式（jsep + 自前 AST walker、eval/Function/MemberExpression 全 reject、関数 allowlist 16 種、AST 深さ 32 上限、攻撃シナリオ含む 33 unit tests） |
| 🔒 | Web 検索 2026-05-20 ベースで `expr-eval`(RCE 2026) / `jse-eval`(no sandbox) を不採用、`jsep` のみ採用 |

詳細: `docs/archive/release_history/234_RELEASE_STATE_v373_ROSTER_S3_2026-05-20.md`

---

## v372.9 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 出力列を `@dnd-kit` で drag-drop 並び替え |

デプロイ: admin split `@145`。詳細: `docs/archive/release_history/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`

---

## v372.8 — 2026-05-20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 列幅 (60-320px) + 日付/数値書式設定 |

詳細: `docs/archive/release_history/231_RELEASE_STATE_v372.8_ROSTER_S2_FORMAT_WIDTH_2026-05-20.md`

---

## v372.7 — 2026-05-20 🔒

| 種別 | 内容 |
|---|---|
| 🔒 | 第三者評価 2026-05-20 指摘 #1 対応: `getFileThumbnail_()` / `getFileBytes_()` の Drive fileId proxy を `T_研修.案内状URL` / `案内状サムネイルURL` 登録 fileId のみに制限（fail-closed） |

詳細: `docs/230_SECURITY_REMEDIATION_DRIVE_PROXY_ALLOWLIST_2026-05-20.md`

---

## v372 〜 v372.6.1 — 2026-05-19 〜 20

| 種別 | 内容 |
|---|---|
| 🆕 | 名簿出力 Visual Designer 骨組み（v372 S1）、フィールド辞書 36 件、テンプレ保存、CSV 出力、Tab UI、出力単位（会員/職員/混合）、列フィルタ |
| 🆕 | 公開ポータルに staffUpdate（既存職員情報変更）追加 |
| 🐛 | UTF-8 文字化けバグ修正 |
| 🔧 | CM 番号 admin 例外バリデーション緩和 |
| 🐛 | 公開ポータル変更申請 送信ボタン disable + ヒント表示 |

詳細: `docs/archive/release_history/229_RELEASE_STATE_v372_to_v372.6.1_2026-05-20.md`

---

## v371 系 — 2026-05-18 〜 19（メール送信制御）

| 種別 | 内容 |
|---|---|
| 🔒 | メール送信 4 階層ガード導入（GLOBAL_ENABLED / MODE: LIVE/REDIRECT/SUPPRESS / ALLOWLIST / CATEGORY） |
| 🔒 | 初期値 `MAIL_GLOBAL_ENABLED=false`（safe-stop で着地） |

詳細: `docs/227_MAIL_KILL_SWITCH_2026-05-18.md`

---

## v360 〜 v370 — 2026-05-16 〜 17

研修名簿・出欠管理・一括メール明細・DB schema 変更・dryRun synthetic transaction フレームワーク・転籍時バグ修正。

詳細: `docs/archive/release_history/225_RELEASE_STATE_v360_to_v370_2026-05-17.md`（統合 release state）/ `docs/223` / `docs/226`

---

## v320 〜 v358 — 2026-05-11 〜 16

- v320〜v332: モバイル viewport / レスポンシブ全面強化 / WCAG 2.2 AAA / Playwright 自動テスト 98/98 セル / パスワード規約
- v333: 役員向け請求を活動報告 + 経費請求 2 系統化
- v334: 役員管理の状態編集 + 読み込み高速化
- v335: 入会申込キュー化 + 同一人物移行
- v336-v338: 検索改善
- v340-v345: 様々な修正（会員ステータスメモ、年会費管理遷移、schema-shift 構造的防止 等）
- v347-v358: PDF サムネイル + lightbox 反復改善

詳細: 個別 `docs/186-222_*.md` 参照（または `docs/archive/release_history/`）

---

## v260 〜 v319 — 2026-04-24 〜 05-09

セキュリティ是正（第三者評価 docs/109 対応）、認証認可、ポータル分離、パスワードハッシュ PBKDF2 移行、OAuth スコープ最小化、CI セキュリティゲート、admin/member ポータル split 化等。

詳細: 個別 `docs/139-196_*.md` 参照（または `docs/archive/release_history/`）

---

> **過去のリリース** (v200 以下) は `docs/archive/release_history/` に保管しています。
