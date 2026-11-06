import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// scripts/guard-placeholders.mjs is the gate that keeps placeholder art off
// the live site. These checks run it against throwaway folders to prove it
// catches what it claims to. They need Node only, so playwright.config.ts runs them in Chromium alone.

const GUARD = resolve("scripts/guard-placeholders.mjs");
const MARK = "_placeholder-"; // the guard scans src/ only, so tests/ may spell it out

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "guard-"));
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

function guard(cwd: string, allow = false) {
  const env = { ...process.env };
  delete env.ALLOW_PLACEHOLDERS;
  if (allow) env.ALLOW_PLACEHOLDERS = "1";
  return spawnSync(process.execPath, [GUARD], { cwd, env, encoding: "utf8" });
}

test.describe("placeholder guard", () => {
  const roots: string[] = [];
  test.afterAll(() =>
    roots.forEach((r) => rmSync(r, { recursive: true, force: true })),
  );
  const make = (files: Record<string, string>) => {
    const r = fixture(files);
    roots.push(r);
    return r;
  };

  test("passes a clean src folder", () => {
    const r = guard(make({ "src/assets/hero.png": "png" }));
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  test("blocks a placeholder file", () => {
    const r = guard(make({ [`src/assets/${MARK}hero.png`]: "png" }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`${MARK}hero.png`);
  });

  test("blocks a reference to a placeholder", () => {
    const r = guard(
      make({
        "src/components/Hero.astro": `import x from "../assets/${MARK}hero.png";`,
      }),
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("src/components/Hero.astro:1");
  });

  test("lets a local build through with ALLOW_PLACEHOLDERS=1", () => {
    const r = guard(make({ [`src/assets/${MARK}hero.png`]: "png" }), true);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("WARNING");
  });
});
