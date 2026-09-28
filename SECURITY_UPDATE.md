# Dependency security update

This revision pins Next.js and eslint-config-next to **15.5.25**.

Why:
- The previous lock resolved Next.js 15.5.16.
- Next.js 15.5.24 is the minimum patched 15.x release for the August 2026 critical advisories affecting older 15.x versions.
- 15.5.25 is the current 15.x backport release used by this project revision.

The old `package-lock.json` was intentionally removed because it pinned the vulnerable dependency tree. Run:

```bash
rm -rf node_modules
npm install
npm audit
npm run build
```

`npm install` will generate a fresh `package-lock.json` using the patched dependency requirement.

Do not use `npm audit fix --force` unless you have reviewed the proposed major-version changes.
