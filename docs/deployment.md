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

This repository includes a root `vercel.json`, root `package.json`, and `api/[...path].js` adapter so Vercel can deploy the React frontend and Express backend from the monorepo.

1. Import the repository in Vercel with the repository root as the project root.
2. Keep the default install/build commands from `vercel.json`:

   ```bash
   npm install --prefix frontend && npm install --prefix backend
   npm --prefix frontend run build
   ```

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

Vercel serverless functions have ephemeral local storage. The backend uses `/tmp` automatically on Vercel for uploaded datasets and generated reports, which is suitable for short-lived requests and demos. For production workflows that need uploaded datasets or generated PDFs to persist across deployments and cold starts, move those files to object storage such as Vercel Blob, S3, or another durable store.

The ML service also uses `/tmp/models` automatically on Vercel when `MODEL_DIR` is not set. That works for temporary demos, but trained models should be moved to durable object storage for production predictions.

## Scaling Notes

- Scale frontend horizontally as static assets.
- Scale backend replicas behind a load balancer.
- Keep ML model storage shared or move model bundles to object storage.
- Use a job queue for very large training jobs.
- Add antivirus scanning for uploaded datasets in high-security deployments.
