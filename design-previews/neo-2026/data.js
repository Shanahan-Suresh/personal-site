// Real site content, copied from src/data/projects.ts, src/lib/site-config.ts and the section components.
// Every mockup reads window.SITE so the comparison is about design, not copy.
window.SITE = {
  name: "Shanahan Suresh",
  role: "Product-minded software engineer",
  headline: ["I build full-stack", "products & AI tooling."],
  lead:
    "I'm a software engineer and a Computer Science with AI graduate from the University of Nottingham. I turn ideas into products people enjoy using, with as much care for how they feel as how they're built.",
  about: [
    "Long before my first Hello World, I wanted to be an inventor. These days I make things that live in code, from bite-sized apps to large systems. Creating something from nothing still feels awesome.",
    "I think of myself as a product engineer. I enjoy building systems and shaping the experience around them. The best products should feel right.",
    "I'm obsessive about polish. Once I spot a rough edge or a bug, it's hard to leave it alone.",
  ],
  aboutTitle: "From wanting to be an inventor to building products",
  principles: [
    { title: "Make it a joy to use", body: "People remember how software feels. Every engineering design decision should start there." },
    { title: "Love is in the details", body: "Small imperfections add up. The little interactions and polish are worth the extra mile to me." },
    { title: "Let robots handle the boring bits", body: "Life's too short for repetitive work, that's what LLMs are for. So we can focus on crafting the fun stuff." },
  ],
  now: [
    "I'm getting deeper into deployment infrastructure and DevOps, using Terraform on real projects and teaching myself AWS. Kubernetes is next.",
    "Agentic coding takes up a lot of my day. I'm exploring how to build useful systems with LLMs, and how they change the way I work.",
  ],
  learning: ["AWS", "Kubernetes"],
  tools: ["Next.js", "React", "Svelte", "TypeScript", "Python", "Django", "Docker", "Google Cloud Platform", "Terraform", "GitHub Actions"],
  interests: [
    { title: "Anime, games & light novels", caption: "Ask me about any of them and I can go a while.", img: "img/games.webp", alt: "Blue and red Nintendo Switch controllers in warm window light." },
    { title: "Four evenings a week", caption: "In the gym, with a good reason to close the laptop.", img: "img/gym.webp", alt: "Sunlight across a barbell, weight plates and bench in an empty gym." },
    { title: "The next trip", caption: "Usually half-planning a trip somewhere.", img: "img/trip.webp", alt: "A wooden boathouse and mountain peaks reflected in Lago di Braies." },
    { title: "Investing & personal finance", caption: "Another interest that keeps me reading.", img: "img/finance.webp", alt: "Candlesticks and moving-average lines on a market screen." },
  ],
  contactLead:
    "I'm always up for interesting work and a good conversation, whether that's professional, a passion project, or something a bit weird and fun. If anything here caught your eye, my inbox is open.",
  email: "hello@shanahansuresh.com",
  linkedin: { label: "linkedin.com/in/shanahan-suresh", href: "https://www.linkedin.com/in/shanahan-suresh" },
  github: { label: "github.com/Shanahan-Suresh", href: "https://github.com/Shanahan-Suresh" },
  portrait: "img/portrait.webp",
  projects: [
    {
      id: "digest", group: "Personal", featured: true, title: "Tech Scout Digest",
      short: "A daily newsletter where an LLM curates the news around each team's stack.",
      body: "A daily newsletter that helps teams keep up with the technology they use. An LLM picks relevant stories around the team's stack and brings them together in one easy read. The setup is driven by configuration and runs on GCP, scaling to zero between editions.",
      tags: ["Python", "GCP", "Terraform", "LLMs"], img: "img/digest.webp", ratio: "1120/700",
      caption: "A few good stories to start the day.", fact: ["0", "servers between editions"],
    },
    {
      id: "censorit", group: "Personal", title: "Automated artwork censoring app",
      short: "A desktop editor that finds regions to censor with YOLO and FastSAM.",
      body: "A desktop artwork editor with automatic region detection through YOLO and FastSAM. It handles batch jobs, speaks English and Japanese, and ships as an app people can run without touching a terminal.",
      tags: ["Python", "YOLO", "FastSAM"], img: "img/censorit.webp", ratio: "1120/700",
      caption: "Cabanel's The Birth of Venus (1875), with a little discretion.", fact: ["2", "languages, EN and JP"],
      link: { label: "Artwork source (The Met)", href: "https://www.metmuseum.org/art/collection/search/435831" },
    },
    {
      id: "mcp", group: "Personal", title: "OpenAPI → MCP server + chat UI",
      short: "Turns any API schema into tools an AI assistant can call.",
      body: "Point it at any API's schema and it generates a set of LLM-callable tools on its own, falling back across models if one stalls, all wired into a Next.js chat interface. It lets an AI assistant pick up a brand-new tool in seconds.",
      tags: ["Python", "MCP", "FastAPI", "Next.js"], img: "img/mcp.webp", ratio: "1120/700",
      caption: "Give an AI assistant a new set of tools.", fact: ["1", "schema in, a full toolset out"],
      link: { label: "Read the write-up", href: "https://dev.to/shanahansuresh/wiring-django-to-claude-generating-an-mcp-server-from-openapi-1e8a" },
    },
    {
      id: "rsvp", group: "Corporate work", featured: true, title: "Automated RSVP & check-in web app",
      short: "Serverless RSVPs, confirmations and QR check-in for 75,000 guests.",
      body: "Built to welcome 75,000 guests. This serverless Next.js app handles RSVPs and check-in, sends email and WhatsApp confirmations through SendGrid and Respond.io, and gives each guest a scannable QR ticket. I defined the stack in Terraform and shipped it through GitHub Actions, so scaling for a crowd that size comes down to config rather than a late night.",
      tags: ["Next.js", "Terraform", "Respond.io", "SendGrid"], img: "img/rsvp.webp", ratio: "1040/820",
      caption: "From signing up to a scan at the door.", fact: ["75,000", "guests welcomed"],
    },
    {
      id: "ohse", group: "Corporate work", title: "OHSE incident-reporting module",
      short: "Role-based incident workflows across 10 business units.",
      body: "This is where worksite incidents get reported, investigated, and put right across 10 business units. I built role-based workflows around the different needs of managers, safety officers, and investigators. I owned planning through GCP rollout, introduced the team's first Playwright suite, and added an MCP server that turns its OpenAPI schema into tools an AI assistant can call.",
      tags: ["Next.js", "Django", "GCP", "MCP"], img: "img/ohse.webp", ratio: "1200/675",
      caption: "Turning incident reports into action.", fact: ["10", "business units"],
    },
    {
      id: "hr", group: "Corporate work", title: "Enterprise HR platform",
      short: "Page loads cut by 63% for 20,000 employees.",
      body: "For a platform used by 20,000 employees, I reworked heavy modules, query serialization and bulk processing to cut page-load times by 63%. I also protected PII with AES-256 transparent encryption and built custom PostgreSQL workflows for the analytics team.",
      tags: ["Svelte", "Django", "PostgreSQL"], img: "img/hr.webp", ratio: "960/740",
      caption: "A clearer view of the team, with less waiting around.", fact: ["63%", "faster page loads"],
    },
    {
      id: "heatgen", group: "Academic", title: "HeatGen",
      short: "Predicts thermal images of pavement from materials and weather. Published 2023.",
      body: "A university team project that predicts thermal images of pavement bricks from material and weather variables. Our work was published in the peer-reviewed JESTEC journal in 2023.",
      tags: ["Python", "Deep Learning"], img: "img/heatgen.webp", ratio: "1120/700",
      caption: "From weather and materials to a thermal forecast.", fact: ["2023", "published in JESTEC"],
      link: { label: "Read the paper", href: "https://jestec.taylors.edu.my/Vol%2018%20Issue%202%20April%202023/18_2_16.pdf" },
    },
  ],
};

// Small helpers shared by the mockups.
window.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
window.groups = () => {
  const out = [];
  for (const p of window.SITE.projects) {
    let g = out.find((x) => x.label === p.group);
    if (!g) out.push((g = { label: p.group, items: [] }));
    g.items.push(p);
  }
  return out;
};
// Theme toggle used by every mockup: flips data-theme on <html>.
window.wireTheme = (btn) => {
  if (!btn) return;
  btn.addEventListener("click", () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  });
};
// First n sentences of a body, ending in exactly one full stop.
window.lede = (s, n = 2) => {
  return s.split(/(?<=[.!?])\s+(?=[A-Z])/).slice(0, n).join(" ");
};
