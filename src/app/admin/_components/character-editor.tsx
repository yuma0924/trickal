"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import type { Character } from "@/types/database";

type EditableField = {
  key: keyof Character | string;
  label: string;
  type: "text" | "select" | "checkbox" | "number" | "json";
  options?: string[];
  width: string;
};

const FIELDS: EditableField[] = [
  { key: "name", label: "名前", type: "text", width: "w-32" },
  { key: "slug", label: "スラッグ", type: "text", width: "w-28" },
  { key: "rarity", label: "レア", type: "select", options: ["★1", "★2", "★3"], width: "w-16" },
  { key: "element", label: "属性", type: "select", options: ["純粋", "冷静", "狂気", "活発", "憂鬱"], width: "w-16" },
  { key: "role", label: "役割", type: "select", options: ["守備", "攻撃", "支援"], width: "w-16" },
  { key: "race", label: "種族", type: "select", options: ["妖精", "獣人", "エルフ", "精霊", "幽霊", "竜族", "魔女", "???"], width: "w-20" },
  { key: "position", label: "配置", type: "select", options: ["前列", "中列", "後列"], width: "w-16" },
  { key: "attack_type", label: "攻撃タイプ", type: "select", options: ["物理", "魔法"], width: "w-16" },
  { key: "is_provisional", label: "暫定", type: "checkbox", width: "w-12" },
  { key: "is_hidden", label: "非表示", type: "checkbox", width: "w-12" },
];


type SkillCategory = "low_grade" | "high_grade" | "passive" | "normal_attack_basic" | "normal_attack_enhanced";

interface SkillData {
  category: SkillCategory;
  name?: string;
  cooltime?: number;
  description: string;
  params?: string;
}

const SKILL_SLOTS: {
  category: SkillCategory;
  label: string;
  hasName: boolean;
  hasCooltime: boolean;
}[] = [
  { category: "low_grade", label: "低学年スキル", hasName: true, hasCooltime: false },
  { category: "high_grade", label: "高学年スキル", hasName: true, hasCooltime: true },
  { category: "passive", label: "パッシブスキル", hasName: false, hasCooltime: false },
  { category: "normal_attack_basic", label: "普通攻撃（基本）", hasName: false, hasCooltime: false },
  { category: "normal_attack_enhanced", label: "普通攻撃（強化）", hasName: false, hasCooltime: false },
];

type CharacterDraft = Character & { _isNew?: boolean; _isDirty?: boolean };

export function CharacterEditor({
  initialCharacters,
}: {
  initialCharacters: Character[];
}) {
  const [characters, setCharacters] = useState<CharacterDraft[]>(
    initialCharacters.map((c) => ({ ...c }))
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [skillEditIndex, setSkillEditIndex] = useState<number | null>(null);
  const cellRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());

  // メッセージを一定時間で消す
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    const el = cellRefs.current.get(getCellKey(rowIndex, colIndex));
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement && el.type === "text") {
        el.select();
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, rowIndex: number, colIndex: number) => {
      const totalCols = FIELDS.length;

      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1;
        if (nextCol >= 0 && nextCol < totalCols) {
          focusCell(rowIndex, nextCol);
        } else if (!e.shiftKey && nextCol >= totalCols && rowIndex < characters.length - 1) {
          focusCell(rowIndex + 1, 0);
        } else if (e.shiftKey && nextCol < 0 && rowIndex > 0) {
          focusCell(rowIndex - 1, totalCols - 1);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (rowIndex < characters.length - 1) {
          focusCell(rowIndex + 1, colIndex);
        }
      }
    },
    [characters.length, focusCell]
  );

  const updateField = (index: number, key: string, value: unknown) => {
    setCharacters((prev) => {
      const next = [...prev];
      const char = { ...next[index], _isDirty: true };

      (char as Record<string, unknown>)[key] = value;

      next[index] = char;
      return next;
    });
  };

  const addNewCharacter = () => {
    const newChar: CharacterDraft = {
      id: crypto.randomUUID(),
      slug: "",
      name: "",
      rarity: null,
      element: null,
      role: null,
      race: null,
      position: null,
      attack_type: null,
      stats: {},
      skills: [],
      metadata: {},
      image_url: null,
      is_provisional: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isNew: true,
      _isDirty: true,
    };
    setCharacters((prev) => [...prev, newChar]);
    // フォーカスを新しい行の最初のセルに
    setTimeout(() => focusCell(characters.length, 0), 50);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    const dirtyChars = characters.filter((c) => c._isDirty);
    if (dirtyChars.length === 0) {
      setSaveMessage({ type: "success", text: "変更はありません" });
      setSaving(false);
      return;
    }

    const newChars = dirtyChars.filter((c) => c._isNew);
    const existingChars = dirtyChars.filter((c) => !c._isNew);

    try {
      const errors: string[] = [];

      // 新規キャラ作成
      for (const char of newChars) {
        if (!char.name || !char.slug) {
          errors.push(`新規キャラ: 名前とスラッグは必須です`);
          continue;
        }
        const { _isNew, _isDirty, ...data } = char;
        void _isNew;
        void _isDirty;
        const res = await fetch("/api/admin/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          errors.push(`${char.name}: ${err.error}`);
        }
      }

      // 既存キャラ更新
      if (existingChars.length > 0) {
        const updates = existingChars.map((char) => {
          const { _isNew, _isDirty, created_at, ...fields } = char;
          void _isNew;
          void _isDirty;
          void created_at;
          return fields;
        });

        const res = await fetch("/api/admin/characters", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });

        if (!res.ok) {
          const err = await res.json();
          errors.push(err.error || "更新エラー");
        } else {
          const result = await res.json();
          if (result.errors?.length > 0) {
            for (const e of result.errors) {
              errors.push(`${e.id}: ${e.error}`);
            }
          }
        }
      }

      if (errors.length > 0) {
        setSaveMessage({ type: "error", text: errors.join(", ") });
      } else {
        setSaveMessage({ type: "success", text: `${dirtyChars.length}件を保存しました` });
        // _isDirty, _isNew フラグをクリア
        setCharacters((prev) =>
          prev.map((c) => ({ ...c, _isDirty: false, _isNew: false }))
        );
      }
    } catch {
      setSaveMessage({ type: "error", text: "保存中にエラーが発生しました" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (characterId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(characterId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("characterId", characterId);

    try {
      const res = await fetch("/api/admin/characters/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveMessage({ type: "error", text: err.error || "アップロード失敗" });
        return;
      }

      const { url } = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId ? { ...c, image_url: url, _isDirty: true } : c
        )
      );
      setSaveMessage({ type: "success", text: "画像をアップロードしました" });
    } catch {
      setSaveMessage({ type: "error", text: "アップロード中にエラーが発生しました" });
    } finally {
      setUploadingId(null);
    }
  };


  const getSkillsArray = (char: Character): SkillData[] => {
    if (Array.isArray(char.skills)) return char.skills as unknown as SkillData[];
    return [];
  };

  const getSkillField = (skills: SkillData[], category: SkillCategory, field: keyof SkillData): string => {
    const skill = skills.find((s) => s.category === category);
    if (!skill) return "";
    const val = skill[field];
    return val !== undefined && val !== null ? String(val) : "";
  };

  const updateSkillField = (charIndex: number, category: SkillCategory, field: keyof SkillData, value: string) => {
    setCharacters((prev) => {
      const next = [...prev];
      const char = { ...next[charIndex], _isDirty: true };
      const skills = getSkillsArray(char);
      const existing = skills.find((s) => s.category === category);
      if (existing) {
        const updated = { ...existing };
        if (field === "cooltime") {
          updated.cooltime = value === "" ? undefined : Number(value);
        } else {
          (updated as Record<string, unknown>)[field] = value || undefined;
        }
        char.skills = skills.map((s) => (s.category === category ? updated : s)) as unknown as Character["skills"];
      } else {
        const newSkill: SkillData = { category, description: "" };
        if (field === "cooltime") {
          newSkill.cooltime = value === "" ? undefined : Number(value);
        } else {
          (newSkill as unknown as Record<string, unknown>)[field] = value || undefined;
        }
        char.skills = [...skills, newSkill] as unknown as Character["skills"];
      }
      next[charIndex] = char;
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダーバー */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={addNewCharacter}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
        >
          + 新規キャラ追加
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer rounded-lg bg-thumbs-up px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中..." : "変更を保存"}
        </button>
        {saveMessage && (
          <span
            className={`text-sm ${
              saveMessage.type === "success" ? "text-thumbs-up" : "text-thumbs-down"
            }`}
          >
            {saveMessage.text}
          </span>
        )}
        <span className="ml-auto text-xs text-text-tertiary">
          {characters.filter((c) => c._isDirty).length}件の未保存の変更
        </span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-xl border border-border-primary">
        <table className="w-max min-w-full text-xs">
          <thead>
            <tr className="border-b border-border-primary bg-bg-secondary">
              <th className="sticky left-0 z-10 bg-bg-secondary px-2 py-2 text-left font-medium text-text-secondary">
                #
              </th>
              <th className="px-2 py-2 text-left font-medium text-text-secondary">
                画像
              </th>
              {FIELDS.map((field) => (
                <th
                  key={field.key}
                  className="px-2 py-2 text-left font-medium text-text-secondary"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-2 py-2 text-left font-medium text-text-secondary">
                スキル
              </th>
            </tr>
          </thead>
          <tbody>
            {characters.map((char, rowIndex) => (
              <tr
                key={char.id}
                className={`border-b border-border-secondary transition-colors hover:bg-bg-card-hover ${
                  char._isDirty ? "bg-accent/5" : ""
                } ${char._isNew ? "bg-thumbs-up/5" : ""}`}
              >
                {/* 行番号 */}
                <td className="sticky left-0 z-10 bg-bg-primary px-2 py-1 text-text-tertiary">
                  {rowIndex + 1}
                </td>

                {/* 画像 */}
                <td className="px-2 py-1">
                  <label className="relative block h-8 w-8 cursor-pointer overflow-hidden rounded border border-border-primary bg-bg-tertiary">
                    {char.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={char.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-text-muted">
                        {uploadingId === char.id ? "..." : "img"}
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageUpload(char.id, e)}
                      disabled={char._isNew || uploadingId === char.id}
                    />
                  </label>
                </td>

                {/* 編集可能フィールド */}
                {FIELDS.map((field, colIndex) => (
                  <td key={field.key} className="px-1 py-1">
                    {field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={
                          (char as Record<string, unknown>)[field.key] as boolean
                        }
                        onChange={(e) =>
                          updateField(rowIndex, field.key, e.target.checked)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        ref={(el) => {
                          if (el) cellRefs.current.set(getCellKey(rowIndex, colIndex), el);
                        }}
                        className="cursor-pointer"
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={
                          ((char as Record<string, unknown>)[field.key] as string) ?? ""
                        }
                        onChange={(e) =>
                          updateField(
                            rowIndex,
                            field.key,
                            e.target.value || null
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        ref={(el) => {
                          if (el) cellRefs.current.set(getCellKey(rowIndex, colIndex), el);
                        }}
                        className={`${field.width} rounded border border-border-secondary bg-bg-input px-1.5 py-1 text-text-primary focus:border-accent focus:outline-none`}
                      >
                        <option value="">-</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={
                          ((char as Record<string, unknown>)[field.key] as string) ?? ""
                        }
                        onChange={(e) =>
                          updateField(rowIndex, field.key, e.target.value || null)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        ref={(el) => {
                          if (el) cellRefs.current.set(getCellKey(rowIndex, colIndex), el);
                        }}
                        className={`${field.width} rounded border border-border-secondary bg-bg-input px-1.5 py-1 text-text-primary focus:border-accent focus:outline-none`}
                      />
                    )}
                  </td>
                ))}

                {/* スキル編集ボタン */}
                <td className="px-1 py-1">
                  <button
                    onClick={() => setSkillEditIndex(rowIndex)}
                    className="cursor-pointer rounded bg-accent/20 px-2 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/30"
                  >
                    {getSkillsArray(char).length > 0 ? `編集(${getSkillsArray(char).length})` : "追加"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スキル編集モーダル */}
      {skillEditIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSkillEditIndex(null)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-primary bg-bg-primary p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">
                スキル編集: {characters[skillEditIndex].name || "新規キャラ"}
              </h3>
              <button
                onClick={() => setSkillEditIndex(null)}
                className="cursor-pointer text-text-tertiary transition-colors hover:text-text-primary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {SKILL_SLOTS.map((slot) => {
                const skills = getSkillsArray(characters[skillEditIndex]);
                return (
                  <div key={slot.category} className="rounded-lg border border-border-secondary bg-bg-secondary p-3">
                    <p className="mb-2 text-xs font-bold text-text-secondary">{slot.label}</p>
                    <div className="space-y-2">
                      {slot.hasName && (
                        <div>
                          <label className="mb-0.5 block text-[10px] text-text-tertiary">スキル名</label>
                          <input
                            type="text"
                            value={getSkillField(skills, slot.category, "name")}
                            onChange={(e) => updateSkillField(skillEditIndex, slot.category, "name", e.target.value)}
                            className="w-full rounded border border-border-secondary bg-bg-input px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                            placeholder="スキル名を入力"
                          />
                        </div>
                      )}
                      {slot.hasCooltime && (
                        <div>
                          <label className="mb-0.5 block text-[10px] text-text-tertiary">クールタイム（秒）</label>
                          <input
                            type="number"
                            value={getSkillField(skills, slot.category, "cooltime")}
                            onChange={(e) => updateSkillField(skillEditIndex, slot.category, "cooltime", e.target.value)}
                            className="w-24 rounded border border-border-secondary bg-bg-input px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                            placeholder="秒"
                          />
                        </div>
                      )}
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-tertiary">説明</label>
                        <textarea
                          value={getSkillField(skills, slot.category, "description")}
                          onChange={(e) => updateSkillField(skillEditIndex, slot.category, "description", e.target.value)}
                          className="w-full rounded border border-border-secondary bg-bg-input px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                          rows={2}
                          placeholder="スキルの説明を入力"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-tertiary">パラメータ（1行に1つ）</label>
                        <textarea
                          value={getSkillField(skills, slot.category, "params")}
                          onChange={(e) => updateSkillField(skillEditIndex, slot.category, "params", e.target.value)}
                          className="w-full rounded border border-border-secondary bg-bg-input px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                          rows={3}
                          placeholder={"物理ダメージ: 345.6%\n最後の一撃の物理ダメージ: 86.4%\n無敵の持続時間: 3秒"}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSkillEditIndex(null)}
                className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {characters.length === 0 && (
        <div className="rounded-xl border border-border-primary bg-bg-card p-8 text-center">
          <p className="text-sm text-text-tertiary">
            キャラクターが登録されていません
          </p>
          <button
            onClick={addNewCharacter}
            className="mt-3 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
          >
            最初のキャラを追加
          </button>
        </div>
      )}
    </div>
  );
}
