# Learning journey — maintainer notes

Moved out of [`docs/learning-journey.md`](../learning-journey.md) so the learner's path reads as a
path. This is the verification record and the publication checklist for the learning material;
nothing here is an exercise.

## Local verification record — 2026-10-09

These are reruns in this documentation worktree after the baseline cherry-pick, not results
inferred from #32. Dependencies were restored with Python 3.12 into **separate** `backend/.venv`
and `ai/.venv`, installing `backend[dev]` plus `ai` in the former and `ai[dev]` in the latter;
`npm ci` restored the frontend. No global pytest or live Azure command was used.

```bash
(cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/pytest -q)
(cd ai && .venv/bin/ruff check . && .venv/bin/pytest -q)
(cd frontend && npm run lint && npm test -- --run && npm run build)
just gate-infra
```

**Results:** backend lint/format passed, **299 tests passed**; AI lint passed, **233 passed / 5
skipped**; frontend lint/test/build passed, **1037 tests**; infra skipped through its missing-Bicep
guard. Frontend lint reported three existing ref-access warnings and build reported large chunks;
neither failed its gate. Dependency installation reported eight npm audit findings (2 low, 6 high);
this documentary increment did not change dependencies or remediate those findings.

The module test commands were covered in these combined selections (not claimed as seven separate
workshop runs):

```bash
(cd ai && .venv/bin/pytest -q -rs tests/test_recorded_turn.py tests/test_hosted_recorded_turn.py tests/test_tools.py tests/test_prompt_adapter.py tests/test_events.py tests/test_harness_parity.py tests/test_hosted_graph.py tests/test_contract.py tests/test_conformance.py tests/test_voice_events.py)
(cd backend && .venv/bin/pytest -q tests/test_traces.py tests/test_trace_injection.py)
```

**Results:** AI **188 passed / 1 skipped**, backend **32 passed**. Hosted graph dependencies are
absent: that graph test skipped explicitly; passing recorded contract tests does not prove a newly
executed graph or deployed hosted agent.

With `backend/.venv/bin` on PATH, the replay recipe was checked on free ports because the initial
8001/5173 availability probe found an occupied port and started no server:

```bash
BACKEND_PORT=55976 FRONTEND_PORT=55977 VITE_BFF_URL=http://localhost:55976 just demo
just down
```

**Results:** demo `/health`, UI HTML and `/config` responded HTTP 200; `demo` was present in config.
A Ctrl+C-equivalent SIGINT exited with 130 and released both owned server ports. This was an **HTTP
and process-lifecycle check**, not a browser/CORS or layout test on that alternate UI origin.
`just down` printed manual deletion guidance and exited **1**, as expected; it deleted nothing.
No Azure resource was provisioned or removed, and no new screenshot/live measurement was produced.

## Publication and completion checklist

- [x] Integrate #32's clean setup and reconcile root README EN/PT; rerun isolated local gates and
  check replay HTTP readiness/shutdown. See the verification record below.
- [ ] Execute the remaining live learner commands with operator consent and record results; local
  tests/HTTP checks do not validate Azure provisioning, browser interaction or metered exercises.
- [ ] After screen/preferences/mobile changes integrate, capture the real replay banner, chat/function
  row, Learn/source payload, local retrieval result, comparison, event inspector/trace and voice overlay.
  Confirm accessible labels and layout at supported widths; these are proposed captures, not screenshots.
- [ ] Separate replay from live in every caption; mark the 2026-09-20 samples as historical, one
  turn/harness/probe. Do not claim a benchmark, new latency, hosted continuity or full hosted voice proof.
- [ ] Review screenshots, transcripts, JSON exports and traces for tenant/project/resource identifiers,
  prompts, tool arguments/output and secrets. Redact without fabricating behavior; record what was removed.
  Automated identifier redaction alone does not make content safe to publish.
- [ ] Obtain operator consent before metered exercises; explain inference, search and container costs.
  Missing usage/prices means unreported cost, not free execution. Stopping a browser stream is not run cancellation.
- [ ] End voice sessions, stop only the local processes you started, and manually review/delete Azure
  resources and separately created gateway/hosted dependencies according to the operator's ownership plan.
  Stopping the app is not Azure cleanup; no root automated teardown is verified.
- [ ] Keep both language versions and evidence links aligned. Extend toward IQ/Copilot only with a
  new spec and current, recorded API/product evidence; this first outline does not select those integrations.
