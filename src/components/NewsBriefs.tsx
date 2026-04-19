"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface NewsBrief {
  id: string;
  title: string;
  content: string;
  timestamp: any;
  category: string;
}

export function NewsBriefs() {
  const [briefs, setBriefs] = useState<NewsBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "news_briefs"), orderBy("timestamp", "desc"), limit(10));
    
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
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl glass" />
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
    <div className="grid gap-6">
      <div className="flex items-center gap-3 px-2">
        <h2 className="text-3xl font-headline font-bold text-primary">Latest Briefings</h2>
        <div className="h-px flex-1 bg-primary/10" />
      </div>
      
      {briefs.map((brief) => (
        <Card key={brief.id} className="border-none glass overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/40">
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
            <p className="text-primary/70 leading-relaxed">
              {brief.content}
            </p>
            <div className="flex justify-end">
              <button className="flex items-center gap-1 text-sm font-bold text-primary hover:text-secondary transition-colors">
                Full Coverage <ExternalLink size={14} />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
