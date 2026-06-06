# テスト観点表によるコード・ドキュメント評価（2026-06-06）

対象: 当セッションの成果 **v376.32〜v376.37**（公開ポータル研修ディープリンク / モーダル入力フォーカス喪失修正 / 任意項目トグル有効・無効化＋公開反映 / 申込URL 無効＝申込ボタン非表示 / _archive データモデル整備 / ER 単一情報源化）。

評価基盤: **ISO/IEC 25010:2023**（製品品質モデル 9 特性。Safety 追加・Usability→Interaction Capability 改称）＋「テスト観点表 5 ステップ（要件分析→リスク分析→設計→観点整理→レビュー）」。

凡例: **◎**十分検証 / **○**検証済(軽微残) / **△**部分・要操作者確認 / **✗**未検証(ギャップ) / **N/A**

## A. 品質特性観点（ISO/IEC 25010:2023）

| # | 観点（確認内容） | 対象 | 検証方法 | 結果 | 所見 |
|---|---|---|---|---|---|
| 1.1 | 正常系: `?t=<ID>`/`?p=<page>` が指定画面へ直行 | deep-link | 単体15 + ライブE2E6(happy-path含) | ◎ | T004 で申込画面直行を本番実証 |
| 1.2 | 異常系: 不正ID/受付外→一覧+通知 | deep-link | ライブE2E | ◎ | フォールバック確認 |
| 1.3 | 境界/設定: 申込URL 3状態 CTA | v376.35 | 単体 + 部分ライブ | △ | 「無効=ボタン非表示」ライブは admin 設定要→operator |
| 2.1 | 性能: 無駄なAPI往復なし | deep-link | コード(getPublicTrainings 再利用) | ○ | 計測は未 |
| 3.1 | 互換: 3境界分離維持 | 全リリース | `security:*-boundary` PASS | ◎ | public top-level 不変 |
| 3.2 | 互換: GAS 予約語(c/sid)回避 | deep-link | 単体+公式準拠 | ◎ | |
| 3.3 | 回帰: 既存研修の申込ボタン維持 | v376.34/35 | コード論理(既定有効) | ○ | 全研修ライブ網羅は未 |
| 4.1 | 使用性: deep-link 着地UX/通知 | deep-link | ライブE2E | ◎ | |
| 4.3 | 使用性: レスポンシブ 320–1920 | 公開UI | `test:responsive`(本日実施) | **◎** | **全7ビューポート横スクロール無し PASS** |
| 4.4 | a11y: WCAG 2.2 AA | 公開UI | `test:a11y`(本日実施) | **○** | critical=0。**serious 1件(色コントラスト)を本日是正**（下記 §C） |
| 5.1 | 信頼性: cold-start で UI 初期化後に適用 | deep-link | ライブE2E | ◎ | |
| 5.2 | 信頼性: archive 移動の堅牢性 | v376.36 | source のみ | **✗** | 移動関数 pruned=未稼働・runtime 未検証(dead code) |
| 6.1 | セキュリティ: 入力 sanitize(allowlist/XSS拒否) | deep-link | 単体+ライブXSS E2E(alert不発) | ◎ | OWASP allowlist 準拠を実証 |
| 6.2 | セキュリティ: public 露出最小 | 全リリース | boundary audit | ◎ | |
| 6.3 | セキュリティ: 依存(サプライチェーン) | 全体 | `npm audit`(本日実施) | **○** | **7→5 moderate に低減(`npm audit fix`)。残5は breaking 要で見送り・high=0** |
| 6.4 | セキュリティ: シークレット非取扱(§0) | 全体 | 手順遵守 | ◎ | OAuthコード復唱せず |
| 7.1 | 保守性: ERドリフト根絶 | v376.37 | `test:er-sync` PASS | ◎ | 単一情報源化（大幅改善） |
| 7.2 | 保守性: DRY/共有ヘルパー | 全体 | コード | ○ | trainingOptions/deepLink/er-model |
| 7.3 | 保守性: テスト追加(prerelease) | v376.32/37 | prerelease | ◎ | test:deeplink/test:er-sync |
| 9.1 | 安全性: 破壊的操作の承認ゲート | v376.36 | 文書化・未活性 | ◎ | archive 物理削除は §4.10 承認手順 |
| 9.2 | 安全性: データ消失防止(archive先書き) | v376.36 | 設計(未稼働) | ○ | |

## B. ドキュメント・横断観点

| # | 観点 | 結果 | 所見 |
|---|---|---|---|
| D.1 | 正確性 | ○ | 初回 archive 説明の dead-code 見落としを自己訂正（正確性プロセスは機能） |
| D.2 | コード↔doc 整合 | ◎ | ER は `test:er-sync` で恒久担保。版マーカー同期 |
| D.3 | 最新性・網羅性・文字化け | ◎ | HANDOVER/09/00/release-notes 同期、置換文字(U+FFFD) ゼロを各コミットで確認 |
| D.5 | 引継ぎ性 | ◎ | §2-2 延期タスク・復活手順明記 |
| X.1 | デプロイ整合 | ◎ | `deployments --json` 各リリース確認。v376.36/37 未デプロイ=設計通り |
| X.2 | 実ブラウザ確認(admin/member) | △ | §0 により AI は公開のみ。admin/member は operator 待ち(§2-1) |
| X.3 | member マイページ 項目トグル一貫性 | △ | 未適用(public のみ)・follow-up 記録済 |

## C. 本評価で検出・是正した事項（2026-06-06）

1. **a11y serious（色コントラスト）→ 是正**: 公開ホームの「TRAINING」バッジ等 `bg-sky-600`＋白文字 ≈ 3.9:1（WCAG 2 AA 4.5:1 未達）。`bg-sky-700`（≈5.3:1）へ変更（v374 の emerald-700 化と同方針。`src/public-portal/App.tsx` 2 箇所）。→ **v376.38 で反映**。
2. **npm 依存**: `npm audit fix` で moderate 7→5。残5は `--force`（breaking）要のため見送り、high/critical=0 を維持。

## D. 残ギャップと推奨次アクション（優先度順）

1. **(X.2 / 1.3) admin/member 実機確認** — 申込URL無効=ボタン非表示・モーダル入力・トグル公開反映を operator が実機確認（§2-1 に統合）。**AI は実施不能（§0）**。
2. **(6.3) 残 npm moderate 5 件** — breaking 更新の可否を判断のうえ計画的に解消。
3. **(5.2) archive 移動の runtime 検証** — 機能活性化時に dryRun 必須（§4.10）。
4. **(X.3) member マイページのトグル一貫化** — 任意。

## 結論
機能・セキュリティ・保守性・ドキュメントは高水準で検証済。本評価で公開 UI の a11y/レスポンシブ/依存を実測し、**a11y serious と npm moderate 2 件を是正**。残ギャップは「AI 実施不能な admin/member 実機確認」「breaking を伴う依存更新」「未活性 archive の runtime 検証」で、いずれも HANDOVER に追跡可能。**ブロッカーなし**。
