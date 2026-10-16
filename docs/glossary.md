# Glossary

**🌐 Language:** **English** · [Português 🇧🇷](glossary.pt-BR.md)

The words this repository uses without stopping to explain them. One sentence each, and where to
see the thing in the code.

| Term | In one sentence | Where in the code |
|---|---|---|
| **BFF** (Backend For Frontend) | The one server the browser talks to; it streams the agent's work to the page, executes function tools, and keeps every credential off the browser. | [`backend/`](../backend/README.md) |
| **Harness** | The adapter that connects one kind of agent to the app and turns everything it does into the same stream of events. | [`ai/harness/`](../ai/README.md) |
| **Prompt agent** | An agent defined only by configuration — model, instructions, tools — whose loop Foundry itself runs. | [`ai/harness/prompt_agent/`](../ai/harness/prompt_agent/README.md) |
| **Hosted agent** | An agent you write as code (here, a LangGraph graph), package as a container, and Foundry runs for you. | [`ai/harness/langgraph/`](../ai/harness/langgraph/README.md) |
| **Agent loop** | The cycle of calling the model, letting it pick a tool, running the tool and calling the model again; in this project it never runs in the app. | [constitution §8](../.specify/constitution.md) |
| **Responses API (Agents v2)** | Foundry's current API for talking to an agent: you create a response against an agent, and the answer streams back as events. | `ai/harness/prompt_agent/adapter.py` |
| **Conversation id / response id** | `conv_…` names the conversation Foundry keeps the history of; `resp_…` names one answer within it, and is what traces are looked up by. | `backend/app/routers/chat.py`, `backend/app/traces.py` |
| **Function tool** | A tool the agent can ask for but cannot run itself: Foundry stops, the BFF runs it, and sends the output back. | [`ai/harness/_shared/tools/`](../ai/harness/_shared/tools/) |
| **Function-call round trip** | That stop-run-answer exchange; if the answer never comes, the run hangs and expires after ten minutes. | [how it works](how-it-works/function-call-round-trip.md) |
| **MCP** (Model Context Protocol) | A standard way for an agent to use a remote tool server; here, Microsoft Learn's documentation search, which Foundry calls directly. | `ai/harness/_shared/agent_core.yaml` (`microsoft_learn`) |
| **SSE** (Server-Sent Events) | A plain HTTP response that stays open and sends one event at a time; how an answer reaches the browser as it is written. | `backend/app/sse.py`, `frontend/src/state/sse.ts` |
| **AgentEvent contract** | The nine event types every harness must emit and the only ones the BFF and the UI read — what makes a harness swappable. | [`ai/harness/_shared/contract.py`](../ai/harness/_shared/contract.py) |
| **Voice Live** | Azure's real-time speech service that turns speech into text for the agent and the agent's answer back into speech. | `backend/app/voice_session.py` |
| **WebRTC / SDP** | The browser's standard for live audio; SDP is the text offer and answer two ends exchange to set the call up. | `frontend/src/voice/session.ts`, `backend/app/routers/voice.py` |
| **Entra ID / `DefaultAzureCredential`** | Microsoft's identity service, and the SDK object that finds a sign-in (yours locally, a managed identity in Azure) so no API key is needed. | `backend/app/harness_factory.py` (`AzureClients`) |
| **APIM / AI Gateway** | Azure API Management placed in front of the model to log, meter and govern inference; optional in this project. | [how it works](how-it-works/tracing-and-gateway.md) |
| **Application Insights / KQL** | Azure's telemetry store, and the query language used to read the spans of one run back out of it. | `backend/app/traces.py` |
| **Span / trace** | A span is one timed step (a model call, a tool call); a trace is the tree of spans for one run. | `frontend/src/panes/` (trace panel) |
| **BYOM** (bring your own model) | A Foundry connection that sends an agent's inference to a model behind your own gateway instead of the resource's deployment. | `ai/harness/_shared/agent_core.yaml` (`model:` comment) |
| **Spec / SDD** | Spec-Driven Development: every feature starts as a written spec with numbered, testable acceptance criteria. | [`specs/`](../specs/README.md) |
| **TDD** | Test-Driven Development: the failing test comes first, then the code that makes it pass. | [development workflow](development-workflow.md) |
| **Replay / demo mode** | The whole app served from recordings of real Foundry runs, so it runs with no Azure account. | `backend/app/demo.py`, `just demo` |
