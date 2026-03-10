import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface ChaosCardDisplayProps {
  card: string | null | undefined;
}

export default function ChaosCardDisplay({ card }: ChaosCardDisplayProps) {
  const [show, setShow] = useState(false);
  const [displayCard, setDisplayCard] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      setDisplayCard(card);
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [card]);

  if (!show || !displayCard) return null;

  return (
    <div className="fixed inset-x-4 top-20 z-50 animate-in slide-in-from-top duration-500">
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-chart-4/90 via-chart-5/90 to-chart-4/90 border-2 border-chart-4 rounded-xl p-6 shadow-2xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-white/20 rounded-full p-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white/90 font-bold text-sm mb-1 tracking-wider">⚡ CHAOS CARD</div>
              <div className="text-white font-bold text-xl md:text-2xl">{displayCard}</div>
              <div className="text-white/80 text-sm mt-2">Apply this effect manually to the game</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
