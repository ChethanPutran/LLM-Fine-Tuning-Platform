# backend/core/pipeline_engine/artifact_resolver.py  (new)
import logging
from typing import Any, Dict
from backend.utils.artifact_refs import parse_artifact_ref

logger = logging.getLogger(__name__)


# Declared by the frontend per stage type. Keep in sync with
# `pipelineStages.js` → `produces[].{kind, key}`.
STAGE_OUTPUT_KEYS = {
    "data_collection": {"raw_data":  "output_path"},
    "preprocessing":   {"clean_data": "output_path"},
    "tokenization":    {"tokenizer":  "output_path"},
    "training":        {"model":      "model_path"},
    "finetuning":      {"finetuned_model": "model_path"},
    "optimization":    {"optimized_model": "model_path"},
    "deployment":      {"endpoint":   "endpoint"},
}



def _find_stage(stage_id, stage_configs):
    return stage_configs.get(stage_id)


def resolve_artifact_refs(config, stage_configs, node_outputs):
    """
    stage_configs : { stage_id: stage.config dict (raw, as received) }
    node_outputs  : { stage_id: { backend_key: value, … } }
    """
    resolved = {}
    for key, value in config.items():
        ref = parse_artifact_ref(value)
        if not ref:
            resolved[key] = value
            continue

        stage_cfg = _find_stage(ref.stage_id, stage_configs)
        if stage_cfg is None:
            raise ValueError(f"Cannot resolve {value!r}: unknown stage {ref.stage_id!r}")

        # Which frontend 'kind' did the user name?
        user_names = stage_cfg.get("__output_names", {})
        kind = next(
            (k for k, n in user_names.items() if n == ref.output_name),
            None,
        )

        # Fall back to treating the reference's second part as the kind
        # (covers the auto-generated default where name == kind)
        if kind is None:
            kind = ref.output_name

        stage_type = stage_cfg.get("__stage_type")
        backend_key = STAGE_OUTPUT_KEYS.get(stage_type, {}).get(kind)
        if backend_key is None:
            raise ValueError(
                f"Cannot resolve {value!r}: stage {ref.stage_id!r} "
                f"has no output '{ref.output_name}'"
            )

        upstream = node_outputs.get(ref.stage_id) or {}
        if backend_key not in upstream:
            raise ValueError(
                f"Cannot resolve {value!r}: "
                f"stage {ref.stage_id!r} hasn't produced '{backend_key}' yet"
            )
        resolved[key] = upstream[backend_key]

    return resolved