import type { ImageMetadata } from "astro";

export type Accent = "1" | "2" | "3" | "pop" | "ink";
export type StickerAccent = Accent | "4" | "5";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectMedia {
  image: ImageMetadata;
  alt: string;
  caption?: string;
  fit?: "cover" | "contain";
  /** Preserve the legibility of taller interface captures. */
  aspectRatio?: string;
}

export type ProjectEvidence =
  | { kind: "workflow"; steps: string[]; caption: string }
  | { kind: "performance"; reduction: number; caption: string };

export interface Project {
  title: string;
  description: string | string[];
  tags?: string[];
  link?: ProjectLink;
  meta?: string;
  /** overrides the auto-cycled card accent */
  accent?: Accent;
  /** Full-width showcase layout, independent of media presence. */
  featured?: boolean;
  media?: ProjectMedia;
  evidence?: ProjectEvidence;
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}
