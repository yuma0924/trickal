import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-secondary pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link
            href="/guidelines"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            ガイドライン・利用規約
          </Link>
          <p className="text-xs text-text-tertiary leading-relaxed">
            トリッカル・もちもちほっぺ大作戦の全キャラクター性能を数値で比較し、プレイヤーの投票でリアルな順位を決定する非公式データベースです。
          </p>
          <p className="text-xs text-text-muted">
            &copy; 2026 トリッカルランキング. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
