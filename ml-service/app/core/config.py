from dataclasses import dataclass, field
import os
from pathlib import Path


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


_IS_VERCEL = bool(os.getenv("VERCEL"))


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
    allowed_origins: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://localhost:3000",
            )
        )
    )


settings = Settings()
settings.model_dir.mkdir(parents=True, exist_ok=True)
