import { useMemo } from 'react';
import type { StockView } from '../../backend/types';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Coffee, Clock } from 'lucide-react';

interface BreakScreenProps {
  leaderboard: Array<[string, number]>;
  stocks: Array<[string, StockView]>;
  roundNumber: number;
}

function getPriceChangePercent(stock: StockView): number {
  if (stock.priceHistory.length < 2) return 0;
  const first = stock.priceHistory[0];
  const current = stock.price;
  return ((current - first) / first) * 100;
}

export default function BreakScreen({ leaderboard, stocks, roundNumber }: BreakScreenProps) {
  const topGainer = useMemo(() => {
    if (stocks.length === 0) return null;
    let best: { name: string; view: StockView; percent: number } | null = null;
    for (const [name, view] of stocks) {
      const pct = getPriceChangePercent(view);
      if (best === null || pct > best.percent) best = { name, view, percent: pct };
    }
    return best;
  }, [stocks]);

  const topLoser = useMemo(() => {
    if (stocks.length === 0) return null;
    let worst: { name: string; view: StockView; percent: number } | null = null;
    for (const [name, view] of stocks) {
      const pct = getPriceChangePercent(view);
      if (worst === null || pct < worst.percent) worst = { name, view, percent: pct };
    }
    return worst;
  }, [stocks]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-10 h-10 text-amber-400 drop-shadow-lg" />;
      case 2: return <Medal className="w-10 h-10 text-slate-300 drop-shadow" />;
      case 3: return <Award className="w-10 h-10 text-amber-600 drop-shadow" />;
      default: return <span className="w-10 h-10 flex items-center justify-center text-2xl font-display font-bold text-chart-2">{rank}</span>;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-br from-[#0a0d14] via-[#0e1525] to-[#080b14] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/assets/generated/trading-floor-hero.dim_1024x768.png')] bg-cover bg-center opacity-[0.06] pointer-events-none" />

      <div className="relative flex flex-col flex-1 min-h-0 p-8 md:p-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-chart-1/20 border border-chart-1/40 mb-4">
            <Coffee className="w-6 h-6 text-chart-1" />
            <span className="font-display font-bold text-chart-1 text-lg tracking-wide">BREAK TIME</span>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
            Arthvidya Stock Exchange
          </h1>
          <p className="text-muted-foreground font-mono mt-2">Round {roundNumber} — Refreshments • We&apos;ll be back shortly</p>
        </header>

        <div className="flex-1 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 min-h-0">
          {/* Leaderboard — main focus */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-xl md:text-2xl font-display font-bold text-chart-2 mb-4 flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              Leaderboard
            </h2>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border-2 border-chart-2/40 bg-black/30 backdrop-blur-sm p-4 md:p-6">
              <div className="space-y-3">
                {leaderboard.map(([teamName], index) => (
                  <div
                    key={teamName}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      index < 3
                        ? 'bg-gradient-to-r from-chart-2/25 to-chart-3/20 border-2 border-chart-2/50 shadow-lg'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-lg md:text-xl text-white truncate">{teamName}</div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center text-muted-foreground py-12 font-sans">No teams yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Stats: top gainer, top loser, round */}
          <div className="flex flex-col gap-6">
            <h2 className="text-xl md:text-2xl font-display font-bold text-chart-1 mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Session highlights
            </h2>

            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-6">
              <div className="text-sm font-mono text-emerald-400/90 uppercase tracking-wider mb-1">Top gainer</div>
              {topGainer ? (
                <>
                  <div className="font-display font-bold text-2xl text-white">{topGainer.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="font-mono font-bold text-xl text-emerald-400">+{topGainer.percent.toFixed(2)}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">₹{topGainer.view.price.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-muted-foreground font-sans">No data yet</div>
              )}
            </div>

            <div className="rounded-xl border-2 border-rose-500/40 bg-rose-500/10 p-6">
              <div className="text-sm font-mono text-rose-400/90 uppercase tracking-wider mb-1">Biggest drop</div>
              {topLoser && topLoser.percent < 0 ? (
                <>
                  <div className="font-display font-bold text-2xl text-white">{topLoser.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                    <span className="font-mono font-bold text-xl text-rose-400">{topLoser.percent.toFixed(2)}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">₹{topLoser.view.price.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-muted-foreground font-sans">No decline yet</div>
              )}
            </div>

            <div className="rounded-xl border-2 border-chart-3/40 bg-chart-3/10 p-6">
              <div className="text-sm font-mono text-chart-3/90 uppercase tracking-wider mb-1">Current round</div>
              <div className="font-display font-bold text-4xl text-chart-3">{roundNumber}</div>
              <div className="text-sm text-muted-foreground mt-1">Trading will resume shortly</div>
            </div>
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-sm font-sans mt-6">
          Enjoy the break • Next round coming up
        </footer>
      </div>
    </div>
  );
}
