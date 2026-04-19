"use client";

import { Home, Compass, BookOpen, User, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: MapPin, label: "Destinations", href: "/destinations" },
  { icon: BookOpen, label: "Dharma", href: "/wisdom" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="pill-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:bg-white/40",
              isActive ? "bg-primary text-primary-foreground shadow-md scale-110" : "text-primary/70"
            )}
            title={item.label}
          >
            <Icon size={20} />
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
