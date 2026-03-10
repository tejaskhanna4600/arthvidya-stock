# Deploy Online (Production)

This project is now configured to run as a single web service:
- Flask backend serves `/api/*`
- Flask also serves the built React frontend (`frontend/dist`)
- Socket.IO works on the same host

## What was prepared

- `server/app.py` now:
  - reads `PORT` and `HOST` from environment
  - uses `SECRET_KEY` from environment
  - uses `SESSION_COOKIE_SECURE` from environment
  - serves the built frontend for `/` and SPA routes
- `server/requirements.txt` includes `gunicorn` and `eventlet`
- `render.yaml` added for one-click Render blueprint deploy

## Option 1: Render (recommended)

### A) Deploy with `render.yaml` (Blueprint)

1. Push this repo to GitHub.
2. In Render: **New +** -> **Blueprint**.
3. Select this repository.
4. Render will read `render.yaml` and create the web service.
5. Open the generated URL after deployment completes.

### B) Manual Render service (if not using Blueprint)

- Runtime: Python
- Build Command:
  ```bash
  cd frontend
  npm ci
  npm run build
  cd ..
  pip install -r server/requirements.txt
  ```
- Start Command:
  ```bash
  cd server && gunicorn -k eventlet -w 1 -b 0.0.0.0:$PORT app:app
  ```
- Required env vars:
  - `SECRET_KEY` = strong random value
  - `SESSION_COOKIE_SECURE` = `1`
  - optional: `AUTO_BACKUP_INTERVAL_SEC=300`
  - optional: `BACKUP_DIR=/opt/render/project/src/server/backups`

## Option 2: Railway

Use the same build/start commands and environment variables as above.

## Local production-like run

From project root:

```bash
cd frontend
npm install
npm run build
cd ..
pip install -r server/requirements.txt
cd server
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app
```

Open: `http://127.0.0.1:5000`

## Important note on persistence

Current app state is in-memory. If the service restarts, active session state resets unless restored from backup.
Use Admin -> Backup to download snapshots regularly.
