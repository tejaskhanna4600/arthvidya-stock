import { useState, useEffect } from 'react';

interface MarketStateWithTimer {
  isOpen?: boolean;
  roundEndAt?: number | null;
}

function formatRemaining(secondsLeft: number): string {
  if (secondsLeft <= 0) return '0:00';
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = Math.floor(secondsLeft % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface RoundCountdownProps {
  marketState?: MarketStateWithTimer | null;
  /** Compact style for team panel; default is normal for screen */
  compact?: boolean;
  className?: string;
}

function getSecondsLeft(endAt: number | null | undefined): number | null {
  if (endAt == null || endAt <= 0) return null;
  const left = Math.max(0, Math.floor(endAt - Date.now() / 1000));
  return left;
}

export default function RoundCountdown({ marketState, compact, className = '' }: RoundCountdownProps) {
  const endAt = marketState?.roundEndAt;
  const isOpen = !!marketState?.isOpen;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    isOpen && endAt != null ? getSecondsLeft(endAt) : null
  );

  useEffect(() => {
    if (!isOpen || endAt == null || endAt <= 0) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => setSecondsLeft(getSecondsLeft(endAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, endAt]);

  if (!isOpen || endAt == null || secondsLeft === null) return null;

  const isExpired = secondsLeft <= 0;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 font-mono font-bold tabular-nums ${isExpired ? 'text-amber-500' : 'text-chart-2'} ${className}`}
        title={isExpired ? "Round timer ended—admin will end the round manually" : 'Round countdown'}
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Timer</span>
        <span className={isExpired ? 'animate-pulse' : ''}>
          {isExpired ? '0:00' : formatRemaining(secondsLeft)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border px-4 py-2 ${isExpired ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-chart-2/40 bg-chart-2/10 text-chart-2'} ${className}`}
      title={isExpired ? "Round timer ended—admin will end the round manually" : 'Round countdown'}
    >
      <div className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
        Round ends in
      </div>
      <div className={`text-2xl font-display font-bold tabular-nums ${isExpired ? 'animate-pulse' : ''}`}>
        {isExpired ? '0:00' : formatRemaining(secondsLeft)}
      </div>
    </div>
  );
}
