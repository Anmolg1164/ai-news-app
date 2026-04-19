"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { TravelIntelligence } from "@/components/TravelIntelligence";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell, Sparkles, ChevronDown, ArrowUp, Languages, Zap } from "lucide-react";
import Image from "next/image";
import { getJourneyIntelligence, type JourneyIntelligenceOutput } from "@/ai/flows/get-journey-intelligence";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "in", name: "India" },
  { code: "us", name: "USA" },
  { code: "gb", name: "UK" },
  { code: "jp", name: "Japan" },
  { code: "ae", name: "UAE" },
  { code: "au", name: "Australia" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "or", name: "Odia" },
  { code: "bho", name: "Bhojpuri" },
  { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
];

export default function Home() {
  const [intelligenceData, setIntelligenceData] = useState<JourneyIntelligenceOutput | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("World");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [activeLanguage, setActiveLanguage] = useState(LANGUAGES[0]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  
  const newsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Auto-request mic permission visually or via dummy call if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 400);
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setSearchInput("");
    if (newsScrollRef.current) {
      newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
      if (newsScrollRef.current) {
        newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const triggerIntelligence = async () => {
    setIsSheetOpen(true);
    setIsLoading(true);
    setIntelligenceData(null);
    try {
      const context = searchQuery ? `Search query: ${searchQuery}` : `Category: ${activeCategory}`;
      const result = await getJourneyIntelligence({ 
        category: `${context} in ${activeCountry.name}` 
      });
      setIntelligenceData(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Analysis Busy",
        description: "The agent is handling many requests. Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => {
    if (newsScrollRef.current) {
      newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative" suppressHydrationWarning>
      <header className="z-40 glass border-b border-white/40 flex-shrink-0 animate-in fade-in slide-in-from-top-6 duration-1000" suppressHydrationWarning>
        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary/30 group-hover:rotate-6 transition-all duration-500 cursor-pointer relative overflow-hidden">
               <div className="absolute inset-0 bg-white/20 animate-pulse" />
               <Zap className="relative z-10" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary tracking-tighter leading-none">
                G newsMola
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground opacity-60">
                  Neo Intelligence
                </span>
                <div className="h-1 w-1 bg-secondary rounded-full animate-ping" />
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-2xl mx-12 gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" size={20} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="What's the vibe in the world?" 
                className="w-full bg-white/50 border border-primary/10 rounded-[2rem] py-4 pl-14 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-sm font-medium"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl border-white/60 bg-white/50 gap-2 h-14 px-6 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95" suppressHydrationWarning>
                    <MapPin size={18} className="text-secondary" />
                    <span className="text-sm font-bold tracking-tight">{activeCountry.name}</span>
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/60 min-w-[180px] p-2 rounded-2xl">
                  {COUNTRIES.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setActiveCountry(c)}
                      className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-primary/5 text-primary"
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl border-white/60 bg-white/50 gap-2 h-14 px-6 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95" suppressHydrationWarning>
                    <Languages size={18} className="text-accent" />
                    <span className="text-sm font-bold tracking-tight">{activeLanguage.name}</span>
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/60 min-w-[180px] p-2 rounded-2xl">
                  {LANGUAGES.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => setActiveLanguage(l)}
                      className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-accent/5 text-accent"
                    >
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative group p-3 rounded-2xl hover:bg-white transition-all" suppressHydrationWarning>
              <Bell size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-accent rounded-full border-2 border-white shadow-sm animate-pulse" />
            </button>
            <div className="w-14 h-14 rounded-[1.2rem] overflow-hidden border-2 border-white shadow-xl cursor-pointer hover:ring-4 hover:ring-primary/10 transition-all hover:scale-110 active:scale-90">
              <Image 
                src="https://picsum.photos/seed/usergenz/200/200" 
                alt="Profile" 
                width={56} 
                height={56}
                className="object-cover"
                data-ai-hint="user avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full py-8">
          <aside className="lg:col-span-4 space-y-8 overflow-y-auto pr-2 custom-scrollbar hidden lg:block animate-in fade-in slide-in-from-left-10 duration-1000">
            <GitaWisdom isListening={isUserSpeaking} />
            
            <div className="p-8 rounded-[3rem] glass-dark text-white space-y-6 relative overflow-hidden group hover:glow-secondary transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/30 rounded-full blur-[80px] group-hover:scale-150 transition-all duration-1000" />
              <div className="flex items-center gap-4 font-headline font-bold text-2xl">
                <div className="p-2 bg-secondary/20 rounded-xl">
                  <Sparkles className="text-secondary animate-pulse" />
                </div>
                Deep Dive
              </div>
              <p className="text-base opacity-80 leading-relaxed font-medium">
                Switching up the vibe for <span className="text-secondary font-bold tracking-tight">{activeCountry.name}</span> articles in <span className="text-secondary font-bold tracking-tight">{activeLanguage.name}</span>.
              </p>
              <button className="w-full py-5 rounded-[1.5rem] bg-secondary text-slate-900 font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg" suppressHydrationWarning>
                Customize Experience
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 h-full overflow-hidden bento-card">
            <NewsBriefs 
              category={activeCategory} 
              searchQuery={searchQuery}
              country={activeCountry.name} 
              language={activeLanguage.name}
              onIntelligenceClick={triggerIntelligence}
              onScroll={handleScroll}
              ref={newsScrollRef}
            />
          </section>
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[580px] glass border-l-white/60 overflow-y-auto p-0 rounded-l-[3rem]">
          <div className="p-10">
            <SheetHeader className="mb-10">
              <SheetTitle className="text-4xl font-headline font-bold text-primary flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-2xl">
                  <Sparkles className="text-secondary" />
                </div>
                AI Agent
              </SheetTitle>
            </SheetHeader>
            <TravelIntelligence 
              data={intelligenceData} 
              category={searchQuery ? `Search for ${searchQuery}` : activeCategory} 
              isLoading={isLoading}
              onUserSpeakingChange={setIsUserSpeaking}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Navigation onCategoryClick={handleCategoryClick} />

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-36 right-12 p-6 rounded-[2rem] bg-primary text-white shadow-2xl transition-all duration-700 z-50 hover:scale-110 active:scale-90 hover:glow-primary",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-32 pointer-events-none"
        )}
        suppressHydrationWarning
      >
        <ArrowUp size={32} />
      </button>
    </div>
  );
}