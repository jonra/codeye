export interface SecurityRule {
  id: string;
  severity: "warn" | "alert";
  label: string;
  match(toolName: string, toolInput: Record<string, any>): boolean;
}

const SENSITIVE_PATH_PATTERNS = [
  /\.env($|\.)/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /secrets\./i,
  /credentials/i,
  /\.aws\/credentials/i,
  /\.npmrc$/i,
  /\.netrc$/i,
  /\/etc\/passwd/,
  /\/etc\/shadow/,
  /\.credentials/i,
  /keystore/i,
  /\.vault-token/i,
];

function matchesSensitivePath(path: string): boolean {
  return SENSITIVE_PATH_PATTERNS.some((p) => p.test(path));
}

const DANGEROUS_BASH_PATTERNS = [
  /rm\s+-rf\s+\//,
  /curl\s.*\|\s*bash/i,
  /wget\s.*\|\s*sh/i,
  /chmod\s+777/,
  /\bsudo\b/,
  />\s*\/etc\//,
  /\bdd\s+if=/,
  /\bmkfs\./,
  /\bshred\b/,
  /:\(\)\{\s*:\|:\s*&\s*\}/,
  /base64\s+-d\s*\|\s*sh/i,
  /eval.*base64/i,
  /\bnc\s+.*-[el]/,
];

const SECRET_CONTENT_PATTERNS = [
  /-----BEGIN PRIVATE KEY/,
  /sk-ant-/,
  /ghp_/,
  /AKIA[0-9A-Z]{16}/,
  /password\s*=/i,
  /api_key\s*=/i,
  /token\s*=/i,
  /secret\s*=/i,
  /Bearer\s+[a-zA-Z0-9._-]{20,}/,
];

export const SECURITY_RULES: SecurityRule[] = [
  {
    id: "sensitive-read",
    severity: "warn",
    label: "sensitive file read",
    match(toolName, toolInput) {
      if (toolName !== "Read") return false;
      const path = toolInput.file_path ?? toolInput.path ?? "";
      return matchesSensitivePath(path);
    },
  },
  {
    id: "dangerous-bash",
    severity: "alert",
    label: "dangerous command",
    match(toolName, toolInput) {
      if (toolName !== "Bash") return false;
      const cmd = toolInput.command ?? "";
      return DANGEROUS_BASH_PATTERNS.some((p) => p.test(cmd));
    },
  },
  {
    id: "secret-write",
    severity: "alert",
    label: "secret in code",
    match(toolName, toolInput) {
      if (!["Write", "Edit", "MultiEdit"].includes(toolName)) return false;
      const content = toolInput.content ?? toolInput.new_string ?? toolInput.new_text ?? "";
      return SECRET_CONTENT_PATTERNS.some((p) => p.test(content));
    },
  },
  {
    id: "sensitive-write",
    severity: "alert",
    label: "sensitive file write",
    match(toolName, toolInput) {
      if (!["Write", "Edit"].includes(toolName)) return false;
      const path = toolInput.file_path ?? toolInput.path ?? "";
      return matchesSensitivePath(path);
    },
  },
  {
    id: "git-config-write",
    severity: "alert",
    label: "git config modification",
    match(toolName, toolInput) {
      if (toolName === "Bash") {
        const cmd = toolInput.command ?? "";
        return /\.git\/config|\.gitconfig|git\s+config\s+--global/.test(cmd);
      }
      if (["Write", "Edit"].includes(toolName)) {
        const path = toolInput.file_path ?? toolInput.path ?? "";
        return /\.git\/config|\.gitconfig/.test(path);
      }
      return false;
    },
  },
];
