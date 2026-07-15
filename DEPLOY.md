# Deployment Guide

This project has three components that deploy separately:

| Component   | Platform  | Description                               |
|-------------|-----------|-------------------------------------------|
| Frontend    | Vercel    | Next.js 16 web application                 |
| Backend     | Railway   | Express REST API (Node.js 20, Docker)     |
| Database    | Aiven     | PostgreSQL (free tier)                     |
| Blockchain  | Sepolia   | Smart contracts (deployed separately)     |

---

## 1. Database — Aiven PostgreSQL (free tier)

1. Create a free PostgreSQL database at [aiven.io](https://aiven.io).
2. Once provisioned, copy the **Connection URI** (or individual host/port/user/password).
3. Connect to the database and run the schema:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
```

4. Keep the connection details handy — you'll need them for the backend env vars.

---

## 2. Backend — Railway

### Option A: Dockerfile (recommended)

1. Push the repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select the repository and set the **Root Directory** to `backend`.
4. Railway auto-detects the `Dockerfile`.
5. Add the following **Environment Variables** in Railway's service settings:

| Variable                 | Value                                          |
|--------------------------|-------------------------------------------------|
| `DB_HOST`                | Your Aiven host (e.g. `xxx.aivencloud.com`)    |
| `DB_PORT`                | Aiven port (e.g. `12345`)                       |
| `DB_USERNAME`            | `avnadmin`                                      |
| `DB_PASSWORD`            | Your Aiven password                             |
| `DB_NAME`                | `defaultdb`                                     |
| `SEPOLIA_RPC_URL`        | Your Sepolia RPC URL (Infura/Alchemy)           |
| `PRIVATE_KEY_PASSPHRASE` | Passphrase for `private.pem`                     |
| `NODE_ENV`               | `production`                                    |
| `EMAIL_SENDER`           | Your Gmail address                              |
| `EMAIL_PASSWORD`         | Gmail App Password                              |
| `CORS_ORIGIN`            | Your Vercel frontend URL (see step 3)          |

6. **Important:** The backend needs the RSA keys at `src/config/keys/private.pem` and `public.pem`.
   - These are in `.gitignore` and NOT in the repo.
   - Either add them via Railway's **Ephemeral Disk** + a build script, or embed them as env vars and adjust `jwt.util.js`.
   - For now, the simplest approach: generate keys locally and add them in the Railway service volume.

7. **Port:** Railway auto-sets `PORT`. The backend's `server.js` already reads `process.env.PORT || 3333`.

8. Deploy. Railway will give you a URL like `https://your-backend.up.railway.app`.

### Option B: Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
# Set root directory to backend
railway up
```

---

## 3. Frontend — Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import the GitHub repo.
3. Set the **Root Directory** to `frontend`.
4. Vercel auto-detects Next.js via the `vercel.json` config.
5. Add **Environment Variables** in Vercel's project settings:

| Variable                 | Value                                          |
|--------------------------|-------------------------------------------------|
| `NEXT_PUBLIC_API_URL`    | Your Railway backend URL (e.g. `https://your-backend.up.railway.app`) |
| `NEXT_PUBLIC_LINK_TOKEN` | `0x779877A7B0D9E8603169DdbD7836e478b4624789` (Sepolia LINK) |

6. Also go back to your **Railway backend** and update `CORS_ORIGIN` to match your Vercel URL (e.g. `https://your-app.vercel.app`).

7. Deploy. Vercel will build and give you a URL.

---

## 4. Verify Everything Works

1. Open the Vercel frontend URL.
2. Test registration, login, and JWT cookies (cross-origin).
3. Test job posting (requires wallet + blockchain interaction).
4. Check that profile picture uploads work (stored in backend `/uploads`).

> **Note:** Railway's filesystem is ephemeral — uploaded files will be lost on redeploy.
> For production, consider using Vercel Blob, AWS S3, or Cloudflare R2 for file storage.

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (local or Aiven)
- MetaMask extension (for blockchain interactions)

### Backend
```bash
cd backend
cp .env.example .env       # Fill in your database + RPC credentials
npm install
npm run seed               # (optional) Seed 50 test freelancers
npm run dev                 # Starts on port 3333
```

### Frontend
```bash
cd frontend
cp .env.example .env.local  # Defaults to http://localhost:3333
npm install
npm run dev                 # Starts on port 3000
```

### Database Setup
```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
```

---

## Architecture Notes

- **Frontend** → calls Backend API via centralized `api` client (`src/utils/api.js`), configured with `NEXT_PUBLIC_API_URL`.
- **Backend** → serves REST API + file uploads + blockchain event listener (background loop).
- **Backend** → connects to PostgreSQL via `pg` pool (replaces previous `mysql2`).
- **Blockchain** → smart contracts on Sepolia testnet (deployed separately via Hardhat).
