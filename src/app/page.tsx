"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell, ChevronDown, ArrowUp, Languages, User, Settings, Bookmark, LogOut, Library } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  const [activeCategory, setActiveCategory] = useState<string>("World");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [activeLanguage, setActiveLanguage] = useState(LANGUAGES[0]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  
  const newsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
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
    if (newsScrollRef.current) {
      newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      setSearchQuery(searchInput);
      setActiveCategory("Discovery");
      setShowSavedOnly(false);
      if (newsScrollRef.current) {
        newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const scrollToTop = () => {
    if (newsScrollRef.current) {
      newsScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleLibrary = () => {
    setShowSavedOnly(!showSavedOnly);
    if (!showSavedOnly) {
      toast({ title: "Library View", description: "Showing your saved articles." });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative" suppressHydrationWarning>
      <header className="z-40 glass border-b border-white/40 flex-shrink-0" suppressHydrationWarning>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-primary/30 group-hover:rotate-6 transition-all duration-500 cursor-pointer relative overflow-hidden">
               <Image 
                src="https://picsum.photos/seed/user_profile/400/400" 
                alt="Logo" 
                fill
                className="object-cover"
                data-ai-hint="user logo"
              />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter leading-none">
                G newsMola
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-muted-foreground opacity-60">
                  Dharma Intelligence
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-xl mx-8 gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" size={16} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="What's the vibe?" 
                className="w-full bg-white/50 border border-primary/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-sm font-medium text-xs"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-white/60 bg-white/50 gap-2 h-9 px-3 hover:bg-white shadow-sm transition-all" suppressHydrationWarning>
                    <MapPin size={14} className="text-secondary" />
                    <span className="text-[10px] font-bold tracking-tight">{activeCountry.name}</span>
                    <ChevronDown size={10} className="opacity-40" />
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
                  <Button variant="outline" className="rounded-xl border-white/60 bg-white/50 gap-2 h-9 px-3 hover:bg-white shadow-sm transition-all" suppressHydrationWarning>
                    <Languages size={14} className="text-accent" />
                    <span className="text-[10px] font-bold tracking-tight">{activeLanguage.name}</span>
                    <ChevronDown size={10} className="opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/60 min-w-[150px] p-1 rounded-xl">
                  {LANGUAGES.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => setActiveLanguage(l)}
                      className="cursor-pointer font-bold py-2 px-3 rounded-lg m-0.5 hover:bg-accent/5 text-accent text-xs"
                    >
                      {l.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLibrary} className={cn("relative group p-2 rounded-xl transition-all", showSavedOnly ? "bg-accent/20" : "hover:bg-white")} suppressHydrationWarning>
              <Library size={20} className={cn("transition-colors", showSavedOnly ? "text-accent" : "text-muted-foreground group-hover:text-primary")} />
              {showSavedOnly && <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white shadow-sm" />}
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-xl cursor-pointer hover:ring-4 hover:ring-primary/10 transition-all hover:scale-105">
                  <Image 
                    src="https://picsum.photos/seed/usergenz/200/200" 
                    alt="Profile" 
                    width={36} 
                    height={36}
                    className="object-cover"
                    data-ai-hint="user avatar"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-white/60 min-w-[200px] p-2 rounded-2xl mr-4">
                <DropdownMenuLabel className="font-headline text-primary font-bold px-4 py-3">Founder Profile</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/5" />
                <DropdownMenuItem className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-primary/5 gap-3">
                  <User size={18} /> My Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLibrary} className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-primary/5 gap-3">
                  <Bookmark size={18} /> Saved Reports
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-primary/5 gap-3">
                  <Settings size={18} /> Engine Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-primary/5" />
                <DropdownMenuItem className="cursor-pointer font-bold py-3 px-4 rounded-xl m-1 hover:bg-destructive/5 text-destructive gap-3">
                  <LogOut size={18} /> Shutdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full py-4">
          <aside className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar hidden lg:block animate-in fade-in slide-in-from-left-10 duration-1000">
            <GitaWisdom />
            
            <div className="p-6 rounded-[2.5rem] glass-dark text-white space-y-4 relative overflow-hidden group hover:glow-secondary transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/30 rounded-full blur-[80px] group-hover:scale-150 transition-all duration-1000" />
              <h3 className="flex items-center gap-3 font-headline font-bold text-xl">
                Dharma Verified
              </h3>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                Browsing <span className="text-secondary font-bold tracking-tight">{activeCountry.name}</span> in <span className="text-secondary font-bold tracking-tight">{activeLanguage.name}</span>.
              </p>
              <button 
                onClick={toggleLibrary}
                className="w-full py-4 rounded-2xl bg-secondary text-slate-900 text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg" 
                suppressHydrationWarning
              >
                {showSavedOnly ? "Back to Feed" : "View My Library"}
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 h-full overflow-hidden flex flex-col relative bento-card">
            <NewsBriefs 
              category={activeCategory} 
              searchQuery={searchQuery}
              country={activeCountry.name} 
              language={activeLanguage.name}
              showSavedOnly={showSavedOnly}
              onScroll={handleScroll}
              ref={newsScrollRef}
            />
            
            <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <Navigation onCategoryClick={handleCategoryClick} activeCategory={activeCategory} />
              </div>
            </div>
          </section>
        </div>
      </main>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-12 p-4 rounded-xl bg-primary text-white shadow-2xl transition-all duration-700 z-50 hover:scale-110 active:scale-90 hover:glow-primary",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-32 pointer-events-none"
        )}
        suppressHydrationWarning
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
}
