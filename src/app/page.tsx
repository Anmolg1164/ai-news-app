import { Navigation } from "@/components/Navigation";
import { TravelIntelligence } from "@/components/TravelIntelligence";
import { GitaWisdom } from "@/components/GitaWisdom";
import { NewsBriefs } from "@/components/NewsBriefs";
import { MapPin, Search, Bell } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-primary/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              DN
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">
              Dharma Navigator
            </h1>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search journey insights..." 
                className="w-full bg-white/50 border border-primary/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-white/50 text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary shadow-sm">
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
          
          {/* Left Column: Intelligence & Wisdom */}
          <aside className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
              <TravelIntelligence />
            </section>
            
            <section className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
              <GitaWisdom />
            </section>

            <div className="p-6 rounded-3xl glass-dark text-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center gap-2 font-headline font-bold">
                <MapPin className="text-secondary" /> Upcoming Expedition
              </div>
              <p className="text-sm opacity-80">
                You have a flight to Varanasi in 4 days. Would you like to check local weather or see related Gita verses for pilgrimage?
              </p>
              <button className="w-full py-2 rounded-xl bg-secondary text-primary font-bold hover:scale-105 transition-transform">
                Review Itinerary
              </button>
            </div>
          </aside>

          {/* Right Column: Main Content (News Briefs) */}
          <section className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl glass mb-12">
              <Image 
                src="https://picsum.photos/seed/hero-journey/1200/400" 
                alt="Hero Travel Image" 
                fill 
                className="object-cover opacity-90 brightness-75 transition-transform duration-10000 hover:scale-110"
                data-ai-hint="spiritual journey"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-8 text-white">
                <h2 className="text-4xl font-headline font-bold mb-2">Charting Your Path</h2>
                <p className="text-lg opacity-90 max-w-lg font-light">
                  Combine modern travel precision with ancient spiritual clarity.
                </p>
              </div>
            </div>

            <NewsBriefs />
          </section>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
