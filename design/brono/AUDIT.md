# Demo UI audit specs → Angular port

Baseline audit against Agro-Technical Precision + presentation demo path. Implemented in Angular without waiting on live Brono generations (same intent as Brono Audit findings).

| Screen | Findings | Angular response |
|--------|----------|------------------|
| Landing | Hero already strong; keep brand + CTA focus | Keep structure; no token drift |
| Supply request | Flat form; weak section boundaries; radios hard to scan | Section blocks + choice chips |
| Agent progress | Hardcoded `green-100` / `orange-100` break tokens | Token-based mode chips |
| Contract signing | Stepper weak connectors on desktop | Stronger stepper chrome |
| Wallet | Balances not carded; panels float without surface | Balance tiles + panel cards |
| Disputes | Status pills low contrast; list dense | Status pills + clearer rows |

## Checklist (demo week)

- [x] Brief locked (`BRIEF.md`)
- [x] Per-screen prompts (`SCREEN_PROMPTS.md`)
- [x] Angular port of audit fixes (this pass)
- [ ] Paste brief into Brono Think (human — requires account)
- [ ] Upload screenshots → Redesign + Audit + Heatmap per screen
- [ ] Fill Screen IDs after Brono generation (`SCREEN_IDS.md`)
- [ ] Optional: Brono MCP Pro URL in Cursor (`MCP_SETUP.md`)
