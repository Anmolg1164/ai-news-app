"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Quote, ScrollText } from "lucide-react";
import { interpretGitaVerse, type InterpretGitaVerseOutput } from "@/ai/flows/interpret-gita-verse";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_VERSES = [
  "Karmanye vadhikaraste Ma Phaleshu Kadachana, Ma Karma Phala Hetur Bhur Ma Te Sango Stv Akarmani",
  "Yada yada hi dharmasya glanir bhavati bharata, abhyutthanam adharmasya tadatmanam srjamy aham",
  "Nainam chindanti shastrani nainam dahati pavakah, na chainam kledayanty apo na shoshayati marutah",
  "Tasmad asaktah satatam karyam karma samachara, asakto hy acharan karma param apnoti purushah"
];

export function GitaWisdom() {
  const [verseIndex, setVerseIndex] = useState(0);
  const [interpretation, setInterpretation] = useState<InterpretGitaVerseOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const currentVerse = DEFAULT_VERSES[verseIndex];

  const handleInterpret = async () => {
    setLoading(true);
    try {
      const result = await interpretGitaVerse({ verse: currentVerse });
      setInterpretation(result);
    } catch (error) {
      console.error("Failed to interpret verse", error);
    } finally {
      setLoading(false);
    }
  };

  const nextVerse = () => {
    setVerseIndex((prev) => (prev + 1) % DEFAULT_VERSES.length);
    setInterpretation(null);
  };

  return (
    <Card className={cn(
      "parchment overflow-hidden border-none transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
      "relative group"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <ScrollText size={80} />
      </div>
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 text-[#5c4b37] font-headline font-bold">
            <Quote className="text-[#b4945e]" /> Gita Wisdom
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextVerse} 
            className="text-[#5c4b37] hover:bg-[#eee1c5]/50 rounded-full"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        <div className="relative">
          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#b4945e]/20 rounded-full" />
          <p className="italic text-lg text-[#5c4b37] font-medium leading-relaxed pl-4">
            "{currentVerse}"
          </p>
        </div>
        
        {loading && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full bg-[#eee1c5]" />
            <Skeleton className="h-4 w-5/6 bg-[#eee1c5]" />
            <Skeleton className="h-4 w-4/6 bg-[#eee1c5]" />
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
