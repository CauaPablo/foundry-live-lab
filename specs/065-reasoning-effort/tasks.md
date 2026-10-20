# Tasks: Reasoning effort on the agent definition

- [x] **T1 — test first**: AC1 — an unknown effort is refused
- [x] **T2 — implement**: validate `reasoning.effort` in `agent_spec.py`
- [x] **T3 — test first**: AC2 — the shipped definition asks for `low`
- [x] **T4 — implement**: `effort: low` in `prompt_agent/agent.yaml`
- [x] **T5 — measure**: version 9 baseline over `POST /chat`
- [x] **T6 — apply**: `just agent-apply`; confirm the served version is the new one
- [x] **T7 — measure + docs**: AC3, recorded in `docs/REFERENCES.md`

## Definition of done

- [x] Every acceptance criterion maps to a passing test or a recorded measurement
- [x] `verify-gates` green
- [x] `spec.md` status `done`
