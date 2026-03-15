"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { CharacterIcon } from "@/components/character/character-icon";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ELEMENTS } from "@/lib/constants";

type FormMode = "general" | "arena" | "dimension" | "world_tree";

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  position: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

interface BuildPostFormProps {
  initialMode?: FormMode;
  onPosted: () => void;
  onClose?: () => void;
}

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

const MODE_OPTIONS: { value: FormMode; label: string }[] = [
  { value: "general", label: "汎用編成" },
  { value: "arena", label: "PvP" },
  { value: "dimension", label: "次元の衝突" },
  { value: "world_tree", label: "世界樹採掘基地" },
];

const POSITION_LABELS = ["後列", "中列", "前列"] as const;

const POSITION_ICON_MAP: Record<string, string> = {
  前列: "/icons/front.png",
  中列: "/icons/middle.png",
  後列: "/icons/back.png",
};

function getPartySize(mode: FormMode): number {
  return mode === "dimension" ? 9 : 6;
}

function getRowCount(mode: FormMode): number {
  return mode === "dimension" ? 3 : 2;
}

// スロットインデックスからポジション列を取得
function getSlotColumn(slotIndex: number, rowCount: number): string {
  const colIdx = Math.floor(slotIndex / rowCount);
  return POSITION_LABELS[colIdx];
}

export function BuildPostForm({ initialMode, onPosted, onClose }: BuildPostFormProps) {
  const [formMode, setFormMode] = useState<FormMode>(initialMode ?? "general");
  const [elementFilter, setElementFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formation, setFormation] = useState<(CharacterInfo | null)[]>(
    Array(6).fill(null)
  );
  // 選択中のキャラ（スロットに配置する前の一時状態）
  const [selectedChar, setSelectedChar] = useState<CharacterInfo | null>(null);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // キャラ一覧
  const [allCharacters, setAllCharacters] = useState<CharacterInfo[]>([]);
  const [charsLoaded, setCharsLoaded] = useState(false);

  useEffect(() => {
    if (charsLoaded) return;
    async function loadCharacters() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("characters")
          .select("id, name, slug, element, position, image_url, is_hidden")
          .eq("is_hidden", false)
          .order("name");
        if (data) {
          setAllCharacters(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              element: c.element,
              position: c.position,
              image_url: c.image_url,
              is_hidden: c.is_hidden,
            }))
          );
        }
        setCharsLoaded(true);
      } catch {
        // ignore
      }
    }
    loadCharacters();
  }, [charsLoaded]);

  // モード変更時にformationリセット
  useEffect(() => {
    const size = getPartySize(formMode);
    setFormation(Array(size).fill(null));
    setSelectedChar(null);
  }, [formMode]);

  const partySize = getPartySize(formMode);
  const rowCount = getRowCount(formMode);

  // 配置済みキャラIDセット
  const placedIds = useMemo(
    () => new Set(formation.filter(Boolean).map((c) => c!.id)),
    [formation]
  );

  // フィルタ済みキャラ一覧
  const filteredCharacters = useMemo(() => {
    let result = allCharacters;
    if (elementFilter) {
      result = result.filter((c) => c.element === elementFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [allCharacters, elementFilter, searchQuery]);

  // キャラグリッドタップ
  const handleCharacterTap = (char: CharacterInfo) => {
    // 既に配置済み → 配置から除去
    if (placedIds.has(char.id)) {
      setFormation((prev) =>
        prev.map((slot) => (slot?.id === char.id ? null : slot))
      );
      if (selectedChar?.id === char.id) {
        setSelectedChar(null);
      }
      return;
    }

    // 既に選択中のキャラを再タップ → キャンセル
    if (selectedChar?.id === char.id) {
      setSelectedChar(null);
      return;
    }

    // 選択状態にする（スロットはまだ決まらない）
    setSelectedChar(char);
  };

  // スロットタップ
  const handleSlotTap = (slotIndex: number) => {
    // 既にキャラがいるスロットをタップ → そのキャラを除去
    if (formation[slotIndex]) {
      setFormation((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      return;
    }

    // キャラが選択されていなければ何もしない
    if (!selectedChar) return;

    // ポジション制約チェック
    const slotColumn = getSlotColumn(slotIndex, rowCount);
    const requiredPosition = slotColumn;
    if (selectedChar.position && selectedChar.position !== requiredPosition) {
      return; // 配置不可
    }

    // 配置
    setFormation((prev) => {
      const next = [...prev];
      next[slotIndex] = selectedChar;
      return next;
    });
    setSelectedChar(null);
  };

  // キャラがスロットに配置可能か判定
  const canPlaceInSlot = (slotIndex: number): boolean => {
    if (!selectedChar) return false;
    if (formation[slotIndex]) return false;
    const slotColumn = getSlotColumn(slotIndex, rowCount);
    const requiredPosition = slotColumn;
    if (selectedChar.position && selectedChar.position !== requiredPosition) {
      return false;
    }
    return true;
  };

  // 全解除
  const handleClearAll = () => {
    setFormation(Array(partySize).fill(null));
    setSelectedChar(null);
  };

  // 投稿
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filledCount = formation.filter(Boolean).length;
    if (filledCount === 0) {
      setError("キャラクターを1体以上選択してください");
      return;
    }

    if (!comment.trim()) {
      setError("コメントは必須です");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: formMode,
          members: formation.filter(Boolean).map((c) => c!.id),
          comment: comment.trim(),
          title: title.trim() || undefined,
          display_name: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "投稿に失敗しました");
        return;
      }

      // リセット
      setFormation(Array(partySize).fill(null));
      setComment("");
      setTitle("");
      setDisplayName("");
      setSelectedChar(null);
      onPosted();
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-primary bg-bg-card p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">
          新しい編成を投稿
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-bg-tertiary hover:text-text-primary cursor-pointer"
            aria-label="閉じる"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* モード選択 */}
      <div className="mb-4">
        <div className="relative">
          <select
            value={formMode}
            onChange={(e) => setFormMode(e.target.value as FormMode)}
            className="w-full appearance-none rounded-[14px] border border-[rgba(249,168,212,0.2)] bg-[rgba(36,27,53,0.8)] px-4 py-2.5 pr-9 text-sm font-bold text-[#faf5ff] cursor-pointer focus:border-[rgba(244,114,182,0.4)] focus:outline-none"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a893c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 性格フィルター + 検索 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] text-text-muted">性格</span>
            <div className="flex gap-1.5">
              {ELEMENTS.map((elem) => {
                const active = elementFilter === elem;
                return (
                  <button
                    key={elem}
                    type="button"
                    onClick={() =>
                      setElementFilter(elementFilter === elem ? "" : elem)
                    }
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors cursor-pointer",
                      active
                        ? "bg-[rgba(255,99,126,0.15)] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                        : "bg-[#1a1225]"
                    )}
                    style={{
                      border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                    }}
                    title={elem}
                  >
                    <Image
                      src={ELEMENT_ICONS[elem]}
                      alt={elem}
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キャラ名で検索..."
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-2 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* キャラグリッド */}
        <div className="max-h-52 overflow-y-auto rounded-xl border border-[rgba(249,168,212,0.1)] bg-[rgba(30,21,48,0.5)] p-2">
          {filteredCharacters.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">
              キャラクターが見つかりません
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {filteredCharacters.map((char) => {
                const isPlaced = placedIds.has(char.id);
                const isSelected = selectedChar?.id === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleCharacterTap(char)}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 rounded-xl p-1.5 transition-all cursor-pointer",
                      isPlaced
                        ? "bg-[rgba(236,72,153,0.15)] border border-[rgba(244,114,182,0.4)]"
                        : isSelected
                          ? "bg-[rgba(56,189,248,0.15)] border border-[rgba(56,189,248,0.5)]"
                          : "hover:bg-[rgba(249,168,212,0.05)] border border-transparent"
                    )}
                  >
                    <CharacterIcon
                      name={char.name}
                      imageUrl={char.image_url}
                      size="sm"
                    />
                    {/* チェックマーク */}
                    {isPlaced && (
                      <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] text-white">
                        <svg
                          className="h-2.5 w-2.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="max-w-14 truncate text-center text-[8px] font-bold text-[#a893c0]">
                      {char.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 選択中のキャラ表示 */}
        {selectedChar && (
          <div className="flex items-start gap-2 rounded-xl border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.08)] px-3 py-2">
            <CharacterIcon
              name={selectedChar.name}
              imageUrl={selectedChar.image_url}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-bold text-[#faf5ff]">{selectedChar.name}</p>
                  {selectedChar.position && POSITION_ICON_MAP[selectedChar.position] && (
                    <Image src={POSITION_ICON_MAP[selectedChar.position]} alt={selectedChar.position} width={16} height={16} className="shrink-0" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChar(null)}
                  className="shrink-0 text-xs text-[#8b7aab] hover:text-[#faf5ff] cursor-pointer"
                >
                  キャンセル
                </button>
              </div>
              <p className="mt-1 text-xs text-[#8b7aab]">
                下のスロットをタップして配置
              </p>
            </div>
          </div>
        )}

        {/* 選択カウンター + 全解除 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            キャラクター選択（{partySize}体）
            <span className="ml-1 font-bold text-accent">
              {formation.filter(Boolean).length}/{partySize}
            </span>
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-[rgba(249,168,212,0.15)] bg-[rgba(30,21,48,0.5)] px-2.5 py-1 text-[11px] font-bold text-[#8b7aab] transition-colors hover:border-[rgba(255,99,126,0.4)] hover:text-[#fda4af] cursor-pointer"
          >
            全解除
          </button>
        </div>

        {/* 配置グリッド */}
        <div className="overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)]">
          {/* 列ヘッダー */}
          <div className="grid grid-cols-3 bg-[rgba(30,21,48,0.8)]">
            {POSITION_LABELS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "py-1.5 text-center text-[9px] font-bold text-[#a893c0]",
                  i < 2 && "border-r border-[rgba(249,168,212,0.05)]"
                )}
              >
                {label}
              </span>
            ))}
          </div>
          {/* スロット行 */}
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className={cn(
                "grid grid-cols-3",
                rowIdx < rowCount - 1 &&
                  "border-b border-[rgba(249,168,212,0.05)]"
              )}
            >
              {POSITION_LABELS.map((_, colIdx) => {
                const slotIndex = colIdx * rowCount + rowIdx;
                const char = formation[slotIndex] ?? null;
                const placeable = canPlaceInSlot(slotIndex);

                return (
                  <button
                    key={slotIndex}
                    type="button"
                    onClick={() => handleSlotTap(slotIndex)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 transition-all cursor-pointer",
                      colIdx < 2 &&
                        "border-r border-[rgba(249,168,212,0.05)]",
                      placeable && "bg-[rgba(56,189,248,0.08)]",
                      !placeable && selectedChar && !char && "opacity-30"
                    )}
                  >
                    {char ? (
                      <>
                        <CharacterIcon
                          name={char.name}
                          imageUrl={char.image_url}
                          size="sm"
                        />
                        <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">
                          {char.name}
                        </span>
                      </>
                    ) : (
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed",
                          placeable
                            ? "border-[rgba(56,189,248,0.5)] bg-[rgba(56,189,248,0.05)]"
                            : "border-[rgba(249,168,212,0.15)]"
                        )}
                      >
                        <svg
                          className="h-4 w-4 text-[#8b7aab]/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* 編成名（任意） */}
        <div className="flex min-w-0 items-center gap-3">
          <label className="w-12 shrink-0 text-sm text-text-secondary">
            編成名
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 汎用おすすめ編成"
            maxLength={100}
            className="min-w-0 flex-1 rounded-xl border border-border-primary bg-bg-input px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* 投稿者名（任意） */}
        <div className="flex min-w-0 items-center gap-3">
          <label className="w-12 shrink-0 text-sm text-text-secondary">
            名前
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名無しの教主"
            maxLength={50}
            className="min-w-0 flex-1 rounded-xl border border-border-primary bg-bg-input px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* コメント（必須） */}
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            コメント
            <span className="ml-2 text-xs text-text-tertiary">
              {comment.length}/200
            </span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="この編成のポイントを教えてください"
            maxLength={200}
            rows={3}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {error && <p className="text-sm text-thumbs-down">{error}</p>}

        <div className="space-y-2">
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "投稿中..." : "投稿する"}
          </Button>
          <p className="text-center text-[10px] text-text-muted">
            同一コンテンツ・人数の既存投稿は上書きされます
          </p>
        </div>
      </form>
    </div>
  );
}
