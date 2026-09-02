# v376.65 / v376.65.1 リリース状態（2026-09-02）

- 本番 fixed deployment: **public @371 ×2 / member @130 / admin @227**
- ロールバック先: **public @369 ×2 / member @128 / admin @225**（v376.64）
- 位置づけ: 機能追加（規程・重要事項マスタ＝案C Phase 1）。**同意記録は Phase 2 で未着手**

---

## 1. 背景と決定

入会申込画面に会員種別ごとの規定を知る手段が無く、しかも「事務局からのお願い（重要事項）」の文面は
フロント（`MEMBERSHIP_NOTICE_HIGHLIGHTS` / `INCORPORATION_URL`）に**ハードコード**されていて事務局が改定できなかった。

operator 決定（2026-09-02）: **案C（規程マスタ＋同意記録）を採用**。ただし影響範囲調査の結果、
同意記録は cascade アーカイブ・ER・GCP 移行に追随が必要でコストが跳ねるため **Phase 分割**で進める。

- **Phase 1（本リリース）**: `T_規程` を新設し、管理 UI と公開表示を実装。**会員IDを持たない**ため
  cascade アーカイブ対応は不要、ER 追加も 1 テーブル 1 リレーションのみ。
- **Phase 2（未着手）**: `T_規程同意`（会員ID / 申請ID / 規程ID / 版数 / 同意日時）。
  ここで cascade アーカイブ登録・ER リレーション・GCP 移行方針をまとめて処理する。

## 2. 影響範囲の調査結果（Phase 1 着手前）

| 論点 | 調査結果 |
|---|---|
| 既存の「規程本文」テーブル・カラム | **存在しない**（列レベルの衝突なし） |
| 既存の「同意」概念 | `T_外部申請者.同意日時` が研修外部申込のプライバシーポリシー同意を*日時のみ*記録（版なし）。**別ドメインのため併存**とし、統合は Phase 2 で再検討 |
| 入会申込の格納先 | 独立テーブルではなく `T_変更申請`（`申請種別コード='MEMBER_APPLICATION'`）。**申込時点では会員ID未採番**で承認後に会員化＝同意記録は申請ID と会員ID の二段に跨る（Phase 2 の設計論点） |
| cascade アーカイブ | 会員IDを持つ新テーブルは `ARCHIVE_SOURCE_TABLES` と `getCascadeMatchers_` の両方へ登録が必要。**Phase 1 の `T_規程` は会員IDを持たないため対象外** |
| 公開境界 | 規程の読みは `getPublicPortalSettings` に相乗り、書きは admin action のみ。**public action は 1 つも増やしていない** |
| GCP 移行 | 管理 CRUD 3 method 増（`docs/250` §6.1 の未移行 write が増える）。Phase 2 でさらに増えるため、着手時に方針確認する |

## 3. 変更点

| 層 | 内容 |
|---|---|
| DB | `T_規程` を新設（`規程ID / 区分コード / タイトル / 本文 / 外部リンクURL / 外部リンク文言 / 対象会員種別 / 版数 / 施行日 / 表示順 / 公開フラグ / 更新者メール / 削除フラグ / 作成日時 / 更新日時`） |
| DB | `DB_SCHEMA_VERSION` を `2026-09-02-regulations-v376.65` へ更新（**これを上げないと新テーブルが作られない**。§5 参照） |
| GAS | `seedRegulationsIfEmpty_`（**空のときだけ**現行のハードコード文面 5 件を移行）／`listRegulations_` / `saveRegulation_` / `deleteRegulation_` / `validateRegulationPayload_` |
| GAS | admin action `listRegulations` / `saveRegulation` / `deleteRegulation`（`ADMIN_ACTION_PERMISSIONS` と `ACTION_TO_MENU`→`admin-settings` に登録） |
| GAS | `getPublicPortalSettings_` に `regulations`（**公開フラグの立った行のみ**）を追加 |
| 管理 UI | 設定サブナビに「規程・重要事項」を新設（一覧・追加・編集・削除、区分／対象会員種別／施行日／表示順／公開トグル） |
| 公開 UI | 重要事項ダイアログを `T_規程` 由来のデータ駆動に変更。取得できないときだけ `FALLBACK_REGULATIONS` を表示 |
| テスト | `test:regulations`（9 件）を prerelease に追加。`dryRunRegulationsV376_65_LOG`（実 DB 往復・非送信・検証行は物理削除）を追加 |

### 版数の扱い（Phase 2 への布石）

タイトル・本文・外部リンクのいずれかが変わった保存でだけ `版数` を +1 する。表示順や公開フラグだけの変更では上げない。
Phase 2 の同意記録が「どの版に同意したか」を指せるようにするため。

## 4. 検証結果

### 4.1 デプロイ前ゲート

| ゲート | 結果 |
|---|---|
| `npm run prerelease`（新ゲート `test:regulations` 含む） | **PASS（exit 0）** |
| `test:er-sync` | **PASS**（テーブル 58 / リレーション 62 / stale 0） |
| `test:menu-registry` | **PASS**（新 action 3 件を含めて 10/10） |
| 3 split 生成物 grep | **PASS**（public に `listRegulations_`、admin に CRUD 一式、dryrun.gs に dryRun） |

### 4.2 デプロイ後 live E2E

| 対象 | 結果 |
|---|---|
| 公開ポータル a11y（home / 入会申込 / 重要事項モーダル） | **違反 0** |
| 公開ポータル responsive 7VP × 3 画面 | **21 view 全 PASS** |
| 重要事項ダイアログの表示（実測） | **PASS** — 4 カード＋定款枠、リンクボタン 2 種、console error 0 |
| 管理 メール設定 E2E（設定画面の到達・非破壊） | **5/5 PASS** |
| `dryRunRegulationsV376_65_LOG` | **`passed:true` / `testRowCleanedUp:true`** — 10 チェック全 PASS |
| 管理 responsive（7VP × 8 コンソール） | **未実行**（admin セッション再失効。§6） |

dryRun の内訳: 既存 5 件を読める → 作成（版数 1）→ 読み戻し → 本文変更で版数 2 → 同内容なら据え置き
→ 公開設定に出る（6 件）→ **非公開にすると公開側から消える（5 件）** → 不正リンク（`javascript:`）拒否
→ 検証行を物理削除 → **件数が 5 に戻る**。

## 5. 途中で判明した落とし穴（次回のための記録）

**新テーブルを足したら `DB_SCHEMA_VERSION` を必ず上げる。**
初回リリース（@370）では bump を忘れたため `initializeSchemaIfNeeded_` が no-op となり、`T_規程` が作られず
dryRun が `T_規程 が初期化されていません。` で失敗した。**公開ポータル側はフォールバック文面を表示していたため
画面上は正常に見えており、dryRun を回さなければ気付けなかった**。v376.65.1（@371 / @130 / @227）で bump して解消。

- テーブル追加時のチェックリスト: ①`テーブル定義` 追加 ②`initializeSchema_` に normalize（必要なら seed）追加
  ③**`DB_SCHEMA_VERSION` bump** ④`docs/er-metadata.json` 追記 ⑤`npm run build:docs-portal` + `test:er-sync`
- スキーマ移行の初回ロードは重く、admin/public とも 45〜60s のタイムアウトが起こり得る。**ウォーム後に再実行して判定する**。

## 6. 残作業

1. **管理 responsive E2E**（`npm run test:responsive:admin`）— admin セッション再取得後に実行。
2. 実運用の文面へ更新（設定 → 規程・重要事項）。seed は現行のハードコード文面をそのまま移したもので、
   **内容は従来と同一**。改定が必要なら画面から編集する。
3. **Phase 2（同意記録）** は未着手。着手時は §2 の cascade アーカイブ・ER・GCP の 3 点を必ず処理する。
