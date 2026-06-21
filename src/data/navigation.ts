import { site } from "@/lib/site-config";

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Work", href: "/#work" },
  { label: "Contact", href: "/#contact" },
];

export const socialLinks = site.social;
