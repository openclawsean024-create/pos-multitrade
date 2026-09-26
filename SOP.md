# pos-multitrade SOP

> 2026-09-27 · formal React implementation milestone

## Canonical commands

Run from this repository root:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
```

`npm test` currently reports the repository's known Dexie/fake-indexeddb skipped DB tests; skips are not acceptance evidence for the DB layer. Add or run browser coverage where the UI depends on IndexedDB.

## Release sequence

1. Independent QA records deterministic command output and browser smoke evidence.
2. Integrator fixes only confirmed blockers.
3. Commit with `<type>(scope): <FR/AC/UI ref> <description>`.
4. Push the intended branch.
5. Deploy only after the user-requested release gate and production target are confirmed.
6. Run the required production HTTP smoke test and sync canonical Notion Project DB with the same HEAD SHA.
