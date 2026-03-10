import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamView, StockView } from '../../backend/types';
import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';

interface PortfolioProps {
  team: TeamView | null | undefined;
  stocks: Array<[string, StockView]>;
}

export default function Portfolio({ team, stocks }: PortfolioProps) {
  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading portfolio...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockPrice = (stockName: string): number => {
    const stock = stocks.find(([name]) => name === stockName);
    return stock ? stock[1].price : 0;
  };

  const portfolioValue = team.portfolio.reduce((total, [stockName, quantity]) => {
    return total + getStockPrice(stockName) * Number(quantity);
  }, 0);

  const shortPositions = team.shortPositions ?? [];

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-chart-3" />
          Your Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-chart-3/20 to-chart-3/5 rounded-lg border border-chart-3/30">
            <div className="text-sm text-muted-foreground mb-1">Cash Balance</div>
            <div className="text-2xl font-bold text-chart-3">₹{team.cash.toFixed(2)}</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-chart-1/20 to-chart-1/5 rounded-lg border border-chart-1/30">
            <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold text-chart-1">₹{portfolioValue.toFixed(2)}</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-chart-2/20 to-chart-2/5 rounded-lg border border-chart-2/30">
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Value
            </div>
            <div className="text-3xl font-bold text-chart-2">₹{team.totalValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Long holdings</h3>
          {team.portfolio.length > 0 ? (
            <div className="space-y-2">
              {team.portfolio.map(([stockName, quantity]) => {
                const price = getStockPrice(stockName);
                const value = price * Number(quantity);
                return (
                  <div key={stockName} className="p-3 bg-accent/50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{stockName}</span>
                      <span className="text-sm text-muted-foreground">{quantity.toString()} shares</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">@ ₹{price.toFixed(2)}</span>
                      <span className="font-bold text-chart-1">₹{value.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No stocks owned yet
            </div>
          )}
        </div>

        {shortPositions.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-rose-500 dark:text-rose-400">
              <ArrowDownCircle className="w-4 h-4" />
              Short positions
            </h3>
            <div className="space-y-2">
              {shortPositions.map(([stockName, quantity]) => {
                const price = getStockPrice(stockName);
                const exposure = price * Number(quantity);
                return (
                  <div key={stockName} className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{stockName}</span>
                      <span className="text-sm text-rose-400">{quantity.toString()} short</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>@ ₹{price.toFixed(2)}</span>
                      <span className="font-bold text-rose-500">Exposure ₹{exposure.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Short exposure reduces total value when price rises.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
