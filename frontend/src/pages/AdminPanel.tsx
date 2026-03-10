import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import PanelLogo from '../components/shared/PanelLogo';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import StockManagement from '../components/admin/StockManagement';
import TeamManagement from '../components/admin/TeamManagement';
import RoundControl from '../components/admin/RoundControl';
import NewsControl from '../components/admin/NewsControl';
import Leaderboard from '../components/admin/Leaderboard';
import ChaosCard from '../components/admin/ChaosCard';
import BackupRestore from '../components/admin/BackupRestore';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0f1a] to-background font-sans">
      <header className="border-b border-chart-1/30 bg-[#0a0d14]/95 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-chart-1 tracking-tight">Admin Control Panel</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">Arthvidya Stock Exchange</p>
          </div>
          <div className="flex items-center gap-3">
            <PanelLogo />
            <Button onClick={handleLogout} variant="outline" size="sm" className="font-sans border-chart-1/30 hover:bg-chart-1/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="stocks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-[#0e1220]/80 border border-chart-1/20 p-1 rounded-lg font-sans">
            <TabsTrigger value="stocks" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Stocks</TabsTrigger>
            <TabsTrigger value="teams" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Teams</TabsTrigger>
            <TabsTrigger value="rounds" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Rounds</TabsTrigger>
            <TabsTrigger value="news" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">News</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Leaderboard</TabsTrigger>
            <TabsTrigger value="chaos" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Chaos</TabsTrigger>
            <TabsTrigger value="backup" className="font-display font-semibold data-[state=active]:bg-chart-1/20 data-[state=active]:text-chart-1">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <StockManagement />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="rounds">
            <RoundControl />
          </TabsContent>

          <TabsContent value="news">
            <NewsControl />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="chaos">
            <ChaosCard />
          </TabsContent>

          <TabsContent value="backup">
            <BackupRestore />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
