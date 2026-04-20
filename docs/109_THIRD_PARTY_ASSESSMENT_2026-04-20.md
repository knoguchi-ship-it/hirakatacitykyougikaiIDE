# 第三者評価レポート

評価日: 2026-04-20
対象: 枚方市介護支援専門員連絡協議会 会員システム
評価方式: コードレビュー、設定レビュー、正本レビュー、一次ソース準拠の第三者評価

## 1. 先に結論

現状の本番システムは、グローバルスタンダード基準では「条件付き運用」ではなく「是正優先」の判定である。
最大の理由は、公開到達可能な Web アプリ構成に対して、backend API の認証・認可境界が十分に閉じておらず、少なくとも一部の内部 API が匿名呼び出し前提でも成立してしまう実装になっているためである。

このため、OWASP ASVS 5.0.0 の Level 1 すら現時点では満たしていない。
一方で、データモデルの構造化、管理者ホワイトリスト運用、監査ログの一部整備、運用正本の明文化は進んでおり、是正の土台はある。

## 2. 本日基準で採用した評価基準

2026-04-20 時点で、以下の一次ソースを評価基準として採用した。

- OWASP ASVS 5.0.0
  - 最新 stable は 2025-05-30 公開
  - https://owasp.org/www-project-application-security-verification-standard/
- OWASP Top 10:2021
  - 2026-04-20 時点で公式サイトの current awareness baseline
  - https://owasp.org/Top10/2021/
- NIST Cybersecurity Framework 2.0
  - final は 2024-02-26
  - https://www.nist.gov/cyberframework
- NIST SP 800-218 SSDF Version 1.1
  - current final は 2022-02-03
  - Rev.1 / Version 1.2 は 2025-12-17 の Initial Public Draft であり、final ではないため本評価の正式基準には採用しない
  - https://csrc.nist.gov/pubs/sp/800/218/final
- NIST Privacy Framework
  - current final は 1.0
  - 1.1 は 2025-04-14 時点で Initial Public Draft
  - https://www.nist.gov/privacy-framework
  - https://www.nist.gov/privacy-framework/new-projects/privacy-framework-version-11
- WCAG 2.2
  - W3C Recommendation は 2023-10-05
  - ISO/IEC 40500:2025 としても承認済み
  - https://www.w3.org/WAI/standards-guidelines/wcag/
- CISA Secure by Design
  - current guidance revision は 2023-10-25
  - https://www.cisa.gov/resources-tools/resources/secure-by-design
- OWASP Logging / Authentication / Authorization Cheat Sheets
  - 補助ガイダンスとして参照
  - https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

## 3. 評価スコープ

- backend: `backend/Code.gs`, `backend/appsscript.json`
- frontend: `src/App.tsx`, `src/components/*`, `src/public-portal/*`
- 正本: `docs/01_PRD.md`, `docs/02_ARCHITECTURE.md`, `docs/03_DATA_MODEL.md`, `docs/04_DB_OPERATION_RUNBOOK.md`, `docs/05_AUTH_AND_ROLE_SPEC.md`, `HANDOVER.md`

除外:

- 実ブラウザ手動試験
- 外部侵入試験
- 本番ログの実地分析
- Apps Script 実行系の live runtime 確認

したがって本評価は、実装・設定・設計に対する第三者レビューであり、侵入試験完了報告ではない。

## 4. 総合判定

### 4.1 総合レーティング

- 総合: `D / High Risk`
- 本番継続可否: `継続は可能だが、重大是正を先送りしてよい状態ではない`
- グローバルスタンダード適合度: `未達`

### 4.2 フレームワーク別判定

| 基準 | 判定 | コメント |
|---|---|---|
| OWASP ASVS 5.0.0 Level 1 | Fail | 認証・認可境界の重大欠陥がある |
| OWASP ASVS 5.0.0 Level 2 | Fail | Level 1 未達のため当然未達 |
| OWASP Top 10:2021 | High Risk | A01 Broken Access Control, A07 Identification and Authentication Failures, A04 Insecure Design に強く該当 |
| NIST CSF 2.0 | Partial / Below Baseline | Govern/Protect/Detect が弱い |
| NIST SSDF 1.1 | Partial | 文書化はあるが secure-by-design 実装と検証自動化が不足 |
| NIST Privacy Framework 1.0 | Partial | 保管・削除ルールはあるが API 境界で privacy risk が残る |
| WCAG 2.2 AA | Undetermined / Partial | ARIA と入力補助は進んでいるが conformance evidence が不足 |

## 5. 重大所見

### 5.1 Critical: 匿名到達可能な Web アプリに対して、内部 API の認可境界が不足している

根拠:

- `backend/appsscript.json:26` で Web アプリは `ANYONE_ANONYMOUS`
- `backend/Code.gs:989` の `processApiRequest`
- `backend/Code.gs:1071` `fetchAllData`
- `backend/Code.gs:1078` `getAdminDashboardData`
- `backend/Code.gs:1103` `getMemberPortalData`
- `backend/Code.gs:3033` `fetchAllDataFromDb_()`
- `backend/Code.gs:3154` `getMemberPortalData_()`
- `backend/Code.gs:3193` 以降で member auth rows / annual fee / staff / loginId を返却

評価:

- `fetchAllData` は会員一覧、職員一覧、年会費履歴、参加履歴に基づく API 用データを返す
- `mapMembersForApi_()` では会員・職員の `loginId`、氏名、メール、所属情報、年会費情報まで API へ載せている
- `getMemberPortalData_()` は `loginId` がなくても `memberId` 直接指定でデータ解決できる
- これらが `processApiRequest` 上で匿名遮断されていない

影響:

- 大量の会員個人情報、職員情報、認証識別子、所属、年会費状況が匿名取得されるリスク
- 会員・職員列挙、なりすまし準備、標的型攻撃準備に直結

標準違反:

- OWASP Top 10 A01 / A04 / A07
- OWASP ASVS 5.0.0 の認証・認可・データ保護系要求
- NIST CSF 2.0 Protect
- NIST Privacy Framework の data processing visibility / control の基本要求

是正:

1. `processApiRequest` に deny-by-default を導入する
2. 公開 API は `getPublicTrainings`, `applyTrainingExternal`, `cancelTrainingExternal`, `submitMemberApplication`, `getPublicPortalSettings` のみ allowlist 化する
3. `fetchAllData`, `getAdminDashboardData`, `getMemberPortalData` は server-side principal を必須化する
4. 会員向け API は `loginId` ではなく、サーバー側で検証済みの session subject または署名付き短期トークンから principal を導出する
5. 本番でアクセスログを確認し、過去の不審利用有無を点検する

### 5.2 Critical: 自己操作 API がクライアント申告の識別子を信頼している

根拠:

- `backend/Code.gs:1171` `updateMemberSelf`
- `backend/Code.gs:1252` `applyTraining`
- `backend/Code.gs:1256` `cancelTraining`
- `backend/Code.gs:8341` `updateMemberSelf_()` は `payload.loginId` がなければ失敗するが、逆に言えば `payload.loginId` があれば処理を開始する
- `backend/Code.gs:8349` で `ログインID` から auth row を引く
- `backend/Code.gs:9870` `assertTrainingMemberApplicationWritable_()` は memberId/staffId の整合を見るための関数であり、呼び出し主体の認証証跡そのものではない

評価:

- 会員本人確認が「その loginId / memberId / staffId を payload に入れられるか」に寄っている
- `updateMemberSelf_()` は、サーバー側セッションから caller を確定していない
- 設計として IDOR に近く、匿名 API 問題と組み合わさると write risk に直結する

影響:

- 他会員プロフィール改ざん
- 他人名義での研修申込 / 取消
- 会員データ完全性の毀損

標準違反:

- OWASP Top 10 A01 / A07
- OWASP Authorization Cheat Sheet の server-side authorization 原則
- ASVS の subject binding / access control 要求

是正:

1. 会員向け write API から `memberId`, `staffId`, `loginId` の信頼境界を外す
2. サーバー側で確定した principal から更新対象を決める
3. `updateMemberSelf`, `applyTraining`, `cancelTraining`, `withdrawSelf`, `cancelWithdrawalSelf` を同じ認証ミドルウェアに通す
4. リソース所有者チェックを API 入口で統一する

### 5.3 High: パスワード保護が単発 SHA-256 + salt で、現行標準に不足する

根拠:

- `backend/Code.gs:9372-9374`
- `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ...)`
- `backend/Code.gs:9308` `generateSalt_()`

評価:

- salt 自体はあるが、memory-hard KDF ではない
- 現行標準では Argon2id, scrypt, bcrypt, PBKDF2-HMAC-SHA-256 のような反復付き KDF が基準
- ログイン失敗 5 回でロックする実装はあるが、漏えい後の offline cracking 耐性は不足

影響:

- 認証テーブル流出時のパスワード解読リスク上昇

標準違反:

- OWASP Authentication Cheat Sheet
- ASVS password storage requirements

是正:

1. 目標は Argon2id、少なくとも PBKDF2-HMAC-SHA-256 の高反復化へ移行する
2. 既存ハッシュは login 時 rehash migration を採用する
3. パスワードポリシーと初期パスワード配布運用を再評価する

### 5.4 Medium: 匿名公開かつフレーム許可で、攻撃面が広い

根拠:

- `backend/appsscript.json:26` `ANYONE_ANONYMOUS`
- `backend/Code.gs:384` `HtmlService.XFrameOptionsMode.ALLOWALL`

評価:

- 公開ポータルの匿名利用要件自体は妥当
- ただし member/admin 面まで同一匿名公開アプリで抱えた上に frame 許可までしているため、悪用余地が広い
- clickjacking、UI redressing、匿名 probing の成立性が上がる

是正:

1. 公開ポータルと member/admin を deployment レベルで分離する
2. 少なくとも member/admin 画面は frame 禁止を原則とする
3. 同一 deployment 維持が必要なら、`doGet` で public 以外を匿名利用不可に近づける補助制御を追加する

### 5.5 Medium: Least privilege と SSDF 運用証跡が弱い

根拠:

- `backend/appsscript.json` の OAuth scopes に `cloud-platform`, `drive`, `logging.read`, `userinfo.profile`, `script.projects`, `script.deployments`, `script.webapp.deploy` など広めの権限が含まれる
- リポジトリ上で、SAST / dependency audit / secret scan / security regression test の定常運用証跡を確認できない

評価:

- 一部スコープは運用上必要でも、runtime web app に不要なものが混在している可能性が高い
- ドキュメント駆動は整っているが、SSDF 的には「設計」「実装」「検証」の自動制御が弱い

是正:

1. Apps Script runtime scope と運用者 CLI scope を切り分ける方針を検討する
2. security review checklist を release gate に入れる
3. `npm audit` 相当、secret scan、dangerous API scan を CI 化する
4. 重大 API に unit test / integration test を追加する

## 6. 良い点

- `docs/*` と `HANDOVER.md` による正本管理が比較的整っている
- `T_事業所職員` の `姓 / 名 / セイ / メイ` 構造化は妥当
- 管理者認証を Google セッション + ホワイトリストに分離している
- `LockService` により一部更新競合を抑止している
- 年会費更新や一部管理操作で監査ログの考え方が入っている
- 退会・削除・バックアップに関する運用文書が存在する

## 7. アクセシビリティ評価

### 7.1 現時点の判定

- 判定: `Partial / Evidence insufficient`

### 7.2 確認できた良い点

- `PostalCodeInput` で `inputMode`, `autocomplete`, `aria-invalid`, `aria-describedby` を使用
- 各種 dialog / loading 表示 / skip link など、WCAG を意識した実装痕跡がある
- 代表者・職員の氏名入力を `氏 / 名 / セイ / メイ` へ構造化した方向性は、理解しやすさとエラー明確化の面で妥当

### 7.3 未達とは言わないが未証明の点

- キーボード操作のみでの完走
- focus trap / focus return
- 色コントラスト
- 支援技術での読み上げ順
- エラー要約から各項目への移動
- モバイル画面での target size
- WCAG 2.2 の `3.3.8 Accessible Authentication (Minimum)` 実証

### 7.4 改善案

1. WCAG 2.2 AA チェックリストを作る
2. NVDA + Chrome、VoiceOver + Safari、キーボードのみの3系統で確認する
3. `aria-live`, error summary, dialog focus management を代表シナリオごとにテストする
4. conformance statement を別紙で管理する

## 8. 仕様書更新結果

今回、以下を現行実装に合わせて更新した。

- `docs/01_PRD.md`
  - 事業所会員メンバーの自己編集範囲を `氏 / 名 / セイ / メイ / メールアドレス` 単位へ更新
  - 事業所職員入力の構造化要件を追記
- `docs/02_ARCHITECTURE.md`
  - 事業所職員入力の構造化 UI と `氏名` / `フリガナ` 再合成を追記
  - `updateMemberSelf` の `memberPortalLoginId` 優先を反映
- `docs/05_AUTH_AND_ROLE_SPEC.md`
  - 事業所会員一般職員の自己編集項目を構造化入力単位へ更新
  - UI ルールと保存時バリデーションを `氏 / 名 / セイ / メイ` ベースへ更新

## 9. 優先度付き改善計画

### 48時間以内

1. `processApiRequest` を deny-by-default に変更する
2. 匿名公開 API を allowlist 化する
3. `fetchAllData`, `getAdminDashboardData`, `getMemberPortalData`, `updateMemberSelf`, `applyTraining`, `cancelTraining` を server-side auth 必須へ変更する
4. 変更後に本番 deploy 前のレビューを実施する

### 7日以内

1. 会員向け principal 解決をセッション / 署名付き短期トークン方式へ統一する
2. public と member/admin の deployment 分離案を固める
3. 主要 API の認可テストを追加する
4. 既存 access log / login log の異常確認を実施する

### 30日以内

1. パスワードハッシュを memory-hard KDF へ移行する
2. OAuth scope の最小化レビューを完了する
3. CI に SAST / dependency audit / secret scan / security regression を組み込む
4. WCAG 2.2 AA の操作試験を完了する

## 10. 監査人コメント

このシステムは、業務理解と運用正本の整備という点では成熟してきている。
しかしグローバルスタンダードの観点では、認証後の UI の丁寧さより先に、匿名公開面と内部 API の信頼境界を閉じる必要がある。

つまり、次に投資すべきは機能追加ではなく「認可境界の再設計」である。
