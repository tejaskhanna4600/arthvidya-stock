import { StockView } from '../../backend/types';

interface StockTickerProps {
  stocks: Array<[string, StockView]>;
}

export default function StockTicker({ stocks }: StockTickerProps) {
  const getPriceChange = (stock: StockView) => {
    if (stock.priceHistory.length < 2) return 0;
    const current = stock.price;
    const previous = stock.priceHistory[stock.priceHistory.length - 2];
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="bg-[#060810]/95 border-t border-chart-1/40 overflow-hidden py-4 animate-ticker-glow">
      <div className="flex animate-marquee whitespace-nowrap items-center">
        {stocks.concat(stocks).map(([name, stock], index) => {
          const change = getPriceChange(stock);
          const isPositive = change >= 0;
          
          return (
            <div key={`${name}-${index}`} className="inline-flex items-center mx-14 px-5 py-2.5 rounded-lg bg-chart-1/10 border border-chart-1/30 shadow-sm font-mono">
              <span className="font-display font-bold text-chart-1 text-lg mr-3 tracking-wide">{stock.name}</span>
              {stock.industry && <span className="text-muted-foreground text-sm mr-3">({stock.industry})</span>}
              <span className="text-white font-mono font-semibold text-lg mr-3 tabular-nums">₹{stock.price.toFixed(2)}</span>
              <span className={`text-base font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
