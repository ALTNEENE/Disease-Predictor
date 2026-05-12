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

The root `vercel.json` uses Vercel's service map to deploy `frontend/` at `/` and `backend/server.js` under `/api`. Import the repository root in Vercel, clear any old single-app Output Directory or custom build settings, and set:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `ML_SERVICE_URL`

Leave `VITE_API_URL` unset when frontend and backend are deployed in the same Vercel project; the frontend will use `/api`. Deploy `ml-service/` separately and point `ML_SERVICE_URL` to that service, usually ending with `/api`.

The preferred Vercel root directory for the app is the repository root. Deploy `ml-service/` as a second Vercel project from the same repository with Root Directory set to `ml-service`.

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
