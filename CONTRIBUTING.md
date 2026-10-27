# Contributing

Thanks for helping improve this tool. Small, real, tested changes are welcome.

## How to contribute

1. Fork the repo and clone your fork.
2. Create a branch: `git checkout -b fix/short-description`
3. Make the change. Keep it vanilla HTML/CSS/JS — no new dependencies without discussing first in an issue.
4. Test manually: run the checker on (a) a complete page, (b) the built-in sample, (c) a page with invalid JSON-LD.
5. Commit with a clear message: `git commit -m "Warn when og:image is relative"`
6. Push to your fork and open a Pull Request explaining **what changed, why, and how you tested it**.

## Good PR habits

- One change per PR. Screenshots for UI changes.
- Keep accessibility: labels on inputs, visible focus, keyboard works.
- No drive-by reformatting of unrelated files.
- Be kind in reviews — beginners contribute here.

## Good first issues

Look for the `good first issue` label, or start with one of:
1. Robots meta check
2. Relative og:image warning
3. Copy-report-as-Markdown button
