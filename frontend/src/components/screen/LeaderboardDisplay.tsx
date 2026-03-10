import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardDisplayProps {
  leaderboard: Array<[string, number]>;
}

export default function LeaderboardDisplay({ leaderboard }: LeaderboardDisplayProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-chart-2">{rank}</span>;
    }
  };

  return (
    <Card className="bg-black/40 border-chart-2/30 sticky top-6">
      <CardHeader>
        <CardTitle className="text-chart-2 font-mono flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          LEADERBOARD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.slice(0, 10).map(([teamName], index) => (
          <div
            key={teamName}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              index < 3 ? 'bg-gradient-to-r from-chart-2/20 to-chart-3/20 border border-chart-2/30' : 'bg-accent/10'
            }`}
          >
            <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{teamName}</div>
            </div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No teams yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
