# API Documentation

Base URL: `http://localhost:5000/api`

All endpoints except auth require:

```http
Authorization: Bearer <token>
```

## Auth

### POST `/auth/register`

Creates a user. The first registered user is `admin`.

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}
```

### POST `/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### GET `/auth/me`

Returns the current user.

## Datasets

### POST `/datasets/upload`

Multipart form:

- `file` - `.xls`, `.xlsx`, or `.csv`
- `name` - optional dataset name

Returns dataset metadata, detected columns, column summaries, and analytics.

### GET `/datasets`

Lists uploaded datasets.

### GET `/datasets/:id`

Returns one dataset and fresh analysis.

### GET `/datasets/:id/analytics`

Optional query filters:

- `state`
- `weather`
- `month`
- `gender`
- `ageGroup`

## Models

### POST `/models/train`

```json
{
  "datasetId": "mongo_dataset_id",
  "name": "Decision Tree v1",
  "targetDisease": "Disease",
  "targetCases": "Cases",
  "targetDeaths": "Deaths"
}
```

Target columns are optional. If omitted, the ML service auto-detects them.

### GET `/models`

Lists trained model runs.

### GET `/models/:id/tree`

Returns Decision Tree text visualizations for classifier and regressors.

### POST `/models/predict`

```json
{
  "modelRunId": "mongo_model_run_id",
  "features": {
    "State": "Cairo",
    "Weather": "Humid",
    "Month": "2026-05",
    "Gender": "Male",
    "Age": 42
  }
}
```

Returns disease type, expected cases, expected deaths, risk level, and recommendations.

## Dashboard

### GET `/dashboard/stats`

Returns global counts and latest dataset analytics. Supports the same query filters as dataset analytics.

## Reports

### GET `/reports`

Lists generated reports.

### POST `/reports/export`

Returns a PDF download.

```json
{
  "datasetId": "mongo_dataset_id",
  "modelRunId": "mongo_model_run_id",
  "title": "May Health Report",
  "filters": {
    "state": "Cairo"
  }
}
```

## Admin

### GET `/admin/overview`

Admin only. Returns users, recent datasets, recent models, and counts.

## ML Service API

Base URL: `http://localhost:8000/api`

- `GET /health`
- `POST /datasets/analyze` multipart `file`
- `POST /models/train` multipart `file`, optional target form fields
- `POST /predict`
- `GET /models/{model_id}`
- `GET /models/{model_id}/tree`
