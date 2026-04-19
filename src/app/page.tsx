
"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { TravelIntelligence } from "@/components/TravelIntelligence";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell, Sparkles, ChevronDown, ArrowUp, Languages } from "lucide-react";
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
    setSearchQuery(""); // Clear search when switching categories
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

  const handleIconClick = (feature: string) => {
    toast({
      title: `${feature} Coming Soon`,
      description: "We're currently perfecting your personal news dashboard.",
    });
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-background/50 overflow-hidden" suppressHydrationWarning>
      <header className="z-40 bg-background/80 backdrop-blur-md border-b border-primary/5 flex-shrink-0" suppressHydrationWarning>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
              GM
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tighter">
              G newsMola
            </h1>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-xl mx-8 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search headlines (Press Enter)..." 
                className="w-full bg-white/50 border border-primary/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full border-primary/10 bg-white/50 gap-2 h-10 px-4">
                    <MapPin size={14} className="text-secondary" />
                    <span className="text-xs font-bold uppercase">{activeCountry.name}</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  {COUNTRIES.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setActiveCountry(c)}
                      className="cursor-pointer"
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full border-primary/10 bg-white/50 gap-2 h-10 px-4">
                    <Languages size={14} className="text-secondary" />
                    <span className="text-xs font-bold uppercase">{activeLanguage.name}</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  {LANGUAGES.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => setActiveLanguage(l)}
                      className="cursor-pointer"
                    >
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleIconClick("Notifications")}
              className="p-2 rounded-full hover:bg-white/50 text-primary transition-colors relative"
              suppressHydrationWarning
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background" />
            </button>
            <div 
              onClick={() => handleIconClick("Profile")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image 
                src="https://picsum.photos/seed/user1/100/100" 
                alt="User Avatar" 
                width={40} 
                height={40}
                className="object-cover"
                data-ai-hint="user avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full py-8">
          <aside className="lg:col-span-4 space-y-8 overflow-y-auto pr-2 custom-scrollbar hidden lg:block">
            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
              <GitaWisdom isListening={isUserSpeaking} />
            </section>
            
            <div className="p-6 rounded-3xl glass-dark text-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center gap-2 font-headline font-bold">
                <MapPin className="text-secondary" /> Local Expedition
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                Stay updated on your local surroundings in {activeCountry.name}. Your news feed is currently optimized for this region and language ({activeLanguage.name}).
              </p>
              <button 
                onClick={() => handleIconClick("Preferences")}
                className="w-full py-2 rounded-xl bg-secondary text-primary font-bold hover:scale-105 transition-transform"
              >
                Set Preferences
              </button>
            </div>
          </aside>

          <section 
            ref={newsScrollContainerRef}
            onScroll={handleScroll}
            className="lg:col-span-8 overflow-y-auto custom-scrollbar pb-32 h-full"
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
        <SheetContent side="right" className="w-[400px] sm:w-[540px] glass border-l-primary/10 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
              <Sparkles className="text-secondary" /> Agentic Intelligence
            </SheetTitle>
          </SheetHeader>
          <TravelIntelligence 
            data={intelligenceData} 
            category={searchQuery ? `Search for ${searchQuery}` : activeCategory} 
            isLoading={isLoading}
            onUserSpeakingChange={setIsUserSpeaking}
          />
        </SheetContent>
      </Sheet>

      <Navigation onCategoryClick={handleCategoryClick} />

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-8 p-4 rounded-full bg-primary text-white shadow-2xl transition-all duration-300 z-50 hover:scale-110",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <ArrowUp size={24} />
      </button>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.2);
        }
      `}</style>
    </div>
  );
}
