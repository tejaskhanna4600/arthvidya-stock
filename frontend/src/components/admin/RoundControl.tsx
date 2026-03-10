import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetMarketState, useStartRound, useEndRound, useStartBreak, useEndBreak, useSetRoundDuration } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Play, Square, Volume2, Coffee, Monitor, Timer } from 'lucide-react';
import { AdminUndoButton } from './AdminUndoButton';

export default function RoundControl() {
  const { data: marketState } = useGetMarketState();
  const startRound = useStartRound();
  const endRound = useEndRound();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();
  const setRoundDuration = useSetRoundDuration();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isBreakMode = !!marketState?.breakMode;
  const durationFromServer = marketState?.roundDurationMinutes ?? 5;
  const [roundDurationMinutes, setRoundDurationMinutes] = useState(durationFromServer);

  useEffect(() => {
    setRoundDurationMinutes(durationFromServer);
  }, [durationFromServer]);

  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  const playBuzzer = () => {
    if (audioRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5kdfy0HotBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/y24k2CBdmvOznnUoMDlCn4/C2YxwFOZHX8tB6LQUidb/v4JRCCxJcr+jrq1gVCEOc3fLBbiQFLoTP8tuJNggXZrzs551KDA5Qp+PwtmMcBTmR1/LQei0FInW/7+CUQg==';
      audioRef.current.play().catch(() => {});
    }
  };

  const handleStartRound = async () => {
    try {
      await startRound.mutateAsync();
      playBuzzer();
      toast.success('Round started! Market is now open.');
    } catch (error) {
      toast.error('Failed to start round');
    }
  };

  const handleEndRound = async () => {
    try {
      await endRound.mutateAsync();
      toast.success('Round ended. Market is now closed.');
    } catch (error) {
      toast.error('Failed to end round');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-chart-2" />
          Round Control
        </CardTitle>
        <AdminUndoButton />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-chart-2/20 to-chart-2/5 rounded-lg border border-chart-2/30 text-center">
            <div className="text-sm text-muted-foreground mb-2">Current Round</div>
            <div className="text-5xl font-bold text-chart-2">
              {marketState?.roundNumber.toString() || '0'}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-chart-1/20 to-chart-1/5 rounded-lg border border-chart-1/30 text-center">
            <div className="text-sm text-muted-foreground mb-2">Market Status</div>
            <div className={`text-3xl font-bold ${marketState?.isOpen ? 'text-green-500' : 'text-red-500'}`}>
              {marketState?.isOpen ? '● OPEN' : '● CLOSED'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border border-chart-2/30 bg-chart-2/5">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-chart-2" />
            <Label htmlFor="round-duration" className="text-sm font-medium whitespace-nowrap">
              Round timer (minutes)
            </Label>
            <Input
              id="round-duration"
              type="number"
              min={1}
              max={120}
              value={roundDurationMinutes}
              onChange={(e) => setRoundDurationMinutes(Number(e.target.value) || 5)}
              className="w-20 font-mono tabular-nums"
            />
          </div>
          <Button
            onClick={async () => {
              const min = Math.max(1, Math.min(120, Math.round(roundDurationMinutes)));
              try {
                await setRoundDuration.mutateAsync(min);
                setRoundDurationMinutes(min);
                toast.success(`Round timer set to ${min} minute${min === 1 ? '' : 's'}. Applies when you start the next round.`);
              } catch {
                toast.error('Failed to set round duration');
              }
            }}
            disabled={setRoundDuration.isPending}
            variant="outline"
            size="sm"
            className="border-chart-2/50 hover:bg-chart-2/10"
          >
            {setRoundDuration.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={handleStartRound}
            disabled={marketState?.isOpen || startRound.isPending}
            size="lg"
            className="h-20 text-lg bg-green-600 hover:bg-green-700"
          >
            <Play className="w-6 h-6 mr-2" />
            {startRound.isPending ? 'Starting...' : 'Start Round'}
          </Button>

          <Button
            onClick={handleEndRound}
            disabled={!marketState?.isOpen || endRound.isPending}
            size="lg"
            variant="destructive"
            className="h-20 text-lg"
          >
            <Square className="w-6 h-6 mr-2" />
            {endRound.isPending ? 'Ending...' : 'End Round'}
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-display font-semibold text-chart-3 mb-3 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Break / Screen
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            During refreshments: show leaderboard and session stats on the projector. When you resume, hide the break screen.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={async () => {
                try {
                  await startBreak.mutateAsync();
                  toast.success('Break screen is now showing on the Screen panel (projector).');
                } catch {
                  toast.error('Failed to start break screen');
                }
              }}
              disabled={isBreakMode || startBreak.isPending}
              variant="outline"
              className="border-chart-3/50 hover:bg-chart-3/10"
            >
              <Coffee className="w-5 h-5 mr-2" />
              {startBreak.isPending ? 'Starting...' : 'Show break (leaderboard)'}
            </Button>
            <Button
              onClick={async () => {
                try {
                  await endBreak.mutateAsync();
                  toast.success('Break screen removed. Screen panel shows live market again.');
                } catch {
                  toast.error('Failed to end break screen');
                }
              }}
              disabled={!isBreakMode || endBreak.isPending}
              variant="outline"
              className="border-chart-1/50 hover:bg-chart-1/10"
            >
              {endBreak.isPending ? 'Ending...' : 'End break (back to live)'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Set "Round timer" above and click Save; the countdown runs when you start a round (Screen & Team panels see it)</li>
            <li>• Click "Start Round" to open the market and enable trading; the countdown begins</li>
            <li>• A buzzer sound will play when the round starts</li>
            <li>• When the timer reaches zero, the round does not end automatically—you still click "End Round"</li>
            <li>• Teams can buy and sell stocks during open rounds</li>
            <li>• Click "End Round" to close the market and stop trading</li>
            <li>• Update stock prices after each round ends</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
