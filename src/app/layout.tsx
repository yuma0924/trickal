import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-maru-gothic",
});

export const metadata: Metadata = {
  title: "みんなで決めるトリッカルランキング",
  description:
    "トリッカル・もちもちほっぺ大作戦の全キャラクター性能を数値で比較し、プレイヤーの投票でリアルな順位を決定する非公式データベースです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`dark ${zenMaruGothic.variable}`} suppressHydrationWarning>
      <body className={zenMaruGothic.className}>
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <Header />
            <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 md:px-8 md:py-6 lg:grid lg:grid-cols-[1fr_240px] lg:gap-6">
              <main>
                {children}
              </main>
              <aside className="hidden lg:block">
                <div className="sticky top-20 space-y-4">
                  <div className="flex h-[600px] items-center justify-center rounded-2xl border border-border-primary bg-bg-card">
                    <span className="text-xs text-text-muted">AD</span>
                  </div>
                </div>
              </aside>
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
