export const SITE_NAME = "みんなで決めるトリッカルランキング";
export const SITE_DOMAIN = "rank-lab.com";
export const DEFAULT_DISPLAY_NAME = "名無しの教主";

export const ELEMENTS = ["火", "水", "風", "光", "闇"] as const;
export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_COLORS: Record<Element, string> = {
  火: "#ef4444",
  水: "#3b82f6",
  風: "#22c55e",
  光: "#eab308",
  闇: "#a855f7",
};
