from dataclasses import dataclass, field
import os
from pathlib import Path


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


_IS_VERCEL = bool(os.getenv("VERCEL"))
_IS_PRODUCTION = os.getenv("NODE_ENV") == "production" or _IS_VERCEL


def _is_local_url(value: str) -> bool:
    return value.startswith("http://localhost") or value.startswith("http://127.0.0.1") or value.startswith("https://localhost") or value.startswith("https://127.0.0.1")


def _origins() -> list[str]:
    value = os.getenv("ALLOWED_ORIGINS", "")
    origins = [origin for origin in _csv(value) if not (_IS_PRODUCTION and _is_local_url(origin))]
    if origins:
        return origins
    if _IS_PRODUCTION:
        return []
    return ["http://localhost:5173", "http://localhost:3000"]


def _default_model_dir() -> str:
    if _IS_VERCEL:
        return str(Path(os.getenv("TMPDIR") or os.getenv("TEMP") or "/tmp") / "models")
    return "storage/models"


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Disease Prediction ML Service")
    api_prefix: str = os.getenv("API_PREFIX", "/api")
    model_dir: Path = Path(os.getenv("MODEL_DIR", _default_model_dir()))
    max_tree_depth: int = int(os.getenv("MAX_TREE_DEPTH", "8"))
    allowed_origins: list[str] = field(default_factory=_origins)


settings = Settings()
settings.model_dir.mkdir(parents=True, exist_ok=True)
