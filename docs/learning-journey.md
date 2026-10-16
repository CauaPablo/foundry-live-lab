# Learning journey — observe before extending

[Português](learning-journey.pt-BR.md) · [Architecture](architecture.md) ·
[Measured comparison](harness-comparison.md) · [API/evidence references](REFERENCES.md) ·
[Copilot paths: research and proposed next lesson](copilot-learning-paths.md)

This is an educational reference, not a production deployment prescription. Learn the Azure
GenAI stack by following a question across boundaries: model, agent runtime, tools, harness,
application, telemetry and voice. Copilot can help navigate code and propose tests; no Copilot
service integration or product choice is delivered by this outline.

## Before you start

**Prerequisites.** Clone the repository and set up the Python and Node environments once, from the
repository root — the commands below assume this and install nothing themselves:

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e "ai[dev]" -e "backend[dev]"
(cd frontend && npm ci)          # Node 24 (minimum 22.12)
```

Module 1 needs nothing else: `just demo` runs the whole app from recordings, with no Azure account.
The later modules read tests and code; the optional live steps need a provisioned Foundry project
(see the [README Quickstart](../README.md#-quickstart)). New terms are in the
[glossary](glossary.md).

**What this is.** A guided path backed by code, specs and recorded runs — not a finished live
workshop. A passing replay test is evidence about the protocol, not a new measurement of Foundry.

| State | Evidence and limit |
|---|---|
| Implemented | Prompt and hosted adapters, shared functions, Learn MCP, lexical retrieval, comparison, inspector and voice code exist. See linked modules below. |
| UI-integrated | The route map and component tests cover these surfaces; this increment did not launch a browser or verify its layout. |
| Historically live-verified | [Recorded corpus](../ai/tests/fixtures/recorded/README.md), with dates and provenance. Spec 020 AC16 closed on 2026-09-20: three probes, one prompt and one hosted turn per probe. Not a benchmark. |
| Replay | [Spec 050](../specs/050-demo-mode/) uses real recordings through a separate entrypoint. Its answer does not depend on the new question; hosted replay is not available in that demo listing. |
| Deferred/unverified | Current workshop execution/captures; hosted multi-turn continuity; full hosted voice exchange; interruption visualization; response-id lookup of hosted spans; Foundry IQ provisioning; future Copilot integration. |

Replay needs local dependencies but no Azure credentials. Live exercises require operator-provisioned
resources and Entra access; [infra](../infra/README.md) describes the manual boundary. Hosted build/
deployment has additional Docker, identity and Key Vault steps in the
[hosted guide](../ai/harness/langgraph/README.md). Live models/tools/container sessions spend money.
`search_web` uses the documented third-party `TAVILY_API_KEY` exception; never put it in the browser,
image or transcript. This app has no production sign-in boundary: keep paid controls off unless the
operator deliberately authorizes them. Read [SECURITY](../SECURITY.md).

## 1. Replay — learn what the app draws

**Objective:** distinguish recorded evidence from a new answer and locate the harness boundary.

- **Run:** `just demo`; in a separate shell,
  `cd ai && pytest -q tests/test_recorded_turn.py tests/test_hosted_recorded_turn.py`.
- **Code/evidence:** [demo spec](../specs/050-demo-mode/),
  [contract](../ai/harness/_shared/contract.py), [recordings](../ai/tests/fixtures/recorded/README.md),
  [route map](../frontend/src/state/route.ts).
- **Expected observation:** a non-dismissable replay banner; different typed questions do not create
  different model answers. Fixture tests exercise the contract without calling Azure. Hosted fixture
  tests are evidence even though the local demo does not offer hosted replay.
- **Exercise:** change the question twice and explain which parts are new browser input and which
  parts are the same recording. Find the contract validator rather than adding demo-only event types.
- **Limit:** replay proves rendering/protocol behavior against that corpus, not live quality,
  latency, current service availability or fresh tool results.

## 2. Function calling — selection is not execution

**Objective:** separate the model choosing a tool from the BFF answering a requested function call.

- **Run:** `cd ai && pytest -q tests/test_tools.py tests/test_prompt_adapter.py`.
  After verified live setup: `just backend` and `just frontend` in separate shells.
- **Code/evidence:** [registry](../ai/harness/_shared/tools/registry.py),
  [prompt adapter](../ai/harness/prompt_agent/adapter.py),
  [executor](../backend/app/tool_executor.py),
  [round trip](how-it-works/function-call-round-trip.md).
- **Expected observation:** `get_current_datetime`, `lookup_knowledge` and `search_web` share one
  implementation each. Prompt calls carry `executor: "app"`; the BFF executes them and submits
  outputs on the same Foundry conversation. One round trip has two upstream completions; a turn
  can contain more legs. The adapter bounds protocol rounds and does not select tools.
- **Exercise:** ask for the current time in São Paulo, inspect arguments/output, then identify
  `call_id` on both sides. Contrast `/playground/tools`, where a person chooses a function outside a conversation.
- **Limit:** the tool choice is the agent's, not a guaranteed consequence of wording. Do not add an
  app-side retry/planning loop. Paid playground controls are off by default and require operator consent.

## 3. Microsoft Learn MCP — who holds the session?

**Objective:** understand a remote MCP server without confusing its calls with local functions.

- **Run:** `cd ai && pytest -q tests/test_events.py tests/test_hosted_recorded_turn.py`.
- **Code/evidence:** [shared declaration](../ai/harness/_shared/agent_core.yaml),
  [prompt normalizer](../ai/harness/prompt_agent/events.py),
  [hosted graph](../ai/harness/langgraph/agent/graph.py),
  [comparison](harness-comparison.md).
- **Expected observation:** prompt runtime is Learn's MCP client and emits `mcp_call`; this hosted
  container is the MCP client and reports `microsoft_docs_search`/`microsoft_docs_fetch` as ordinary
  `tool_call`/`tool_result` pairs. Same corpus, different execution surface.
- **Exercise:** ask a Learn documentation question and locate the source payload, not just a citation
  in prose. Compare the dated Learn recordings before attempting a metered live repetition.
- **Limit:** missing `mcp_call` on this hosted path is not a failed lookup. Recorded payload shapes
  are evidence, not a promise that future service/server versions cannot change.

## 4. Local retrieval — lexical is not Foundry IQ

**Objective:** see retrieval as a tool, and distinguish the implemented algorithm from a future service.

- **Run:** `cd ai && pytest -q tests/test_tools.py`.
- **Code/evidence:** [knowledge tool](../ai/harness/_shared/tools/knowledge_tool.py),
  [local corpus](../ai/harness/_shared/tools/knowledge/),
  [Foundry IQ spec](../specs/049-foundry-iq-knowledge/).
- **Expected observation:** Markdown heading sections are ranked by lexical token matches, frequency,
  section length and heading bonus. Results carry repository paths, not external URLs; no match
  produces empty passages. No embeddings, vector index or Foundry IQ request runs here.
- **Exercise:** compare an exact term with a paraphrase that shares no keywords. Explain the missed
  match without inventing a semantic score; locate the `KnowledgeSource` extension seam.
- **Limit:** tokenization and a small authored corpus restrict recall, including across languages.
  Foundry IQ remains provisioning-bound; this module does not choose a new endpoint or provision Search.

## 5. Prompt versus hosted — where the agent loop runs

**Objective:** distinguish a swappable BFF adapter from an authored agent runtime deployed to Foundry.

- **Run:** `cd ai && pytest -q tests/test_harness_parity.py tests/test_hosted_graph.py`.
  After verified live provisioning, open `/playground` (Agent tab, *Compare with…*); do not deploy
  merely to complete the outline.
- **Code/evidence:** [prompt definition](../ai/harness/prompt_agent/agent.yaml),
  [shared core](../ai/harness/_shared/agent_core.yaml),
  [hosted graph](../ai/harness/langgraph/agent/graph.py),
  [factory](../backend/app/harness_factory.py),
  [comparison summary](../ai/tests/fixtures/recorded/compare-summary-20260920.json).
- **Expected observation:** definitions share `gpt-5.5`, instructions and tool declarations; prompt
  reasoning has its own `detailed` setting. Foundry runs the prompt decision loop; the hosted graph
  cycles model → tools → model inside its container. Hosted calls carry `executor: "foundry"`.
  A comparison in the Playground is two normal posts with independent conversation pointers, not a
  new orchestration API.
- **Exercise:** draw both execution paths and identify who selects, executes and renders each call.
  Recalculate first-text/total durations from the six summary rows, labelling them dated samples.
- **Limit:** shared definitions reduce drift, not latency confounders. No benchmark/cold-start cause
  is established. The graph has no checkpointer; forwarding a Foundry pointer does not certify hosted
  multi-turn continuity. The browser owns a drawing, while Foundry owns conversation state.

## 6. Events and traces — absence is information

**Objective:** distinguish wire events, token accounting, model reasoning summaries and stored spans.

- **Run:** `cd ai && pytest -q tests/test_contract.py tests/test_conformance.py`;
  `cd backend && pytest -q tests/test_traces.py tests/test_trace_injection.py`.
- **Code/evidence:** [streaming](how-it-works/streaming-events.md),
  [tracing](how-it-works/tracing-and-gateway.md), [trace lookup](../backend/app/traces.py),
  [turn state](../frontend/src/state/turn.ts).
- **Expected observation:** the inspector retains normalized BFF SSE payloads, not raw upstream
  frames. Prompt usage is summed across legs; reasoning tokens are part of output and cached tokens
  part of input. Current hosted streams report no usage/reasoning summary/MCP event; do not render
  invented money or infer a failed turn from those absences.
- **Exercise:** follow a prompt `response_id` to spans, then explain why hosted spans keyed by
  `microsoft.session.id` cannot be found by today's response-id drawer. Locate URL validation before KQL.
- **Limit:** reasoning summary is optional, not the full internal reasoning. Gateway logs are not
  tool spans. `unmapped_types()` is offline analysis, not live diagnostics (#39). Content-bearing
  traces and exports require review/redaction before publication.

## 7. Voice — one agent, different transport

**Objective:** follow control, audio and data independently without giving the browser an Azure key.

- **Run:** `cd ai && pytest -q tests/test_voice_events.py`.
  After verified live setup, start a call from the UI and end it explicitly.
- **Code/evidence:** [lifecycle](how-it-works/voice-live-lifecycle.md),
  [connect](../backend/app/voice_connect.py), [session](../backend/app/voice_session.py),
  [browser hook](../frontend/src/hooks/useVoiceSession.ts),
  [voice evidence](../ai/tests/fixtures/recorded/README.md).
- **Expected observation:** BFF holds the authenticated control WebSocket; browser WebRTC carries
  audio/data directly to Voice Live, not through the BFF/gateway. Attachment uses `agent_name` and
  `agent_project_name`. One static spoken-context item is the bounded constitution exception, not
  a second session-specific prompt. The UI distinguishes observed elapsed time from reported duration.
- **Exercise:** draw the three channels and locate a requested function in the control events and
  its transcript in the data channel. Contrast written citations with the recorded spoken-context pair.
- **Limit:** the hosted voice fixture has one `session.created` frame: attachment only. Full hosted
  speech and interruption visualization remain unverified; do not infer barge-in from silence.
  Microphone/browser permissions and live charges are separate from replay.

## Advanced (optional) — runtime drift without revealing content

Read this after module 6. [Streaming diagnostics](how-it-works/streaming-events.md#mapping-coverage-versus-runtime-diagnostics-spec-057-39)
separates offline mapping evidence in `GET /config` from unknown types encountered during a
prompt/hosted turn. Known lifecycle/partial types are deliberately ignored, not drift. Server
logs emit one bounded summary per turn: 16 turn-local opaque type aliases, an `invalid_type`
count and **omitted occurrences**, not omitted distinct types. Internal spellings are capped at
96 ASCII characters and never logged; counters saturate at 1,000,000 with explicit flags.
Aliases cannot identify a type across turns. Recovering the real shape requires separately
reviewed recordings; these logs contain no payload, prompt, arguments, outputs, identifiers or
raw spellings. Tests use clearly synthetic boundaries plus unchanged historical recordings,
not a newly measured service run. No browser event, endpoint or voice behavior was added.
