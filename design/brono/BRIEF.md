# NileChain — Brono Think brief (paste once)

Use this as the project brief in Brono **Think** before any Generate / Redesign / Audit.

---

## Product

**NileChain** is an Egyptian B2B agri platform that connects **farms** and **factories** to close, execute, and build trust on supply deals.

Core loop: supply request → AI match + trust score → Arabic contract → bilateral signing → fulfillment (ship / weigh / QC) → wallet hold/release → disputes.

Not a bank, not a blockchain payment rail, not farm ERP.

## Locale & layout

- Primary UI language: **Arabic (RTL)**; English supported.
- Direction: **RTL-first**. Keep brand wordmark `NileChain` LTR.
- Touch targets ≥ 44×44 CSS px.
- Mobile and desktop; factory/farm portals use a sticky sidebar (~280px).

## Visual identity — Agro-Technical Precision

| Token | Hex | Role |
|-------|-----|------|
| Primary | `#1B5E20` | CTAs, key accents, trust |
| Primary container | `#E8F5E9` | Soft fills, selected chips |
| On primary | `#FFFFFF` | Text on primary |
| Background | `#FBF9F8` | Page canvas (warm paper) |
| Surface lowest | `#FFFFFF` | Cards / panels |
| On surface | `#1B1C1C` | Body text |
| On surface variant | `#41493E` | Secondary text |
| Outline variant | `#C0C9BB` | Borders |
| Error | `#BA1A1A` | Failures / blocking |
| Warning | `#E65100` | Caution (e.g. trust &lt; 40) |

**Typography**

- Latin UI: **Work Sans** (700–800 display, 500–600 labels, 400 body)
- Arabic UI: **IBM Plex Sans Arabic**
- Icons: Material Symbols Outlined
- Decision numbers (scores, EGP, tons): tabular nums, bold 20–36px

**Look & feel**

- Clean agri-tech SaaS: calm hierarchy, mint/green accents, paper surfaces.
- Prefer sections and clear labels over dense card grids.
- Motion: subtle (fade/slide 200–400ms); respect `prefers-reduced-motion`.

## Hard bans

- No purple / indigo “AI generic” gradients
- No dark-only default (light is primary; dark is optional)
- No floating badges / promo stickers on hero media
- No hero filled with stats strips, schedules, or secondary marketing clutter
- Do not invent a new palette — stick to the tokens above

## Demo screen priority (redesign these only)

1. Landing (`/landing`)
2. Factory supply request (`/factory/supply-request`)
3. Agent progress + risk (`/factory/agent-progress`, `/factory/risk-report`)
4. Contract signing (`/factory/contract-signing`)
5. Wallet (`/factory/wallet` or `/farm/wallet`)
6. Disputes / clean failure (`/factory/disputes`)

## Handoff rule

Brono output is a **visual + audit reference**. Production UI is **Angular 21 + Tailwind + SCSS tokens** in `nilechain-frontend-main`. Export Figma if needed; adapt HTML/Tailwind to Angular — do not paste raw HTML into the app.
