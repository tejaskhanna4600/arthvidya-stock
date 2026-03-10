import { useEffect, useState } from 'react';
import { News } from '../../backend/types';
import { Newspaper } from 'lucide-react';

interface NewsFlashProps {
  news: News | null | undefined;
}

export default function NewsFlash({ news }: NewsFlashProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (news?.isFlashed) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [news?.isFlashed, news?.headline]);

  if (!show || !news) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 animate-in slide-in-from-top duration-500">
      <div className="container mx-auto px-6">
        <div className="bg-amber-50/98 border-2 border-amber-600/80 shadow-2xl font-sans overflow-hidden rounded-lg ring-2 ring-amber-400/30">
          <div className="bg-amber-700 text-amber-50 px-5 py-3 flex items-center gap-2 font-display font-bold">
            <Newspaper className="w-8 h-8 text-amber-200" />
            <span className="text-base tracking-widest uppercase">Breaking News</span>
            <span className="ml-2 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          </div>
          <div className="p-5 bg-[#faf6ed]">
            <h2 className="font-display font-bold text-amber-950 text-3xl">{news.headline}</h2>
            <p className="text-amber-900/85 text-xl mt-3 font-sans">{news.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
