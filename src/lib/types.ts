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
}

export interface ProjectCategory {
  label: string;
  items: Project[];
}
