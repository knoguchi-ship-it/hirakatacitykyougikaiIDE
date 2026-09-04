# v376.72 リリース状態（2026-09-04）

- 本番 fixed deployment: **public @381 ×2 / member @140 / admin @237**
- ロールバック先: **public @380 ×2 / member @139 / admin @236**（v376.71）
- 位置づけ: **保守（DRY 是正）＋ 文書整備**。機能の追加・変更は無い
- **スキーマ変更なし**（`runRebuildSchemaForV*` の実行は不要）

---

## 1. 直した問題

`T_研修申込.申込ID` の採番が**4 箇所に散らばり、3 通りの形式**が同じ列に入っていた。

| 経路 | 関数 | 旧形式 |
|---|---|---|
| 会員マイページからの申込 | `applyTraining_` | `AP-` ＋ 10 桁（大文字） |
| 公開ポータルからの外部申込 | `applyTrainingExternal_` | **素の UUID**（小文字・ハイフンあり） |
| 管理: 名簿へ会員/職員を手動追加 | `addRosterEntry_` | `AP-` ＋ **8 桁** |
| 管理: 名簿へゲストを手動追加 | `addGuestRosterEntry_` | `AP-` ＋ **8 桁** |

> 引継ぎ（`HANDOVER.md`）には「2 箇所・2 形式」と書かれていたが、**実際は 4 箇所・3 形式**だった。
> 管理側の名簿手動追加 2 経路が見落とされていた。

一意性は保たれるため**実害は出ていない**が、同じ列の採番規則が 4 箇所で独立して決まっている状態は
`AGENTS.md` §3（DRY・単一情報源）に反する。

## 2. 実装

`generateTrainingApplyId_()` を新設し、上記 4 経路すべてがこれを呼ぶ形に変更した。
形式は **`AP-` ＋ UUID 先頭 10 桁（大文字）** に統一（既存の多数派に寄せた）。

- **既存データは振り直していない。** 申込 ID は公開ポータルの申込取消で本人確認に使われるため、
  振り直すと利用者の手元にある受付番号が無効になる
- 取消・照合は `String(r['申込ID']) === applyId` の**完全一致**で引くため、
  旧 2 形式の ID も引き続き問題なく引ける（この性質をテストで固定した）

## 3. 検証

| 種別 | 内容 | 結果 |
|---|---|---|
| 新規 unit test | `npm run test:training-apply-id`（4 ケース） | **PASS** |
| prerelease 全ゲート | 26 スイート | **PASS**（`npm audit` は既知のネットワーク罠で 2 回失敗 → 3 回目で疎通・脆弱性 0） |
| 3 split 生成物 grep | `generateTrainingApplyId_` の定義 1・呼出（public 2 / member 2 / admin 3）、`テーブル定義`・`processApiRequest` の残存 | **PASS** |
| 生成物の未定義参照 | `npm run test:gas-artifact-refs` | **PASS**（public 136 / member 188 / admin 474 関数） |
| 公開 a11y（live） | `npm run test:a11y` | **PASS**（critical/serious/moderate/minor すべて 0） |
| 公開 responsive（live） | `npm run test:responsive` 7 VP | **PASS**（`result.json`: consoleErrors 0・横スクロール 0） |
| 管理 responsive（live） | `npm run test:responsive:admin` 7 VP × 8 コンソール | **PASS**（`result-admin.json`: 延べ 56 view・不合格 0・consoleErrors 0） |
| 会員 responsive（live） | `npm run test:responsive:member` | **未実施**（§5） |

新規テストが固定していること:

1. 採番の実装が `generateTrainingApplyId_` の 1 つだけであること
2. 申込を作る 4 経路がすべてその関数を呼ぶこと（`'AP-'` の直接連結・素の UUID を禁止）
3. 生成される ID の形が `AP-` ＋ 英数 10 桁であること
4. 取消の照合が完全一致であること（形式を変えても既存 ID が引けること）

## 4. 同時に入れた文書の整合確認（機能変更なし）

`docs/267` テンプレート v3.0 §4 の 8 項目を `docs/spec/` の 5 文書に適用した。
**実装と食い違っていた記述 4 件**を修正している。

| 箇所 | 誤 | 実際 |
|---|---|---|
| SOW §4.1・RD §3.2・SOW リスク No.8 | ログイン試行制御は未実装（5 回で無期限ロック） | **v376.71 で実装済み** |
| RD BR-15 | セイ/メイ は半角カナのみ | **全角カタカナへ正規化**（v376 で半角カナ制限を廃止） |
| データIF §5.3 | admin の action 114 | **118**（実測。`ACTION_TO_MENU` と一致） |
| UI/UX §7 | パンくず修正は未リリース | **v376.70 でリリース済み** |

構造面では、SOW の節番号ずれに起因する**他文書からの参照切れ 8 箇所**、
**TRD ⇄ データIF の循環参照**、**重複 2 件**、**存在しない ID 参照（Q-08）**を解消し、
未確定事項を **SOW §8（U-01〜U-26）へ集約**した。

新規: [`docs/268_SPEC_TRACEABILITY_2026-09-04.md`](268_SPEC_TRACEABILITY_2026-09-04.md)
（要件ID → 検証方法 → 実装の所在）。仕様書は 5 文書のまま増やしていない。

## 5. 残課題

| # | 内容 | 状態 |
|---|---|---|
| 1 | **会員マイページの responsive E2E が未実施** | `.env.test` の会員資格情報でログインできず（`[member] 認証切れの可能性がある`）。**operator に資格情報の確認を依頼中**。管理・公開は実施済みで、本リリースは会員側の画面・書込フローに触れていない |
| 2 | 恒久ロック（連続 20 回）の管理画面からの解除手段 | 未実装。operator 判断待ち（SOW §8 U-26） |
| 3 | 文書重複の機械検査 `test:docs-single-source` | 未実装（SOW §8 U-22） |

## 6. GCP 移植メモ（`AGENTS.md` §4.8.1-5）

- **移行先**: `generateTrainingApplyId_` は Cloud Run 側の申込サービスへそのまま移す（純関数）。
  `Utilities.getUuid()` を `crypto.randomUUID()` に置き換えるだけで等価。
- **移行時に必要な作業**: なし。Firestore ではこの ID を `trainingApplications` の**ドキュメント ID** に使える
  （行番号に依存しない・`AGENTS.md` §4.8.2 の OK 条件を満たす）。
- **注意点**: 既存データに 3 形式が混在したまま移行される。**移行スクリプトで振り直さないこと**
  （利用者の手元の受付番号が無効になる）。
- **未移行 write の増減**: 増減なし（既存 write の内部実装の変更のみ。`docs/250` §6.1 の棚卸しに変更なし）。
