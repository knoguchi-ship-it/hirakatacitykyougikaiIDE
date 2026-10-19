# M_ マスタの値の直書き 棚卸し（2026-10-19）

operator 指示「ハードコード部分かつ DB に M として存在するものを洗い出す」。
会員種別（M_会員種別）を直したあとも、同じ形の直書きが後から見つかり続けたため、全マスタを機械的に洗った。

- 再実行: `npm run audit:master-hardcode`（件数）／ `npm run audit:master-hardcode -- --list`（全件）
- マスタの値は gas-src の `マスタ初期値` を評価して得る。対象はマスタ 16 表。`M_申込者区分` は v360 で廃止済みのため除外した。
- 検索範囲は `gas-src/Code.full.gs` と `src/**/*.{ts,tsx,mjs}`。コメント行と初期値の定義自体は数えていない。
- 本書 §1〜§7 の数字は `aba49e2` 時点（棚卸し）。**対応の結果は §8**（2026-10-19 同日に全件対応）。

> **2026-10-19 追記（対応済み）**: §6 の形で全マスタを直した。マスタは今後も増える前提で、
> マスタ定義 に表を足せばコードを変えずに選択肢・名称・検査に乗る。直書きは prerelease の
> `test:master-hardcode` が落とす（直す前のソースでは 121 件で落ちることを確認）。§8。

## 1. 結論

| 分類 | 意味 | 扱い |
|---|---|---|
| **OPTION** | `<option>` の並び（選択肢） | **直す**。マスタの一覧から描く |
| **LABEL** | コード → 名称の対応（名称表・三項演算子・`case`） | **直す**。マスタの「名称」を使う |
| **ALLOW** | 許可値の配列（`['A','B'].indexOf`） | **直す**。`isKnownMasterCode_` で検査する |
| TYPE | TypeScript の型の列挙（`'A' \| 'B'`） | 残す。値の一覧ではなく、コードが分岐できる値の型 |
| BRANCH | `=== 'WITHDRAWN'` などの振る舞い分岐 | 残す。仕様（退会者を除く、など） |

**直す対象は、選択肢 27 群・名称表 約 80 行・許可値 7 か所。** 加えて**不具合 1 件**と、**同じコードの名称が画面ごとに違う問題**が見つかった（§3・§4）。

## 2. マスタ別の件数

| マスタ | 選択肢（群） | 名称表 | 許可値 | 型 | 分岐 | 備考 |
|---|---:|---:|---:|---:|---:|---|
| M_会員種別 | 0 | 10 | 0 | 5 | 229 | 2026-10-19 に選択肢を直した。名称表が GAS に残る |
| **M_会員状態** | **6** | 12 | 1 | 4 | 132 | 名称が画面ごとに 5 通り（§4） |
| **M_発送方法** | **3** | 5 | 0 | 1 | 43 | **不具合あり（§3）** |
| **M_郵送先区分** | **4** | 7 | 0 | 1 | 54 | |
| **M_職員権限** | **8** | 28 | 3 | 6 | 245 | 最多。名称が 4 通り |
| **M_職員状態** | **5** | 10 | 2 | 4 | 106 | 名称が 4 通り |
| M_システムロール | 0 | 4 | 0 | 0 | 41 | 名称表 `mapSystemRoleLabel_` |
| M_研修状態 | 0 | 0 | 0 | 6 | 38 | 画面の OPEN/CLOSED はマスタではなく計算値（§5） |
| M_申込状態 | 0 | 1 | 0 | 0 | 29 | |
| M_会費納入状態 | 1 | 2 | 0 | 8 | 54 | |
| M_管理者権限 | 0 | 9 | 0 | 1 | 89 | 名称表が GAS と画面の 2 か所 |
| M_出欠状態 | 0 | 5 | **1** | 1 | 15 | 許可値が配列の直書き |
| M_組織マスタ・M_役職マスタ・M_支払い種別マスタ・M_業務分類 | 0 | 0 | 0 | 0 | 0 | 管理画面のマスタ設定から読んでいる（正しい形） |

選択肢と許可値の列は、誤検出を除いた値。名称表・型・分岐の列はスクリプトの値のままで、次のような誤検出を少し含む。
- **M_管理者権限の ALLOW 126 件**: すべて `ADMIN_ACTION_PERMISSIONS`（どの権限がどの操作をできるか）。これは権限の方針で、マスタの値の一覧ではない。
- **他の意味の同じ語**: `LinePostConsole` の DRAFT・TRAINING・GENERAL（LINE 投稿の状態）、`OfficerManagement` の ACTIVE（役員の現職）、`TrainingRoster` と `TrainingMailSender` の STAFF（申込者の区分）、`mailCategories` の STAFF・TRAINING。
- **正規化の三項演算子**: `=== 'LEFT' ? 'LEFT' : 'ENROLLED'` の形。値を 2 つに寄せているだけで、許可値の一覧ではない。

## 3. 不具合: 公開ポータルの変更申請で、発送方法に `MAIL` が入る

| | |
|---|---|
| 場所 | `src/public-portal/components/MemberUpdateForm.tsx:935` の `<option value="MAIL">郵送</option>` |
| マスタ | `M_発送方法` のコードは `EMAIL` / `POST`。`MAIL` は無い |
| 経路 | 承認時に `setCol('発送方法コード', mergedPayload.mailingPreference)`（`gas-src/Code.full.gs:13818`）がそのまま書く |
| 検査 | 無い。入力規則（`入力規則定義`）は手で編集したときにしか効かず、`setValues` は素通りする |
| 影響 | 郵送を希望した会員の `T_会員.発送方法コード` が `MAIL` になる。郵送の判定は `=== 'POST'` なので、**郵送対象から外れる**（例: `postCount`・`gas-src/Code.full.gs:5061`） |
| 本番 | 未確認。`T_会員.発送方法コード` と `T_変更申請.申請内容JSON` の `MAIL` を数える（読むだけ）必要がある |

直し方は §6 の 1。

## 4. 同じコードの名称が画面ごとに違う

マスタの「名称」を使わず、画面ごとに名前を書いているためにずれている。

| コード | マスタの名称 | 画面の表記 |
|---|---|---|
| 会員状態 `ACTIVE` | 有効 | 在籍中 / 在籍 / 有効 / 有効会員 |
| 会員状態 `WITHDRAWN` | 退会 | 退会済 / 退会済み / 年度内退会 / 退会 |
| 職員状態 `LEFT` | 退職 | 除籍 / 退職 / 退職済 |
| 職員状態 `ENROLLED` | 在籍 | 在籍 / 在籍中 |
| 職員権限 `STAFF` | 一般 | メンバー / 一般 / 一般職員 / 職員 |
| 郵送先区分 `OFFICE` | 勤務先 | 勤務先 / 事業所 |
| 発送方法 `EMAIL` / `POST` | メール / 郵送 | メール配信・郵送希望 / メール・郵送 |
| 会費納入状態 `PAID` | 納入済 | 納入済み |

マスタの名称へ寄せると、表記が今と変わる画面が出る。どちらに寄せるかは operator の判断が要る（§7）。

## 5. 直す対象の一覧

`npm run audit:master-hardcode -- --list` の出力を、誤検出を除いて場所ごとにまとめた。

### 5.1 選択肢（`<option>`）

| マスタ | 場所 |
|---|---|
| M_会員状態 | `src/App.tsx:2876`（会員一覧の絞り込み）、`src/components/MemberDetailAdmin.tsx:1540`（会員詳細）、`src/components/MailingListExport.tsx:601`、`src/MemberBatchEditor.tsx:426`、`src/components/BulkMailSender.tsx:423`、`src/components/RosterDesigner.tsx:1697` |
| M_職員権限 | `src/App.tsx:2857`・`:3062`、`src/components/MemberDetailAdmin.tsx:1802`・`:1860`・`:2154`・`:2244`、`src/components/MemberForm.tsx:1662`、`src/components/application/MemberApplicationForm.tsx:1404` |
| M_職員状態 | `src/App.tsx:2866`・`:3074`、`src/components/MemberDetailAdmin.tsx:1876`、`src/components/MemberForm.tsx:1648`、`src/components/BulkMailSender.tsx:432` |
| M_発送方法 | `src/components/MemberDetailAdmin.tsx:1518`、`src/MemberBatchEditor.tsx:585`、`src/public-portal/components/MemberUpdateForm.tsx:934`（**§3**） |
| M_郵送先区分 | `src/components/MemberDetailAdmin.tsx:1525`、`src/MemberBatchEditor.tsx:601`、`src/components/MailingListExport.tsx:620`、`src/public-portal/components/MemberUpdateForm.tsx:946` |
| M_会費納入状態 | `src/components/MailingListExport.tsx:540` |

`{ value, label }` の配列で選択肢を作っているもの（名称表と同じ扱い）:
- `src/components/StaffDetailAdmin.tsx:31-38`（職員権限・職員状態）
- `src/MemberBatchEditor.tsx:324-331`（職員状態・会員状態）
- `src/components/application/MemberApplicationForm.tsx:918`（郵送先区分）・`:1252`（発送方法）

### 5.2 名称表（GAS）

| 関数・場所 | マスタ |
|---|---|
| `resolveMemberTypeLabel_`（`gas-src/Code.full.gs:3918`） | M_会員種別 |
| `mapAdminPermissionLabel_`（`:6251`） | M_管理者権限 |
| `mapSystemRoleLabel_`（`:8458`） | M_システムロール |
| `getRosterFieldDictionary_` の enumLabels（`:25640` 付近） | M_会員状態・M_発送方法・M_郵送先区分・M_職員権限・M_職員状態・M_会費納入状態（会員種別は 2026-10-19 に直した） |
| 一括メールの種別ごとシート名（`:25332`） | M_会員種別 |

### 5.3 名称表（画面）

| 場所 | マスタ |
|---|---|
| `src/components/MemberDeleteConsole.tsx:8-20` | 会員状態・職員状態・職員権限 |
| `src/components/ChangeRequestConsole.tsx:50-52`・`:81-82` | 職員権限・発送方法・郵送先区分 |
| `src/components/MailingListExport.tsx:17-30`・`:243`・`:810-824` | 会員状態・会費納入状態・郵送先区分・会員種別 |
| `src/components/BulkMailSender.tsx:110-111`・`:548` | 会員状態・職員状態 |
| `src/components/MemberForm.tsx:870`・`:881`・`:895` | 会員状態・会員種別・職員権限（会員マイページ） |
| `src/MemberBatchEditor.tsx:85`・`:544`・`:554` | 会員状態・職員権限 |
| `src/App.tsx:164-169`・`:235`・`:1723`・`:2318` | 職員権限・職員状態・管理者権限 |
| `src/components/MemberDetailAdmin.tsx:1027` | 職員権限 |
| `src/components/application/MemberApplicationForm.tsx:1385`・`:1447`・`:1449`・`:1511` | 職員権限・郵送先区分・発送方法（公開ポータル） |
| `src/components/Sidebar.tsx:207-211` | 管理者権限 |
| `src/components/TrainingRoster.tsx:18-22`・`:169` | 出欠状態・申込状態 |

### 5.4 許可値（GAS）

| 場所 | マスタ |
|---|---|
| `gas-src/Code.full.gs:9934`・`:12371`・`:14091` `['REPRESENTATIVE','ADMIN','STAFF'].indexOf` | M_職員権限 |
| `:11858`・`:13318` `['ENROLLED','LEFT'].indexOf` | M_職員状態 |
| `:13780` `VALID_MEMBER_STATUSES`（`TRANSFERRED` を含まない） | M_会員状態 |
| `:29824` `saveAttendance_` の `validStatus`（`attendanceStatus` の検査は `:29811` で `isKnownMasterCode_` 済み） | M_出欠状態 |
| 発送方法・郵送先区分 | **検査が無い**（§3） |

### 5.5 残すもの

- **型（TYPE）**: `MemberStatus` / `StaffRole` / `AttendanceStatus` など。コードが分岐できる値を TypeScript に知らせるためのもので、画面に出す一覧ではない。
- **分岐（BRANCH）**: 在籍中とみなす状態（`ACTIVE`・`WITHDRAWAL_SCHEDULED`）、退会者を除く処理、代表者だけができる操作など。マスタの行を足しても、振る舞いは決まらない。
  - 「在籍中とみなす」のように**状態の性質**で分けている分岐は、マスタに属性の列（例: `在籍扱いフラグ`）を足せば移せる。ただしスキーマの変更になるので、今回の対象から外す。
- **M_研修状態**: 画面の「受付中 / 締切済」（`OPEN` / `CLOSED`）は、締切日から計算した値。マスタの `OPEN` / `CLOSED` は旧版の行で、有効フラグは false。研修の実際の状態（`DRAFT` / `PUBLISHED` / …）の選択肢は、画面に直書きされていない。

## 6. 直し方（案）

2026-10-19 の会員種別と同じ形を、マスタ全体へ広げる。

1. **§3 の不具合を先に直す**:
   - 公開ポータルの選択肢を `POST` にする。
   - GAS の保存側に `isKnownMasterCode_(ss, 'M_発送方法', …)` と `'M_郵送先区分'` の検査を足す。
   - 本番に `MAIL` が入っているかを読むだけで数え、入っていれば直す（書き込みなので承認を得てから）。
2. GAS に `readMasterOptions_(ss, masterName)` を 1 本作る（有効な行を表示順に、コード・名称を返す）。
   - `readMemberTypeMaster_` もこれを使う形にまとめる。
3. 管理の `getSystemSettings_` と公開ポータル設定で、画面が使うマスタをまとめて返す（`masters: { M_会員状態: [...], … }`）。
4. 画面は `src/shared/memberTypeMaster.ts` を、どのマスタも扱える形（`useMasterOptions('M_会員状態')` / `masterLabel('M_会員状態', code)`）に広げる。
   - §5.1 の選択肢と §5.3 の名称表を、すべてそこから引く。
5. GAS の名称表（§5.2）と許可値（§5.4）を、`readMasterOptions_` と `isKnownMasterCode_` に置き換える。
6. `test:member-type-master` を全マスタに広げる。
   - 選択肢・名称表・許可値を直書きすると落ちるようにし、`audit:master-hardcode` の判定を prerelease の検査にする。

## 7. operator の判断が要ること

1. **名称の寄せ先（§4）**: マスタの名称に寄せると、表記が今と変わる画面が出る（会員状態 `ACTIVE` が「在籍中」から「有効」になる、など）。
   - (a) 画面の表記に合わせてマスタの名称を直してから寄せる
   - (b) マスタの名称のまま寄せる
2. **作業の順番**: §3 の不具合を先に単独で出すか、§6 の全体と一緒に出すか。
3. **本番の `MAIL` の確認**: 読むだけの確認を行ってよいか。

## 8. 対応の結果（2026-10-19）

operator 指示「ハードコード部分は直す。マスタが追加される可能性も考慮する」。

### 8.1 しくみ

| 層 | 正本の引き方 | 場所 |
|---|---|---|
| GAS（読む） | `readAllMasterOptions_(ss)` が **マスタ定義 の全表** を同じ形で読む。1 列目=コード・2 列目=名称、有効フラグ false と削除フラグ true の行を除き表示順に並べる。残りの列は `attrs` | `gas-src/Code.full.gs` |
| GAS（名称・判定） | `masterLabel_(ss, マスタ名, コード)` / `hasMasterOption_`（キャッシュを通す。行ごとの正規化向け）/ `isKnownMasterCode_`（シートを直接読む。1 件の書き込みの検査） | 同上 |
| キャッシュ | スクリプトキャッシュ 600 秒 ＋ 実行中のメモ。**マスタのシートを書き換える関数は `invalidateMasterOptionsCache_()` を呼ぶ**（スキーマ整備の後も呼ぶ）。シートを手で直したときは最大 10 分遅れる | 同上 |
| 画面へ渡す | 管理: ログインの応答（`checkAdminBySession`・全権限）と `getSystemSettings`（全表・属性つき）。会員: `getMemberPortalData`。公開: `getPublicPortalSettings`（`PUBLIC_MASTER_NAMES_` の表だけ・属性なし） | 同上 |
| 画面 | `src/shared/masterOptions.ts`（`useMasterOptions` / `masterLabel` / `useMasterLabel`）と `src/components/MasterOptionList.tsx`（`<option>` を描く）。会員種別は `src/shared/memberTypeMaster.ts`（年会費つき） | `src/` |

### 8.2 直したもの

- **不具合（§3）**: 公開ポータルの変更申請の選択肢を `M_発送方法` から描くようにした（`MAIL` が出ない）。
  GAS は会員の保存（`saveMemberCore_`・`createMember_`・`createMemberApplicationDirectLocked_`）で
  `assertMemberMailingCodes_` が発送方法・郵送先区分をマスタと突き合わせる。
  **すでに `MAIL` が入っている会員は、次に保存するときに「発送方法の値が不正です: MAIL」で止まる**（画面で選び直せば保存できる）。本番の件数は未確認（読むだけの確認は承認待ち）。
- **選択肢**: §5.1 をすべて `MasterOptionList` / `useMasterOptions` に置き換えた。
- **名称表**: §5.2 の GAS の関数 3 本（`resolveMemberTypeLabel_`・`mapAdminPermissionLabel_`・`mapSystemRoleLabel_`）を消して `masterLabel_` にした。名簿の項目辞書もマスタから引く。§5.3 の画面の名称表もすべてマスタの名称にした。
- **許可値**: §5.4 をすべて `isKnownMasterCode_` / `hasMasterOption_` にした（権限の保存 `saveAdminPermission_` の `validPerms` も同じ）。
- **一覧と件数**: 宛名リストの件数（GAS・画面）と Excel のシートを、会員種別ごと（マスタの表示順・名称）にした。研修名簿の出欠の集計の初期値も `M_出欠状態` から作る。権限・年会費状態の並び替えはマスタの表示順。

### 8.3 画面の表記が変わったところ

名称はマスタの値になる（§4 の (b)）。表記を変えたいときは、**コードではなく M_ 表の「名称」列を直す**。

| コード | 以前の画面の表記（例） | いまの表記（マスタの初期値） |
|---|---|---|
| 会員状態 `ACTIVE` / `WITHDRAWN` | 在籍中・有効会員 / 退会済・年度内退会 | 有効 / 退会 |
| 職員状態 `LEFT` | 除籍・退職済 | 退職 |
| 職員権限 `STAFF` | メンバー・一般職員 | 一般 |
| 発送方法 `EMAIL` / `POST` | メール配信 / 郵送希望 | メール / 郵送 |
| 郵送先区分 `OFFICE` | 事業所（宛名リスト） | 勤務先 |
| 会費納入状態 `PAID` | 納入済み | 納入済 |
| 会員種別（会員マイページ） | 正会員 (個人)・正会員 (事業所) | 個人会員・事業所会員 |

### 8.4 マスタを足すとき（今後）

1. `gas-src` の `マスタ定義` に表を足す（1 列目=コード、2 列目=名称、`表示順`・`有効フラグ` を持たせる）。初期値があれば `マスタ初期値` にも足す。
2. それだけで、管理画面には `masters` として届き、`useMasterOptions('M_新しい表')` / `masterLabel_` で引ける。直書き検査（`test:master-hardcode`）の対象にも自動で入る（初期値の無い表は「値をソースと照合できない」と表示される）。
3. 公開ポータル・会員マイページで使うときだけ、`PUBLIC_MASTER_NAMES_` に表の名前を足す（公開してよい表かを判断する場所）。
4. 表を参照する列があれば、`docs/er-metadata.json` のリレーションと `入力規則定義` に足す（`test:er-sync`・`test:db-relations`）。
5. その表を書き換える関数を作るときは `invalidateMasterOptionsCache_()` を呼ぶ（`test:master-options` が書き換える関数を見つけて確かめる）。

### 8.5 残したもの（許可リスト）

`scripts/audit-master-hardcode.mjs` の `ALLOWED` に理由つきで載せている。要点は §5.5 のとおり。
- 種別・状態ごとの振る舞いの分岐とその文言
- 色だけを決める表（バッジの色。文字はマスタ）
- 絞り込みの値（`ACTIVE` / `ALL` など。GAS 側の仕様）。表示名はマスタから引く
- 権限の方針（`ADMIN_ACTION_PERMISSIONS`、画面の `['MASTER','ADMIN'].includes`）
- マスタではない同じ語（LINE 投稿の状態、申込者区分の `STAFF`、締切日から計算した受付状態 `OPEN`/`CLOSED`）

### 8.6 確認

- `test:master-hardcode`: 直書き 0 件で PASS。直す前のソースでは 121 件で FAIL。
- `test:master-options`（新設・7 件）:
  - 全表の読み出し（列名の違う表・新しい表も含む）
  - 公開側に属性と許可外の表を出さないこと
  - キャッシュとメモ、invalidate の後に読み直すこと
  - マスタを書き換える関数がすべてキャッシュを捨てること
  - 画面への受け渡し
  - 発送方法の検査
- prerelease 全体 PASS。**実画面・本番での確認はリリース後**（管理 E2E は operator の再ログインが要る）。
