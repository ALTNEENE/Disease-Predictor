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

### Option A: One Vercel Monorepo Project

1. Import the repository in Vercel with the repository root as the project root. In Vercel Project Settings, leave **Root Directory** empty or set it to the repository root. This is the preferred setup.
2. Use the root `vercel.json` service map. It deploys `frontend/` at `/` with the Vite framework and `backend/server.js` under `/api` with the Express framework.
3. Clear any old single-app Vercel settings such as **Output Directory**, custom Build Command, or custom Install Command if they were set while debugging previous deployments. Let the monorepo service configuration drive the build.

4. Set these Vercel environment variables:

   ```bash
   NODE_ENV=production
   MONGODB_URI=<your MongoDB Atlas connection string>
   JWT_SECRET=<long random production secret>
   CLIENT_URL=https://<your-vercel-domain>
   ML_SERVICE_URL=https://<your-ml-service-domain>/api
   MAX_UPLOAD_MB=25
   ```

5. Do not set `VITE_API_URL` for the same Vercel project. The frontend will call the same-origin `/api` route automatically. Set `VITE_API_URL` only when the backend is hosted on a different domain.

6. Deploy the ML service separately, then point `ML_SERVICE_URL` at it. Create a second Vercel project using `ml-service/` as the root directory. The included `ml-service/vercel.json` exposes the FastAPI app through that project. Set:

   ```bash
   APP_NAME=Disease Prediction ML Service
   API_PREFIX=/api
   ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>
   MODEL_DIR=/tmp/models
   ```

If your existing Vercel project already has **Root Directory** set to `frontend`, create a new project from the repository root for the monorepo deployment. The frontend-only project will not deploy the root Express service map.

### Option B: Separate Vercel Projects

Vercel may suggest creating separate projects from the same repository. That is supported too:

| Project | Root Directory | Config file | Notes |
| --- | --- | --- | --- |
| Frontend | `frontend` | `frontend/vercel.json` | Set `VITE_API_URL` to the backend project URL ending in `/api`. |
| Backend API | `backend` | `backend/vercel.json` | Set MongoDB, JWT, CORS, and ML service environment variables. Prefer clearing any old Output Directory setting in Vercel. If Vercel keeps `dist`, the backend build now creates a compatible `dist/index.js` fallback. |
| ML service | `ml-service` | `ml-service/vercel.json` | Set `ALLOWED_ORIGINS` to the frontend URL. Leave Install Command and Build Command empty in Vercel so Python dependency bundling can be optimized automatically. |

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

Do not use localhost URLs in any Vercel environment variables. Production builds ignore localhost frontend API URLs and fall back to same-origin `/api`; the backend rejects localhost `CLIENT_URL` and `ML_SERVICE_URL` in production; the ML service filters localhost CORS origins in production. For separate projects, use the deployed Vercel URLs.

ML service project environment variables:

```bash
APP_NAME=Disease Prediction ML Service
API_PREFIX=/api
ALLOWED_ORIGINS=https://<your-frontend-vercel-domain>
MODEL_DIR=/tmp/models
```

The ML service intentionally avoids a custom Vercel install command because custom Python installs disable Vercel's dependency bundling optimizations. `uvicorn` is installed without the `standard` extras to avoid packaging unused server packages such as `uvloop`, `watchfiles`, and `websockets`.

Vercel serverless functions have ephemeral local storage. The backend uses `/tmp` automatically on Vercel for uploaded datasets and generated reports, which is suitable for short-lived requests and demos. For production workflows that need uploaded datasets or generated PDFs to persist across deployments and cold starts, move those files to object storage such as Vercel Blob, S3, or another durable store.

The ML service also uses `/tmp/models` automatically on Vercel when `MODEL_DIR` is not set. That works for temporary demos, but trained models should be moved to durable object storage for production predictions.

## Scaling Notes

- Scale frontend horizontally as static assets.
- Scale backend replicas behind a load balancer.
- Keep ML model storage shared or move model bundles to object storage.
- Use a job queue for very large training jobs.
- Add antivirus scanning for uploaded datasets in high-security deployments.
