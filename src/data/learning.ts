/* What I'm learning next. `glyph` picks the small badge that rises from
   behind the chip on hover (Now.astro): a cloud, or a ship's wheel. */
export type LearningGlyph = "cloud" | "wheel";

export const learning: { name: string; glyph: LearningGlyph }[] = [
  { name: "AWS", glyph: "cloud" },
  { name: "Kubernetes", glyph: "wheel" },
];
