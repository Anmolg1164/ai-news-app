
"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles, Globe, Languages, Volume2 } from "lucide-react";
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
    <div ref={cardRef} className="h-full">
      <Card className="border-none glass h-full flex flex-col overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-[2rem] group/card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-white bg-primary px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                {brief.category}
              </span>
              {isTranslating && (
                <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-[8px] font-bold text-accent animate-pulse">
                  <Languages size={10} /> {language.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-tighter">
              <Calendar size={12} />
              {brief.publishedAt || "Live"}
            </div>
          </div>
          <CardTitle className="text-base font-headline text-primary font-bold tracking-tight leading-tight group-hover/card:text-secondary transition-colors duration-500 line-clamp-2">
            {currentTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-1 flex-1">
          <div className="relative h-full min-h-[60px]">
            <div className={cn("transition-all duration-700 h-full", showAlt ? "opacity-20 blur-md scale-95" : "opacity-100")}>
              <p className="text-primary/70 leading-snug text-[13px] font-medium line-clamp-3">
                {currentContent}
              </p>
            </div>

            {showAlt && (
              <div className="absolute inset-0 bg-white/5 rounded-2xl p-0.5 animate-in fade-in zoom-in duration-500 overflow-hidden">
                <div className="h-full border border-dashed border-secondary/40 rounded-[1.5rem] p-3 bg-secondary/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-secondary" size={12} />
                    <h4 className="text-[9px] font-bold text-primary uppercase tracking-widest">Pivot</h4>
                  </div>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 size={16} className="animate-spin text-secondary" />
                    </div>
                  ) : (
                    <p className="text-primary/90 text-[11px] leading-tight italic font-medium line-clamp-4">
                      "{altData?.altSummary}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center px-4 py-3 border-t border-primary/5 bg-white/10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggle}
            className={cn("gap-1.5 h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-all", showAlt ? 'bg-secondary text-primary shadow-md' : 'text-primary/40 hover:bg-primary/5 hover:text-primary')}
          >
            <ArrowLeftRight size={12} />
            {showAlt ? "Back" : "Pivot"}
          </Button>
          {brief.url && brief.url.startsWith('http') && (
            <a 
              href={brief.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group/link flex items-center gap-1.5 text-[9px] font-bold text-primary/40 hover:text-accent uppercase tracking-widest transition-all"
            >
              Full Coverage <ExternalLink size={10} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-0.5 transition-transform" />
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
        description: "Quota limit reached. Try again soon.",
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
      
      <div className="flex flex-row items-center justify-between gap-4 px-4 py-3 flex-shrink-0 bg-background/40 backdrop-blur-xl z-20 border-b border-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Globe size={16} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold text-primary tracking-tight">
              {searchQuery ? `"${searchQuery}"` : `${category} Feed`}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1 w-1 rounded-full", isPlaying ? "bg-accent animate-ping" : "bg-secondary animate-pulse")} />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {isPlaying ? "AI Reading" : country}
              </span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSummarizeAndAnnounce}
          disabled={isSummarizing || isPlaying || loading}
          size="sm"
          className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 active:scale-95 transition-all gap-1.5 h-8 px-4 shadow-lg shadow-primary/10"
        >
          {isSummarizing ? (
            <Loader2 className="animate-spin" size={14} />
          ) : isPlaying ? (
            <Volume2 className="animate-pulse" size={14} />
          ) : (
            <Sparkles size={14} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {isSummarizing ? "Synthesizing" : isPlaying ? "Reading" : "AI Insights"}
          </span>
        </Button>
      </div>
      
      <div 
        ref={ref}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-4 pb-32"
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-[2rem] glass" />
            ))}
          </div>
        ) : briefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefs.map((brief, index) => {
              const isLast = briefs.length === index + 1;
              return (
                <div ref={isLast ? lastElementRef : undefined} key={brief.id}>
                  <NewsBriefCard brief={brief} language={language} index={index} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 glass rounded-[2rem] text-center space-y-3">
            <div className="p-3 bg-primary/5 rounded-full">
              <Newspaper className="text-primary/20" size={32} />
            </div>
            <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px]">No headlines found</p>
            <Button variant="outline" size="sm" onClick={() => fetchLiveNews(true)} className="rounded-lg h-8 text-xs">Refresh</Button>
          </div>
        )}

        {loadingMore && (
          <div className="flex flex-col items-center justify-center p-6 gap-2">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        )}
      </div>
    </div>
  );
});

NewsBriefs.displayName = "NewsBriefs";
