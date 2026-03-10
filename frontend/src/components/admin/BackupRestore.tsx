import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type BackupSnapshot } from '../../api/client';
import { Download, Upload, ShieldAlert, Clock, FileJson } from 'lucide-react';
import { AdminUndoButton } from './AdminUndoButton';

export default function BackupRestore() {
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [autoStatus, setAutoStatus] = useState<{
    autoBackupIntervalSec: number;
    lastAutoSavePath: string | null;
    lastAutoSaveAt: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const snapshot = await api.getBackup();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arthvidya-backup-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded. Save this file in a safe place (USB, cloud, second PC).');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text) as BackupSnapshot;
      if (typeof snapshot.version !== 'number' || !snapshot.stocks || !snapshot.teams) {
        toast.error('Invalid backup file format');
        return;
      }
      await api.restoreBackup(snapshot);
      toast.success('State restored from backup. All panels will refresh.');
      queryClient.invalidateQueries();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const loadAutoStatus = async () => {
    try {
      const s = await api.getBackupAutoSaveStatus();
      setAutoStatus(s);
    } catch {
      setAutoStatus(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="border-chart-1/20 bg-card/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display font-bold text-chart-1">
              <ShieldAlert className="w-5 h-5" />
              Backup & Restore
            </CardTitle>
            <CardDescription>
              Protect your event: download a backup file before or during the event. If the computer crashes, restart the server and restore from the last backup.
            </CardDescription>
          </div>
          <AdminUndoButton />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 p-4 rounded-lg border border-chart-1/20 bg-chart-1/5">
              <div className="flex items-center gap-2 font-display font-semibold text-chart-1">
                <Download className="w-5 h-5" />
                Download backup now
              </div>
              <p className="text-sm text-muted-foreground">
                Saves stocks, teams, news, market state, and chaos card to a JSON file. Store it on a USB drive or another computer.
              </p>
              <Button onClick={handleDownloadBackup} disabled={downloading} className="font-sans">
                {downloading ? 'Preparing…' : 'Download backup'}
              </Button>
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 font-display font-semibold text-amber-600 dark:text-amber-400">
                <Upload className="w-5 h-5" />
                Restore from file
              </div>
              <p className="text-sm text-muted-foreground">
                Replace current server state with a previously saved backup. Use after a crash or to roll back.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleRestore}
                disabled={restoring}
              />
              <Button
                variant="outline"
                className="font-sans border-amber-500/50 hover:bg-amber-500/10"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
              >
                {restoring ? 'Restoring…' : 'Choose file and restore'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-display font-semibold text-muted-foreground">
              <Clock className="w-4 h-4" />
              Auto-save status
            </div>
            <p className="text-sm text-muted-foreground">
              If the server was started with auto-backup (e.g. <code className="text-xs bg-muted px-1 rounded">AUTO_BACKUP_INTERVAL_SEC=300</code>), backups are written to disk every few minutes.
            </p>
            <Button variant="ghost" size="sm" onClick={loadAutoStatus} className="font-sans w-fit">
              Check auto-save status
            </Button>
            {autoStatus && (
              <div className="text-sm font-mono mt-2 space-y-1">
                {autoStatus.autoBackupIntervalSec > 0 ? (
                  <>
                    <p>Interval: every {autoStatus.autoBackupIntervalSec} seconds</p>
                    {autoStatus.lastAutoSaveAt && (
                      <p>Last save: {new Date(autoStatus.lastAutoSaveAt).toLocaleString()}</p>
                    )}
                    {autoStatus.lastAutoSavePath && (
                      <p className="text-muted-foreground truncate" title={autoStatus.lastAutoSavePath}>
                        Path: {autoStatus.lastAutoSavePath}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      After a crash: restart server with <code className="bg-muted px-1 rounded">RESTORE_FROM_BACKUP=backups/latest.json</code> to restore the last auto-save.
                    </p>
                  </>
                ) : (
                  <p>Auto-backup is disabled. Set <code className="bg-muted px-1 rounded">AUTO_BACKUP_INTERVAL_SEC=300</code> and restart the server to enable.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
            <FileJson className="w-4 h-4 mt-0.5 shrink-0 text-chart-1" />
            <div>
              <p className="font-semibold mb-1">Recovery after a crash</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Restart the Python server on this or another computer.</li>
                <li>Copy your latest backup file (e.g. from USB) to the server machine.</li>
                <li>In Admin → Backup, click &quot;Choose file and restore&quot; and select that file.</li>
                <li>Or set <code className="bg-muted px-1 rounded">RESTORE_FROM_BACKUP=path/to/backup.json</code> and restart the server to restore on startup.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
