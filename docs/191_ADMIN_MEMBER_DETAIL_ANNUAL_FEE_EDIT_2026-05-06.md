# 会員詳細 年会費表示・編集追加

作成日: 2026-05-06
状態: v307 / v308 でリリース済み（2026-05-06 / admin split `@68`）

## 1. Scope

管理コンソールの会員詳細編集画面に、会員ごとの年会費情報を表示・編集するセクションを追加した。

- 年度、会費、納入ステータス、納入確認日、備考を表示する。
- 納入ステータスは `未納` / `納入済み` を編集できる。
- `納入済み` の場合は納入確認日を必須にする。
- 備考は 2000 文字上限で編集できる。
- 年会費情報は会員基本情報とは独立して年度行ごとに保存する。
- v308 で、表示年度は 2024 年度以降を下限とし、当年度から過去 4 年分までに変更した。

## 2. Design Notes

- 既存の年会費管理コンソールと同じ `saveAnnualFeeRecord` API を利用し、DB スキーマは変更しない。
- 会員詳細画面に渡される `member.annualFeeHistory` を初期表示に使う。
- v308 以降、`buildMemberAnnualFeeHistory_()` は現在年度から最大 4 年分を生成し、2024 年度より前は表示対象にしない。
- 保存成功後は `annualFeeHistory` をローカル state に反映し、親画面の `onSaved` へ更新済み会員情報を渡す。
- 管理コンソール全体の再読込制御は v306 の `unsupported_action` 修正方針を維持し、member portal action を呼ばない。

## 3. Web Reference

2026-05-06 に W3C WAI Forms Tutorial / WCAG Understanding と MDN HTMLInputElement type を確認した。

- フォームコントロールには識別可能なラベルを付与する。
- 入力エラーは対象項目と修正内容が分かるテキストで通知する。
- 日付入力などは HTML の適切な input type を使い、クライアント側だけでなくサーバー側でも検証する。

## 4. Changed Files

| File | Change |
|---|---|
| `src/components/MemberDetailAdmin.tsx` | 年会費セクション、行単位編集・保存、入力検証、保存成功時の state 反映を追加。 |
| `gas-src/Code.full.gs` | `buildMemberAnnualFeeHistory_()` を 2024 年度以降、当年度から過去 4 年分表示へ変更。 |
| `gas/admin/index.html` | `npm run build:gas:admin` で admin UI artifact を再生成。 |
| `gas/admin/Code.gs` | `npm run build:gas:admin` で admin GAS artifact を再生成。 |

## 5. Verification

- `npm run typecheck`: PASS
- `npm run build:gas:admin`: PASS
- `npm run security:admin-boundary`: PASS
- `git diff --check -- src/components/MemberDetailAdmin.tsx gas/admin/Code.gs gas/admin/index.html`: PASS
- 追加修正後 `npm run typecheck`: PASS
- 追加修正後 `npm run build:gas:admin`: PASS
- 追加修正後 `npm run security:admin-boundary`: PASS

## 6. Operator Verification Pending

実ブラウザ確認は操作者側で実施する。

- 管理コンソールで会員詳細編集を開き、年会費セクションが表示されること。
- 当年度から過去 4 年分、ただし 2024 年度以降の年会費行が表示されること。
- `未納` / `納入済み`、納入確認日、備考を変更して年度行ごとに保存できること。
- `納入済み` で納入確認日が空の場合、保存されずエラーが表示されること。
- 保存後に年会費管理コンソール側へ同じ内容が反映されること。
- 保存後に `unsupported_action` の全画面エラーにならないこと。
