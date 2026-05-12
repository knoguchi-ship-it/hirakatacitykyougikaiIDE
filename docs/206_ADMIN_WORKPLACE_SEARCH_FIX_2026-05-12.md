# Admin Workplace Search Fix

Date: 2026-05-12
Status: implemented locally, not deployed

## Finding

v336 added `officeName` to the admin member list and annual fee search target, but the backend mapping used the wrong source column in two places:

- Admin dashboard member list: `T_会員.事業所名`
- Annual fee records: `T_会員.事業所名`

`T_会員` stores workplace / organization names in `勤務先名`. Because `事業所名` is not the active column for these records, the frontend search field received an empty `officeName` for individual and support members.

## Fix

- Changed admin dashboard `memberRows[].officeName` to `T_会員.勤務先名`.
- Changed annual fee `records[].officeName` to `T_会員.勤務先名`.
- Bumped the admin dashboard cache key suffix so the old cached rows do not keep the empty `officeName`.

## Verification

- `npm run typecheck`: PASS
- `npm run build:gas`: PASS
- `npm run build:gas:admin`: PASS
- `npm run security:public-boundary`: PASS
- `npm run security:split-boundary`: PASS
- `npm run security:admin-boundary`: PASS

Deployment is not yet performed.

## Operator Check

After deployment, verify:

1. Admin portal -> 会員管理 -> 会員一覧
2. Search an individual member by workplace office name
3. Confirm the member appears
4. Repeat in 年会費管理
