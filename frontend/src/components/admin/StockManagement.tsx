import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllStocks, useCreateStock, useUpdateStockPrice, useUpdateStockMeta, useBatchUpdateStockPrices } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Plus, Edit2 } from 'lucide-react';
import { AdminUndoButton } from './AdminUndoButton';

export default function StockManagement() {
  const { data: stocks = [] } = useGetAllStocks();
  const createStock = useCreateStock();
  const updatePrice = useUpdateStockPrice();
  const updateMeta = useUpdateStockMeta();
  const batchUpdate = useBatchUpdateStockPrices();

  const [newStockName, setNewStockName] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('3000');
  const [newStockIndustry, setNewStockIndustry] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [priceEditMode, setPriceEditMode] = useState<'absolute' | 'percent'>('absolute');
  const [pendingPrices, setPendingPrices] = useState<Record<string, number>>({});

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newStockPrice);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid positive price');
      return;
    }

    try {
      await createStock.mutateAsync({ name: newStockName, initialPrice: price, industry: newStockIndustry || undefined });
      toast.success('Stock created successfully');
      setNewStockName('');
      setNewStockPrice('3000');
      setNewStockIndustry('');
    } catch (error) {
      toast.error('Failed to create stock');
    }
  };

  const handleUpdatePrice = async (stockName: string) => {
    const currentStock = stocks.find(([n]) => n === stockName)?.[1];
    const currentPrice = currentStock?.price ?? 0;

    let newPrice: number;
    if (priceEditMode === 'absolute') {
      const price = parseFloat(editPrice);
      if (isNaN(price) || price <= 0) {
        toast.error('Invalid price');
        return;
      }
      newPrice = price;
    } else {
      const percent = parseFloat(editPrice);
      if (isNaN(percent)) {
        toast.error('Invalid percentage');
        return;
      }
      newPrice = currentPrice * (1 + percent / 100);
      if (newPrice <= 0) {
        toast.error('Resulting price would be zero or negative');
        return;
      }
    }

    // Stage the change locally; apply later in one batch.
    setPendingPrices((prev) => ({ ...prev, [stockName]: newPrice }));
    toast.success(
      priceEditMode === 'percent'
        ? `Staged: ${stockName} price change by ${editPrice}%. Click "Apply price changes" to update.`
        : `Staged: ${stockName} new price ₹${newPrice.toFixed(2)}. Click "Apply price changes" to update.`,
    );
    setEditingStock(null);
    setEditPrice('');
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="border-chart-1/20 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display font-bold text-chart-1">
            <Plus className="w-5 h-5" />
            Create New Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStock} className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockName">Stock Name</Label>
              <Input
                id="stockName"
                value={newStockName}
                onChange={(e) => setNewStockName(e.target.value)}
                placeholder="e.g., RELIANCE"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockIndustry">Industry</Label>
              <Input
                id="stockIndustry"
                value={newStockIndustry}
                onChange={(e) => setNewStockIndustry(e.target.value)}
                placeholder="e.g., Technology, Banking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockPrice">Initial Price (₹)</Label>
              <Input
                id="stockPrice"
                type="number"
                value={newStockPrice}
                onChange={(e) => setNewStockPrice(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={createStock.isPending}>
                {createStock.isPending ? 'Creating...' : 'Create Stock'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-chart-1/20 bg-card/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="font-display font-bold text-chart-1">All Stocks</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <AdminUndoButton />
            <Button
              size="sm"
              disabled={Object.keys(pendingPrices).length === 0 || batchUpdate.isPending}
              onClick={async () => {
                const updates = Object.entries(pendingPrices).map(([name, newPrice]) => ({
                  name,
                  newPrice,
                }));
                if (updates.length === 0) return;
                try {
                  await batchUpdate.mutateAsync({ updates });
                  toast.success('Applied all staged price changes');
                  setPendingPrices({});
                } catch (error: any) {
                  toast.error(error?.message || 'Failed to apply price changes');
                }
              }}
            >
              {batchUpdate.isPending
                ? 'Applying...'
                : `Apply price changes${Object.keys(pendingPrices).length ? ` (${Object.keys(pendingPrices).length})` : ''}`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-chart-1/20">
                <TableHead className="font-mono font-semibold">Stock Name</TableHead>
                <TableHead className="font-mono font-semibold">Industry</TableHead>
                <TableHead className="font-mono font-semibold">Current Price</TableHead>
                <TableHead className="font-mono font-semibold">Price History</TableHead>
                <TableHead className="font-mono font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map(([name, stock]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium">
                    {stock.name}
                    {pendingPrices[name] !== undefined && (
                      <span className="ml-2 text-xs text-amber-400 font-mono">
                        → ₹{pendingPrices[name].toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.industry || '-'}</TableCell>
                  <TableCell className="text-chart-1 font-bold">
                    ₹{stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {stock.priceHistory.length} records
                  </TableCell>
                  <TableCell>
                    {editingStock === name ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-md border border-border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setPriceEditMode('absolute')}
                            className={`px-3 py-1.5 text-xs font-medium ${priceEditMode === 'absolute' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            ₹ Price
                          </button>
                          <button
                            type="button"
                            onClick={() => setPriceEditMode('percent')}
                            className={`px-3 py-1.5 text-xs font-medium ${priceEditMode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            % Change
                          </button>
                        </div>
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder={priceEditMode === 'absolute' ? 'New price' : 'e.g. 5 or -3'}
                          className="w-28"
                          step={priceEditMode === 'absolute' ? '0.01' : '0.1'}
                        />
                        {priceEditMode === 'percent' && (
                          <span className="text-xs text-muted-foreground">%</span>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePrice(name)}
                          disabled={updatePrice.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStock(null);
                            setEditPrice('');
                            setPriceEditMode('absolute');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStock(name);
                            setEditPrice(stock.price.toString());
                            setPriceEditMode('absolute');
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Price
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const currentName = stock.name;
                            const currentIndustry = stock.industry || '';
                            const enteredName = window.prompt(
                              'New stock symbol (leave blank to keep same):',
                              currentName,
                            );
                            if (enteredName === null) return;
                            const enteredIndustry = window.prompt(
                              'Industry (optional):',
                              currentIndustry,
                            );
                            if (enteredIndustry === null) return;

                            const newName = enteredName.trim();
                            const newIndustry = enteredIndustry.trim();

                            if (!newName && !newIndustry && currentIndustry === '') return;

                            try {
                              await updateMeta.mutateAsync({
                                name,
                                newName: newName && newName !== currentName ? newName : undefined,
                                industry:
                                  newIndustry !== currentIndustry ? newIndustry : currentIndustry,
                              });
                              toast.success('Stock details updated');
                            } catch (error: any) {
                              toast.error(error?.message || 'Failed to update stock');
                            }
                          }}
                        >
                          Edit Name / Industry
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {stocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No stocks created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
