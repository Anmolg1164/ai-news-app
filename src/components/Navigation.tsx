"use client";

import { Home, Compass, BookOpen, User, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: MapPin, label: "Destinations", href: "/destinations" },
  { icon: BookOpen, label: "Dharma", href: "/wisdom" },
  { icon: User, label: "Profile", href: "/profile" },
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
    <nav className="pill-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isThisProcessing = isProcessing && activeCategory === item.label;

        return (
          <button
            key={item.href}
            onClick={(e) => handleClick(item.label, e)}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:bg-white/40 relative",
              isActive ? "bg-primary text-primary-foreground shadow-md scale-110" : "text-primary/70"
            )}
            disabled={isProcessing}
            title={item.label}
          >
            {isThisProcessing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Icon size={20} />
            )}
            <span className="sr-only">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
