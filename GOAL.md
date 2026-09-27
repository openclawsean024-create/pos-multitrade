# Goal — Astro international POS shell

## Objective

Use the Astro prototype in `prototype/astro-pos/` as the next reviewable UI increment for POS Multi-Trade. Make the prototype feel productized and internationally usable, with a labeled command rail instead of an icon-only rail, while keeping the already released Next/React POS implementation unchanged.

## Acceptance criteria

- [ ] AC-001: `prototype/astro-pos/` remains a self-contained Astro static app with reproducible install and `npm run build`.
- [ ] AC-002: Desktop navigation clearly shows icon + Traditional Chinese label + English label for Counter, Orders, Catalog, Insights, and Settings; active state and accessible navigation semantics are present.
- [ ] AC-003: Responsive behavior keeps navigation understandable on tablet/mobile and preserves usable catalog/cart layout without horizontal page overflow.
- [ ] AC-004: The three profiles (fnb, retail, service) can be selected through the snapshot-before-switch dialog; current cart state is preserved and the selected profile copy changes.
- [ ] AC-005: Catalog search/category filtering, add-to-cart, quantity changes, payment selection, and local checkout state work in the browser without pretending to call cloud, payment, tax, or hardware integrations.
- [ ] AC-006: Accessibility and internationalization extension points remain visible: meaningful button names, dialog semantics, Traditional Chinese/English microcopy, workspace/channel/locale/currency context, and local-first/offline status.
- [ ] AC-007: Existing formal React source, domain behavior, tests, and production deployment are not modified by this Astro increment.
- [ ] AC-008: Deterministic Astro build and independent browser smoke evidence are recorded; no production deploy or Notion release sync is performed in this task.

## Constraints

- Only modify `prototype/astro-pos/` and this goal/evidence when required for this task.
- Do not migrate or rewrite `src/`, add auth, payments, cloud sync, DB migrations, secrets, or infrastructure deletion.
- Do not add external CDN dependencies or claim seeded prototype data is live integration data.
- Do not commit, push, deploy, or update the canonical Notion Project DB from the MiniMax run.

## Stop conditions

- Stop on missing credentials, auth/security failures, destructive migration needs, or an unclear production target.
- If MiniMax reaches token/quota/rate-limit failure, keep the same session and follow the workspace wakeup/fallback policy; do not switch to the desktop app.
