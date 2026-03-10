import { Button } from '@/components/ui/button';
import { useAdminUndo } from '../../hooks/useQueries';
import { toast } from 'sonner';

export function AdminUndoButton() {
  const adminUndo = useAdminUndo();

  const handleClick = async () => {
    try {
      await adminUndo.mutateAsync();
      toast.success('Reverted last stock/news change');
    } catch (error: any) {
      const message = error?.message || 'Nothing to undo';
      toast.error(message);
    }
  };

  return (
    <Button size="sm" variant="outline" disabled={adminUndo.isPending} onClick={handleClick}>
      Undo last change
    </Button>
  );
}

