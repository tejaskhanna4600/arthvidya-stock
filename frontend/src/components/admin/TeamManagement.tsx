import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllTeams, useGetAllStocks, useCreateTeam, useUpdateTeamCash, useUpdateTeam, useDeleteTeam } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Plus, DollarSign, Wallet, X, Pencil, Trash2 } from 'lucide-react';
import type { TeamView } from '../../backend/types';
import { AdminUndoButton } from './AdminUndoButton';

export default function TeamManagement() {
  const { data: teams = [] } = useGetAllTeams();
  const { data: stocks = [] } = useGetAllStocks();
  const createTeam = useCreateTeam();
  const updateCash = useUpdateTeamCash();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [cashAdjustment, setCashAdjustment] = useState<{ team: string; amount: string } | null>(null);
  const [editingTeam, setEditingTeam] = useState<{ team: string; newName: string; newPassword: string } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<[string, TeamView] | null>(null);

  const getStockPrice = (stockName: string): number => {
    const stock = stocks.find(([name]) => name === stockName);
    return stock ? stock[1].price : 0;
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTeam.mutateAsync({ name: newTeamName, initialCash: 300000, password: newTeamPassword || undefined });
      toast.success('Team created successfully with ₹3,00,000');
      setNewTeamName('');
      setNewTeamPassword('');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleUpdateCash = async (teamName: string) => {
    if (!cashAdjustment) return;
    
    const amount = parseFloat(cashAdjustment.amount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    try {
      await updateCash.mutateAsync({ name: teamName, amount });
      toast.success(`Cash ${amount >= 0 ? 'added to' : 'removed from'} ${teamName}`);
      setCashAdjustment(null);
    } catch (error) {
      toast.error('Failed to update cash');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;
    const { team, newName, newPassword } = editingTeam;
    const params: { newName?: string; password?: string } = {};
    if (newName.trim() && newName.trim() !== team) params.newName = newName.trim();
    if (newPassword.trim()) params.password = newPassword.trim();
    if (Object.keys(params).length === 0) {
      toast.error('No changes to save');
      return;
    }
    try {
      await updateTeam.mutateAsync({ name: team, ...params });
      toast.success('Team updated successfully');
      setEditingTeam(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamName: string) => {
    if (!window.confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      await deleteTeam.mutateAsync(teamName);
      toast.success(`Team "${teamName}" deleted`);
      setSelectedTeam(null);
      setEditingTeam((prev) => (prev?.team === teamName ? null : prev));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete team');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Team
          </CardTitle>
          <AdminUndoButton />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Team Alpha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamPassword">Team Password</Label>
              <Input
                id="teamPassword"
                type="password"
                value={newTeamPassword}
                onChange={(e) => setNewTeamPassword(e.target.value)}
                placeholder="Password for team login"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                {createTeam.isPending ? 'Creating...' : 'Create Team (₹3,00,000)'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Cash Balance</TableHead>
                <TableHead>Stocks Owned</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(([name, team]) => (
                <TableRow
                  key={name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTeam([name, team])}
                >
                  <TableCell className="font-medium text-chart-1">{team.name}</TableCell>
                  <TableCell className="text-chart-2 font-bold">
                    ₹{team.cash.toFixed(2)}
                  </TableCell>
                  <TableCell>{team.portfolio.length} stocks</TableCell>
                  <TableCell className="text-chart-1 font-bold">
                    ₹{team.totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedTeam([name, team])}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        View Portfolio
                      </Button>
                      {editingTeam?.team === name ? (
                        <>
                          <Input
                            value={editingTeam.newName}
                            onChange={(e) => setEditingTeam((p) => p ? { ...p, newName: e.target.value } : null)}
                            placeholder="Team name"
                            className="w-32"
                          />
                          <Input
                            type="password"
                            value={editingTeam.newPassword}
                            onChange={(e) => setEditingTeam((p) => p ? { ...p, newPassword: e.target.value } : null)}
                            placeholder="New password (blank = keep)"
                            className="w-36"
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateTeam}
                            disabled={updateTeam.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTeam(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTeam({ team: name, newName: name, newPassword: '' })}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteTeam(name)}
                            disabled={deleteTeam.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                          {cashAdjustment?.team === name ? (
                        <>
                          <Input
                            type="number"
                            value={cashAdjustment.amount}
                            onChange={(e) => setCashAdjustment({ team: name, amount: e.target.value })}
                            placeholder="Amount (+/-)"
                            className="w-32"
                            step="0.01"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCash(name)}
                            disabled={updateCash.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCashAdjustment(null)}
                          >
                            Cancel
                          </Button>
                        </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCashAdjustment({ team: name, amount: '0' })}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Adjust Cash
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No teams created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Portfolio Modal */}
      {selectedTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedTeam(null)}
        >
          <Card
            className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-chart-3" />
                Portfolio: {selectedTeam[1].name}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTeam(null)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-gradient-to-br from-chart-3/20 to-chart-3/5 rounded-lg border border-chart-3/30">
                  <div className="text-sm text-muted-foreground mb-1">Cash Balance</div>
                  <div className="text-xl font-bold text-chart-3">₹{selectedTeam[1].cash.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-chart-1/20 to-chart-1/5 rounded-lg border border-chart-1/30">
                  <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
                  <div className="text-xl font-bold text-chart-1">
                    ₹{selectedTeam[1].portfolio.reduce((t, [sn, q]) => t + getStockPrice(sn) * Number(q), 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-chart-2/20 to-chart-2/5 rounded-lg border border-chart-2/30">
                  <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                  <div className="text-xl font-bold text-chart-2">₹{selectedTeam[1].totalValue.toFixed(2)}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Stocks Owned</h3>
                {selectedTeam[1].portfolio.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeam[1].portfolio.map(([stockName, quantity]) => {
                      const price = getStockPrice(stockName);
                      const value = price * Number(quantity);
                      return (
                        <div key={stockName} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                          <div>
                            <span className="font-semibold">{stockName}</span>
                            <span className="text-muted-foreground ml-2">{quantity.toString()} shares</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">@ ₹{price.toFixed(2)}</div>
                            <div className="font-bold text-chart-1">₹{value.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-6">No stocks owned yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
