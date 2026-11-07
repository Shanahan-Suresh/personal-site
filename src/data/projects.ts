import type { Project, ProjectCategory } from "@/lib/types";
import digestVisual from "@/assets/work/digest.png";
import rsvpVisual from "@/assets/work/rsvp-redesign-v4.png";
import censoritVisual from "@/assets/work/censorit-venus-v4.png";
import hrVisual from "@/assets/work/hr-mock-v5.png";
import ohseVisual from "@/assets/work/ohse-unbranded-v3.png";
import mcpVisual from "@/assets/work/mcp.png";
import heatgenVisual from "@/assets/work/heatgen.png";

const personal: Project[] = [
  {
    id: "digest",
    title: "Tech Scout Digest",
    summary:
      "An LLM reads the tech feeds and writes one short newsletter for each team.",
    fact: { value: "Daily", label: "email for each team" },
    description:
      "A daily newsletter for teams who want to keep up with the tools they use. An LLM reads the news, picks the stories about the tools each team uses and puts them into one short email. Each team is set up in config, and it runs on GCP, scaling to zero between editions.",
    tags: ["Python", "GCP", "Terraform", "LLMs"],
    media: {
      image: digestVisual,
      alt: "Tech Scout Digest newsletter showing its masthead and a curated sample story.",
      caption: "One team's morning email.",
    },
  },
  {
    id: "censorit",
    title: "Automated artwork censoring app",
    summary:
      "A desktop editor that finds regions to censor with YOLO and FastSAM.",
    fact: { value: "0", label: "terminal commands needed" },
    description:
      "A desktop editor that finds the parts of an artwork to censor on its own, using YOLO and FastSAM. It can work through a whole folder in one batch and runs in English or Japanese. It installs like any other app, so nobody has to open a terminal.",
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
    summary:
      "Turns a Django API into tools an AI assistant can call, with a chat UI to try them.",
    fact: { value: "1", label: "schema to point it at" },
    description:
      "Point it at an API's OpenAPI schema and it writes the tools an AI assistant needs to use that API. A Next.js chat interface sits on top, and if one model stalls, it moves on to the next. Hooking up a new API takes seconds.",
    tags: ["Python", "MCP", "FastAPI", "Next.js"],
    media: {
      image: mcpVisual,
      alt: "MCP Inspector listing four generated tools and a successful toy-shop product lookup.",
      caption: "Four tools made from a toy-shop API, open in MCP Inspector.",
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
      "Sign-ups, email and WhatsApp confirmations, and a QR ticket for the door.",
    fact: { value: "75,000", label: "guests welcomed" },
    description: [
      "A serverless Next.js app built for 75,000 guests. It takes RSVPs, sends confirmations by email and WhatsApp (through SendGrid and Respond.io), and gives every guest a QR ticket to scan at the door.",
      "I defined the infrastructure in Terraform and deployed it with GitHub Actions, so scaling up for a crowd that size was a config change.",
    ],
    tags: ["Next.js", "Terraform", "Respond.io", "SendGrid"],
    media: {
      image: rsvpVisual,
      aspectRatio: "1040 / 820",
      alt: "An invitation-style registration form alongside a confirmed ticket with a scannable QR code for a Developer Meetup.",
      caption: "The sign-up form, and the ticket a guest shows at the door.",
    },
  },
  {
    id: "ohse",
    title: "OHSE incident-reporting module",
    summary:
      "Managers, safety officers and investigators each get their own incident workflow.",
    fact: { value: "10", label: "business units" },
    description: [
      "Ten business units use this module to report worksite incidents and see each one through to a fix. Managers, safety officers and investigators each need something different from it, so every role gets its own workflow.",
      "I owned it from planning to the GCP rollout. I also set up the team's first Playwright tests and added an MCP server, so an AI assistant can work with the module through its API.",
    ],
    tags: ["Next.js", "Django", "GCP", "MCP"],
    media: {
      image: ohseVisual,
      objectPosition: "left top",
      alt: "An incident-reporting workspace with reports, status filters, search and pagination.",
      caption: "The incident list, with a filter for each status.",
    },
  },
  {
    id: "hr",
    title: "Enterprise HR platform",
    summary: "Faster pages and encrypted personal data for 20,000 employees.",
    fact: { value: "63%", label: "faster page loads" },
    description: [
      "The platform serves 20,000 employees, and some of its pages were slow. I reworked the heaviest modules, the query serialization and the bulk processing, and page loads got 63% faster.",
      "I also added transparent AES-256 encryption for personal data and built PostgreSQL workflows for the analytics team.",
    ],
    tags: ["Svelte", "Django", "PostgreSQL"],
    media: {
      image: hrVisual,
      aspectRatio: "960 / 740",
      alt: "A manager's team view: a list of eight people on the left, and one person's profile with goal progress, review status, goals, recent activity and a learning path.",
      caption: "A manager's view of one person on the team.",
    },
  },
];

const academic: Project[] = [
  {
    id: "heatgen",
    title: "HeatGen",
    summary:
      "Predicts thermal images of pavement from its materials and the weather.",
    fact: { value: "2023", label: "published in JESTEC" },
    description:
      "A university team project that predicts thermal images of pavement bricks from material and weather variables. Our work was published in the peer-reviewed JESTEC journal in 2023.",
    tags: ["Python", "Deep Learning"],
    media: {
      image: heatgenVisual,
      alt: "Observed thermal image of pavement bricks alongside the model's predicted image for sample 1.",
      caption: "A real thermal image beside the model's prediction.",
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
