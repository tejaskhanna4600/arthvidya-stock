import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerTeam, useGetAllStocks, useGetMarketState, useGetLatestNews } from '../hooks/useQueries';
import Portfolio from '../components/team/Portfolio';
import TradingInterface from '../components/team/TradingInterface';
import TeamMarketStatus from '../components/team/TeamMarketStatus';
import TeamNews from '../components/team/TeamNews';
import PanelLogo from '../components/shared/PanelLogo';
import RoundCountdown from '../components/shared/RoundCountdown';

interface TeamPanelProps {
  onLogout: () => void;
}

export default function TeamPanel({ onLogout }: TeamPanelProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: team, refetch: refetchTeam } = useGetCallerTeam();
  const { data: stocks = [], refetch: refetchStocks } = useGetAllStocks();
  const { data: marketState, refetch: refetchMarket } = useGetMarketState();
  const { data: latestNews, refetch: refetchNews } = useGetLatestNews();

  useEffect(() => {
    const interval = setInterval(() => {
      refetchTeam();
      refetchStocks();
      refetchMarket();
      refetchNews();
    }, 2000);

    return () => clearInterval(interval);
  }, [refetchTeam, refetchStocks, refetchMarket, refetchNews]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f1a] via-[#0e1220] to-[#080b14] font-sans">
      <header className="border-b border-chart-1/30 bg-[#0a0d14]/95 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-chart-3 tracking-tight">Team Trading Panel</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">{team?.name || 'Loading...'}</p>
          </div>
          <div className="flex items-center gap-3">
            <RoundCountdown marketState={marketState} compact />
            <PanelLogo />
            <Button onClick={handleLogout} variant="outline" size="sm" className="font-sans border-chart-1/30 hover:bg-chart-1/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <TeamMarketStatus marketState={marketState} />
        
        <TeamNews news={latestNews} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingInterface 
              stocks={stocks} 
              team={team} 
              marketState={marketState}
            />
          </div>
          <div>
            <Portfolio team={team} stocks={stocks} />
          </div>
        </div>
      </main>
    </div>
  );
}
