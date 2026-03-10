# Frontend Troubleshooting Guide

## If Frontend Keeps Crashing

### Step 1: Check the Error Message

**Open your browser's Developer Console:**
- Press `F12` or `Right-click → Inspect → Console tab`
- Look for **red error messages** and share them

**Check the terminal where `npm run dev` is running:**
- Look for error messages in red
- Share the full error output

---

### Step 2: Clean Install (Most Common Fix)

Delete `node_modules` and reinstall:

```bat
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

Or in PowerShell:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

---

### Step 3: Check Node.js Version

Make sure you have Node.js 16+:

```bat
node --version
```

If it's below 16, update Node.js from https://nodejs.org/

---

### Step 4: Common Errors and Fixes

#### Error: "Cannot find module..."
**Fix:** Run `npm install` in the `frontend` folder

#### Error: "Port 5173 already in use"
**Fix:** 
- Close other programs using port 5173, OR
- Change port in `vite.config.js`:
  ```js
  server: {
    port: 5174,  // Change to different port
  }
  ```

#### Error: "Failed to fetch" or CORS errors
**Fix:** Make sure the **backend is running** at http://127.0.0.1:5000

#### Error: TypeScript errors
**Fix:** The app should still run, but if it crashes:
```bat
cd frontend
npm install --save-dev typescript@latest
```

#### Error: Blank white screen
**Fix:** 
1. Check browser console (F12) for errors
2. Make sure backend is running
3. Try hard refresh: `Ctrl + Shift + R` or `Ctrl + F5`

---

### Step 5: Manual Start (Step by Step)

1. **Open terminal in project root**

2. **Go to frontend folder:**
   ```bat
   cd frontend
   ```

3. **Install dependencies (first time only):**
   ```bat
   npm install
   ```
   Wait for it to finish (may take 2-5 minutes)

4. **Start dev server:**
   ```bat
   npm run dev
   ```

5. **You should see:**
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

6. **Open browser:** http://localhost:5173

---

### Step 6: Check Backend Connection

The frontend needs the backend to be running. Make sure:

1. Backend is running in another terminal (you should see "Flask backend running at http://127.0.0.1:5000")
2. You can access http://127.0.0.1:5000/api/me in your browser (should return JSON)

---

### Step 7: Still Not Working?

**Share these details:**
1. The **exact error message** from browser console (F12)
2. The **exact error message** from terminal
3. Your **Node.js version** (`node --version`)
4. Your **npm version** (`npm --version`)
5. Whether **backend is running** and accessible
