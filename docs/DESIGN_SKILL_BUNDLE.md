# Unified design skill bundle

This standalone Designer MCP extends the existing the-designer server. It does not run inside UMCP or copy the upstream engines into this codebase.

## Upstream sources

| Source ID | Upstream | License | What the MCP exposes |
| --- | --- | --- | --- |
| taste | https://github.com/Leonxlnx/taste-skill | MIT | Art-direction guidance, layout, imagery, frontend QA instructions |
| motion | https://github.com/kylezantos/design-motion-principles | MIT | Motion creation and animation audit guidance |
| elaya | https://github.com/elayadesign/ai-design-skills | MIT | Landing page and Figma guidance; read `skills/figma-designer/SKILL.md` for its second skill |
| impeccable | https://github.com/pbakaus/impeccable | Apache-2.0 | Design polish, critique and anti-pattern guidelines |
| img2threejs | https://github.com/img2threejs/img2threejs | Apache-2.0 | Procedural Three.js reconstruction guide, forge and reference docs |

Every upstream commit is pinned in `design-sources.lock.json`. The sync script uses sparse clones into ignored `.designer-sources/` so a very large upstream repository need not be checked out in full. Each upstream clone retains its license/notice files. Update hashes deliberately and test; do not auto-update at server startup.

## Setup (Windows development machine)

```powershell
cd E:\PROJECT\designer-mcp
npm ci
npm run sync:design
npm run test:design
npm run start:http
```

Local health endpoint: `http://127.0.0.1:7620/health`. MCP endpoint: `http://127.0.0.1:7620/mcp`. Existing stdio clients continue using `npm start`.

New MCP tools: `list_design_sources` and `read_design_source`. These read verified Markdown files **only** from the five pinned clones. No caller-controlled arbitrary filesystem read or arbitrary shell execution is added. The original Designer MCP tools remain available unchanged. Upstream scripts are provided locally as references, not executed automatically by these new tools.

The 3D integration is a guided code-reconstruction skill. It does not include an image-generation model or turn one image into a 3D mesh on the server by itself. The client model must provide the image understanding, code creation, and browser verification. Impeccable's CLI and Taste's browser checker can be run using their upstream instructions separately; the skill reader does not pretend to execute them.

## Cloudflare deployment target

Requested hostname: `designer.otstwo.com`; planned origin: `http://127.0.0.1:7620`; public MCP path: `/mcp`.

**Do not create a publicly accessible route before enforcing authentication and verifying it end-to-end.** Existing tools can write local files or call external services. Put the tunnel hostname behind an appropriate Cloudflare Access policy and confirm ChatGPT plugin authentication compatibility before registering it. Do not expose the origin port on the LAN. Use the workstation's existing service manager/dashboard for persistent startup after a protected route passes testing.

The Facebook reel link supplied for this project was inaccessible for technical inspection. No executable code has been taken from it.

## Verification and known limitation

`npm run test:design` runs source path-guard tests plus a real multi-request MCP HTTP test. The original full upstream test suite currently hits Windows `EPERM` on its file-symlink test without Windows Developer Mode or equivalent privileges; this failure existed before the bundle changes and is not suppressed.
