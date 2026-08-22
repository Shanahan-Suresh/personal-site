#!/usr/bin/env node
/**
 * Placeholder guard. Runs as part of `npm run build`, before `astro build`.
 *
 * Any image whose filename starts with `_placeholder-` is a stand-in that must
 * never reach production. This script fails the build if such a file exists
 * under src/assets/ or is referenced anywhere under src/, unless the build is
 * explicitly marked as local with ALLOW_PLACEHOLDERS=1.
 *
 * Cloudflare Pages runs `npm run build` without that variable, so a stray
 * placeholder fails the deploy loudly and production keeps the previous build.
 *
 * The reference scan is a plain substring match over text files, comments
 * included, so do not write the literal marker anywhere under src/ except
 * the import that actually uses it.
 *
 *   local build with placeholders:  ALLOW_PLACEHOLDERS=1 npm run build
 *   PowerShell:                     $env:ALLOW_PLACEHOLDERS=1; npm run build
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const MARKER = "_placeholder-";
const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".astro",
  ".md",
  ".mdx",
  ".css",
  ".json",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(SRC);
const offendingFiles = files.filter((f) =>
  f.split(/[\\/]/).pop().startsWith(MARKER),
);
const offendingRefs = files
  .filter((f) => TEXT_EXT.has(f.slice(f.lastIndexOf("."))))
  .flatMap((f) =>
    readFileSync(f, "utf8")
      .split("\n")
      .map((line, i) => ({ f, i: i + 1, line }))
      .filter(({ line }) => line.includes(MARKER)),
  );

const rel = (p) => relative(ROOT, p).replaceAll("\\", "/");

if (offendingFiles.length === 0 && offendingRefs.length === 0) {
  console.log("[guard-placeholders] clean: no placeholder images in src/");
  process.exit(0);
}

const allowed = process.env.ALLOW_PLACEHOLDERS === "1";
const log = allowed ? console.warn : console.error;

log(
  `[guard-placeholders] ${allowed ? "WARNING" : "BUILD BLOCKED"}: placeholder images present`,
);
for (const f of offendingFiles) log(`  file  ${rel(f)}`);
for (const { f, i, line } of offendingRefs)
  log(`  ref   ${rel(f)}:${i}  ${line.trim()}`);

if (allowed) {
  log(
    "[guard-placeholders] ALLOW_PLACEHOLDERS=1 set, continuing (local build only).",
  );
  process.exit(0);
}

log("");
log(
  "Swap the placeholders for real images (see CLAUDE.md, 'Placeholder images'),",
);
log("or for a local build only: ALLOW_PLACEHOLDERS=1 npm run build");
process.exit(1);
