import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TeamMarketStatusProps {
  marketState?: { roundNumber: number; isOpen: boolean };
}

export default function TeamMarketStatus({ marketState }: TeamMarketStatusProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-chart-1/20 to-chart-1/5 rounded-lg border border-chart-1/30">
            <div className="text-sm text-muted-foreground mb-1">Round</div>
            <div className="text-3xl font-bold text-chart-1">
              {marketState?.roundNumber.toString() || '0'}
            </div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-chart-2/20 to-chart-2/5 rounded-lg border border-chart-2/30">
            <div className="text-sm text-muted-foreground mb-1">Market Status</div>
            <Badge
              variant={marketState?.isOpen ? 'default' : 'secondary'}
              className={`text-sm px-4 py-1 font-bold ${
                marketState?.isOpen
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {marketState?.isOpen ? '● OPEN' : '● CLOSED'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
