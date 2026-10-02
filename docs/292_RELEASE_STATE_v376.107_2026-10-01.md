# v376.107 — 勤務先（所属）を本人が変更できるようにする（2026-10-01）

## 1. 何が問題だったか

operator 指摘:

> 勤務先自体を変えることができない。その為、所属の変更が出来ず、
> 今できることは会員情報の現在所属している事業所の情報のみしか変更できない。

実態はこうだった。

| | 個人・賛助会員 | 事業所会員 |
|---|---|---|
| 入会申込 | **事業所名は必須入力** | 必須 |
| 管理画面 | 編集できる | 編集できる |
| 公開ポータルの変更申請 | **項目が無い** | `事業所基本情報`（名称・メール・電話・FAX）で変更可 |

**画面にチェックボックスが無いだけでなく、サーバの `PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_` にも
`officeName` が入っていなかった。** 二重に塞がれていた。

### なぜ良くないか

1. **不整合なレコードを作る方へ誘導していた。** 転職した人は勤務先の住所と電話だけ変えられるので、
   「A 事業所の名前 ＋ B 事業所の住所・電話」という行ができる。項目を塞ぐことで整合性を守るどころか、
   壊す側に倒れていた。
2. **郵便が前職に届く。** BR-04 に「郵送先区分が勤務先のとき、勤務先は**事業所名のみ必須**」とある。
   宛名を決める唯一の項目が、本人から変更できない唯一の項目だった。
3. **退職＝無所属を表現できない。** BR-04 で「勤務先名が空または `勤務なし` の場合は勤務先なし」と
   定義されているのに、本人から `勤務なし` にする手段が無かった。

### 仕様書自体が食い違っていた

| 箇所 | 記述 |
|---|---|
| BR-01（原則） | 個人会員は「自身のプロフィール・自宅情報・**勤務先情報**・発送／通信設定を編集できる」 |
| 変更可能項目の一覧 | 「氏名・カナ／連絡先／勤務先**連絡先**／勤務先住所／…」← **名称が無い** |

意図的に除外した形跡（コメント・決定記録）は無く、`careManagerNumber` のような
「ログインIDが変わるから」という理由も無い。**抜け**と判断した。

## 2. リレーション検証（改修前に確認）

operator から「整合性・relation 上崩れないなら」と条件が付いたので先に確認した。**崩れない。**

### `勤務先名` は外部キーではない

`docs/03` のリレーション定義に `T_会員.勤務先名` を参照する辺は無い。会員まわりはすべて ID で結ぶ。

```
T_事業所職員   }o--|| T_会員 : "会員ID"
T_認証アカウント }o--|| T_会員 : "会員ID"
T_認証アカウント }o--o| T_事業所職員 : "職員ID"
```

個人会員の `勤務先名` / `事業所番号` はただの属性で、他の会員レコードを指していない。

### 勤務先名で join している箇所は個人会員に掛からない

| 箇所 | 実態 |
|---|---|
| `matchesPublicIdentityName_`（本人確認の名義照合）| **`勤務先名` を使うのは `BUSINESS` のときだけ**。個人・賛助は 姓・名 で照合 → 本人確認は壊れない |
| 宛名リストの `officeNameByMemberId` | **`BUSINESS` の行だけ**を集める |
| 職員の勤務先名 | `parentMember['勤務先名']` から引く（職員自身の列ではない）→ 個人会員の変更と無関係 |

影響するのは表示と宛名（名簿出力・宛名リスト・メール差し込み）だけで、
**新しい勤務先名が出るのが期待動作**。

### ただし守るべき整合性ルールが 1 つある

`validateMemberPayload_`:

```
郵送先区分 = 勤務先 → 勤務先名が必須
郵送先区分 = 自宅   → 自宅の〒・都道府県・市区町村・住所が必須
```

**`勤務なし` は非空文字なので必須チェックを素通りする。** 郵送先が勤務先のまま勤務なしにすると
「勤務なし」宛の郵便が出る。この組み合わせを作らせないようにした。

## 3. 変更内容

### サーバ

- `PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_` に `officeName` を追加
  （賛助会員は個人会員から `careManagerNumber` を外した派生なので自動的に含まれる）
- `isNoOfficeAffiliation_` / `NO_OFFICE_AFFILIATION_LABEL_` を新設
- `validateMemberPayload_` が **「勤務なし」×「郵送先＝勤務先」を拒否**する
  （管理画面からの編集にも同じルールが掛かる）

公開 split の生成物には `validateMemberPayload_` 自体が無い（会員レコードを直接書かない）ため、
`isNoOfficeAffiliation_` も依存ごと pruning で落ちる。member / admin には定義・参照とも入っている。

### 画面

- 公開ポータルのグループを **「勤務先（事業所）」**（事業所名・電話番号・FAX番号）に改め、事業所名を追加。
  事業所会員の `事業所基本情報` と同じ形。
  **事業所名を単独グループにしなかった**のは、転職した人が「名称」と「電話」を別々にチェックして
  片方を忘れるため（`test:office-affiliation` が単独グループ化を禁止する）。
- **「現在は勤務していない」** を追加。選ぶと `勤務先名 = 勤務なし`、勤務先の電話／FAX を空に、
  **郵送先区分を自宅へ**切り替える。入力欄は無効化する。
- 「現在は勤務していない」を選ぶと **自宅住所のグループを自動で開く**。
  自宅住所が未登録のまま承認すると「自宅郵便番号が必須です」で**承認が落ちる**ためで、
  会員側は自分の登録状況を見られない（公開ポータルは会員データを返さない）。
  既に登録済みなら空欄のままでよい（空欄＝変更なし。承認時は現在値で補完される）。

### 判定の置き場

`src/shared/officeAffiliation.ts` を新設し、管理画面のインライン判定（`MemberForm.tsx`）も
そこへ寄せた。GAS はローカル実装を持つ（`validators.ts` と同じ方針。build 注入の経路を増やさない）。
`npm run test:office-affiliation` が文言と判定の一致を検査する。

## 4. 退職の経路

| 誰が | 対象 | 手段 |
|---|---|---|
| **本人** | 個人会員・賛助会員 | **今回新設**「現在は勤務していない」 |
| **事業所会員の権限者** | 所属する職員 | **既存の「職員を除籍する」**（承認時に `職員状態コード = LEFT`）|

operator 指示の「事業所会員の権限者から」は**既に実装済み**だった。追加開発は不要。

**職員本人からの退職届け出はできない。** 職員は会員ではなく、公開ポータルで自己を名乗る経路
（本人確認の種別）が無いため。可能にするには職員用の本人確認を新設することになり、
公開面の書き込み経路が 1 つ増える。今回は範囲外とした。

## 5. 検証

- prerelease PASS、typecheck PASS。
- `test:office-affiliation` 10 件を新設:
  判定（空欄・予約語・前後空白・null）／GAS とフロントの判定一致／予約語の一致／
  allowlist に `officeName` がある／画面が送る／単独グループにしない／
  勤務なしが郵送先を自宅へ寄せる／サーバが組み合わせを拒否する／
  検証が保存の中核から必ず通る／画面が `勤務なし` を直書きしない。
- 3 split 生成物で `validateMemberPayload_` と `isNoOfficeAffiliation_` の定義・参照が揃うことを確認。
- **実データ確認は未実施。**

## 6. 実装中に見つけて直したこと

- 整合性ガードを置いた場所は `saveMemberCore_` ではなく **`validateMemberPayload_`** だった
  （検証ロジックは別関数に分かれている）。テストの記述を実態に合わせ、あわせて
  「`saveMemberCore_` が検証を必ず呼ぶ」ことも固定した（迂回経路を作らせない）。

## 7. v376.107.1 — `script.scriptapp` スコープ追加（2026-10-02）

### 症状

operator が `jobs.gs` の `setupScheduledTriggers` を実行したところ:

```
Exception: Specified permissions are not sufficient to call ScriptApp.getProjectTriggers.
Required permissions: https://www.googleapis.com/auth/script.scriptapp
setupScheduledTriggers @ jobs.gs:30
```

### 原因

**`appsscript.json` に `oauthScopes` を明記すると、それが確定リストになり GAS の自動検出は効かない。**
`ScriptApp.getProjectTriggers()` / `newTrigger()` / `deleteTrigger()` に必要な
`https://www.googleapis.com/auth/script.scriptapp` が **3 split のどれにも入っていなかった**。

つまり **`setupScheduledTriggers` はそもそも一度も実行できなかった**。
既存のトリガー（`warmUp` 等）は Apps Script の画面から手で作られたものと考えられる。

§1（`docs/archive/release_history/289`）では「pruning でハンドラが生成物から消えていた」ことを
原因として書いたが、**仮にハンドラが残っていてもこの関数は権限不足で落ちていた**。
原因は 2 つ重なっていた。

### 対処

- `gas/admin/appsscript.json` に `script.scriptapp` を追加（**管理者 split のみ**）。
- `test:scheduled-jobs` に 2 件追加:
  - 管理者 split がこのスコープを持つ
  - **トリガーを持たない公開・会員 split には広げない**（定期ジョブは管理者 split だけ、を機械で守る）

Web App への影響は無い。管理画面のコードは `ScriptApp` のトリガー API を使わず、
既存の grant のまま動く（スコープ追加で grant は自動失効しない）。

### 結果

admin @274 へ反映後、`setupScheduledTriggers` が成功:

```
setupScheduledTriggers: 現在のトリガー = dailyWithdrawalPolicyTrigger
```

**日次ジョブ（退会予定→退会確定の昇格）が復活した。**
`processPendingThumbnails` は登録されていなかったので `setupPendingThumbnailsTrigger` を別途実行する。

心拍は「ジョブが一度成功してから」記録されるため、`checkScheduledJobHealth` は
日次ジョブが初回（翌 02:00）に走るまで `overdue: true` を返す。これは正常。

## 8. 定期ジョブ復旧の完了確認（2026-10-02）

operator 実行の記録。

| 手順 | 時刻 | 結果 |
|---|---|---|
| 統合／公開の `warmUp` トリガー削除 | 09-28 | 完了 |
| `setupScheduledTriggers` | 10-02 11:02 | `現在のトリガー = dailyWithdrawalPolicyTrigger` |
| `setupPendingThumbnailsTrigger` | 10-02 11:04 | `trigger installed (every 10 min)` |
| `checkScheduledJobHealth`（1 回目） | 10-02 11:04 | 両方 `lastOkAt: ""` / `overdue: true` |
| `checkScheduledJobHealth`（2 回目） | 10-02 11:35 | **`processPendingThumbnails` に心拍** |

```
processPendingThumbnails     lastOkAt: 2026-10-02T02:35:51.683Z  ageMinutes: 0  overdue: false
dailyWithdrawalPolicyTrigger lastOkAt: ""                        ageMinutes: null  overdue: true
```

**心拍の仕組みが実データで動くことを確認した。**
トリガー発火 → ジョブ実行 → 心拍記録 → 死活チェックが読む → 遅れ判定の解除、まで一連で通った。
v376.104 で入れた「黙って止まらないようにする」仕組みの実証。

1 回目で両方 `overdue: true` だったのは設計どおり。心拍はジョブが一度成功してから記録されるので、
トリガーを作り直していない状態を正常に見せない。

`dailyWithdrawalPolicyTrigger` は毎日 02:00 が初回。それまでは `overdue: true` のままで、
管理画面を開くたびに Chat へ 1 日 1 回「定期ジョブが動いていません」が流れる（実際にまだ走っていないので正しい）。
翌 02:00 以降に止まる。
