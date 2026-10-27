# SEO Meta Tag Checker

**Paste HTML or a URL and get an on-page SEO score out of 100 — with copy-ready fixes for every problem found.**

![Screenshot placeholder](assets/screenshot.png)
<!-- TODO: replace with a real screenshot / GIF after first deploy -->

## The problem it solves

Beginners publish pages with missing titles, 200-character descriptions, no Open Graph tags and images without alt text — then wonder why Google shows a bad snippet and social shares look broken. Existing audit tools are either paid, sign-up-walled, or overwhelming. This tool runs entirely in the browser, explains each issue in plain English, and gives the exact tag to paste in.

## Live demo

**Demo:** https://shayaneali.github.io/seo-meta-tag-checker/
**Portfolio:** https://myfileportfolioo.netlify.app/

## Features

- Score out of 100, weighted across 9 checks
- Title length (ideal 50–60 chars) and meta description length (ideal 140–160)
- Headings: exactly one H1, no skipped levels
- Open Graph and Twitter Card completeness
- Canonical URL (must be absolute)
- Image alt text coverage (missing vs empty)
- JSON-LD: presence, valid JSON, and detected `@type`s
- Technical basics: `lang`, viewport, charset
- Per-issue fix snippet with a **Copy** button, plus a full suggested meta block
- URL input with an honest CORS fallback message, and paste-HTML mode that always works
- Twitter/X tags count Open Graph as a fallback (as real crawlers do); empty `alt=""` is accepted for decorative images
- Copy-ready tags are HTML-escaped, so quotes in your title never break the snippet
- Dark mode, colour-coded score ring, failed checks listed first
- Accessible: labels, focus styles, keyboard-friendly, `aria-live` status messages. Responsive, no dependencies

## Quick start

```bash
git clone https://github.com/shayaneali/seo-meta-tag-checker.git
cd seo-meta-tag-checker
# No build step. Open index.html, or serve it:
npx serve .
```

Then paste a page's HTML (browser → View Source → copy all) and press **Check SEO**.

## Tech stack

Vanilla HTML, CSS, JavaScript (`DOMParser` for safe parsing — pasted HTML is never executed). No frameworks, no build, no tracking.

## Tests

Open `tests.html` in a browser (no build step). It runs 8 checks against the audit logic and shows PASS/FAIL.

## How scoring works

Title 15 · Description 15 · Headings 12 · Alt text 12 · Canonical 10 · JSON-LD 10 · Basics 10 · Open Graph 8 · Twitter 8 = **100**.

## Roadmap

- [ ] SERP snippet preview (desktop + mobile, pixel-width) — separate project, will link here
- [ ] Export report as Markdown/PDF
- [ ] Check multiple URLs from a sitemap
- [ ] Keyword-in-title/description check

## Good first issues

1. **Add a robots meta check** — pass if present or correctly absent, warn on accidental `noindex`.
2. **Warn when og:image is a relative URL** — social crawlers require absolute URLs.
3. **Add a “copy full report as Markdown” button** — reuse the checks array.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Real, tested changes only — please open an issue first for larger ideas.

## License

MIT — see [LICENSE](LICENSE).
