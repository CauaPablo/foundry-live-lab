"""No committed file may carry a credential that lives in a URL or a connection string.

The 2026-10-15 assessment found a Logic App trigger URL — `sig=` and all — inside a recorded agents
listing. It belonged to an agent this repository never wrote, it arrived with the rest of the
listing, and gitleaks did not recognise it. A signed URL *is* the credential: anyone holding it can
invoke the workflow. So this walks every file the repository could publish and fails on the
shapes that carry one, rather than trusting the next recording to be read by eye.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from scripts.redact_fixture import redact

ROOT = Path(__file__).resolve().parents[2]

# Directories that are never published, or are someone else's code.
SKIPPED = {
    ".git",
    "node_modules",
    ".venv",
    "dist",
    "__pycache__",
    ".playwright-mcp",
    ".pytest_cache",
}
TEXT_SUFFIXES = {
    ".json",
    ".jsonl",
    ".md",
    ".py",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
    ".txt",
    ".example",
}

# Each is a credential by shape, not a word that merely sounds like one. Values are required to be
# long, so prose that *mentions* `sig=` (this file) does not trip it.
CREDENTIAL_SHAPES = {
    "signed URL (sig=)": re.compile(r"[?&]sig=[A-Za-z0-9%_\-]{20,}"),
    "Function key (code=)": re.compile(r"[?&]code=[A-Za-z0-9%_\-]{30,}"),
    "instrumentation key": re.compile(r"InstrumentationKey=[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}"),
    "storage account key": re.compile(r"AccountKey=[A-Za-z0-9+/=]{40,}"),
}


def _published_files():
    """The files the repository publishes: tracked ones when git can say, else the whole tree.

    Ignored local copies (a Finder duplicate, a scratch file) never reach the remote, so they are
    not what this guards.
    """
    try:
        listed = subprocess.run(
            ["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True, text=True
        ).stdout.split("\0")
        candidates = (ROOT / name for name in listed if name)
    except (OSError, subprocess.CalledProcessError):
        candidates = ROOT.rglob("*")
    for path in candidates:
        if any(part in SKIPPED for part in path.relative_to(ROOT).parts):
            continue
        if path.is_file() and (path.suffix in TEXT_SUFFIXES or path.name == ".env.example"):
            yield path


def test_no_committed_file_carries_a_credential_in_a_url():
    found = [
        f"{path.relative_to(ROOT)}: {label}"
        for path in _published_files()
        for label, shape in CREDENTIAL_SHAPES.items()
        if shape.search(path.read_text(errors="ignore"))
    ]
    assert not found, "credential-shaped values in published files:\n" + "\n".join(found)


# The reference environment's own resource names. Not secrets, but they map the deployment a
# recording came from, and a public repository has no reason to carry them. Spelled in pieces so
# this file does not match itself.
ENVIRONMENT_NAMES = ("ai-admin" + "2354", "bel" + "ake")


def test_no_committed_file_names_the_reference_environment():
    found = [
        f"{path.relative_to(ROOT)}: {name}"
        for path in _published_files()
        for name in ENVIRONMENT_NAMES
        if name in path.read_text(errors="ignore").lower()
    ]
    assert not found, "environment names in published files:\n" + "\n".join(found)


def test_redaction_drops_the_query_string_of_a_url():
    # The query string is where a trigger URL keeps its signature; the origin and path stay, so the
    # recording still says which kind of endpoint a tool pointed at.
    signed = (
        "https://prod-1.eastus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke"
        "?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=" + "x" * 43
    )
    redacted = redact({"servers": [{"url": signed}]}, {})

    assert redacted == {
        "servers": [
            {
                "url": "https://prod-1.eastus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke"
            }
        ]
    }


def test_redaction_leaves_a_url_without_a_query_alone():
    assert redact({"url": "https://learn.microsoft.com/api/mcp"}, {}) == {
        "url": "https://learn.microsoft.com/api/mcp"
    }
