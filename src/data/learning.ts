import type { LearningItem } from "@/lib/types";

/* What I'm learning next. `glyph` picks the small badge that rises from
   behind the chip on hover (Now.astro): a cloud, or a ship's wheel. */
export const learning: LearningItem[] = [
  { name: "AWS", glyph: "cloud" },
  { name: "Kubernetes", glyph: "wheel" },
];
