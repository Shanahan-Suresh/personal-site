import { execFileSync } from "node:child_process";

/** The commit a build came from, for the footer's build link and card. */
export interface BuildInfo {
  commit: string;
  shortSha: string;
  /** The commit's subject and date. Null when a shallow clone lacks it. */
  described: { subject: string; day: string } | null;
}

const git = (...args: string[]): string =>
  execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();

/* Cloudflare Workers Builds exposes the deployed commit; local builds fall
   back to git. */
function resolveCommit(): string | null {
  const fromEnv = process.env.WORKERS_CI_COMMIT_SHA;
  if (fromEnv) return fromEnv;
  try {
    return git("rev-parse", "HEAD");
  } catch {
    return null;
  }
}

function describeCommit(sha: string): BuildInfo["described"] {
  try {
    const [subject, date] = git("log", "-1", "--format=%s%n%cI", sha).split(
      "\n",
    );
    if (!subject || !date) return null;
    const day = new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    return { subject, day };
  } catch {
    return null;
  }
}

let cached: BuildInfo | null | undefined;

/** Build identity, resolved once per build (static output, never at
 *  runtime). Null when neither the environment nor git knows the commit. */
export function getBuildInfo(): BuildInfo | null {
  if (cached === undefined) {
    const commit = resolveCommit();
    cached = commit
      ? {
          commit,
          shortSha: commit.slice(0, 7),
          described: describeCommit(commit),
        }
      : null;
  }
  return cached;
}
