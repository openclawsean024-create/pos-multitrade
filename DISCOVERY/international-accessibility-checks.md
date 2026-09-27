# Prototype hardening checks

Date: 2026-09-28

Evaluation mode: automated source/build checks plus the authorized proxy-scenario walkthrough. This is not a substitute for real-user research.

## Checks

Command:

```bash
bash DISCOVERY/hardening-check.sh
```

Result: `hardening checks passed: locales=4 rtl=reduced-motion=contrast=focus=responsive` (exit code 0).

The check confirms:

- `zh-TW`, `en-US`, `ja-JP`, and `ar` locale definitions;
- runtime `lang` and `dir` updates, including RTL;
- locale-aware currency formatting through `Intl.NumberFormat`;
- long product/cart labels wrap instead of being clipped;
- visible focus styling and keyboard entry points;
- reduced-motion and high-contrast media handling;
- responsive mobile layout rules;
- a successfully generated standalone `dist/index.html`.

## Limitations

The prototype still uses seed data and display-only locale/currency previews. It does not claim production tax, FX, payment, cloud-sync, or compliance support. Real-user validation and commercial validation remain future work; current project status is `discovery-only`.
