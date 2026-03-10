import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { News } from '../../backend/types';
import { Newspaper } from 'lucide-react';

interface TeamNewsProps {
  news: News | null | undefined;
}

export default function TeamNews({ news }: TeamNewsProps) {
  if (!news) return null;

  const descriptionLines = news.description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Card className="bg-black/90 border-2 border-red-700/70 shadow-[0_0_40px_rgba(248,113,113,0.4)] overflow-hidden font-sans rounded-lg">
      <div className="bg-black px-4 py-2 border-b-2 border-red-700 flex-shrink-0">
        <CardHeader className="p-0">
          <CardTitle className="text-red-500 font-display font-extrabold text-xl flex items-center gap-2 tracking-widest uppercase">
            <Newspaper className="w-5 h-5 text-red-400" />
            Today&apos;s News
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="p-4 bg-gradient-to-b from-black via-black to-zinc-950">
        <ul className="space-y-2 list-disc list-inside text-red-400 font-display font-bold text-lg tracking-wide marker:text-red-500">
          <li className="text-red-400">{news.headline}</li>
          {descriptionLines.map((line, i) => (
            <li key={i} className="text-red-300 font-sans font-medium text-base pl-1">
              {line}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
