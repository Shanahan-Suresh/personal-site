export type Accent = "1" | "2" | "3" | "pop" | "ink";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  title: string;
  description: string;
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
