import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeaderSearch, type SearchCharacter } from "@/components/layout/header-search";

interface HeaderProps {
  characters: SearchCharacter[];
}

export function Header({ characters }: HeaderProps) {
  return (
    <header className="bg-bg-primary pt-[env(safe-area-inset-top)] shadow-lg shadow-black/10">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="トリッカルランキング"
            width={32}
            height={32}
            sizes="32px"
            loading="eager"
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
            <Link href="/tiers" className="text-sm md:text-base text-text-secondary hover:text-text-primary transition-colors">
              ティア
            </Link>
          </div>
          <HeaderSearch characters={characters} />
          <ThemeToggle />
        </nav>
      </div>
      {/* Gradient bottom border */}
      <div
        className="h-px w-full"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(224,90,168,0.4) 30%, rgba(240,138,154,0.3) 70%, transparent 100%)",
        }}
      />
    </header>
  );
}
