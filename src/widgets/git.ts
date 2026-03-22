import { execSync } from "child_process";
import { ANSI, HudConfig, WidgetOutput } from "../types.js";

interface GitStatus {
  branch: string;
  staged: number;
  modified: number;
  untracked: number;
  ahead: number;
  behind: number;
  isRepo: boolean;
}

function runGit(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, {
      cwd,
      encoding: "utf8",
      timeout: 1500,       // hard timeout — statusline must be fast
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function getGitStatus(cwd: string): GitStatus {
  // Quick check: are we in a git repo?
  const root = runGit("git rev-parse --git-dir", cwd);
  if (!root) {
    return { branch: "", staged: 0, modified: 0, untracked: 0, ahead: 0, behind: 0, isRepo: false };
  }

  const branch = runGit("git branch --show-current", cwd)
    || runGit("git rev-parse --short HEAD", cwd)  // detached HEAD fallback
    || "HEAD";

  // --porcelain=v1: XY PATH
  // X = staged status, Y = unstaged status
  // ?? = untracked
  const porcelain = runGit("git status --porcelain=v1", cwd);
  let staged = 0, modified = 0, untracked = 0;

  for (const line of porcelain.split("\n").filter(Boolean)) {
    const x = line[0]; // staged
    const y = line[1]; // unstaged
    if (line.startsWith("??")) {
      untracked++;
    } else {
      if (x !== " " && x !== "?") staged++;
      if (y !== " " && y !== "?") modified++;
    }
  }

  // Ahead/behind vs upstream
  let ahead = 0, behind = 0;
  const ab = runGit("git rev-list --count --left-right @{upstream}...HEAD 2>/dev/null || true", cwd);
  if (ab) {
    const parts = ab.split("\t");
    if (parts.length === 2) {
      behind = parseInt(parts[0], 10) || 0;
      ahead  = parseInt(parts[1], 10) || 0;
    }
  }

  return { branch, staged, modified, untracked, ahead, behind, isRepo: true };
}

export function renderGit(cwd: string, config: HudConfig): WidgetOutput {
  if (!config.gitEnabled) return "";

  const git = getGitStatus(cwd);
  if (!git.isRepo) return "";

  // Branch name — truncate long ones
  const branchDisplay = git.branch.length > 24
    ? git.branch.slice(0, 22) + "…"
    : git.branch;

  let out = `${ANSI.brightBlue}⎇ ${branchDisplay}${ANSI.reset}`;

  if (config.gitShowDirty) {
    const parts: string[] = [];
    if (git.staged   > 0) parts.push(`${ANSI.brightGreen}+${git.staged}${ANSI.reset}`);
    if (git.modified > 0) parts.push(`${ANSI.brightYellow}~${git.modified}${ANSI.reset}`);
    if (git.untracked > 0) parts.push(`${ANSI.dim}?${git.untracked}${ANSI.reset}`);
    if (parts.length > 0) out += ` ${parts.join(" ")}`;
  }

  if (config.gitShowAheadBehind) {
    if (git.ahead  > 0) out += ` ${ANSI.green}↑${git.ahead}${ANSI.reset}`;
    if (git.behind > 0) out += ` ${ANSI.red}↓${git.behind}${ANSI.reset}`;
  }

  return out;
}
