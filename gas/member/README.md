# member GAS scaffold

`gas/member/` is the side-by-side output root for the future member-only Apps Script project.

Current safety rules:

- Do not point the existing public portal deployment at this directory.
- Build with `npm run build:gas:member`.
- Keep deployment side-by-side until the member script ID, deployment IDs, and verification flow are documented.
- `appsscript.json` is copied from `backend/appsscript.json` during build for now. Scope reduction is a later step after side-by-side verification.

Expected push workflow after a dedicated member script is created:

1. Copy `.clasp.json.example` to a local `.clasp.json` in a dedicated working copy or switch the root carefully.
2. Set the member Apps Script `scriptId`.
3. Push only `gas/member/` contents to the member project.
