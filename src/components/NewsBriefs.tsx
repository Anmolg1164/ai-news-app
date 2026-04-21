"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles, Globe, Languages, RefreshCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";
import { translateNews, type TranslateNewsOutput } from "@/ai/flows/translate-news";
import { searchNews as searchNewsTool } from "@/ai/flows/get-journey-intelligence";
import { summarizeNewsBatch } from "@/ai/flows/summarize-news-batch";
import { textToSpeech } from "@/ai/flows/tts-flow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  url?: string;
}

function NewsBriefCard({ brief, language, index }: { brief: NewsBrief, language: string, index: number }) {
  const [showAlt, setShowAlt] = useState(false);
  const [altData, setAltData] = useState<AlternativePerspectiveOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const [translatedData, setTranslatedData] = useState<TranslateNewsOutput | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const translationCache = useRef<Record<string, TranslateNewsOutput>>({});
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleTranslation = useCallback(async (targetLang: string) => {
    if (targetLang === "English") {
      setTranslatedData(null);
      setHasError(false);
      return;
    }

    const cacheKey = `${brief.id}-${targetLang}`;
    if (translationCache.current[cacheKey]) {
      setTranslatedData(translationCache.current[cacheKey]);
      setHasError(false);
      return;
    }

    setIsTranslating(true);
    setHasError(false);
    
    try {
      const result = await translateNews({
        title: brief.title,
        content: brief.content,
        targetLanguage: targetLang
      });
      translationCache.current[cacheKey] = result;
      setTranslatedData(result);
    } catch (error: any) {
      setHasError(true);
    } finally {
      setIsTranslating(false);
    }
  }, [brief.id, brief.title, brief.content]);

  useEffect(() => {
    if (isVisible && language !== "English" && !translatedData && !isTranslating) {
      handleTranslation(language);
    }
  }, [isVisible, language, translatedData, isTranslating, handleTranslation]);

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
        toast({
          variant: "destructive",
          title: "Perspective Busy",
          description: "Searching global sources... try again soon.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    setShowAlt(!showAlt);
  };

  const currentTitle = translatedData?.translatedTitle || brief.title;
  const currentContent = translatedData?.translatedContent || brief.content;

  return (
    <div ref={cardRef}>
      <Card className="border-none glass overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 rounded-[2.5rem] group/card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white bg-primary px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                {brief.category}
              </span>
              {isTranslating && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full text-[10px] font-bold text-accent animate-pulse">
                  <Languages size={12} /> {language.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-bold uppercase tracking-tighter">
              <Calendar size={14} />
              {brief.publishedAt || "Live Now"}
            </div>
          </div>
          <CardTitle className="text-2xl font-headline text-primary font-bold tracking-tighter leading-tight group-hover/card:text-secondary transition-colors duration-500">
            {currentTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="relative">
            <div className={cn("transition-all duration-700", showAlt ? "opacity-20 blur-md scale-95" : "opacity-100")}>
              <p className="text-primary/70 leading-relaxed text-base font-medium">
                {currentContent}
              </p>
            </div>

            {showAlt && (
              <div className="absolute inset-0 bg-white/5 rounded-3xl p-1 animate-in fade-in zoom-in duration-500">
                <div className="h-full border-2 border-dashed border-secondary/40 rounded-[2rem] p-6 bg-secondary/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary/20 rounded-xl">
                      <Sparkles className="text-secondary" size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Global Pivot</h4>
                  </div>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-24 gap-4">
                      <Loader2 size={24} className="animate-spin text-secondary" />
                    </div>
                  ) : (
                    <p className="text-primary/90 text-sm leading-relaxed italic font-medium">
                      "{altData?.altSummary}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-6 border-t border-primary/5 mx-6 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggle}
            className={cn("gap-3 h-10 px-6 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all", showAlt ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' : 'text-primary/40 hover:bg-primary/5 hover:text-primary')}
          >
            <ArrowLeftRight size={16} />
            {showAlt ? "Original" : "Pivot View"}
          </Button>
          {brief.url && brief.url.startsWith('http') && (
            <a 
              href={brief.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group/link flex items-center gap-2 text-xs font-bold text-primary/40 hover:text-accent uppercase tracking-widest transition-all"
            >
              Coverage <ExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
            </a>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

interface NewsBriefsProps {
  category: string;
  searchQuery?: string;
  country: string;
  language: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const NewsBriefs = forwardRef<HTMLDivElement, NewsBriefsProps>(({ 
  category, 
  searchQuery, 
  country, 
  language, 
  onScroll 
}, ref) => {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const fetchLiveNews = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const query = searchQuery 
        ? `${searchQuery}` 
        : `${category} news in ${country}`;
        
      const rawResults = await searchNewsTool({ 
        query, 
        page: isInitial ? undefined : nextPage || undefined 
      });
      
      const parsed = JSON.parse(rawResults);
      if (parsed.error) throw new Error(parsed.error);

      const newBriefs = (parsed.results || []).map((r: any, idx: number) => ({
        id: `news-${isInitial ? 'init' : 'more'}-${idx}-${Date.now()}`,
        title: r.title || "Latest Headline",
        content: r.description || r.content || "Context loading from sources...",
        url: r.link,
        category: searchQuery ? "Discovery" : category,
        publishedAt: r.pubDate ? new Date(r.pubDate).toLocaleDateString() : "Just Now"
      }));

      if (isInitial) {
        setBriefs(newBriefs);
      } else {
        setBriefs(prev => [...prev, ...newBriefs]);
      }
      setNextPage(parsed.nextPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Feed Offline",
        description: "News sources are a bit overwhelmed.",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, country, searchQuery, nextPage, toast]);

  useEffect(() => {
    fetchLiveNews(true);
  }, [category, country, searchQuery]);

  const handleSummarizeAndAnnounce = async () => {
    if (briefs.length === 0 || isSummarizing || isPlaying) return;
    
    setIsSummarizing(true);
    try {
      const topArticles = briefs.slice(0, 10).map(b => ({ title: b.title, content: b.content }));
      const { summary } = await summarizeNewsBatch({ articles: topArticles });
      
      const { media } = await textToSpeech(summary);
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
        setIsPlaying(true);
        toast({
          title: "Briefing Started",
          description: "Reading top 10 headlines aloud.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Briefing Failed",
        description: "AI summarized logic reached its limit. Try again soon.",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

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

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 py-8 flex-shrink-0 bg-background/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Globe size={28} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-4xl font-headline font-bold text-primary tracking-tighter">
              {searchQuery ? `"${searchQuery}"` : `${category} Feed`}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={cn("h-2 w-2 rounded-full", isPlaying ? "bg-accent animate-ping" : "bg-secondary animate-pulse")} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {isPlaying ? "AI is Reading Briefing" : `Live Updates for ${country}`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleSummarizeAndAnnounce}
            disabled={isSummarizing || isPlaying || loading}
            className="rounded-2xl bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 active:scale-95 transition-all gap-3 h-14 px-8 shadow-xl shadow-primary/20"
          >
            {isSummarizing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isPlaying ? (
              <Volume2 className="animate-pulse" size={20} />
            ) : (
              <Sparkles size={20} />
            )}
            <span className="text-sm font-bold uppercase tracking-tight">
              {isSummarizing ? "Synthesizing..." : isPlaying ? "Reading..." : "AI Insights"}
            </span>
          </Button>
        </div>
      </div>
      
      <div 
        ref={ref}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-10 pb-48 pt-4"
      >
        {loading ? (
          <div className="space-y-10">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] glass" />
            ))}
          </div>
        ) : briefs.length > 0 ? (
          briefs.map((brief, index) => {
            const isLast = briefs.length === index + 1;
            return (
              <div ref={isLast ? lastElementRef : undefined} key={brief.id}>
                <NewsBriefCard brief={brief} language={language} index={index} />
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-20 glass rounded-[3rem] text-center space-y-6">
            <div className="p-6 bg-primary/5 rounded-full">
              <Newspaper className="text-primary/20" size={64} />
            </div>
            <p className="text-primary/40 font-bold uppercase tracking-[0.4em] text-sm">Quiet moment in the world</p>
            <Button variant="outline" onClick={() => fetchLiveNews(true)} className="rounded-xl">Refresh Feed</Button>
          </div>
        )}

        {loadingMore && (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        )}
      </div>
    </div>
  );
});

NewsBriefs.displayName = "NewsBriefs";
