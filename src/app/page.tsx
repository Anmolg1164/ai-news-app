"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { TravelIntelligence } from "@/components/TravelIntelligence";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell, Sparkles, ChevronDown, ArrowUp, Languages, User } from "lucide-react";
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
  
  const newsScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const requestMic = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    };
    requestMic();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 400);
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setSearchInput("");
    if (newsScrollContainerRef.current) {
      newsScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
      if (newsScrollContainerRef.current) {
        newsScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
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
    if (newsScrollContainerRef.current) {
      newsScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" suppressHydrationWarning>
      <header className="z-40 glass border-b border-primary/5 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700" suppressHydrationWarning>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
              GM
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold text-primary tracking-tighter leading-none">
                G newsMola
              </h1>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-60">
                Agentic Briefings
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-2xl mx-12 gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search world events..." 
                className="w-full bg-white/40 border border-primary/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-sm"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl border-primary/10 bg-white/40 gap-2 h-12 px-4 hover:bg-white shadow-sm transition-all">
                    <MapPin size={16} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider">{activeCountry.name}</span>
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass min-w-[160px]">
                  {COUNTRIES.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setActiveCountry(c)}
                      className="cursor-pointer font-medium py-2 px-4 rounded-lg m-1"
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl border-primary/10 bg-white/40 gap-2 h-12 px-4 hover:bg-white shadow-sm transition-all">
                    <Languages size={16} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider">{activeLanguage.name}</span>
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass min-w-[160px]">
                  {LANGUAGES.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => setActiveLanguage(l)}
                      className="cursor-pointer font-medium py-2 px-4 rounded-lg m-1"
                    >
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative group p-2 rounded-xl hover:bg-white transition-all">
              <Bell size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white animate-pulse" />
            </button>
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md cursor-pointer hover:ring-4 hover:ring-primary/5 transition-all">
              <Image 
                src="https://picsum.photos/seed/user1/100/100" 
                alt="Profile" 
                width={44} 
                height={44}
                className="object-cover"
                data-ai-hint="user avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full py-10">
          <aside className="lg:col-span-4 space-y-10 overflow-y-auto pr-4 custom-scrollbar hidden lg:block animate-in fade-in slide-in-from-left-8 duration-1000">
            <GitaWisdom isListening={isUserSpeaking} />
            
            <div className="p-8 rounded-[2.5rem] glass-dark text-white space-y-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl group-hover:bg-secondary/30 transition-all duration-700" />
              <div className="flex items-center gap-3 font-headline font-bold text-xl">
                <Sparkles className="text-secondary animate-pulse" /> Local Expedition
              </div>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                Your news feed is currently optimized for <span className="text-secondary font-bold">{activeCountry.name}</span> in <span className="text-secondary font-bold">{activeLanguage.name}</span>.
              </p>
              <button className="w-full py-4 rounded-2xl bg-secondary text-slate-900 font-bold hover:glow-secondary transition-all hover:scale-[1.02]">
                Refine Preferences
              </button>
            </div>
          </aside>

          <section 
            ref={newsScrollContainerRef}
            onScroll={handleScroll}
            className="lg:col-span-8 overflow-y-auto custom-scrollbar pb-40 h-full animate-in fade-in slide-in-from-bottom-8 duration-700"
          >
            <NewsBriefs 
              category={activeCategory} 
              searchQuery={searchQuery}
              country={activeCountry.name} 
              language={activeLanguage.name}
              onIntelligenceClick={triggerIntelligence}
            />
          </section>
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] glass border-l-primary/10 overflow-y-auto p-0">
          <div className="p-8">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
                <Sparkles className="text-secondary" /> Agentic Intelligence
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
          "fixed bottom-32 right-10 p-5 rounded-3xl bg-primary text-white shadow-2xl transition-all duration-500 z-50 hover:scale-110 active:scale-95 glow-primary",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"
        )}
      >
        <ArrowUp size={28} />
      </button>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: hsla(var(--primary), 0.1); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsla(var(--primary), 0.2); }
      `}</style>
    </div>
  );
}