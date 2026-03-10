import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import PanelLogo from '../components/shared/PanelLogo';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAllStocks, useGetMarketState, useGetLatestNews, useGetAllNews, useGetChaosLatest, useGetLeaderboard } from '../hooks/useQueries';
import StockTicker from '../components/screen/StockTicker';
import MarketStatus from '../components/screen/MarketStatus';
import RoundCountdown from '../components/shared/RoundCountdown';
import StockTable from '../components/screen/StockTable';
import NewsFlash from '../components/screen/NewsFlash';
import NewsFlashedDetail from '../components/screen/NewsFlashedDetail';
import StockCharts from '../components/screen/StockCharts';
import ChaosCardDisplay from '../components/screen/ChaosCardDisplay';
import BreakScreen from '../components/screen/BreakScreen';

interface ScreenPanelProps {
  onLogout: () => void;
}

export default function ScreenPanel({ onLogout }: ScreenPanelProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: stocks = [], refetch: refetchStocks } = useGetAllStocks();
  const { data: marketState, refetch: refetchMarket } = useGetMarketState();
  const { data: latestNews, refetch: refetchNews } = useGetLatestNews();
  const { data: allNews = [], refetch: refetchAllNews } = useGetAllNews();
  const { data: chaosLatest, refetch: refetchChaos } = useGetChaosLatest();
  const { data: leaderboard = [], refetch: refetchLeaderboard } = useGetLeaderboard();

  const flashedNews = allNews.filter(([, news]) => news.isFlashed);
  const isBreakMode = !!marketState?.breakMode;

  useEffect(() => {
    const interval = setInterval(() => {
      refetchStocks();
      refetchMarket();
      refetchNews();
      refetchAllNews();
      refetchChaos();
      refetchLeaderboard();
    }, 2000);

    return () => clearInterval(interval);
  }, [refetchStocks, refetchMarket, refetchNews, refetchAllNews, refetchChaos, refetchLeaderboard]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onLogout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0c0f1a] via-[#0e1220] to-[#080b14] text-foreground relative">
      <div className="relative flex flex-col flex-1 min-h-0">
        <div className="absolute inset-0 bg-[url('/assets/generated/trading-floor-hero.dim_1024x768.png')] bg-cover bg-center opacity-[0.07]" />

        {/* Header + stock ticker always at top (stocks moving left to right) */}
        <header className="relative flex-shrink-0 border-b-2 border-chart-1/40 bg-[#0a0d14]/90 backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.08)]">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent drop-shadow-sm">
                  ARTHVIDYA STOCK EXCHANGE
                </h1>
                <p className="text-sm font-mono font-semibold text-chart-1/90 tracking-widest mt-0.5 animate-live-pulse">
                  {isBreakMode ? '◆ BREAK TIME' : '◆ LIVE MARKET DATA'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <RoundCountdown marketState={marketState} />
                <MarketStatus marketState={marketState} />
                <div className="flex items-center gap-3">
                  <PanelLogo />
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <StockTicker stocks={stocks} />
        </header>

        <main className="relative flex-1 min-h-0 flex flex-col px-6 py-6">
          {isBreakMode ? (
            <BreakScreen
              leaderboard={leaderboard}
              stocks={stocks}
              roundNumber={marketState?.roundNumber ?? 0}
            />
          ) : (
            <>
              <NewsFlash news={latestNews} />
              <ChaosCardDisplay card={chaosLatest?.card} />

              <div className="flex-1 min-h-0 grid lg:grid-cols-[2fr_3fr] gap-6">
                <div className="flex flex-col gap-6 min-w-0 min-h-0">
                  <div className="flex-shrink-0">
                    <StockTable stocks={stocks} />
                  </div>
                  <div className="flex-1 min-h-0">
                    <NewsFlashedDetail flashedNews={flashedNews} />
                  </div>
                </div>
                <div className="min-w-0 min-h-0 flex flex-col">
                  <StockCharts stocks={stocks} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
