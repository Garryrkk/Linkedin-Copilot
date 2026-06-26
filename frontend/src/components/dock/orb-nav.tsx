"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Orbit, ScanLine, Network, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Mission Control", icon: Orbit },
  { href: "/analyze", label: "Analyze Post", icon: ScanLine },
  { href: "/strategy", label: "Strategy Center", icon: Network },
  { href: "/comments", label: "Comment Lab", icon: MessageSquareText },
];

export function OrbNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="glass-panel-strong flex items-center gap-2 rounded-full px-3 py-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link key={href} href={href} className="group relative">
              <motion.span
                whileHover={{ scale: 1.12, y: -4 }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
                  active
                    ? "border-accent-teal/60 bg-accent-teal/15 text-accent-teal"
                    : "border-white/10 bg-white/[0.03] text-highlight/70 hover:text-highlight"
                )}
              >
                <Icon size={18} strokeWidth={1.75} />
                {active && (
                  <motion.span
                    layoutId="orb-nav-active"
                    className="absolute inset-0 rounded-full ring-1 ring-accent-teal/40 animate-pulse-glow"
                  />
                )}
              </motion.span>
              <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-[11px] text-highlight opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
