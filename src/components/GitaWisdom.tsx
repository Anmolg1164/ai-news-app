"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Quote } from "lucide-react";
import { interpretGitaVerse, type InterpretGitaVerseOutput } from "@/ai/flows/interpret-gita-verse";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_VERSES = [
  "Karmanye vadhikaraste Ma Phaleshu Kadachana, Ma Karma Phala Hetur Bhur Ma Te Sango Stv Akarmani",
  "Yada yada hi dharmasya glanir bhavati bharata, abhyutthanam adharmasya tadatmanam srjamy aham",
  "Nainam chindanti shastrani nainam dahati pavakah, na chainam kledayanty apo na shoshayati marutah"
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
    <Card className="overflow-hidden border-none glass shadow-xl transition-all duration-500 hover:shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 text-primary font-headline">
            <Quote className="text-secondary" /> Gita Wisdom
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={nextVerse} className="text-primary hover:bg-white/40">
            <RefreshCw size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="italic text-lg text-primary/90 font-medium leading-relaxed">
          "{currentVerse}"
        </p>
        
        {loading && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full bg-white/50" />
            <Skeleton className="h-4 w-5/6 bg-white/50" />
            <Skeleton className="h-4 w-4/6 bg-white/50" />
          </div>
        )}

        {interpretation && (
          <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Interpretation</h4>
              <p className="text-sm text-primary/80 leading-relaxed">
                {interpretation.interpretation}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Modern Relevance</h4>
              <p className="text-sm text-primary/80 leading-relaxed italic">
                {interpretation.modernRelevance}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!interpretation && !loading && (
          <Button 
            onClick={handleInterpret} 
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Sparkles size={16} /> Seek Interpretation
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
