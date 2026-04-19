"use client";

import { Plane, Globe, ShieldCheck, Map, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const intelligence = [
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
  },
  {
    category: "Insights",
    title: "Rising spiritual retreats in Himalayas",
    icon: TrendingUp,
    status: "Trending",
    color: "bg-purple-100 text-purple-700"
  }
];

export function TravelIntelligence() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
          <Plane className="text-secondary" /> Travel Intelligence
        </h2>
      </div>
      
      <div className="grid gap-4">
        {intelligence.map((item, idx) => {
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
          Your travel patterns suggest a growing interest in coastal meditation retreats. Check out our latest guides for Kerala and Bali.
        </p>
      </div>
    </div>
  );
}
