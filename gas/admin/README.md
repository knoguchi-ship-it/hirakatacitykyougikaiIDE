# admin GAS scaffold

`gas/admin/` is the side-by-side output root for the future admin-only Apps Script project.

Current safety rules:

- Do not point the existing production fixed deployments at this directory.
- Build with `npm run build:gas:admin`.
- Keep deployment side-by-side until admin login, dashboard, and major console flows are verified.
- `appsscript.json` is copied from `backend/appsscript.json` during build for now. Scope reduction is a later step after side-by-side verification.

Expected push workflow after a dedicated admin script is created:

1. Copy `.clasp.json.example` to a local `.clasp.json` in a dedicated working copy or switch the root carefully.
2. Set the admin Apps Script `scriptId`.
3. Push only `gas/admin/` contents to the admin project.
