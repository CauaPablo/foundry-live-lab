"""When a voice session asks the agent to continue after a tool call.

`response.function_call_arguments.done` arrives **before** the `response.done` of the response
that emitted it — in the preamble recording, before that response's audio has even finished. So
the moment a tool returns is not the moment the response is over, and asking for the next one then
is asking while one is still active. The session submits every output as soon as it has it (an
unanswered call hangs the run) and sends **one** `response.create` once the response has ended and
every call it made is answered.

The order of frames below is the order in `voice-live-preamble-20260916.jsonl`; the ids are the
fields that recording carries (`response_id` on the call, `response.id` on `response.done`).
"""

from __future__ import annotations

import asyncio
import json
import threading

from app.tool_executor import ExecutionResult
from app.voice_session import VoiceSession

SDP_OFFER = "v=0\r\n"


class ScriptedSocket:
    """A control channel the test feeds one frame at a time."""

    def __init__(self) -> None:
        self.sent: list[dict] = []
        self._inbox: asyncio.Queue[dict] = asyncio.Queue()

    async def send(self, payload: str) -> None:
        frame = json.loads(payload)
        self.sent.append(frame)
        if frame["type"] == "rtc.call.sdp.create":
            await self._inbox.put({"type": "rtc.call.sdp.created", "sdp_answer": "v=0\r\n"})

    async def recv(self) -> str:
        return json.dumps(await self._inbox.get())

    async def close(self) -> None:
        pass

    async def feed(self, frame: dict) -> None:
        await self._inbox.put(frame)

    def count(self, kind: str) -> int:
        return sum(1 for f in self.sent if f["type"] == kind)

    def outputs(self) -> list[str]:
        return [
            f["item"]["call_id"]
            for f in self.sent
            if f["type"] == "conversation.item.create"
            and f["item"].get("type") == "function_call_output"
        ]


class GatedExecutor:
    """A tool that returns only when the test lets it — the search still running."""

    def __init__(self) -> None:
        self.release = threading.Event()

    def __call__(self, name: str, _arguments: str) -> ExecutionResult:
        self.release.wait(2)
        return ExecutionResult(name=name, output="{}", duration_ms=1, ok=True)


def call(call_id: str, response_id: str = "resp_1") -> dict:
    return {
        "type": "response.function_call_arguments.done",
        "response_id": response_id,
        "item_id": f"item_{call_id}",
        "call_id": call_id,
        "name": "search_web",
        "arguments": '{"query":"x"}',
    }


def done(response_id: str = "resp_1") -> dict:
    return {"type": "response.done", "response": {"id": response_id, "status": "completed"}}


async def settle() -> None:
    """Let the receive loop and the tool thread run what they can."""
    for _ in range(20):
        await asyncio.sleep(0.01)


async def until(predicate) -> None:
    async with asyncio.timeout(2):
        while not predicate():
            await asyncio.sleep(0.01)


async def started(executor=None) -> tuple[VoiceSession, ScriptedSocket]:
    socket = ScriptedSocket()
    session = VoiceSession("s", socket, executor=executor or GatedExecutor())
    await session.negotiate(SDP_OFFER)
    return session, socket


async def test_a_tool_that_returns_before_the_response_ends_waits_for_it():
    tool = GatedExecutor()
    session, socket = await started(tool)

    await socket.feed({"type": "response.created", "response": {"id": "resp_1"}})
    await socket.feed(call("call_1"))
    tool.release.set()
    await until(lambda: socket.outputs() == ["call_1"])
    await settle()

    # The output is submitted at once — but the response is still speaking its preamble.
    assert socket.count("response.create") == 0

    await socket.feed(done())
    await until(lambda: socket.count("response.create") == 1)
    await session.close()


async def test_a_response_that_ended_while_the_tool_ran_continues_when_it_returns():
    tool = GatedExecutor()
    session, socket = await started(tool)

    await socket.feed(call("call_1"))
    await socket.feed(done())
    await settle()
    # The loop keeps reading while the tool runs: the response is over, the call is not.
    assert socket.count("response.create") == 0

    tool.release.set()
    await until(lambda: socket.count("response.create") == 1)
    sent = [f["type"] for f in socket.sent]
    assert sent.index("conversation.item.create") < sent.index("response.create")
    await session.close()


async def test_two_calls_in_one_response_ask_to_continue_once():
    tool = GatedExecutor()
    session, socket = await started(tool)

    await socket.feed(call("call_1"))
    await socket.feed(call("call_2"))
    await socket.feed(done())
    tool.release.set()
    await until(lambda: sorted(socket.outputs()) == ["call_1", "call_2"])
    await until(lambda: socket.count("response.create") >= 1)
    await settle()

    assert socket.count("response.create") == 1
    await session.close()


async def test_a_response_without_calls_asks_for_nothing():
    session, socket = await started()

    await socket.feed({"type": "response.created", "response": {"id": "resp_1"}})
    await socket.feed(done())
    await settle()

    assert socket.count("response.create") == 0
    await session.close()


async def test_a_cancelled_response_has_its_calls_answered_and_is_not_resumed():
    """Barge-in cancels the response, not the obligation: an unanswered call hangs the run. But the
    person who interrupted is already being answered by the response their speech opens, which
    will see the output; resuming the cancelled one would talk over them."""
    tool = GatedExecutor()
    session, socket = await started(tool)

    await socket.feed(call("call_1"))
    cancelled = {"type": "response.done", "response": {"id": "resp_1", "status": "cancelled"}}
    await socket.feed(cancelled)
    tool.release.set()

    await until(lambda: socket.outputs() == ["call_1"])
    await settle()
    assert socket.count("response.create") == 0
    await session.close()
