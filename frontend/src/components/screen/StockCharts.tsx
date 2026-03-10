import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockView } from '../../backend/types';

interface OHLCData {
  round: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Candlestick: Body = open-close. Upper wick = high to top of body. Lower wick = low to bottom of body. */
function getOHLCFromPriceHistory(priceHistory: number[]): OHLCData[] {
  if (priceHistory.length === 0) return [];
  return priceHistory.map((price, i) => {
    const open = i === 0 ? price : priceHistory[i - 1];
    const close = price;
    const high = Math.max(open, close);
    const low = Math.min(open, close);
    return { round: i + 1, open, high, low, close };
  });
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 320;

interface CandlestickChartProps {
  data: OHLCData[];
  name: string;
  industry?: string;
}

function CandlestickChart({ data, name, industry }: CandlestickChartProps) {
  const { candles, yTicks, xTicks } = useMemo(() => {
    if (!data.length) return { candles: [] as Array<{ x: number; halfW: number; yH: number; yL: number; bodyTop: number; bodyH: number; isUp: boolean }>, yTicks: [] as Array<{ value: number; y: number }>, xTicks: [] as Array<{ value: number; x: number }> };
    const prices = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
    const yMin = Math.min(...prices);
    const yMax = Math.max(...prices);
    const padding = (yMax - yMin) * 0.1 || 1;
    const r = yMax - yMin + padding * 2;
    const m = yMin - padding;

    const padX = 70;
    const padY = 40;
    const chartW = CHART_WIDTH - padX * 2;
    const chartH = CHART_HEIGHT - padY * 2;

    const y = (val: number) => padY + chartH - ((val - m) / r) * chartH;

    const yTickCount = 5;
    const yTicks: Array<{ value: number; y: number }> = [];
    for (let i = 0; i <= yTickCount; i++) {
      const val = m + (r * i) / yTickCount;
      yTicks.push({ value: val, y: y(val) });
    }

    const xTicks: Array<{ value: number; x: number }> = data.map((d, i) => {
      const xRatio = data.length > 1 ? i / (data.length - 1) : 0.5;
      const x = padX + xRatio * chartW;
      return { value: d.round, x };
    });

    function computeCandles() {
      return data.map((d, i) => {
        const xRatio = data.length > 1 ? i / (data.length - 1) : 0.5;
        const x = padX + xRatio * chartW;
        const candleW = Math.max(6, (chartW / Math.max(data.length, 1)) * 0.6);
        const halfW = candleW / 2;

        const y = (val: number) => padY + chartH - ((val - m) / r) * chartH;
        const yH = y(d.high);
        const yL = y(d.low);
        const yO = y(d.open);
        const yC = y(d.close);
        const isUp = d.close >= d.open;
        const bodyTop = Math.min(yO, yC);
        const bodyH = Math.max(1, Math.abs(yC - yO));

        return { x, halfW, yH, yL, bodyTop, bodyH, isUp, ...d };
      });
    }

    return { candles: computeCandles(), yTicks, xTicks };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-muted-foreground h-[280px]">
        No price data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2">
      <h3 className="font-bold text-white text-lg flex-shrink-0">
        {name}
        {industry && (
          <span className="text-muted-foreground text-sm font-normal ml-2">({industry})</span>
        )}
      </h3>
      <div className="flex-1 min-h-[200px]">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-full max-w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
        <defs>
          <linearGradient id={`candleGreen-${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id={`candleRed-${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={70}
            y1={tick.y}
            x2={CHART_WIDTH - 70}
            y2={tick.y}
            stroke="#333"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        ))}
        {/* Y-axis price labels (integers, larger for visibility) */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={65}
            y={tick.y + 6}
            fill="#ddd"
            textAnchor="end"
            fontSize={16}
            fontFamily="ui-monospace, monospace"
          >
            ₹{Math.round(tick.value).toLocaleString('en-IN')}
          </text>
        ))}
        {candles.map((c, i) => {
          // Solid green/red candles for better visibility on the projector
          const fill = c.isUp ? '#22c55e' : '#ef4444';
          const stroke = c.isUp ? '#16a34a' : '#b91c1c';
          const tooltip = `Round ${c.round}: O ₹${c.open.toFixed(2)} H ₹${c.high.toFixed(2)} L ₹${c.low.toFixed(2)} C ₹${c.close.toFixed(2)}`;
          return (
            <g key={i}>
              <title>{tooltip}</title>
              {/* Upper wick: high to top of body */}
              <line
                x1={c.x}
                y1={c.yH}
                x2={c.x}
                y2={c.bodyTop}
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {/* Lower wick: bottom of body to low */}
              <line
                x1={c.x}
                y1={c.bodyTop + c.bodyH}
                x2={c.x}
                y2={c.yL}
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {/* Body: real body (open-close) */}
              <rect
                x={c.x - c.halfW}
                y={c.bodyTop}
                width={c.halfW * 2}
                height={c.bodyH}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
              />
            </g>
          );
        })}
        {/* X-axis round labels */}
        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={CHART_HEIGHT - 10}
            fill="#aaa"
            textAnchor="middle"
            fontSize={14}
            fontFamily="monospace"
          >
            {tick.value}
          </text>
        ))}
        {/* Axis title (only for rounds) */}
        <text x={CHART_WIDTH / 2} y={CHART_HEIGHT - 2} fill="#999" textAnchor="middle" fontSize={12}>
          Round
        </text>
      </svg>
      </div>
    </div>
  );
}

interface StockChartsProps {
  stocks: Array<[string, StockView]>;
}

export default function StockCharts({ stocks }: StockChartsProps) {
  return (
    <Card className="bg-[#0c0f18]/80 border-chart-3/40 h-full flex flex-col min-h-0 shadow-lg font-sans">
      <CardHeader className="flex-shrink-0 border-b border-chart-3/30">
        <CardTitle className="text-chart-3 font-display font-bold tracking-wide text-3xl flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-chart-3 animate-pulse" />
          Price Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[320px]">
          {stocks.map(([name, stock]) => {
            const chartData = getOHLCFromPriceHistory(stock.priceHistory);
            return (
              <div key={name} className="min-w-0 flex flex-col min-h-[280px]">
                <CandlestickChart
                  data={chartData}
                  name={stock.name}
                  industry={stock.industry}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
