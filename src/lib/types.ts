import type { ImageMetadata } from "astro";

export type Accent = "1" | "2" | "3" | "pop" | "ink";
export type StickerAccent = Accent | "4" | "5";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  title: string;
  description: string | string[];
  tags?: string[];
  link?: ProjectLink;
  meta?: string;
  /** overrides the auto-cycled card accent */
  accent?: Accent;
  /**
   * Promotes the project to a full-width card with a framed visual.
   * Images live in src/assets/work/. A stand-in image carries the placeholder
   * filename prefix and fails the production build (scripts/guard-placeholders.mjs).
   */
  featured?: { image: ImageMetadata; alt: string };
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}
