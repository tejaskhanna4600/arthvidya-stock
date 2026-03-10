/**
 * API client for Flask backend. All methods return Promises; throw on non-OK.
 */

const getBaseUrl = () => {
  const u = (import.meta as any).env?.VITE_API_URL;
  if (u) return u.replace(/\/$/, '');
  // Use relative URLs so Vite proxy forwards /api to backend - avoids "Failed to fetch" and CORS
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://127.0.0.1:5000';
};

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...rest } = options;
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    ...((rest.headers as Record<string, string>) || {}),
  };
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    credentials: 'include',
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const errBody = await res.text();
    let msg = errBody;
    try {
      const j = JSON.parse(errBody);
      if (j.error) msg = j.error;
    } catch {}
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Types used by actor interface
import type { StockView, TeamView, News, UserProfile } from '../backend/types';

export type MarketState = { roundNumber: number; isOpen: boolean; breakMode?: boolean; roundDurationMinutes?: number; roundEndAt?: number | null };

export const api = {
  async login(panelType: 'admin' | 'screen' | 'team', id: string, password: string, teamName?: string) {
    return request<{ ok: boolean; role: string; teamName?: string }>('/api/login', {
      method: 'POST',
      json: { panelType, id, password, teamName: teamName || id },
    });
  },
  async logout() {
    return request<{ ok: boolean }>('/api/logout', { method: 'POST' });
  },
  async getMe() {
    return request<{ user: { role: string; teamName?: string } | null }>('/api/me');
  },

  async getCallerUserProfile(): Promise<UserProfile | null> {
    const r = await request<{ profile: UserProfile | null }>('/api/profile');
    return r.profile;
  },
  async saveCallerUserProfile(profile: UserProfile) {
    return request<{ ok: boolean }>('/api/profile', {
      method: 'POST',
      json: { name: profile.name, teamName: profile.teamName ?? undefined },
    });
  },

  async getAllStocks(): Promise<Array<[string, StockView]>> {
    return request<Array<[string, StockView]>>('/api/stocks');
  },
  async createStock(name: string, initialPrice: number, industry?: string) {
    return request<{ ok: boolean }>('/api/stocks', { method: 'POST', json: { name, initialPrice, industry } });
  },
  async updateStockPrice(name: string, newPrice: number) {
    return request<{ ok: boolean }>(`/api/stocks/${encodeURIComponent(name)}/price`, {
      method: 'PUT',
      json: { newPrice },
    });
  },
  async updateStockMeta(name: string, params: { newName?: string; industry?: string }) {
    return request<{ ok: boolean }>(`/api/stocks/${encodeURIComponent(name)}`, {
      method: 'PUT',
      json: params,
    });
  },

  async getAllTeams(): Promise<Array<[string, TeamView]>> {
    return request<Array<[string, TeamView]>>('/api/teams');
  },
  async getCallerTeam(): Promise<TeamView | null> {
    return request<TeamView | null>('/api/team/me');
  },
  async createTeam(name: string, initialCash: number, password?: string) {
    return request<{ ok: boolean }>('/api/teams', { method: 'POST', json: { name, initialCash, password } });
  },
  async updateTeamCash(name: string, amount: number) {
    return request<{ ok: boolean }>(`/api/teams/${encodeURIComponent(name)}/cash`, {
      method: 'PUT',
      json: { amount },
    });
  },
  async updateTeam(name: string, params: { newName?: string; password?: string }) {
    return request<{ ok: boolean }>(`/api/teams/${encodeURIComponent(name)}`, {
      method: 'PUT',
      json: params,
    });
  },
  async deleteTeam(name: string) {
    return request<{ ok: boolean }>(`/api/teams/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  async getMarketState(): Promise<MarketState> {
    return request<MarketState>('/api/market-state');
  },
  async startRound() {
    return request<{ ok: boolean }>('/api/round/start', { method: 'POST' });
  },
  async endRound() {
    return request<{ ok: boolean }>('/api/round/end', { method: 'POST' });
  },
  async setRoundDuration(minutes: number) {
    return request<{ ok: boolean; roundDurationMinutes: number }>('/api/round/set-duration', {
      method: 'POST',
      json: { minutes },
    });
  },
  async startBreak() {
    return request<{ ok: boolean }>('/api/break/start', { method: 'POST' });
  },
  async endBreak() {
    return request<{ ok: boolean }>('/api/break/end', { method: 'POST' });
  },

  async getAllNews(): Promise<Array<[number, News]>> {
    return request<Array<[number, News]>>('/api/news');
  },
  async getLatestNews(): Promise<News | null> {
    return request<News | null>('/api/news/latest');
  },
  async addNews(headline: string, description: string) {
    return request<{ ok: boolean; id: number }>('/api/news', {
      method: 'POST',
      json: { headline, description },
    });
  },
  async flashNews(newsId: number) {
    return request<{ ok: boolean }>(`/api/news/${newsId}/flash`, { method: 'POST' });
  },

  async getLeaderboard(): Promise<Array<[string, number]>> {
    return request<Array<[string, number]>>('/api/leaderboard');
  },

  async buyStock(teamName: string, stockName: string, quantity: number) {
    return request<{ ok: boolean }>('/api/trade/buy', {
      method: 'POST',
      json: { teamName, stockName, quantity },
    });
  },
  async sellStock(teamName: string, stockName: string, quantity: number) {
    return request<{ ok: boolean }>('/api/trade/sell', {
      method: 'POST',
      json: { teamName, stockName, quantity },
    });
  },
  async shortStock(teamName: string, stockName: string, quantity: number) {
    return request<{ ok: boolean }>('/api/trade/short', {
      method: 'POST',
      json: { teamName, stockName, quantity },
    });
  },
  async coverShort(teamName: string, stockName: string, quantity: number) {
    return request<{ ok: boolean }>('/api/trade/cover', {
      method: 'POST',
      json: { teamName, stockName, quantity },
    });
  },

  async updateStockPricesBatch(
    updates: { name: string; newPrice: number }[],
  ): Promise<{ ok: boolean; updated: number }> {
    return request<{ ok: boolean; updated: number }>('/api/stocks/batch-price', {
      method: 'POST',
      json: { updates },
    });
  },

  async adminUndo(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/admin/undo', {
      method: 'POST',
    });
  },

  async getChaosLatest(): Promise<{ card: string | null }> {
    return request<{ card: string | null }>('/api/chaos/latest');
  },
  async chaosSpin(): Promise<{ ok: boolean; card: string }> {
    return request<{ ok: boolean; card: string }>('/api/chaos/spin', { method: 'POST' });
  },

  /** Backup: download full state as JSON (admin only) */
  async getBackup(): Promise<BackupSnapshot> {
    return request<BackupSnapshot>('/api/backup');
  },
  /** Restore: replace server state with snapshot JSON (admin only) */
  async restoreBackup(snapshot: BackupSnapshot): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>('/api/backup/restore', {
      method: 'POST',
      json: snapshot,
    });
  },
  async getBackupAutoSaveStatus(): Promise<{
    autoBackupIntervalSec: number;
    lastAutoSavePath: string | null;
    lastAutoSaveAt: string | null;
  }> {
    return request('/api/backup/auto-save-status');
  },
};

/** Snapshot format returned by GET /api/backup and accepted by POST /api/backup/restore */
export type BackupSnapshot = {
  version: number;
  createdAt: string;
  stocks: Record<string, { name: string; price: number; priceHistory: number[]; industry: string }>;
  teams: Record<string, { name: string; cash: number; portfolio: Record<string, number>; shortPositions?: Record<string, number>; totalValue: number; password: string }>;
  news: Record<string, { headline: string; description: string; isFlashed: boolean }>;
  newsIdCounter: number;
  marketState: { roundNumber: number; isOpen: boolean };
  lastChaosCard: string | null;
};
