import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StockView, TeamView } from '../../backend/types';
import { useBuyStock, useSellStock, useShortStock, useCoverShort } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TradingInterfaceProps {
  stocks: Array<[string, StockView]>;
  team: TeamView | null | undefined;
  marketState?: { roundNumber: number; isOpen: boolean };
}

export default function TradingInterface({ stocks, team, marketState }: TradingInterfaceProps) {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const buyStock = useBuyStock();
  const sellStock = useSellStock();
  const shortStock = useShortStock();
  const coverShort = useCoverShort();

  const isMarketOpen = marketState?.isOpen ?? false;

  const handleBuy = async () => {
    if (!team || !selectedStock) {
      toast.error('Please select a stock');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      await buyStock.mutateAsync({
        teamName: team.name,
        stockName: selectedStock,
        quantity: qty,
      });
      toast.success(`Bought ${qty} shares of ${selectedStock}`);
      setQuantity('1');
    } catch (error: any) {
      toast.error(error.message || 'Failed to buy stock');
    }
  };

  const handleSell = async () => {
    if (!team || !selectedStock) {
      toast.error('Please select a stock');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      await sellStock.mutateAsync({
        teamName: team.name,
        stockName: selectedStock,
        quantity: qty,
      });
      toast.success(`Sold ${qty} shares of ${selectedStock}`);
      setQuantity('1');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sell stock');
    }
  };

  const getOwnedQuantity = (stockName: string): number => {
    if (!team) return 0;
    const holding = team.portfolio.find(([name]) => name === stockName);
    return holding ? Number(holding[1]) : 0;
  };

  const getShortQuantity = (stockName: string): number => {
    if (!team?.shortPositions) return 0;
    const pos = team.shortPositions.find(([name]) => name === stockName);
    return pos ? Number(pos[1]) : 0;
  };

  const handleShort = async () => {
    if (!team || !selectedStock) {
      toast.error('Please select a stock');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }
    try {
      await shortStock.mutateAsync({
        teamName: team.name,
        stockName: selectedStock,
        quantity: qty,
      });
      toast.success(`Short sold ${qty} shares of ${selectedStock}. Profit if price falls.`);
      setQuantity('1');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to short');
    }
  };

  const handleCover = async () => {
    if (!team || !selectedStock) {
      toast.error('Please select a stock');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }
    const shortQty = getShortQuantity(selectedStock);
    if (qty > shortQty) {
      toast.error(`You have only ${shortQty} short. Cover at most ${shortQty}.`);
      return;
    }
    try {
      await coverShort.mutateAsync({
        teamName: team.name,
        stockName: selectedStock,
        quantity: qty,
      });
      toast.success(`Covered ${qty} short of ${selectedStock}`);
      setQuantity('1');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to cover short');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trading Interface</span>
          {!isMarketOpen && (
            <span className="text-sm font-normal text-destructive">Market Closed</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {stocks.map(([name, stock]) => {
            const owned = getOwnedQuantity(name);
            const shortQty = getShortQuantity(name);
            const isSelected = selectedStock === name;

            return (
              <div
                key={name}
                onClick={() => setSelectedStock(name)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-chart-3 bg-chart-3/10'
                    : 'border-border hover:border-chart-3/50 hover:bg-accent/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{stock.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-sm text-muted-foreground">
                      {owned > 0 && <span>Long: {owned}</span>}
                      {shortQty > 0 && <span className="text-rose-400">Short: {shortQty}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-chart-1">₹{stock.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedStock && (
          <div className="space-y-4 p-4 bg-accent/20 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!isMarketOpen}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleBuy}
                disabled={!isMarketOpen || buyStock.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {buyStock.isPending ? 'Buying...' : 'Buy'}
              </Button>
              <Button
                onClick={handleSell}
                disabled={!isMarketOpen || sellStock.isPending}
                variant="destructive"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                {sellStock.isPending ? 'Selling...' : 'Sell'}
              </Button>
              <Button
                onClick={handleShort}
                disabled={!isMarketOpen || shortStock.isPending}
                variant="outline"
                className="border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                {shortStock.isPending ? 'Shorting...' : 'Short'}
              </Button>
              <Button
                onClick={handleCover}
                disabled={!isMarketOpen || coverShort.isPending || getShortQuantity(selectedStock) === 0}
                variant="outline"
                className="border-rose-500/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                {coverShort.isPending ? 'Covering...' : 'Cover'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Short: sell borrowed shares now; profit if price falls. Cover: buy back to close the short.
            </p>
          </div>
        )}

        {!isMarketOpen && (
          <div className="text-center p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive font-semibold">
              Trading is currently disabled. Wait for the next round to start.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
