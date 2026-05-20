"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { MapPin, Search, ChevronDown, ArrowUp, Languages, Activity, ShieldCheck, Bookmark, BookmarkCheck, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  { code: "bh", name: "Bhojpuri" },
  { code: "pa", name: "Punjabi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("World");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [activeLanguage, setActiveLanguage] = useState(LANGUAGES[0]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  
  const [aiUsage, setAiUsage] = useState(0);
  const { toast } = useToast();
  
  const newsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).stopAllAudio = () => {
        const audios = document.querySelectorAll('audio');
        audios.forEach(audio => audio.pause());
        window.dispatchEvent(new CustomEvent('stop-all-audio'));
      };
    }
  }, []);

  useEffect(() => {
    const handleAiCall = () => setAiUsage(prev => Math.min(prev + 8, 100));
    window.addEventListener('ai-call', handleAiCall);

    const recoveryInterval = setInterval(() => {
      setAiUsage(prev => Math.max(0, prev - 5));
    }, 3000);

    return () => {
      window.removeEventListener('ai-call', handleAiCall);
      clearInterval(recoveryInterval);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 400);
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setSearchInput("");
    setShowSavedOnly(false);
    if (newsScrollRef.current) newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLanguageChange = (lang: typeof LANGUAGES[0]) => {
    setActiveLanguage(lang);
    
    // Trigger Google Translate Widget
    if (typeof window !== 'undefined') {
      const googleCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleCombo) {
        googleCombo.value = lang.code;
        googleCombo.dispatchEvent(new Event('change'));
      } else {
        // Fallback for when the widget isn't ready
        setTimeout(() => {
           const retryCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
           if (retryCombo) {
             retryCombo.value = lang.code;
             retryCombo.dispatchEvent(new Event('change'));
           }
        }, 500);
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      setSearchQuery(searchInput);
      setActiveCategory("Discovery");
      setShowSavedOnly(false);
      if (newsScrollRef.current) newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    if (newsScrollRef.current) newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isMounted) return null;

  const GuptaEngineStatus = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] glass-dark text-white space-y-3 lg:space-y-4 relative overflow-hidden group hover:glow-secondary transition-all duration-500",
      isMobile && "mt-4"
    )}>
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/30 rounded-full blur-[80px] group-hover:scale-150 transition-all duration-1000" />
      <h3 className="flex items-center gap-3 font-headline font-bold text-lg lg:text-xl">
        Gupta Engine
      </h3>
      <p className="text-xs lg:text-sm opacity-80 leading-relaxed font-medium">
        Browsing <span className="text-secondary font-bold tracking-tight">{activeCountry.name}</span> in <span className="text-secondary font-bold tracking-tight">{activeLanguage.name}</span>.
      </p>
      <div className="space-y-2 pt-1 lg:pt-2">
        <div className="flex justify-between text-[8px] lg:text-[10px] font-bold uppercase opacity-40">
          <span>Minute Capacity</span>
          <span>{100 - aiUsage}% Available</span>
        </div>
        <Progress value={100 - aiUsage} className="h-1 bg-white/10" />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative" suppressHydrationWarning>
      <header className="z-40 glass border-b border-white/40 flex-shrink-0" suppressHydrationWarning>
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-primary/30 group-hover:rotate-6 transition-all duration-500 cursor-pointer relative overflow-hidden">
               <Image 
                src="https://picsum.photos/seed/gupta_intel/400/400" 
                alt="Logo" 
                fill
                className="object-cover"
                data-ai-hint="luxury logo"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-headline font-bold text-primary tracking-tighter leading-none">
                G newsMola
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-muted-foreground opacity-60">
                  Gupta Intelligence
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl flex items-center gap-2 md:gap-4">
            <div className="relative flex-1 group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" size={14} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search news..." 
                className="w-full bg-white/50 border border-primary/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-sm font-medium text-[10px]"
              />
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2 ml-auto md:ml-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-white/60 bg-white/50 gap-1.5 h-8 md:h-9 px-2 md:px-3 hover:bg-white shadow-sm transition-all">
                    <MapPin size={12} className="text-secondary" />
                    <span className="text-[9px] md:text-[10px] font-bold tracking-tight hidden xs:inline">{activeCountry.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/60 min-w-[150px] p-1 rounded-xl">
                  {COUNTRIES.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setActiveCountry(c)}
                      className="cursor-pointer font-bold py-2 px-3 rounded-lg m-0.5 hover:bg-primary/5 text-primary text-xs"
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-white/60 bg-white/50 gap-1.5 h-8 md:h-9 px-2 md:px-3 hover:bg-white shadow-sm transition-all">
                    <Languages size={12} className="text-accent" />
                    <span className="text-[9px] md:text-[10px] font-bold tracking-tight hidden xs:inline">{activeLanguage.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/60 min-w-[150px] p-1 rounded-xl">
                  {LANGUAGES.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => handleLanguageChange(l)}
                      className="cursor-pointer font-bold py-2 px-3 rounded-lg m-0.5 hover:bg-accent/5 text-accent text-xs"
                    >
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <CurrencyConverter />
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative group p-1.5 md:p-2 rounded-xl hover:bg-white/60 transition-all text-muted-foreground">
                  <Activity size={18} className={cn(aiUsage > 70 ? "text-accent animate-pulse" : "group-hover:text-primary")} />
                  {aiUsage > 20 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="glass border-primary/20 w-64 p-4 z-50 shadow-2xl" side="bottom" align="end">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Rate-Limit Monitor
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Requests Per Minute (RPM)</span>
                      <span className={cn(aiUsage > 80 ? "text-accent" : "text-primary")}>{aiUsage}%</span>
                    </div>
                    <Progress value={aiUsage} className="h-1" />
                    <p className="text-[9px] text-muted-foreground/60 italic leading-relaxed">
                      Gemini's free tier resets every <span className="text-primary font-bold">60 seconds</span>. Intelligence calls consume this while you explore.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-primary/5 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Engine Status</span>
                    <div className="flex items-center gap-1">
                       <ShieldCheck size={10} className="text-emerald-500" />
                       <span className="text-[8px] font-bold text-emerald-600 uppercase">Operational</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button 
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              title={showSavedOnly ? "Show All News" : "Show Saved News"}
              className={cn("w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all border-2 border-white shadow-xl hover:scale-105", showSavedOnly ? "bg-accent/20 border-accent/20" : "bg-white")}
            >
              {showSavedOnly ? <BookmarkCheck size={16} className="text-accent" /> : <Bookmark size={16} className="text-primary" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 h-full py-2 lg:py-4">
          <aside className="hidden lg:block lg:col-span-4 space-y-4 lg:space-y-6 overflow-y-auto pr-0 lg:pr-2 custom-scrollbar animate-in fade-in slide-in-from-left-10 duration-1000 pb-24 lg:pb-0">
            <GitaWisdom />
            <GuptaEngineStatus />
          </aside>

          <section className="lg:col-span-8 h-full overflow-hidden flex flex-col relative">
            <NewsBriefs 
              category={activeCategory} 
              searchQuery={searchQuery}
              country={activeCountry.name} 
              language={activeLanguage.name}
              showSavedOnly={showSavedOnly}
              onScroll={handleScroll}
              ref={newsScrollRef}
            />
            
            <div className="absolute bottom-6 left-0 right-0 px-4 flex flex-col items-center gap-4 pointer-events-none z-50">
              <div className="pointer-events-auto">
                <Navigation onCategoryClick={handleCategoryClick} activeCategory={activeCategory} />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Intelligence Hub Trigger */}
      <div className="lg:hidden fixed bottom-24 left-6 z-50 pointer-events-auto">
        <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
          <SheetTrigger asChild>
            <button className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-[0_8px_32px_rgba(262,83,58,0.4)] animate-float active:scale-95 transition-all">
              <Sparkles size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] glass-dark border-primary/20 p-6 overflow-y-auto custom-scrollbar">
            <SheetHeader className="mb-6 flex flex-row items-center justify-between">
              <SheetTitle className="text-2xl font-headline font-bold text-secondary">
                Intelligence Hub
              </SheetTitle>
              <button onClick={() => setIntelligenceOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/40">
                <X size={24} />
              </button>
            </SheetHeader>
            <div className="space-y-6">
              <GitaWisdom />
              <GuptaEngineStatus isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-6 md:right-12 p-3 md:p-4 rounded-xl bg-primary text-white shadow-2xl transition-all duration-700 z-50 hover:scale-110 active:scale-90",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-32 pointer-events-none"
        )}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
