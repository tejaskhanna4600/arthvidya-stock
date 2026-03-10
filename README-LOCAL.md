# Arthvidya Stock Exchange – Run Locally (Flask)

This project runs the Stock Market Event **locally** using a **Python Flask** backend and the existing React frontend. No Caffeine AI or Internet Computer is required.

## Quick start

### Option A: Use run scripts (Windows)

1. **Backend:** Double-click `run-backend.bat` (or run it from a terminal).  
   - First run will create a virtualenv and install dependencies.  
   - Backend runs at **http://127.0.0.1:5000**.

2. **Frontend:** In a **new** terminal, run `run-frontend.bat`.  
   - First run will run `npm install`.  
   - Frontend runs at **http://localhost:5173**.

### Option B: Manual commands

#### 1. Backend (Flask)

```bash
cd server
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python app.py
```

Backend runs at **http://127.0.0.1:5000**.

#### 2. Frontend (Vite + React)

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. The Vite dev server proxies `/api` and `/socket.io` to the Flask backend, so you don’t need to set `VITE_API_URL` when using the dev server.

### 3. Open in browser

- **Landing:** http://localhost:5173  
- **Admin:** Tejas10 / 4600  
- **Screen:** Tejas10 / 4600  
- **Team:** Team name (must be created by Admin first), password: **Team1** or the team name

---

## Running on the same Wi‑Fi (other devices)

1. **Backend:** Start Flask with `python app.py` (it already binds to `0.0.0.0:5000`).
2. **Frontend:** Start with `npm run dev` and note your machine’s IP (e.g. `192.168.1.10`).
3. **Other devices:** Open `http://<YOUR_IP>:5173` (e.g. `http://192.168.1.10:5173`).
4. If the frontend can’t reach the API, run Vite with the API URL:
   ```bash
   set VITE_API_URL=http://<YOUR_IP>:5000
   npm run dev
   ```
   Then other devices will use that API URL when loading the app.

---

## Project layout

| Path | Role |
|------|------|
| `server/app.py` | Flask API + SocketIO, in-memory store |
| `server/requirements.txt` | Python dependencies |
| `frontend/` | React app (Vite), uses Flask API via proxy or `VITE_API_URL` |

---

## Default credentials

- **Admin / Screen:** ID `Tejas10`, Password `4600`
- **Team:** Team name = name created by Admin; Password `Team1` or the team name

Admin creates stocks (₹2000–₹4000), teams (₹10,000 each), news, and controls rounds. Teams log in with their team name and trade when the market is open.

## Deploy Online

Production deployment guide: see DEPLOYMENT.md in the project root.

