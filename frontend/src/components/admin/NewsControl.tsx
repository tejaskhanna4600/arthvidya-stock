import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllNews, useAddNews, useFlashNews } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Newspaper, Zap } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { AdminUndoButton } from './AdminUndoButton';

export default function NewsControl() {
  const { data: allNews = [] } = useGetAllNews();
  const addNews = useAddNews();
  const flashNews = useFlashNews();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  const playNewsAlert = () => {
    if (audioRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5kdfy0HotBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/y24k2CBdmvOznnUoMDlCn4/C2YxwFOZHX8tB6LQUidb/v4JRCCxJcr+jrq1gVCEOc3fLBbiQFLoTP8tuJNggXZrzs551KDA5Qp+PwtmMcBTmR1/LQei0FInW/7+CUQg==';
      audioRef.current.play().catch(() => {});
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!headline.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await addNews.mutateAsync({ headline, description });
      toast.success('News added successfully');
      setHeadline('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to add news');
    }
  };

  const handleFlashNews = async (newsId: number) => {
    try {
      await flashNews.mutateAsync(newsId);
      playNewsAlert();
      toast.success('News flashed to screen!');
    } catch (error) {
      toast.error('Failed to flash news');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Add News
          </CardTitle>
          <AdminUndoButton />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNews} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Breaking news headline..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="News details..."
                rows={3}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={addNews.isPending}>
              {addNews.isPending ? 'Adding...' : 'Add News'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All News</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allNews.map(([id, news]) => (
                <TableRow key={id.toString()}>
                  <TableCell className="font-medium">{news.headline}</TableCell>
                  <TableCell className="max-w-md truncate">{news.description}</TableCell>
                  <TableCell>
                    {news.isFlashed ? (
                      <span className="text-chart-1 font-semibold">Flashed</span>
                    ) : (
                      <span className="text-muted-foreground">Not flashed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleFlashNews(id)}
                      disabled={flashNews.isPending}
                      className="bg-chart-1 hover:bg-chart-1/90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Flash News
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {allNews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No news added yet
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
