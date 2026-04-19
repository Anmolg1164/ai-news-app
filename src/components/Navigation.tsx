
"use client";

import { Globe, Cpu, Coins, Trophy, Film, Loader2 } from "lucide-react";
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
  onCategoryClick?: (category: string) => Promise<void>;
  isProcessing?: boolean;
}

export function Navigation({ onCategoryClick, isProcessing }: NavigationProps) {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleClick = async (label: string, e: React.MouseEvent) => {
    if (onCategoryClick) {
      e.preventDefault();
      setActiveCategory(label);
      await onCategoryClick(label);
      setActiveCategory(null);
    }
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 rounded-[2rem] glass z-50 shadow-2xl border-white/40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isThisProcessing = isProcessing && activeCategory === item.label;

        return (
          <button
            key={item.label}
            onClick={(e) => handleClick(item.label, e)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[70px] py-2 px-1 rounded-2xl transition-all duration-300 hover:bg-white/40 group relative",
              activeCategory === item.label ? "bg-primary/10 text-primary" : "text-primary/60"
            )}
            disabled={isProcessing}
          >
            <div className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300",
              activeCategory === item.label ? "bg-primary text-white scale-110 shadow-lg" : "group-hover:scale-110"
            )}>
              {isThisProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Icon size={20} />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter mt-1 opacity-80 group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
