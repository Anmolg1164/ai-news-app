"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink, ShieldCheck, Loader2, Globe, Volume2, Bookmark, BookmarkCheck, Square, Play, Pause, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyNews, type VerifyNewsOutput } from "@/ai/flows/verify-news";
import { fetchNews } from "@/ai/flows/get-journey-intelligence";
import { summarizeNewsBatch } from "@/ai/flows/summarize-news-batch";
import { translateNews } from "@/ai/flows/translate-news";
import { speakText, stopBrowserSpeech } from "@/lib/browser-speech";
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
  onSave, 
  isSaved,
  isDisabled,
  language
}: { 
  brief: NewsBrief, 
  onSave: (brief: NewsBrief) => void,
  isSaved: boolean,
  isDisabled: boolean,
  language: string
}) {
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyNewsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [translatedContent, setTranslatedContent] = useState<{ title: string; content: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleGlobalStop = () => setIsPlaying(false);
    window.addEventListener('stop-all-audio', handleGlobalStop);
    return () => window.removeEventListener('stop-all-audio', handleGlobalStop);
  }, []);

  useEffect(() => {
    if (language !== "English") {
      handleTranslate();
    } else {
      setTranslatedContent(null);
    }
  }, [language, brief.id]);

  const handleTranslate = async () => {
    setIsTranslating(true);
    window.dispatchEvent(new CustomEvent('ai-call'));
    try {
      const result = await translateNews({
        title: brief.title,
        content: brief.content,
        targetLanguage: language
      });
      setTranslatedContent({
        title: result.translatedTitle,
        content: result.translatedContent
      });
    } catch (e) {
      console.error("Translation error:", e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      stopBrowserSpeech();
      setIsPlaying(false);
      return;
    }

    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }

    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      const textToRead = translatedContent?.content || brief.content;
      setIsPlaying(true);
      speakText(textToRead, () => setIsPlaying(false));
    }, 300);
  };

  const handleVerify = async () => {
    if (showVerify) {
      setShowVerify(false);
      return;
    }

    setShowVerify(true);
    if (!verifyData) {
      setIsLoading(true);
      window.dispatchEvent(new CustomEvent('ai-call'));
      try {
        const result = await verifyNews({ headline: brief.title });
        setVerifyData(result);
      } catch (error: any) {
        setShowVerify(false);
        toast({ variant: "destructive", title: "Verify Busy", description: "AI reached its limit. Please wait." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const displayTitle = translatedContent?.title || brief.title;
  const displayContent = translatedContent?.content || brief.content;

  return (
    <div ref={cardRef} className="h-full relative">
      <Card className={cn("border-none glass h-full flex flex-col overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-[2rem] group/card", isDisabled && "opacity-60 grayscale-[0.2]")}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-white bg-primary px-2 py-1 rounded-full uppercase tracking-widest">
                {brief.category}
              </span>
              {isTranslating && (
                <div className="flex items-center gap-1">
                  <Loader2 size={8} className="animate-spin text-primary" />
                  <span className="text-[6px] font-bold text-primary uppercase">Translating...</span>
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
          <CardTitle className="text-base font-headline text-primary font-bold tracking-tight leading-tight line-clamp-2">
            {displayTitle}
          </CardTitle>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={10} className="text-muted-foreground/60" />
            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">{new Date(brief.publishedAt).toLocaleDateString()}</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-1 flex-1 relative">
          <div className={cn("transition-all duration-700", showVerify ? "opacity-20 blur-md scale-95" : "opacity-100")}>
            <p className="news-content text-primary/70 leading-snug text-[13px] font-medium line-clamp-3">
              {displayContent}
            </p>
          </div>

          {showVerify && (
            <div className="absolute inset-0 z-20 bg-white/10 p-4 animate-in fade-in zoom-in duration-500 overflow-y-auto custom-scrollbar">
              <div className="h-full flex flex-col gap-3">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={24} className="animate-spin text-secondary" />
                    <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Cross-Referencing...</span>
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
                    <div className="space-y-2">
                       <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Sources</span>
                       {verifyData.crossReferences.slice(0, 2).map((ref, i) => (
                         <div key={i} className="text-[9px] text-primary/60 border-l-2 border-secondary/20 pl-2 py-1">
                           <span className="font-bold text-secondary">{ref.outlet}:</span> {ref.snippet.slice(0, 60)}...
                         </div>
                       ))}
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
              disabled={isLoading}
              className={cn("gap-1.5 h-7 px-3 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]", showVerify ? 'bg-secondary text-primary' : 'text-primary/40 hover:bg-primary/5')}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              {showVerify ? "Back" : "Verify It"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDisabled || isResetting}
              onClick={handlePlayAudio}
              className={cn("h-7 w-7 rounded-full text-primary/40", isPlaying && "bg-secondary/20 text-secondary animate-pulse")}
            >
              {isResetting ? <Loader2 size={12} className="animate-spin" /> : isPlaying ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
            </Button>
          </div>
          {brief.url && (
            <a href={brief.url} target="_blank" className="text-[9px] font-bold text-primary/40 hover:text-accent uppercase tracking-widest">
              Full <ExternalLink size={10} className="inline ml-1" />
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
  const [isResetting, setIsResetting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("savedNews");
    if (saved) setSavedBriefs(JSON.parse(saved));
    
    const handleGlobalStop = () => {
      stopBrowserSpeech();
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
    toast({ title: isAlreadySaved ? "Removed from Library" : "Added to Library" });
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }
  };

  const handleBriefingControl = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }

    const list = showSavedOnly ? savedBriefs : briefs;
    if (list.length === 0) return;
    
    setIsSummarizing(true);
    setIsResetting(true);
    window.dispatchEvent(new CustomEvent('ai-call'));
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsResetting(false);

    try {
      const topArticles = list.slice(0, 10).map(b => ({ title: b.title, content: b.content }));
      const { summary } = await summarizeNewsBatch({ articles: topArticles });
      
      setIsPlaying(true);
      speakText(summary, () => setIsPlaying(false));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Quota Reached", description: "AI service is busy. Please wait 60s." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const fetchLiveNews = useCallback(async (pageToken?: string) => {
    if (pageToken) setIsLoadingMore(true); else setLoading(true);
    try {
      const query = searchQuery ? searchQuery : `${category} news in ${country}`;
      const rawResults = await fetchNews({ query, page: pageToken });
      const parsed = JSON.parse(rawResults);
      
      if (parsed.error && !parsed.results?.length) {
        toast({ variant: "destructive", title: "Feed Error", description: parsed.error });
        setLoading(false);
        return;
      }

      const newBriefs = (parsed.results || []).map((r: any, idx: number) => ({
        id: r.link || `news-${idx}-${Date.now()}`,
        title: r.title || "Headline",
        content: r.description || r.content || "Content loading...",
        url: r.link,
        category: searchQuery ? "Discovery" : category,
        publishedAt: r.pubDate || new Date().toISOString()
      }));

      setBriefs(prev => pageToken ? [...prev, ...newBriefs] : newBriefs);
      setNextPageToken(parsed.nextPage || null);
    } catch (error) {
      toast({ variant: "destructive", title: "Feed Unavailable" });
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
    if (scrollHeight - scrollTop <= clientHeight + 800) {
      fetchLiveNews(nextPageToken);
    }
  };

  const currentBriefs = showSavedOnly ? savedBriefs : briefs;

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-4 py-3 flex-shrink-0 bg-background/40 backdrop-blur-xl border-b border-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Globe size={16} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-headline font-bold text-primary tracking-tight">
              {showSavedOnly ? "Library" : searchQuery ? `"${searchQuery}"` : `${category} Feed`}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1 w-1 rounded-full", (isPlaying) ? "bg-accent animate-ping" : "bg-secondary")} />
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{country}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={handleBriefingControl}
            disabled={isSummarizing || isResetting || (loading && !showSavedOnly)}
            size="sm"
            className="flex-1 md:flex-none rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all gap-1.5 h-9 md:h-10 px-3 md:px-4"
          >
            {isSummarizing || isResetting ? <Loader2 className="animate-spin" size={14} /> : isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            <span className="text-[10px] font-bold uppercase">{isPlaying ? "Stop" : "AI Insight"}</span>
          </Button>
        </div>
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
                onSave={handleSave} 
                isSaved={savedBriefs.some(b => b.id === brief.id)}
                isDisabled={isPlaying}
                language={language}
              />
            ))}
            {isLoadingMore && (
              <div className="col-span-1 md:col-span-2 py-8 flex justify-center">
                 <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 glass rounded-[2rem] text-center space-y-3">
            <Bookmark className="text-primary/20" size={32} />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-[10px]">Your library is empty</p>
          </div>
        )}
      </div>
    </div>
  );
});

NewsBriefs.displayName = "NewsBriefs";
