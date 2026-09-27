#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
page="$project_root/prototype/astro-pos/src/pages/index.astro"
css="$project_root/prototype/astro-pos/src/styles/console.css"
dist="$project_root/prototype/astro-pos/dist/index.html"

[[ -s "$dist" ]] || { echo "FAIL: built prototype missing"; exit 1; }
for locale in "'zh-TW'" "'en-US'" "'ja-JP'" "ar"; do
  rg -q "$locale" "$page" || { echo "FAIL: locale missing: $locale"; exit 1; }
done
rg -q 'Intl\.NumberFormat' "$page" || { echo "FAIL: locale-aware number formatting missing"; exit 1; }
rg -q 'document\.documentElement\.dir = info\.dir' "$page" || { echo "FAIL: runtime direction switching missing"; exit 1; }
rg -q 'data-price-value' "$page" || { echo "FAIL: locale-aware product price marker missing"; exit 1; }
rg -q 'html\[dir="rtl"\]' "$css" || { echo "FAIL: RTL styling missing"; exit 1; }
rg -q 'prefers-reduced-motion' "$css" || { echo "FAIL: reduced-motion styling missing"; exit 1; }
rg -q 'prefers-contrast' "$css" || { echo "FAIL: high-contrast styling missing"; exit 1; }
rg -q 'button:focus-visible,a:focus-visible,input:focus-visible' "$css" || { echo "FAIL: visible focus styling missing"; exit 1; }
rg -q '@media \(max-width:760px\)' "$css" || { echo "FAIL: responsive mobile layout missing"; exit 1; }
echo "hardening checks passed: locales=4 rtl=reduced-motion=contrast=focus=responsive"
