import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, basename } from "path";
import { ANSI } from "../types.js";
const STATE_DIR = join(homedir(), ".claude", "plugins", "codeye", "state");
const SESSION_FILE = join(STATE_DIR, "session.json");
function getSessionStart(sessionId) {
    try {
        if (!existsSync(STATE_DIR)) {
            mkdirSync(STATE_DIR, { recursive: true });
        }
        if (existsSync(SESSION_FILE)) {
            const s = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
            if (s.sessionId === sessionId)
                return s.startedAt;
        }
    }
    catch { /* ignore */ }
    // New session — record start time
    const now = Date.now();
    try {
        writeFileSync(SESSION_FILE, JSON.stringify({ sessionId, startedAt: now }), "utf8");
    }
    catch { /* non-fatal */ }
    return now;
}
function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0)
        return `${h}h${m.toString().padStart(2, "0")}m`;
    if (m > 0)
        return `${m}m${s.toString().padStart(2, "0")}s`;
    return `${s}s`;
}
export function renderModel(input, _config) {
    const name = input.model.display_name;
    return `${ANSI.brightWhite}${ANSI.bold}${name}${ANSI.reset}`;
}
export function renderProject(input, _config) {
    const dir = input.workspace.current_dir || input.cwd;
    const project = basename(dir);
    return `${ANSI.dim}📁 ${project}${ANSI.reset}`;
}
export function renderSessionTime(input, _config) {
    const start = getSessionStart(input.session_id);
    const elapsed = Date.now() - start;
    const duration = formatDuration(elapsed);
    return `${ANSI.dim}⏱ ${duration}${ANSI.reset}`;
}
