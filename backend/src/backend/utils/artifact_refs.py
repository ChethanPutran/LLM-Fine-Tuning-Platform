"""Helpers for the @stage:<stageId>:<outputKey> reference format."""
import re
from typing import Optional, NamedTuple

_ARTIFACT_RE = re.compile(r"^@stage:([^:]+):(.+)$")


class ArtifactRef(NamedTuple):
    stage_id: str
    output_key: str


def parse_artifact_ref(value: Optional[str]) -> Optional[ArtifactRef]:
    if not isinstance(value, str):
        return None
    m = _ARTIFACT_RE.match(value)
    if not m:
        return None
    return ArtifactRef(stage_id=m.group(1), output_key=m.group(2))


def is_artifact_ref(value: Optional[str]) -> bool:
    return parse_artifact_ref(value) is not None