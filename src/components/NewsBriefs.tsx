
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";
import { searchNews as searchNewsTool } from "@/ai/flows/get-journey-intelligence";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
}

function NewsBriefCard({ brief }: { brief: NewsBrief }) {
  const [showAlt, setShowAlt] = useState(false);
  const [altData, setAltData] = useState<AlternativePerspectiveOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        console.error("Alternative perspective failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setShowAlt(!showAlt);
  };

  return (
    <Card className="border-none glass overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-secondary-foreground bg-secondary/30 px-2 py-1 rounded-md uppercase tracking-wider">
            {brief.category}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Calendar size={12} />
            {brief.publishedAt || "Recently"}
          </div>
        </div>
        <CardTitle className="text-xl font-headline text-primary font-bold tracking-tight">
          {brief.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <div className={`transition-all duration-500 ${showAlt ? "opacity-30 blur-[1px]" : "opacity-100"}`}>
            <p className="text-primary/70 leading-relaxed text-sm">
              {brief.content}
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
        <button className="flex items-center gap-1 text-[10px] font-bold text-primary/40 hover:text-secondary uppercase tracking-widest transition-colors">
          Full Coverage <ExternalLink size={12} />
        </button>
      </CardFooter>
    </Card>
  );
}

interface NewsBriefsProps {
  category: string;
  country: string;
}

export function NewsBriefs({ category, country }: NewsBriefsProps) {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveNews() {
      setLoading(true);
      try {
        // We use the tool directly to fetch latest news based on category and country
        const query = `${category} news in ${country}`;
        const rawResults = await searchNewsTool({ query });
        
        // Parse the tool's raw string output back into objects for the feed
        // In a real app, the tool would return structured data, but we'll parse the bullet points
        const parsedBriefs = rawResults.split('\n').filter(line => line.startsWith('- ')).map((line, idx) => {
          const [title, ...descParts] = line.replace('- ', '').split(': ');
          return {
            id: `news-${idx}`,
            title: title || "Headline",
            content: descParts.join(': ') || "Latest update available.",
            category: category,
            publishedAt: new Date().toLocaleDateString()
          };
        });

        setBriefs(parsedBriefs);
      } catch (error) {
        console.error("Live news fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveNews();
  }, [category, country]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl glass" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center gap-2">
          <Globe className="text-primary/40" size={24} />
          <h2 className="text-3xl font-headline font-bold text-primary tracking-tighter">
            {category} Briefings
          </h2>
        </div>
        <div className="h-px flex-1 bg-primary/10" />
        <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">
          {country} Feed
        </span>
      </div>
      
      <div className="grid gap-6">
        {briefs.length > 0 ? (
          briefs.map((brief) => (
            <NewsBriefCard key={brief.id} brief={brief} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center space-y-4">
            <Newspaper className="text-primary/20" size={48} />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No active headlines for this selection</p>
          </div>
        )}
      </div>
    </div>
  );
}
