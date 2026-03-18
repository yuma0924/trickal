"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const THRESHOLD = 10;
    const onScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      // 差分が閾値未満なら無視（バウンス・微小スクロール対策）
      if (Math.abs(diff) < THRESHOLD) return;

      // ページ最下部付近では常に表示
      const atBottom = window.innerHeight + currentY >= document.documentElement.scrollHeight - 10;

      if (diff > 0 && currentY > 56 && !atBottom) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 bg-bg-primary/90 shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-300"
      style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="トリッカルランキング"
            width={32}
            height={32}
            className="rounded-[10px]"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-[9px] md:text-[11px] font-bold leading-none text-accent/80">
              みんなで決める！
            </span>
            <span className="text-[15px] md:text-lg font-bold leading-none text-text-primary">
              トリッカルランキング
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-4 mr-4">
            <Link href="/ranking" className="text-sm md:text-base text-text-secondary hover:text-text-primary transition-colors">
              ランキング
            </Link>
            <Link href="/builds" className="text-sm md:text-base text-text-secondary hover:text-text-primary transition-colors">
              編成
            </Link>
          </div>
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
