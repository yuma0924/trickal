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
      <div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-text-primary">
            {tier.title || "無題のティア"}
          </h1>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-[42px] text-xs text-text-muted">
          {tier.display_name && <span>by {tier.display_name}</span>}
          <span>{formatDate(tier.created_at)}</span>
        </div>
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
            />
          );
        })}
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between">
        <TierLikeButton
          likesCount={tier.likes_count}
          userLiked={userLiked}
          onToggle={handleToggleLike}
        />
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={handleDelete}
              className="rounded-full border border-border-primary px-3 py-1 text-xs text-text-muted transition-colors hover:border-thumbs-down/30 hover:text-thumbs-down cursor-pointer"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {/* ナビリンク */}
      <div className="mt-10 space-y-3">
        <p className="pl-1 text-sm font-bold text-text-primary">他のページもチェック</p>
        <Link
          href="/tiers"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">ティアメーカー一覧</span>
            <span className="text-xs text-text-tertiary">他のティア表も見てみよう</span>
          </div>
        </Link>
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
      </div>
    </div>
  );
}
