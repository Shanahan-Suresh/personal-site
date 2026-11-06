import type { Project, ProjectCategory } from "@/lib/types";
import digestVisual from "@/assets/work/digest.png";
import rsvpVisual from "@/assets/work/rsvp-redesign-v4.png";
import censoritVisual from "@/assets/work/censorit-venus-v4.png";
import hrVisual from "@/assets/work/hr-redesign-v4.png";
import ohseVisual from "@/assets/work/ohse-unbranded-v3.png";
import mcpVisual from "@/assets/work/mcp.png";
import heatgenVisual from "@/assets/work/heatgen.png";

const personal: Project[] = [
  {
    id: "digest",
    title: "Tech Scout Digest",
    summary:
      "A daily newsletter where an LLM curates the news around each team's stack.",
    fact: { value: "0", label: "servers between editions" },
    description:
      "A daily newsletter that helps teams keep up with the technology they use. An LLM picks relevant stories around the team's stack and brings them together in one easy read. The setup is driven by configuration and runs on GCP, scaling to zero between editions.",
    tags: ["Python", "GCP", "Terraform", "LLMs"],
    featured: true,
    media: {
      image: digestVisual,
      alt: "Tech Scout Digest newsletter showing its masthead and a curated sample story.",
      caption: "A few good stories to start the day.",
    },
  },
  {
    id: "censorit",
    title: "Automated artwork censoring app",
    summary:
      "A desktop editor that finds regions to censor with YOLO and FastSAM.",
    fact: { value: "2", label: "languages, EN and JP" },
    description:
      "A desktop artwork editor with automatic region detection through YOLO and FastSAM. It handles batch jobs, speaks English and Japanese, and ships as an app people can run without touching a terminal.",
    tags: ["Python", "YOLO", "FastSAM"],
    media: {
      image: censoritVisual,
      alt: "Censorit editor showing Cabanel's The Birth of Venus with two navy manual censor regions and visible Solid Fill settings.",
      caption: "Cabanel's The Birth of Venus (1875), with a little discretion.",
    },
    link: {
      label: "Artwork source (The Met)",
      href: "https://www.metmuseum.org/art/collection/search/435831",
    },
  },
  {
    id: "mcp",
    title: "OpenAPI → MCP server + chat UI",
    summary: "Turns any API schema into tools an AI assistant can call.",
    fact: { value: "1", label: "schema in, a full toolset out" },
    description:
      "Point it at any API's schema and it generates a set of LLM-callable tools on its own, falling back across models if one stalls, all wired into a Next.js chat interface. It lets an AI assistant pick up a brand-new tool in seconds.",
    tags: ["Python", "MCP", "FastAPI", "Next.js"],
    media: {
      image: mcpVisual,
      alt: "MCP Inspector listing four generated tools and a successful toy-shop product lookup.",
      caption: "Give an AI assistant a new set of tools.",
    },
    link: {
      label: "Read the write-up",
      href: "https://dev.to/shanahansuresh/wiring-django-to-claude-generating-an-mcp-server-from-openapi-1e8a",
    },
  },
];

const product: Project[] = [
  {
    id: "rsvp",
    title: "Automated RSVP & check-in web app",
    summary:
      "Serverless RSVPs, confirmations and QR check-in for 75,000 guests.",
    fact: { value: "75,000", label: "guests welcomed" },
    description: [
      "Built to welcome 75,000 guests. This serverless Next.js app handles RSVPs and check-in, sends email and WhatsApp confirmations through SendGrid and Respond.io, and gives each guest a scannable QR ticket.",
      "I defined the stack in Terraform and shipped it through GitHub Actions, so scaling for a crowd that size comes down to config rather than a late night.",
    ],
    tags: ["Next.js", "Terraform", "Respond.io", "SendGrid"],
    featured: true,
    media: {
      image: rsvpVisual,
      aspectRatio: "1040 / 820",
      alt: "An invitation-style registration form alongside a confirmed ticket with a scannable QR code for a Developer Meetup.",
      caption: "From signing up to a scan at the door.",
    },
  },
  {
    id: "ohse",
    title: "OHSE incident-reporting module",
    summary: "Role-based incident workflows across 10 business units.",
    fact: { value: "10", label: "business units" },
    description: [
      "This is where worksite incidents get reported, investigated, and put right across 10 business units. I built role-based workflows around the different needs of managers, safety officers, and investigators.",
      "I owned planning through GCP rollout, introduced the team's first Playwright suite, and added an MCP server that turns its OpenAPI schema into tools an AI assistant can call.",
    ],
    tags: ["Next.js", "Django", "GCP", "MCP"],
    media: {
      image: ohseVisual,
      alt: "An incident-reporting workspace with reports, status filters, search and pagination.",
      caption: "Turning incident reports into action.",
    },
  },
  {
    id: "hr",
    title: "Enterprise HR platform",
    summary: "Page loads cut by 63% for 20,000 employees.",
    fact: { value: "63%", label: "faster page loads" },
    description: [
      "For a platform used by 20,000 employees, I reworked heavy modules, query serialization and bulk processing to cut page-load times by 63%.",
      "I also protected PII with AES-256 transparent encryption and built custom PostgreSQL workflows for the analytics team.",
    ],
    tags: ["Svelte", "Django", "PostgreSQL"],
    media: {
      image: hrVisual,
      aspectRatio: "960 / 740",
      alt: "A My Team workspace with six people, initials avatars, two selected cards and performance acknowledgement states.",
      caption: "A clearer view of the team, with less waiting around.",
    },
  },
];

const academic: Project[] = [
  {
    id: "heatgen",
    title: "HeatGen",
    summary:
      "Predicts thermal images of pavement from materials and weather. Published 2023.",
    fact: { value: "2023", label: "published in JESTEC" },
    description:
      "A university team project that predicts thermal images of pavement bricks from material and weather variables. Our work was published in the peer-reviewed JESTEC journal in 2023.",
    tags: ["Python", "Deep Learning"],
    media: {
      image: heatgenVisual,
      alt: "Observed thermal image of pavement bricks alongside the model's predicted image for sample 1.",
      caption: "From weather and materials to a thermal forecast.",
    },
    link: {
      label: "Read the paper",
      href: "https://jestec.taylors.edu.my/Vol%2018%20Issue%202%20April%202023/18_2_16.pdf",
    },
  },
];

export const categories: ProjectCategory[] = [
  { label: "Personal", items: personal },
  { label: "Corporate work", items: product },
  { label: "Academic", items: academic },
];

/** The homepage order: corporate work first, then side projects, then university. */
const order = ["rsvp", "hr", "ohse", "digest", "mcp", "censorit", "heatgen"];

export interface ListedProject extends Project {
  group: string;
}

export const projects: ListedProject[] = order.map((id) => {
  for (const cat of categories) {
    const found = cat.items.find((p) => p.id === id);
    if (found) return { ...found, group: cat.label };
  }
  throw new Error(`Unknown project id in the homepage order: ${id}`);
});
