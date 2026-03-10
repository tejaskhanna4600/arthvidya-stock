import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetLeaderboard } from '../../hooks/useQueries';
import { Trophy, Medal, Award } from 'lucide-react';
import { AdminUndoButton } from './AdminUndoButton';

export default function Leaderboard() {
  const { data: leaderboard = [] } = useGetLeaderboard();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-chart-1" />
          Live Leaderboard
        </CardTitle>
        <AdminUndoButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Team Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(([teamName], index) => (
              <TableRow key={teamName} className={index < 3 ? 'bg-accent/20' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index + 1)}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{teamName}</TableCell>
              </TableRow>
            ))}
            {leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No teams yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
