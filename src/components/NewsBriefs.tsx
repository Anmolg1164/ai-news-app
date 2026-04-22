"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink, ShieldCheck, Loader2, Sparkles, Globe, Volume2, Bookmark, BookmarkCheck, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyNews, type VerifyNewsOutput } from "@/ai/flows/verify-news";
import { translateNews, type TranslateNewsOutput } from "@/ai/flows/translate-news";
import { searchNews as searchNewsTool } from "@/ai/flows/get-journey-intelligence";
import { summarizeNewsBatch } from "@/ai/flows/summarize-news-batch";
import { textToSpeech } from "@/ai/flows/tts-flow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  url?: string;
}

function NewsBriefCard({ 
  brief, 
  language, 
  onSave, 
  isSaved 
}: { 
  brief: NewsBrief, 
  language: string, 
  onSave: (brief: NewsBrief) => void,
  isSaved: boolean
}) {
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyNewsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [translatedData, setTranslatedData] = useState<TranslateNewsOutput | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const translationCache = useRef<Record<string, TranslateNewsOutput>>({});
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTranslation = useCallback(async (targetLang: string) => {
    if (targetLang === "English") {
      setTranslatedData(null);
      return;
    }
    const cacheKey = `${brief.id}-${targetLang}`;
    if (translationCache.current[cacheKey]) {
      setTranslatedData(translationCache.current[cacheKey]);
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateNews({
        title: brief.title,
        content: brief.content,
        targetLanguage: targetLang
      });
      translationCache.current[cacheKey] = result;
      setTranslatedData(result);
    } catch (error: any) {
      console.warn("Lazy translation skipped");
    } finally {
      setIsTranslating(false);
    }
  }, [brief.id, brief.title, brief.content]);

  useEffect(() => {
    if (isVisible && language !== "English" && !translatedData && !isTranslating) {
      const timer = setTimeout(() => handleTranslation(language), 1500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, language, translatedData, isTranslating, handleTranslation]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleGlobalStop = () => stopAudio();
    window.addEventListener('stop-all-audio', handleGlobalStop);
    return () => window.removeEventListener('stop-all-audio', handleGlobalStop);
  }, []);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }

    setIsPlaying(true);
    const textToRead = translatedData?.translatedContent || brief.content;

    try {
      const { media } = await textToSpeech({
        text: textToRead,
        voice: 'Charon',
        style: 'analytical'
      });
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
      }
    } catch (error) {
      setIsPlaying(false);
      toast({ variant: "destructive", title: "Audio Error", description: "Gemini voice is busy." });
    }
  };

  const handleVerify = async () => {
    if (!showVerify && !verifyData) {
      setIsLoading(true);
      try {
        const result = await verifyNews({ headline: brief.title });
        setVerifyData(result);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Verification Failed", description: "AI reached its limit. Try again soon." });
      } finally {
        setIsLoading(false);
      }
    }
    setShowVerify(!showVerify);
  };

  const currentTitle = translatedData?.translatedTitle || brief.title;
  const currentContent = translatedData?.translatedContent || brief.content;

  return (
    <div ref={cardRef} className="h-full relative">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      <Card className="border-none glass h-full flex flex-col overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-[2rem] group/card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-white bg-primary px-2 py-1 rounded-full uppercase tracking-widest">
                {brief.category}
              </span>
              {isTranslating && <Loader2 size={10} className="animate-spin text-accent" />}
            </div>
            <div className="flex items-center gap-2">
               <button 
                onClick={() => onSave(brief)}
                className={cn("transition-all hover:scale-110", isSaved ? "text-accent" : "text-muted-foreground/40 hover:text-accent")}
              >
                {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
          </div>
          <CardTitle className="text-base font-headline text-primary font-bold tracking-tight leading-tight line-clamp-2">
            {currentTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-1 flex-1 relative">
          <div className={cn("transition-all duration-700", showVerify ? "opacity-20 blur-md scale-95" : "opacity-100")}>
            <p className="text-primary/70 leading-snug text-[13px] font-medium line-clamp-3">
              {currentContent}
            </p>
          </div>

          {showVerify && (
            <div className="absolute inset-0 z-20 bg-white/10 p-4 animate-in fade-in zoom-in duration-500 overflow-y-auto custom-scrollbar">
              <div className="h-full flex flex-col gap-3">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-secondary" />
                  </div>
                ) : verifyData ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Trust Score</span>
                        <span className="text-[10px] font-bold text-secondary">{verifyData.trustScore}%</span>
                      </div>
                      <Progress value={verifyData.trustScore} className="h-1 bg-primary/10" />
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-2xl border border-secondary/20">
                      <p className="text-[11px] font-bold text-primary text-center">
                        Verdict: <span className={cn(verifyData.trustScore > 70 ? "text-emerald-600" : "text-amber-600")}>{verifyData.verdict}</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center px-4 py-3 border-t border-primary/5 bg-white/10">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleVerify}
              className={cn("gap-1.5 h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]", showVerify ? 'bg-secondary text-primary' : 'text-primary/40 hover:bg-primary/5')}
            >
              <ShieldCheck size={12} />
              {showVerify ? "Back" : "Verify"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayAudio}
              className={cn("h-7 w-7 rounded-full text-primary/40", isPlaying && "bg-secondary/20 text-secondary animate-pulse")}
            >
              {isPlaying ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
            </Button>
          </div>
          {brief.url && (
            <a href={brief.url} target="_blank" className="text-[9px] font-bold text-primary/40 hover:text-accent uppercase tracking-widest">
              Full Link <ExternalLink size={10} className="inline ml-1" />
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
  showSavedOnly?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const NewsBriefs = forwardRef<HTMLDivElement, NewsBriefsProps>(({ 
  category, 
  searchQuery, 
  country, 
  language, 
  showSavedOnly,
  onScroll 
}, ref) => {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [savedBriefs, setSavedBriefs] = useState<NewsBrief[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("savedNews");
    if (saved) setSavedBriefs(JSON.parse(saved));
    
    const handleGlobalStop = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    };
    window.addEventListener('stop-all-audio', handleGlobalStop);
    return () => window.removeEventListener('stop-all-audio', handleGlobalStop);
  }, []);

  const handleSave = (brief: NewsBrief) => {
    const isAlreadySaved = savedBriefs.some(b => b.id === brief.id);
    let updated = isAlreadySaved ? savedBriefs.filter(b => b.id !== brief.id) : [...savedBriefs, brief];
    setSavedBriefs(updated);
    localStorage.setItem("savedNews", JSON.stringify(updated));
    toast({ title: isAlreadySaved ? "Removed" : "Saved", description: isAlreadySaved ? "Article removed." : "Added to library." });
  };

  const handleSummarizeAndAnnounce = async () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
        (window as any).stopAllAudio();
      }
      return;
    }

    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }

    const list = showSavedOnly ? savedBriefs : briefs;
    if (list.length === 0) return;
    
    setIsSummarizing(true);
    try {
      const topArticles = list.slice(0, 10).map(b => ({ title: b.title, content: b.content }));
      const { summary } = await summarizeNewsBatch({ articles: topArticles });
      
      const { media } = await textToSpeech({
        text: summary,
        voice: 'Charon',
        style: 'professional'
      });
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Briefing Offline", description: "AI synthesis busy." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const fetchLiveNews = useCallback(async (pageToken?: string) => {
    if (pageToken) setIsLoadingMore(true); else setLoading(true);
    try {
      const query = searchQuery ? searchQuery : `${category} news in ${country}`;
      const rawResults = await searchNewsTool({ query, page: pageToken });
      const parsed = JSON.parse(rawResults);
      if (parsed.error) throw new Error(parsed.error);

      const newBriefs = (parsed.results || []).map((r: any, idx: number) => ({
        id: r.link || `news-${idx}-${Date.now()}`,
        title: r.title || "Headline",
        content: r.description || r.content || "Content loading...",
        url: r.link,
        category: searchQuery ? "Discovery" : category,
        publishedAt: r.pubDate || "Just Now"
      }));

      setBriefs(prev => pageToken ? [...prev, ...newBriefs] : newBriefs);
      setNextPageToken(parsed.nextPage || null);
    } catch (error) {
      toast({ variant: "destructive", title: "Feed Busy", description: "Source limit reached." });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, country, searchQuery, toast]);

  useEffect(() => {
    if (!showSavedOnly) {
      setBriefs([]);
      fetchLiveNews();
    }
  }, [category, country, searchQuery, showSavedOnly, fetchLiveNews]);

  const handleInternalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) onScroll(e);
    if (showSavedOnly || loading || isLoadingMore || !nextPageToken) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 500) fetchLiveNews(nextPageToken);
  };

  const currentBriefs = showSavedOnly ? savedBriefs : briefs;

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      <div className="flex flex-row items-center justify-between gap-4 px-4 py-3 flex-shrink-0 bg-background/40 backdrop-blur-xl border-b border-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Globe size={16} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold text-primary tracking-tight">
              {showSavedOnly ? "Library" : searchQuery ? `"${searchQuery}"` : `${category} Feed`}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1 w-1 rounded-full", isPlaying ? "bg-accent animate-ping" : "bg-secondary")} />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{country}</span>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSummarizeAndAnnounce}
          disabled={isSummarizing || (loading && !showSavedOnly)}
          size="sm"
          className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all gap-1.5 h-10 px-4"
        >
          {isSummarizing ? <Loader2 className="animate-spin" size={14} /> : isPlaying ? <Square size={14} fill="currentColor" /> : <Sparkles size={14} />}
          <span className="text-[10px] font-bold uppercase">Briefing</span>
        </Button>
      </div>
      <div ref={ref} onScroll={handleInternalScroll} className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-4 pb-32">
        {loading && !showSavedOnly && briefs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-[2rem] glass" />)}
          </div>
        ) : currentBriefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentBriefs.map((brief) => (
              <NewsBriefCard key={brief.id} brief={brief} language={language} onSave={handleSave} isSaved={savedBriefs.some(b => b.id === brief.id)} />
            ))}
            {isLoadingMore && <Skeleton className="h-40 w-full rounded-[2rem] glass col-span-2" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 glass rounded-[2rem] text-center space-y-3">
            <Newspaper className="text-primary/20" size={32} />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px]">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
});

NewsBriefs.displayName = "NewsBriefs";
