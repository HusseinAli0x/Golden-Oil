# Golden Oil Refinery (GOR) — website

Production website for Golden Oil Refinery, Najaf, Iraq. Built from the approved design hand-off
(`../_handoff/gor-website`: `CLAUDE.md`, `docs/DESIGN-SPEC.md`, prototypes in `design/`).

## Stack

- Next.js 16 (App Router, Cache Components, static prerendering) · React 19 · TypeScript (strict)
- Tailwind CSS 4 — design tokens in `src/app/globals.css` (`@theme`), logical properties for RTL
- three.js r187 + React Three Fiber 9 + Drei 10 — 3D site model and barrel back-to-top
- Lucide React icons · `next/image` · `next/font` (Sora + IBM Plex Sans Arabic, self-hosted at build)

## Getting started

Requires Node.js 20.9+ (tested on Node 26).

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve the production build
npm run lint
```

Set the public URL before building for production (canonical links, hreflang, sitemap, Open Graph):

```bash
cp .env.example .env.local   # then edit NEXT_PUBLIC_SITE_URL
```

## Routes

| Route | What |
| --- | --- |
| `/` | Intro — Golden Network Holding logo animation, then opens Home (once per session, `sessionStorage`). Skip button. |
| `/en`, `/ar` | Home: hero, film (lightbox), 8-stage process with scroll-driven oil pipe, 3D site model, products + details modal + full-size photo, about teaser |
| `/{lang}/about` · `/facilities` · `/products` · `/technology` · `/quality` · `/sustainability` | Inner pages |
| `/{lang}/site-model` | Full-screen 3D viewer: camera presets, day/night, pan/zoom/keyboard |
| any unknown URL | 404 with animated pump jack (localized under `/en` and `/ar`) |

Language choice is remembered in `localStorage` key `gor-lang`; the switch keeps the current page.
`/sitemap.xml` and `/robots.txt` are generated.

## Project structure

```
src/
  app/
    (intro)/            entry intro (own root layout)
    [lang]/             root layout (html lang/dir), all localized pages, loading + not-found
    global-not-found.tsx, sitemap.ts, robots.ts, globals.css
  components/
    layout/             header, footer, scroll progress, barrel back-to-top, 404 view
    home/               hero, film lightbox, process pipe
    products/           product cards + modal + photo viewer
    three/              buildSite.ts (scene), SiteCanvas (R3F), embed + full viewer, barrel
    animations/         pump jack, loading truck, tower (SVG), intro paths
    technology/, intro/, ui/ (Section, PageHero, CtaBand, ContactButtons, Modal)
  content/en.json, ar.json   all copy (ar is type-checked against en)
  lib/                  i18n, site config (contact, products, routes), metadata, fonts, scroll store
public/                 images, logos, barrel model
```

To change copy, edit `src/content/*.json`. Contact details live only in `src/lib/site.ts` (`CONTACT`).

## How the hard rules are enforced

- No invented facts: only DESIGN-SPEC §1 facts; everything else is a visible `[To be supplied by GOR]` placeholder.
- No contact page, no forms: phone (`tel:`) and email (`mailto:` with "Product enquiry: <code>" subject) only.
- No eyebrow labels; no ADU; no ISO/certification claims; no confidential plot plan published.
- Golden Network Holding logo appears **only** in the intro (`/`). Header/footer/About use the GOR flame.
- Reduced motion respected everywhere (intro shortens, pipe snaps, 3D/barrel stop swaying, CSS animations off).

## 3D performance & fallbacks

- Home model loads only near the viewport; renders pause off-screen and in hidden tabs.
- Phones (≤760px) and data-saver: static render + "Load 3D model" button.
- No WebGL (or a WebGL error): static image fallback (`public/images/site-model-fallback.png`).
- Pixel ratio ≤ 1.75; repeated parts are `InstancedMesh`; geometry/materials/textures disposed on unmount.
- Barrel WebGL starts ~1.2s after load; SVG barrel is shown until (and instead of) it.

## External services / integrations

- **YouTube** (privacy-enhanced `youtube-nocookie.com`) for the company film, loaded only when the visitor presses play.
  To self-host instead, replace the iframe in `src/components/home/FilmSection.tsx` with a `<video>`.
- No backend, API keys, analytics or email service are needed — there are no forms by design.
- Hosting: any Node host (`npm start`) or Vercel. Set `NEXT_PUBLIC_SITE_URL`.

## Open approvals before launch (DESIGN-SPEC §10)

- [ ] 1. 4th product: VR, Bitumen, or two products?
- [ ] 2. Process wording, 8 stages, product descriptions, 3D — process engineer review (no ADU). Also review the
      "Inside a vacuum column" paragraph on the Technology page and the supporting-systems list on Facilities.
- [ ] 3. Parent company legal wording EN + AR
- [ ] 4. Public use of phone, email, address, film, photos
- [ ] 5. Product specs / applications / certifications
- [ ] 6. 3D model based on the plot plan — approve or generalise (`src/components/three/buildSite.ts`)
- [ ] 7. Barrel GLB is **CC-BY-NC-4.0** — license or replace `public/models/oil-barrel.glb`
- [ ] 8. Film shows tank IDs and a worker
- [ ] 9. Original vector logos from GOR (current SVG is a trace)
- [ ] 10. Arabic copy translator review (includes new draft strings: 3D viewer, 404, loading, contact band)
- [ ] 11. Sustainability in the main nav — added; confirm with client
- [ ] 12. Tower animation placement — placed on the Technology page; confirm
- [ ] Product photos are site photos, not product photography — replace when available
