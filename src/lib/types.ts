import type { ImageMetadata } from "astro";

interface ProjectLink {
  label: string;
  href: string;
}

interface ProjectMedia {
  image: ImageMetadata;
  alt: string;
  caption?: string;
  /** Preserve the legibility of taller interface captures. */
  aspectRatio?: string;
  /** Where a cropped thumbnail or preview anchors; defaults to "top". */
  objectPosition?: string;
}

interface ProjectFact {
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
  media?: ProjectMedia;
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}

/** A project with the label of the category it came from, in homepage order. */
export interface ListedProject extends Project {
  group: string;
}

export interface Interest {
  id: "off-clock" | "gym" | "travel" | "finance";
  title: string;
  caption: string;
  image: ImageMetadata;
  alt: string;
  objectPosition?: string;
  /** The photographer and source page, kept as a record. The Unsplash
      License needs no credit on the page, so the page does not show it. */
  credit: { label: string; href: string };
}

export interface NavLink {
  label: string;
  href: string;
}

/** The small badge that rises from behind a learning chip on hover (Now.astro). */
type LearningGlyph = "cloud" | "wheel";

export interface LearningItem {
  name: string;
  glyph: LearningGlyph;
}

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

export interface StackItem {
  name: string;
  detail: string;
  path?: string;
}

/** The slab classes a page head can take (`.s-cobalt` and the others). */
export type SlabTone = "cobalt" | "tomato" | "green";
