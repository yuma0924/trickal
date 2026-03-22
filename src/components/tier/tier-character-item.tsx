"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CharacterIcon } from "@/components/character/character-icon";

interface TierCharacterItemProps {
  id: string;
  name: string;
  imageUrl: string | null;
  isDraggable?: boolean;
}

export function TierCharacterItem({
  id,
  name,
  imageUrl,
  isDraggable = false,
}: TierCharacterItemProps) {
  if (!isDraggable) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <CharacterIcon name={name} imageUrl={imageUrl} size="sm" />
        <span className="max-w-12 truncate text-center text-[9px] text-text-muted">
          {name}
        </span>
      </div>
    );
  }

  return <DraggableItem id={id} name={name} imageUrl={imageUrl} />;
}

function DraggableItem({
  id,
  name,
  imageUrl,
}: {
  id: string;
  name: string;
  imageUrl: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center gap-0.5 touch-manipulation"
    >
      <CharacterIcon name={name} imageUrl={imageUrl} size="sm" />
      <span className="max-w-12 truncate text-center text-[9px] text-text-muted">
        {name}
      </span>
    </div>
  );
}
