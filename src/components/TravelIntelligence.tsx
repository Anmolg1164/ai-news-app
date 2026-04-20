
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Plane, 
  Globe, 
  ShieldCheck, 
  Map, 
  Sun, 
  Coins, 
  ArrowLeftRight, 
  Loader2, 
  Layers,
  Mic,
  Volume2,
  HelpCircle,
  Play,
  Sparkles,
  Zap,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { type JourneyIntelligenceOutput } from "@/ai/flows/get-journey-intelligence";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";
import { textToSpeech } from "@/ai/flows/tts-flow";
import { handleVoiceQuery } from "@/ai/flows/voice-chat-flow";
import { useVAD } from "@/hooks/use-vad";

interface TravelIntelligenceProps {
  data?: JourneyIntelligenceOutput | null;
  category?: string;
  isLoading?: boolean;
  onUserSpeakingChange?: (isSpeaking: boolean) => void;
}

const DEFAULT_INTELLIGENCE = [
  {
    category: "Visa Updates",
    title: "Schengen Area changes for 2025",
    icon: Globe,
    status: "Priority",
    color: "bg-blue-100 text-blue-700"
  },
  {
    category: "Security",
    title: "Health protocols for SEA travel",
    icon: ShieldCheck,
    status: "Updated",
    color: "bg-green-100 text-green-700"
  }
];

export function TravelIntelligence({ data, category, isLoading, onUserSpeakingChange }: TravelIntelligenceProps) {
  const [altPerspective, setAltPerspective] = useState<AlternativePerspectiveOutput | null>(null);
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { startVAD, isSpeaking } = useVAD({
    onSpeechStart: () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsAiTalking(false);
        setStatusMessage("Listening to you...");
      }
      onUserSpeakingChange?.(true);
    },
    onSpeechEnd: async (blob) => {
      onUserSpeakingChange?.(false);
      if (!isInteractiveMode) return;
      
      const contextText = showAlt && altPerspective ? altPerspective.altSummary : (data?.summary || "General news information");
      setStatusMessage("Dharma Navigator thinking...");
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const result = await handleVoiceQuery({
            userAudioUri: base64Audio,
            newsContext: contextText
          });
          
          if (audioRef.current) {
            audioRef.current.src = result.audioResponse;
            audioRef.current.play();
            setIsAiTalking(true);
            setStatusMessage("Guide responding...");
          }
        } catch (error) {
          console.error("Voice chat failed:", error);
          setStatusMessage("I couldn't hear you clearly.");
        }
      };
      reader.readAsDataURL(blob);
    }
  });

  const startBriefing = async () => {
    const textToRead = showAlt && altPerspective ? altPerspective.altSummary : (data?.summary || "Welcome to your G newsMola briefing. We are analyzing the latest updates for you.");
    setIsInteractiveMode(true);
    setStatusMessage("Preparing briefing...");
    startVAD();

    try {
      const { media } = await textToSpeech(textToRead);
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
        setIsAiTalking(true);
        setStatusMessage("Reading briefing (Talk to interrupt)");
      }
    } catch (error) {
      console.error("Briefing failed:", error);
      setStatusMessage("Briefing unavailable.");
    }
  };

  const handleTogglePerspective = async () => {
    if (!showAlt && !altPerspective && data && category) {
      setIsLoadingAlt(true);
      try {
        const result = await getAlternativePerspective({
          category,
          originalSummary: data.summary,
          currentRegion: data.sourceRegion
        });
        setAltPerspective(result);
      } catch (error) {
        console.error("Alternative perspective failed:", error);
      } finally {
        setIsLoadingAlt(false);
      }
    }
    setShowAlt(!showAlt);
  };

  const renderTextWithElif = (text: string, terms?: { term: string, explanation: string }[]) => {
    if (!terms || terms.length === 0) return text;

    let parts: (string | JSX.Element)[] = [text];

    terms.forEach(({ term, explanation }) => {
      const newParts: (string | JSX.Element)[] = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const regex = new RegExp(`(${term})`, 'gi');
        const split = part.split(regex);
        
        split.forEach((subPart, i) => {
          if (subPart.toLowerCase() === term.toLowerCase()) {
            newParts.push(
              <span key={`${term}-${i}`} className="inline-flex items-center gap-1 group">
                <span className="font-bold border-b border-dotted border-primary/40 group-hover:border-primary transition-colors cursor-help">
                  {subPart}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-secondary hover:text-primary transition-colors inline-flex">
                      <HelpCircle size={14} className="mb-1" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 glass p-4 text-xs z-[60]">
                    <div className="space-y-1">
                      <p className="font-bold text-primary uppercase tracking-tighter">ELIF: {term}</p>
                      <p className="text-primary/80 leading-relaxed italic">
                        "{explanation}"
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </span>
            );
          } else if (subPart !== '') {
            newParts.push(subPart);
          }
        });
      });
      parts = newParts;
    });

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setIsAiTalking(false)} className="hidden" />

      {/* Voice Control Hub */}
      <div className="p-8 rounded-[2.5rem] glass-dark border-primary/20 text-white flex flex-col items-center gap-6 animate-in fade-in duration-700 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {!isInteractiveMode ? (
          <>
            <Button 
              onClick={startBriefing}
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-secondary text-primary font-bold gap-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-lg"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
              Start Voice Briefing
            </Button>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">
                <Zap size={10} className="text-secondary" /> How to use
              </div>
              <p className="text-[11px] text-white/50 font-medium leading-relaxed">
                Click start, listen, and simply <span className="text-secondary font-bold">speak to interrupt</span> the guide with any question.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 relative ${
              isSpeaking 
                ? 'bg-secondary scale-110 shadow-[0_0_50px_rgba(6,182,212,0.6)]' 
                : isAiTalking 
                  ? 'bg-primary/40 ring-4 ring-primary/20 animate-pulse' 
                  : 'bg-white/5'
            }`}>
              {isSpeaking ? (
                <Mic className="text-primary-foreground animate-bounce" size={40} />
              ) : (
                <Volume2 className={isAiTalking ? "text-secondary animate-pulse" : "text-white/20"} size={40} />
              )}
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full border-4 border-secondary animate-ping opacity-30" />
              )}
            </div>
            <div className="text-center space-y-1">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-secondary block">{statusMessage}</span>
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                <MessageSquare size={10} /> Speak at any time to ask a question
              </p>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-[2.5rem] bg-primary/5" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 bg-primary/5 rounded-2xl" />
            <Skeleton className="h-12 bg-primary/5 rounded-2xl" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
              <Map className="text-secondary" /> {data.country || "Global"} Insights
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase border-primary/20 rounded-full px-3">
              {data.sourceRegion} Feed
            </Badge>
          </div>

          <div className="p-6 rounded-[2.5rem] glass border-primary/10 space-y-6 relative overflow-hidden group">
             <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors" />
            
            <div className={`transition-all duration-500 ${showAlt ? "opacity-0 invisible h-0" : "opacity-100 visible"}`}>
              <div className="text-primary/80 font-medium leading-relaxed text-lg">
                {renderTextWithElif(data.summary, data.complexTerms)}
              </div>
            </div>
            
            {altPerspective && (
              <div className={`transition-all duration-500 ${showAlt ? "opacity-100 visible" : "opacity-0 invisible h-0"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground text-[10px] rounded-full">
                    {altPerspective.altRegion} Perspective
                  </Badge>
                </div>
                <div className="text-primary/70 font-medium leading-relaxed italic text-lg border-l-4 border-secondary/20 pl-6">
                  {renderTextWithElif(altPerspective.altSummary, altPerspective.complexTerms)}
                </div>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleTogglePerspective}
              disabled={isLoadingAlt}
              className="w-full mt-2 border border-primary/5 hover:bg-primary/5 text-primary/40 hover:text-primary gap-3 h-12 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all"
            >
              {isLoadingAlt ? (
                <Loader2 size={16} className="animate-spin" />
              ) : showAlt ? (
                <><Layers size={16} /> Restore Primary News</>
              ) : (
                <><ArrowLeftRight size={16} /> Switch Global Perspective</>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              {data.weather && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 flex items-center gap-3 group/item">
                  <div className="p-2 bg-amber-100 rounded-xl group-hover/item:rotate-12 transition-transform">
                    <Sun size={20} className="text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-amber-900">{data.weather}</span>
                </div>
              )}
              {data.currency && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex items-center gap-3 group/item">
                   <div className="p-2 bg-emerald-100 rounded-xl group-hover/item:rotate-12 transition-transform">
                    <Coins size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-900">{data.currency}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
              <Sparkles className="text-secondary" /> Daily Intelligence
            </h2>
          </div>
          <div className="grid gap-4">
            {DEFAULT_INTELLIGENCE.map((item, idx) => (
              <div key={idx} className="p-5 rounded-[2rem] glass hover:bg-white/80 transition-all border-transparent hover:border-primary/10 group cursor-pointer shadow-sm hover:shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                    <item.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.category}</span>
                      <Badge variant="secondary" className={`text-[9px] h-5 rounded-full px-2 ${item.color}`}>{item.status}</Badge>
                    </div>
                    <p className="text-base font-bold text-primary leading-tight group-hover:translate-x-1 transition-transform">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
