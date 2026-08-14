# Brono + NileChain UI workflow

Operational pack for improving demo UI with [Brono](https://brono.ai/) while shipping in Angular.

## Track A — let Brono design freely (current approach)

Give Brono the business, not our UI. It invents the visual language.

| File | Purpose |
|------|---------|
| [FROM_SCRATCH_BUSINESS.md](./FROM_SCRATCH_BUSINESS.md) | **Start here** — paste into Think once |
| [FROM_SCRATCH_SCREENS.md](./FROM_SCRATCH_SCREENS.md) | **Then** — 8 screen prompts, content only |

## Track B — constrain Brono to our existing tokens

| File | Purpose |
|------|---------|
| [MASTER_PROMPT.md](./MASTER_PROMPT.md) | Token-locked Think brief |
| [SCREEN_PROMPTS_FULL.md](./SCREEN_PROMPTS_FULL.md) | Token-locked per-screen redesign prompts |
| [BRIEF.md](./BRIEF.md) | Short token sheet |
| [SCREEN_PROMPTS.md](./SCREEN_PROMPTS.md) | Short prompts |

## Shared

| File | Purpose |
|------|---------|
| [AUDIT.md](./AUDIT.md) | Audit findings mapped to Angular changes |
| [SCREEN_IDS.md](./SCREEN_IDS.md) | Fill after Brono generations (for MCP) |
| [MCP_SETUP.md](./MCP_SETUP.md) | Pro/Ultra MCP → Cursor |

**Do not** treat Brono HTML as production. Port into `src/app/features/...`.

With Track A the visual language comes from Brono, so once a direction is approved, `src/styles/_tokens.scss` gets updated to match the new palette and type scale before porting screens.
