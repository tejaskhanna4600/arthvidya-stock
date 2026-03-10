# Backup & Restore (Crash Recovery)

If your computer crashes during the event, you can recover by restoring from a backup.

## Before / During the Event

1. **Download backups regularly**  
   In **Admin → Backup**, click **Download backup now**. Save the file to a USB drive or another computer (e.g. `arthvidya-backup-2025-02-01T12-00-00.json`).

2. **Optional: Auto-save**  
   Start the server with auto-backup so it writes a snapshot to disk every few minutes:
   ```bash
   set AUTO_BACKUP_INTERVAL_SEC=300
   python server/app.py
   ```
   Backups are saved to `server/backups/auto/` and `server/backups/latest.json`.

## After a Crash

### Option A: Restore from the Admin panel

1. Start the Python server again (on this or another computer).
2. Open the frontend, log in as Admin.
3. Go to **Admin → Backup**.
4. Click **Choose file and restore**, select your backup JSON file.
5. All panels will see the restored state after refresh.

### Option B: Restore on server startup

1. Copy your backup file to the server machine (e.g. `server/backups/my-backup.json`).
2. Start the server with:
   ```bash
   set RESTORE_FROM_BACKUP=server/backups/my-backup.json
   python server/app.py
   ```
   The server loads that backup on startup and then runs normally.

## Environment Variables (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `server/backups` | Directory for auto-save files. |
| `AUTO_BACKUP_INTERVAL_SEC` | `300` (5 min) | Auto-save interval in seconds. Use `0` to disable. |
| `RESTORE_FROM_BACKUP` | (none) | Path to a backup JSON file to restore when the server starts. |

## What Is Backed Up

- All stocks (names, prices, price history, industry)
- All teams (names, cash, portfolios, passwords)
- All news (headlines, descriptions, flashed state)
- Market state (round number, open/closed)
- Last chaos card shown

Session / login state is not backed up; users log in again after a restore.
