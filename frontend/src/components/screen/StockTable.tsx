import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StockView } from '../../backend/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockTableProps {
  stocks: Array<[string, StockView]>;
}

export default function StockTable({ stocks }: StockTableProps) {
  const getPriceChange = (stock: StockView) => {
    if (stock.priceHistory.length < 2) return 0;
    const current = stock.price;
    const previous = stock.priceHistory[stock.priceHistory.length - 2];
    return current - previous;
  };

  const getPriceChangePercent = (stock: StockView) => {
    if (stock.priceHistory.length < 2) return 0;
    const current = stock.price;
    const previous = stock.priceHistory[stock.priceHistory.length - 2];
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card className="bg-[#0c0f18]/80 border-chart-1/40 shadow-lg shadow-chart-1/5 font-sans">
      <CardHeader className="border-b border-chart-1/30 pb-3">
        <CardTitle className="text-chart-1 font-display font-bold text-3xl tracking-wide flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE STOCK PRICES
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow className="border-chart-1/30 hover:bg-transparent">
              <TableHead className="text-chart-2 font-mono font-semibold uppercase tracking-wider">Stock</TableHead>
              <TableHead className="text-chart-2 font-mono font-semibold uppercase tracking-wider">Industry</TableHead>
              <TableHead className="text-chart-2 font-mono font-semibold uppercase tracking-wider text-right">Price</TableHead>
              <TableHead className="text-chart-2 font-mono font-semibold uppercase tracking-wider text-right">Change</TableHead>
              <TableHead className="text-chart-2 font-mono font-semibold uppercase tracking-wider text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map(([name, stock]) => {
              const change = getPriceChange(stock);
              const changePercent = getPriceChangePercent(stock);
              const isPositive = change >= 0;

              return (
                <TableRow key={name} className="border-chart-1/20 hover:bg-chart-1/10 transition-colors">
                  <TableCell className="font-display font-bold text-lg text-white">{stock.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-sans">{stock.industry || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-xl font-bold text-chart-1 tabular-nums">
                    ₹{stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {isPositive ? '+' : ''}₹{change.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold text-lg tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
