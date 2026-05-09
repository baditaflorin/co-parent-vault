import type { ConfidenceLevel, InferenceMeta } from "./schemas";
import { normalizeLooseWhitespace } from "./normalize";

export type DomainIssue = {
  what: string;
  why: string;
  nowWhat: string;
  severity: "info" | "warning" | "error";
  recoverable: boolean;
};

export function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 0.8) {
    return "high";
  }
  if (score >= 0.55) {
    return "medium";
  }
  return "low";
}

export function makeInference(input: {
  score: number;
  reasons?: string[];
  warnings?: string[];
  sourceId?: string;
}): InferenceMeta {
  const score = Math.max(0, Math.min(1, Number(input.score.toFixed(2))));
  return {
    level: confidenceFromScore(score),
    score,
    reasons: input.reasons ?? [],
    warnings: input.warnings ?? [],
    sourceId: input.sourceId
  };
}

export function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function stableId(prefix: string, parts: Array<string | number | undefined | null>): string {
  return `${prefix}-${stableHash(parts.map((part) => normalizeLooseWhitespace(String(part ?? ""))).join("|"))}`;
}

export function issue(input: DomainIssue): DomainIssue {
  return input;
}

export function reasonsToNotes(reasons: string[], warnings: string[]): string {
  const lines = [];
  if (reasons.length > 0) {
    lines.push(`Inferred because: ${reasons.join("; ")}`);
  }
  if (warnings.length > 0) {
    lines.push(`Review: ${warnings.join("; ")}`);
  }
  return lines.join("\n");
}
