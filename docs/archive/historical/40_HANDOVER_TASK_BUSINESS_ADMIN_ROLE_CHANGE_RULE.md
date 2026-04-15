# Handover Task: Business Admin Role Change Rule

Updated: 2026-04-03
Status: `done`
Implemented: `v167`
Target production baseline: `v166` / fixed deployments `@166`

## 1. Request Summary
Implement the following business-member authorization rule in the member portal:
- A business member with role `ADMIN` may change the roles of other staff members.
- That `ADMIN` user may not change the role of the `REPRESENTATIVE`.
- That `ADMIN` user may not change their own role.
- That `ADMIN` user may not promote anyone to `REPRESENTATIVE`.

## 2. Scope
Expected touch points:
- business-member role edit UI
- backend authorization check for staff-role updates
- source docs for auth/role behavior
- regression checks for representative protection and self-protection

## 3. Current State Before This Task
- `REPRESENTATIVE` is the canonical representative record.
- Business `STAFF` users are mostly read-only.
- Business `ADMIN` can edit office and staff information, but the exact role-change boundaries for other staff must be tightened by this task.
- Current production is `v166` / `@166`.

## 4. Required Rules
### Allowed
- `ADMIN` can change another user between `ADMIN` and `STAFF`.

### Not allowed
- `ADMIN` cannot edit the role of the `REPRESENTATIVE`.
- `ADMIN` cannot change their own role.
- `ADMIN` cannot assign `REPRESENTATIVE` to any staff member.

## 5. Required Document Updates
Update these together with the implementation:
- `HANDOVER.md`
- `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/03_DATA_MODEL.md` if persistence or validation rules change
- `docs/00_DOC_INDEX.md` if task status changes

## 6. Minimum Implementation Checklist
- [x] Confirm current UI and backend behavior for business `ADMIN` role changes
- [x] Add backend enforcement so UI-only bypass is impossible
- [x] Prevent self-role change for `ADMIN`
- [x] Prevent edits targeting `REPRESENTATIVE`
- [x] Prevent assigning `REPRESENTATIVE` from business `ADMIN` flows
- [x] Update docs in the same turn
- [x] Run validation and build checks
- [x] If deployed, sync both fixed deployments and record the new version

## 7. Minimum Verification
- [x] Business `ADMIN` can change another `STAFF` to `ADMIN` — UI enabled, backend passes
- [x] Business `ADMIN` can change another `ADMIN` to `STAFF` — UI enabled, backend passes
- [x] Business `ADMIN` cannot change the `REPRESENTATIVE` role row — UI disabled (`canEditThisRole=false`)
- [x] Business `ADMIN` cannot change their own role — UI disabled; backend strips `role` field from own record
- [x] Business `ADMIN` cannot assign `REPRESENTATIVE` — dropdown only offers ADMIN/STAFF; backend `validateBusinessStaffRoleTransition_` blocks it
- [x] `REPRESENTATIVE` behavior remains intact — `canEditThisRole=true` for all rows when caller is REPRESENTATIVE
- [x] `STAFF` remains read-only as before — `isReadOnly=true` makes `canEditThisRole=false`

## 8. Evidence
- Implementation version: `v167` (deployed 2026-04-03)
- Changed files:
  - `backend/Code.gs`: `updateMemberSelf_` step 1 restored; ADMIN self-role guard added; `STAFF_WRITABLE_FIELDS_ADMIN_` updated
  - `src/components/MemberForm.tsx`: `canEditThisRole` per-row logic; dropdown disabled/className/message updated
  - `backend/index.html`: rebuilt via `npm run build:gas`
- Build: `npm run typecheck` PASS, `npm run build:gas` PASS
- Pre-existing bug also fixed: `updateMemberSelf_` was missing `ss`/`authRow` initialization (step 1), causing all member self-save calls to fail with "authRow is not defined"
- Source docs updated: `docs/05_AUTH_AND_ROLE_SPEC.md`, `HANDOVER.md`, `docs/20_NEXT_INSTRUCTIONS`, this file
