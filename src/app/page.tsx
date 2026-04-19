
"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TravelIntelligence } from "@/components/TravelIntelligence";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell, Sparkles, ChevronDown } from "lucide-react";
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

const COUNTRIES = [
  { code: "in", name: "India" },
  { code: "us", name: "USA" },
  { code: "gb", name: "UK" },
  { code: "jp", name: "Japan" },
  { code: "ae", name: "UAE" },
  { code: "au", name: "Australia" },
];

export default function Home() {
  const [intelligenceData, setIntelligenceData] = useState<JourneyIntelligenceOutput | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("World");
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCategoryClick = async (category: string) => {
    setActiveCategory(category);
    // When category is clicked, we also trigger the detailed intelligence slide-out
    setIsSheetOpen(true);
    setIsLoading(true);
    setIntelligenceData(null);
    try {
      const result = await getJourneyIntelligence({ category: `${category} in ${activeCountry.name}` });
      setIntelligenceData(result);
    } catch (error) {
      console.error("Agentic intelligence failure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconClick = (feature: string) => {
    toast({
      title: `${feature} Coming Soon`,
      description: "We're currently perfecting your personal news dashboard.",
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-background/50">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-primary/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
              GM
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tighter">
              G newsMola
            </h1>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8 gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Explore headlines..." 
                className="w-full bg-white/50 border border-primary/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full border-primary/10 bg-white/50 gap-2">
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
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleIconClick("Notifications")}
              className="p-2 rounded-full hover:bg-white/50 text-primary transition-colors relative"
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-8">
            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
              <GitaWisdom />
            </section>
            
            <div className="p-6 rounded-3xl glass-dark text-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center gap-2 font-headline font-bold">
                <MapPin className="text-secondary" /> Local Expedition
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                Stay updated on your local surroundings in {activeCountry.name}. Your news feed is currently optimized for this region.
              </p>
              <button 
                onClick={() => handleIconClick("Itinerary")}
                className="w-full py-2 rounded-xl bg-secondary text-primary font-bold hover:scale-105 transition-transform"
              >
                Set Preferences
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 space-y-8">
            <NewsBriefs category={activeCategory} country={activeCountry.name} />
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
            category={activeCategory} 
            isLoading={isLoading} 
          />
        </SheetContent>
      </Sheet>

      <Navigation onCategoryClick={handleCategoryClick} isProcessing={isLoading} />
    </div>
  );
}
