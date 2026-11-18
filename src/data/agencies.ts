/* The /agencies page: what I take on for agencies, the terms, the starting
   prices and the sample sites. Each price is a round figure in every currency
   the page offers, set by hand from the pound price; Wise receives all four. Scores are Lighthouse mobile results measured
   on the live samples; re-measure when a sample changes. */
import thornwickShot from "@/assets/agencies/thornwick.webp";
import fernhollowShot from "@/assets/agencies/fernhollow.webp";
import pennywortShot from "@/assets/agencies/pennywort.webp";
import type {
  AgencyFaq,
  AgencyPrice,
  AgencySample,
  AgencyService,
  AgencyTerm,
  Currency,
} from "@/lib/types";

export const services: AgencyService[] = [
  {
    name: "Sites from your design",
    detail:
      "Your Figma file built as a WordPress block theme or a Next.js site, with the layout, type and spacing as designed. Editors get blocks they can use without breaking the page.",
  },
  {
    name: "Web apps and custom features",
    detail:
      "Booking systems, client portals, dashboards and API integrations, from the database to the screen, in whatever stack the job needs.",
  },
  {
    name: "Fixes for AI-built sites",
    detail:
      "Sites made with Lovable, Bolt, v0 or a page builder that break, load slowly or leak data. I find the cause, fix it and check the security basics.",
  },
  {
    name: "Accessibility checks",
    detail:
      "I check that everyone can use the site, including people on a keyboard or a screen reader, against WCAG, the standard UK and EU accessibility rules use. I fix what fails and write up the results for your client.",
  },
  {
    name: "Launch work",
    detail:
      "DNS, email records, certificates, redirects and site moves between hosts. I started my career in web hosting support, so launches are familiar ground.",
  },
];

export const terms: AgencyTerm[] = [
  {
    title: "Your name on the work",
    detail:
      "I work behind your agency. I never contact your client, and I never take on your clients' work directly.",
  },
  {
    title: "Fixed quotes",
    detail:
      "A one-page scope before work starts, with the price fixed. A change of scope gets its own quote, in writing.",
  },
  {
    title: "Your office hours",
    detail:
      "Replies in your working hours, in the UK, Australia or Singapore, and a written update twice a week until the hand-off.",
  },
  {
    title: "A clear contract",
    detail:
      "A written contract before work starts. You own the work once it is paid for, and the contract covers data protection when client data is involved.",
  },
];

export const currencies: { code: Currency; label: string }[] = [
  { code: "GBP", label: "£ GBP" },
  { code: "USD", label: "$ USD" },
  { code: "AUD", label: "$ AUD" },
  { code: "SGD", label: "$ SGD" },
];

export const prices: AgencyPrice[] = [
  {
    values: { GBP: "£150", USD: "$200", AUD: "$300", SGD: "$260" },
    label: "Small jobs, from",
    note: "One fix, one feature or one page built from your design.",
  },
  {
    values: { GBP: "£1,400", USD: "$1,850", AUD: "$2,850", SGD: "$2,400" },
    label: "A new site, from",
    note: "Up to about five pages from your design, WordPress or Next.js.",
  },
  {
    values: { GBP: "£250", USD: "$330", AUD: "$500", SGD: "$430" },
    label: "A day, for busy periods",
    note: "Extra hands when your team is full, booked by the day.",
  },
];

export const samples: AgencySample[] = [
  {
    name: "Thornwick Plumbing & Heating",
    href: "https://thornwick.shanahansuresh.com/",
    shot: thornwickShot,
    kind: "Trade business, WordPress",
    detail:
      "A page for each service in each town, the way trades win local searches.",
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
    shot: fernhollowShot,
    kind: "Clinic, WordPress",
    detail: "Treatment pages, clear prices, a team page and a booking form.",
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
    shot: pennywortShot,
    kind: "Café and bakery, Next.js",
    detail:
      "The menu, opening hours, baking classes and a contact form, served as static pages.",
    stack: ["Next.js", "React", "Cloudflare Workers"],
    scores: [
      { label: "Speed", value: "94–97" },
      { label: "Accessibility", value: "100" },
      { label: "Best practices", value: "100" },
    ],
  },
];

/* Answers follow the contract template in agency-studio/templates/contract.md:
   confidentiality (3), payment within 14 days and a first-job deposit (5),
   free fixes for 30 days after launch (6.4). */
export const faqs: AgencyFaq[] = [
  {
    question: "Do you sign an NDA?",
    answer:
      "Yes. The contract already keeps your work and your client's details confidential, and I'm happy to sign your own NDA as well.",
  },
  {
    question: "How do I pay?",
    answer:
      "By bank transfer in pounds, US, Australian or Singapore dollars, within 14 days of the invoice. On a first job, a deposit is paid before I start.",
  },
  {
    question: "What if something breaks after hand-off?",
    answer:
      "I fix bugs in my own work at no charge when you report them within 30 days of launch. After that, fixes and changes are quoted like any other job.",
  },
  {
    question: "Which tools do you work in?",
    answer:
      "Whatever your team already uses. Designs in Figma, Sketch or Adobe XD, code in GitHub, GitLab or Bitbucket, tasks in Jira, Linear, Asana or Trello, and updates in your Slack or Teams.",
  },
  {
    question: "Can you work on our hosting and staging site?",
    answer:
      "Yes. I work in your Git repository, on your staging site and your hosting, with the access you give me. Nothing goes live until you sign it off.",
  },
];

/* The three steps under "Start with a free quote". The terms type fits: a title and one line. */
export const quoteSteps: AgencyTerm[] = [
  {
    title: "Send the brief",
    detail: "The job, your deadline and a link to the design.",
  },
  {
    title: "Get a fixed quote",
    detail: "A one-page scope and one price, within one working day.",
  },
  {
    title: "Sign and start",
    detail: "You sign the scope, and the work starts.",
  },
];
