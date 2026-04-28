# 🚀 Production Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Google Cloud Platform account (for Cloud Run)
- Vercel account (for frontend)
- PostgreSQL database (Cloud SQL or similar)

## Quick Deploy Options

### Option 1: Docker Compose (Local/VM)

```bash
# Build and run everything
docker-compose up --build

# Access at:
# Frontend: http://localhost
# Backend: http://localhost:8000
# Database: localhost:5432
```

### Option 2: Vercel + Cloud Run (Recommended)

#### Backend Deployment (Google Cloud Run)
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/vanguard-backend

# Deploy to Cloud Run
gcloud run deploy vanguard-backend \
  --image gcr.io/YOUR_PROJECT/vanguard-backend \
  --platform managed \
  --port 8000 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=your_postgres_url
```

#### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_BASE_URL=https://your-cloud-run-url
```

### Option 3: Railway (Easiest)

1. Connect GitHub repo to Railway
2. Deploy backend service with PostgreSQL
3. Deploy frontend with environment variables

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-backend-url
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## Database Setup

```sql
-- Create database
CREATE DATABASE vanguard_db;

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Run migrations
cd backend && alembic upgrade head
```

## Health Checks

- Frontend: `https://your-domain`
- Backend: `https://your-backend/health`
- API Docs: `https://your-backend/docs`

## Monitoring

- Set up Cloud Logging for backend
- Enable Vercel Analytics for frontend
- Monitor database performance