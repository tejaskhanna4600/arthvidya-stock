import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper } from 'lucide-react';
import type { News } from '../../backend/types';

interface NewsFlashedDetailProps {
  flashedNews: Array<[number, News]>;
}

export default function NewsFlashedDetail({ flashedNews }: NewsFlashedDetailProps) {
  return (
    <Card className="bg-black/90 border-2 border-red-700/70 shadow-[0_0_40px_rgba(248,113,113,0.4)] overflow-hidden font-sans h-full flex flex-col min-h-0 rounded-lg">
      <div className="bg-black px-4 py-2 border-b-2 border-red-700 flex-shrink-0">
        <CardHeader className="p-0">
          <CardTitle className="text-red-500 font-display font-extrabold text-4xl flex items-center gap-2 tracking-widest uppercase">
            <Newspaper className="w-7 h-7 text-red-400" />
            Today&apos;s News
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="p-4 space-y-4 bg-gradient-to-b from-black via-black to-zinc-950 flex-1 min-h-0 overflow-auto">
        {flashedNews.length === 0 ? (
          <p className="text-red-500/80 text-2xl italic font-sans tracking-wide">
            No headlines yet. Breaking news will appear here.
          </p>
        ) : (
          flashedNews.map(([id, news]) => (
            <article
              key={id}
              className="py-5 border-b border-red-800/60 last:border-0 space-y-2"
            >
              <h3 className="font-display font-extrabold text-red-400 text-3xl leading-tight tracking-widest uppercase">
                {news.headline}
              </h3>
              <p className="text-red-300 text-2xl leading-relaxed whitespace-pre-wrap font-sans tracking-wide">
                {news.description}
              </p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
