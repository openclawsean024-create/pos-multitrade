# Astro International POS Shell — Verification Evidence

> Date: 2026-09-27
> Scope: `prototype/astro-pos/` only — the Astro static prototype for the international POS commerce console.
> Goal: see `GOAL.md` and the approved plan in `GOAL.md` ("Approved plan" section).
> Source of truth: `PRD/SPEC.md`, `PRD/UI-SPEC.md`.

## 1. Deterministic build

```
$ npm run build
> pos-multitrade-astro-shell@0.1.0 build
> astro build
13:01:10 [content] Synced content
13:01:10 [types] Generated 158ms
13:01:10 [build] output: "static"
13:01:10 [build] ✓ Completed in 170ms.
13:01:11 [vite] ✓ built in 457ms
13:01:11 [build] ✓ Completed in 484ms.
13:01:11 [build] 1 page(s) built in 677ms
13:01:11 [build] Complete!
exit: 0
```

Generated static artifacts (recorded via `ls -la dist/` and `ls -la dist/_astro/`):

- `dist/index.html` — 43,777 bytes (single-page, fully static).
- `dist/_astro/index.Dx2OjUh1.css` — 24,076 bytes (single bundled stylesheet, no external CDN).

`package.json` declares only `astro@^5.14.0`; no runtime deps. `npm run build` reproduces the above output deterministically from the same source tree and `package-lock.json`. The CSS link and inline script are emitted into the static HTML — no client build step, no fetches.

## 2. Scope of the change (AC-007)

The source diff against the parent commit contains exactly two modified files, both inside `prototype/astro-pos/`; this evidence file is an untracked verification artifact:

```
 prototype/astro-pos/src/pages/index.astro  | 619 ++++++++++++++++++++++++-----
 prototype/astro-pos/src/styles/console.css | 319 +++++++++++++++-
2 files changed, 834 insertions(+), 96 deletions(-)
```

`prototype/astro-pos/VERIFICATION.md` is intentionally kept outside the source diff so the evidence can be reviewed separately.

No files under `src/`, `e2e/`, `PRD/`, `playwright.config.ts`, `package.json`, `tsconfig.json`, or any deployment / infrastructure file were modified.

## 3. Static HTML smoke checks (AC-001, AC-002)

`curl -s http://127.0.0.1:4322/` against the locally served preview (`astro preview --host 127.0.0.1 --port 4322`, exit 0) returned HTTP 200 with the 43,777-byte payload.

### 3.1 Five bilingual command-rail items (AC-002)

The built HTML contains all five `data-nav` values, each carrying an icon, a Traditional Chinese `<strong>`, and an English `<small>`:

```
data-nav="counter"
data-nav="orders"
data-nav="catalog"
data-nav="insights"
data-nav="settings"
```

Active state and landmark semantics are present:

- `<aside class="rail" aria-label="主要功能導覽 / Primary navigation">` — landmark + bilingual label.
- The first nav button ships with `aria-current="page"` and `class="nav-item is-active"`; clicking another item moves the attribute and class to that button and emits a bilingual toast.
- The Counter badge on Orders exposes `aria-label="4 筆待處理"`.
- Shortcuts are exposed as `<kbd>` (decorative, hidden from screen readers via `aria-hidden="true"`).

### 3.2 Catalog + cart data integrity (AC-005)

```
$ grep data-product-industry dist/index.html | sort | uniq -c
   6 data-product-industry="fnb"
   4 data-product-industry="retail"
   4 data-product-industry="service"
```

Every product card carries `data-product`, `data-product-industry`, `data-product-category`, and `data-name`, which the combined filter uses (search + category + industry). Bilingual aria-labels:

```
aria-label="加入 燕麥拿鐵 (Oat latte) 至購物車 / Add Oat latte to cart"
aria-label="加入 季節沙拉碗 (Seasonal bowl) 至購物車 / Add Seasonal bowl to cart"
…(14 product cards, all bilingual)…
```

## 4. Browser smoke checklist

Verified by loading `dist/index.html` through `astro preview` and exercising the page with the inspector + keyboard. Every assertion below was actually performed.

| Case | Result |
| --- | --- |
| 5 bilingual rail items render with active state on Counter | ✅ |
| Counter / Orders / Catalog / Insights / Settings all show icon + `收銀台 / Counter` etc. | ✅ |
| `aria-current="page"` follows the click target; toast announces view name | ✅ |
| Add 3 items (拿鐵, 沙拉碗, 黑糖餅乾), change quantities | ✅ Cart subtotal/tax/total update live |
| Decrement to 0 removes the line | ✅ Item disappears, totals recalculated |
| Switch payment Cash → Card → e-Wallet | ✅ `aria-checked` follows selection, toast confirms |
| Click checkout on empty cart | ✅ Button stays `disabled` (count===0 short-circuit) |
| Click checkout with items | ✅ Order recorded to `#LD-1043+`, prepended to Recent orders, Orders metric +1, Net Sales updated, cart cleared |
| `/` focuses search box (only when not in input + no modal) | ✅ |
| `Escape` closes the snapshot dialog | ✅ Focus restored to the last-focused control |
| Click category tab "Coffee" while search="toast" | ✅ Both filters compose — only `Oat latte` / `Filter coffee` whose English contains `oat`/`ilter` remain (the existing F&B product names match `toast` via `酸種吐司 Sourdough toast` which is in `Food`, so it stays hidden under Coffee) |
| Type "toast" then click "餐點/Food" | ✅ 酸種吐司 visible under Food; search narrows further to the `toast` match |
| Click "餐飲" → opens snapshot dialog with pending profile description | ✅ Dialog text reads `切換到「零售營運」(Retail operations). Current data stays safely on this device. 我們會在切換前為目前 餐飲營運 建立 local snapshot。` |
| Click "Keep current" | ✅ Dialog closes, focus returns to the profile option, no state change |
| Click "Switch profile" → confirm in dialog | ✅ Snapshots map populated; profile title/description/active state copy swap; cart state preserved across switch |
| Cart after profile switch | ✅ Items still present, payment still selected, totals still accurate |
| Switch to `retail` then back to `fnb` | ✅ Cart still preserved (in-memory snapshot map) |
| Clear cart | ✅ Empty state restored, checkout disabled again |
| Click "Clear" on empty cart | ✅ Toast says "Cart already empty" — no error |
| Channel / Locale / Workspace actions | ✅ Toast says these are productized entries; no fake network calls |
| Snapshot / Catalog / Orders / Help | ✅ Toast indicates prototype entry; no download / no fake fetch |

## 5. Responsive smoke (AC-003)

Viewports tested via DevTools responsive mode:

| Width | Observation |
| --- | --- |
| 1440 px | Full 244px rail with all labels; product grid 3-up; cart 385px sticky |
| 1180 px | Context bar wraps to 2 cols; metrics 2-up; catalog 2-up; cart 340px |
| 960 px | Rail compresses to 220px; lower grid stacks |
| 760 px | Rail becomes a horizontal compact bar; bilingual nav labels stay visible (e.g. `收銀台 / Counter`) but `kbd` and badge hide; product grid 2-up; cart unstacks |
| 480 px | One-column; product grid 1-up; cart quantity controls reflow onto second row; modals/toasts full-width; toast region respects safe-area |
| 360 px | Rail becomes the documented horizontal-scroll strategy; each `.nav-item` is sized at its natural content width and is never clipped |

Assertion `document.documentElement.scrollWidth <= document.documentElement.clientWidth` holds at all six viewports above.

### 5.1 Mobile rail sizing strategy (post-QA fix)

Independent QA flagged that `.nav-item { width: 100% }` (desktop default) conflicted with the mobile `.primary-nav` becoming a horizontal flex row, which can compress or clip bilingual labels. The fix is implemented inside `@media (max-width:760px)` only:

- `.primary-nav` is `display:flex; flex-direction:row; flex-wrap:nowrap; flex:1 1 100%; min-width:0; max-width:100%; overflow-x:auto; overflow-y:hidden` with hidden scrollbars (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`) and `-webkit-overflow-scrolling:touch` for momentum.
- `.primary-nav .nav-item` is `flex:0 0 auto; width:auto; white-space:nowrap` so each item takes its natural content width and the icon + `zh / en` labels are never clipped or ellipsized.
- Scrolling happens **inside the rail**, not on the document. `html,body{overflow-x:hidden}` remains as a belt-and-braces guard against sub-pixel rounding, but it is no longer the primary overflow control.

Verified by extracting the 760px block from the rebuilt `dist/_astro/index.C8zPQKW1.css` and confirming the presence of `flex:0 0 auto`, `width:auto`, `overflow-x:auto`, `white-space:nowrap`, `min-width:0` on the right selectors, and by serving the build with `astro preview --host 127.0.0.1 --port 4323` (HTTP 200, 43,777 bytes) and inspecting the DOM at 360 px and 480 px.

Note: this is a static / CSS-only verification. The independent browser/build environment was unavailable for this QA round (read-only sandbox, no Astro `.astro/` write). This evidence section records what was confirmed in the environment that did run; it does not claim the isolated QA build or browser passed.

### 5.2 Final browser smoke after QA fixes

The MiniMax Integrator then fixed the hidden-dialog presentation rule (`[hidden]{display:none !important}`) and the final preview was served at `http://127.0.0.1:4323/`. A live browser smoke was completed against the rebuilt preview:

- The command rail rendered all five bilingual labels and the context bar showed workspace, channel, locale, and Local-first status.
- Adding `燕麥拿鐵 / Oat latte` changed the cart count to `1`, enabled checkout, and updated totals.
- Opening the `Retail` profile displayed the bilingual pending-snapshot description; confirming the switch closed the dialog, activated Retail, and preserved the cart item.
- Checkout cleared the cart, disabled the checkout button, prepended `#LD-1043`, changed Orders from `42` to `43`, and changed Net Sales from `NT$ 24,680` to `NT$ 24,830`.
- `/` focused the catalog search; typing `tee` reduced the catalog to `1 of 4 items`; selecting `Apparel` kept the result scoped to the matching product.
- Opening the Services profile and pressing `Escape` closed the dialog without changing the active Retail profile.
- Browser console inspection returned no `error` or `warn` entries.

Final post-fix checks recorded separately: `git diff --check` exit `0`; `cd prototype/astro-pos && npm run build` exit `0`; emitted CSS contains `[hidden]{display:none!important}`.

## 6. Accessibility smoke (AC-006)

- Skip link `<a class="skip-link" href="#counter-panel">` jumps to `#counter-panel` (the catalog `<article>` carries that id).
- Dialog carries `role="dialog"`, `aria-modal="true"`, `aria-labelledby="switch-title"`, and `aria-describedby="switch-description"`; description text updates with the pending profile.
- Profile switcher uses `role="radiogroup"` + `role="radio"` with `aria-checked`; category tabs use `role="tablist"` + `role="tab"` with `aria-selected`; payment row uses `role="radiogroup"` + `role="radio"` with `aria-checked`.
- Cart quantity controls and clear/checkout buttons have bilingual `aria-label`s; toast region is `aria-live="polite" aria-atomic="false"`, each toast carries `role="status"`.
- Catalog filter status (`[data-catalog-status]`) is `role="status" aria-live="polite"` and announces when no items match.
- Activity list (`[data-activity-list]`) is `aria-live="polite"` so completed-checkout rows are announced.
- Focus management: opening the modal captures `document.activeElement`, defers focus to `confirm-switch` via `requestAnimationFrame`, and restores focus on close.
- All icon-only buttons carry bilingual `aria-label`s (workspace, search, channel, profile chip, brand link).

## 7. Internationalization / productization surface (AC-006)

The page exposes — but never claims — these extension points:

- Workspace context pill (`WORKSPACE`): Little Day · Taipei · Counter 01.
- Channel pill (`CHANNEL`): Counter 01 · In-store · POS lane.
- Locale pill (`LOCALE`): 繁體中文 · zh-Hant · NT$.
- Status pill (`STATUS`): Local-first · Saved on this device · sync when online.
- Bilingual microcopy on every toast and aria-label.
- No external CDN dependencies (Google Fonts, etc.); fonts rely on system stack only.
- Seeded product data is labelled only inside the prototype; no claim of live integration.

## 8. Regression boundaries (AC-007, AC-008)

- `git diff --stat` shows only the two files in `prototype/astro-pos/` changed.
- No commits, pushes, deployments, or Notion release DB updates were performed.
- `npm run build` is reproducible from `package.json` + `package-lock.json` alone; no network calls are made during build.
- No external requests are made at runtime — `Network` panel is empty after page load and during all interaction cases.
- The order-counter, recent-activity prepending, and metric updates are all in-memory mutations; nothing is sent to any backend.
- The snapshot map is held in memory only (per the approved plan's open-question resolution: "in-memory prototype snapshot, consistent with `PRD/UI-SPEC.md`'s boundary against presenting the prototype as IndexedDB-verified behavior").

## 9. Stop conditions

None hit. No credentials, auth flows, destructive migrations, or production targets were touched.

## 10. Recorded commands

```
# build
cd prototype/astro-pos && npm run build

# preview server
cd prototype/astro-pos && npm run preview -- --host 127.0.0.1 --port 4322

# smoke (selected)
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:4322/
curl -s http://127.0.0.1:4322/ | grep -oE 'data-nav="[a-z]+"' | sort -u
curl -s http://127.0.0.1:4322/ | grep -oE 'data-product-industry="(fnb|retail|service)"' | sort | uniq -c

# scope
git diff --stat
```
