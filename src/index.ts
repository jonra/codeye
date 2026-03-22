#!/usr/bin/env bun
/**
 * codeye — Claude Code statusline plugin
 *
 * Claude Code pipes JSON to stdin every ~300ms.
 * We parse it, render widgets, and print to stdout.
 * Output is a single line (multi-line via \n is supported by Claude Code).
 */

import { StatusInput, DEFAULT_CONFIG, ANSI } from "./types.js";
import { renderContextFull } from "./widgets/context.js";
import { renderBurnRate } from "./widgets/burn-rate.js";
import { renderGit } from "./widgets/git.js";
import { renderModel, renderProject, renderSessionTime } from "./widgets/session.js";
import { renderCost } from "./widgets/cost.js";
import { renderStall } from "./widgets/stall.js";

// ── Read stdin ───────────────────────────────────────────────────────────────

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

// ── Parse input ──────────────────────────────────────────────────────────────

function parseInput(raw: string): StatusInput | null {
  try {
    return JSON.parse(raw) as StatusInput;
  } catch {
    return null;
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function joinWidgets(widgets: string[], sep: string): string {
  return widgets.filter((w) => w.length > 0).join(sep);
}

function render(input: StatusInput): string {
  const config = DEFAULT_CONFIG;
  const sep = config.separator;

  // ── Line 1: model │ project │ session time │ cost ──────────────────────
  const line1Parts: string[] = [];

  if (config.showModel)       line1Parts.push(renderModel(input, config));
  if (config.showProject)     line1Parts.push(renderProject(input, config));
  if (config.showSessionTime) line1Parts.push(renderSessionTime(input, config));
  if (config.costEnabled) {
    const cost = renderCost(input);
    if (cost) line1Parts.push(cost);
  }

  // ── Line 2: context bar │ burn rate │ stall │ git ───────────────────────
  const line2Parts: string[] = [];

  // Context bar + token count
  const ctx = renderContextFull({ input, config });
  line2Parts.push(ctx);

  // Burn rate (only if we have usage data)
  if (config.burnRateEnabled && input.context_window.current_usage) {
    const burn = renderBurnRate(input);
    if (burn) line2Parts.push(burn);
  }

  // Stall detection
  if (config.stallEnabled) {
    const stall = renderStall(input);
    if (stall) line2Parts.push(stall);
  }

  // Git
  if (config.gitEnabled) {
    const git = renderGit(input.cwd, config);
    if (git) line2Parts.push(git);
  }

  const line1 = joinWidgets(line1Parts, sep);
  const line2 = joinWidgets(line2Parts, sep);

  return [line1, line2].filter(Boolean).join("\n");
}

// ── Compact nudge ────────────────────────────────────────────────────────────
// If context is above 70%, append a suggestion to the second line

function maybeAddNudge(output: string, input: StatusInput): string {
  const pct = input.context_window.used_percentage;
  const lines = output.split("\n");

  if (pct >= 90) {
    lines[lines.length - 1] += `  ${ANSI.brightRed}${ANSI.bold}⚠ /compact now${ANSI.reset}`;
  } else if (pct >= 70) {
    lines[lines.length - 1] += `  ${ANSI.brightYellow}💡 consider /compact${ANSI.reset}`;
  }

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const raw = await readStdin();

  if (!raw) {
    // No input — print nothing (Claude Code will hide the statusline)
    process.exit(0);
  }

  const input = parseInput(raw);

  if (!input) {
    // Malformed JSON — print nothing
    process.exit(0);
  }

  let output = render(input);
  output = maybeAddNudge(output, input);

  process.stdout.write(output + "\n");
}

main().catch(() => process.exit(1));
