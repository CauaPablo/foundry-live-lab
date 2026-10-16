# `prompt-agent/` — Foundry runs the loop

The harness that ships. The agent's instructions, model and tools live **in Foundry**; this folder
contains the definition that puts them there and the adapter that streams the result back.

## What runs where

| | Runs in **Foundry** | Runs in **this app** |
|---|---|---|
| Deciding which tool to call | ✅ | never |
| Deciding when to stop | ✅ | never |
| Calling the model | ✅ | never |
| `microsoft_learn` (MCP) | ✅ | — |
| `get_current_datetime` | — | ✅ |
| `lookup_knowledge` | — | ✅ |
| `search_web` | — | ✅ |
| Turning the stream into `AgentEvent`s | — | ✅ |

The three function tools are the interesting rows. Foundry emits a `function_call` item and **stops**.
Our backend looks the name up in the registry, runs it, and posts a `function_call_output` back on
the same conversation. If it doesn't, the run hangs until it expires ten minutes later — and from the
browser that looks like the stream simply stopped.

That is why `check_stream` in the contract has an invariant for it. A local `tool_result` is
not an upstream receipt, however: submission can fail after execution.

The adapter permits `max_turns` execution legs (default 8) plus **one settlement leg** to submit
the last outputs: at most 9 upstream requests by default. Settlement never executes new tool
requests; it reports them and ends with `turn_limit_exceeded`, explicitly leaving them unanswered.
It may instead finish normally, with one `done` and summed usage. This cap is a protocol bound,
not an agent decision or an unlimited extension. See the
[round-trip budget and failure limits](../../../docs/how-it-works/function-call-round-trip.md#the-budget-includes-settling-the-last-outputs-spec-054).

## The definition

[`agent.yaml`](agent.yaml), applied by `ai/scripts/apply_agent.py`:

```bash
just agent                                        # apply
python scripts/apply_agent.py --dry-run           # validate and print, no Azure needed
```

Each apply creates a new **immutable version**; that is the rollback story, so running it twice is
normal. The loader cross-checks every declared function tool against the registry, so a definition
naming a tool nobody implements fails at load rather than in production.

The schema is **ours**, marked `schema_version: foundry-live-agent/v1`. Foundry's own `agent.yaml`
is deprecated and its replacement describes hosted agents. See
[`docs/harness-comparison.md`](../../../docs/harness-comparison.md).

## The model, and the gateway it does not use

```yaml
model: gpt-5.5          # in ../_shared/agent_core.yaml, shared with the hosted agent
reasoning:
  summary: detailed     # in agent.yaml — the reasoning card's source
```

A **plain** deployment name sends inference straight to the Foundry resource. The
`<connection>/<model>` form would route it through a bring-your-own-model connection — the APIM
gateway — instead. The plain name is a deliberate choice, recorded beside the line in
`agent_core.yaml`, and both harnesses share it so they differ in one thing only (where the loop
runs). `apply_agent.py --dry-run` prints whether the gateway is in the path.

`gpt-5.5` is a reasoning model, and the definition asks for `detailed` summaries: `auto` lets the
model skip them on short tool-calling legs, and `reasoning` cannot be sent per request beside an
agent reference. A turn with no summary is still a normal state the UI renders.

## Trade-offs

You maintain no runtime code and no container, and you cannot express custom orchestration. If you
need a graph, that is the [`langgraph`](../langgraph/README.md) harness — built, deployed as a hosted agent, and
compared with this one in [`docs/harness-comparison.md`](../../../docs/harness-comparison.md).
