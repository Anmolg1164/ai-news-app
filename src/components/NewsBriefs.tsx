
"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ShieldCheck, Loader2, Sparkles, Globe, Languages, Volume2, Bookmark, BookmarkCheck } from "lucide-react";
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
      // Silent fail for lazy translation to avoid spamming user
      console.warn("Lazy translation skipped (Rate limit)");
    } finally {
      setIsTranslating(false);
    }
  }, [brief.id, brief.title, brief.content]);

  useEffect(() => {
    if (isVisible && language !== "English" && !translatedData && !isTranslating) {
      // Longer delay for lazy translation to save RPM for manual actions
      const timer = setTimeout(() => handleTranslation(language), 1500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, language, translatedData, isTranslating, handleTranslation]);

  const handleVerify = async () => {
    if (!showVerify && !verifyData) {
      setIsLoading(true);
      try {
        const result = await verifyNews({ headline: brief.title });
        setVerifyData(result);
      } catch (error: any) {
        let title = "Verification Failed";
        let desc = "AI service is currently busy.";
        
        if (error.message.includes('GEMINI_QUOTA')) {
          desc = "Gemini API limit reached. Wait 60 seconds.";
        } else if (error.message.includes('SERPER')) {
          desc = "Search engine key issue. Please check config.";
        }

        toast({ variant: "destructive", title, description: desc });
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
            <div className="flex items-center gap-2">
               <button 
                onClick={() => onSave(brief)}
                className={cn("transition-all hover:scale-110", isSaved ? "text-accent" : "text-muted-foreground/40 hover:text-accent")}
              >
                {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
          </div>
          <CardTitle className="text-base font-headline text-primary font-bold tracking-tight leading-tight group-hover/card:text-secondary transition-colors duration-500 line-clamp-2">
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
                    <span className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-[0.2em]">Agentic Fact-Check</span>
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
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Cross-References</span>
                      {verifyData.crossReferences.map((ref, idx) => (
                        <div key={idx} className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary">{ref.outlet}</p>
                          <p className="text-[9px] text-muted-foreground line-clamp-1 italic">"{ref.snippet}"</p>
                        </div>
                      ))}
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleVerify}
            className={cn("gap-1.5 h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-all", showVerify ? 'bg-secondary text-primary shadow-md' : 'text-primary/40 hover:bg-primary/5 hover:text-primary')}
          >
            <ShieldCheck size={12} />
            {showVerify ? "Back" : "Verify It"}
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
  }, []);

  const handleSave = (brief: NewsBrief) => {
    const isAlreadySaved = savedBriefs.some(b => b.id === brief.id);
    let updated;
    if (isAlreadySaved) {
      updated = savedBriefs.filter(b => b.id !== brief.id);
      toast({ title: "Removed from Library", description: "Article removed from your saved list." });
    } else {
      updated = [...savedBriefs, brief];
      toast({ title: "Saved to Library", description: "You can find this article in your saved news." });
    }
    setSavedBriefs(updated);
    localStorage.setItem("savedNews", JSON.stringify(updated));
  };

  const fetchLiveNews = useCallback(async (pageToken?: string) => {
    if (pageToken) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const query = searchQuery ? searchQuery : `${category} news in ${country}`;
      const rawResults = await searchNewsTool({ query, page: pageToken });
      const parsed = JSON.parse(rawResults);
      
      if (parsed.error) {
        if (parsed.error.includes("credit") || parsed.error.includes("429")) {
          toast({ variant: "destructive", title: "API Quota Reached", description: "Daily NewsData.io credits exhausted. Please try again tomorrow." });
        } else {
          throw new Error(parsed.error);
        }
        return;
      }

      const newBriefs = (parsed.results || []).map((r: any, idx: number) => ({
        id: r.link || `news-${idx}-${Date.now()}-${Math.random()}`,
        title: r.title || "Latest Headline",
        content: r.description || r.content || "Context loading from sources...",
        url: r.link,
        category: searchQuery ? "Discovery" : category,
        publishedAt: r.pubDate ? new Date(r.pubDate).toLocaleDateString() : "Just Now"
      }));

      if (pageToken) {
        setBriefs(prev => [...prev, ...newBriefs]);
      } else {
        setBriefs(newBriefs);
      }
      setNextPageToken(parsed.nextPage || null);
    } catch (error) {
      toast({ variant: "destructive", title: "Feed Offline", description: "Sources are busy. Check your connection or API keys." });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, country, searchQuery, toast]);

  useEffect(() => {
    if (!showSavedOnly) {
      setBriefs([]);
      setNextPageToken(null);
      fetchLiveNews();
    }
  }, [category, country, searchQuery, showSavedOnly, fetchLiveNews]);

  const handleInternalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) onScroll(e);

    if (showSavedOnly || loading || isLoadingMore || !nextPageToken) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 500) {
      fetchLiveNews(nextPageToken);
    }
  };

  const handleSummarizeAndAnnounce = async () => {
    const list = showSavedOnly ? savedBriefs : briefs;
    if (list.length === 0 || isSummarizing || isPlaying) return;
    
    setIsSummarizing(true);
    try {
      const topArticles = list.slice(0, 10).map(b => ({ title: b.title, content: b.content }));
      const { summary } = await summarizeNewsBatch({ articles: topArticles });
      
      const { media } = await textToSpeech(summary);
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
        setIsPlaying(true);
        toast({ title: "Briefing Started", description: "Voice: Brian (Premium ElevenLabs)" });
      }
    } catch (error: any) {
      let desc = "AI service busy.";
      if (error.message.includes('ELEVENLABS')) {
        desc = "ElevenLabs quota exceeded or key invalid.";
      } else if (error.message.includes('GEMINI')) {
        desc = "Gemini API busy. Wait 60 seconds.";
      }
      toast({ variant: "destructive", title: "Briefing Failed", description: desc });
    } finally {
      setIsSummarizing(false);
    }
  };

  const currentBriefs = showSavedOnly ? savedBriefs : briefs;

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
              {showSavedOnly ? "My Library" : searchQuery ? `"${searchQuery}"` : `${category} Feed`}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1 w-1 rounded-full", isPlaying ? "bg-accent animate-ping" : "bg-secondary animate-pulse")} />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {isPlaying ? "Live Briefing" : country}
              </span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSummarizeAndAnnounce}
          disabled={isSummarizing || isPlaying || (loading && !showSavedOnly)}
          size="sm"
          className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 active:scale-95 transition-all gap-1.5 h-8 px-4 shadow-lg shadow-primary/10"
        >
          {isSummarizing ? <Loader2 className="animate-spin" size={14} /> : isPlaying ? <Volume2 className="animate-pulse" size={14} /> : <Sparkles size={14} />}
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {isSummarizing ? "Thinking" : isPlaying ? "Reading" : "AI Insights"}
          </span>
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
              <NewsBriefCard 
                key={brief.id} 
                brief={brief} 
                language={language} 
                onSave={handleSave}
                isSaved={savedBriefs.some(b => b.id === brief.id)}
              />
            ))}
            {isLoadingMore && (
              <>
                <Skeleton className="h-40 w-full rounded-[2rem] glass" />
                <Skeleton className="h-40 w-full rounded-[2rem] glass" />
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 glass rounded-[2rem] text-center space-y-3">
            <Newspaper className="text-primary/20" size={32} />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px]">No headlines found</p>
          </div>
        )}
      </div>
    </div>
  );
});

NewsBriefs.displayName = "NewsBriefs";
