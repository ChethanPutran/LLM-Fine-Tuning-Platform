# backend/core/pipeline_engine/result_mapper.py  (new)
RESULT_KEY_MAP = {
    "preprocessing": {"dataset_path": "output_path"},
    "data_collection": {"dataset_path": "output_path"},
    "tokenization": {"tokenizer_path": "output_path"},
    "training": {"model_dir": "model_path"},
    "finetuning": {"model_dir": "model_path"},
    "optimization": {"optimized_model_path": "model_path"},
    "deployment": {"url": "endpoint"},
}

def normalize_result(stage_type: str, raw_result: dict) -> dict:
    """Return a dict keyed by the output keys the frontend declares."""
    mapping = RESULT_KEY_MAP.get(stage_type, {})
    normalized = {}
    for src_key, dst_key in mapping.items():
        if src_key in raw_result:
            normalized[dst_key] = raw_result[src_key]
    # Pass through anything already in the right key
    for dst_key in mapping.values():
        if dst_key in raw_result:
            normalized[dst_key] = raw_result[dst_key]
    return normalized