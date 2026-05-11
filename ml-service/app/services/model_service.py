from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text

from app.core.config import settings
from app.services.data_service import detect_columns, prepare_features
from app.services.recommendation_service import build_recommendations


def _model_path(model_id: str) -> Path:
    return settings.model_dir / f"{model_id}.joblib"


def _build_preprocessor(x: pd.DataFrame) -> tuple[ColumnTransformer, list[str], list[str]]:
    numeric_features = x.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [column for column in x.columns if column not in numeric_features]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_features),
            ("categorical", categorical_pipeline, categorical_features),
        ],
        remainder="drop",
    )
    return preprocessor, numeric_features, categorical_features


def _pipeline_feature_schema(pipeline: Pipeline) -> tuple[list[str], list[str]]:
    preprocessor = pipeline.named_steps["preprocessor"]
    transformers = getattr(preprocessor, "transformers_", None) or preprocessor.transformers
    numeric_features: list[str] = []
    categorical_features: list[str] = []

    for name, _transformer, columns in transformers:
        if columns is None or (isinstance(columns, str) and columns == "drop"):
            continue
        column_list = list(columns)
        if name == "numeric":
            numeric_features.extend(str(column) for column in column_list)
        elif name == "categorical":
            categorical_features.extend(str(column) for column in column_list)

    return numeric_features, categorical_features


def _prediction_frame_for_bundle(bundle: dict[str, Any], x: pd.DataFrame) -> pd.DataFrame:
    sanitized = x.copy().replace(r"^\s*$", np.nan, regex=True)
    numeric_columns: set[str] = set()
    for pipeline in bundle.get("models", {}).values():
        numeric, _categorical = _pipeline_feature_schema(pipeline)
        numeric_columns.update(numeric)

    for column in numeric_columns:
        if column in sanitized.columns:
            sanitized[column] = pd.to_numeric(sanitized[column], errors="coerce")

    return sanitized


def _split(x: pd.DataFrame, y: pd.Series, stratify: bool = False):
    test_size = 0.2 if len(x) >= 10 else 0.33
    stratify_values = None
    if stratify and y.nunique() > 1 and y.value_counts().min() >= 2:
        stratify_values = y
    return train_test_split(x, y, test_size=test_size, random_state=42, stratify=stratify_values)


def _clean_target_name(value: str | None, fallback: str | None) -> str | None:
    value = (value or "").strip()
    return value or fallback


def _regression_metrics(y_true, predictions) -> dict[str, float]:
    mse = mean_squared_error(y_true, predictions)
    return {
        "mae": round(float(mean_absolute_error(y_true, predictions)), 4),
        "rmse": round(float(np.sqrt(mse)), 4),
    }


def train_models(
    df: pd.DataFrame,
    target_disease: str | None = None,
    target_cases: str | None = None,
    target_deaths: str | None = None,
    model_name: str | None = None,
) -> dict[str, Any]:
    detected = detect_columns(df)
    disease_col = _clean_target_name(target_disease, detected.get("disease"))
    cases_col = _clean_target_name(target_cases, detected.get("cases"))
    deaths_col = _clean_target_name(target_deaths, detected.get("deaths"))
    target_columns = [column for column in [disease_col, cases_col, deaths_col] if column in df.columns]

    if not target_columns:
        raise ValueError("Could not detect disease, cases, or deaths target columns")

    raw_feature_columns = [column for column in df.columns if column not in target_columns]
    if not raw_feature_columns:
        raise ValueError("Dataset must contain feature columns in addition to target columns")

    x_raw = df[raw_feature_columns]
    x, feature_columns = prepare_features(x_raw)

    bundle: dict[str, Any] = {
        "model_id": f"dt_{uuid.uuid4().hex[:12]}",
        "model_name": model_name or "Decision Tree Disease Model",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "detected_columns": detected,
        "targets": {
            "disease": disease_col,
            "cases": cases_col,
            "deaths": deaths_col,
        },
        "raw_feature_columns": raw_feature_columns,
        "feature_columns": feature_columns,
        "models": {},
        "metrics": {},
        "thresholds": {},
    }

    if disease_col and disease_col in df.columns:
        mask = df[disease_col].notna()
        y = df.loc[mask, disease_col].astype(str)
        if y.nunique() >= 2:
            x_train, x_test, y_train, y_test = _split(x.loc[mask], y, stratify=True)
            preprocessor, numeric, categorical = _build_preprocessor(x_train)
            classifier = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("tree", DecisionTreeClassifier(max_depth=settings.max_tree_depth, random_state=42)),
                ]
            )
            classifier.fit(x_train, y_train)
            predictions = classifier.predict(x_test)
            bundle["models"]["classifier"] = classifier
            bundle["metrics"]["classification"] = {
                "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
                "precision": round(float(precision_score(y_test, predictions, average="weighted", zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, predictions, average="weighted", zero_division=0)), 4),
                "f1": round(float(f1_score(y_test, predictions, average="weighted", zero_division=0)), 4),
                "train_rows": int(len(x_train)),
                "test_rows": int(len(x_test)),
                "numeric_features": numeric,
                "categorical_features": categorical,
            }

    for target_key, target_col in {"cases": cases_col, "deaths": deaths_col}.items():
        if target_col and target_col in df.columns:
            y = pd.to_numeric(df[target_col], errors="coerce")
            mask = y.notna()
            if int(mask.sum()) >= 3:
                x_train, x_test, y_train, y_test = _split(x.loc[mask], y.loc[mask], stratify=False)
                preprocessor, numeric, categorical = _build_preprocessor(x_train)
                regressor = Pipeline(
                    steps=[
                        ("preprocessor", preprocessor),
                        ("tree", DecisionTreeRegressor(max_depth=settings.max_tree_depth, random_state=42)),
                    ]
                )
                regressor.fit(x_train, y_train)
                predictions = regressor.predict(x_test)
                bundle["models"][target_key] = regressor
                bundle["metrics"][target_key] = {
                    **_regression_metrics(y_test, predictions),
                    "train_rows": int(len(x_train)),
                    "test_rows": int(len(x_test)),
                    "numeric_features": numeric,
                    "categorical_features": categorical,
                }
                bundle["thresholds"][target_key] = {
                    "medium": float(np.nanpercentile(y.loc[mask], 50)),
                    "high": float(np.nanpercentile(y.loc[mask], 75)),
                    "critical": float(np.nanpercentile(y.loc[mask], 90)),
                }

    if not bundle["models"]:
        raise ValueError("Not enough valid rows to train any Decision Tree model")

    joblib.dump(bundle, _model_path(bundle["model_id"]))
    return metadata_for_bundle(bundle)


def load_bundle(model_id: str) -> dict[str, Any]:
    path = _model_path(model_id)
    if not path.exists():
        raise FileNotFoundError(f"Model '{model_id}' was not found")
    return joblib.load(path)


def metadata_for_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
    return {
        "model_id": bundle["model_id"],
        "model_name": bundle.get("model_name"),
        "created_at": bundle.get("created_at"),
        "targets": bundle.get("targets", {}),
        "raw_feature_columns": bundle.get("raw_feature_columns", []),
        "feature_columns": bundle.get("feature_columns", []),
        "detected_columns": bundle.get("detected_columns", {}),
        "metrics": bundle.get("metrics", {}),
        "available_predictions": list(bundle.get("models", {}).keys()),
    }


def predict(model_id: str, features: dict[str, Any]) -> dict[str, Any]:
    bundle = load_bundle(model_id)
    x_raw = pd.DataFrame([features])
    x, _ = prepare_features(x_raw, bundle["feature_columns"])
    x = _prediction_frame_for_bundle(bundle, x)
    raw_predictions: dict[str, Any] = {}

    disease_type = None
    if "classifier" in bundle["models"]:
        disease_type = str(bundle["models"]["classifier"].predict(x)[0])
        raw_predictions["disease"] = disease_type

    expected_cases = None
    if "cases" in bundle["models"]:
        expected_cases = max(0.0, float(bundle["models"]["cases"].predict(x)[0]))
        raw_predictions["cases"] = round(expected_cases, 2)

    expected_deaths = None
    if "deaths" in bundle["models"]:
        expected_deaths = max(0.0, float(bundle["models"]["deaths"].predict(x)[0]))
        raw_predictions["deaths"] = round(expected_deaths, 2)

    risk_level = calculate_risk(bundle, expected_cases, expected_deaths)
    return {
        "model_id": model_id,
        "disease_type": disease_type,
        "expected_cases": round(expected_cases, 2) if expected_cases is not None else None,
        "expected_deaths": round(expected_deaths, 2) if expected_deaths is not None else None,
        "risk_level": risk_level,
        "recommendations": build_recommendations(risk_level, disease_type, features),
        "raw_predictions": raw_predictions,
    }


def calculate_risk(bundle: dict[str, Any], cases: float | None, deaths: float | None) -> str:
    score = 0
    for key, value in {"cases": cases, "deaths": deaths}.items():
        if value is None:
            continue
        thresholds = bundle.get("thresholds", {}).get(key, {})
        if value <= 0:
            continue
        if value >= thresholds.get("critical", float("inf")):
            score += 3
        elif value >= thresholds.get("high", float("inf")):
            score += 2
        elif value >= thresholds.get("medium", float("inf")):
            score += 1

    if score >= 5:
        return "Critical"
    if score >= 3:
        return "High"
    if score >= 1:
        return "Medium"
    return "Low"


def tree_visualization(model_id: str) -> dict[str, Any]:
    bundle = load_bundle(model_id)
    trees = {}
    for name, pipeline in bundle.get("models", {}).items():
        preprocessor = pipeline.named_steps["preprocessor"]
        estimator = pipeline.named_steps["tree"]
        try:
            feature_names = preprocessor.get_feature_names_out().tolist()
        except Exception:
            feature_names = bundle.get("feature_columns", [])
        trees[name] = {
            "text": export_text(estimator, feature_names=feature_names, max_depth=settings.max_tree_depth),
            "depth": int(estimator.get_depth()),
            "leaves": int(estimator.get_n_leaves()),
        }
    return {"model_id": model_id, "trees": trees}
