import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ANSI } from "../types.js";
/**
 * Stall detection — surfaces a warning when Claude Code appears to have
 * stopped making progress during an active session.
 *
 * Logic:
 * - We track the last timestamp at which the total token count changed.
 * - If tokens haven't grown for STALL_WARN_SEC, show a ⏸ indicator.
 * - If no tokens at all (fresh session), suppress — not a stall.
 * - Resets automatically when tokens start moving again.
 */
const STATE_DIR = join(homedir(), ".claude", "plugins", "codeye", "state");
const STALL_FILE = join(STATE_DIR, "stall.json");
const STALL_WARN_SEC = 30; // show indicator after 30s of no token growth
const STALL_CRIT_SEC = 90; // escalate to red after 90s
function totalTokens(input) {
    return (input.context_window.total_input_tokens || 0) +
        (input.context_window.total_output_tokens || 0);
}
function loadStall() {
    try {
        if (existsSync(STALL_FILE)) {
            return JSON.parse(readFileSync(STALL_FILE, "utf8"));
        }
    }
    catch { /* ignore */ }
    return null;
}
function saveStall(s) {
    try {
        if (!existsSync(STATE_DIR))
            mkdirSync(STATE_DIR, { recursive: true });
        writeFileSync(STALL_FILE, JSON.stringify(s), "utf8");
    }
    catch { /* non-fatal */ }
}
export function renderStall(input) {
    const tokens = totalTokens(input);
    const now = Date.now();
    // No tokens at all — fresh session, not a stall
    if (tokens === 0)
        return "";
    let state = loadStall();
    if (!state || state.sessionId !== input.session_id) {
        // New session
        state = { sessionId: input.session_id, lastTokenCount: tokens, lastChangeTs: now };
        saveStall(state);
        return "";
    }
    if (tokens !== state.lastTokenCount) {
        // Tokens moved — reset the clock
        state.lastTokenCount = tokens;
        state.lastChangeTs = now;
        saveStall(state);
        return "";
    }
    // Tokens haven't changed — measure elapsed silence
    const stallSec = (now - state.lastChangeTs) / 1000;
    if (stallSec >= STALL_CRIT_SEC) {
        const mins = Math.floor(stallSec / 60);
        const secs = Math.floor(stallSec % 60);
        const elapsed = mins > 0 ? `${mins}m${secs}s` : `${Math.floor(stallSec)}s`;
        return `${ANSI.brightRed}${ANSI.bold}⏸ stalled ${elapsed}${ANSI.reset}`;
    }
    if (stallSec >= STALL_WARN_SEC) {
        const elapsed = `${Math.floor(stallSec)}s`;
        return `${ANSI.brightYellow}⏸ ${elapsed}${ANSI.reset}`;
    }
    return "";
}
