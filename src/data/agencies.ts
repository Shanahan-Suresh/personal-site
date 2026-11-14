/* The /agencies page: what I take on for agencies, the terms, the starting
   prices and the sample sites. Scores are Lighthouse mobile results measured
   on the live samples; re-measure when a sample changes. */
import type {
  AgencySample,
  AgencyService,
  AgencyTerm,
  Stat,
} from "@/lib/types";

export const services: AgencyService[] = [
  {
    name: "Sites from your design",
    detail:
      "Your Figma file built as a WordPress block theme or a Next.js site, with the layout, type and spacing as designed. Editors get blocks they can use without breaking the page.",
  },
  {
    name: "Fixes for AI-built sites",
    detail:
      "Sites made with Lovable, Bolt, v0 or a page builder that break, load slowly or leak data. I find the cause, fix it and check the security basics.",
  },
  {
    name: "Accessibility checks",
    detail:
      "A WCAG 2.2 AA check with axe and by hand, with keyboard and screen reader, then the fixes. You get a short report you can pass to your client.",
  },
  {
    name: "Launch work",
    detail:
      "DNS, email records, certificates, redirects and site moves between hosts. I spent a year and a half in UK hosting support, so launches are familiar ground.",
  },
];

export const terms: AgencyTerm[] = [
  {
    title: "Your name on the work",
    detail:
      "I work behind your agency and never contact your client. The contract has a 12-month non-solicit of your clients.",
  },
  {
    title: "Fixed quotes",
    detail:
      "A one-page scope before work starts, with the price fixed. A change of scope gets its own quote, in writing.",
  },
  {
    title: "UK office hours",
    detail:
      "Replies in UK working hours, written updates on Monday and Wednesday, and the hand-off on Friday.",
  },
  {
    title: "English law",
    detail:
      "A contract under English law. You own the work once it is paid for, and the contract has a UK GDPR clause when client data is involved.",
  },
];

export const prices: Stat[] = [
  {
    value: "£150",
    label: "First job",
    note: "One fix, or one page built from your design. A small way to judge the work.",
  },
  {
    value: "£1,400",
    label: "Small site, from",
    note: "Up to about five pages from your design, WordPress or Next.js.",
  },
  {
    value: "£250",
    label: "A day, for busy periods",
    note: "Extra hands when your team is full, booked by the day.",
  },
];

export const samples: AgencySample[] = [
  {
    name: "Thornwick Plumbing & Heating",
    href: "https://thornwick.shanahansuresh.com/",
    kind: "Trade business, WordPress",
    detail:
      "A WordPress block theme built from a Figma design, with a page for each service in each town, the way trades win local searches.",
    stack: ["WordPress", "Block theme", "Cloudflare"],
    scores: [
      { label: "Speed", value: "96–99" },
      { label: "Accessibility", value: "100" },
      { label: "Best practices", value: "100" },
    ],
  },
  {
    name: "Fernhollow Physiotherapy",
    href: "https://fernhollow.shanahansuresh.com/",
    kind: "Clinic, WordPress",
    detail:
      "A WordPress block theme built from a Figma design, with treatment pages, clear prices, a team page and a booking enquiry form.",
    stack: ["WordPress", "Block theme", "Cloudflare"],
    scores: [
      { label: "Speed", value: "100" },
      { label: "Accessibility", value: "100" },
      { label: "Best practices", value: "100" },
    ],
  },
  {
    name: "Pennywort Bakehouse",
    href: "https://pennywort.shanahansuresh.com/",
    kind: "Café and bakery, Next.js",
    detail:
      "A Next.js site built from a Figma design, with the menu, opening hours, classes and a contact form, served as static pages.",
    stack: ["Next.js", "React", "Cloudflare Workers"],
    scores: [
      { label: "Speed", value: "94–97" },
      { label: "Accessibility", value: "100" },
      { label: "Best practices", value: "100" },
    ],
  },
];
