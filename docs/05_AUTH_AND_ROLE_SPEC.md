# 認証・権限仕様

最終更新: 2026-04-03

## 1. 基本方針
- 会員マイページの権限制御は、ログインIDとパスワード認証に紐づく認証アカウントを基準に判定する。
- 事務局管理画面の権限制御は、Google アカウント認証とホワイトリスト照合を基準に判定する。
- 会員マイページでは、管理者向け項目を disabled 表示で残さず、会員本人に必要な情報と操作だけを表示する。

## 2. 会員種別
- 個人会員: 自身のプロフィール、自宅情報、勤務先情報、発送・通信設定を編集できる。
- 賛助会員: 個人会員に準じる。介護支援専門員番号は任意。
- 事業所会員（代表者 `REPRESENTATIVE`）: 代表者情報、事業所情報、所属職員情報を編集できる。
- 事業所会員（管理者 `ADMIN`）: 代表者情報は閲覧、事業所情報と所属職員情報は編集できる。
- 事業所会員（一般 `STAFF`）: 代表者情報、事業所情報、所属職員情報は閲覧中心。自分の氏名・フリガナ・メールアドレス、研修申込のみ操作できる。

## 3. 事業所会員の正本ルール
- 事業所には必ず 1 名の `REPRESENTATIVE` が存在しなければならない。
- 会員マイページの「代表者情報」は、`staff.role='REPRESENTATIVE'` の職員情報を正本とする。
- 保存時は、代表者職員の `lastName` / `firstName` / `lastKana` / `firstKana` / `careManagerNumber` を会員レコード上位へ自動同期する。
- 所属職員一覧の代表者行の氏名・フリガナは、会員マイページでは直接編集させず「代表者情報から自動反映」と表示する。

## 4. 事業所情報
- 事業所会員では「勤務先情報」ではなく「事業所情報」を表示する。
- 事業所情報は会員レコードの正本であり、以下を対象にする。
- `officeName`
- `officeNumber`
- `officePostCode`
- `officePrefecture`
- `officeCity`
- `officeAddressLine`
- `phone`
- `fax`
- 事業所会員では `officeNumber` を必須とする。
- 個人会員・賛助会員では `officeName` が空白または `勤務なし` の場合、勤務先なしとして扱う。

## 5. 発送・通信ルール
- 個人会員・賛助会員は、メール配信または郵送を選択できる。
- 個人会員・賛助会員は、定期発送物の送付先を自宅または勤務先から選択できる。
- 事業所会員では発送通知設定を会員側で変更しない。
- 事業所会員の固定ルールは以下のとおり。
- 郵送物: 事業所宛に 1 通送付する。
- メール: 所属職員一覧に登録された各メールアドレスへ個別配信する。

## 6. UI ルール
- 会員マイページ上部は、会員資格、年会費状況、本人に必要な導線を優先する。
- ログインIDは要約カードに重複表示せず、「ログインとパスワード」セクションでのみ表示する。
- セッション操作は左メニューのアカウント領域に統合する。
- 事業所会員向け画面では、管理用語よりも会員向け文言を優先し、`代表者情報`、`事業所情報`、`発送・通知ルール` を用いる。

## 7. 保存時バリデーション
- 個人会員・賛助会員: 自宅情報は必須。勤務先情報を入力した場合は勤務先住所・電話・FAX も必須。
- 事業所会員: 事業所情報を必須とする。`officeNumber` を必須とする。
- 事業所会員: 代表者情報の必須項目が欠けている場合は保存不可。
- 退会済み・退職日の整合、代表者 1 名制約はバックエンドで検証する。

## 8. Business Member Role Management Rules (implemented v167)
- `ADMIN` may change the role of other staff members between `ADMIN` and `STAFF`.
- `ADMIN` may not change the role of the `REPRESENTATIVE`.
- `ADMIN` may not change their own role.
- `ADMIN` may not assign `REPRESENTATIVE` to any staff member.
- `REPRESENTATIVE` retains full role-edit capability for all non-representative staff rows.
- UI enforcement: role dropdown `disabled` per-row based on caller role and target row.
- Backend enforcement: `updateMemberSelf_` strips `role` from the caller's own staff record when caller is `ADMIN`; `validateBusinessStaffRoleTransition_` blocks REPRESENTATIVE↔non-REPRESENTATIVE transitions for non-system-admin actors.
