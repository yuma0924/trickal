"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-text">
            T
          </span>
          <span className="text-sm font-bold text-text-primary">
            みんなで決める！
            <br className="sm:hidden" />
            トリッカルランキング
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
