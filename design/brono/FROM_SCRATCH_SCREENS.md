# NileChain — screen generation prompts (Brono designs freely)

Paste [FROM_SCRATCH_BUSINESS.md](./FROM_SCRATCH_BUSINESS.md) into Think first.

Then generate screens one at a time with the prompts below. These describe **what the screen must do and contain** — the visual design is Brono's call. Generate screen 1 first, approve the direction, then generate the rest so they inherit the same language.

Order matters: 1 (identity) -> 2 (app shell) -> 3-8.

---

## 1) Landing page — sets the whole visual identity

```text
Design the public landing page for NileChain (Arabic, RTL).

Who lands here: an Egyptian food factory procurement manager, or a farm owner. In seconds they must understand: this platform connects farms and factories, scores who you can trust, produces a real Arabic contract, and follows the deal through shipping, quality and money.

Must communicate, in whatever structure you think is strongest:
- The brand NileChain as the dominant identity signal.
- One clear promise sentence and one supporting line.
- Two entry points: join as a farm, join as a factory.
- A believable glimpse of the actual product: a matched farm, a trust score, a contract status. Make it look like real software, not an abstract illustration.
- How it works: request, AI matching and trust scoring, Arabic contract and signing, then execution.
- Why each side cares: farms get organized access to serious buyers; factories get vetted suppliers and risk visibility before signing.
- A closing invitation and a simple footer.

This is the screen that defines the visual identity for the entire product, so commit to a distinctive palette, type pairing and component language here. It should feel Egyptian, agricultural and technically serious at the same time. Alive and confident, not stiff, and definitely not a generic AI SaaS template.

Give me a polished desktop page, and show how the navigation collapses on mobile.
```

---

## 2) Factory dashboard — sets the app shell

```text
Design the FACTORY dashboard for NileChain (Arabic, RTL), using the identity you established on the landing page.

This screen defines the in-app shell: navigation, page header, content rhythm, card and data language. Everything after this should inherit it.

The factory user needs to see, at a glance:
- What is blocking progress right now: a contract waiting for my signature, a counter-offer waiting for my reply, a shipment waiting to be received and inspected, an overdue payment, an open dispute. This "what needs me" element is the most important thing on the page.
- Open supply requests and their state.
- Current matches and contracts.
- Approximate total purchases.
- Average trust score of candidate suppliers.
- A market price trend for the crops it buys.

Navigation the factory needs somewhere sensible: dashboard, new supply request, my requests, matches, crop listings, contracts, wallet, messages, notifications, negotiations, disputes, profile.

Make the numbers legible and decisive. Make the "needs your attention" moment feel real, like an operations tool, not a marketing widget board.
```

---

## 3) Create supply request — the most important form

```text
Design the CREATE SUPPLY REQUEST screen for a factory in NileChain (Arabic, RTL), inside the app shell.

The factory is committing real money, so the form must feel serious but not exhausting.

It must capture:
- Crop type (chosen from available crops; if the crop is missing, a way to request adding it)
- Quantity in tons
- Target price in EGP per ton, with a live hint if the price is far from the current market price for that crop
- Delivery date
- Delivery point: at the farm gate or at the factory gate, plus who pays freight and who carries risk in transit — with plain-Arabic explanation of what each choice means
- Quality: free-text specifications, plus structured fields — maximum moisture percentage, maximum impurities percentage, grade, and whether a lab test is required
- Search scope: same governorate, nearby, or nationwide
- Governorate selection from Egyptian governorates, multi-select
- Submit action that means "find me suppliers", plus a way to cancel

Group these so the user understands the shape of the decision instead of facing a wall of inputs. Make selections feel tactile and unmistakable. Handle the mobile case well: it must stay usable on a phone in a factory office.
```

---

## 4) AI matching in progress, then results

```text
Design the AI MATCHING screen for a factory in NileChain (Arabic, RTL): the waiting state and the results state.

WAITING STATE
The matching agent is working. Show the request context (crop, tons, price, date, governorate, quality) and a progress narrative of what the agent is doing: searching farms that sell this crop, applying the farm's selling conditions, computing trust scores, ranking, and preparing the deal. Include elapsed time. Label this progress narrative honestly as explanatory, since it is an illustration of the pipeline, not a live tool log.

RESULTS STATE
Show the ranked candidate farms. For each: farm name, governorate and distance, verified badge if admin-verified, the match score out of 100, and the trust score out of 100 with its band (above 70 comfortable, 40 to 70 middle, under 40 high risk). Make it obvious how the match score was earned: crop match, same governorate, verification, trust contribution.
The top recommendation should stand out.
Also state honestly how many farms qualified in total and how many were cut off by the top-5 limit.
Actions per farm: view full risk report, exclude this farm from this request, or move toward a contract.
Show the high-risk case: when a farm's trust is under 40, the path to a contract is blocked until the factory explicitly confirms it understands the risk and still wants to continue. Design that confirmation as a serious decision moment.

The intelligence here is agricultural and financial, not sci-fi. No robots, no neural imagery.
```

---

## 5) Arabic contract and dual signing

```text
Design the CONTRACT screen for NileChain (Arabic, RTL), where a supply contract is generated, reviewed and signed.

The contract itself is Arabic, opens with the Basmala, and contains: both party names, the subject of the agreement, quantity and specifications, price, payment terms of 30% advance and 70% on delivery, delivery terms, penalties, dispute resolution before the Cairo Economic Courts, and signature blocks.

The screen must handle:
- The document itself, presented so that a long Arabic legal text is genuinely readable and navigable.
- Key terms surfaced quickly, so the user does not have to read everything to understand the deal.
- Contract state: awaiting signature, signed, or cancelled — and critically, WHO has signed and who has not. Each party signs separately; the deal only closes when both have signed.
- The signing action itself, which should feel weighty and deliberate.
- Requesting changes, and rejecting.
- Attachments: certificates, delivery notes, quality reports, weighbridge tickets — uploaded by either party.
- After both signatures: a signed state, an integrity hash badge with a link to a public verification page, and the ability to download a PDF.
- The failure case: the factory's wallet balance is not enough to hold the deal amount, so signing cannot proceed. Show a clear, non-humiliating recovery path to top up the wallet and retry.

This should feel like a legal desk: quiet, precise, trustworthy. The integrity hash is content verification, not cryptocurrency — no blockchain visual clichés.
```

---

## 6) Fulfillment: shipping, weighbridge, quality, gate rejection

```text
Design the FULFILLMENT screen for a signed NileChain deal (Arabic, RTL) — what happens after both parties sign.

Show the journey and its current position: planned, shipped, received, quality inspected, fulfilled. Plus one distinct terminal outcome that is not part of the happy path: rejected at the gate.

The farm's side: record carrier company, tracking number, and notes when shipping.
The factory's side on receipt: record the weighbridge weight in tons — this is mandatory, not optional — and optionally attach the weighbridge ticket. Make it clear that payment is calculated on the lower of the weighed and contracted quantity.
Quality inspection: record accepted quantity, which can never exceed the weighed quantity, with deductions returning money.
Gate rejection: before accepting the load, the factory can refuse it — bad quality, wrong crop, damage, short weight, delay, or a written reason — and the screen must show the consequence: who pays for the truck's return based on the agreed delivery terms, and that held money returns to the factory.

Also show the frozen state: if a dispute is open on this deal, receipt confirmation, payment marking and money release are all blocked, with a visible freeze explanation.

This is logistics reality. Make the mandatory weight moment unmissable, and make the rejection path look deliberate and dignified rather than like an error.
```

---

## 7) Wallet and payment schedule

```text
Design the WALLET screen for NileChain (Arabic, RTL), for both the factory and the farm.

The factory needs: current available balance and currently held balance in EGP, a way to top up through the payment gateway, a view of what is held against which deal, and the payment schedule of each signed contract — 30% advance and 70% on delivery, each with due date, status, and clear visibility of anything overdue.

The farm needs: available balance, expected incoming amounts, overdue money owed to it, and a way to withdraw available balance to its bank details.

Honesty requirement: this is an in-platform demo wallet in sandbox mode, not a bank settlement. State that clearly and calmly — it should read as transparency, not as a broken-system warning.

Money must be effortless to read: amounts, dates and statuses should be scannable in a glance. Make it feel trustworthy and grounded — not neon fintech, not crypto.
```

---

## 8) Disputes and admin resolution

```text
Design the DISPUTES experience for NileChain (Arabic, RTL) — two related views.

PARTY VIEW (farm or factory)
A list of my disputes with status: open, under review, resolved, rejected. Each shows the type, description, date, and a link to the related contract. Opening a new dispute on a signed contract, with a type, description and evidence attachments. Include a strong empty state for when there are none.
Make the consequence visible: while a dispute is open, the deal is frozen — no marking paid, no confirming receipt, no releasing money.

ADMIN VIEW
A queue of disputes to resolve, with the deal context: contract, parties, amounts held, fulfillment state, and the evidence both sides submitted. The admin decides the outcome: money to the farm, to the factory, or split between them — and that decision actually moves the balances. Show the resolution moment as a consequential action with a clear summary of what will happen to the money.

Tone: a calm conflict desk. Serious, fair, readable — not alarming red everywhere, and not cartoonish justice imagery.
```

---

## After each screen

1. Run **Audit** and fix what it flags.
2. Run **Heatmap** on the landing, matching results and wallet — attention should land on the primary action and the trust/money numbers.
3. Copy the Screen ID into [SCREEN_IDS.md](./SCREEN_IDS.md).
4. Bring the approved screens back to Cursor to port into the Angular app.
