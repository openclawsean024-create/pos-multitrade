# Goal — International POS React milestone

## Objective

Replace the legacy status-dashboard homepage with the approved international commerce-console POS experience in `PRD/UI-SPEC.md`, while preserving existing local-first POS domain behavior and the three industry profiles.

## Acceptance criteria

- [ ] AC-001: The default surface is a real POS workbench: command rail, workspace/context bar, profile switcher, catalogue, cart, payment selection, and operational signals.
- [ ] AC-002: The UI supports fnb, retail, and service profile switching with a snapshot-before-switch interaction and preserves each profile's data boundary.
- [ ] AC-003: Product cards add to cart, quantities update, totals recalculate, payment selection is visible, and checkout writes an order through the existing domain/repository layer.
- [ ] AC-004: The UI is responsive at desktop, tablet, and mobile widths and has accessible labels, dialog semantics, keyboard escape/search behavior, and meaningful empty/error/loading states.
- [ ] AC-005: English/Traditional Chinese microcopy and workspace/channel/locale/currency extension points are present without claiming unimplemented cloud, payment, tax, or hardware integrations.
- [ ] AC-006: Existing unit/domain behavior remains intact; no tests are deleted or weakened.
- [ ] AC-007: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and the relevant browser E2E/smoke checks have evidence with exit codes.

## Constraints

- Use the existing Next.js/React/TypeScript/Dexie/Zustand stack.
- Do not add authentication, payments, cloud sync, DB migrations, secrets, or infrastructure deletion.
- Keep `PRD/UI-SPEC.md` and `PRD/COMPETITOR-BENCHMARK.md` as the design boundary.
- Do not deploy until QA and final review pass and the production target is confirmed.

## Stop conditions

- Stop on missing credentials, auth/security failures, destructive migration needs, or an unclear production target.
- If MiniMax reaches token/quota/rate-limit failure, keep the same session and follow the workspace wakeup/fallback policy; do not switch to the desktop app.
