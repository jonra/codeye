import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { execFileSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { ANSI } from "../types.js";
// ── Constants ───────────────────────────────────────────────────────────────
const STATE_DIR = join(homedir(), ".claude", "plugins", "codeye", "state");
const CACHE_FILE = join(STATE_DIR, "rate-limits.json");
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const API_URL = "https://api.anthropic.com/api/oauth/usage";
// ── Token retrieval ─────────────────────────────────────────────────────────
function getAccessToken() {
    // macOS Keychain
    if (process.platform === "darwin") {
        try {
            const raw = execFileSync("security", ["find-generic-password", "-s", "Claude Code-credentials", "-w"], { encoding: "utf8", timeout: 3000, stdio: ["pipe", "pipe", "pipe"] }).trim();
            const parsed = JSON.parse(raw);
            return parsed?.claudeAiOauth?.accessToken ?? null;
        }
        catch {
            // Fall through to file-based credentials
        }
    }
    // Fallback: ~/.claude/.credentials.json (Linux/WSL)
    try {
        const credPath = join(homedir(), ".claude", ".credentials.json");
        const raw = readFileSync(credPath, "utf8");
        const parsed = JSON.parse(raw);
        return parsed?.claudeAiOauth?.accessToken ?? null;
    }
    catch {
        return null;
    }
}
// ── Cache ───────────────────────────────────────────────────────────────────
function loadCache() {
    try {
        if (!existsSync(CACHE_FILE))
            return null;
        const cached = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
        if (Date.now() - cached.ts > CACHE_TTL_MS)
            return null;
        return cached;
    }
    catch {
        return null;
    }
}
function saveCache(data) {
    try {
        if (!existsSync(STATE_DIR)) {
            mkdirSync(STATE_DIR, { recursive: true });
        }
        writeFileSync(CACHE_FILE, JSON.stringify({ ts: Date.now(), data }), "utf8");
    }
    catch {
        // Non-fatal
    }
}
// ── API fetch ───────────────────────────────────────────────────────────────
async function fetchRateLimits() {
    const token = getAccessToken();
    if (!token)
        return null;
    try {
        const res = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok)
            return null;
        return (await res.json());
    }
    catch {
        return null;
    }
}
// ── Formatting helpers ──────────────────────────────────────────────────────
function formatResetTime(resetsAt) {
    // Support both ISO 8601 strings and Unix epoch seconds
    const resetMs = typeof resetsAt === "number" ? resetsAt * 1000 : new Date(resetsAt).getTime();
    const diff = resetMs - Date.now();
    if (diff <= 0)
        return "now";
    const totalMin = Math.floor(diff / 60_000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0)
        return hours > 0 ? `${days}d${hours}h` : `${days}d`;
    if (hours > 0)
        return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    return `${mins}m`;
}
function colorForUtilization(pct) {
    if (pct >= 80)
        return ANSI.brightRed;
    if (pct >= 60)
        return ANSI.brightYellow;
    return ANSI.brightGreen;
}
function formatBucket(label, bucket) {
    // Support both API format (utilization 0.0–1.0) and native format (used_percentage 0–100)
    const pct = bucket.used_percentage != null
        ? Math.round(bucket.used_percentage)
        : Math.round((bucket.utilization ?? 0) * 100);
    const color = colorForUtilization(pct);
    const reset = formatResetTime(bucket.resets_at);
    return `${color}${label} ${pct}%${ANSI.reset} ${ANSI.dim}↺${reset}${ANSI.reset}`;
}
// ── Main render ─────────────────────────────────────────────────────────────
export async function renderRateLimits(input) {
    // Path B: native rate_limits field on stdin input
    const native = input.rate_limits;
    if (native) {
        const parts = [];
        if (native.five_hour)
            parts.push(formatBucket("5h", native.five_hour));
        if (native.seven_day)
            parts.push(formatBucket("7d", native.seven_day));
        return parts.join(` ${ANSI.dim}·${ANSI.reset} `);
    }
    // Path A: fetch from API with caching
    let data = null;
    const cached = loadCache();
    if (cached) {
        data = cached.data;
    }
    else {
        data = await fetchRateLimits();
        if (data)
            saveCache(data);
    }
    if (!data)
        return "";
    const parts = [];
    if (data.five_hour)
        parts.push(formatBucket("5h", data.five_hour));
    if (data.seven_day)
        parts.push(formatBucket("7d", data.seven_day));
    return parts.join(` ${ANSI.dim}·${ANSI.reset} `);
}
