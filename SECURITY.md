# Security

This is a fully static personal site. There is no server code, no database, no login, no form
that posts anywhere, and no user-generated content. Cloudflare Pages serves the built files from
`dist/` behind the headers in `public/_headers` (CSP with hashed inline scripts, HSTS, COOP,
`frame-ancestors 'none'`, Permissions-Policy).

## Reporting a vulnerability

If you find something anyway, please report it privately rather than opening a public issue:

- GitHub: use **Report a vulnerability** on the repo's Security tab (private vulnerability
  reporting is enabled), or
- Email: hello@shanahansuresh.com

Include the page or file, what you observed, and how to reproduce it. You will get a reply within
a few days. Fixes ship as normal commits; there is no bounty.

## Scope notes

- Secrets: the repo contains none and never has (history scanned). Cloudflare Web Analytics is
  injected at the edge; its token is not in this repo.
- Dependencies: Dependabot watches npm and GitHub Actions weekly. `npm audit` is clean as of the
  Astro 7 upgrade (Aug 2026). Future findings that only apply to features this site does not use
  (server islands, `define:vars`, the dev server, image decoding of untrusted files) are tracked
  but not treated as live risk.
- CI: the workflow runs with read-only token permissions, uses SHA-pinned actions, and has no
  secrets to leak.
