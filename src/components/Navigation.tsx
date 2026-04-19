
"use client";

import { Globe, Cpu, Coins, Trophy, Film } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Globe, label: "World", href: "/world" },
  { icon: Cpu, label: "Tech", href: "/tech" },
  { icon: Coins, label: "Finance", href: "/finance" },
  { icon: Trophy, label: "Sports", href: "/sports" },
  { icon: Film, label: "Entertainment", href: "/entertainment" },
];

interface NavigationProps {
  onCategoryClick?: (category: string) => void;
  activeCategory: string;
}

export function Navigation({ onCategoryClick, activeCategory }: NavigationProps) {
  const handleClick = (label: string, e: React.MouseEvent) => {
    if (onCategoryClick) {
      e.preventDefault();
      onCategoryClick(label);
    }
  };

  return (
    <nav className="flex items-center gap-2 p-2 rounded-[2rem] glass z-50 shadow-2xl border-white/60 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.label;

        return (
          <button
            key={item.label}
            onClick={(e) => handleClick(item.label, e)}
            className={cn(
              "flex items-center gap-2 py-2 px-4 rounded-[1.5rem] transition-all duration-500 group relative",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/60"
            )}
          >
            <Icon size={18} className={cn(
              "transition-all duration-500",
              isActive ? "text-primary" : "group-hover:text-primary"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-500",
              isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            )}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full animate-in fade-in zoom-in" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
