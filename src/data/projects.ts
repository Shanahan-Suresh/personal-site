import type { Project, ProjectCategory, Accent } from "@/lib/types";
import digestVisual from "@/assets/work/_placeholder-digest.svg";
import rsvpVisual from "@/assets/work/_placeholder-rsvp.svg";

const personal: Project[] = [
  {
    title: "AI-curated tech-news digest",
    description:
      "A daily tech-intelligence digest that reads the firehose so you don't have to. It curates the news to a team's exact stack with an LLM, runs entirely from config, and scales to zero on GCP when nobody's looking.",
    tags: ["Python", "GCP", "Terraform", "LLMs"],
    featured: {
      image: digestVisual,
      alt: "A generated Tech Scout Digest email, cropped to the newsletter column.",
    },
  },
  {
    title: "Automated artwork censoring app",
    description:
      "A desktop app that detects and censors regions of artwork automatically, using an anime-tuned pipeline (YOLO + FastSAM). It handles batch jobs, speaks English and Japanese, and is packaged so non-developers can run it without touching a terminal.",
    tags: ["Python", "YOLO", "FastSAM"],
  },
  {
    title: "OpenAPI → MCP server + chat UI",
    description:
      "Point it at any API's schema and it generates a set of LLM-callable tools on its own, falling back across models if one stalls, all wired into a Next.js chat interface. It lets an AI assistant pick up a brand-new tool in seconds.",
    tags: ["Python", "MCP", "FastAPI", "Next.js"],
    link: {
      label: "Read the write-up",
      href: "https://dev.to/shanahansuresh/wiring-django-to-claude-generating-an-mcp-server-from-openapi-1e8a",
    },
  },
];

const product: Project[] = [
  {
    title: "Automated RSVP & check-in web app",
    description: [
      "Built to welcome 75,000 guests without breaking a sweat.",
      "It's a serverless Next.js app that runs RSVPs and check-in behind a glassmorphism UI, sends confirmations over email and WhatsApp, and hands everyone a scannable QR ticket, with SendGrid and Respond.io doing the talking.",
      "The whole stack is defined in Terraform and ships through GitHub Actions, so scaling up for a crowd that size comes down to a config value rather than a late night.",
    ],
    tags: ["Next.js", "Terraform", "Respond.io", "SendGrid"],
    featured: {
      image: rsvpVisual,
      alt: "The RSVP landing page with the enrolment form and live QR ticket preview.",
    },
  },
  {
    title: "OHSE incident-reporting module",
    description: [
      "When something goes wrong on a worksite, this is where it gets reported, investigated, and put right. It's now live across 10 business units.",
      "The tricky part was never the forms, it was the people: managers, safety officers, and investigators each need what's effectively a different app, so I built the role-based workflows to match.",
      "I owned it from the first round of SDLC planning through to the GCP rollout, set up the team's first Playwright test suite along the way, and added an MCP server that turns the module's OpenAPI schema into tools an AI assistant can actually call.",
    ],
    tags: ["Next.js", "Django", "GCP", "MCP"],
  },
  {
    title: "Enterprise HR platform",
    description: [
      "This is the flagship HR platform 20,000 employees sign into, so every slow page is a delay felt 20,000 times over. I went after the heaviest modules, reworked how queries were serialized, and added bulk processing to bring page-load times down by 63%.",
      "While there, I wrapped PII in AES-256 transparent encryption and built custom PostgreSQL workflows for the analytics team to lean on.",
    ],
    tags: ["Svelte", "Django", "PostgreSQL"],
  },
];

const academic: Project[] = [
  {
    title: "HeatGen",
    description:
      "A deep-learning project I built with a team during my uni days, later published in a peer-reviewed journal (JESTEC, 2023).",
    tags: ["Python", "Deep Learning"],
    accent: "3",
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

export const accentCycle: Accent[] = ["1", "2", "pop", "ink"];
