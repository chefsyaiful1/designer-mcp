# TechChefs Designer MCP evaluation

This branch validates the upstream standalone server using GitHub Actions; no application or MCP logic is modified.

## Checks

- Checkout recursively including Git submodules.
- Install dependencies with `npm ci` on Node.js 22.
- Run `npm run build`.
- Run `npm test`.

## Scope

Evaluation only. Do not connect to UMCP, production services, Cloudflare, or local development projects. Keep the upstream `master` branch unchanged.
