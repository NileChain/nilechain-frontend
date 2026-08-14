# Brono screen prompts — NileChain demo set

Paste [BRIEF.md](./BRIEF.md) into Think first. For each screen: upload a current app screenshot → **Redesign** (or Generate if no shot). Then run **Audit** + **Heatmap**. Keep one approved hi-fi per screen.

---

## 1) Landing — `/landing`

**Prompt**

> Redesign the NileChain public landing for Egyptian B2B agri (Arabic RTL). First viewport: brand NileChain dominant, one headline, one short supporting line, two CTAs (Join as farm / Join as factory), one product preview showing match → trust → contract. Agro-Technical Precision tokens only (primary #1B5E20, mint #E8F5E9, paper #FBF9F8). Work Sans + IBM Plex Sans Arabic. No purple, no stat strip in hero, no floating promo chips on media.

**Audit focus:** brand hierarchy, CTA contrast, RTL, mobile nav.

---

## 2) Factory supply request — `/factory/supply-request`

**Prompt**

> Redesign a factory “create supply request” form: crop, quantity (tons), target price EGP/ton, delivery date, delivery point (factory gate / farm gate), quality notes, structured QC (moisture, impurities, grade, lab), geographic scope, governorate multi-select. Clear section headings, primary submit “Find suppliers”, ghost cancel. Sidebar layout. Tokens only. Arabic RTL.

**Audit focus:** label hierarchy, required-field clarity, chip selection affordance, sticky submit on mobile.

---

## 3) Agent progress — `/factory/agent-progress`

**Prompt**

> Redesign AI matching progress “command center”: phase badge (idle/running/done), horizontal stepper (stacks on mobile), current-step panel with illustrative activity list, elapsed seconds. Green NileChain primary — no purple AI glow. Note that timeline is illustrative. Arabic RTL.

**Audit focus:** active step visibility, status color contrast, heatmap on primary action (Run / View matches).

---

## 4) Contract signing — `/factory/contract-signing`

**Prompt**

> Redesign contract generate + approve flow: metadata form, status stepper (draft → pending signatures → approved), Arabic contract preview area, Approve + Download actions, wallet-error empty state with link to wallet. Calm legal workspace, paper surfaces, primary green. RTL.

**Audit focus:** stepper readability, primary approve CTA, error recovery path.

---

## 5) Wallet — `/factory/wallet`

**Prompt**

> Redesign NileChain wallet: available vs held balances as two clear metric tiles, sandbox disclaimer callout, top-up panel, withdraw panel, recent ledger list. Tabular numbers, EGP. Tokens only. RTL. Look trustworthy, not fintech-neon.

**Audit focus:** balance hierarchy (available > held), disclaimer visibility, CTA contrast.

---

## 6) Disputes (clean failure) — `/factory/disputes`

**Prompt**

> Redesign disputes inbox for farm/factory: subtitle, list of disputes with status pill, type, description, date, link to contract. Strong empty state (gavel icon). Status colors from tokens (error/warning/primary/outline) — no random Tailwind greens. RTL. One purpose: triage disputes.

**Audit focus:** status scanability, empty state clarity, touch targets on open-contract.

---

## After each screen

1. Save Screen ID (Sidebar → More → Copy Screen ID) into [SCREEN_IDS.md](./SCREEN_IDS.md).
2. Export Figma if on a paid plan with export.
3. In Cursor Agent: attach screenshot + audit notes → port to Angular under `src/app/features/...` using `_tokens.scss`.
