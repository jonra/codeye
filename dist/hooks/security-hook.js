import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { SECURITY_RULES } from "../src/security-rules.js";
const STATE_DIR = join(homedir(), ".claude", "plugins", "codeye", "state");
const EVENTS_FILE = join(STATE_DIR, "security-events.jsonl");
const MAX_LINES = 100;
function extractDetail(toolName, toolInput) {
    if (toolName === "Bash") {
        const cmd = toolInput.command ?? "";
        return cmd.slice(0, 60);
    }
    const path = toolInput.file_path ?? toolInput.path ?? "";
    if (path) {
        const segments = path.split("/").filter(Boolean);
        return segments.slice(-2).join("/");
    }
    return "";
}
function readEvents() {
    try {
        if (!existsSync(EVENTS_FILE))
            return [];
        return readFileSync(EVENTS_FILE, "utf8").trim().split("\n").filter(Boolean);
    }
    catch {
        return [];
    }
}
function writeEvents(lines) {
    try {
        if (!existsSync(STATE_DIR)) {
            mkdirSync(STATE_DIR, { recursive: true });
        }
        writeFileSync(EVENTS_FILE, lines.join("\n") + "\n", "utf8");
    }
    catch {
        // Non-fatal
    }
}
async function main() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw)
        return;
    let input;
    try {
        input = JSON.parse(raw);
    }
    catch {
        return;
    }
    const { session_id, tool_name, tool_input } = input;
    if (!tool_name || !tool_input)
        return;
    for (const rule of SECURITY_RULES) {
        if (rule.match(tool_name, tool_input)) {
            const event = {
                ts: Date.now(),
                sessionId: session_id,
                ruleId: rule.id,
                severity: rule.severity,
                label: rule.label,
                tool: tool_name,
                detail: extractDetail(tool_name, tool_input),
            };
            const lines = readEvents();
            lines.push(JSON.stringify(event));
            // Trim to max lines
            const trimmed = lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines;
            writeEvents(trimmed);
            break; // First match only
        }
    }
}
main().catch(() => process.exit(0));
