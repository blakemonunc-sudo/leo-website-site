# Leo Site V2

Cloudflare Worker (`leo-website-site`) for the Leo website:

- `/` — marketing homepage (wireframe 2a prototype)
- `/today` — city itinerary UI (Tokyo / Paris / NYC packs via runtime API)

## Production

**URL:** https://leo-website-site.coreleo-871.workers.dev

Already wired for Cloudflare media + content:

- Service binding `RUNTIME_API` → `leo-website-content-runtime-api` (packs)
- Secrets `CF_IMAGES_HASH` + `LEO_WEBSITE_API_SECRET` (Images proxy + API auth)
- Same-origin `/img/{id}` proxies Cloudflare Images

```bash
npm run deploy
```

## Local development

```bash
cp .dev.vars.example .dev.vars   # fill secrets if testing /today
npm install
npx wrangler dev
```

Open the printed local URL. Homepage works without secrets; `/today` needs the runtime API service binding + `LEO_WEBSITE_API_SECRET`.

## Fonts

Prototype uses system placeholders (Georgia / system-ui / ui-monospace) — not Architects Daughter.
