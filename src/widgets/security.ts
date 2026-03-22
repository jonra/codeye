import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ANSI, StatusInput, WidgetOutput } from "../types.js";

interface SecurityEvent {
  ts: number;
  sessionId: string;
  ruleId: string;
  severity: "warn" | "alert";
  label: string;
  tool: string;
  detail: string;
}

const EVENTS_FILE = join(homedir(), ".claude", "plugins", "codeye", "state", "security-events.jsonl");
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DISPLAY = 2;

export function renderSecurity(input: StatusInput): WidgetOutput {
  if (!existsSync(EVENTS_FILE)) return "";

  let lines: string[];
  try {
    lines = readFileSync(EVENTS_FILE, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return "";
  }

  const now = Date.now();
  const sessionId = input.session_id;

  // Parse, filter to current session and recent events
  const events: SecurityEvent[] = [];
  for (const line of lines) {
    try {
      const ev = JSON.parse(line) as SecurityEvent;
      if (ev.sessionId === sessionId && now - ev.ts < MAX_AGE_MS) {
        events.push(ev);
      }
    } catch {
      continue;
    }
  }

  if (events.length === 0) return "";

  // Deduplicate by ruleId, keep most recent
  const byRule = new Map<string, SecurityEvent>();
  for (const ev of events) {
    const existing = byRule.get(ev.ruleId);
    if (!existing || ev.ts > existing.ts) {
      byRule.set(ev.ruleId, ev);
    }
  }

  // Sort by timestamp descending, take max 2
  const display = [...byRule.values()]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_DISPLAY);

  const parts = display.map((ev) => {
    const icon = ev.severity === "alert" ? "\u26a0" : "\ud83d\udd10";
    const color = ev.severity === "alert" ? ANSI.brightRed : ANSI.brightYellow;
    const detail = ev.detail ? `  ${ANSI.dim}${ev.detail}${ANSI.reset}` : "";
    return `${color}${icon} ${ev.label}${ANSI.reset}${detail}`;
  });

  return parts.join(`  ${ANSI.dim}\u00b7${ANSI.reset}  `);
}
