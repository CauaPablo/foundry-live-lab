# Spec: Reasoning effort on the agent definition

| | |
|---|---|
| **ID** | 065-reasoning-effort |
| **Status** | done |
| **Author** | Reginaldo Silva |
| **Date** | 2026-10-16 |
| **Clarified** | 2026-10-16 — the owner chose `low` after the voice-latency analysis below |

## Problem / motivation

A spoken question that needs a web search waits **8–13 s** before the agent says it is going to look
— measured in Application Insights on 2026-10-16, session 12:01–12:04 UTC, agent version 9: the gap
between `invoke_agent` starting and its `chat` span. The same kind of question was answered in under
1 s on another turn of that session, so the time is the model deciding, not the network. The
definition sets no reasoning effort, so `gpt-5.5` runs at its default; in a spoken conversation that
time is silence.

Effort cannot be set per request: Foundry refuses `reasoning` beside an agent reference (observed
2026-09-15). It lives on the definition or nowhere.

## Goals

- The prompt agent's definition states its reasoning effort, and the value is validated before it
  reaches Foundry.

## Non-goals

- A separate voice-only agent. Text and voice share one definition (§4); a voice twin would be a
  second copy of the instructions.
- The hosted (LangGraph) harness: its `reasoning:` block is per-harness by design and it does not
  ask Foundry for reasoning at all.

## User-facing behavior

Shorter thinking before the first word, in voice and in text. Reasoning summaries may appear less
often; a turn with no summary is already a normal state (spec 015).

## Acceptance criteria

1. **AC1** — An `effort` outside the documented set is refused when the definition is loaded.
2. **AC2** — The shipped prompt-agent definition asks for `effort: low`.
3. **AC3** — A live text turn on the new version reports its reasoning tokens and time to first
   text, recorded beside the version-9 baseline (§5: measured, not assumed).

## Contract / data impact

None to the `AgentEvent` set or `POST /chat`. The agent definition gains one field.

## Open questions

- [x] Which value — `low` (owner, 2026-10-16). `minimal`/`none` were not chosen: they trade tool
      judgement for speed and nothing has measured them here.
- [x] Is `effort` accepted on a **definition**, not only on a request? Answered by `create_version`;
      the outcome is recorded in `docs/REFERENCES.md`.
