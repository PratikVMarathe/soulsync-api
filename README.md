# SoulSync API — Cloudinary Upload & Health Backend

Lightweight Node.js + Express backend providing authenticated Cloudinary signed upload generation and health check endpoints for SoulSync.

---

## Features

- **Public Health Check**: `GET /health` for Render cold-start wake-up.
- **Secure Cloudinary Signature**: `POST /api/cloudinary/signature` for direct client-to-Cloudinary uploads.
- **Firebase Auth & Firestore RBAC**: Verifies Firebase ID Token and strictly enforces `ADMIN` / `SUPER_ADMIN` roles from Firestore `users/{uid}`.
- **Image Size Limit (500 KB)**: Enforced centrally via `MAX_IMAGE_SIZE_KB`.
- **Destination Folder Mapping**: Restricted to `soulsync/quiz-images` (`QUIZ`) and `soulsync/mandala-images` (`MANDALA`).
- **Zero API Secret Exposure**: `CLOUDINARY_API_SECRET` remains strictly on the server and is never returned to clients.
- **Multi-Environment Support**: Dedicated `.env.local` for local development and `.env.dev` for Dev/Render deployment.

---

## Environment Files & Ports

| Environment | Env File | Port | Purpose | Allowed Origins |
|---|---|---|---|---|
| **Local** | `.env.local` | `5003` | Local development & testing | `http://localhost:5000`, `http://localhost:5001`, `http://localhost:5002`, `http://localhost:5003`, `http://localhost:5173` |
| **Dev (Render)** | `.env.dev` | `10000` (or dynamic `PORT`) | Dev branch deployment on Render | `https://soulsync-b29c8.web.app`, `https://soulsync-b29c8.firebaseapp.com`, `https://soulsync-prod-app.web.app`, `https://soulsync-prod-app.firebaseapp.com`, `http://localhost:5000`, `http://localhost:5002`, `https://soulsync-dev-host.web.app` |

> [!NOTE]
> On Render, Render injects `process.env.PORT` automatically. The server automatically binds to `process.env.PORT` or falls back to the configured port.

---

## Running Commands

```bash
# 1. Run locally with auto-reload (loads .env.local on port 5003)
npm run dev

# 2. Run dev environment locally with auto-reload (loads .env.dev on port 10000)
npm run dev:dev

# 3. Start local server without watch mode (loads .env.local)
npm run start:local

# 4. Start dev server without watch mode (loads .env.dev)
npm run start:dev

# 5. Production / Render start command (uses system/Render env vars or .env)
npm start

# 6. Run Vitest test suite
npm test
```

---

## Endpoints

### 1. `GET /health`
- **Access**: Public
- **Response**:
```json
{
  "status": "running"
}
```

### 2. `POST /api/cloudinary/signature`
- **Access**: Authenticated (`ADMIN` or `SUPER_ADMIN`)
- **Headers**: `Authorization: Bearer <Firebase_ID_Token>`
- **Body**:
```json
{
  "folder": "QUIZ",
  "fileSize": 150000
}
```
- **Response**:
```json
{
  "success": true,
  "signature": "...",
  "timestamp": 1785948654,
  "cloudName": "...",
  "apiKey": "...",
  "folder": "soulsync/quiz-images",
  "uploadPreset": "soulsync_images",
  "maxImageSizeKb": 500
}
```

---

## Render Deployment Setup

1. In Render Dashboard, create a **Web Service** linked to your repository.
2. Set **Branch** to `dev`.
3. Set **Root Directory** to `soulsync/soulsync-api`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start` (or `npm run start:dev`).
6. Under **Environment Variables**, configure the secrets matching `.env.dev.example`:
   - `NODE_ENV`: `dev`
   - `PORT`: `10000` (Render will map this to the public URL)
   - `CLOUDINARY_CLOUD_NAME`: `<your_cloud_name>`
   - `CLOUDINARY_API_KEY`: `<your_api_key>`
   - `CLOUDINARY_API_SECRET`: `<your_api_secret>`
   - `CLOUDINARY_UPLOAD_PRESET`: `soulsync_images`
   - `MAX_IMAGE_SIZE_KB`: `500`
   - `FIREBASE_PROJECT_ID`: `soulsync-b29c8`
   - `FIREBASE_SERVICE_ACCOUNT`: `<service_account_json_string>`
   - `ALLOWED_ORIGINS`: `https://soulsync-b29c8.web.app,https://soulsync-b29c8.firebaseapp.com,https://soulsync-prod-app.web.app,https://soulsync-prod-app.firebaseapp.com,http://localhost:5000,http://localhost:5002`
