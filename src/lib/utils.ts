import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ひらがなをカタカナに変換 */
function toKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/** カタカナをひらがなに変換 */
function toHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/** ひらがな・カタカナ両方でマッチする名前検索 */
export function matchesName(name: string, query: string): boolean {
  if (!query.trim()) return true;
  const lower = name.toLowerCase();
  const q = query.toLowerCase();
  return (
    lower.includes(q) ||
    lower.includes(toKatakana(q)) ||
    lower.includes(toHiragana(q))
  );
}
