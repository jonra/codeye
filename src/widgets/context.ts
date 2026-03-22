import { ANSI, WidgetContext, WidgetOutput } from "../types.js";

// Simple state for burn rate calculation — persists across invocations via module scope
// Since the process is re-spawned each tick, we use a file-based cache instead
// (see burn-rate.ts). This module handles rendering only.

export function renderContextBar(ctx: WidgetContext): WidgetOutput {
  const { input, config } = ctx;
  const pct = Math.round(input.context_window.used_percentage);
  const barWidth = config.contextBarWidth;

  // Pick color based on thresholds
  const color =
    pct >= config.contextCritAt
      ? ANSI.brightRed
      : pct >= config.contextWarnAt
      ? ANSI.brightYellow
      : ANSI.brightGreen;

  // Build bar: filled = ▓, empty = ░
  const filled = Math.round((pct / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = color + "▓".repeat(filled) + ANSI.dim + "░".repeat(empty) + ANSI.reset;

  const label = `${color}${pct}%${ANSI.reset}`;

  return `${bar} ${label}`;
}

export function renderContextFull(ctx: WidgetContext): WidgetOutput {
  const bar = renderContextBar(ctx);
  const { input } = ctx;
  const usage = input.context_window.current_usage;

  if (!usage) {
    // Before first API call — no token data yet
    return bar;
  }

  const totalInputK = Math.round(
    (usage.input_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens) / 1000
  );

  return `${bar} ${ANSI.dim}${totalInputK}k${ANSI.reset}`;
}
