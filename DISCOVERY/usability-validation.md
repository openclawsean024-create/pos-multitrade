# Prototype usability validation

Status: proxy-scenario evaluation in progress; not real-user research

## Prototype under review

- UI specification: `PRD/UI-SPEC.md`
- Source prototype: `prototype/astro-pos/src/pages/index.astro`
- Built standalone artifact: `prototype/astro-pos/dist/index.html`

## Evaluation mode

`validation.json` uses `evaluationMode: "proxy-scenario"`, explicitly authorized by Sean on 2026-09-28. These are structured operator walkthroughs performed against the local prototype. They are implementation-readiness evidence only and do not claim customer validation.

## Test matrix

Test at least 5 target users or operators across the intended store profiles. Each test should cover:

1. identify workspace, channel, locale, and current industry profile;
2. switch industry without believing data was deleted;
3. add an item and complete a checkout;
4. find a low-stock or operational signal;
5. understand local-first, snapshot, and non-integrated boundaries.

International stress cases: `zh-TW`, `en-US`, `ja-JP`, one RTL locale, long product names, large totals, empty/error/loading states, keyboard-only navigation, visible focus, contrast, and reduced motion.

## Proxy results

| Scenario | Operator lens | Result | Evidence |
|---:|---|---|---|
| 1 | F&B cashier | PASS | AX tree exposed workspace, channel, locale, current F&B profile, catalog buttons, cart and checkout control; adding Oat latte changed cart count from 0 to 1 and enabled checkout. |
| 2 | Retail operator | PASS | Source and UI expose Retail profile, product profile switching, catalog filtering and preserved local snapshot copy. |
| 3 | Service operator | PASS | Source contains Services profile, service/package/add-on catalog items and the same cart boundary. |
| 4 | Store manager | PASS | AX tree exposed `ATTENTION SIGNALS`, low-stock signal and Local snapshot ready signal with actionable catalog/snapshot controls. |
| 5 | International/local-first operator | PARTIAL | AX tree exposed `zh-Hant`, NT$, Local-first and saved-on-device copy; runtime RTL, long-text, date/number/currency and font-fallback checks remain open. |

Proxy scenario count: 5. Critical issues observed in this walkthrough: 0. International and accessibility stress checks: not yet passed.

## Result

Five proxy scenarios are recorded. Sean approved the prototype in the current Codex conversation on 2026-09-28; approval is recorded in `validation.json`. This does not replace later real-user validation.
