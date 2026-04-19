"use client";

import { Globe, Cpu, Coins, Trophy, Film } from "lucide-react";
import { usePathname } from "next/navigation";
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
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-3 rounded-[2.5rem] glass z-50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-white/60 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.label;

        return (
          <button
            key={item.label}
            onClick={(e) => handleClick(item.label, e)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[85px] py-3 px-2 rounded-[2rem] transition-all duration-500 group relative",
              isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-white/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500",
              isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "group-hover:scale-110 group-hover:text-primary"
            )}>
              <Icon size={22} />
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-[0.15em] mt-2 transition-all duration-500",
              isActive ? "opacity-100 transform translate-y-0" : "opacity-40 group-hover:opacity-100 group-hover:translate-y-[-2px]"
            )}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in" />
            )}
          </button>
        );
      })}
    </nav>
  );
}