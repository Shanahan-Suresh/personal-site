#!/usr/bin/env node
/**
 * CSP inline-script hashes. Runs as the last step of `npm run build`.
 *
 * The site ships two inline scripts (the pre-paint theme snippet and the
 * theme-toggle module Astro inlines). Rather than allow `'unsafe-inline'` for
 * every script on the page, this script hashes the exact inline bodies found
 * in the built HTML and writes them into dist/_headers, replacing the
 * `__CSP_SCRIPT_HASHES__` token in public/_headers.
 *
 * Any inline script that is not hashed is blocked by the browser, so an
 * injected `<script>` cannot run even if some future bug let markup through.
 * Edit an inline script and the hash updates on the next build; nothing to
 * maintain by hand.
 *
 * Fails the build if the token is missing, if no HTML was found, or if the
 * resulting script-src still contains 'unsafe-inline'.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const HEADERS = join(DIST, "_headers");
const TOKEN = "__CSP_SCRIPT_HASHES__";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".html")) out.push(full);
  }
  return out;
}

// Inline = a <script> with no src attribute. Data blocks (type="application/ld+json")
// never execute, so CSP does not apply to them; skip to keep the header short.
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const hashes = new Map(); // hash -> first file seen

const htmlFiles = walk(DIST);
if (htmlFiles.length === 0) {
  console.error("[csp-hashes] no HTML under dist/; run astro build first");
  process.exit(1);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(SCRIPT_RE)) {
    const [, attrs, body] = match;
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i
      .exec(attrs)?.[1]
      ?.toLowerCase();
    if (type && type !== "module" && !/javascript|ecmascript/.test(type))
      continue;
    const hash = createHash("sha256").update(body, "utf8").digest("base64");
    if (!hashes.has(hash)) hashes.set(hash, relative(ROOT, file));
  }
}

const headers = readFileSync(HEADERS, "utf8");
if (!headers.includes(TOKEN)) {
  console.error(
    `[csp-hashes] ${TOKEN} not found in dist/_headers (copied from public/_headers)`,
  );
  process.exit(1);
}

const sources = [...hashes.keys()].map((h) => `'sha256-${h}'`).join(" ");
// The token sits on the header line only; the file's two-space header
// indentation (which Cloudflare needs) is left untouched.
const out = headers.replaceAll(TOKEN, sources);

// Validate the real header line, not the explanatory comment above it.
const cspLine =
  out.split(/\r?\n/).find((l) => /^\s+Content-Security-Policy:/i.test(l)) ?? "";
const scriptSrc = /script-src\s+([^;]+)/i.exec(cspLine)?.[1] ?? "";
if (!cspLine || /unsafe-inline/.test(scriptSrc)) {
  console.error(
    "[csp-hashes] script-src still contains 'unsafe-inline'; refusing to write",
  );
  process.exit(1);
}

writeFileSync(HEADERS, out);
console.log(
  `[csp-hashes] ${hashes.size} inline script hash(es) written to dist/_headers`,
);
for (const [h, f] of hashes)
  console.log(`  sha256-${h.slice(0, 12)}…  first seen in ${f}`);
