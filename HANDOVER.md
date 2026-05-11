# 開発引継ぎ

更新日: 2026-05-11
現行本番: `v330`（公開・会員・管理者ポータルすべてで WCAG 2.2 AAA タップターゲット (44×44px) 完全達成。Playwright で 98/98 セル全合格を確認） / integrated-public GAS version `294` / member split GAS version `50` / admin split GAS version `88`
fixed deployment: integrated/public `@294` x2 / member split `@50` / admin split `@88`

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- split project の広範な関数本体 pruning は v283 で破損したため停止中。public artifact は v289 で comment/string を除外した依存解析と top-level callable allowlist 検査を導入済み。
- release 前に `npm run security:public-boundary` / `npm run security:split-boundary` を実行し、public/member/admin 境界が崩れていないことを確認する。
- member/admin split artifact の top-level callable は `doGet` / `processApiRequest` のみに制限済み。
- `v309`: 年会費管理コンソールに管理者共有メモ（申し送りホワイトボード）を追加。admin split `@69`。詳細: `docs/194_RELEASE_STATE_v309_2026-05-08.md`
- `v308`: 会員詳細編集画面の年会費表示を、2024 年度以降、当年度から過去 4 年分へ修正。admin split `@68`。詳細: `docs/193_RELEASE_STATE_v308_2026-05-06.md`

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
10. `docs/197_RELEASE_STATE_v320_2026-05-11.md`（最新：v320 モバイル viewport / レスポンシブ）
11. `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`（v311〜v319 統合）
12. `docs/195_RELEASE_STATE_v310_2026-05-08.md`
13. `docs/194_RELEASE_STATE_v309_2026-05-08.md`
14. `docs/193_RELEASE_STATE_v308_2026-05-06.md`
15. `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`
16. `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
17. `docs/09_DEPLOYMENT_POLICY.md`
18. `docs/05_AUTH_AND_ROLE_SPEC.md`
19. `docs/04_DB_OPERATION_RUNBOOK.md`
20. `docs/03_DATA_MODEL.md`
21. `docs/00_DOC_INDEX.md`
22. `docs/archive/historical/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`（補足状態サマリ。正本は `HANDOVER.md`）

## 3. 配信境界

| 用途 | Project | Deployment ID | Access | Current version |
|---|---|---|---|---|
| 公開ポータル | integrated/public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` | `@294` |
| 公開ポータル legacy | integrated/public | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `ANYONE_ANONYMOUS` | `@294` |
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` | `@50` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` | `@88` |

## 4. 直近リリース

- `v330`: 宛名リスト出力コンソールの検索欄レイアウト breakpoint を `md` → `lg` に変更し、768px (iPad portrait) で検索 input が極小化される問題を解消。Admin 56 セル / Member 21 セル / Public 21 セルの計 **98 セル全合格**を達成。詳細: `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md`。admin split `@88`。
- `v329`: システム設定ページのサブナビをモバイル時に横スクロールタブバー化し、320px で本体コンテンツが圧縮される問題を解消。admin split `@87`。
- `v328`: グローバル `button { min-width: 44px; min-height: 44px; }` を `@layer base` に追加し、ページネーション等の小型ボタンを WCAG 2.2 AAA 準拠サイズに引き上げ。member split `@50` / admin split `@86`。
- `v327`: 全 `button` 要素にグローバル `min-height: 44px` を追加（v326 の input/select/textarea 対応を拡張）。admin split `@85`。
- `v326`: 認証要 (member/admin) ポータルのモバイル UX 全面強化。Sidebar をモバイル時ドロアー（ハンバーガー＋backdrop overlay）化、Tailwind base layer に `input/select/textarea { min-height: 44px }` を追加してフォーム要素を 44px AAA 基準に統一、Sidebar nav/ログアウト/グループヘッダーに `min-h-[44px]`、`<main>` を `p-4 md:p-8` に変更。Member ポータルで 7 viewport (320–1920px) × 3 view (login/profile/training) の Playwright 自動テスト 21 セル全合格を確認。member split `@49` / admin split `@84`。
- `v324`/`v325`: 上記の段階リリース（drawer 導入 → 個別タップターゲット 44px 化）。
- `v323`: Playwright (chromium) を導入し、公開ポータルに対する自動レスポンシブテストを 7 viewport (320–1920px) × 3 view で実施。初回測定で見つかった WCAG 2.2 AAA 未達のタップターゲット (`← ポータルトップへ戻る` / `重要事項を確認する` / ダイアログ header `閉じる` / `入会・退会案内を開く` / `定款を確認する`) を `min-h-[44px]` + `min-w-[44px]` に揃え、再測定で 21 セル全合格を確認。テスト基準・結果は `docs/198_RESPONSIVE_TEST_REPORT_2026-05-11.md` 参照。`scripts/responsive-test.mjs` で再実行可能。integrated/public `@294` x2 のみ更新。
- `v322`: 入会申込画面「事務局からのお願い（ご入会にあたって）」モーダルがスマホで `max-h-[90vh]` + 固定 calc 高さで組まれており、iOS Safari のアドレスバー領域分だけフッターが画面下にはみ出して「内容を確認して閉じる／閉じる」ボタンに到達できない不具合を修正。flex column レイアウト + `max-h-[100dvh]` (sm 以上は `90dvh`) + `flex-1 min-h-0 overflow-y-auto` ボディに変更し、フッターは `shrink-0` + `pb-[max(1rem,env(safe-area-inset-bottom))]` で safe area を確保。タップターゲットも `min-h-[44px]` 化。integrated/public `@294` x2 のみ更新。
- `v321`: v320 hotfix。GAS `HtmlOutput.addMetaTag()` は `viewport` / `apple-mobile-web-app-capable` / `mobile-web-app-capable` / `google-site-verification` のみ許可で、`theme-color` を渡すと `Exception: 指定したメタタグはこのコンテキストでは使用できません` で全ページ表示不可になっていたため、`theme-color` の addMetaTag 呼び出しを 3 プロジェクトから除去。viewport は維持。integrated/public `@294` x2 / member split `@46` / admin split `@82`
- `v320`: 全 3 プロジェクト（public/member/admin）の `doGet()` に `addMetaTag('viewport', ...)` および `addMetaTag('theme-color', ...)` を追加し、スマートフォンでの白ページを解消。公開ポータルを mobile-first レスポンシブ UX（`100dvh`・`overflow-x-hidden`・`sm:grid-cols-2`・カード段階サイズ・ヘッダー/フッター stack・WCAG 2.2 タップターゲット 44px）に強化。AGENTS.md にレスポンシブ必須グランドルールを追加。integrated/public `@294` x2 / member split `@45` / admin split `@81`。詳細: `docs/197_RELEASE_STATE_v320_2026-05-11.md`
- `v319-post`: 第三者評価指摘の修正（`annualFeeStatus` 型から `NONE` 除去、`MailingListExport` の dead entry 削除、`processRosterChunk_` の `|| 'NONE'` → `|| 'UNPAID'`）を反映。admin split `@80`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v319`: 管理者ポータルにパンくずナビ（グループ名 › コンソール名）と変更申請 PENDING バッジを追加。admin split `@79`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v318`: システム設定ページを 5 カテゴリ左サブナビ + 1 カテゴリ集中表示に変更。admin split `@78`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v317`: サイドバーナビを 5 グループ化・折りたたみ・開閉状態保存に対応。admin split `@77`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v316`: テンプレートライブラリを無制限登録・検索選択・自動マイグレーションに対応。admin split `@76`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v315`: 名簿出力コンソール事業所会員の氏名表示を事業所名のみに修正。admin split `@75`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v314`: 名簿出力年会費ステータスの `NONE` を廃止し未納に統一（データ整合性修正）。admin split `@74`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v313`: 名簿出力コンソールを自動ロード・クライアント側フィルタリング・テーブル表示バグ修正。admin split `@73`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v312`: 名簿出力コンソールに在籍判定年度ドロップダウン＋年会費多年度条件ビルダーを追加（宛名リストと同仕様）。admin split `@72`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v311`: 宛名リスト年会費フィルターの初期値を選択年度・全状態にデフォルト設定。admin split `@71`。詳細: `docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`
- `v310`: 宛名リスト出力コンソールの年会費納入フィルターを、複数年度・AND条件に対応した条件ビルダーに刷新。admin split `@70`。詳細: `docs/195_RELEASE_STATE_v310_2026-05-08.md`
- `v309`: 年会費管理コンソールに管理者共有申し送りメモ（ホワイトボード型）を追加。MASTER/ADMIN が書き込み可、60秒自動ポーリング＋手動更新、楽観的排他制御。admin split `@69`。詳細: `docs/194_RELEASE_STATE_v309_2026-05-08.md`
- `v308`: 会員詳細編集画面の年会費表示を 2024 年度以降、当年度から過去 4 年分へ修正。admin split `@68`。詳細: `docs/193_RELEASE_STATE_v308_2026-05-06.md`
- `v307`: 会員詳細編集画面に年会費の表示・編集セクションを追加。admin split `@67`。詳細: `docs/192_RELEASE_STATE_v307_2026-05-06.md`
- `v306`: 管理コンソール保存後再読込の `unsupported_action` fatal error を防止。admin split `@66`。詳細: `docs/190_RELEASE_STATE_v306_2026-05-06.md`
- `v305`: 宛名リスト・名簿出力の年度基準判定と共有検索を修正。admin split `@65`。詳細: `docs/188_RELEASE_STATE_v305_2026-05-05.md`
- `v304`: 会員管理コンソールの事業所職員一覧 UI を修正。admin split `@64`。詳細: `docs/186_RELEASE_STATE_v304_2026-05-05.md`
- `v303`: `adminDashboard` 旧 cache が `staffRows` なしで残る場合の再生成 guard を追加。admin split `@63`。詳細: `docs/184_RELEASE_STATE_v303_2026-05-04.md`
- `v302`: 事業所職員一覧を `T_事業所職員` 由来の `staffRows` で表示するよう修正。admin split `@62`。詳細: `docs/183_RELEASE_STATE_v302_2026-05-04.md`
- `v301`: v300 相当の admin artifact を再生成し、管理者 fixed deployment を再同期。admin split `@61`。詳細: `docs/182_RELEASE_STATE_v301_2026-05-04.md`
- `v300`: 事業所会員ビューを事業所職員一覧へ修正。admin split `@60`。詳細: `docs/181_RELEASE_STATE_v300_2026-05-04.md`
- `v299`: 会員管理コンソールに事業所会員ビューを追加。admin split `@59`。詳細: `docs/180_RELEASE_STATE_v299_2026-05-04.md`
- `v298`: 振込口座管理タブの事業所職員役員対応を修正。admin split `@58`。詳細: `docs/178_RELEASE_STATE_v298_2026-05-04.md`
- `v297`: 事業所職員を役員に割当て可能にし、関連 DB 3 テーブルへ `職員ID` を追加。member split `@44` / admin split `@57`。詳細: `docs/177_RELEASE_STATE_v297_2026-05-04.md`
- `v291`: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新し、split boundary audit を prerelease gate 化。詳細: `docs/173_RELEASE_STATE_v291_2026-05-01.md`

## 5. 既知の重要事項

- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。
- `PASSWORD_HASH_PEPPER_V1` は integrated/public・member split・admin split の 3 project に同一値で設定済みという前提で運用する。値は Git、handover、docs、ログ、チャット、生成物へ記録しない。
- Secret Manager 化および外部 KDF / managed identity の検討は必須 security backlog。完了または明示的な代替設計決定まで削除・完了扱いにしない。詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `v288` 第三者評価で検出された public callable `rebuildDatabaseSchema` / `getDbInfo` は v289 で public artifact から除去済み。
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod` で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- admin split `@47` は whiteout 実績があるため、原因特定まで admin physical pruning の再デプロイは禁止。

## 6. DB とスキーマ状態

- 本番 DB スプレッドシート ID: `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`（固定・変更禁止）
- ログ SS ID: `1NmVv483UeehF8dqCdyNKOqOtv_fPKROhHN7011N23lw`
- v295 DB マイグレーションは 2026-05-03 に Apps Script エディタ（admin split）から `runRebuildSchemaForV295` を手動実行済み。
- v297 DB マイグレーションは 2026-05-04 に Apps Script エディタ（admin split）から `runRebuildSchemaForV297` を手動実行済み。
- v305 / v306 / v307 / v308 は物理 DB スキーマ変更なし。v305 は `getMemberFiscalSnapshot_()` による年度基準派生モデルの修正、v306 は管理コンソール再読込状態管理の修正、v307/v308 は既存年会費 API を使う会員詳細 UI と表示年度修正のみ。
- `T_役員` / `T_振込口座` / `T_請求` の人物識別は `会員ID` または `職員ID` の XOR 制約を守る。

## 7. 操作者確認待ち

実ブラウザ確認は操作者側で実施する。

- **v320 モバイル実機確認（最優先）**: iPhone Safari と Android Chrome で公開ポータル・会員マイページ・管理者ポータルを開き、白ページが解消され、レイアウトが破綻なく表示・操作できることを確認する。確認端末幅の目安: 360px / 390px / 414px。
- 会員マイページ OAuth 再承認: member split に `drive` scope が追加済みのため、未実施環境では再承認が必要。
- v319: サイドバーが5グループで折りたたみ表示される。変更申請がある場合にバッジが表示される。各コンソールにパンくずが表示される。
- v318: システム設定が5カテゴリのサブナビで1カテゴリずつ表示される。保存ボタンは引き続き全設定一括保存。
- v317: サイドバーグループの開閉状態がリロード後も保持される。MASTER専用項目に🔒が表示される。
- v316: システム設定のテンプレートライブラリにテンプレートを追加・検証・デフォルト設定でき、名簿出力で選択できる。初回アクセス時に旧2枠設定が自動移行される。
- v313〜v315: 名簿出力が自動読み込みされ「対象外」が表示されず「未納」に統一される。事業所会員が事業所名で表示される。
- v312: 名簿出力の年会費条件ビルダーで複数年度AND絞り込みができる。
- v311: 宛名リスト読み込み後に年会費フィルターに現在年度が自動設定される。
- v309: 年会費管理コンソールで申し送りメモパネルが表示・保存・自動更新される。

## 8. 次担当者の最初の一手

1. `git status --short` で既存差分と未追跡ファイルを確認する。
2. `HANDOVER.md`、`docs/196_RELEASE_STATE_v311_to_v319_2026-05-09.md`、`docs/09_DEPLOYMENT_POLICY.md` を読む。
3. 実装・構成・デプロイ前に不明点を確認する。
4. 変更前に関連正本を読み、コード・データ・デプロイ・UI・認証・運用手順を変える場合は同ターンで正本を更新する。
5. 本番系 `clasp` コマンドは最初から承認済みの安定経路で実行する。

## 9. 標準確認コマンド

```bash
git status --short
git diff
npm run typecheck
npm run build:gas:admin
npm run security:public-boundary
npm run security:split-boundary
```

本番反映時は `docs/09_DEPLOYMENT_POLICY.md` の `build -> push -> version -> fixed deployment sync -> verification -> document update` を完了条件とする。
