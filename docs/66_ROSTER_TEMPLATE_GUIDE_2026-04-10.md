# 名簿・催促テンプレートガイド
更新日: 2026-04-11
対象:
- 名簿出力コンソール
- 催促用紙テンプレート共通基盤

## 1. 概要
- テンプレートは 1 つの Google スプレッドシートに集約できる。
- 名簿出力は `ROSTER_TEMPLATE_SS_ID` を使う。
- 催促用紙は `REMINDER_TEMPLATE_SS_ID` を使う。
- 同じスプレッドシートを使う場合は、両方に同じ spreadsheet ID を登録してよい。
- 画面上では名簿出力コンソールの「テンプレートヘルプを見る」からダイアログ形式の説明を開ける。

2026-04-11 時点の実装方針:
- 名簿出力は developer metadata を優先して対象シートを選ぶ。
- metadata が無い既存テンプレートは `P_` / `B_` prefix で後方互換動作する。
- 名簿データシートは `_DATA_ROSTER` を優先し、既存の `_DATA` も後方互換で参照する。

## 2. 推奨シート構成
visible:
- `P_01_会員基本`
- `B_01_会員基本`
- `B_02_事業所職員`
- `R_P_01_催促状`
- `R_B_01_催促状`
- `R_B_02_振込案内`

hidden:
- `_DATA_ROSTER`
- `_DATA_REMINDER`
- `_GUIDE`

役割:
- `P_` 系: 個人会員 / 賛助会員の名簿テンプレート
- `B_` 系: 事業所会員の名簿テンプレート
- `R_P_` 系: 個人会員 / 賛助会員の催促状テンプレート
- `R_B_` 系: 事業所会員の催促状テンプレート
- `_DATA_ROSTER`: 名簿出力用データ
- `_DATA_REMINDER`: 催促用紙用データ
- `_GUIDE`: テンプレート作成者向け説明

## 3. シート選択ルール
名簿出力時:
- `HKC_TEMPLATE_FAMILY=ROSTER`
- `HKC_TEMPLATE_TARGET=PERSONAL_SUPPORT` または `BUSINESS`

催促用紙実装時の想定:
- `HKC_TEMPLATE_FAMILY=REMINDER`
- `HKC_TEMPLATE_TARGET=PERSONAL_SUPPORT` または `BUSINESS`

後方互換:
- metadata が無い場合、名簿出力は `INDIVIDUAL` / `SUPPORT` で `P_` を使用する。
- metadata が無い場合、名簿出力は `BUSINESS` で `B_` を使用する。

## 4. developer metadata
各表示シートに次を設定する。

| Key | Value 例 |
|---|---|
| `HKC_TEMPLATE_FAMILY` | `ROSTER`, `REMINDER` |
| `HKC_TEMPLATE_TARGET` | `PERSONAL_SUPPORT`, `BUSINESS` |
| `HKC_TEMPLATE_DATA_SHEET` | `_DATA_ROSTER`, `_DATA_REMINDER` |
| `HKC_TEMPLATE_ORDER` | `10`, `20` |

`HKC_TEMPLATE_ORDER` は PDF 内のページ順制御に使う。

## 5. `_DATA_ROSTER` 構造
### 5.1 会員データ
- Row 1: ヘッダ
- Row 2: 会員値

| 列 | 内容 |
|---|---|
| A | 会員番号 |
| B | 会員種別 |
| C | 姓 |
| D | 名 |
| E | フリガナ姓 |
| F | フリガナ名 |
| G | 事業所名 |
| H | 事業所番号 |
| I | 事業所郵便番号 |
| J | 事業所都道府県 |
| K | 事業所市区町村 |
| L | 事業所住所 |
| M | 事業所電話 |
| N | 事業所FAX |
| O | 自宅郵便番号 |
| P | 自宅都道府県 |
| Q | 自宅市区町村 |
| R | 自宅住所 |
| S | メールアドレス |
| T | 入会日 |
| U | 年会費状態 |
| V | 年会費年度 |
| W | 介護支援専門員番号 |

### 5.2 職員データ
- Row 4: ヘッダ
- Row 5 以降: 職員値

| 列 | 内容 |
|---|---|
| A | 職員番号 |
| B | 職員権限 |
| C | 姓 |
| D | 名 |
| E | フリガナ姓 |
| F | フリガナ名 |
| G | メールアドレス |
| H | 入会日 |
| I | 職員状態 |

## 6. `_DATA_REMINDER` 構造
- Row 1: ヘッダ
- Row 2: 値

| 列 | 内容 |
|---|---|
| A | 会員番号 |
| B | 会員種別 |
| C | 宛名 |
| D | 敬称 |
| E | 氏名 |
| F | 事業所名 |
| G | 郵便番号 |
| H | 都道府県 |
| I | 市区町村 |
| J | 住所 |
| K | 年度 |
| L | 請求金額 |
| M | 年会費状態 |
| N | 発行日 |
| O | 支払期限 |
| P | 銀行名 |
| Q | 支店名 |
| R | 口座種別 |
| S | 口座番号 |
| T | 口座名義 |
| U | 案内文 |
| V | 備考 |

## 7. 参照式の例
会員基本:

```gs
=IFERROR(_DATA_ROSTER!A2,"")
=IFERROR(TRIM(_DATA_ROSTER!C2&" "&_DATA_ROSTER!D2),"")
=IFERROR(TEXTJOIN("",TRUE,_DATA_ROSTER!J2,_DATA_ROSTER!K2,_DATA_ROSTER!L2),"")
```

職員一覧:

```gs
=ARRAYFORMULA(IFERROR(_DATA_ROSTER!A5:A54,""))
=ARRAYFORMULA(IFERROR(_DATA_ROSTER!B5:B54,""))
```

催促状:

```gs
=IFERROR(_DATA_REMINDER!C2,"")
=IFERROR(_DATA_REMINDER!L2,"")
=IFERROR(TEXTJOIN("",TRUE,_DATA_REMINDER!H2,_DATA_REMINDER!I2,_DATA_REMINDER!J2),"")
```

## 8. 運用ルール
1. 表示シートに手入力データを置かない。
2. `_DATA_ROSTER` / `_DATA_REMINDER` / `_GUIDE` は非表示にする。
3. 名簿用シートと催促用シートは同じブックに共存してよい。
4. 名簿出力では `R_` 系シートは出力対象にならない。
5. 既存テンプレートを流用する場合、最低限 `P_` / `B_` 命名を守る。
6. 新規テンプレートでは metadata を設定する。

## 9. サンプルテンプレート
Apps Script 関数 `createRosterTemplateExample()` で、名簿と催促状を同居したサンプルブックを生成できる。

生成される構成:
- visible: `P_01_会員基本`, `B_01_会員基本`, `B_02_事業所職員`, `R_P_01_催促状`, `R_B_01_催促状`, `R_B_02_振込案内`
- hidden: `_DATA_ROSTER`, `_DATA_REMINDER`, `_GUIDE`

## 10. 注意
- 名簿出力実行時は `_DATA_ROSTER` の値が毎回上書きされる。
- 催促用紙実行時は `_DATA_REMINDER` の値が毎回上書きされる前提で設計する。
- 既存の `_DATA` テンプレートは、名簿出力側で後方互換動作する。
## 11. 2026-04-12 運用改善
- 名簿出力画面の長い説明は縮小し、詳細説明は専用ヘルプページへ分離した。
- システム設定ではテンプレート ID だけでなくスプレッドシート URL の貼り付けも受け付ける。
- 保存前にテンプレート検証を行い、hidden シート、表示シート、metadata / prefix fallback の状態を確認できる。
- 実運用担当者向けの基本方針は次のとおり。
- 新規作成は必ずサンプルテンプレートの複製から始める。
- 本番利用中テンプレートを直接編集しない。
- hidden シートと内部シート名は変更しない。
- レイアウト変更後は設定画面の検証を通してから保存する。
