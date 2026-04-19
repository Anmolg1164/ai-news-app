
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";
import { searchNews as searchNewsTool } from "@/ai/flows/get-journey-intelligence";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  url?: string;
}

function NewsBriefCard({ brief }: { brief: NewsBrief }) {
  const [showAlt, setShowAlt] = useState(false);
  const [altData, setAltData] = useState<AlternativePerspectiveOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!showAlt && !altData) {
      setIsLoading(true);
      try {
        const result = await getAlternativePerspective({
          category: brief.category,
          originalSummary: brief.content,
          currentRegion: "Local"
        });
        setAltData(result);
      } catch (error) {
        console.error("Alternative perspective failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setShowAlt(!showAlt);
  };

  return (
    <Card className="border-none glass overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-secondary-foreground bg-secondary/30 px-2 py-1 rounded-md uppercase tracking-wider">
            {brief.category}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Calendar size={12} />
            {brief.publishedAt || "Recently"}
          </div>
        </div>
        <CardTitle className="text-xl font-headline text-primary font-bold tracking-tight">
          {brief.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <div className={`transition-all duration-500 ${showAlt ? "opacity-30 blur-[1px]" : "opacity-100"}`}>
            <p className="text-primary/70 leading-relaxed text-sm">
              {brief.content}
            </p>
          </div>

          {showAlt && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl p-1 animate-in fade-in duration-500">
              <div className="h-full border-2 border-dashed border-secondary/30 rounded-lg p-4 bg-secondary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-secondary" size={16} />
                  <h4 className="text-sm font-bold text-primary uppercase tracking-tighter">Alternative Viewpoint</h4>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-primary/60 text-sm animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Searching diverse sources...
                  </div>
                ) : (
                  <p className="text-primary/80 text-sm leading-relaxed italic">
                    {altData?.altSummary}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-0 border-t border-primary/5 mt-2 pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggle}
          className={`gap-2 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors ${showAlt ? 'text-secondary' : 'text-primary/60 hover:text-primary'}`}
        >
          <ArrowLeftRight size={14} />
          {showAlt ? "Original Feed" : "Perspective Switch"}
        </Button>
        {brief.url && ( brief.url.startsWith('http') ) && (
          <a 
            href={brief.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-bold text-primary/40 hover:text-secondary uppercase tracking-widest transition-colors"
          >
            Full Coverage <ExternalLink size={12} />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

interface NewsBriefsProps {
  category: string;
  country: string;
  onIntelligenceClick?: () => void;
}

export function NewsBriefs({ category, country, onIntelligenceClick }: NewsBriefsProps) {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchLiveNews = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const query = `${category} news in ${country}`;
      const rawResults = await searchNewsTool({ 
        query, 
        page: isInitial ? undefined : nextPage || undefined 
      });
      
      const parsed = JSON.parse(rawResults);
      if (parsed.error) throw new Error(parsed.error);

      const newBriefs = (parsed.results || []).map((r: any, idx: number) => ({
        id: `news-${isInitial ? '' : briefs.length}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        title: r.title || "Headline",
        content: r.description || "Latest update available.",
        url: r.link,
        category: category,
        publishedAt: r.pubDate ? new Date(r.pubDate).toLocaleDateString() : new Date().toLocaleDateString()
      }));

      if (isInitial) {
        setBriefs(newBriefs);
      } else {
        setBriefs(prev => [...prev, ...newBriefs]);
      }
      setNextPage(parsed.nextPage);
    } catch (error) {
      console.error("Live news fetch failed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, country, nextPage, briefs.length]);

  useEffect(() => {
    fetchLiveNews(true);
  }, [category, country]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPage) {
        fetchLiveNews(false);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, nextPage, fetchLiveNews]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl glass" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <Globe className="text-primary/40" size={24} />
          <h2 className="text-3xl font-headline font-bold text-primary tracking-tighter">
            {category} Briefings
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">
            {country} Feed
          </span>
          <Button 
            onClick={onIntelligenceClick} 
            variant="outline" 
            size="sm"
            className="rounded-full border-secondary/30 text-primary hover:bg-secondary/10 gap-2 h-8 px-4"
          >
            <Sparkles className="text-secondary" size={14} />
            <span className="text-xs font-bold uppercase">AI Insights</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {briefs.length > 0 ? (
          briefs.map((brief, index) => {
            if (briefs.length === index + 1) {
              return (
                <div ref={lastElementRef} key={brief.id}>
                  <NewsBriefCard brief={brief} />
                </div>
              );
            } else {
              return <NewsBriefCard key={brief.id} brief={brief} />;
            }
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center space-y-4">
            <Newspaper className="text-primary/20" size={48} />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No active headlines for this selection</p>
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
      </div>
    </div>
  );
}
