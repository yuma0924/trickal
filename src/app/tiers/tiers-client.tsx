"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TierCard } from "@/components/tier/tier-card";
import { Button } from "@/components/ui/button";

type CharacterData = {
  id: string;
  name: string;
  image_url: string | null;
};

type TierItem = {
  id: string;
  title: string | null;
  display_name: string | null;
  data: Record<string, string[]>;
  likes_count: number;
  user_liked: boolean;
  created_at: string;
};

type SortType = "popular" | "newest";

const SORT_TABS: { value: SortType; label: string }[] = [
  { value: "popular", label: "人気順" },
  { value: "newest", label: "新着順" },
];

interface TiersClientProps {
  characters: Record<string, CharacterData>;
}

export function TiersClient({ characters }: TiersClientProps) {
  const [tiers, setTiers] = useState<TierItem[]>([]);
  const [sort, setSort] = useState<SortType>("popular");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchTiers = useCallback(
    async (cursorId?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort });
        if (cursorId) params.set("cursor", cursorId);

        const res = await fetch(`/api/tiers?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (cursorId) {
          setTiers((prev) => [...prev, ...data.tiers]);
        } else {
          setTiers(data.tiers);
        }
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [sort]
  );

  useEffect(() => {
    setTiers([]);
    setNextCursor(null);
    setHasMore(false);
    setLoaded(false);
    fetchTiers();
  }, [fetchTiers]);

  const handleToggleLike = async (tierId: string) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return;

    try {
      const res = await fetch(`/api/tiers/${tierId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reaction_type: tier.user_liked ? null : "up",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTiers((prev) =>
        prev.map((t) =>
          t.id === tierId
            ? { ...t, likes_count: data.likes_count, user_liked: data.user_liked }
            : t
        )
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* 新規作成 + ソート */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSort(tab.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs md:text-sm font-medium transition-colors cursor-pointer",
                sort === tab.value
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          href="/tiers/new"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#ec4899] px-4 py-2 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          作成する
        </Link>
      </div>

      {/* ティア一覧 */}
      {loaded && tiers.length === 0 && !loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-tertiary">
            まだティアが投稿されていません
          </p>
          <Link
            href="/tiers/new"
            className="mt-3 inline-block rounded-xl bg-gradient-to-r from-[#a855f7] to-[#ec4899] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
          >
            最初のティアを作成する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              id={tier.id}
              title={tier.title}
              displayName={tier.display_name}
              data={tier.data}
              likesCount={tier.likes_count}
              userLiked={tier.user_liked}
              createdAt={tier.created_at}
              characters={characters}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>
      )}

      {/* もっと見る */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (nextCursor) fetchTiers(nextCursor);
            }}
            disabled={loading}
          >
            {loading ? "読み込み中..." : "もっと見る"}
          </Button>
        </div>
      )}

      {loading && !loaded && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {/* 他のランキングもチェック */}
      <section className="mt-10 space-y-3">
        <p className="text-sm md:text-base font-bold text-text-primary">他のランキングもチェック</p>
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #ffb900, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs md:text-sm text-text-muted">投票で決まる最強キャラをチェック</span>
          </div>
          <svg className="h-5 w-5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/builds"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block font-bold text-text-primary">編成ランキング</span>
            <span className="text-xs md:text-sm text-text-muted">みんなのおすすめ編成を見てみよう</span>
          </div>
          <svg className="h-5 w-5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
