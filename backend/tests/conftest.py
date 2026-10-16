"""Every test starts from an environment with no deployment in it.

`just` loads `.env` (`set dotenv-load`), so `just verify` on a checkout with a filled-in `.env` ran
the suite *with the operator's deployment*: tracing and voice were configured, and the tests that
assert "unconfigured says so" failed — green in CI, red on the one machine that had followed the
Quickstart (assessment 2026-10-15). Tests that want a value pass it, or set it themselves.

The names come from `app/settings.py` itself, so a variable added there is cleared here too.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

_SETTINGS = Path(__file__).resolve().parents[1] / "app" / "settings.py"
_READ = re.compile(r'os\.environ\.get\(\s*"([A-Z0-9_]+)"')
SETTINGS_ENV = sorted(set(_READ.findall(_SETTINGS.read_text())))


@pytest.fixture(autouse=True)
def _no_deployment_in_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in SETTINGS_ENV:
        monkeypatch.delenv(name, raising=False)
