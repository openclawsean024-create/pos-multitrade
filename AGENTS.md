# pos-multitrade — project instructions

## Source of truth

- Product scope and acceptance criteria: `PRD/SPEC.md`.
- Approved UI direction for this milestone: `PRD/UI-SPEC.md`.
- Competitive evidence: `PRD/COMPETITOR-BENCHMARK.md`.
- Workspace-level instructions remain authoritative.

## Invariants

- Preserve the three industry profiles: `fnb`, `retail`, and `service`.
- Industry switching must preserve prior profile data and create a local snapshot before switching.
- Keep the product local-first and offline-capable. Do not add auth, payments, cloud sync, or secrets in this milestone.
- Do not present seeded/demo data as live third-party integrations.
- Formal React UI must implement the approved international commerce-console prototype; do not revert to the legacy status-dashboard composition.
- DB-layer test skips are a known issue; do not delete tests or hide failures.

## Change discipline

- Every feature change must map to a `PRD/SPEC.md` FR/AC or the approved `PRD/UI-SPEC.md` interaction rule.
- Do not modify branch protection, merge PRs, or rotate secrets.
- Keep the change limited to the POS product and its verification evidence.
