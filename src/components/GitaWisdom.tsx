
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  RefreshCw, 
  Quote, 
  ScrollText, 
  Volume2, 
  Loader2,
  Square
} from "lucide-react";
import { interpretGitaVerse, type InterpretGitaVerseOutput } from "@/ai/flows/interpret-gita-verse";
import { translateVerse, type TranslateVerseOutput } from "@/ai/flows/translate-verse";
import { speakText, stopBrowserSpeech } from "@/lib/browser-speech";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import gitaData from "@/app/lib/gita-verses.json";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Sanskrit", label: "Sanskrit (Romanized)" }
];

export function GitaWisdom() {
  const [verseIndex, setVerseIndex] = useState(0);
  const [interpretation, setInterpretation] = useState<InterpretGitaVerseOutput | null>(null);
  const [translation, setTranslation] = useState<TranslateVerseOutput | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const translationCache = useRef<Record<string, TranslateVerseOutput>>({});
  const { toast } = useToast();

  const verses = gitaData.verses;
  const currentVerse = verses[verseIndex];

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    setVerseIndex(dayOfYear % verses.length);

    // Warm up voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, [verses.length]);

  const forceCleanup = () => {
    stopBrowserSpeech();
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleGlobalStop = () => forceCleanup();
    window.addEventListener('stop-all-audio', handleGlobalStop);
    return () => window.removeEventListener('stop-all-audio', handleGlobalStop);
  }, []);

  const handleInterpret = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await interpretGitaVerse({ verse: currentVerse.sanskrit });
      setInterpretation(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wisdom Service Busy",
        description: "The AI reached its limit. Please wait a few seconds.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    if (isTranslating) return;
    
    // Explicitly handle revert to English
    if (lang === "English") {
      setSelectedLanguage("English");
      setTranslation(null);
      return;
    }

    setSelectedLanguage(lang);
    const cacheKey = `${verseIndex}-${lang}`;
    if (translationCache.current[cacheKey]) {
      setTranslation(translationCache.current[cacheKey]);
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateVerse({
        verse: currentVerse.sanskrit,
        english: currentVerse.english,
        targetLanguage: lang
      });
      if (result) {
        translationCache.current[cacheKey] = result;
        setTranslation(result);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Translation Error",
        description: "Quota limit reached. Reverting to English.",
      });
      setSelectedLanguage("English");
      setTranslation(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      forceCleanup();
      return;
    }

    // Silence others
    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }
    
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      const textToRead = translation ? translation.translatedVerse : currentVerse.english;
      setIsPlaying(true);
      speakText(textToRead, () => setIsPlaying(false));
    }, 300);
  };

  const nextVerse = () => {
    if (typeof window !== 'undefined' && (window as any).stopAllAudio) {
      (window as any).stopAllAudio();
    }
    setVerseIndex((prev) => (prev + 1) % verses.length);
    setInterpretation(null);
    setTranslation(null);
    setSelectedLanguage("English");
  };

  return (
    <Card className={cn(
      "parchment overflow-hidden border-none transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
      "relative group"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <ScrollText size={80} />
      </div>
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 text-[#5c4b37] font-headline font-bold">
            <Quote className="text-[#b4945e]" /> Gita Wisdom
          </CardTitle>
          <div className="flex items-center gap-1">
             <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-8 w-[100px] bg-[#eee1c5]/30 border-[#b4945e]/20 text-[#5c4b37] text-xs focus:ring-0">
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent className="bg-[#fdf6e3] border-[#e2d1a3]">
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value} className="text-[#5c4b37] hover:bg-[#eee1c5] cursor-pointer">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextVerse} 
              className="h-8 w-8 text-[#5c4b37] hover:bg-[#eee1c5]/50 rounded-full"
            >
              <RefreshCw size={14} className={cn(loading ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#b4945e]/20 rounded-full" />
            <p className="italic text-base text-[#5c4b37] font-medium leading-relaxed pl-4">
              "{currentVerse.sanskrit}"
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#b4945e] uppercase tracking-widest flex items-center gap-1">
                {selectedLanguage} Insight
                {isTranslating && <Loader2 size={10} className="animate-spin" />}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={isResetting}
                onClick={handlePlayAudio}
                className={cn(
                  "h-8 w-8 text-[#b4945e] hover:bg-[#eee1c5] transition-all rounded-full",
                  (isPlaying || isResetting) && "bg-secondary/20 text-secondary animate-pulse"
                )}
              >
                {isResetting ? <Loader2 size={14} className="animate-spin" /> : isPlaying ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
              </Button>
            </div>
            <p className="text-sm text-[#5c4b37]/90 leading-relaxed font-serif">
              {translation ? translation.translatedVerse : currentVerse.english}
            </p>
          </div>
        </div>
        
        {loading && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full bg-[#eee1c5]" />
            <Skeleton className="h-4 w-5/6 bg-[#eee1c5]" />
          </div>
        )}

        {interpretation && (
          <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-[#b4945e] uppercase tracking-widest">Divine Interpretation</h4>
              <p className="text-sm text-[#5c4b37]/90 leading-relaxed font-serif">
                {interpretation.interpretation}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-[#b4945e] uppercase tracking-widest">Modern Dharma</h4>
              <p className="text-sm text-[#5c4b37]/80 leading-relaxed italic border-l-2 border-[#b4945e]/30 pl-3">
                {interpretation.modernRelevance}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10">
        {!interpretation && !loading && (
          <Button 
            onClick={handleInterpret} 
            className="w-full bg-[#b4945e] hover:bg-[#8e734a] text-white gap-2 rounded-xl shadow-lg transition-all"
          >
            <Sparkles size={16} /> Seek Divine Clarity
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
