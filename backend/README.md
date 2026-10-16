# `backend/` — the BFF

FastAPI (Python 3.12, async). A **Backend For Frontend** — the one server the browser talks to —
not an agent runtime. The agent runs in Foundry; this layer streams what it does to the browser,
executes the function tools Foundry asks for, and keeps every credential on the server.

## What lives here

| Concern | Where |
|---|---|
| App assembly, CORS, the injectable seams tests use | `app/main.py` |
| Configuration, read once from the environment | `app/settings.py` |
| SSE streaming of `AgentEvent`s to the browser | `app/sse.py`, `app/routers/chat.py` |
| Choosing the harness **per request** from the agent's kind | `app/harness_factory.py` (`HARNESS_FOR_KIND`) |
| Executing the function tools Foundry asks for | `app/tool_executor.py` |
| The project's agents: listing, detail, versions, promote | `app/agents.py`, `app/routers/agents.py` |
| Proposing an instructions edit (validates, writes nothing) | `app/agent_definition.py` |
| Bounds on the free-text inputs | `app/limits.py` |
| Application Insights span lookup | `app/traces.py`, `app/routers/traces.py` |
| Voice Live: dialling, the WebRTC handshake, the tool round trip | `app/voice_connect.py`, `app/voice_session.py`, `app/routers/voice.py` |
| Text-to-speech for reading an answer aloud | `app/speech.py`, `app/routers/speech.py` |
| Replay mode — the whole app with no Azure credential | `app/demo.py`, `app/routers/demo.py` |

## Routes

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/config` | What this deployment is: harness, agent, model, flags, limits, event coverage |
| POST | `/chat` | One turn, streamed as SSE (`message`, optional `conversation_id`, optional `agent`) |
| GET | `/agents` | The project's agents, one request to Foundry |
| GET | `/agents/{name}` | One agent's definition, versions and served version |
| GET | `/agents/{name}/definition` | The definition this build was made from (this repository's own agents) |
| POST | `/agents/{name}/definition/proposal` | Validate an instructions edit and answer a diff — writes nothing |
| POST | `/agents/{name}/versions/{version}/promote` | Serve an earlier version — the app's only write, off by default |
| GET | `/trace/{response_id}` | A run's spans from Application Insights |
| GET | `/tools` | The function tools and their schemas |
| POST | `/tools/{name}/run` | Run one tool outside any conversation — off by default |
| POST | `/speech` | Synthesize an answer's text |
| POST | `/voice/session` | Exchange an SDP offer for Voice Live's answer |
| GET | `/voice/session/{id}/events` | The voice session's tool activity, as SSE |
| DELETE | `/voice/session/{id}` | Hang up |
| GET · POST | `/demo` · `/demo/recording` | Replay entrypoint only (`app.demo:create_demo_app`) |

## What must never live here

**No agent-loop logic** (constitution §8). This layer never chooses *which* tool to call, never
re-prompts the model, never loops on model output, and never duplicates state Foundry owns.

Executing a function tool Foundry asked for, and submitting its output, **is** allowed — that is the
documented client-side contract. The distinction is *choice* versus *execution*.

## Run it

```bash
just backend          # live, reads .env
just demo             # replay, no Azure credential (also starts the frontend)
```

## Gate

```bash
ruff check . && ruff format --check . && pytest -q
```
