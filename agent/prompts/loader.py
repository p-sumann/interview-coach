"""YAML prompt loader — reads and caches prompt templates from prompts/*.yaml."""

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

_PROMPTS_DIR = Path(__file__).parent


@lru_cache(maxsize=16)
def load_prompt(name: str) -> dict[str, Any]:
    """Load a prompt YAML file by name (without extension). Results are cached."""
    path = _PROMPTS_DIR / f"{name}.yaml"
    with path.open() as f:
        return yaml.safe_load(f)
