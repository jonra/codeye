import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ANSI } from "../types.js";
const STATE_DIR = join(homedir(), ".claude", "plugins", "codeye", "state");
const STATE_FILE = join(STATE_DIR, "burn.json");
const MAX_SAMPLES = 20; // keep last 20 samples
const WINDOW_MS = 60 * 1000; // 1 minute rolling window
function loadState() {
    try {
        if (!existsSync(STATE_FILE))
            return null;
        return JSON.parse(readFileSync(STATE_FILE, "utf8"));
    }
    catch {
        return null;
    }
}
function saveState(state) {
    try {
        if (!existsSync(STATE_DIR)) {
            mkdirSync(STATE_DIR, { recursive: true });
        }
        writeFileSync(STATE_FILE, JSON.stringify(state), "utf8");
    }
    catch {
        // Non-fatal — burn rate just won't show
    }
}
function totalInputTokens(input) {
    const u = input.context_window.current_usage;
    if (!u)
        return 0;
    return u.input_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens;
}
export function renderBurnRate(input) {
    const sessionId = input.session_id;
    const now = Date.now();
    const tokens = totalInputTokens(input);
    // Load or initialise state
    let state = loadState();
    if (!state || state.sessionId !== sessionId) {
        // New session — reset
        state = { sessionId, samples: [] };
    }
    // Append new sample
    state.samples.push({ ts: now, tokens });
    // Trim to window
    const cutoff = now - WINDOW_MS;
    state.samples = state.samples.filter((s) => s.ts >= cutoff);
    // Keep max samples cap
    if (state.samples.length > MAX_SAMPLES) {
        state.samples = state.samples.slice(-MAX_SAMPLES);
    }
    saveState(state);
    // Need at least 2 samples to compute rate
    if (state.samples.length < 2)
        return "";
    const oldest = state.samples[0];
    const newest = state.samples[state.samples.length - 1];
    const dTokens = newest.tokens - oldest.tokens;
    const dMin = (newest.ts - oldest.ts) / 60_000;
    if (dMin < 0.1 || dTokens <= 0)
        return ""; // Too short a window
    const rate = Math.round(dTokens / dMin);
    if (rate <= 0)
        return "";
    // Color: normal < 5k/min, elevated < 15k/min, high >= 15k/min
    const color = rate >= 15_000 ? ANSI.brightYellow :
        rate >= 5_000 ? ANSI.cyan :
            ANSI.dim;
    const rateStr = rate >= 1000
        ? `${(rate / 1000).toFixed(1)}k`
        : `${rate}`;
    return `${color}+${rateStr}/min${ANSI.reset}`;
}
