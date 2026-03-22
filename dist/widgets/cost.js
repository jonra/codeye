import { ANSI } from "../types.js";
/**
 * Renders running session cost from Claude Code's native cost field.
 * cost.total_cost_usd is provided directly in the stdin JSON — no estimation needed.
 *
 * Color thresholds (configurable via HudConfig in future):
 *   green  < $0.50
 *   yellow < $2.00
 *   red   >= $2.00
 */
export function renderCost(input) {
    const cost = input.cost?.total_cost_usd;
    // Not available (self-hosted / API key setups may omit this)
    if (cost === undefined || cost === null)
        return "";
    const color = cost >= 2.0 ? ANSI.brightRed :
        cost >= 0.5 ? ANSI.brightYellow :
            ANSI.green;
    const formatted = cost < 0.01
        ? "<$0.01"
        : `$${cost.toFixed(2)}`;
    return `${color}${formatted}${ANSI.reset}`;
}
