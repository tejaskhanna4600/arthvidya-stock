import { Button } from '@/components/ui/button';
import { TrendingUp, Monitor, Users } from 'lucide-react';
import PanelLogo from '../components/shared/PanelLogo';

interface LandingPageProps {
  onNavigate: (panel: 'admin-login' | 'screen-login' | 'team-login') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0c0f1a] via-[#0e1220] to-[#080b14] p-4 font-sans relative">
      <div className="absolute top-4 right-4 z-20">
        <PanelLogo />
      </div>
      <div className="absolute inset-0 bg-[url('/assets/generated/trading-floor-hero.dim_1024x768.png')] bg-cover bg-center opacity-[0.06]" />
      
      <div className="relative z-10 max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-block px-6 py-2.5 bg-chart-1/15 border border-chart-1/40 rounded-full text-chart-1 text-sm font-display font-semibold tracking-wide mb-4 shadow-lg shadow-chart-1/10">
            Live Stock Market Simulation
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent drop-shadow-sm">
            Arthvidya Stock Exchange
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans">
            Experience real-time trading in a professional simulation environment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Button
            onClick={() => onNavigate('admin-login')}
            className="h-48 flex flex-col items-center justify-center gap-4 bg-chart-1/10 hover:bg-chart-1/20 border-2 border-chart-1/40 hover:border-chart-1/60 transition-all duration-300 font-display shadow-lg hover:shadow-chart-1/20"
            variant="outline"
          >
            <TrendingUp className="w-12 h-12 text-chart-1" />
            <div>
              <div className="text-xl font-bold text-chart-1">Admin Panel</div>
              <div className="text-sm text-muted-foreground mt-1 font-sans">Control Center</div>
            </div>
          </Button>

          <Button
            onClick={() => onNavigate('screen-login')}
            className="h-48 flex flex-col items-center justify-center gap-4 bg-chart-2/10 hover:bg-chart-2/20 border-2 border-chart-2/40 hover:border-chart-2/60 transition-all duration-300 font-display shadow-lg hover:shadow-chart-2/20"
            variant="outline"
          >
            <Monitor className="w-12 h-12 text-chart-2" />
            <div>
              <div className="text-xl font-bold text-chart-2">Screen Panel</div>
              <div className="text-sm text-muted-foreground mt-1 font-sans">Projector View</div>
            </div>
          </Button>

          <Button
            onClick={() => onNavigate('team-login')}
            className="h-48 flex flex-col items-center justify-center gap-4 bg-chart-3/10 hover:bg-chart-3/20 border-2 border-chart-3/40 hover:border-chart-3/60 transition-all duration-300 font-display shadow-lg hover:shadow-chart-3/20"
            variant="outline"
          >
            <Users className="w-12 h-12 text-chart-3" />
            <div>
              <div className="text-xl font-bold text-chart-3">Team Panel</div>
              <div className="text-sm text-muted-foreground mt-1 font-sans">Trading Interface</div>
            </div>
          </Button>
        </div>

        <footer className="mt-16 text-sm text-muted-foreground font-sans">
          © 2025. Built by Tejas Khanna
        </footer>
      </div>
    </div>
  );
}
