from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import tempfile
import warnings
from typing import Any

import numpy as np
import pandas as pd
from fastapi import UploadFile


COLUMN_ALIASES = {
    "disease": ["disease", "disease type", "disease name", "dataname", "diagnosis", "illness", "condition", "المرض", "نوع المرض"],
    "cases": ["cases", "case count", "total cases", "case total", "expected cases", "patients", "infections", "عدد الحالات", "حالات"],
    "deaths": ["deaths", "death", "fatalities", "mortality", "عدد الوفيات", "وفيات"],
    "state": ["state", "province", "city", "region", "district", "governorate", "محافظة", "ولاية", "مدينة"],
    "weather": ["weather", "temperature", "climate", "rain", "humidity", "الطقس", "درجة الحرارة"],
    "month": ["month", "date", "report date", "period", "periodname", "الشهر", "تاريخ"],
    "gender": ["gender", "sex", "الجنس", "نوع الجنس"],
    "age": ["age", "patient age", "العمر", "سن"],
}


@dataclass
class LoadedDataset:
    dataframe: pd.DataFrame
    temp_path: Path | None = None


def normalize_key(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[\s_\-./]+", "", text)
    return text


async def load_upload(upload: UploadFile) -> LoadedDataset:
    suffix = Path(upload.filename or "dataset.xlsx").suffix.lower()
    if suffix not in {".xls", ".xlsx", ".csv"}:
        raise ValueError("Only .xls, .xlsx, and .csv files are supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await upload.read()
        tmp.write(content)
        temp_path = Path(tmp.name)

    return LoadedDataset(dataframe=load_dataframe(temp_path), temp_path=temp_path)


def load_dataframe(path: str | Path) -> pd.DataFrame:
    file_path = Path(path)
    suffix = file_path.suffix.lower()
    if suffix == ".xls":
        df = pd.read_excel(file_path, sheet_name=0, header=None, engine="xlrd")
    elif suffix == ".xlsx":
        df = pd.read_excel(file_path, sheet_name=0, header=None, engine="openpyxl")
    elif suffix == ".csv":
        df = pd.read_csv(file_path, header=None)
    else:
        raise ValueError("Unsupported dataset format")
    return clean_dataframe(df)


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = promote_header_row(df)
    cleaned.columns = [str(col).strip() for col in cleaned.columns]
    cleaned = cleaned.dropna(axis=0, how="all").dropna(axis=1, how="all")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", FutureWarning)
        cleaned = cleaned.replace({np.inf: np.nan, -np.inf: np.nan})
    for column in cleaned.select_dtypes(include=["object"]).columns:
        cleaned[column] = cleaned[column].map(lambda value: value.strip() if isinstance(value, str) else value)
    cleaned = normalize_missing_values(cleaned)
    cleaned = coerce_numeric_like_columns(cleaned)
    cleaned = add_derived_cases(cleaned)
    return cleaned


def normalize_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.copy()
    return normalized.replace(r"^\s*$", np.nan, regex=True)


def coerce_numeric_like_columns(df: pd.DataFrame, threshold: float = 0.75) -> pd.DataFrame:
    coerced = df.copy()
    for column in coerced.columns:
        if pd.api.types.is_numeric_dtype(coerced[column]) or pd.api.types.is_datetime64_any_dtype(coerced[column]):
            continue
        numeric = pd.to_numeric(coerced[column], errors="coerce")
        non_missing = coerced[column].notna().sum()
        if non_missing and numeric.notna().sum() / non_missing >= threshold:
            coerced[column] = numeric
    return coerced


def _header_score(values: list[Any]) -> int:
    normalized_values = [normalize_key(value) for value in values if not pd.isna(value)]
    alias_values = {normalize_key(alias) for aliases in COLUMN_ALIASES.values() for alias in aliases}
    score = sum(2 for value in normalized_values if value in alias_values)
    score += sum(1 for value in normalized_values if any(alias in value for alias in alias_values if len(alias) > 3))
    score += sum(1 for value in normalized_values if "year" in value or "age" in value)
    return score


def _make_unique_columns(values: list[Any]) -> list[str]:
    seen: dict[str, int] = {}
    columns = []
    for index, value in enumerate(values):
        name = str(value).strip() if not pd.isna(value) and str(value).strip() else f"Column {index + 1}"
        if name in seen:
            seen[name] += 1
            name = f"{name} {seen[name]}"
        else:
            seen[name] = 0
        columns.append(name)
    return columns


def promote_header_row(df: pd.DataFrame) -> pd.DataFrame:
    raw = df.dropna(axis=0, how="all").dropna(axis=1, how="all").reset_index(drop=True)
    if raw.empty:
        return raw

    search_limit = min(5, len(raw))
    best_index = max(range(search_limit), key=lambda idx: _header_score(raw.iloc[idx].tolist()))
    if _header_score(raw.iloc[best_index].tolist()) < 2:
        best_index = 0

    promoted = raw.iloc[best_index + 1 :].copy().reset_index(drop=True)
    promoted.columns = _make_unique_columns(raw.iloc[best_index].tolist())
    return promoted


def add_derived_cases(df: pd.DataFrame) -> pd.DataFrame:
    detected = detect_columns(df)
    if detected.get("cases"):
        return df

    deaths_col = detected.get("deaths")
    month_col = detected.get("month")
    numeric_candidates = []
    for column in df.columns:
        column_key = normalize_key(column)
        if column in {deaths_col, month_col} or any(token in column_key for token in ["date", "period", "month"]):
            continue
        if column == deaths_col:
            continue
        if pd.api.types.is_datetime64_any_dtype(df[column]):
            continue
        numeric = pd.to_numeric(df[column], errors="coerce")
        if numeric.notna().mean() > 0.75 and numeric.sum(skipna=True) > 0:
            numeric_candidates.append(column)

    if len(numeric_candidates) >= 2:
        derived = df.copy()
        derived["Total Cases"] = derived[numeric_candidates].apply(pd.to_numeric, errors="coerce").fillna(0).sum(axis=1)
        return derived
    return df


def detect_columns(df: pd.DataFrame) -> dict[str, str | None]:
    detected: dict[str, str | None] = {}
    normalized_columns = {normalize_key(column): column for column in df.columns}

    for semantic, aliases in COLUMN_ALIASES.items():
        found = None
        for alias in aliases:
            key = normalize_key(alias)
            if key in normalized_columns:
                found = normalized_columns[key]
                break
        if found is None:
            for column_key, original in normalized_columns.items():
                if any(normalize_key(alias) in column_key for alias in aliases):
                    found = original
                    break
        detected[semantic] = found
    return detected


def infer_column_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        parsed = pd.to_datetime(series.dropna().head(30), errors="coerce")
    if len(parsed) and parsed.notna().mean() > 0.75:
        return "datetime"
    if series.nunique(dropna=True) <= max(20, len(series) * 0.1):
        return "categorical"
    return "text"


def dataset_analysis(df: pd.DataFrame) -> dict[str, Any]:
    detected = detect_columns(df)
    columns = []
    for column in df.columns:
        values = df[column].dropna().head(5).tolist()
        columns.append(
            {
                "name": column,
                "type": infer_column_type(df[column]),
                "missing": int(df[column].isna().sum()),
                "unique": int(df[column].nunique(dropna=True)),
                "sample_values": [str(value) for value in values],
            }
        )

    return {
        "profile": {
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "missing_cells": int(df.isna().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
        },
        "detected_columns": detected,
        "columns": columns,
        "target_suggestions": {
            "disease": detected.get("disease"),
            "cases": detected.get("cases"),
            "deaths": detected.get("deaths"),
        },
        "analytics": build_analytics(df, detected),
    }


def _safe_number(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _records(series: pd.Series, value_name: str = "value", limit: int = 20) -> list[dict[str, Any]]:
    data = series.head(limit).reset_index()
    data.columns = ["label", value_name]
    return [{"label": str(row["label"]), value_name: _safe_number(row[value_name])} for _, row in data.iterrows()]


def _sum_or_count(df: pd.DataFrame, group_col: str, value_col: str | None) -> pd.Series:
    if value_col and value_col in df.columns:
        return pd.to_numeric(df[value_col], errors="coerce").groupby(df[group_col]).sum().sort_values(ascending=False)
    return df.groupby(group_col).size().sort_values(ascending=False)


def build_analytics(df: pd.DataFrame, detected: dict[str, str | None]) -> dict[str, Any]:
    disease_col = detected.get("disease")
    cases_col = detected.get("cases")
    deaths_col = detected.get("deaths")
    state_col = detected.get("state")
    weather_col = detected.get("weather")
    month_col = detected.get("month")
    gender_col = detected.get("gender")
    age_col = detected.get("age")

    analytics: dict[str, Any] = {
        "disease_distribution": [],
        "monthly_trends": [],
        "weather_correlation": [],
        "state_comparison": [],
        "gender_analysis": [],
        "age_group_analysis": [],
        "mortality_analysis": [],
    }

    if disease_col:
        analytics["disease_distribution"] = _records(_sum_or_count(df, disease_col, cases_col), "cases")

    if month_col:
        month_values = pd.to_datetime(df[month_col], errors="coerce")
        labels = month_values.dt.strftime("%Y-%m").fillna(df[month_col].astype(str))
        temp = df.copy()
        temp["_month_label"] = labels
        monthly_cases = _sum_or_count(temp, "_month_label", cases_col).sort_index()
        analytics["monthly_trends"] = _records(monthly_cases, "cases", limit=36)

    if weather_col:
        weather_cases = _sum_or_count(df, weather_col, cases_col)
        analytics["weather_correlation"] = _records(weather_cases, "cases")

    if state_col:
        state_cases = _sum_or_count(df, state_col, cases_col)
        analytics["state_comparison"] = _records(state_cases, "cases")

    if gender_col:
        gender_cases = _sum_or_count(df, gender_col, cases_col)
        analytics["gender_analysis"] = _records(gender_cases, "cases")

    if age_col:
        ages = pd.to_numeric(df[age_col], errors="coerce")
        bins = [0, 12, 18, 35, 50, 65, 200]
        labels = ["0-12", "13-18", "19-35", "36-50", "51-65", "65+"]
        temp = df.copy()
        temp["_age_group"] = pd.cut(ages, bins=bins, labels=labels, include_lowest=True)
        age_cases = _sum_or_count(temp.dropna(subset=["_age_group"]), "_age_group", cases_col).sort_index()
        analytics["age_group_analysis"] = _records(age_cases, "cases")

    if disease_col and deaths_col:
        deaths = pd.to_numeric(df[deaths_col], errors="coerce").groupby(df[disease_col]).sum()
        if cases_col:
            cases = pd.to_numeric(df[cases_col], errors="coerce").groupby(df[disease_col]).sum()
            mortality = ((deaths / cases.replace(0, np.nan)) * 100).fillna(0).sort_values(ascending=False)
            analytics["mortality_analysis"] = _records(mortality, "mortality_rate")
        else:
            analytics["mortality_analysis"] = _records(deaths.sort_values(ascending=False), "deaths")

    return analytics


def expand_datetime_features(df: pd.DataFrame) -> pd.DataFrame:
    transformed = normalize_missing_values(df)
    for column in list(transformed.columns):
        series = transformed[column]
        column_key = normalize_key(column)
        should_try = pd.api.types.is_datetime64_any_dtype(series) or any(token in column_key for token in ["date", "period", "month"])
        if should_try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", UserWarning)
                parsed = pd.to_datetime(series, errors="coerce")
            if parsed.notna().mean() > 0.5:
                transformed[f"{column}_year"] = parsed.dt.year
                transformed[f"{column}_month"] = parsed.dt.month
                transformed[f"{column}_day"] = parsed.dt.day
                transformed = transformed.drop(columns=[column])
    return transformed


def prepare_features(df: pd.DataFrame, feature_columns: list[str] | None = None) -> tuple[pd.DataFrame, list[str]]:
    features = expand_datetime_features(df)
    features.columns = [str(col) for col in features.columns]
    if feature_columns is None:
        features = coerce_numeric_like_columns(features)
        return features, list(features.columns)

    for column in feature_columns:
        if column not in features.columns:
            features[column] = np.nan
    return normalize_missing_values(features[feature_columns]), feature_columns
