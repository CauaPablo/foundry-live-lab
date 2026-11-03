"""`specs/README.md` lists every spec, and its status column agrees with the spec.

The index says it drifted once: 027–045 sat at `draft` there for a week after being built. It
drifted again when spec 065 shipped `done` with no row at all. The spec's own `Status` field wins
(§4), so this reads both and fails on the gap instead of waiting for someone to notice it by eye.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPECS = ROOT / "specs"

ROW = re.compile(r"^\| (\d{3}) \| \[.*\]\((\d{3}-[^/)]+)/spec\.md\) \| [^|]+ \| \S+ (\w+) \|$")
STATUS = re.compile(r"^\| \*\*Status\*\* \| (.+?) \|$", re.MULTILINE)


def _index_rows() -> dict[str, tuple[str, str]]:
    rows: dict[str, tuple[str, str]] = {}
    for line in (SPECS / "README.md").read_text(encoding="utf-8").splitlines():
        match = ROW.match(line)
        if match:
            number, folder, status = match.groups()
            assert number not in rows, f"spec {number} has two rows in specs/README.md"
            assert folder.startswith(number), f"row {number} links to {folder}"
            rows[number] = (folder, status)
    return rows


def _spec_folders() -> dict[str, Path]:
    return {p.name[:3]: p for p in SPECS.iterdir() if p.is_dir() and re.match(r"\d{3}-", p.name)}


def test_the_index_has_a_row_for_every_spec_and_no_other():
    rows, folders = _index_rows(), _spec_folders()
    assert sorted(set(folders) - set(rows)) == [], "specs missing from specs/README.md"
    assert sorted(set(rows) - set(folders)) == [], "rows in specs/README.md with no spec folder"
    for number, (folder, _) in rows.items():
        assert folder == folders[number].name, f"row {number} links to {folder}"


def test_the_index_status_is_the_specs_own():
    rows, folders = _index_rows(), _spec_folders()
    for number, folder in folders.items():
        if number not in rows:
            continue  # reported by the test above
        match = STATUS.search((folder / "spec.md").read_text(encoding="utf-8"))
        assert match, f"{folder.name}/spec.md has no Status field"
        # The column is a one-word transcription: `clarified — blocked on …` is `blocked`.
        words = re.findall(r"\w+", match.group(1).lower())
        assert rows[number][1] in words, (
            f"spec {number}: index says {rows[number][1]!r}, spec says {match.group(1)!r}"
        )
