"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TIER_LABELS, ELEMENTS } from "@/lib/constants";
import type { TierLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TierRow } from "@/components/tier/tier-row";
import { TierCharacterItem } from "@/components/tier/tier-character-item";
import { CharacterIcon } from "@/components/character/character-icon";
import { Button } from "@/components/ui/button";

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
};

type TierState = Record<TierLabel | "unassigned", string[]>;

interface TierCreateClientProps {
  characters: CharacterInfo[];
}

export function TierCreateClient({ characters }: TierCreateClientProps) {
  const router = useRouter();
  const charMap = new Map(characters.map((c) => [c.id, c]));

  const [tierState, setTierState] = useState<TierState>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
    unassigned: characters.map((c) => c.id),
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フィルター
  const [elementFilter, setElementFilter] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const findContainer = useCallback(
    (id: string): TierLabel | "unassigned" | null => {
      for (const [key, items] of Object.entries(tierState)) {
        if (items.includes(id)) {
          return key as TierLabel | "unassigned";
        }
      }
      return null;
    },
    [tierState]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    if (!activeContainer) return;

    // ドロップ先がコンテナ自体か、コンテナ内のアイテムか
    let overContainer: TierLabel | "unassigned" | null = null;

    // over.id がコンテナ名の場合
    const allContainerKeys = [...TIER_LABELS, "unassigned"] as const;
    if ((allContainerKeys as readonly string[]).includes(over.id as string)) {
      overContainer = over.id as TierLabel | "unassigned";
    } else {
      // over.id がアイテムID の場合、そのアイテムのコンテナを探す
      overContainer = findContainer(over.id as string);
    }

    if (!overContainer || activeContainer === overContainer) return;

    setTierState((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.indexOf(active.id as string);
      activeItems.splice(activeIndex, 1);

      // ドロップ先アイテムの位置に挿入
      const overId = over.id as string;
      const overIndex = overItems.indexOf(overId);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, active.id as string);
      } else {
        overItems.push(active.id as string);
      }

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    if (!activeContainer) return;

    const allContainerKeys = [...TIER_LABELS, "unassigned"] as const;
    let overContainer: TierLabel | "unassigned" | null = null;

    if ((allContainerKeys as readonly string[]).includes(over.id as string)) {
      overContainer = over.id as TierLabel | "unassigned";
    } else {
      overContainer = findContainer(over.id as string);
    }

    if (!overContainer) return;

    if (activeContainer === overContainer) {
      // 同一コンテナ内での並べ替え
      setTierState((prev) => {
        const items = [...prev[activeContainer]];
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          items.splice(oldIndex, 1);
          items.splice(newIndex, 0, active.id as string);
        }

        return { ...prev, [activeContainer]: items };
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);

    const data: Record<string, string[]> = {};
    let totalChars = 0;
    for (const label of TIER_LABELS) {
      if (tierState[label].length > 0) {
        data[label] = tierState[label];
        totalChars += tierState[label].length;
      }
    }

    if (totalChars === 0) {
      setError("キャラクターを1体以上配置してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          title: title.trim() || undefined,
          display_name: displayName.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "投稿に失敗しました");
        return;
      }

      router.push(`/tiers/${result.tier.id}`);
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  // フィルタリングされた unassigned キャラ
  const filteredUnassigned = tierState.unassigned.filter((id) => {
    const char = charMap.get(id);
    if (!char) return false;
    if (elementFilter && char.element !== elementFilter) return false;
    return true;
  });

  const activeChar = activeId ? charMap.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* 投稿フォーム */}
        <div className="space-y-3 rounded-2xl border border-border-primary bg-bg-card p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル（任意）"
            maxLength={100}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名前（任意）"
            maxLength={50}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* ティア行 */}
        <div className="overflow-hidden rounded-2xl border border-border-primary bg-bg-card">
          {TIER_LABELS.map((label) => (
            <TierRow
              key={label}
              label={label}
              characters={tierState[label].map((id) => {
                const c = charMap.get(id);
                return {
                  id,
                  name: c?.name ?? "不明",
                  image_url: c?.image_url ?? null,
                };
              })}
              isDraggable
            />
          ))}
        </div>

        {/* 未配置キャラパネル */}
        <UnassignedPanel
          filteredIds={filteredUnassigned}
          allUnassignedIds={tierState.unassigned}
          charMap={charMap}
          elementFilter={elementFilter}
          onElementFilterChange={setElementFilter}
        />

        {/* 投稿ボタン */}
        {error && (
          <p className="text-sm text-thumbs-down">{error}</p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "投稿中..." : "ティアを投稿する"}
        </Button>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeChar && (
          <div className="flex flex-col items-center gap-0.5 opacity-80">
            <CharacterIcon
              name={activeChar.name}
              imageUrl={activeChar.image_url}
              size="sm"
            />
            <span className="max-w-12 truncate text-center text-[9px] text-text-muted">
              {activeChar.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function UnassignedPanel({
  filteredIds,
  allUnassignedIds,
  charMap,
  elementFilter,
  onElementFilterChange,
}: {
  filteredIds: string[];
  allUnassignedIds: string[];
  charMap: Map<string, { id: string; name: string; element: string | null; image_url: string | null }>;
  elementFilter: string | null;
  onElementFilterChange: (v: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div
      className="rounded-2xl border border-border-primary bg-bg-card p-4"
      style={{
        backgroundColor: isOver ? "rgba(251, 100, 182, 0.05)" : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">
          未配置キャラ ({allUnassignedIds.length})
        </span>
      </div>

      {/* フィルター */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onElementFilterChange(null)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors",
              elementFilter === null
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border-primary text-text-muted hover:text-text-secondary"
            )}
          >
            全て
          </button>
          {ELEMENTS.map((el) => (
            <button
              key={el}
              onClick={() => onElementFilterChange(elementFilter === el ? null : el)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors",
                elementFilter === el
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border-primary text-text-muted hover:text-text-secondary"
              )}
            >
              {el}
            </button>
          ))}
        </div>
      </div>

      {/* キャラグリッド */}
      <div
        ref={setNodeRef}
        className="grid grid-cols-6 gap-1 md:grid-cols-10"
      >
        <SortableContext items={filteredIds} strategy={rectSortingStrategy}>
          {filteredIds.map((id) => {
            const char = charMap.get(id);
            if (!char) return null;
            return (
              <TierCharacterItem
                key={id}
                id={id}
                name={char.name}
                imageUrl={char.image_url}
                isDraggable
              />
            );
          })}
        </SortableContext>
        {filteredIds.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-text-muted">
            {allUnassignedIds.length === 0
              ? "全キャラを配置済み"
              : "条件に一致するキャラがいません"}
          </div>
        )}
      </div>
    </div>
  );
}
