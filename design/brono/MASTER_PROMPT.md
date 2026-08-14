# NileChain — Master Brono prompt (paste this)

Use this as the **main Think / system brief**, then for each screen paste the matching block from [SCREEN_PROMPTS_FULL.md](./SCREEN_PROMPTS_FULL.md) and attach a real screenshot.

---

## MASTER BRIEF — paste entirely into Brono Think

```text
You are redesigning NileChain: an Egyptian B2B agriculture platform that connects farms and food factories to close supply deals, score trust, generate Arabic contracts, fulfill shipments (weigh/QC), hold/release wallet funds, and handle disputes.

PRODUCT TRUTH (do not romanticize or invent features):
- Not a bank. Not crypto/blockchain money. Not farm ERP. Not a marketplace of ads.
- Core loop: factory supply request → AI match + trust score → Arabic contract → both parties sign → ship / weigh / QC → wallet hold & release → dispute if needed.
- Trust score is 0–100 where HIGH = safer; warning when under 40.
- Primary market feel: Egypt, tomato/agri supply, Qalyubia-scale realism — professional ops software, not a lifestyle farm blog.

AUDIENCE & LANGUAGE:
- Primary UI: Modern Standard Arabic, RTL layout. English secondary.
- Brand wordmark “NileChain” always LTR (Nile + Chain), never mirrored.
- Users: factory procurement managers + farm owners + admin. Tone: calm, competent, trustworthy — like a serious ops tool a factory would actually use, not a startup pitch deck.

NORTH STAR AESTHETIC: “Agro-Technical Precision”
Think: warm paper workspace + Nile forest green + mint containers. Like a carefully designed logistics/agri SaaS built by a senior product designer in Cairo — not like Midjourney UI, not like “AI startup landing”, not like purple SaaS templates.

STRICT COLOR SYSTEM (do not invent new hues):
- Primary / CTA / trust accent: #1B5E20
- Primary container / soft selected fills: #E8F5E9
- On-primary: #FFFFFF
- Page background (warm paper): #FBF9F8
- Card / panel surface: #FFFFFF
- Body text: #1B1C1C
- Secondary text: #41493E
- Borders / dividers: #C0C9BB
- Error: #BA1A1A
- Warning (caution / low trust): #E65100
- Soft success = primary greens above — NEVER random Tailwind green-100/emerald/lime neon.
Light mode is default. Dark is optional later; do not design dark-first.

TYPOGRAPHY:
- Latin UI: Work Sans (800 display, 600–700 titles, 500 labels, 400 body)
- Arabic UI: IBM Plex Sans Arabic with the same weight hierarchy
- Decision numbers (trust %, EGP, tons): tabular lining numerals, bold 20–36px
- Generous line-height for Arabic body (≈1.6). Avoid cramped Arabic.
- Icons: Material Symbols Outlined (outlined, not filled candy icons), restrained sizes.

MAKE IT FEEL ALIVE BUT HUMAN (critical — avoid “AI look”):
Design as if a senior designer spent two weeks refining it by hand.
DO:
- Asymmetric but balanced compositions; intentional white space; uneven section rhythm (not identical card triplets everywhere).
- Real product chrome: sidebar, top bar, form sections, steppers, tables, empty states that feel operational.
- Subtle depth: 1px borders, soft paper shadows, light surface nesting — not glassmorphism stacks.
- Micro-life: one calm scroll progress or soft orb wash, gentle hover lift (2–3px), one purposeful motion per screen max — never particle fireworks.
- Egyptian/agri atmosphere via color, crop/field metaphors, and real content — NOT stock photo collages of smiling farmers in hero overlays.
- Copy that sounds like a real product (Arabic + English labels). Prefer concrete nouns: توريد، مطابقة، درجة ثقة، عقد، محفظة، نزاع.
- Hierarchy: brand → one job → one primary CTA. Secondary actions quieter.

DO NOT (these scream “AI generated” — ban them):
- Purple / violet / indigo gradients, neon glow, aurora blobs, mesh gradients
- Floating glass cards over blurred stock photos
- Pill badge clusters, emoji, 3D clay icons, sparkle/magic wand as the whole personality
- Stat strips / metric dashboards inside the first viewport of marketing pages
- Perfect 3-column feature grids with identical icon-in-circle cards repeated forever
- Inter / Roboto / Arial defaults; generic “Unlock the future of…” copy
- Dark cyberpunk panels, holographic AI brains, robot mascots
- Over-rounded “squircle everything”, multi-layer drop shadows, chrome bezels everywhere
- Decorative fake charts that don’t relate to trust/match/contract
- Crowding the hero with badges, logos-of-partners rows, and 4 CTAs

LAYOUT SYSTEMS:
- Marketing (landing): full-bleed warm paper canvas; brand-dominant first viewport; max one headline, one support sentence, one CTA group, one product preview plane.
- App portals (factory/farm/admin): sticky sidebar ≈280px, top bar with title+subtitle, content max-width with clear sectioning — forms in logical blocks, not one endless flat field dump.
- RTL: margins/padding/chevrons/flow wires flip correctly; numbers and “NileChain” stay LTR.
- Touch targets ≥ 44×44. Mobile: stack steppers vertically; keep primary CTA reachable.
- Cards only when they contain interaction or a distinct decision unit. Prefer sections + dividers over card-in-card nesting.

QUALITY BAR (treat as acceptance criteria):
- Would pass a design critique at a strong product studio.
- Looks shippable in Angular + Tailwind with CSS variables — clean layers, consistent spacing scale (8px rhythm).
- Accessibility: contrast AA for text/CTAs; focus rings visible; status never color-only (pair with label/icon).
- Heatmap-friendly: primary action and trust/score should dominate attention.
- Consistency across screens: same green, same radius language (≈12–16px), same button styles, same empty/error patterns.

OUTPUT INTENT:
Produce high-fidelity, editable, production-ready UI screens. Optimize for beauty AND usability. Prefer refinement of structure from any uploaded screenshot over inventing a totally new IA. Keep NileChain tokens religiously.
```

---

## How to use

1. Paste the MASTER BRIEF into Brono **Think** once.
2. Open [SCREEN_PROMPTS_FULL.md](./SCREEN_PROMPTS_FULL.md) → copy the prompt for the screen you’re doing.
3. Upload a **real screenshot** of that screen → Redesign.
4. Run Audit + Heatmap; keep one winner per screen.
5. Send the image (or Screen ID) back to Cursor to port into Angular.
