import { ANSI } from "../types.js";
// ── Formatting helpers ──────────────────────────────────────────────────────
function formatResetTime(resetsAt) {
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
function colorForPct(pct) {
    if (pct >= 80)
        return ANSI.brightRed;
    if (pct >= 60)
        return ANSI.brightYellow;
    return ANSI.brightGreen;
}
function formatBucket(label, bucket) {
    const pct = Math.round(bucket.used_percentage ?? 0);
    const color = colorForPct(pct);
    const reset = formatResetTime(bucket.resets_at);
    return `${color}${label} ${pct}%${ANSI.reset} ${ANSI.dim}~${reset}${ANSI.reset}`;
}
// ── Main render ─────────────────────────────────────────────────────────────
export function renderRateLimits(input) {
    const limits = input.rate_limits;
    if (!limits)
        return "";
    const parts = [];
    if (limits.five_hour)
        parts.push(formatBucket("5h", limits.five_hour));
    if (limits.seven_day)
        parts.push(formatBucket("7d", limits.seven_day));
    return parts.join(` ${ANSI.dim}·${ANSI.reset} `);
}
