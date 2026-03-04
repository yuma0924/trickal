import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-primary bg-bg-secondary pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[14px] text-xs font-bold text-white shadow-[0_10px_15px_rgba(246,51,154,0.2),0_4px_6px_rgba(246,51,154,0.2)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fb64b6 0%, #ffa1ad 100%)",
              }}
            >
              T
            </span>
            <span className="text-base font-bold text-text-primary">
              トリッカルランキング
            </span>
          </div>
          <p className="text-sm leading-relaxed text-text-tertiary">
            トリッカル・もちもちほっぺ大作戦の全キャラクター性能を数値で比較し、プレイヤーの投票でリアルな順位を決定する非公式データベースです。
          </p>
          <Link
            href="/guidelines"
            className="text-base font-medium text-text-tertiary transition-colors hover:text-accent"
          >
            ガイドライン・利用規約
          </Link>
          <div className="mt-2 w-full border-t border-border-secondary pt-4">
            <p className="text-xs text-text-muted">
              &copy; 2026 トリッカルランキング. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
