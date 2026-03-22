"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TierCharacterItem } from "@/components/tier/tier-character-item";
import type { TierLabel } from "@/lib/constants";
import { TIER_COLORS } from "@/lib/constants";

type CharacterData = {
  id: string;
  name: string;
  image_url: string | null;
};

interface TierRowProps {
  label: TierLabel;
  characters: CharacterData[];
  isDraggable?: boolean;
}

export function TierRow({ label, characters, isDraggable = false }: TierRowProps) {
  const color = TIER_COLORS[label];

  if (!isDraggable) {
    return (
      <div className="flex border-b border-border-primary last:border-b-0">
        <div
          className="flex w-12 shrink-0 items-center justify-center font-bold text-white text-lg"
          style={{ backgroundColor: color }}
        >
          {label}
        </div>
        <div className="flex min-h-[56px] flex-1 flex-wrap items-center gap-1 px-2 py-1.5">
          {characters.map((char) => (
            <TierCharacterItem
              key={char.id}
              id={char.id}
              name={char.name}
              imageUrl={char.image_url}
            />
          ))}
        </div>
      </div>
    );
  }

  return <DroppableTierRow label={label} characters={characters} color={color} />;
}

function DroppableTierRow({
  label,
  characters,
  color,
}: {
  label: TierLabel;
  characters: CharacterData[];
  color: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: label });

  return (
    <div
      className="flex border-b border-border-primary last:border-b-0"
      style={{
        backgroundColor: isOver ? "rgba(251, 100, 182, 0.08)" : undefined,
      }}
    >
      <div
        className="flex w-12 shrink-0 items-center justify-center font-bold text-white text-lg"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-[56px] flex-1 flex-wrap items-center gap-1 px-2 py-1.5"
      >
        <SortableContext items={characters.map((c) => c.id)} strategy={rectSortingStrategy}>
          {characters.map((char) => (
            <TierCharacterItem
              key={char.id}
              id={char.id}
              name={char.name}
              imageUrl={char.image_url}
              isDraggable
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
