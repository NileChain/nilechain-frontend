# NileChain — Business brief for Brono (design freely)

Purpose: give Brono the **business only**, and let it invent the visual design itself. No token lock, no screenshot, no "match our current UI".

Paste the block below into Brono **Think** once, at the start of a fresh project.

---

## PASTE THIS INTO THINK

```text
You are the lead product designer for a new platform. Design its interface from scratch, with your own strong visual point of view. I am giving you the business, the users, and the data — not a design system. You decide the visual language, layout, color, type, and personality. Make choices a senior designer would defend.

===========================
THE BUSINESS
===========================

Name: NileChain.
Market: Egypt. B2B agriculture supply between FARMS (suppliers) and FOOD FACTORIES (buyers).

The problem: In Egypt, supply deals between farms and factories happen over WhatsApp, phone calls, and personal connections. A factory struggles to find a farm with the right crop, right quantity, right quality, close enough, and trustworthy enough to actually deliver on time. Farms have no organized door to reach serious buyers. Even when they agree, nobody measures risk before signing, there is no contract lifecycle, and nothing tracks what happens after: shipping, weighing, quality inspection, money, and conflicts.

NileChain turns that into one path:
supply request -> AI matching -> trust score -> Arabic contract -> both parties sign -> shipment, weighing, quality check -> money held and released -> dispute resolution if things break.

What NileChain is NOT (never imply these in the design): not a bank, not crypto/blockchain money, not a farm ERP, not a classifieds marketplace, not a chat app.

===========================
THE THREE USERS
===========================

1. FACTORY (buyer, procurement manager)
   Creates supply requests, runs the AI matching agent, reviews candidate farms and their risk report, generates and signs the Arabic contract, browses published crop listings, responds to counter-offers, receives shipments and inspects them, tops up a wallet and pays from it, opens a dispute when something goes wrong.

2. FARM (supplier, farm owner)
   Builds a profile: farm name, governorate, area in feddans, soil type, crops it sells with selling conditions, description, photos, documents, certificates, bank details. Publishes crops for sale, sends counter-offers, signs contracts, ships, and tracks its money and overdue payments.

3. ADMIN (platform operator)
   Verifies users and entities, suspends accounts, resolves disputes and actually moves money, uploads knowledge documents that feed contract generation, and runs monitoring on signed contracts.

===========================
CORE MECHANICS THE UI MUST EXPRESS
===========================

SUPPLY REQUEST (factory)
Crop type, quantity in tons, target price EGP per ton, delivery date, optional quality specs (free text plus structured: max moisture %, max impurities %, grade, lab test required), search scope (same governorate / nearby / nationwide), and delivery terms (delivery at farm gate or factory gate, who pays freight, who carries risk in transit).
There is a price hint: if the target price is far from the current market price for that crop, the user is warned while typing.

AI MATCHING
Hard filter first: the farm must actually sell that crop. Then the farm's declared selling conditions apply (enough quantity, delivery window fits, minimum price not above the offer). Excluded farms never come back for the same request.
Score out of 100:
  40 points crop match (guaranteed, since it passed the filter)
  20 points same governorate (in same-governorate mode)
  20 points if the farm is admin-verified
  up to 20 points scaled from the farm's trust score
Results are ranked, top 5 by default, and the response honestly states how many qualified and how many were cut off. The agent has real tools: search farms, compute trust, widen the radius once (nationwide only, 50km -> 300km), suggest one alternative, raise a warning if trust is under 40, and generate the contract.

TRUST SCORE — the emotional center of the product
0 to 100. HIGH means safer, not scarier. Composed of:
  25 profile completeness (name, address, governorate, phone, area, document, crop)
  25 valid certificates (expired ones count zero)
  30 contract history (each signed contract adds 10)
  20 ratings (average out of 5, scaled)
Bands: above 70 comfortable, 40 to 70 middle, under 40 HIGH RISK — and the contract will not be generated unless the factory explicitly confirms it understands and wants to continue anyway. This confirmation moment matters and should feel serious, not like a dismissible toast.

CONTRACT
Written in Arabic, starts with the Basmala. Contains: both party names, subject, quantity and specs, price, payment terms (30% advance, 70% on delivery), delivery terms, penalties, dispute resolution at the Cairo Economic Courts, and signature blocks.
States: awaiting signature, signed, cancelled. Each party signs SEPARATELY — the deal is only closed when both have signed. If either rejects, the contract is cancelled and the match is rejected. If the text is regenerated after signing, both signatures are cleared and it goes back to awaiting signature.
After full signing, the signed text is hashed (SHA-256) and there is a public verification page where anyone can check the hash. This is a content integrity chain inside the platform — NOT a money blockchain. The design must not use crypto imagery.
Attachments are real: certificates, delivery notes, quality reports, weighbridge tickets.

FULFILLMENT — after signing
States: planned, shipped, received, quality inspected, fulfilled. Plus one distinct terminal state: REJECTED AT GATE.
The farm records the carrier, tracking number, and notes.
The factory MUST record the weighbridge weight in tons when receiving — it is not optional. Payment is based on the lower of weighed vs contracted quantity.
Quality inspection: accepted quantity can never exceed the weighed quantity; deductions release money back.
Rejection at gate: the truck arrived and the factory refused it — bad quality, wrong crop, damage, short weight, delay, or a written reason. Who pays for the truck's return depends on the delivery terms. Held money returns to the factory.

MONEY
On full signing, a payment schedule is created: 30% advance, 70% on delivery, each with a due date and status, and overdue is visible.
Wallet: the factory tops up (payment gateway, sandbox for now). On signing, the deal amount plus fees is held from the balance. On release, the farm's net lands in its wallet and fees go to the platform. The farm withdraws available balance.
Be honest in the interface: this is an in-platform demo wallet, not a bank settlement. A clear, dignified disclaimer — not a scary red alarm.

DISPUTES
Either party on a signed contract can open one: open, under review, resolved, rejected.
An open dispute FREEZES everything: no marking paid, no confirming receipt, no releasing money. There must be a visible freeze banner.
The admin decides: money to the farm, to the factory, or split — and the balances actually move.

OTHER REAL SURFACES
- Crop listings: farms publish crops; factories filter by crop or governorate, open a detail drawer with description, photos and certificates, and can start a supply request pre-filled from it.
- Supplier scorecard: does this farm deliver on time, does it have quality problems, do factories buy from it again.
- Counter-offers: a farm can counter on price, quantity, or date; the factory accepts or rejects; accepted terms flow into the contract.
- Messaging: tied to a specific match, and only opens AFTER both parties sign. Before that, people negotiate outside the platform, as they really do.
- Notifications: contract ready, someone signed or rejected, new match, exclusion, offer changed, weather risk, market price moved, shipping and receipt and gate rejection, dispute, overdue payments, certificate about to expire.
- Market prices: crop price by governorate over time, with source and date, filterable, charted.
- Assistant drawer on an open deal: ask why this farm was matched; answers come from the deal data and stored knowledge.
- Dashboards: the farm sees trust score with its four components, active matches, signed contracts, rating, overdue money, on-time rate, expiring certificates, returning buyers. The factory sees open requests, matches, contracts, total purchases, average candidate trust, market trend, and an attention strip telling it exactly what is blocking progress right now.
- Admin: user verification queue, contracts, dispute queue, stuck shipments, knowledge base uploads, monitoring runs.

===========================
LANGUAGE, TONE, CONTEXT
===========================
- Primary interface language: Modern Standard Arabic, right-to-left layout. English is secondary.
- The brand wordmark "NileChain" always stays left-to-right and is never mirrored.
- Numbers, EGP amounts, tons, percentages and dates must be easy to scan; treat decision numbers as first-class typographic objects.
- Tone: calm, competent, credible. This is operational software a factory procurement manager opens every week, and a farm owner trusts with real money. It is Egyptian and agricultural, and it should feel like it was designed for that reality — not a generic global SaaS skin.

===========================
YOUR DESIGN MANDATE
===========================
You choose everything visual: palette, typography, spacing rhythm, grid, component language, illustration or its absence, motion. Have taste. Have opinions. Make it feel designed by a human who cared, with details someone would notice on the second look.

I want it to feel ALIVE, not stiff, and NATURAL, not machine-made:
- Vary composition and rhythm between sections instead of repeating identical card grids.
- Let content breathe; use asymmetry and intentional white space where it helps.
- Use restrained, purposeful motion and hover behavior, not decoration for its own sake.
- Prefer real product chrome and honest content over placeholder marketing filler.
- Beautiful, but usable first: hierarchy, contrast, focus states, touch targets of at least 44px, and accessible color contrast.

Avoid the generic AI-generated look: no purple and indigo gradient clichés, no glassmorphism cards floating over blurred stock photos, no neon glow, no 3D clay icons, no robot or brain imagery, no sparkle-as-personality, no default Inter everywhere, no "unlock the future of agriculture" copy. If a choice feels like a template, replace it with something more specific to this business.

Deliver high-fidelity, editable, production-quality screens.
```

---

## Then generate screens

Use [FROM_SCRATCH_SCREENS.md](./FROM_SCRATCH_SCREENS.md) — one prompt per screen, content-only, no layout dictation.
