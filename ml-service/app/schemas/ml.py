from typing import Any
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    model_id: str = Field(..., min_length=3)
    features: dict[str, Any] = Field(default_factory=dict)


class PredictionResponse(BaseModel):
    model_id: str
    disease_type: str | None = None
    expected_cases: float | None = None
    expected_deaths: float | None = None
    risk_level: str
    recommendations: dict[str, list[str]]
    raw_predictions: dict[str, Any]


class ErrorResponse(BaseModel):
    detail: str
