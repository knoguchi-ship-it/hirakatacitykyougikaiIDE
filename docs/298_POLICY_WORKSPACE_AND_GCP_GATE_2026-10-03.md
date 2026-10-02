# 開発拠点と GCP 移植可能性ゲート（方針）

2026-10-03 に `AGENTS.md` §4.7 / §4.8 から移した（`docs/296`）。

**これは「ルール」ではなく「方針」である。** 破ると事故になる類のものではなく、
どちらへ進むかの選択を記録したもの。常設指示から外し、該当する作業に入るときだけ読む。

内容は移送時点のまま。文言を変えていない。

---

### 4.7 開発拠点（2026-09-02 operator 決定で保守モード解除）

- **保守モードは 2026-09-02 に解除した**（operator 決定）。理由: 運用を継続しなければならず、**GCP へ移し終えるまでの間は本リポジトリ（GAS 本番）側での新規実装も必要**になったため。
  以後、本リポジトリは**通常開発モード**とし、新規機能追加・改修を通常のリリースフローで受ける。2026-08-02〜2026-09-02 の「受けない（新規の大型機能追加・大規模リファクタ）」制限は**撤廃**する。
- **ただし GCP 移行コストへの配慮は残す（禁止ではなく判断材料）**: 本リポジトリへ write 系機能を追加すると `docs/250` §6.1 の未移行 write（現状 66 method）が増え、Phase 4〜5 のコストが膨らむ。
  **大型の新規 write 機能に着手する前に、①GAS 側に実装するか GCP 側で先に作るか、②GCP へ二重実装する前提と工数、を operator に提示して方針を確認する**。小〜中規模の実装・障害修正・運用要求は確認不要で進めてよい。
- **GCP 移行作業は 2026-09-03 に一旦中断**（operator 決定）。当面の新規仕様は本リポジトリ（GAS）側で実装する。
  ただし**移行は再開前提**であり、新規仕様には **§4.8 GCP 移植可能性ゲート**（GCP で実装できない仕様は採用しない）が必ず適用される。
- **GCP 作業場は引き続き存在する（作業は中断中）**: `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP`（独立 Git・GitHub private `knoguchi-ship-it/hirakatacitykyougikaiGCP`）。移行作業の正本は同作業場。本リポジトリと GCP 作業場のどちらで作業するかは案件ごとに operator と決める。
- 本番 GAS 3 split は全業務機能の**唯一の稼働系**であり、いつでもリリースできる状態を維持する。したがって以下は従来どおり必須とする:
  - §5 の完了条件（prerelease 全ゲート → 3 split 生成物 grep → push/version/redeploy → live E2E → 正本更新）。規模の大小で簡略化してよい、は成立しない。
  - `HANDOVER.md` §1 の fixed deployment 4 本の同期維持と、ロールバック先 version の把握。
- **凍結（変更禁止）への移行時期**: `docs/250` §5 Phase 6 の「旧 GAS URL の JS 自動転送化」＝GAS アプリ本体の廃止と同時に判断する。転送化後も現行 fixed deployment は一定期間 fallback として残すため、**Phase 6 到達までは凍結しない**。
- **正本の所在（二重管理しない）**: GCP 側の実装状態・再開手順は GCP 作業場 `README.md` と `docs/*` を正本とし、本リポジトリ `HANDOVER.md` には「存在と参照」だけを書く。逆に移行計画全体（`docs/250`）と本番 GAS の現況は本リポジトリを正本とする。

### 4.8 GCP 移植可能性ゲート（2026-09-03 operator 決定・両プロジェクト共通の基本指針）

**GCP 移行作業は一旦中断し、当面の新規仕様は本リポジトリ（GAS）側で実装する。**
ただし移行は破棄ではなく再開前提であるため、**これ以降に実装する仕様は「GCP の確定構成でも同等に実装できること」を必須要件**とする。

- **GAS では実現できるが GCP へ移行できない仕様は採用しない（NG）。**
  実現したい要件がその形でしか満たせない場合は、実装前に停止し、代替設計を提示して operator の判断を仰ぐ。
- この指針は**本リポジトリ（`hirakatacitykyougikaiIDE`）と GCP 作業場（`hirakatacitykyougikaiGCP`）の両方に等しく適用**する。
  正本は本節とし、GCP 作業場 `AGENTS.md` にも同一の節を置いて同期する。
- 移行先の確定構成は `docs/250` §12（DB=Firestore／認証=IAP(admin)+Firebase Auth カスタムトークン(member)+匿名&App Check(public)／
  hosting=Firebase Hosting／API=Cloud Run／ファイル=Cloud Storage／定期実行=Cloud Scheduler + Cloud Run Job）。

#### 4.8.1 設計時の必須手順（仕様を決める前にやる）

1. **移行先を 1 行で書く**: 「この機能は GCP では何で実装するか」（例: `Firestore コレクション regulations / Cloud Run portal-api の read action`）を
   設計メモまたは release state 文書に必ず書く。書けない機能は設計が未確定とみなす。
2. **§4.8.2 の NG パターンに触れていないか確認する。** 触れる場合は代替案とセットで operator へ提示し、承認を得るまで実装しない。
3. **データ構造を Firestore に写せる形にする**: ドキュメント指向（ID をキーにした JSON）で表現でき、行番号・セル位置に依存しないこと。
4. **新規 write を追加したら `docs/250` §6.1 の未移行 write 棚卸しに追記する**（移行コストを可視化するため）。
5. リリース時は release state 文書に「**GCP 移植メモ**」の節を設け、移行先・移行時に必要な作業・注意点を残す。

#### 4.8.2 移行可否の対応表（判断の基準）

| 領域 | GAS の実装 | GCP の移行先 | 判断 |
|---|---|---|---|
| データ保存 | Spreadsheet のシート・行 | Firestore のコレクション・ドキュメント | **OK**（ID 列を業務キーにすること） |
| 画面 | HtmlService + `google.script.run` | Firebase Hosting + Cloud Run の REST API | **OK**（呼び出しは transport 抽象 `createApiClient` を必ず通す） |
| 管理者認証 | `Session.getActiveUser()` + whitelist | IAP + Cloud Run | **OK** |
| 会員認証 | loginId + password（PBKDF2） | Firebase Auth カスタムトークン（`hcmn-member-auth`） | **OK** |
| 公開（匿名） | 匿名アクセス | 匿名 + App Check | **OK** |
| ファイル・添付 | Drive | Cloud Storage + 署名付き URL | **OK**（Drive 固有機能に依存しないこと。§4.8.3） |
| メール送信 | GmailApp / MailApp | Gmail API（委任）または外部メール API | **OK**（送信元エイリアス運用は移行時に要再設計） |
| 定期実行 | 時間主導トリガー | Cloud Scheduler + Cloud Run Job | **OK**（1 実行を短く保つ） |
| 排他制御 | `LockService` | Firestore トランザクション | **OK**（全体ロック前提の設計は避ける） |
| 帳票 PDF | Google Docs/Sheets のテンプレ変換 | HTML → PDF（Cloud Run） | **要注意**（Docs 差し込み前提の設計は NG） |
| 集計 | シート数式・QUERY 関数 | アプリ側集計 / Firestore クエリ | **NG**（数式を機能の一部にしない） |

#### 4.8.3 採用しない（NG）パターン

1. **シートのセル数式・条件付き書式・ピボット・QUERY を機能の一部にする。** 計算はコードで行い、シートは値の置き場に留める。
2. **行番号・A1 参照を業務キーにする。** キーは必ず ID 列（`*ID`）とする。
3. **Drive 固有機能への依存**（`thumbnailLink`、Docs へのテンプレ差し込み変換、フォルダ共有設定を権限制御に使う等）。
4. **`google.script.run` を UI から直接呼ぶ。** 必ず `services/api.ts` の transport 抽象を経由する（v376.57 で分離済み）。
5. **Apps Script 固有 UI**（`SpreadsheetApp.getUi()`、カスタムメニュー、サイドバー、コンテナバインドのイベント）を業務フローに組み込む。
6. **operator がシートを直接編集することを前提にした運用。** 必要な操作は管理 UI として実装する。
7. **6 分の実行時間制限を前提にした長時間バッチ**。Cloud Run Job に載せ替えられる粒度（再開可能・冪等）で作る。
8. **Apps Script の Script Properties を業務データの保存先にする。** 業務データは DB（将来 Firestore）へ置く。

#### 4.8.4 運用

- 判断に迷う場合は「NG 寄り」に倒し、operator に確認する。**移行できない機能を 1 つ作ると、Phase 5（DB 移行）以降で二重実装か機能削除を迫られる**ため、
  実装前の 5 分の確認が最も安い。
- 既存機能（本節より前に作られたもの）は本ゲートの対象外だが、改修時に NG パターンへ寄せてはならない。
- GCP 移行の再開時期は operator 判断。中断中も `docs/250` は破棄せず、棚卸し（§6.1）を最新に保つ。

