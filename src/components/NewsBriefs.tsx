"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink, ArrowLeftRight, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { getAlternativePerspective, type AlternativePerspectiveOutput } from "@/ai/flows/get-alternative-perspective";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  timestamp: any;
  category: string;
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
          currentRegion: "Western" // Default assumption for briefings if region is unknown
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
          <span className="text-xs font-bold text-secondary-foreground bg-secondary/30 px-2 py-1 rounded-md uppercase tracking-wider">
            {brief.category}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Calendar size={12} />
            {brief.timestamp ? format(brief.timestamp.toDate(), "PPP") : "Recent"}
          </div>
        </div>
        <CardTitle className="text-xl font-headline text-primary">
          {brief.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <div className={`transition-all duration-500 ${showAlt ? "opacity-30 blur-[1px]" : "opacity-100"}`}>
            <p className="text-primary/70 leading-relaxed">
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
                    Searching for diverse sources...
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

      <CardFooter className="flex justify-between items-center pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggle}
          className={`gap-2 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors ${showAlt ? 'text-secondary' : 'text-primary/60'}`}
        >
          <ArrowLeftRight size={14} />
          {showAlt ? "Original Feed" : "Perspective Switch"}
        </Button>
        <button className="flex items-center gap-1 text-xs font-bold text-primary/40 hover:text-secondary transition-colors">
          Full Coverage <ExternalLink size={12} />
        </button>
      </CardFooter>
    </Card>
  );
}

export function NewsBriefs() {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch up to 15 briefs to ensure a rich vertical feed
    const q = query(collection(db, "news_briefs"), orderBy("timestamp", "desc"), limit(15));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const news = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsBrief[];
      setBriefs(news);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl glass" />
        ))}
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center space-y-4">
        <div className="p-4 rounded-full bg-white/20">
          <Newspaper className="text-primary/40" size={48} />
        </div>
        <div>
          <h3 className="text-xl font-headline font-bold text-primary">No updates yet</h3>
          <p className="text-muted-foreground">The journey has just begun. News briefs will appear here soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-3 px-2">
        <h2 className="text-3xl font-headline font-bold text-primary">Global Briefings</h2>
        <div className="h-px flex-1 bg-primary/10" />
        <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">{briefs.length} Active Intel</span>
      </div>
      
      <div className="grid gap-6">
        {briefs.map((brief) => (
          <NewsBriefCard key={brief.id} brief={brief} />
        ))}
      </div>
    </div>
  );
}
