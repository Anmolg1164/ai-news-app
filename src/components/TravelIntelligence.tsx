"use client";

import { Plane, Globe, ShieldCheck, Map, TrendingUp, Info, Sun, Coins, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type JourneyIntelligenceOutput } from "@/ai/flows/get-journey-intelligence";

interface TravelIntelligenceProps {
  data?: JourneyIntelligenceOutput | null;
}

const DEFAULT_INTELLIGENCE = [
  {
    category: "Visa Updates",
    title: "Schengen Area changes for 2025",
    icon: Globe,
    status: "Priority",
    color: "bg-blue-100 text-blue-700"
  },
  {
    category: "Security",
    title: "Health protocols for SEA travel",
    icon: ShieldCheck,
    status: "Updated",
    color: "bg-green-100 text-green-700"
  }
];

export function TravelIntelligence({ data }: TravelIntelligenceProps) {
  if (data) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
            <Map className="text-secondary" /> {data.country || "Global"} Insights
          </h2>
        </div>

        <div className="p-5 rounded-2xl glass border-primary/10 space-y-4">
          <p className="text-primary font-medium leading-relaxed">
            {data.summary}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {data.weather && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2">
                <Sun size={18} className="text-amber-600" />
                <span className="text-sm font-bold text-amber-900">{data.weather}</span>
              </div>
            )}
            {data.currency && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                <Coins size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">{data.currency}</span>
              </div>
            )}
          </div>

          {data.travelAlert && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5" />
              <p className="text-xs text-red-900 font-medium">{data.travelAlert}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
          <Plane className="text-secondary" /> Travel Intelligence
        </h2>
      </div>
      
      <div className="grid gap-4">
        {DEFAULT_INTELLIGENCE.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className="group p-4 rounded-xl glass hover:bg-white/50 transition-all duration-300 cursor-pointer border-transparent hover:border-white/40"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      {item.category}
                    </span>
                    <Badge variant="secondary" className={item.color}>
                      {item.status}
                    </Badge>
                  </div>
                  <h3 className="font-headline font-medium text-primary group-hover:translate-x-1 transition-transform">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-primary text-primary-foreground space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Info size={16} /> Quick Note
        </div>
        <p className="text-xs opacity-90 leading-relaxed">
          Select a navigation category to get real-time agentic insights for your next destination.
        </p>
      </div>
    </div>
  );
}
