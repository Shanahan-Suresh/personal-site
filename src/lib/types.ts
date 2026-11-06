import type { ImageMetadata } from "astro";

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
  media?: ProjectMedia;
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}
