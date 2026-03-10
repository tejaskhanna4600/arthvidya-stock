import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import { toast } from 'sonner';
import { AdminUndoButton } from './AdminUndoButton';

const CHAOS_CARDS = [
  'Market Crash: All stocks drop 20%',
  'Bull Run: All stocks rise 30%',
  'Insider Trading: One team gets bonus info',
  'Regulatory Freeze: Trading halted for 1 round',
  'Stock Split: Double shares, half price',
  'Merger Mania: Two random stocks merge',
  'Tax Audit: Top team loses 15% cash',
  'Stimulus Package: All teams get ₹2000',
  'Flash Crash: Random stock drops 50%',
  'IPO Boom: New stock enters market'
];

export default function ChaosCard() {
  const { actor } = useActor();
  const [spinning, setSpinning] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const spinWheel = async () => {
    if (!actor) return;
    setSpinning(true);
    setSelectedCard(null);
    try {
      const res = await actor.chaosSpin();
      setSelectedCard(res.card);
      toast.success('Chaos card shown on screen!');
    } catch (e) {
      toast.error('Failed to spin');
      setSpinning(false);
      return;
    }
    setSpinning(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-chart-4" />
          Chaos Card
        </CardTitle>
        <AdminUndoButton />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <Button
            onClick={spinWheel}
            disabled={spinning}
            size="lg"
            className="w-full bg-gradient-to-r from-chart-4 to-chart-5 hover:from-chart-4/90 hover:to-chart-5/90"
          >
            {spinning ? 'Spinning...' : 'Spin Chaos Wheel'}
          </Button>

          {spinning && (
            <div className="p-8 border-2 border-chart-4 rounded-lg bg-chart-4/10 animate-pulse">
              <div className="text-2xl font-bold text-chart-4">🎰 Spinning...</div>
            </div>
          )}

          {selectedCard && !spinning && (
            <div className="p-8 border-2 border-chart-4 rounded-lg bg-gradient-to-br from-chart-4/20 to-chart-5/20 animate-in fade-in zoom-in duration-500">
              <div className="text-xl font-bold text-chart-4 mb-2">Chaos Card Drawn!</div>
              <div className="text-lg font-semibold">{selectedCard}</div>
              <div className="text-sm text-muted-foreground mt-4">
                Apply this effect manually to the game
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Available Chaos Cards:</h3>
          <div className="grid gap-2">
            {CHAOS_CARDS.map((card, index) => (
              <div
                key={index}
                className="p-2 text-sm border rounded bg-card hover:bg-accent/50 transition-colors"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
