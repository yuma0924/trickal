export const SITE_NAME = "みんなで決めるトリッカルランキング";
export const SITE_DOMAIN = "rank-lab.com";
export const DEFAULT_DISPLAY_NAME = "名無しの教主";

export const ELEMENTS = ["純粋", "冷静", "狂気", "活発", "憂鬱"] as const;
export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_COLORS: Record<Element, string> = {
  純粋: "#22c55e",
  冷静: "#3b82f6",
  狂気: "#ef4444",
  活発: "#eab308",
  憂鬱: "#a855f7",
};

export const TIER_LABELS = ["S", "A", "B", "C", "D", "E"] as const;
export type TierLabel = (typeof TIER_LABELS)[number];

export const TIER_COLORS: Record<TierLabel, string> = {
  S: "#ef4444",
  A: "#f97316",
  B: "#eab308",
  C: "#22c55e",
  D: "#3b82f6",
  E: "#a855f7",
};
