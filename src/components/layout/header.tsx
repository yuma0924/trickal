"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg-primary/90 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[14px] text-sm font-bold text-white shadow-[0_10px_15px_rgba(246,51,154,0.2),0_4px_6px_rgba(246,51,154,0.2)] transition-shadow duration-200 group-hover:shadow-[0_10px_20px_rgba(246,51,154,0.35),0_4px_8px_rgba(246,51,154,0.3)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #fb64b6 0%, #ffa1ad 100%)",
            }}
          >
            T
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold leading-none text-accent/80">
              みんなで決める！
            </span>
            <span className="text-[15px] font-bold leading-none text-text-primary">
              トリッカルランキング
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
        </nav>
      </div>
      {/* Gradient bottom border */}
      <div
        className="h-px w-full"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, #fb64b6 30%, #ffa1ad 70%, transparent 100%)",
        }}
      />
    </header>
  );
}
