"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg-primary/90 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="トリッカルランキング"
            width={32}
            height={32}
            className="rounded-[10px]"
          />
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
