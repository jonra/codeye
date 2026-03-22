// Claude Code statusline stdin JSON schema
// Sent every ~300ms while Claude Code is running

export interface StatusInput {
  hook_event_name: "Status";
  session_id: string;
  cwd: string;
  model: {
    id: string;
    display_name: string;
  };
  workspace: {
    current_dir: string;
    project_dir?: string;
  };
  context_window: {
    used_percentage: number;       // 0–100, input-tokens based
    remaining_percentage: number;  // 0–100
    current_usage: {
      input_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
      output_tokens: number;
    } | null;                      // null before first API call
    context_window_size: number;   // e.g. 200000
    total_input_tokens: number;    // cumulative — may exceed window
    total_output_tokens: number;
  };
  cost?: {
    total_cost_usd: number;
    total_lines_added?: number;
    total_lines_removed?: number;
  };
}

// ANSI color codes
export const ANSI = {
  reset:         "\x1b[0m",
  bold:          "\x1b[1m",
  dim:           "\x1b[2m",

  // Foreground
  black:         "\x1b[30m",
  red:           "\x1b[31m",
  green:         "\x1b[32m",
  yellow:        "\x1b[33m",
  blue:          "\x1b[34m",
  magenta:       "\x1b[35m",
  cyan:          "\x1b[36m",
  white:         "\x1b[37m",
  brightRed:     "\x1b[91m",
  brightGreen:   "\x1b[92m",
  brightYellow:  "\x1b[93m",
  brightBlue:    "\x1b[94m",
  brightCyan:    "\x1b[96m",
  brightWhite:   "\x1b[97m",
} as const;

export type WidgetOutput = string; // ANSI-formatted string segment

export interface WidgetContext {
  input: StatusInput;
  config: HudConfig;
  prevInput?: StatusInput;  // previous tick — used for burn rate
}

export interface HudConfig {
  // Context bar
  contextBarWidth: number;        // default 10
  contextWarnAt: number;          // default 70
  contextCritAt: number;          // default 90

  // Git
  gitEnabled: boolean;
  gitShowDirty: boolean;          // show +N ~M indicators
  gitShowAheadBehind: boolean;    // show ↑2 ↓1

  // Burn rate
  burnRateEnabled: boolean;       // show tokens/min
  burnRateWindow: number;         // seconds to average over (default 60)

  // Cost
  costEnabled: boolean;
  costWarnAt: number;             // default 0.50 — yellow above this
  costCritAt: number;             // default 2.00 — red above this

  // Stall detection
  stallEnabled: boolean;
  stallWarnSec: number;           // default 30s — show ⏸ indicator
  stallCritSec: number;           // default 90s — escalate to red

  // Display
  separator: string;              // between widgets, default " │ "
  showModel: boolean;
  showProject: boolean;
  showSessionTime: boolean;
}

export const DEFAULT_CONFIG: HudConfig = {
  contextBarWidth: 10,
  contextWarnAt: 70,
  contextCritAt: 90,
  gitEnabled: true,
  gitShowDirty: true,
  gitShowAheadBehind: true,
  burnRateEnabled: true,
  burnRateWindow: 60,
  costEnabled: true,
  costWarnAt: 0.50,
  costCritAt: 2.00,
  stallEnabled: true,
  stallWarnSec: 30,
  stallCritSec: 90,
  separator: " │ ",
  showModel: true,
  showProject: true,
  showSessionTime: true,
};
