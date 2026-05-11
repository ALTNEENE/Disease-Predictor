# Deployment Guide

## Production Checklist

- Replace all example secrets.
- Use a managed MongoDB instance or secured MongoDB container.
- Set `NODE_ENV=production`.
- Use HTTPS at the load balancer or reverse proxy.
- Restrict `CLIENT_URL` and `ALLOWED_ORIGINS`.
- Persist backend upload/report storage and ML model storage.
- Configure log collection for backend and ML service.
- Add scheduled backups for MongoDB and model files.

## Docker Deployment

Build and start:

```bash
docker compose up --build -d
```

For production, create real `.env` files and reference them from `docker-compose.yml` instead of `.env.example`.

## Suggested Hosting Layout

- Frontend: static hosting, Nginx, or CDN.
- Backend: container behind reverse proxy.
- ML service: private container reachable only by backend.
- MongoDB: managed database or private network container.

## Vercel Monorepo Deployment

This repository includes Vercel configs for both a combined deployment and separate projects from the same repository.

### Option A: One Vercel Project

1. Import the repository in Vercel with the repository root as the project root. In Vercel Project Settings, leave **Root Directory** empty or set it to the repository root. This is the preferred setup.
2. Keep the default install/build commands from `vercel.json`:

   ```bash
   npm install
   npm run build
   ```

   The root build script compiles `frontend/` and copies `frontend/dist` to a root-level `dist/` folder, which is the Vercel output directory.

3. Set these Vercel environment variables:

   ```bash
   NODE_ENV=production
   MONGODB_URI=<your MongoDB Atlas connection string>
   JWT_SECRET=<long random production secret>
   CLIENT_URL=https://<your-vercel-domain>
   ML_SERVICE_URL=https://<your-ml-service-domain>/api
   MAX_UPLOAD_MB=25
   ```

4. Do not set `VITE_API_URL` for the same Vercel project. The frontend will call the same-origin `/api` route automatically. Set `VITE_API_URL` only when the backend is hosted on a different domain.

5. Deploy the ML service separately, then point `ML_SERVICE_URL` at it. For a Vercel monorepo setup, create a second Vercel project using `ml-service/` as the root directory. The included `ml-service/vercel.json` exposes the FastAPI app through that project. Set:

   ```bash
   APP_NAME=Disease Prediction ML Service
   API_PREFIX=/api
   ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>
   MODEL_DIR=/tmp/models
   ```

If your existing Vercel project already has **Root Directory** set to `frontend`, the repo also includes `frontend/vercel.json`, `frontend/vercel-install.js`, and `frontend/api/[...path].js` so the Express API can still deploy from that project. In that setup, keep the Vercel commands from `frontend/vercel.json`.

### Option B: Separate Vercel Projects

Vercel may suggest creating separate projects from the same repository. That is supported too:

| Project | Root Directory | Config file | Notes |
| --- | --- | --- | --- |
| Frontend | `frontend` | `frontend/vercel.json` | Set `VITE_API_URL` to the backend project URL ending in `/api`. |
| Backend API | `backend` | `backend/vercel.json` | Set MongoDB, JWT, CORS, and ML service environment variables. Clear any old Output Directory setting in Vercel, or set it to `public`. |
| ML service | `ml-service` | `ml-service/vercel.json` | Set `ALLOWED_ORIGINS` to the frontend URL. |

Backend project environment variables:

```bash
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random production secret>
CLIENT_URL=https://<your-frontend-vercel-domain>
ML_SERVICE_URL=https://<your-ml-service-vercel-domain>/api
MAX_UPLOAD_MB=25
```

After deploying the backend project, test `https://<your-backend-domain>/api/health`. Visiting the backend root URL should show a small API landing page; application endpoints still require a valid `MONGODB_URI`.

Frontend project environment variables when deployed separately:

```bash
VITE_API_URL=https://<your-backend-vercel-domain>/api
```

Do not use `http://localhost:5000/api` in Vercel frontend environment variables. Production builds ignore localhost API URLs and fall back to same-origin `/api`; for separate frontend/backend projects, set `VITE_API_URL` to the deployed backend URL.

ML service project environment variables:

```bash
APP_NAME=Disease Prediction ML Service
API_PREFIX=/api
ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>
MODEL_DIR=/tmp/models
```

Vercel serverless functions have ephemeral local storage. The backend uses `/tmp` automatically on Vercel for uploaded datasets and generated reports, which is suitable for short-lived requests and demos. For production workflows that need uploaded datasets or generated PDFs to persist across deployments and cold starts, move those files to object storage such as Vercel Blob, S3, or another durable store.

The ML service also uses `/tmp/models` automatically on Vercel when `MODEL_DIR` is not set. That works for temporary demos, but trained models should be moved to durable object storage for production predictions.

## Scaling Notes

- Scale frontend horizontally as static assets.
- Scale backend replicas behind a load balancer.
- Keep ML model storage shared or move model bundles to object storage.
- Use a job queue for very large training jobs.
- Add antivirus scanning for uploaded datasets in high-security deployments.
