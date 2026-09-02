# SoulSync API — Cloudinary Upload & Health Backend

Lightweight Node.js + Express backend providing authenticated Cloudinary signed upload generation and health check endpoint for SoulSync.

---

## Features

- **Public Health Check**: `GET /health` for Render cold-start wake-up.
- **Secure Cloudinary Signature**: `POST /api/cloudinary/signature` for direct client-to-Cloudinary uploads.
- **Firebase Auth & Firestore RBAC**: Verifies Firebase ID Token and strictly enforces `ADMIN` / `SUPER_ADMIN` roles from Firestore `users/{uid}`.
- **Image Size Limit (500 KB)**: Enforced centrally via `MAX_IMAGE_SIZE_KB`.
- **Destination Folder Mapping**: Restricted to `soulsync/quiz-images` (`QUIZ`) and `soulsync/mandala-images` (`MANDALA`).
- **Zero API Secret Exposure**: `CLOUDINARY_API_SECRET` remains strictly on the server and is never returned to clients.

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

## Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
2. Fill in your Cloudinary credentials and Firebase Service Account.
3. Install dependencies:
```bash
npm install
```
4. Start dev server:
```bash
npm run dev
```
5. Run tests:
```bash
npm test
```
