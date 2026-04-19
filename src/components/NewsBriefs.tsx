"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles, Globe, Languages, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";
import { translateNews, type TranslateNewsOutput } from "@/ai/flows/translate-news";
import { searchNews as searchNewsTool } from "@/ai/flows/get-journey-intelligence";
import { useToast } from "@/hooks/use-toast";

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

  // Intersection Observer to detect when the card is "seen"
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
    
    // Add a small jittered delay even for lazy loading to prevent bursts
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800));

    try {
      const result = await translateNews({
        title: brief.title,
        content: brief.content,
        targetLanguage: targetLang
      });
      translationCache.current[cacheKey] = result;
      setTranslatedData(result);
    } catch (error: any) {
      console.error("Translation failed:", error);
      setHasError(true);
      // Only toast once for errors to avoid noise
      if (index === 0) {
        toast({
          variant: "destructive",
          title: "Translation Service Busy",
          description: "The AI agent is handling many requests. Click retry if needed.",
        });
      }
    } finally {
      setIsTranslating(false);
    }
  }, [brief.id, brief.title, brief.content, index, toast]);

  // Only trigger translation if language is NOT English AND the card is visible to the user
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
          title: "Perspective Switch Busy",
          description: "The AI is at its limit. Please try again in a moment.",
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
      <Card className="border-none glass overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-secondary-foreground bg-secondary/30 px-2 py-1 rounded-md uppercase tracking-wider">
                {brief.category}
              </span>
              {isTranslating && (
                <span className="flex items-center gap-1 text-[8px] font-bold text-primary/40 uppercase animate-pulse">
                  <Languages size={10} /> {language}...
                </span>
              )}
              {hasError && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTranslation(language)}
                  className="h-5 px-1 text-[8px] text-destructive hover:text-destructive flex items-center gap-1"
                >
                  <RefreshCw size={8} /> Retry
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Calendar size={12} />
              {brief.publishedAt || "Recently"}
            </div>
          </div>
          <CardTitle className="text-xl font-headline text-primary font-bold tracking-tight">
            {currentTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="relative">
            <div className={`transition-all duration-500 ${showAlt ? "opacity-30 blur-[1px]" : "opacity-100"}`}>
              <p className="text-primary/70 leading-relaxed text-sm">
                {currentContent}
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
          {brief.url && brief.url.startsWith('http') && (
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
    </div>
  );
}

interface NewsBriefsProps {
  category: string;
  searchQuery?: string;
  country: string;
  language: string;
  onIntelligenceClick?: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const NewsBriefs = forwardRef<HTMLDivElement, NewsBriefsProps>(({ 
  category, 
  searchQuery, 
  country, 
  language, 
  onIntelligenceClick,
  onScroll 
}, ref) => {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
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
        title: r.title || "Headline",
        content: r.description || "Latest update available.",
        url: r.link,
        category: searchQuery ? "Search" : category,
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
      toast({
        variant: "destructive",
        title: "News Service Busy",
        description: "Could not fetch latest updates. Please try again shortly.",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, country, searchQuery, nextPage, toast]);

  useEffect(() => {
    fetchLiveNews(true);
  }, [category, country, searchQuery]);

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
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between gap-3 px-2 py-4 flex-shrink-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Globe className="text-primary/40" size={24} />
          <h2 className="text-3xl font-headline font-bold text-primary tracking-tighter">
            {searchQuery ? `Results for "${searchQuery}"` : `${category} Briefings`}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">
            {country} ({language}) Feed
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
      
      <div 
        ref={ref}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6 pb-40"
      >
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl glass" />
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
});

NewsBriefs.displayName = "NewsBriefs";
