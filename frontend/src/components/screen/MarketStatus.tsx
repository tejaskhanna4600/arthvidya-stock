import { Badge } from '@/components/ui/badge';

interface MarketStatusProps {
  marketState?: { roundNumber: number; isOpen: boolean };
}

export default function MarketStatus({ marketState }: MarketStatusProps) {
  if (!marketState) return null;

  return (
    <div className="flex items-center gap-5 font-sans">
      <div className="text-right">
        <div className="text-xs font-mono font-semibold text-chart-2/80 uppercase tracking-widest">Round</div>
        <div className="text-3xl font-display font-extrabold text-chart-2 tabular-nums">{marketState.roundNumber.toString()}</div>
      </div>
      <div className="h-12 w-px bg-chart-1/40" />
      <div>
        <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-1">Market</div>
        <Badge
          variant={marketState.isOpen ? 'default' : 'secondary'}
          className={`text-sm px-4 py-1.5 font-display font-bold uppercase tracking-wide ${
            marketState.isOpen
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 animate-pulse'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
          }`}
        >
          {marketState.isOpen ? '◆ OPEN' : '◆ CLOSED'}
        </Badge>
      </div>
    </div>
  );
}
