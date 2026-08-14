# Full per-screen Brono prompts

Paste [MASTER_PROMPT.md](./MASTER_PROMPT.md) into Think first. Then for each screen: upload screenshot + paste the matching prompt below.

---

## 1) Landing — `/landing`

```text
Redesign the NileChain PUBLIC LANDING page (Arabic RTL, Egyptian B2B agri). Follow the Think brief tokens exactly.

GOAL OF THIS PAGE: In 5 seconds a factory manager or farm owner understands NileChain closes supply deals with trust + Arabic contracts — and can register.

FIRST VIEWPORT (critical composition — one scene, not a dashboard):
- Brand “NileChain” as a hero-level signal (wordmark LTR: Nile in ink, Chain in #1B5E20) — must still read as NileChain if nav were removed.
- ONE headline (Arabic primary), ONE short supporting sentence, TWO CTAs only: “انضم كمزرعة” (primary solid #1B5E20) and “انضم كمصنع” (ghost/outline).
- ONE dominant product preview plane showing a believable app chrome snippet: match row → trust/risk bars → contract status. No floating stickers on top of it.
- Warm paper background #FBF9F8 with a soft mint radial wash — subtle, not party gradients.
- Optional tiny Egypt/agri cue as text, NOT a badge pile.

BELOW THE FOLD (still lively, still human):
- Short capability ticker OR a quiet strip — not a loud logo wall.
- Three value beats (farm / match / contract) with uneven spacing — avoid identical icon circles in a rigid grid if it feels template-y; vary composition slightly.
- “How it works” 3 steps with a connecting line on desktop; numbers + icons restrained.
- Audience split: farm vs factory — clear CTAs, no card overload.
- Closing CTA band using primary mint wash, then simple footer with brand + newsletter.

MOTION / LIFE: 2–3 intentional cues only (e.g. gentle brand entrance, soft preview row stagger, calm CTA sheen). No particle storms, no infinite bouncing badges.

ANTI-AI: No purple, no glassmorphism hero, no partner logo row in viewport 1, no fake “10k farms / 99% trust” stat strip in the hero, no Inter, no “AI-powered future of agriculture” cliché headline. Sound like a real Egyptian B2B product.

Deliver a polished hi-fi desktop + consider mobile nav drawer. Production-quality spacing, Work Sans + IBM Plex Sans Arabic.
```

---

## 2) Factory supply request — `/factory/supply-request`

```text
Redesign the FACTORY “Create supply request” screen inside the app shell (sticky sidebar ~280px + top bar). Arabic RTL. Tokens from Think brief only.

JOB: Help a procurement user fill a serious supply request and submit “ابحث عن موردين” with confidence.

STRUCTURE (sectioned form — not one flat wall of fields):
1) Basics: crop select, quantity (tons), target price EGP/ton (with fair-price hint line), delivery date.
2) Delivery point: two large choice chips — Factory gate / Farm gate — with helper text that changes.
3) Quality: free-text quality notes + structured QC (moisture max %, impurities max %, grade, lab required chip).
4) Geography: scope radios as chips + governorate multi-select chips (EN + AR labels), scrollable chip area.
5) Actions: ghost Cancel + primary Find suppliers (with search icon). Sticky/comfortable on mobile.

TOP BAR: title + subtitle + small “AI matching” cue using mint container — quiet, not neon magic.

FEEL: Calm operations software. Paper card surface #FFFFFF on #FBF9F8. Clear section titles + hints. Required fields marked accessibly. 8px rhythm. Choice chips have selected state = #E8F5E9 fill + #1B5E20 border.

ANTI-AI: No purple AI glow around the form, no decorative farm illustration dominating the page, no 3D icons, no dashboard widgets beside the form. Make it feel like a tool someone uses every week.

Hi-fi, dense-but-breathable, production-ready.
```

---

## 3) Agent progress / matching command center — `/factory/agent-progress`

```text
Redesign the AI MATCHING “command center” progress screen (factory portal, sidebar shell). Arabic RTL. Tokens only.

JOB: Make waiting for matches feel clear, trustworthy, and a bit alive — without looking like a sci-fi AI toy.

INCLUDE:
- Request context card (crop, tons, price, date, governorate, quality) + primary Run / Re-run agent button.
- Command center panel:
  - Header with auto_awesome icon in mint tile, title, phase badge (idle / running / completed) using token greens/warning — NEVER purple glow.
  - Horizontal stepper on desktop (vertical on mobile) for illustrative pipeline steps; connectors fill as progress advances.
  - Current-step detail panel with activity list (done / active spinner / pending hollow).
  - Elapsed seconds as tabular nums.
  - Small “توضيحي / illustrative” note — honest that the timeline is explanatory.
- After results: mode pill (agentic vs fallback) using token status pills; recommended match highlight with trust score as the visual hero number; path to risk report / contracts.

LIFE: One pulse on the running badge, one spinner on active step — that’s enough motion.

ANTI-AI: Ban holographic brains, neural net wallpaper, violet gradients, “GPT inside” vibes. This is agri procurement matching in Egypt. Green SaaS ops aesthetic.

Heatmap should land on Run agent and on the top trust score when results exist.
```

---

## 4) Contract signing — `/factory/contract-signing`

```text
Redesign CONTRACT GENERATE + APPROVE workspace (factory portal). Arabic RTL. Tokens only.

JOB: Generate an Arabic supply contract, review calmly, approve or recover from wallet errors.

LAYOUT:
- Metadata card: factory name, farm (readonly), request id, farm id → Generate contract CTA.
- Status stepper with clear done/current/pending states and connectors: draft → pending signatures → approved (adapt to actual statuses if screenshot differs).
- Contract preview: paper document feel (warm, readable Arabic typography), key-term chips above, not a giant monospace dump if avoidable.
- Actions: Approve (primary), Download (secondary), request-changes affordance.
- Wallet insufficiency error: clean error state with primary link to Wallet + retry — failure should look competent, not broken.

FEEL: Legal workspace — quiet, precise, trustworthy. Lots of paper white, restrained green accents on actions/stepper only.

ANTI-AI: No blockchain motifs, no stamp animations exploding, no crypto wallet neon. Just a serious Arabic contract desk.

Production hi-fi desktop + mobile stacking.
```

---

## 5) Wallet — `/factory/wallet` (or farm wallet)

```text
Redesign NileChain WALLET page. Arabic RTL. Tokens only.

JOB: Show available vs held balances clearly, top-up, withdraw, recent ledger — sandbox honesty visible.

LAYOUT:
- Short lead sentence.
- Sandbox / disclaimer callout with primary edge accent (not alarmist red unless real error).
- Two metric tiles: Available (emphasized mint) vs Held (quieter). Huge tabular EGP amounts.
- Top-up panel card: amount field, primary top-up, Paymob/simulator hints as secondary text; pending simulator completion block if present.
- Withdraw panel: amount + destination + CTA.
- Ledger list: clean rows with type, amount, timestamp.

FEEL: Trustworthy money UI for Egyptian B2B — like a careful fintech ops panel, NOT neon crypto, NOT purple banking templates, NOT dark mode cyber wallet.

ANTI-AI: No coin illustrations, no gradient mesh backgrounds, no fake “portfolio charts”. Clarity > decoration.

Heatmap: Available balance + Top up CTA.
```

---

## 6) Disputes inbox (clean failure surface) — `/factory/disputes`

```text
Redesign DISPUTES INBOX for farm/factory portal. Arabic RTL. Tokens only.

JOB: Triage disputes quickly; empty and failure states must look intentional and “committee-demo ready”.

LAYOUT:
- Title via top bar + one-line subtitle.
- List of dispute cards (not a cramped single divider table): status pill + type + description + date + “Open contract” action (≥44px hit area).
- Status pills map to tokens only: warning (open/pending), success/primary (resolved), error (rejected/escalated), info otherwise.
- Empty state: strong gavel/icon empty with clear title+body — this is the “clean failure” demo surface when there are no disputes OR when showing a resolved/failed path elsewhere.

FEEL: Calm conflict desk. Breathing room. Scan status in under a second.

ANTI-AI: No courtroom stock photos, no angry red full-page themes, no cartoon justice scales. Professional ops UI.

Hi-fi, accessible contrast, consistent with other portal screens.
```

---

## After each screen

1. Run **Audit** then **Heatmap**.
2. Save Screen ID in [SCREEN_IDS.md](./SCREEN_IDS.md).
3. Bring the winning image to Cursor to port into Angular (don’t paste raw HTML).
