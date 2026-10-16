# Spec: Follow the newest version again

| | |
|---|---|
| **ID** | 064-follow-newest-version |
| **Status** | done |
| **Author** | Reginaldo Silva |
| **Date** | 2026-10-15 |
| **Clarified** | 2026-10-15 — the owner delegated the open decisions to the end-to-end pass |

## Problem / motivation

Spec 031 lets a person roll an agent back to an earlier version. The end-to-end pass on 2026-10-15
did exactly that on screen — and then found no way back. A pinned project stays pinned: every new
version `apply_agent.py` creates is ignored until someone pins it by number, and pinning the newest
by number is still a pin, so the next version is ignored too. The only route to the original state
(the endpoint's `@latest` rule) was a request typed by hand.

The service accepts that state as a write — verified live on 2026-09-20 (CLAUDE.md, spec 031) and
again on 2026-10-15, when the pass restored `foundry-live-agent` to `@latest` through the same
route.

## Goals

- When the project is pinned, the screen offers to follow the newest version again, under the same
  confirmation and the same gates as a rollback.

## Non-goals

- Any new route or request shape: the existing promote route already takes the sentinel.
- Traffic splitting, or choosing which version is "newest" — the service decides.

## User-facing behavior

Under the "pinned to vN; the newest is vM" notice, a control *Follow the newest version* /
*Seguir a versão mais nova*. Pressing it asks first, with the rollback's own sentence about who the
change affects; confirming promotes `@latest`.

## Acceptance criteria

1. **AC1** — Given a pinned agent this build may promote, the control renders under the notice.
2. **AC2** — Confirming calls the promote handler with `@latest`; cancelling calls nothing.
3. **AC3** — No control when the agent is not pinned, when `can_promote` is off, or when the
   agent is not one this repository authored.
4. **AC4** — Its label and confirmation exist in `en` and `pt`.

## Contract / data impact

None. `POST /agents/{name}/versions/@latest/promote` is the existing route; the BFF's
`OWNED_AGENT_NAMES` and flag gates still apply server-side.

## Open questions (clarify before planning)

- [x] Same confirmation pattern as a rollback — yes, the change is just as global.

## Out of scope / deferred

- None.
