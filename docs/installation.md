# Installation Guide

## Requirements

- Node.js 20+
- Python 3.12+
- MongoDB 7+
- Docker Desktop, optional but recommended

## Docker Installation

```bash
docker compose up --build
```

This starts MongoDB, FastAPI ML service, Express backend, and React frontend.

## Manual Installation

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 2. ML Service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Environment Variables

Backend:

- `MONGODB_URI`
- `JWT_SECRET`
- `ML_SERVICE_URL`
- `CLIENT_URL`
- `UPLOAD_DIR`
- `REPORT_DIR`

ML service:

- `MODEL_DIR`
- `MAX_TREE_DEPTH`
- `ALLOWED_ORIGINS`

Frontend:

- `VITE_API_URL`
