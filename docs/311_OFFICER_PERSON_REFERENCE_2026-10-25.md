# 役員まわりの人物の参照をそろえる（2026-10-25）

`docs/307` F31 の本対応。事業所職員の役員にも支払いを記録でき、役員の登録・編集・紐づけ変更が人単位で正しく動くようにする。

## 1. 決めたこと（operator）

| | 決定 |
|---|---|
| 支払いの受取人 | **役職者本人**を原則とする（事業所ではない） |
| 設計 | 「役員者」表を新設せず、**システム全体の人物の参照（会員ID か 職員ID）に役員まわり 4 表をそろえ、判定を 1 か所に集める** |

「役員者」表を新設しなかった理由: 「会員ID か 職員ID のどちらか」は研修申込・認証アカウントも使うシステム全体の決まりで、
会員の削除（アーカイブ移動）・テストデータの物理削除・人物の統合もその上に作られている。役員だけ別の決まりにすると、
本番データを消す・移す仕組みまで作り替えることになり、直し漏れが気づきにくい事故（行が残る・口座が付いてこない）になる。

## 2. 何が問題だったか

| 問題 | 中身 |
|---|---|
| 支払いに職員を記録できない | `T_支払い` だけ 職員ID が無い。本番の現役役員 7 名のうち 5 名が事業所職員（会員ID が空）で、選ぶと受取人が空になった |
| 判定が約 20 か所に散らばる | 「会員なら会員ID・職員なら職員ID」を各関数が個別に書いていた。1 か所書き忘れると職員だけ使えない |
| 紐づけ変更が役職 1 行ずつ | 役職を 2 つ持つ人の片方だけ付け替えると、口座だけ新しい ID へ移り、もう片方の役職は古いまま（食い違い） |
| 請求の過去分が付いてこない | 紐づけ変更は請求を元のまま残した（人物の統合は移すのに）。新しい ID でログインした本人に過去の請求が出ない |
| 絞り込み | 請求管理・支払いの「会員」絞り込みが会員ID で人を区別し、職員の役員が全員「空」1 つにまとまった |
| 職員の請求から支払い | 請求の会員ID（空）を受取人にしたため登録できなかった |

## 3. 直したこと

### 3.1 表

- `T_支払い` の**末尾**に `職員ID` を追加（`planTableColumnNormalization_` は append = 見出しを書き足すだけ）。
  `T_支払い_archive` は列の途中に入るので rebuild（本番の支払いは 0 件）。
- 表の関係に `T_支払い.職員ID → T_事業所職員`。ER（`docs/er-metadata.json`）も同じ。DB では守られない ID 参照は 29 → 30 件（`docs/294` §3）。
- `DB_SCHEMA_VERSION` は**リハーサルで OK を確かめてから**上げる（`docs/308` §3 の順番）。

### 3.2 人物の参照の共通関数（gas-src・画面）

| GAS | 画面（`src/shared/officerPerson.ts`） | 役割 |
|---|---|---|
| `officerPersonRef_` | `officerPersonRef` | 職員ID があれば職員、無ければ会員 |
| `officerPersonKey_` | `officerPersonKey` | `staff:…` / `member:…`。人を数える・比べるキー |
| `rowBelongsToOfficerPerson_` | — | 行（会員ID・職員ID 列）がこの人のものか |
| `claimRowBelongsTo_` | — | `findRowByColumnValue_` の結果版 |
| `officerPersonDisplay_` | — | 表示名と所属 |
| `OFFICER_PERSON_TABLES_` | — | 役員まわり 4 表（付け替えの対象） |

### 3.3 置き換えた箇所（影響範囲）

| 区分 | 関数・画面 |
|---|---|
| 役員の登録・編集 | `assignOfficer_`・`updateOfficerRecord_`（二重就任の判定）・`autoRetireOfficerByStaffId_`・`getOfficerManagementData_`（人物キーを返す） |
| 紐づけ変更 | `updateOfficerLinkage_`: **人単位**で 4 表をまとめて付け替え。同じ役職が 2 つ現職になる・口座が 2 つになる・同じ人物のときは**書き込む前に止める** |
| 役員の判定 | `isActiveOfficer_`・`getMemberOfficerStatus_`・`getOfficerSelectableOrganizationCodes_` |
| 請求 | `saveClaim_`・`getMyClaims_`・`deleteMyClaim_`・`uploadClaimAttachment_`・`removeClaimAttachment_`・`getClaims_`（人物で絞り込み） |
| 口座 | `getBankAccount_`・`saveBankAccount_`・`saveMemberBankAccount_`・`deleteBankAccount_` |
| 支払い | `savePayment_`（会員ID か 職員ID・本人の口座を写す・職員ID 列が無い表には書かない）・`getPaymentHistory_`（人物で絞り込み・職員は「氏名（事業所名）」） |
| 会員の削除 | `getCascadeMatchers_`・`runDeleteCascade_`・`buildLogicalDeletePlan_`: 支払いも職員ID で集める |
| テストデータの物理削除 | `buildTestDataPurgePlan_`: 同上 |
| 人物の統合 | `migratePersonOwnedReferences_`: 4 表を同じく付け替える（支払いは以前は会員→会員のときだけ） |
| 診断・リハーサル | `diagnoseMemberDeleteDebt_LOG`（T_支払い.職員ID）・`rehearseTableWriteRead_`（T_支払い を書いて読む） |
| 画面 | 支払い（受取人・絞り込みを人物キーで。暫定の「未対応」表示を外す）・請求管理（絞り込み・支払いへの引き継ぎに職員ID）・役員管理（紐づけ変更の説明） |

## 4. 検査

`test:officer-person`（10 件・変更前の生成物では落ちる）:
人物キーの規則が GAS と画面で同じ／職員のセッションは事業所の会員ID の役職を拾わない／職員の役員を受取人にでき本人の口座を写す／
職員ID 列の無い表には書かない／支払い履歴の絞り込み・表示名／紐づけ変更は人単位で 4 表を付け替え他の人に触れない／
衝突するときは書き込む前に止める／会員の削除が職員への支払いを含む／人物の統合が 4 表を付け替える／
役員まわり約 20 関数と画面 2 本に人物の判定の直書きが無い。

## 5. 本番への反映（未実施）

1. スキーマの版を据え置いて push → 管理 HEAD から `rehearseSchemaMigrationOnCopy_APPLY`（本番 DB のコピー）
2. 方針（T_支払い = append・T_支払い_archive = rebuild を想定）・既存データの変化 0・2 回目の変化 0・書いて読む（T_支払い を含む）を確認
3. operator の承認 → 版を上げてリリース → リリース後に整備済みのコピーでもう一度
4. 本番確認（読むだけ）: 支払いの受取人に職員の役員が出る・役員管理の一覧・請求管理の絞り込み

**本番での支払い登録・紐づけ変更の書き込み確認は未実施**（書き込みを伴う。★テストデータで行うなら別途承認）。
