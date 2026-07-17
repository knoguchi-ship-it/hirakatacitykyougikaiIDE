# 開発引継ぎ（Current State）

> このファイルは「**現時点で本番がどうなっているか / 何をすべきか**」だけを記載します。
> 経緯・履歴・設計詳細は別ドキュメントへ。リンク先は §6 参照順序を参照。
> 更新原則: 本番デプロイのたびに §1 / §2 を更新。週次以上の頻度で見直す。

最終更新: **2026-07-11**
最新リリース: **`v376.57`**（GCP 移行 Phase 1: frontend transport 分離 `createApiClient`/`GcpApiClient` の器＋`__APP_CONFIG__` 注入。**既定 GAS 経路で挙動不変（非破壊）**。public @363×2 / member @122 / admin @219）
最終作業（2026-07-11 終盤）: **GCP 移行 Phase 2 に着手し中核を完了**（本番 GAS/DB 無変更・作業場は GCP リポジトリ）。①Firestore Native 作成（asia-northeast1・freeTier・operator 承認）②SA impersonation による一方向同期で T_研修 5 doc＋T_システム設定 110 doc をミラー③read-only 互換 API `portal-api` を実装し **`getPublicTrainings`/`getPublicPortalSettings` の両 action が GAS 本番実応答と field 単位で完全一致（contract-check MATCH・settings 47 フィールド）**・warm 113ms（GAS 1.8〜1.9s の約 1/16）。**状態・再開手順の正本は GCP 作業場 README**。
同日中盤: **v376.57 をデプロイ完了**（前セッション中断分の再開）。3 split push→version→fixed deployment 4 本 redeploy→`deployments --json` 一致確認→live E2E（公開 a11y 0・responsive 7VP・**member 7VP PASS・admin 7VP×8 コンソール=56 view PASS**＝3 split 全て非破壊を機械検証。admin は operator ログインで storageState 再取得後に実行）。§12.6 実測（会員222/職員157・B=1呼び出し1.8〜5s固定オーバーヘッド支配）も記録。
同日前半: **GCP 移行のターゲット構成を確定**（docs のみ更新）。operator 決定で **DB=Firestore／認証=IAP(admin)+Firebase Auth カスタムトークン(member)+匿名(public)／hosting=Firebase Hosting＋admin は Cloud Run に IAP 直付け** に確定。動機は**アプリのロード時間短縮**（整合性強化は主目的でない）。キャッシュ（サーバー共有）・同時編集（フィールド単位更新）・移行順（portal→member→admin）・コスト（最小構成ほぼ¥0）まで含め **`docs/250` §12（確定ターゲット構成）が後任の実装入口**。実装は未着手。前リリース v376.56 デプロイ（認証アカウント発行/リセット）は §7/release-notes 参照。
前回作業: **会員系削除の cascade アーカイブ（`docs/249`・a1 単一化）とメール誤集約事故の恒久是正をデプロイ（v376.52 / admin @212）** — ①削除コンソール実行時に会員系13テーブルを live から `*_archive` へ移動（`削除バッチID`=削除ログID・会員単位アトミック復元可）、ログイン履歴は物理 purge。旧 in-place soft delete（孤児発生源）と命名詐称 `archive*ByIds` を撤去。②2026-07-03 の REDIRECT 残置事故（全メールが Redirect 宛先へ集約・UI/ログは成功表示）の再発防止: 一括メール画面に配信モード常時警告バナー＋送信結果/送信ログの正直化（`BULK_MEMBER_REDIRECT` 記録・抑止分を成功に数えない）。③legacy 申込者解決 `@deprecated`（v377 撤去予定）。DB migrate（`_archive` 11本新設+既存2本に列追加・追加のみ非破壊）は次回 admin ログインで自動実行。デプロイ前に DB スプレッドシート複製バックアップ実施済み。
> 直近の経緯・各リリース詳細は §7 リリース表 と `docs/release-notes-2026.md` を正本とする（v376.40〜v376.52）。

---

## 0. 次の担当者へ（キャッチアップ・まず1分でここ）

- **本番**: public **@363×2** / member **@122** / admin **@219**（v376.57・§1）。全 fixed deployment 同期確認済・稼働正常（`ARGON2_ENABLED=false`＝ログイン挙動は従来 PBKDF2 と同一）。GCP 移行 Phase 1（transport 分離）反映済みだが既定は GAS 経路＝挙動不変。
- **直近セッション（2026-06-30〜07-05）の成果**（詳細 §7 / `docs/release-notes-2026.md` v376.51〜.53.2）:
  - v376.51 ロール視点プレビュー（MASTER専用）／v376.52 **会員系削除 cascade アーカイブ**（docs/249・実DB E2E 18/18 PASS・削除負債実測16行のみ）／v376.53 DRY・ハードコーディング・XFrame 一括是正（api.ts **-940行**・rbac-util/validators 集約・ID/URL の Properties override 化）／.53.1-.53.2 REDIRECT 警告バナー（live 実証済）。
  - **メール事故対応済**: 6/26〜7/3 の間 `MAIL_DELIVERY_MODE=REDIRECT` 残置で全メールが旧アドレスに集約されていた（実宛先未達）。LIVE 復旧済・再発防止バナー/ログ正直化デプロイ済。**未達期間の再送要否は運用判断が残っている可能性あり**（`T_メール送信ログ` の 6/26〜7/3 BULK_MEMBER 行を確認）。
  - 第三者評価: `docs/248`（テスト観点表・検証訂正ログ付）→ 主要 High/Med は全て是正済。残は GCP 行き（PBKDF2/性能）と小粒のみ。
- **🚀 GCP 移行: 全体計画の正本は `docs/250`。Phase 0＋Phase B（v376.54）＋Phase 1（transport 分離・v376.57）完了。Phase 2（Firestore+read-only 互換 API）完全終結（2026-07-12）。Phase 3（read shadow）進行中（2026-07-15 着手・ハーネス実装＋shadow 初回 2/2 MATCH 2026-07-17・状態の正本は GCP 作業場 README「Phase 3」節）** — 作業場は **`C:\VSCode\CloudePL\hirakatacitykyougikaiGCP`**（独立Git・GitHub private `knoguchi-ship-it/hirakatacitykyougikaiGCP`）。**本番完全分離**（切り分け規約=同作業場 AGENTS.md §1 が正本・GCP リソースは追加のみ）。
  - **Phase 2 の現況（2026-07-12・詳細と再開手順は GCP 作業場 README「Phase 2 次担当者の再開手順」が正本）**: Firestore Native 作成済（freeTier）／同期 SA `hcmn-sheets-sync-sa`（鍵レス impersonation・DB シートへ閲覧者共有済）／初回同期済（T_研修 5・T_システム設定 110）／`portal-api` の 2 read action が **GAS 実応答と contract-check で完全一致**・unit 18/18／**Cloud Run `hcmn-portal-api` デプロイ完了（2026-07-12・operator 承認済・rev 00001・未認証公開しない・max-instances=1・専用 SA=datastore.viewer のみ・デプロイ済み実サービスで両 action GAS fixture MATCH 実測）**。**trainings 非空突合も完了（2026-07-12・T004 2セル一時未来日付化→受付中1件でローカル/デプロイ済み両方 MATCH→原状復帰を機械検証）＝Phase 2 技術作業完了**。後片付け（同期 SA の DB シート共有の閲覧者復帰）も完了（2026-07-12・読取200/書込403 機械検証）＝**Phase 2 完全終結**。Phase 3（read shadow）は 2026-07-15 着手・進行中。設計正本は GCP 作業場 `docs/PHASE2_DESIGN.md`、operator 決定（早期 Firestore＋一方向同期）は `docs/250` §12.7-2 に記録済。落とし穴（gcloud の Sheets scope は管理者でも解除不可→SA 方式／この PC の ADC パス）は MEMORY と GCP README に記録。
  - **【後任はまずここ】確定ターゲット構成＝`docs/250` §12**（2026-07-11 operator 決定）: 動機=**ロード時間短縮**。DB=**Firestore**（コスト実質¥0・サーバー共有キャッシュ＋フィールド単位更新で同時編集安全化）／認証=**IAP直付け(admin)＋Firebase Auth カスタムトークン(member・既存 Cloud Run Argon2 で検証)＋匿名+App Check(public)**／hosting=**Firebase Hosting**（admin は Cloud Run に IAP 直付け）／移行順=**portal→member→admin**。検証済み事実（かな検索は純JSクライアント側フィルタ＝外部検索不要／遅さの主因は全件フルスキャン）も §12 に記録。**着手前に現行の実データ量と実ロード時間を実測**（§12.6）。実装は未着手。
  - **Phase 0 完了（2026-07-06）**: 課金リンク＋予算アラート月500円／API 有効化／Secret Manager `PASSWORD_HASH_PEPPER_V1` **値まで登録済（version 1 enabled）**／SA／**Cloud Run `hcmn-password-hash` 稼働中・healthcheck PASS**（認証付き `/health`=200・未認証=403）。状態の正本は GCP 作業場 README。
  - **Phase B（次担当者のタスク・本番リポジトリの通常リリースフロー）**: 入口は **`docs/250` §5 Phase B / §10**。password-hash 詳細設計は **`docs/240` §11**。着手前ゲートは ①audience 整合（GAS `getIdentityToken()` の aud=OAuth クライアント ID ⇔ Cloud Run custom audiences）②`ALLOWED_INVOKERS` を維持するなら `userinfo.email` scope を 3 split に追加 ③Cloud Run IAM `roles/run.invoker` の付与先を dryRun で確認した caller principal と一致 ④Secret 名不一致（GCP `PASSWORD_HASH_PEPPER_V1` vs GAS `password-hash-pepper-v1`）解消 ⑤複数 audience 拒否 test 追加。
  - **Phase B 実装順序**: `openid`/必要なら`userinfo.email` scope → token 値を出さない dryRun → Cloud Run custom audiences/IAM/env 調整 → Argon2 関数＋`verifyPassword_` 分岐 → Script Properties（`CLOUD_RUN_HASH_SERVICE_URL` / `ARGON2_ENABLED=false`）→ dryRun E2E → prerelease → 3 split redeploy → operator 承認後に `ARGON2_ENABLED=true`。
  - **Phase B 実装（2026-07-07〜08・手順1〜10 完了・未リリース）**: ①3 split manifest に `openid`＋public/member に `userinfo.email` 追加・3 split push・再同意済②secret 名是正（既定 `PASSWORD_HASH_PEPPER_V1`・Property `PASSWORD_HASH_PEPPER_SECRET_NAME` で上書き可）→ **dryRun で Secret Manager 取得成功実測**③`dryRunGcpPhaseB_LOG`（admin）で **GAS→Cloud Run 認証経路 全通実測**: aud=`88737175415-94k0…`（admin の OAuth クライアント ID）・email claim あり・`/health`=200④Cloud Run rev **00004**: `EXPECTED_AUDIENCE` 複数対応（拒否 unit test 6/6）＋custom audiences に admin クライアント ID 登録（GCP 作業場 `5f72470`）⑤**Argon2 GAS 側実装済**: `hashPasswordCurrent_`（生成13箇所を単一スイッチ化・`ARGON2_ENABLED=false`→PBKDF2 従来挙動不変）／`verifyPassword_` に `argon2id:v1:` 自動判別（flag 無関係に常時検証可＝rollback 安全）／PBKDF2 一致時 `isArgon2Enabled_()` なら needsRehash=true（rehash-on-login）／fail-closed・値非出力／dryRun に hash→verify 往復＋latency 診断追加。
  - **Phase B リリース完了（2026-07-08・v376.54 @360×2/@119/@216）**: dryRun 4 チェック全 PASS（aud 実測・SM 取得成功・`/health`=200・**Argon2 往復 hash 646ms / verify 315ms・PHC=OWASP 推奨**）→ 3 split version/redeploy → live a11y 0・responsive 7VP PASS。Cloud Run は rev **00005**（custom audiences=3 split 全クライアント ID・`EXPECTED_AUDIENCE` 複数対応+拒否 test 6/6）。
  - **Phase B 残り（有効化・operator 承認制）**: **2026-07-08 に operator 決定で「当面見送り」**（v376.54=flag false を数日稼働させ、スポット確認後に別日実施。live スモーク: 3 配信 HTTP200+splash 確認済）。再開手順: ①会員ログイン 1 回の非破壊スポット確認（PBKDF2 経路不変）②有効化前に member/admin の Script Properties へ `CLOUD_RUN_HASH_SERVICE_URL`＋`ARGON2_ENABLED` を設定（admin は設定済・member 未）③限定時間で `ARGON2_ENABLED=true` → ログイン/PW 変更/credential 発行の実機確認 → rehash-on-login 開始（rollback=false に戻すだけ。既存 Argon2 hash は flag 無関係に検証可）。**注意: 有効化後は PBKDF2 へ自動では戻らないため Cloud Run 完全撤去の選択肢が実質なくなる（operator へ説明済）**。**ログイン試行ロックは現行仕様（5 回→無期限ロック・検証前判定＝Cloud Run 呼び出しはアカウント毎最大 5 回）で限定承認（2026-07-08）— GCP 本番オープン時に 3 回化+時限解除を再検討（docs/250 §11）**。
  - Phase 0 の落とし穴記録: `/healthz` は run.app GFE 予約パスでエッジ 404（`/health` を使用）／gcloud は要 `k.noguchi@hcm-n.org`（トークン失効時は operator が `gcloud auth login`）。
- **次の担当者の落とし穴**:
  - git push は **gh アカウント `knoguchi-ship-it`** に switch（`kenta-noguchi-tadakayo-sys` は 403）。push 後は元に戻す運用。
  - clasp は **`k.noguchi@hcm-n.org`**（勝手に tadakayo に戻っていることがある→ `show-authorized-user` 確認）。
  - **Playwright MCP 認証済ブラウザから `google.script.run` で dryRun/診断関数を直接実行できる**（operator ▶ 代行・MEMORY `feedback_playwright_gas_run_verification` 参照）。ユーザーに admin ログインしてもらってから使う。
- **残タスク（小粒・次期）**: 孤児16行のバックフィル（任意・診断済）／kana form 前検証適用／er-sync 列順・相互排他拡張／CM番号 import プレビュー／legacy `getApplicationApplicantType_` 物理撤去（v377）／stale 旧アカウント定数除去（Low）。§2-1 の旧 operator 実機確認（v376.45 line-post-manage 権限付与等）も未消化分あり。
- **まず読む**: 本書 §0→§1→§2→`docs/250`（GCP並走移行計画・正本）→`docs/240` §11（password-hash Phase B詳細）→ GCP 作業場 README/AGENTS。削除設計は `docs/249`、第三者評価は `docs/248`。落とし穴は MEMORY。

---

## 1. 現行本番デプロイ

| 配信 | Deployment ID | Version |
|---|---|---|
| 統合 public legacy | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@363** |
| 統合 public 正式 | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@363** |
| member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@122** |
| admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@219** |

3 project 構成（integrated/public・member split・admin split）の固定 deployment 運用。詳細は `docs/09_DEPLOYMENT_POLICY.md`。

---

## 2. 操作者の即時対応タスク

### 2-0. 次の開発予定

> **✅ v376.57 release 完了（2026-07-11）＝ GCP 移行 Phase 1（frontend transport 分離）デプロイ済・E2E 3 split 全 PASS**。公開 a11y 0・responsive 7VP・member 7VP・admin 7VP×8 コンソール=56 view（storageState は operator ログインで再取得済＝以後 admin E2E 実行可能）。§12.6 実測も完了済。
> **参考**: 2026-07-11 前半セッションで docs/250 に確定反映済み＝サブドメイン（portal/member）・admin=run.app・旧URL転送は Phase 6 最終・max-instances=1 採用・Cloud Armor 不採用。

> **GCP 移行: Phase 0＋Phase B（password-hash 接続・v376.54）＋Phase 1（transport 分離・v376.57）完了。Phase 2 進行中（2026-07-11 着手・中核完了＝§0 参照。現況・再開手順の正本は GCP 作業場 README）**。**ターゲット構成は 2026-07-11 に確定＝`docs/250` §12 が実装入口**（DB=Firestore／認証=IAP(admin)+Firebase Auth カスタムトークン(member)+匿名(public)／hosting=Firebase Hosting＋admin=Cloud Run に IAP 直付け／サーバー共有キャッシュ＋フィールド単位更新／移行順 portal→member→admin）。**セカンドオピニオン反映（2026-07-11）**: API サービスは **max-instances=1**（Pub/Sub 通知は全インスタンスに届かず不成立と判明→1台固定でキャッシュ一貫性と DoW 課金天井を同時解決）／**Cloud Armor 不採用**（LB 必須と判明・代替=App Check+max-instances=1+予算killswitch+アプリ内レート制限）。
> **後任の着手手順**: ①`docs/250` §12 を読む（動機＝ロード時間短縮・確定事項・検証済み事実・コスト早見）②~~着手前に現行の実データ量と実ロード時間を実測~~ **→ 完了（2026-07-11・§12.6 に記録）**: 会員222・職員157・研修4（無料枠に余裕）／A=public 3s・admin 8〜12s／B=1呼び出し 1.8〜5s（26 bytes でも ~2s＝固定オーバーヘッド支配）・fetchAllData 4.9〜11.1s → **A・B 両方が支配的＝確定構成の妥当性を数値で裏付け**③~~Phase 1（非破壊）＝`createApiClient`/`GcpApiClient` の器づくり~~ **→ v376.57 で完了（2026-07-11・GAS E2E 通過済）**④公開前に §11-1 DoW/EDoS 対策を消化。~~次は Phase 2（GCP 作業場）~~ **→ Phase 2 着手済（2026-07-11・データソースは operator 決定で「早期 Firestore＋一方向同期」= `docs/250` §12.7-2 記録済。現況と再開手順は §0 と GCP 作業場 README）**。
> **保留中**: GCP `ARGON2_ENABLED=true` 化（Phase B 最終・operator 承認制）／Mail・Drive の GCP 置換（Phase 4 以降）。DNS・公開 URL 方式は**確定**（2026-07-11: Workspace 登録済みドメインのサブドメイン利用 public=`portal.<ドメイン>`/member=`member.<ドメイン>`・admin=`*.run.app` のまま・周知は旧 GAS URL の JS 自動転送で代替＝Phase 6 最終・現本番撤去時に転送ページ化、それまで旧 URL 不変更。`docs/250` §5 Phase 6/§11）。password-hash 詳細は `docs/240` §11。
> それ以外の確定した開発予定は無し（下表は完了済みの直近大型機能＝履歴）。新規依頼が出たら §2-1 へ追記する。
> ER エディタ深化は**別プロジェクト**（任意・MEMORY `project_er_editor_standalone`）で、本案件の必須予定ではない。

| タスク | 状態 | 参照 |
|---|---|---|
| **ER エディタの深化（継続）** | 双方向編集 MVP 完成（2026-05-30）: モデル単一情報源化・キャンバス直編集（テーブル/列 CRUD・PK トグル）・列ハンドル間ドラッグで FK 作成・線クリックで削除・DBML/Mermaid 双方向同期・localStorage 自動保存復元。**+ 第2次（同日）**: crow's foot カーディナリティ表示（1側=バー / 多側=鳥の足、SVG marker + orient=auto-start-reverse）・接続線中央に列リンクラベル（`子列 → 親列`）・テーブル追加を右端外側へ配置＋自動フォーカス・**ドラッグ中の接続プレビュー線を強調**（既定の薄グレー1pxで埋もれていたのを赤破線2.5pxへ：`connectionLineStyle` + CSS `.react-flow__connection-path`）。**+ 第3次（同日）**: ①カーディナリティ編集 — 接続線クリックで編集ポップオーバー（`EdgeEditor`）、**1対1/1対多/多対多** 切替・**向き反転**・ラベル編集・削除。cardinality を文字列依存から種別（`one-one`/`one-many`/`many-many`）へ正規化（向き反転を破綻なく実装。DBML は `-`/`>`/`<>`、Mermaid は `||--||`/`||--o{`/`}o--o{` に対応）。②**テーブル移動後も線を引きやすく** — 各列の左右両側にハンドル（id に `L:`/`R:` 接頭辞）+ `connectionMode="loose"`、エッジは位置関係で近い側のハンドルへ自動接続。Playwright で全機能検証済（多対多=両端crow's foot+DBML `<>`、向き反転、移動後接続 Ref 5→6、loose 接続を確認）。**残拡張余地**: SQL CREATE TABLE 解析・undo/redo・複数スキーマ管理・PNG/SVG 書出し | `docs/portal/er-editor.html`, MEMORY `feedback_oss_license_audit.md` |
| **メニュー単位カスタムロール RBAC — Phase 1-A 完了 (v376.24 @179)** | 認可レイヤー内部置換完了。挙動完全維持 + snapshot test 7 件 PASS + 許容デルタ 7 件明示承認 | `scripts/menu-registry.mjs`, `scripts/test-menu-registry.mjs`, `docs/246` §Phase 1-A 完了記録 |
| **メニュー単位カスタムロール RBAC — Phase 1-B 完全完了 (v376.25.1 @181)** | T_権限ロール schema + ロールID 列 + 5 ロール seed + fallback chain + DB migration 適用完了。DRYRUN 結果: 4 行全て SKIP（既に正しい）= ロールID 経路で稼働中 | `docs/246` §Phase 1-B 完全完了記録 |
| **メニュー単位カスタムロール RBAC — Phase 2 全完了 (v376.26〜.28.2 @182〜@186)** | 2-A backend CRUD + 2-B 権限マトリクス UI + 2-C 管理者追加フォーム roleId 選択化 + .28.1/.28.2 hotfix（シート作成 + session resolved authz）| `docs/246` §Phase 2 完了記録 |
| **メニュー単位カスタムロール RBAC — Phase 3 完了 (v376.29 @187)** | Sidebar が `allowedMenus` を見て動的描画 + permission-aware routing で許可外 view 遷移拒否 + カスタムロール名表示。Legacy `isFullAdmin`/`isTrainingOnly` は session 取得前の fallback として残置（白ちら防止） | `docs/246` §Phase 3 完了記録 |
| **RBAC 全フェーズ完了。次の予定なし** | docs/246 ロードマップ全完了。Phase 4 以降の構想（ABAC / ReBAC など）は `docs/246` §10 参照（将来課題）| `docs/246` |

> Phase 1-A 完了内容: `ADMIN_ACTION_PERMISSIONS` の判定ロジックを `action→menu→role.allowedMenus` 評価へ内部置換。外部 API 表面・DB スキーマ・whitelist 列構成は不変。`scripts/menu-registry.mjs` を単一情報源とし、build 時に全 3 split の Code.gs に MENU_REGISTRY を埋め込む。snapshot test が旧 ADMIN_ACTION_PERMISSIONS との等価性を機械検証。
>
> 既知デルタ（LEGACY_ROLE_DELTA_ACCEPTED 7 件、すべて TR/TM が training-manage menu 経由で旧不許可 action にアクセス可能化する単一方向のみ。MA は完全に挙動不変）。
>
> Phase 1-B = DB schema 追加 + 移行。Phase 2 = 権限管理コンソール UI。Phase 3 = Sidebar 動的化。

### 2-1. 未完了（優先度 High → Low）

| # | タスク | 詳細 / 参照 |
|---|---|---|
| ✅ | **v376.57 admin E2E 回帰（完了・2026-07-11）** | operator ログインで storageState 再取得後、`test:responsive:admin` を新 admin @219 に対し実行 → **全 7VP × 8 コンソール（会員一覧/変更申請/研修管理/年会費/名簿出力/宛名リスト/システム設定 等）= 56 view 全 PASS**（横スクロール 0・タップターゲット違反 0・console error 0・fatal 0）。public/member E2E と合わせ、v376.57 transport 分離の非破壊を 3 split すべてで機械検証済 | `docs/release-notes-2026.md` v376.57 |
| ✅ | **v376.56 認証アカウント発行/リセット機能（完了・@218/@121/@362）** | v376.55（リセット・認証ID必須）＋v376.56（発行 `adminIssueMemberCredential`）デプロイ済・公開E2E非破壊・**会員ログイン E2E 完全 PASS（2026-07-10・全7VP）**。member E2E は本機能で発行したダミー会員資格情報＋`.env.test` で稼働可能に（積年の未 PASS 解消）。**運用メモ**: 検証用ダミー会員の扱い（恒久テスト fixture として保持 or 物理削除）は operator 判断（下記 §2-1b 参照）| `docs/release-notes-2026.md` v376.55 / v376.56 |
| 0 | **v376.52 cascade アーカイブ＋メール是正の検証**（admin @212・MASTER） | ①admin にログイン（DB migrate 自動実行: `_archive` 11本新設+既存2本に `削除バッチID` 列追加。既存データ不変）。②admin editor で `dryRunDeleteCascadeV376_52_LOG` ▶ → `passed:true`（実DB E2E: 投入→cascade→live0/archive13/purge1→復元→sweep）。③`diagnoseMemberDeleteDebt_LOG` ▶ → 削除負債（refSoftDeleted/refMissing）を実測し、バックフィル要否を判断（`docs/249 §7`）。④一括メール画面: 配信モードを一時 REDIRECT にすると画面上部＋送信確認に琥珀色警告が出ること（確認後 LIVE に戻す）。⑤削除コンソールの説明文が「アーカイブ移動」表記になっていること。※cascade は削除コンソール実行時のみ発動（通常運用に影響なし） | `docs/249` §8 |
| 0 | **v376.51 ロール視点プレビュー 実機確認**（admin @211・MASTER のみ） | MASTER でログインし画面最上部に「👁 ロール視点プレビュー」バーが表示されること。①ドロップダウンで各ロール（管理者/研修管理者/研修登録者/一般/カスタム）を選ぶと、Sidebar が当該ロールの許可メニューだけになり「表示メニュー N件／非表示 M件」が出ること。②許可外 view を開いていた場合は許可内 view に自動退避すること。③プレビュー中に保存・送信・削除を試みると「閲覧のみ」エラーで実行されないこと（実 DB は不変）。④「プレビューを終了」で MASTER の通常表示に即復帰。⑤リロードで自動的に MASTER 表示へ戻ること。⑥360px 幅でバーが崩れないこと。※非 MASTER 管理者・会員にはバーが出ないこと。AI 実行の `test:responsive:admin` は storageState 期限切れで未 PASS のため操作者確認 | `docs/release-notes-2026.md` v376.51 |
| 0 | **v376.50 一括メール REDIRECT 表示確認**（admin @210） | **操作者確認済（2026-06-26）**: REDIRECT モードで一括メールを安全な検証宛先に送信し、件名に `[REDIRECT from ...]` が付かず、本文先頭に `--- ORIGINAL TO` / `--- CATEGORY` が入らないことを確認済。REDIRECT 中は実宛先ではなく allowlist 宛に集約される点は従来通り |
| 0 | **v376.49 一括メール送信の実機確認・必要なら Google 再同意**（admin @209） | **操作者確認済（2026-06-26）**: admin split の `gmail.send` scope 復旧後、一括メールの送受信と添付ファイル送信が成功することを確認済。`clasp run healthCheck --json` は Execution API 実行権限で失敗したが、実送信で復旧確認済 |
| 0 | **v376.48 宛名リスト 発送区分3択 実機確認**（admin @208） | 宛名リスト出力コンソールの「発送区分の選択」に `広報誌発送` / `広報誌のみ発送` / `お知らせ発送` が表示されること。`広報誌のみ発送` でお知らせ発送対象（事業所会員全員＋個人/賛助の郵送希望）が除外されること。`お知らせ発送` で事業所会員全員＋個人/賛助の郵送希望だけが対象になること。表示中を選択→Excel 出力で選択件数だけ出力されること。360px 幅でも選択 UI が崩れないこと。AI 実行の `test:responsive:admin` は保存済み storageState 期限切れで未 PASS のため、操作者側で再ログイン後に確認すること |
| 0 | **v376.46 「在籍中」一致の実機確認**（admin @206） | 会員リストで「在籍中」に絞った人数と、宛先リスト出力で「在籍中」に絞った人数が（同一年度選択時）**一致**すること。特に移行済み(TRANSFERRED)会員が宛先リストの在籍中に混入しないこと。退会予定・当年度退会・前年度退会の各境界も両画面で同じ件数になること |
| 0a | **v376.45 LINE投稿 権限/投稿依頼/可視範囲の実機確認＋権限付与**（admin @205→@206 に内包） | ①**[要対応] MASTER が 設定→権限管理 で `公式LINE投稿 管理` (line-post-manage) を必要なロール（全件閲覧・投稿済みマークさせたい担当ロール／従来通りなら ADMIN ロール）へ付与**（既存 T_権限ロール 行には自動付与されない）。②admin login で schema 移行（`T_LINE投稿依頼` に 作成者名/投稿マーク者名 列追加・既存行保持）を確認。③新規作成で「下書き保存」「投稿依頼をする」の2ボタン動作、投稿依頼で REQUESTED 化。④研修選択で「研修申込リンク」が自動入力される。⑤管理権限なしユーザーは自分の依頼のみ・「投稿済みにする」非表示、管理権限ありは全件＋投稿済み可。⑥一覧/詳細に依頼者名・投稿者名・依頼日時。⑦`dryRunLinePostV376_45_LOG` を ▶ 実行し `passed:true`。※テスト行は soft delete 済 | `docs/release-notes-2026.md` v376.45 |
| 0a | **v376.44 公式LINE投稿依頼の実機確認**（admin @204→@205 に内包） | ①新規投稿依頼を作成し**保存できる**こと（「範囲の列数には1以上」エラーが出ない＝ヘッダー自己修復）。②画像添付のプレビュー（編集モーダル＋投稿依頼詳細）で**画像が正しく表示**されること（化けない）。③編集（既存DRAFT）保存・削除も動くこと。④admin editor で `dryRunLinePostV376_44_LOG` を ▶ 実行し `passed:true`（保存→取得→soft delete が成功）を確認推奨。※テスト行 `DRYRUN_V376_44…` は soft delete 済 |
| 0a | **v376.43 全メールテンプレート管理(Phase A+B) のスキーマ移行トリガ＋実機確認**（全3split @358/@117/@204） | ①**admin にログイン**して schema 移行を走らせ、DB に `T_メールテンプレート` 生成＋旧 credential テンプレ（「会員マイページオープン前」等）が**CREDENTIAL で移行**されていることを確認。②システム設定→メール通知 で、credential＋Tier1 7種＋**Tier2 6種（研修申込確認/研修リマインダー/公開ポータルOTP/会員情報変更確認/退会申請受付/パスワード再設定）**の各カードで 件名/本文編集＋テンプレート管理（**読込→編集→「上書き保存」で増殖せず更新**／「＋新規保存」／削除）が動くこと。③**OTP/PW 再設定の認証コード送信が必ず行われること**（admin editor で `dryRunMailTemplatesV376_43_LOG` を ▶ 実行し `passed:true` を確認推奨。実送信は `MAIL_GLOBAL_ENABLED=false`/REDIRECT 下で安全に）。④360px 幅で崩れないこと。※公開側 a11y(0)/responsive(7VP) は AI 実測済 | `docs/release-notes-2026.md` v376.43 |
| 0b | **v376.41 LINE投稿依頼 研修ピッカー/D&D の実機確認**（admin @200→@203 に内包） | 公式LINE投稿依頼コンソール → 「＋新規作成」で、①既定で「研修の投稿」が選択され、②研修ピッカーが**研修名で検索でき**、③**開催日が過ぎた研修が出ない**（開催予定のみ）こと。④研修を選んで保存できること。⑤添付ファイル欄に画像/PDF を**ドラッグ&ドロップ**でき（点線ゾーン）、「ファイルを選択」クリックでも従来通り選べること。⑥研修管理モーダルの「📱 LINE投稿依頼」経由でも当該研修が選択済みで開くこと（過去開催でも表示維持） |
| 0b | **v376.40 LINE投稿依頼 文言変更の実機確認**（admin @199→@200 に内包） | 公式LINE投稿依頼コンソール／研修起点ポップアップで、①「対象」ラジオが `研修の投稿` → `登録研修以外` の順で表示されること、②「登録研修以外」を選ぶとリンク欄ラベルが **`掲載リンク（資料・申込リンク等）`** に変わり、「研修の投稿」では `研修申込リンク` に戻ること、③コンソール上部の「対象:」絞り込みも `研修の投稿`/`登録研修以外` 表記になっていること。値・保存挙動が従来どおりであること |
| 1 | **v376.39 LINE投稿依頼の研修紐付け実機確認**（admin） | 研修管理 → 既存研修を開く → 「📱 LINE投稿依頼」押下で、対象=研修・対象研修=当該研修・申込リンク・本文テンプレ（研修名/開催日/会場）が**事前入力済み**のポップアップが研修モーダルの上に重なって開くこと。保存 → 公式LINE投稿依頼コンソールに当該研修紐付けの `作成中(DRAFT)` が出現すること。重畳モーダルのスクロール・✕/キャンセル/背景クリックで閉じることも確認 |
| 2 | **v376.32 ディープリンク実機確認** | 公開ポータル `…/exec?t=<受付中研修のID>` を開き、該当研修の申込画面へ直行すること（未発見IDで一覧＋通知、`?p=member-application` 等で各画面へ直行）。admin 研修管理モーダルで「🔗 申込リンク」を押し、生成URL（正式 public + `?t=`）が正しいこと。研修IDは admin で確認 |
| 3 | **当セッション(v376.33〜.38) の admin/member 実機確認**（§0 で AI 未確認分） | ①研修編集モーダルで 担当者/電話番号/メール/申込URL に**連続入力できる**こと（フォーカス喪失修正 v376.33）。②任意項目トグルを**無効→保存**し公開ポータルでその項目が非表示、**申込URL 無効→申込ボタン非表示**（v376.34/.35）。③admin/member ポータルが正常表示。※公開側の a11y(全0)/レスポンシブ(全7VP)/deep-link は AI 実測済（`docs/247`） |
| 4 | v375 実機 Safari iOS 確認 | 本番 URL（admin / member / public 全 3）を Safari iOS から再読込なしで開き、splash → React マウントまで滞りなく進むこと、初期化中文字が一瞬出るが白画面ではないことを確認 |

### 2-1b. 進行中の大型機能（Phase 分割）

| タスク | 状態 | 参照 |
|---|---|---|
| **全メール種別テンプレート管理 — Phase A+B 完了 (v376.43.1 全3split @358/@117/@203)** | 基盤（T_メールテンプレート集約・汎用 CRUD・上書き保存・credential＋Tier1 7種）＋ Phase B（Tier2 6種の差し込み化・送信実体 rewire・OTP/PW 安全フォールバック・UI 6カード・dryRun E2E）デプロイ済。スキーマ移行は操作者 admin login でトリガ（§2-1 #0）。MEMBER_UPDATE_CONFIRM は個人会員の自己変更確認が対象（事業所登録変更/職員追加の内部通知は別文面・固定で対象外） | `docs/release-notes-2026.md` v376.43 |
| **全メールテンプレート管理 — 後続候補（任意）** | 一括メール(BULK_MAIL)テンプレを T_メールテンプレート へ統合 / 'portal' サブタブの旧 credential メール編集ブロック重複の整理 / Tier1 各カードへ「デフォルトに戻す(本文)」追加（現状 credential のみ） | — |

### 2-2. 延期中（再開条件付き）

| タスク | 再開条件 | 参照 |
|---|---|---|
| **member E2E 用ダミー会員の物理削除**（現在は恒久テスト fixture として保持・operator 決定 2026-07-10） | **テストアカウントとしての運用終了時**（削除は前提・保持は暫定）。削除時は物理削除で `T_会員`＋`T_認証アカウント`＋関連行を各シートから直接削除し、`.env.test` のダミー資格情報も除去。※通常削除コンソールは cascade アーカイブ（`*_archive` 残置）で物理削除ではない点に注意 | `docs/release-notes-2026.md` v376.56 |
| GCP Secret Manager セットアップ + Cloud Run Argon2id 反映 | Phase B 再開時。全体計画は `docs/250`、password-hash 詳細は `docs/240` §11。`userinfo.email` / audience / IAM principal / Secret 名不一致を先に確定 | `docs/250`, `docs/240`, `docs/172` |
| WCAG 2.2 AA 手動検証（NVDA / VoiceOver / キーボード） | 半期レビュー (2026-11) or 大規模 UI 改修時 | `docs/244` §3, `docs/245` §3 |
| **v376.36 dormant 差分の同梱デプロイ**（_archive surrogate 列定義） | 次の機能リリース時に自動同梱（個別デプロイ不要・実行時挙動不変） | release-notes v376.36 |
| **dryRun 棚卸し dormant 差分の同梱デプロイ**（2026-07-08・HEAD 反映済） | 次の機能リリース時に自動同梱（web app 挙動不変・operator ツールはエディタ=HEAD 実行のため既に利用可）。内容: ①完了済み一回性ツール 12 関数を gas-src ごと削除（v360/v370/v372/v246/v376.30-31 の migration・hotfix 診断）②継続利用 24 ツールを build で `gas/admin/dryrun.gs` へ自動分離（editor で見つけやすく）③audit-admin-boundary に分離検査追加（Code.gs=doGet/processApiRequest のみ・dryrun.gs=ツールのみ） | `scripts/gas-boundary-utils.mjs` `ADMIN_OPERATOR_TOOL_FUNCTIONS` |
| **退会会員アーカイブ機能の活性化**（移動ジョブを keep-list 追加・物理削除実行） | 運用判断時（破壊的操作＝完全バックアップ＋明示承認必須） | `docs/03_DATA_MODEL.md` §4.10 復活手順 |
| **ER metadata の型補強**（`test:er-sync` WARN 115 件＝主に M_ マスタ列が `string` 既定出力） | 任意・随時。`docs/er-metadata.json` に型/キーを追記して ER 精度向上 | release-notes v376.37 |

### 2-3. 半期レビュー（5 月 / 11 月）

| 項目 | コマンド / 手順 |
|---|---|
| 自動 a11y スキャン | `npm run test:a11y` → `.test-out/a11y-report.md` 確認 |
| 自動レスポンシブ | `npm run test:responsive` (+ `:admin` / `:member`) |
| 手動 SR テスト | NVDA + Chrome / VoiceOver + Safari の 3 シナリオ |
| 適合声明更新 | `docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md` を bump |

---

## 3. 開発再開時の必須コマンド

```bash
# 認証確認
npx clasp show-authorized-user            # k.noguchi@hcm-n.org であること

# 開発フロー
npm run typecheck                          # TypeScript 型検査
npm run test:formula                       # 33 unit tests
npm run test:search                        # 16 unit tests
npm run security:public-boundary           # public top-level callable 監査
npm run security:split-boundary            # member + admin 監査
npm run prerelease                         # 全 release gate（上記をまとめて）

# 本番デプロイ（3 split それぞれ）
npm run build:gas                          # public ビルド
npm run build:gas:member                   # member ビルド
npm run build:gas:admin                    # admin ビルド
(cd gas/admin && npx clasp push --force && npx clasp version "..." && npx clasp redeploy <ID> --versionNumber <N>)
# 同様に member / 統合 public

# 自動 a11y / レスポンシブ（live URL 必須）
npm run test:a11y                          # 公開ポータルのみ（auth 不要）
npm run test:responsive                    # 公開ポータルのみ
npm run test:responsive:admin              # 要 storageState
npm run test:responsive:member             # 要 storageState

# ドキュメントポータル再生成（AGENTS.md §4.6 同期則 — スキーマ・仕様変更時必須）
npm run build:docs-portal                  # docs/portal/*.html + schema.dbml を一括生成
```

---

## 4. 既知の運用注意事項

| # | 注意点 |
|---|---|
| **メール送信は safe-stop** | 本番初期値 `MAIL_GLOBAL_ENABLED=false`。送信再開時は admin → システム設定 → メール通知 → 「メール送信制御」セクションで切替。詳細 `docs/227_MAIL_KILL_SWITCH_2026-05-18.md` |
| **PDF サムネイル** | Drive thumbnailLink の遅延で `案内状サムネイルURL` が空着地することあり。`processPendingThumbnails` trigger（10 分毎）で自動修復。trigger 未登録なら admin editor で `setupPendingThumbnailsTrigger` を 1 回 Run |
| **介護支援専門員番号** | 公開ポータルは 8 桁数字厳格。admin (MASTER/ADMIN) のみ 1-10 桁英数字を許容（HN/HS プレフィックス対応）。詳細 `docs/03_DATA_MODEL.md` §4.1 |
| **clasp 認証 RAPT 期限切れ** | デプロイ時 `invalid_grant` で失敗した場合 `npx clasp login` で再ログイン |
| **build:gas は backend/Code.gs のみ** | admin/member の Code.gs / index.html を更新するには `build:gas:admin` / `build:gas:member` を別途実行 |
| **clasp deploy 全面禁止** | 新 ID 生成で固定 URL が変わるため。Version 更新は `clasp redeploy` のみ |
| **Secret 系ファイルは絶対に Git に入れない** | `.env*` / `.clasprc.json` / `.clasp.json` / `auth-*.json` / `storageState*.json` / pepper / token。詳細 `AGENTS.md` §0 |
| **公開ポータル ディープリンク URL**（v376.32〜）| 公開 exec URL に query を付与して直リンク可。`?t=<研修ID>`＝該当研修の申込画面へ直行 / `?p=training-list`(別名`trainings`)＝研修一覧 / `?p=member-application`(`join`) / `?p=member-update`(`update`) / `?p=withdrawal-request`(`withdraw`) / `?p=training-cancel`(`cancel`)。予約語 `c`/`sid` は使用不可。`申込URL` 無効の研修は `?t=` でも申込画面に飛ばず一覧＋通知。研修の共有リンクは admin 研修管理モーダルの「🔗 申込リンク」で取得 |

---

## 5. 確定済みアーキテクチャ境界（崩してはいけない）

| 境界 | 仕様 |
|---|---|
| 3 境界分離 | **public**（匿名・申込専用）/ **member**（匿名+ID/PW・会員専用）/ **admin**（DOMAIN+Google セッション+ホワイトリスト・管理専用） |
| 会員ログイン | `loginId + password` のみ（Google ログイン不使用） |
| 管理者ログイン | `Session.getActiveUser()` + ホワイトリスト照合（GIS 廃止済） |
| 管理者と会員は完全分離 | admin shell では会員マイページを表示しない（v250〜確定） |
| public callable 関数 | `doGet` / `processApiRequest` / `healthCheck` のみ（厳格制限） |
| パスワードハッシュ | PBKDF2-HMAC-SHA256 10,000 反復 + pepper（v262〜）。Argon2id 移行は backlog |
| OAuth scope | 境界ごと最小化（v263〜確定 + v373.5 で `cloud-platform` 追加） |
| 詳細 | `docs/05_AUTH_AND_ROLE_SPEC.md`、`docs/02_ARCHITECTURE.md` |

---

## 6. 次担当者が読む順序

| # | ドキュメント | 目的 |
|---|---|---|
| 1 | `AGENTS.md` §0 | シークレット絶対ルール（破ったら即時是正） |
| 2 | 本 `HANDOVER.md` | 現状把握（このファイル） |
| 3a | **`docs/portal/index.html`**（ブラウザで開く）| **人間向け HTML ポータル**（ER 図 / テーブル設計書 / 仕様書サマリ / インタラクティブ ER / ER エディタ）|
| 3 | `docs/00_DOC_INDEX.md` | 全ドキュメントの Diataxis 索引（一次資料 Markdown）|
| 4 | `docs/ONBOARDING.md` | 新規開発者向け（Day 1 / Week 1 / Week 2-3 / Week 4） |
| 5 | `docs/02_ARCHITECTURE.md` / `docs/03_DATA_MODEL.md` / `docs/05_AUTH_AND_ROLE_SPEC.md` | リファレンス（必要時） |
| 6 | `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md` / `docs/09_DEPLOYMENT_POLICY.md` | 開発・デプロイ規約（旧 `docs/12_ENGINEERING_RULEBOOK.md` は `GLOBAL_GROUND_RULES/` へ移行済）|
| 7 | `docs/release-notes-2026.md` | 直近の release history（時系列ログ） |
| 8 | `docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md` | WCAG 適合状態 |
| 9 | `docs/245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md` | 新 UI 追加時の必須セット |

---

## 7. 直近メジャーリリース（参考）

詳細は `docs/release-notes-2026.md` または個別 `docs/2XX_RELEASE_STATE_*.md`。

| Version | 日付 | 概要 |
|---|---|---|
| **v376.53** | 2026-07-05 | **DRY/ハードコーディング/XFrame 是正（docs/248 一括クローズ）**（全3split @359×2/@118/@213）。①DRY: `api.ts` の boilerplate 90メソッドを `callAction` 統一（**-940行**・runAction は委譲化）／権限判定を `src/shared/rbac-util.ts` に集約（App/Sidebar の inline 撤去）／検証 regex を `src/shared/validators.ts` に集約。②ハードコーディング: DB Spreadsheet ID・MEMBER_PORTAL_URL・Script ID routes を **Script Properties override 可**（`*_OVERRIDE`/`SCRIPT_ID_*`・未設定時は既定値 fallback＝挙動不変）、`waitLock` を `LOCK_WAIT_TIMEOUT_MS` 定数化。public ビルドの route 置換（`replaceScriptRoutesWithPublicOnly`）を新形状対応（member/admin ID を public bundle から除去維持）。③XFrame: public のみ ALLOWALL・**member/admin は DEFAULT**（clickjacking 面閉鎖・docs/248 M1）。④member の drive/cloud-platform scope 削減は**誤所見と判明し中止**（請求添付で drive 実使用・docs/248 V9）。検証: prerelease 全PASS・3split live 描画確認（Playwright）・public a11y 全0/responsive 21view 全PASS。**v376.52 の operator 検証も AI が認証済ブラウザから完了**: dryRun cascade passed:true(18/18)・負債診断（孤児16行・refMissing 0）・ロール視点プレビュー実機動作 |
| **v376.52** | 2026-07-05 | **会員系削除 cascade アーカイブ（docs/249・a1 単一化）＋メール REDIRECT 恒久是正**（admin split のみ @212）。①スキーマ: `_archive` を 2→13 本へ拡張（`ARCHIVE_SOURCE_TABLES` 単一情報源からループ生成）、サロゲート3列 `アーカイブID/削除バッチID/アーカイブ日時`。DB_SCHEMA_VERSION bump→admin ログインで migrate（追加のみ非破壊）。②cascade: `executeDeleteMember_` が `runDeleteCascade_` で13テーブルを live→archive 移動＋ログイン履歴 purge。旧 in-place soft delete（孤児発生源）と命名詐称 `archive*ByIds` 4関数を撤去。復元 `restoreArchiveBatch_`（バッチ単位アトミック）＋operator 関数5本（診断/一覧/復元/dryRun/掃除）。③メール是正: 2026-07-03 REDIRECT 残置事故の再発防止 — BulkMailSender に配信モード常時警告、`sendBulkMemberMail_` の mode 無視欠陥修正（`BULK_MEMBER_REDIRECT` ログ・suppressed を成功に数えない・`deliveryMode`/`suppressedCount` 返却）。④`getApplicationApplicantType_` に `@deprecated`（v377 撤去予定）。役員 XOR「未検証」は誤所見と確認（docs/248 V8）。prerelease 全PASS・er-sync 57テーブル・デプロイ前 DB 複製バックアップ実施 |
| **v376.51** | 2026-06-30 | **ロール視点プレビュー（MASTER 専用デバッグ機能）**（admin split のみ @211）。MASTER が各ロール/権限ごとの「見え方」をワンクリックで切替確認できる上部固定バー（`src/components/RolePreviewBar.tsx`）を追加。選択ロールの `effectiveRbac`（allowedMenus/isMaster=false/roleName/trainingEditScope）で Sidebar・`isViewAllowed`・line-post 可視を差し替え、許可外 view からは自動退避。**なりすまし(impersonation)ではなくフロント描画のみの模擬**でサーバー強制（`isActionAllowedForSession_`）は MASTER のまま不変＝確定済み認証境界を維持（AGENTS §4.2/§6）。ベストプラクティス準拠（常時バナー/ワンクリック退出/可視・非表示サマリー/閲覧のみ/ephemeral/a11y/レスポンシブ）。プレビュー中は API シングルトンの書込メソッドを deny-by-default で遮断し「閲覧のみ」を担保（`setApiPreviewReadOnly`・読取接頭辞 get/list/search/fetch/check/load/preview 以外をブロック・新規 mutation も自動カバー）。`prerelease` 全 PASS・typecheck・3split build 健全・圧縮 bundle inflate 検証済。DB スキーマ/backend 不変（純フロント）。member/public は inert 差分で未 redeploy |
| **v376.50** | 2026-06-26 | **REDIRECT モードの件名・本文注釈廃止**（admin split のみ @210）。テスト送信時に受信メールへ `[REDIRECT from ...]` と `--- ORIGINAL TO` / `--- CATEGORY` が表示されていたため、REDIRECT 時は宛先だけ allowlist に変更し、件名・本文は加工しない仕様へ変更。元宛先・カテゴリは `Logger.log('deliverMail_ REDIRECT ...')` に記録。`prerelease` PASS、admin `clasp deployments --json` で @210 同期確認。操作者実機確認済（不要注釈なし） |
| **v376.49** | 2026-06-26 | **一括メール送信の Gmail send scope 復旧**（admin split のみ @209）。admin `appsscript.json` に `gmail.send` が欠落しており、`from` 指定時の `GmailApp.sendEmail` 分岐で全件 `Specified permissions are not sufficient` 失敗。`https://www.googleapis.com/auth/gmail.send` を admin manifest に追加し、`MailApp` 通常送信 / `GmailApp` エイリアス送信の実装前提を正本・docs portal に反映。`prerelease` PASS、admin `clasp deployments --json` で @209 同期確認。操作者実機確認済（送受信・添付成功） |
| **v376.48** | 2026-06-18 | **宛名リスト出力コンソール 発送区分3択化**（admin split のみ @208）。画像指摘に合わせ、上段「発送区分の選択」で `広報誌発送` / `広報誌のみ発送` / `お知らせ発送` を直接切り分ける設計に修正。v376.47 の下段 `発送対象` フィルター案は廃止。GAS `buildMailingListCandidates_` は `KOHOUSHI_ONLY` を含む発送区分で候補を再計算。`test:mailing-list` 5件を prerelease に組込。DBスキーマ不変。`test:responsive:admin` は storageState 期限切れで Google ログインへ戻され未 PASS のため、実ブラウザ確認は操作者タスク |
| **v376.47** | 2026-06-18 | **宛名リスト出力コンソール 発送対象フィルター追加**（admin split のみ @207、v376.48 で置換済み）。広報誌発送候補の中から `広報誌のみ` / `お知らせ発送対象` を下段フィルターで絞り込む実装だったが、UI 設計として不適切と判断し v376.48 で発送区分 3 択に修正 |
| **v376.46** | 2026-06-11 | **会計年度ステータス判定の単一情報源化（DRY 是正）— 「在籍中」人数が会員リストと宛先リスト出力でぶれる不具合の解消**（admin split のみ @206）。原因は判定ロジックの2重実装ドリフト（GAS `getMemberFiscalSnapshot_` に TRANSFERRED 分岐欠落→移行済み会員が在籍中に混入、WITHDRAWAL_SCHEDULED 年度ガード相違）。単一情報源 `src/shared/memberFiscalStatus.mjs::computeMemberFiscalStatus` を新設し、フロント import／GAS は build 注入（`computeMemberFiscalStatus_`・`injectMemberFiscalStatusPlaceholders`、menu-registry と同方式）。両画面が同一ロジック共有＝一致。`test:member-fiscal-status`(11) を prerelease 追加。DB スキーマ不変 |
| **v376.45** | 2026-06-10 | **公式LINE投稿: 投稿依頼ワークフロー + LINE投稿権限(RBAC二層) + 可視範囲 + 申込URL自動入力 + 担当者名/日時**（admin split のみ @205）。①新規作成「下書き保存」＋「投稿依頼をする」(submitRequest→REQUESTED)。②権限二層: `line-post`(作成/自分の依頼/投稿依頼)＋新設 `line-post-manage`(全件/投稿済み/状態変更) を MENU_REGISTRY 追加→権限マトリクスで付与可・MASTER 自動。`lineCanManage_`＋`__adminSession` でサーバ強制（list=自分のみ/全件、post=manage必須、編集削除=所有権）。③研修選択で申込URL自動入力(applicationUrl→公開ディープリンク)。④`T_LINE投稿依頼`+2列(作成者名/投稿マーク者名)・一覧/詳細に依頼者/投稿者名・依頼日時。⑤dryRun `dryRunLinePostV376_45_LOG`。**操作者要対応**: MASTER が権限マトリクスで line-post-manage を必要ロールに付与（既存行は自動付与なし）。LEGACY/INITIAL の ADMIN 定義には付与済(legacy経路/新規seed) |
| **v376.44** | 2026-06-10 | **公式LINE投稿依頼の保存不可＋プレビュー画像化け修正**（admin split のみ @204）。①保存時「範囲の列数には1以上を指定してください」: `T_LINE投稿依頼` がヘッダー欠落（列数0）だと `appendRowsByHeaders_` の `getRange(1,1,1,0)` が throw。原因は `getOrCreateSheet_` がヘッダー未書込＋`ensureTableSheetsExist_` が既存シートをスキップする構造的欠陥（v374.1 以来の潜在・メール改修と別経路）。`ensureLinePostRequestSheet_` をヘッダー自己修復化（保存毎に走るので次回保存で復旧）＋`ensureTableSheetsExist_` も既存0列シートを補修。②プレビュー画像化け: `<img src>` が Drive ビューアURL（HTMLページ）→`driveImageSrc()` で `thumbnail?id=` へ変換。③回帰検知 `dryRunLinePostV376_44_LOG`（保存→取得→削除の実DB E2E）追加。**テスト漏れ是正**: admin 書込フローの E2E 欠如が見逃し原因と特定し AGENTS §5 強化 |
| **v376.43 / .43.1** | 2026-06-10 | **全メール種別テンプレート管理 Phase B（ハードコード6メールの差し込み化）+ build pruner hotfix**（全3split @358/@117/@203）。研修申込確認/研修リマインダー/公開ポータルOTP/会員情報変更確認/退会申請受付/パスワード再設定 を `<CAT>_SUBJECT/BODY` 設定値（無ければ既定）＋`renderConfiguredMail_` で差し込み描画化。**OTP・PW 再設定コードは本文からタグを消しても安全装置で既定文面にフォールバックし必ず送信**。getSystemSettings_/updateSystemSettings_/ensureSystemSettingsRows_ に12キー追加、types/App.tsx に6カード（件名/本文＋テンプレート管理＋マージタグ凡例）。非送信 dryRun E2E `dryRunMailTemplatesV376_43_LOG` 追加。回帰: `test:mailrender`(5/5)・prerelease 全PASS・公開 Playwright a11y(0)/responsive(7VP) PASS。**.43.1 hotfix**: 初版で `テーブル定義` リテラル内コメントに pruned 関数名（`_`接尾）を記載→ build pruner(`\b name \b` コメント誤マッチ)が public/member から `var テーブル定義` ごと削除し両split 起動エラー。即ロールバック（public@356/member@115）→コメント修正→再デプロイで復旧。`feedback_build_pruning_bug` 再発・対策をコメント明記 |
| **v376.42** | 2026-06-10 | **全メール種別テンプレート管理 基盤（Phase A）+ 上書き保存**（admin split のみ @201）。専用テーブル `T_メールテンプレート`（テンプレートID/カテゴリ/名前/件名/本文/既定フラグ/作成更新日時/削除フラグ）を新設し、`ensureTableSheetsExist_` で自動生成（DB_SCHEMA_VERSION bump→次回 admin login で migrate）。汎用 CRUD `listMailTemplates_/saveMailTemplate_/deleteMailTemplate_`（**id 一致で上書き update**・無ければ insert）＋ admin action 3つ。旧 `CREDENTIAL_EMAIL_TEMPLATES`(JSON) を `migrateCredentialTemplatesToTable_` で冪等移行（id 重複スキップ・旧 JSON は rollback 用に残置）。旧 credential 3 action は汎用関数へ委譲（後方互換・単一情報源）。フロントは汎用 `MailTemplateManager.tsx` を抽出し**「上書き保存」＋「＋新規保存」2 ボタン**化、credential＋Tier1 7種の EmailCard に付与。`src/shared/mailTemplates.ts` にカテゴリ enum＋マージタグ表集約。ER metadata/portal 再生成（46 テーブル・er-sync PASS）。**Tier2 6種の差し込み化は Phase B（未着手）**。member/public 非該当（gas-src 由来 inert 差分のみ・未 redeploy） |
| **v376.41** | 2026-06-09 | **公式LINE投稿依頼コンソール 研修選択不具合の修正 + ピッカー UX 改善**（admin split のみ @200）。①【バグ修正】`App.tsx` の line-post ビューが `loadSystemSettings` のみ呼んで早期 return し `loadAppData`(trainings) 未呼出のため研修プルダウンが空だった（研修管理等を先に開かないと候補ゼロ）→ line-post でも trainings を silent 読込。②研修選択を `<select>` → **研修名 検索可能な combobox** `TrainingPicker`（`LinePostEditorModal.tsx`）。③**開催日が過ぎた研修を非表示**（当日含む未来のみ・`isDeleted` 除外・選択中は過去でも保持・開催日昇順）。④「対象」ラジオ**既定を TRAINING（研修の投稿）** に。⑤添付ファイルを**ドラッグ&ドロップ対応**（border-dashed ドロップゾーン＋クリック選択併存）。純フロント（admin 境界・top-level callable 不変、member/public 非該当） |
| **v376.40** | 2026-06-09 | **公式LINE投稿依頼 UI 文言調整**（admin split のみ @199）。①「対象」ラジオを文言変更＋並び替え：`研修の投稿`(TRAINING・先頭)／`登録研修以外`(GENERAL・後)（旧 一般投稿/研修に紐付け）。②投稿依頼コンソールの「対象:」絞り込みフィルタも同文言・同順に統一（旧 一般/研修）。③リンク欄ラベルを「対象」連動の動的表示に：GENERAL 時のみ `掲載リンク（資料・申込リンク等）`、TRAINING 時は従来どおり `研修申込リンク`。`value`(TRAINING/GENERAL)・`trainingApplyUrl` 入力・プレビュー・保存挙動は不変。`src/components/LinePostEditorModal.tsx` + `src/components/LinePostConsole.tsx` の純フロント変更（GAS Code.gs の admin 境界・top-level callable 不変、member/public 非該当） |
| **v376.39** | 2026-06-07 | **研修管理から公式LINE投稿依頼を研修紐付けで作成（contextual creation）**（admin split のみ @198）。研修編集モーダルに「📱 LINE投稿依頼」ボタンを追加 → 当該研修に自動紐付け（`targetType=TRAINING`/`targetId`/申込ディープリンク `buildPublicTrainingApplyUrl`）＋研修情報からの本文テンプレ（`src/shared/lineTemplate.ts` の `buildTrainingLinePostDraft`：研修名/開催日/会場）を事前入力したポップアップ（`z-[60]` で研修モーダル(z-50)上に重畳・新タブ禁止 `feedback_gas_new_tab_auth_trap` 準拠）。保存後 `DRAFT` で投稿依頼コンソールに合流。**DRY**: 投稿依頼の編集モーダルを `src/components/LinePostEditorModal.tsx` に抽出し `LinePostConsole` と共用。**副次バグ修正**: LinePostConsole の研修ピッカーが `t.name`（Training に無く undefined 表示）→ `t.title` に是正。Web 調査で LINE 外部自動投稿 API 不在＝手動投稿依頼ワークフロー維持が最適と確認。純フロント（admin Code.gs の境界・top-level callable 不変、member/public 非該当） |
| **v376.38** | 2026-06-06 | **テスト観点表評価 + a11y AA 是正 + npm audit fix**（全 3 split @356/@115/@197）。ISO/IEC 25010:2023 でコード/ドキュメント評価（`docs/247`）。公開 live で `test:responsive` 全7VP PASS・`test:a11y` serious 1件(色コントラスト)検出→`bg-sky-600`→`bg-sky-700`(WCAG 2 AA)是正をデプロイし **a11y 全 0 を live 再確認**。`npm audit fix` で moderate 7→5。Code.gs に v376.36 archive 表定義(dormant)も同梱（DB_SCHEMA_VERSION 不変＝未適用） |
| **v376.37** | 2026-06-03 | **ER 単一情報源化（A+B ハイブリッド）+ ドリフトゲート（docs/build ツーリングのみ・本番非該当）**。ER（docs/03 main + portal）の手書きドリフトを根絶。列の存在/順序＝`gas-src テーブル定義`(正本)、型/PK/FK/コメント/リレーション/分類＝`docs/er-metadata.json`(新規手書き正本)。`scripts/generate-er.mjs` が docs/03 ER を**自動生成**（手書き禁止・AUTO-GENERATED バナー）→ portal 化。`scripts/test-er-sync.mjs`(prerelease) が stale メタ/不正リレーションを FAIL。ゲートが実ドリフト是正（旧 ER の `GoogleユーザーID`(v118廃止)/`表示名`/`T_監査ログ` 誤り列を実列へ、`介護支援専門員番号` 等復活、40→45 テーブル網羅）。`AGENTS.md §4.6` 改訂。GAS 不変・本番デプロイ非該当 |
| **v376.36** | 2026-06-03 | **_archive データモデル整備 + 移動ジョブ堅牢化（⚠️ 未デプロイ・本番は v376.35）**。退会会員アーカイブは「3年超で本テーブルから物理削除し archive へ移動」設計だが、移動ジョブ（`runArchiveOldWithdrawnMembers`/`moveWithdrawnRowsToArchive_`）は **build pruner で全 split から除外された dead code**＝本番未稼働（archive シートは常に空）であることを確認。source 堅牢化（surrogate `アーカイブID`/`アーカイブ日時` 列、keyCol 冪等化、archive先書き）+ `docs/03` §4.10 全面改訂 + portal 再生成。**dormant 変更（実行時挙動不変・DB_SCHEMA_VERSION 不変）かつ clasp RAPT 失効のためデプロイ見送り**。git に dormant 差分保持、次の機能リリース/archive 復活時に同時反映。活性化は破壊的操作で別途承認 |
| **v376.35** | 2026-06-03 | **申込URL 無効時は公開ポータルの申込ボタン自体を非表示**（全 3 split @355/@114/@196）。v376.34 では申込URL無効=内部申込ボタンへフォールバックだったが、要望により「申込URL 無効＝公開での申込受付OFF（申込ボタンを出さない＝閲覧のみ）」へ変更。`trainingOptions.ts` の `effectiveApplicationUrl` を `resolveApplyCta()`（`'none'`/`'external'`/`'internal'` の3状態）へ。`PublicTrainingList` は `none` 時に CTA ブロック自体を非描画、公開 deep-link も `none` は申込画面に飛ばさず一覧＋通知。admin 設定説明を新挙動に修正。回帰なし（`applicationUrl` 既定 true・未設定は有効扱い）。純フロント（GAS 不変）|
| **v376.34** | 2026-06-01 | **研修任意項目トグルを「有効/無効」化し公開申込画面へ反映**（全 3 split @354/@113/@195）。従来 `fieldConfig`（任意項目トグル）は admin 編集フォームの表示制御のみで公開側に効かず「申込URL を無効にできない」状態だった。config-driven UI の単一情報源化で解消。新規 `src/shared/trainingOptions.ts`（`isTrainingFieldEnabled`/`effectiveApplicationUrl`、項目設定JSON のネスト fieldConfig 解釈）。`PublicTrainingList` で 講師/案内PDF/申込締切/詳細内容/費用/申込URL CTA を各トグルで gate（無効=申込画面に非表示）。**申込URL 無効時は値があっても内部申込フローへ**（外部リンク化しない）。公開 deep-link も `effectiveApplicationUrl` 使用。admin トグルを「表示中/非表示中」→「有効/無効」に改称＋補助文。値は保持し可逆。純フロント（GAS 不変） |
| **v376.33** | 2026-06-01 | **モーダル入力フォーカス喪失バグ修正**（全 3 split @353/@112/@194）。`TrainingDetailModal` / `PdfPreviewModal` の focus 管理 `useEffect` が依存配列に `onClose` を含み、親 `TrainingManagement` が `onClose`(`closeDetail`) を `useCallback` していないため毎レンダーで参照変化→**入力1文字ごとに effect 再実行→cleanup の focus 復元 + closeButton 再フォーカスで入力欄からフォーカスが奪われ**研修編集フォームが入力不能だった。`onClose` を `onCloseRef` 経由参照にし effect 依存を `[open]` のみへ変更（呼出側のメモ化有無に非依存）。admin が報告バグ本体、member/public は `PdfPreviewModal` の同根予防修正。純フロント（GAS Code.gs 不変）|
| **v376.32** | 2026-06-01 | **公開ポータル研修ディープリンク**（全 3 split @352/@111/@193）。`doGet` が `e.parameter` を許可制 sanitize（英数・`-`・`_`・80字・deny-by-default・正規表現リテラル不使用）して `window.__DEEPLINK__` 注入。公開 SPA がロード後に1回適用：`?t=<研修ID>`→該当研修の申込画面へ直行（外部フォーム研修は一覧誘導／未発見は一覧＋通知）、`?p=<page>`（training-list/member-application/member-update/withdrawal-request/training-cancel＋別名）→指定画面へ直行。壊れていた v363 hash 直読み（内側iframeで常に空）を撤去。admin 研修管理に「🔗 申込リンク」コピー（正式 public URL を `src/config/publicPortal.ts` で定数化）。境界不変（public top-level は `doGet/healthCheck/processApiRequest` のまま） |
| **(本番コード変更なし)** | 2026-05-31〜06-01 | **ER エディタ第3次強化 + 別プロジェクト化決定**。**第3次**: ① cardinality 編集（接続線クリックで `EdgeEditor` ポップオーバー、1対1 / 1対多 / 多対多 切替・向き反転・ラベル編集・削除）— cardinality を文字列依存から種別（`one-one`/`one-many`/`many-many`）へ正規化し、DBML (`-`/`>`/`<>`) と Mermaid (`||--||`/`||--o{`/`}o--o{`) 双方向往復をロスレス化。②テーブル移動後も線を引きやすく — 各列の左右両側にハンドル（id に `L:`/`R:` 接頭辞）+ `connectionMode="loose"`、エッジは位置関係で近い側のハンドルへ自動接続。Playwright で全機能検証済（多対多 = 両端 crow's foot + DBML `<>`、向き反転、移動後接続 Ref 5→6、loose 接続）。**MEMORY 化**: `project_er_editor_standalone.md` で独立 OSS プロダクト化構想を別プロジェクト記憶として分離（本案件と独立管理）。SQL CREATE TABLE 解析 / Monaco エディタ / undo・redo / 複数スキーマ管理 / PNG・SVG 書出し等が拡張余地 |
| **(本番コード変更なし)** | 2026-05-30 | **ER エディタ双方向編集化**（`docs/portal/er-editor.html`、本番デプロイなし）。表示専用だった ER エディタを直感編集ツールへ刷新。内部モデルを単一情報源とし、①キャンバス上でテーブル/列の追加・改名・削除・型編集・PK トグル、②列ハンドル間ドラッグで FK 作成・接続線クリックで削除、③編集→DBML/Mermaid テキスト即時再生成＋テキスト→キャンバス再パースの双方向同期、④localStorage 自動保存・リロード復元 を実装。Mermaid カーディナリティを親(左)→子(右)で正規化し往復ロスレス化。新規 OSS 依存なし（React Flow MIT のみ・ChartDB/drawDB の AGPL は不採用）。Playwright で取込→編集→FK ドラッグ(trusted mouse)→形式往復→リロード復元まで検証済。**同日第2次**でユーザー FB 対応: ①crow's foot カーディナリティ記号（1=バー/多=鳥の足）②接続線に列リンクラベル（`子列 → 親列`）③テーブル追加を右端外側へ配置＋自動フォーカス。カスタムエッジ（BaseEdge+EdgeLabelRenderer+getSmoothStepPath）と SVG marker(orient=auto-start-reverse)で実装、視覚確認済 |
| **(本番コード変更なし)** | 2026-05-30 | **ドキュメントポータル拡充 + AGENTS.md グランドルール整理**（本番デプロイなし、コミット 10 件）。**新設**: `docs/portal/` 配下の人間可読 HTML ポータル 6 ページ — TOP / インタラクティブ ER (React Flow + ELK) / ER エディタ&ビューア(汎用、DBML+Mermaid 編集ライブプレビュー) / テーブル設計書(クリッカブル) / ER ドメイン別(Mermaid + ELK) / DBML エクスポート(ChartDB/dbdiagram.io 連携) / 仕様書サマリ。`scripts/build-docs-portal.mjs` を単一情報源とし、`npm run build:docs-portal` で再生成。**AGENTS.md 整理**: §4 を 5 サブセクション化 (Deploy SOP / 認証フロー / セキュリティ運用 / UI/UX / ランタイム契約 / **§4.6 ドキュメント形式規約 (新設)**)、§6 重複削減、ユーザー指定追加ルール 6 件反映 (DRY 原則 / ハードコーディング禁止 / 影響範囲確認 / セキュアコーディング 5 視点 / ER 図 HTML 必須 / 人間可読版併設)。**MEMORY フィードバック整理**: Layer 別 subheading で並び替え。**ライセンス監査**: ChartDB AGPL v3 を回避し React Flow MIT を採用 |
| **v376.31** | 2026-05-29 | **initializeSchema_ 堅牢化（v376.30.x 根本対応）**（全 3 split @351/@110/@191）。**計装**: `initializeSchema_` の各 step を critical（migration / seed — 例外伝播）と post（validation 適用 / 保護 / cleanup / audit — Logger.log のみ続行）に分離。完了時に passed/criticalFailed/postFailed 集計をログ出力。**空シート防御**: `protectHeaderRows_` と `applyDataValidationRules_` で `lastColumn < 1` のシートを skip + Logger.log。v376.30 では post-step（おそらく protectHeaderRows_）が空シートに当たって throw し、initialization が中断 → markSchemaInitialized_ 未到達 → 毎リクエスト再初期化ループ、という事象が発生していたが、今後は post-step の軽微なエラーで全体が止まらない |
| **v376.30.1 / .30.2** | 2026-05-29 | **v376.30 hotfix 2 件**（admin @189 → @190）。**.30.1**: schema 状態診断関数 `diagnoseSchemaStateV376_30` を追加。**.30.2**: 救済関数 `forceMarkSchemaInitializedToCurrent` を追加。`initializeSchema_` が schema migration を成功完了したのに最終 `markSchemaInitialized_` まで到達せず `DB_SCHEMA_INITIALIZED_VERSION` が古い値のまま残り、毎リクエストで `initializeSchemaIfNeeded_` が走って後処理ステップでエラー再発する状況を解消。スキーマ自体（T_研修 24列・申込URL 含む・5件データ保持）は正常で、Properties の 2 行を強制マークしただけ。次回 hotfix 候補: `initializeSchema_` の各 step に try/catch + Logger.log を入れて根本原因（どの step で例外が出ていたか）を特定 |
| **v376.30** | 2026-05-29 | **研修登録に「申込URL」任意項目追加**（全 3 split @350/@109/@188）。Google フォーム等の外部申込フォーム URL を任意項目（デフォルト表示）として導入。T_研修 schema 末尾に「申込URL」列追加（normalizeTableColumns_ の name-based shift で既存 5 行データ保持、DB_SCHEMA_VERSION 更新で次回 admin login 時に自動 migrate）。types.ts に Training.applicationUrl?/TrainingFieldConfig.applicationUrl + DEFAULT_FIELD_CONFIG。TRAINING_OPTIONAL_FIELD_DEFS に追加し他の任意項目と同じ表示/非表示トグルに対応。admin form: 案内PDF 直後に URL 入力欄。公開ポータル: t.applicationUrl が設定されていれば「申し込む」ボタンを target="_blank" の「申込フォームへ」外部リンクに置換（未設定時は従来の内部申込ボタン） |
| **v376.29** | 2026-05-28 | **メニュー単位 RBAC Phase 3 完了**（docs/246）— admin split @187。**Sidebar 動的化**: `src/components/Sidebar.tsx` の各 NavItem に `menuId` フィールド追加し、props 経由で受け取った `allowedMenus` と照合して描画。空グループ非表示。masterOnly メニューは MASTER のみ表示。**permission-aware routing**: `handleViewChange` に `isViewAllowed` ガード追加。`viewToMenuId` 逆引きで対象 menu 判定 → 非 MASTER かつ menu ∉ allowedMenus なら遷移拒否。**初期 view 選択**: `pickInitialAdminView` で優先メニュー順（members-list → training-manage → annual-fee → admin-settings）+ allowedMenus 先頭から逆引き。**ロール名表示**: Sidebar の user 情報に `roleName` を反映（カスタムロールの「経理担当」など表示）。**Legacy fallback**: `allowedMenus` 未取得時のみ旧 `isFullAdmin`/`isTrainingOnly` 経路で描画（admin shell 認証直後の白ちら防止）。**結果**: UI と server enforcement が完全一致 — カスタムロール user はサイドバーに自分の許可メニューのみ表示され、URL 直叩きも UI/server 両層で拒否される |
| **v376.28.1〜.28.2** | 2026-05-28 | **RBAC Phase 2 hotfix 2 件**（admin @185 → @186）。**.28.1**: `runRebuildSchemaForV246` が `normalizeTableColumns_` のみ呼んでおり T_権限ロール シート自体を作成していなかった問題を修正（既存シート作成 + `seedInitialPermissionRoles_` 防御的シート作成も追加）。operator が再 Run することで T_権限ロール に 5 ロール seed 完了。**.28.2**: `processApiRequest` の認可判定が `checkAdminBySession_` の session 解決結果を捨てて legacy `permissionLevel` で再判定していたバグ修正。新ヘルパー `isActionAllowedForSession_(action, sessionResult)` を導入し、session.isMaster / session.allowedMenus を直接参照。これによりカスタムロールの allowedMenus が実トラフィックの server enforcement に反映されるように。snapshot test 10/10 PASS（既存 4 ユーザーへの影響なしを機械検証）|
| **v376.26〜.28** | 2026-05-28 | **メニュー単位 RBAC Phase 2 全完了**（docs/246）— admin split @182→@184。**.26 Phase 2-A**: backend ロール CRUD 4 action 新設（`listRoles` / `saveRole` / `deleteRole` / `duplicateRole`）+ ガードレール（MASTER 限定 server enforcement / "MASTER" 予約 / 同名禁止 / masterOnly 拒否 / 組込編集削除拒否 / 削除前 assigned チェック）+ T_監査ログ への ROLE_CREATE/UPDATE/DELETE/DUPLICATE 記録 + `getAdminPermissionData` に `roles`/`menuRegistry` 追加 + `saveAdminPermission_` に optional `roleId` 受領（後方互換）。**.27 Phase 2-B**: `src/components/RoleManagementPanel.tsx` 新設。権限管理画面にロール一覧テーブル + 編集モーダル + 権限マトリクス（メニュー×チェック、masterOnly 非活性、研修編集スコープラジオ）追加。組込/割当中/非 MASTER caller での操作ボタン抑制。**.28 Phase 2-C**: 「管理者権限を追加」+ 既存管理者編集行の permissionLevel ドロップダウンを動的 roleId 選択へ移行（roles 未取得時は legacy ドロップダウンへ自動 fallback、permissionLevel も同期書込で後方互換）|
| **v376.25.1** | 2026-05-28 | **メニュー単位 RBAC Phase 1-B 完全完了**（docs/246）— admin split @181（operator スクリプトに `Logger.log` 追加で出力可視化）+ DB migration 完了。`runRebuildSchemaForV246` で `T_権限ロール` 5 行 seed + ホワイトリスト `ロールID` 列追加。`migrateToRoleBasedRBAC_v246_APPLY` で 4 行（MASTER 2 + ADMIN 2）すべて適正 roleId に紐付け済。DRYRUN 再実行で全行 SKIP 確認 = ロールID 経路稼働中。`権限コード` 列は rollback 用に保持。次フェーズ: Phase 2（権限管理コンソール UI） |
| **v376.25** | 2026-05-28 | **メニュー単位 RBAC Phase 1-B コード反映**（docs/246）。`T_権限ロール` テーブル新設 + `T_管理者Googleホワイトリスト` に`ロールID`列追加（並行運用、権限コード列保持）。`INITIAL_ROLE_DEFINITIONS` 5 ロール（MASTER built-in + 管理者/研修管理者/研修登録者/一般 = 編集可能カスタムロール）を Phase 1-A LEGACY_ROLE_TO_MENUS と完全一致する allowedMenus で定義（挙動完全維持）。`checkAdminBySession_` に fallback chain：ロールID 列があれば `T_権限ロール` 参照、無ければ legacy 権限コード fallback。新 operator スクリプト 3 個（`runRebuildSchemaForV246` / `migrateToRoleBasedRBAC_v246_DRYRUN` / `_APPLY`）を admin keep-list に追加。snapshot test 9/9 PASS（INITIAL_ROLE_DEFINITIONS 整合 + LEGACY 完全一致）。admin split のみ @180（DB migration は operator が次セッションで段階実行）|
| **v376.24** | 2026-05-28 | **メニュー単位 RBAC Phase 1-A** — 認可レイヤー内部置換（docs/246）。`ADMIN_ACTION_PERMISSIONS` の判定ロジックを `action→menu→role.allowedMenus` 評価へ。`scripts/menu-registry.mjs` を単一情報源化（v376.23 パターン踏襲、build 時に全 3 split の Code.gs に注入）。`scripts/test-menu-registry.mjs` 7 件 PASS で旧モデル等価性を機械検証。`checkAdminBySession_` に `roleId`/`roleName`/`isMaster`/`allowedMenus`/`trainingEditScope` 追加（既存 `adminPermissionLevel` は後方互換維持）。`saveTraining_` の `TRAINING_REGISTRAR` ハードコード(11631-11637)を `trainingEditScope==='OWN'` 判定へ置換。許容デルタ 7 件（TR/TM が training-manage menu 経由で旧不許可 action にアクセス可能化、MA は完全に挙動不変）。admin split のみ @179（外部 API 表面・DB schema・whitelist 列は不変のため member/public 未 redeploy）。Phase 1-B (T_権限ロール 新設 + 移行) は次回着手 |
| **v376.18〜.23** | 2026-05-27〜28 | **二重管理是正シリーズ**（メール送信以外の全機能監査の是正）。.18 admin build keep-list 単一情報源化 / .19 未使用 frontend API 6件削除 / .20 シート読取ヘルパー一本化 / .21 申込者解決ガードレール（敢えて統合せず・2モデル併存と判断）/ .22 未使用 backend endpoint 6件削除（全境界）/ .23 action 許可リスト単一情報源化（build×3+audit×3 → `gas-boundary-utils.mjs`）。通算約1,500行削減。.22 のみ挙動変更で全3 split デプロイ（@349/@108/@178）、他は挙動不変（生成物 md5 不変を検証）。残フォローアップ: source 4 dead 関数（`createMember_`/`updateMembersBatch_`/`getFileBytes_`/`getMemberTrainingHistory_`）の撤去 — build pruner が全生成物から既に除外済（本番影響なし）。詳細 `docs/release-notes-2026.md` |
| v376.17 | 2026-05-27 | メール送信の整理。①差し込みタグ置換（`{{氏名}}`等）を `sendTrainingMail_` / `sendBulkMemberMail_` のインライン `.replace` から汎用 `renderBizEmailTemplate_(template, vars)` に一本化。②frontend 未使用の研修メール segment 送信（`sendTrainingMailSegmented_` / `getTrainingMailSendLogs_` と api.ts/types/scripts 定義）を削除し研修メールを `sendTrainingMail_` に一本化。送信実体は従来どおり `deliverMail_` → `sendEmailWithValidatedFrom_` に集約済（変更なし）。機能変更は admin のみ @177（member/public はコメント/bundle 再生成差分のみで未 redeploy） |
| v376.16 | 2026-05-27 | 研修管理（管理者）新規研修登録の入力中に一覧から既存研修を選んでも入力が消えないよう、新規入力を `pendingNewForm` へ退避し、詳細モーダルを閉じると右ペインへ復元（画面を開いている間は保持）。新規作成成功後は空フォームへ戻し連続登録に対応（v376.15 で混入した作成後の右ペイン空白化も解消）。削除・復元後も退避中の新規入力を保持。admin split のみ @176 |
| v376.15 | 2026-05-27 | 研修管理（管理者）右ペインを「新規登録専用エリア」として固定。v376.11 で編集・名簿・メールがモーダルへ移行済のため、右ペインは新規登録フォームのみ表示する1状態に簡素化（プレースホルダー／空表示の宙ぶらりんなデッド状態を解消）。既存研修選択モーダルを閉じると `startNew()` で新規フォームへリセット＆一覧選択解除。到達不能だった inline panelView 分岐も除去。admin split のみ @175 |
| v376.14.2 | 2026-05-27 | 研修管理 全機能ドライランテストを本番で実施 → 15/15 PASS（v376.12 STAFF メール個人解決の回帰確認含む）。テストデータ全 run 分を物理削除済。cleanup を DRYRUN_ プレフィックス sweep 方式に強化（孤児回収・冪等）。`dryRunTrainingManagement()` / `cleanupDryRunTrainingManagement()` は operator が editor から実行 |
| v376.13 | 2026-05-26 | メール送信のチェックボックス再選択バグ修正 — 全員選択モード (excludedIds による除外管理) で一度クリックで除外した行を再クリックしても除外解除されないバグを修正 |
| v376.12 | 2026-05-26 | メール送信バグ修正 — 事業所職員 (STAFF) の申込が legacy `getApplicationApplicantType_` で誤って MEMBER 判定され、事業所代表メール宛に送信されていた問題を解消。`getCanonicalApplicantRef_` (v360 modern 3-FK XOR) に置換し staffMap lookup 追加。`getTrainingApplicants_` と `sendTrainingMail_` 両方修正。区分バッジに「事業所職員」を追加 |
| v376.11 | 2026-05-26 | 既存研修選択時を大画面モーダル表示に変更（モバイル full-screen / デスクトップ 95vw 95vh）。ESC・backdrop click・focus restore・body scroll lock を備えた a11y 準拠モーダル。新規登録は inline 維持 |
| v376.10 | 2026-05-26 | 研修管理 UX 微調整 — 研修選択時の既定ビューを「名簿・出欠」へ変更（業務頻度最高の操作）。ボタン順を「名簿/出欠 → メール送信 → 編集 → 削除」へ並び替え |
| v376.9 | 2026-05-26 | パフォーマンス監査と最適化 — `approveAdminChangeRequest_` の staffRemove ループで sheet を毎回読込していた箇所をホイスト（N→1）/ admin の loadAppData 呼出のうち SystemSettings 取得が不要な 3 箇所で `includeAdminSettings:false` 化（合計 3 個 API 往復削減） |
| v376.8 | 2026-05-26 | 研修名簿・メール送信 UX 全面改修 — Salesforce Lightning / Mobbin segmented control / NN/g filter pattern 準拠。重複タイトル削除・選択ベース一括操作・ボタン階層化 |
| v376.7 | 2026-05-26 | 研修管理にフィルター（年度/状態/キーワード）+ soft delete + 復元機能を追加。グローバル UX best practice（current fiscal year default 等）準拠 |
| v376.5/.6 | 2026-05-26 | ChangeRequestConsole の `{}` 表示バグ・「処理中…」滞留・承認後の二重押下バグを修正 |
| v376.3/.4 | 2026-05-26 | テストデータ棚卸し・soft delete (T_外部申込者 3 件削除)。dryRun manifest 確認関数追加 |
| v376.1/.2 | 2026-05-25 | `backfillKanaToFullwidth_APPLY` ラッパー追加 + admin editor keep-list 追加 |
| **v376** | 2026-05-23 | フリガナ（セイ/メイ/フリガナ）の保存形式を全角カタカナに統一。ひらがな・半角カナ・全角カナの混在入力を受け付け、保存時に NFKC + ひらがな→カタカナ + 全角スペース正規化を適用。`backfillKanaToFullwidth` 移行関数で T_会員 180 / T_事業所職員 173 / T_外部申込者 3 件を変換済（計 356 rows / 804 cells）。19 ケースの単体テスト追加 (`scripts/test-kana-normalize.mts`) |
| v375 | 2026-05-21 | boot loader 全面改修（`scripts/compress-html.mjs`）— Safari iOS 初回ホワイトアウト解消（CSS splash + try/catch + DecompressionStream feature detect + 死んだ importmap 削除 + Google Fonts 非ブロック + requestIdleCallback 分散）。3 split 同時リリース |
| v374.1.1 | 2026-05-21 | Sidebar に LINE 投稿依頼を表示する修正 (App.tsx の VIEW_META と src/components/Sidebar.tsx の NavGroup は二重管理) |
| v374.1 | 2026-05-21 | 公式LINE投稿依頼コンソール追加（管理者ポータル / 3 状態ライフサイクル / Drive 添付 / Polymorphic association） |
| v374 | 2026-05-21 | WCAG 2.2 AA 自動テスト基盤 + レスポンシブ回帰運用化 + badge contrast 修正 |
| v373.7 | 2026-05-20 | Sprint S5 完了（GAS バックエンド旧 RosterExport 完全削除） |
| v373.6 | 2026-05-20 | Sprint S5 第 1 弾（front-end 旧 RosterExport 削除） |
| v373.5 | 2026-05-20 | Secret Manager 連携 + Cloud Run Argon2id 設計 |
| v373〜v373.4 | 2026-05-20 | 名簿出力 Visual Designer S3-S5（計算式・条件付き書式・PDF・row filter） |
| v372 系 | 2026-05-19 〜 20 | 名簿出力 Visual Designer 骨組み + S2（drag-drop / 列幅 / 書式） |

完全な履歴は `docs/release-notes-2026.md`。

---

## 8. 開発スタック早見表

| 領域 | 技術 |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Google Apps Script (GAS) + Google Spreadsheet (DB) |
| 認証 | 会員 ID/PW、管理者 Session + ホワイトリスト |
| Mail | `MailApp.sendEmail`（通常送信） / `GmailApp.sendEmail`（admin split のエイリアス送信） |
| GCP プロジェクト | `hcmn-member-system-prod` (#88737175415) |
| DB スプレッドシート | `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` (固定) |
| 運用アカウント | `k.noguchi@hcm-n.org` |
| GAS Project | `11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL` |

---

**お知らせ**: ドキュメント体系は 2026-05-21 に Diátaxis フレームワークに沿って刷新済み。本書 (`HANDOVER.md`) は「現状」のみ、`docs/00_DOC_INDEX.md` が全体索引、`docs/ONBOARDING.md` が新規参加者向けチュートリアル。
