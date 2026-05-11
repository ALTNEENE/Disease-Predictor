# Disease Prediction & Data Analysis System

A complete SaaS-style system for uploading Excel disease datasets, analyzing columns, training transparent Decision Tree models, predicting disease type/cases/deaths/risk level, and exporting PDF reports.

## Architecture

- `frontend/` - React, TailwindCSS, Recharts, Axios, Arabic/English RTL support.
- `backend/` - Node.js, Express, MongoDB, JWT auth, upload API, analytics, PDF reports, ML proxy.
- `ml-service/` - FastAPI, Pandas, Scikit-learn, DecisionTreeClassifier and DecisionTreeRegressor only.
- `docs/` - API, architecture, deployment, and installation notes.

## Main Capabilities

- Upload `.xls`, `.xlsx`, or `.csv` datasets.
- Auto-detect disease, cases, deaths, state, weather, month, gender, and age columns.
- Clean data, encode categoricals, impute missing values, scale numeric features, split train/test.
- Train Decision Tree classifier/regressors only.
- Return accuracy, precision, recall, F1, MAE, and RMSE.
- Persist ML models and visualize tree structure.
- Dashboard analytics with filters and charts.
- JWT authentication with first-user admin bootstrap.
- PDF report export.
- Docker Compose support.
- Vercel monorepo deployment support for the React frontend and Express API.

## Quick Start

1. Copy environment files if you want local overrides:

   ```bash
   cp backend/.env.example backend/.env
   cp ml-service/.env.example ml-service/.env
   cp frontend/.env.example frontend/.env
   ```

2. Run everything with Docker:

   ```bash
   docker compose up --build
   ```

3. Open:

   - Frontend: `http://localhost:5173`
   - Backend health: `http://localhost:5000/api/health`
   - ML docs: `http://localhost:8000/docs`

4. Register the first account. It is automatically assigned the `admin` role.

5. Upload `final data.xls` from the repository root, or any compatible disease dataset.

## Local Development

Backend:

```bash
cd backend
npm install
npm run dev
```

ML service:

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

MongoDB must be running locally at `mongodb://localhost:27017/disease_prediction`, or update `backend/.env`.

## Vercel Monorepo

The root `vercel.json` deploys `frontend/` as the static app and `api/[...path].js` as the serverless adapter for the Express backend. Import the repository root in Vercel and set:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `ML_SERVICE_URL`

Leave `VITE_API_URL` unset when frontend and backend are deployed in the same Vercel project; the frontend will use `/api`. Deploy `ml-service/` separately with persistent model storage and point `ML_SERVICE_URL` to that service. The `ml-service/vercel.json` file supports deploying it as a second Vercel project from the same monorepo for demos.

The preferred Vercel root directory is the repository root. If an existing Vercel project is already rooted at `frontend/`, the `frontend/vercel.json` and `frontend/api/[...path].js` files let that setup deploy the Express API too. If Vercel creates separate projects from the same repository, use root directories `frontend`, `backend`, and `ml-service`; each folder now has its own Vercel config.

## Important ML Decision

The ML service intentionally uses only:

- `DecisionTreeClassifier` for disease classification.
- `DecisionTreeRegressor` for cases and deaths.

No Random Forest, Logistic Regression, Linear Regression, or other model families are used.

## Documentation

- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Installation Guide](docs/installation.md)
- [Deployment Guide](docs/deployment.md)
- [Sample Dataset Notes](sample-data/README.md)
