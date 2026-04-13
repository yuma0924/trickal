import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { SidebarCharacters } from "@/components/layout/sidebar-characters";
import { createAdminClient } from "@/lib/supabase/admin";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-maru-gothic",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1523",
};

export const metadata: Metadata = {
  title: "みんなで決めるトリッカルランキング",
  description:
    "トリッカル・もちもちほっぺ大作戦の全キャラクター性能を数値で比較し、プレイヤーの投票でリアルな順位を決定する非公式データベースです。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createAdminClient();
  const { data: characters } = await supabase
    .from("characters")
    .select("id, slug, name, element, image_url")
    .eq("is_hidden", false)
    .order("name");

  return (
    <html lang="ja" className={`dark ${zenMaruGothic.variable}`} suppressHydrationWarning>
      <body className={zenMaruGothic.className}>
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <NavigationProgress />
            <ScrollToTop />
            <Header characters={characters ?? []} />
            <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-12 md:px-8 md:pt-6 md:pb-16 lg:grid lg:grid-cols-[1fr_240px] lg:gap-6">
              <main className="bg-bg-primary">
                {children}
              </main>
              <aside className="hidden lg:block">
                <div className="space-y-4">
                  <div className="flex h-[600px] items-center justify-center rounded-2xl border border-border-primary bg-bg-card">
                    <span className="text-xs text-text-muted">AD</span>
                  </div>
                  <SidebarCharacters characters={characters ?? []} />
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
