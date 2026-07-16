# Vercel Deployment Guide

This project has been prepared for deployment on Vercel. Both the frontend and backend can be hosted on Vercel, but there are some important considerations for the backend in a serverless environment.

## Monorepo Structure

The project is structured with separate `frontend` and `backend` directories. You can deploy them as separate projects on Vercel or as a monorepo.

### Option 1: Separate Projects (Recommended)

1.  **Backend Deployment:**
    -   Connect your repository to Vercel.
    -   Set the **Root Directory** to `backend`.
    -   Vercel will detect the `vercel.json` and `api/index.js`.
    -   **Environment Variables:**
        -   `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`: Your PostgreSQL credentials (e.g., from Neon or Railway).
        -   `JWT_SECRET`: A secret string for JWT.
        -   `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-frontend.vercel.app`).
        -   `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
        -   `CLOUDINARY_API_KEY`: Your Cloudinary API key.
        -   `CLOUDINARY_API_SECRET`: Your Cloudinary API secret.
        -   `START_LISTENER`: Set to `false` (see "Background Listeners" below).
        -   Other variables required by your `src/configs/`.

2.  **Frontend Deployment:**
    -   Connect your repository to Vercel.
    -   Set the **Root Directory** to `frontend`.
    -   **Environment Variables:**
        -   `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://your-backend.vercel.app`).

### Option 2: Monorepo

You can also use Vercel's Monorepo support by following their documentation and setting the root directory for each deployment accordingly.

## Important Considerations for Vercel (Serverless)

### 1. Background Listeners

The backend originally started blockchain event listeners (`listen_all()`) on startup. In Vercel (Serverless Functions), background processes cannot run indefinitely.

-   **Current State:** The listeners are disabled by default unless `START_LISTENER=true` is set.
-   **Solution:** Run the blockchain listener on your **GCP EC2 instance** as a persistent process. See [GCP_LISTENER_GUIDE.md](./GCP_LISTENER_GUIDE.md) for detailed instructions.

### 2. File Uploads (Profile Pictures)

The backend has been updated to use **Cloudinary** for file uploads. This ensures that profile pictures are stored persistently even in a serverless environment.

-   **Current State:** Configured to use `multer-storage-cloudinary`.
-   **Requirement:** Ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in your Vercel project environment variables.

### 3. Database

Ensure your PostgreSQL database is accessible from Vercel's IP ranges. Using a serverless-friendly DB like **Neon** or **Vercel Postgres** is recommended.

## Changes Made

-   Created `backend/api/index.js` as the serverless entry point.
-   Created `backend/vercel.json` for backend routing.
-   Modified `backend/src/app.js` to make the background listener optional via `START_LISTENER` env var.
-   Switched file uploads to Cloudinary for serverless compatibility.
-   Verified frontend `vercel.json`.
