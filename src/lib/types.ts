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

export interface ProjectFact {
  /** The number or short figure shown large, such as "75,000". */
  value: string;
  /** What the figure counts, such as "guests welcomed". */
  label: string;
}

export interface Project {
  /** Stable slug for anchors such as #story-rsvp. */
  id: string;
  title: string;
  /** One line for the project row. */
  summary: string;
  fact: ProjectFact;
  description: string | string[];
  tags?: string[];
  link?: ProjectLink;
  meta?: string;
  /** Full-width showcase layout, independent of media presence. */
  featured?: boolean;
  media?: ProjectMedia;
  evidence?: ProjectEvidence;
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}
