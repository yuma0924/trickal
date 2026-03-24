"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TIER_LABELS } from "@/lib/constants";
import type { TierLabel } from "@/lib/constants";
import { TierRow } from "@/components/tier/tier-row";
import { TierLikeButton } from "@/components/tier/tier-like-button";

type CharacterData = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
};

interface TierDetailClientProps {
  tier: {
    id: string;
    title: string | null;
    display_name: string | null;
    data: Record<string, string[]>;
    likes_count: number;
    created_at: string;
  };
  characters: Record<string, CharacterData>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP");
}

export function TierDetailClient({
  tier: initialTier,
  characters,
}: TierDetailClientProps) {
  const [tier, setTier] = useState(initialTier);
  const [userLiked, setUserLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // 初期状態取得
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/tiers/${tier.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserLiked(data.tier.user_liked);
          setIsOwner(data.tier.is_owner);
        }
      } catch {
        // ignore
      }
    }
    fetchStatus();
  }, [tier.id]);

  const handleToggleLike = async () => {
    try {
      const res = await fetch(`/api/tiers/${tier.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reaction_type: userLiked ? null : "up",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setTier((prev) => ({ ...prev, likes_count: data.likes_count }));
      setUserLiked(data.user_liked);
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!confirm("このティアを削除しますか？")) return;
    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleted(true);
      }
    } catch {
      // ignore
    }
  };

  if (deleted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">ティアを削除しました</p>
        <Link
          href="/tiers"
          className="text-sm text-accent hover:underline"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 pl-2 text-xl font-bold text-text-primary">
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="0.5" width="3" height="3" rx="0.5" fill="#ef4444" />
            <rect x="4" y="0.5" width="12" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
            <rect x="0" y="4.5" width="3" height="3" rx="0.5" fill="#f97316" />
            <rect x="4" y="4.5" width="9" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
            <rect x="0" y="8.5" width="3" height="3" rx="0.5" fill="#eab308" />
            <rect x="4" y="8.5" width="6" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
            <rect x="0" y="12.5" width="3" height="3" rx="0.5" fill="#22c55e" />
            <rect x="4" y="12.5" width="4" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
          </svg>
          {tier.title || "無題のティア"}
        </h1>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="mr-2 shrink-0 rounded-lg border border-border-primary bg-bg-tertiary px-2.5 py-1 text-xs text-text-muted transition-colors hover:text-thumbs-down hover:border-thumbs-down/30 cursor-pointer"
          >
            削除
          </button>
        )}
      </div>

      {/* ティア表 */}
      <div className="overflow-hidden rounded-2xl border border-border-primary bg-bg-card">
        {TIER_LABELS.map((label) => {
          const charIds = tier.data[label] ?? [];
          const charData = charIds
            .map((id) => characters[id])
            .filter((c): c is CharacterData => !!c);
          return (
            <TierRow
              key={label}
              label={label as TierLabel}
              characters={charData.map((c) => ({
                id: c.id,
                name: c.name,
                image_url: c.image_url,
              }))}
              iconClassName="h-14 w-14"
            />
          );
        })}
        {/* フッター */}
        <div className="flex items-center justify-between border-t border-border-primary bg-bg-tertiary/50 px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {tier.display_name && <span>by {tier.display_name}</span>}
            <span>{formatDate(tier.created_at)}</span>
          </div>
          <TierLikeButton
            likesCount={tier.likes_count}
            userLiked={userLiked}
            onToggle={handleToggleLike}
          />
        </div>
      </div>

      {/* ティア一覧へ戻る */}
      <Link
        href="/tiers"
        className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-border-primary bg-bg-card py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
          <rect x="0" y="0.5" width="3" height="3" rx="0.5" fill="#ef4444" />
          <rect x="4" y="0.5" width="12" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
          <rect x="0" y="4.5" width="3" height="3" rx="0.5" fill="#f97316" />
          <rect x="4" y="4.5" width="9" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
          <rect x="0" y="8.5" width="3" height="3" rx="0.5" fill="#eab308" />
          <rect x="4" y="8.5" width="6" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
          <rect x="0" y="12.5" width="3" height="3" rx="0.5" fill="#22c55e" />
          <rect x="4" y="12.5" width="4" height="3" rx="0.5" fill="currentColor" className="text-text-muted" />
        </svg>
        他のティア表を見る
      </Link>

      {/* 他のページもチェック */}
      <div className="mt-10 space-y-3">
        <p className="pl-1 text-sm font-bold text-text-primary">他のページもチェック</p>
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #ffb900, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs text-text-tertiary">投票で決まる最強キャラをチェック</span>
          </div>
        </Link>
        <Link
          href="/builds"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気編成ランキング</span>
            <span className="text-xs text-text-tertiary">人気のパーティ編成をチェック</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
