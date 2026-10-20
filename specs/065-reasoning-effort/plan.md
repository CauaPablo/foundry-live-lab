# Plan: Reasoning effort on the agent definition

## Approach

`agent_spec.py` already lets `effort` through `_REASONING_KEYS` without checking its value; validate
it against the set read from the reasoning-models page (`docs/REFERENCES.md`, the reasoning models
row). Set `effort: low` in `ai/harness/prompt_agent/agent.yaml` and apply with `just agent-apply`
(`ai/scripts/apply_agent.py` already maps the block onto `Reasoning(**…)`).

## Affected files

- `ai/harness/_shared/agent_spec.py` — validate `reasoning.effort`.
- `ai/harness/prompt_agent/agent.yaml` — `effort: low`.
- `ai/tests/test_agent_spec.py` — AC1, AC2.
- `docs/REFERENCES.md` — whether the definition accepted it, and the before/after measurement.

## i18n strings

n/a.

## Test strategy

| Acceptance criterion | Test | File |
|---|---|---|
| AC1 | `test_rejects_a_reasoning_effort_foundry_does_not_offer` | `ai/tests/test_agent_spec.py` |
| AC2 | `test_the_shipped_agent_asks_for_low_reasoning_effort` | `ai/tests/test_agent_spec.py` |
| AC3 | manual: `POST /chat` before and after, recorded in `docs/REFERENCES.md` | — |

## Risks / trade-offs

- Less thinking can mean worse tool choice or a thinner answer in text. Reversible: one line and a
  new version.
- Fewer reasoning summaries in the activity panel (spec 015 already treats "none" as normal).
