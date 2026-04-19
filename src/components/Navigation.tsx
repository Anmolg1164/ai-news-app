"use client";

import { Globe, Cpu, Coins, Trophy, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: Globe, label: "World", href: "/world" },
  { icon: Cpu, label: "Tech", href: "/tech" },
  { icon: Coins, label: "Finance", href: "/finance" },
  { icon: Trophy, label: "Sports", href: "/sports" },
  { icon: Film, label: "Entertainment", href: "/entertainment" },
];

interface NavigationProps {
  onCategoryClick?: (category: string) => void;
}

export function Navigation({ onCategoryClick }: NavigationProps) {
  const [activeCategory, setActiveCategory] = useState<string>("World");

  const handleClick = (label: string, e: React.MouseEvent) => {
    if (onCategoryClick) {
      e.preventDefault();
      setActiveCategory(label);
      onCategoryClick(label);
    }
  };

  return (
    <nav className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-[3rem] glass z-50 shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-white/60 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.label;

        return (
          <button
            key={item.label}
            onClick={(e) => handleClick(item.label, e)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[95px] py-4 px-2 rounded-[2.5rem] transition-all duration-500 group relative",
              isActive ? "text-primary bg-primary/5 shadow-inner" : "text-muted-foreground hover:bg-white/60"
            )}
          >
            <div className={cn(
              "w-14 h-14 flex items-center justify-center rounded-[1.2rem] transition-all duration-500",
              isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/40 rotate-3" : "group-hover:scale-110 group-hover:text-primary"
            )}>
              <Icon size={26} />
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] mt-3 transition-all duration-500",
              isActive ? "opacity-100 transform translate-y-0" : "opacity-40 group-hover:opacity-100 group-hover:translate-y-[-2px]"
            )}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-2 w-2 h-2 bg-secondary rounded-full animate-in fade-in zoom-in" />
            )}
          </button>
        );
      })}
    </nav>
  );
}