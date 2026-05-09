import { parseFlexibleDate } from "../../lib/dateInference";
import { makeInference, stableId } from "../../lib/inference";
import { normalizeLooseWhitespace } from "../../lib/normalize";
import type { Child, DocumentRecord } from "../../lib/schemas";

export type DocumentInference = {
  fileName: string;
  name: string;
  childId?: string;
  childName?: string;
  kind: DocumentRecord["kind"];
  documentDate?: string;
  expiryYear?: number;
  tags: string[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
  reasons: string[];
};

const kindRules: Array<[RegExp, DocumentRecord["kind"], string]> = [
  [
    /\b(immunization|vaccine|medical|doctor|dental|therapy|clinic)\b/i,
    "medical",
    "medical vocabulary"
  ],
  [/\b(iep|school|teacher|report\s*card|education)\b/i, "school", "school vocabulary"],
  [/\b(passport|birth|identity|id)\b/i, "identity", "identity document vocabulary"],
  [/\b(travel|flight|consent)\b/i, "travel", "travel vocabulary"],
  [/\b(court|custody|order|legal)\b/i, "legal", "legal vocabulary"]
];

export function inferDocumentFromFileName(fileName: string, children: Child[]): DocumentInference {
  const withoutExtension = fileName.replace(/\.[a-z0-9]+$/i, "");
  const normalized = normalizeLooseWhitespace(withoutExtension.replace(/[_-]+/g, " "));
  const warnings: string[] = [];
  const reasons: string[] = [];
  const child = children.find((candidate) =>
    new RegExp(`\\b${escapeRegExp(candidate.name)}\\b`, "i").test(normalized)
  );
  if (child) {
    reasons.push(`child inferred from filename: ${child.name}`);
  }

  const kindMatch = kindRules.find(([pattern]) => pattern.test(normalized));
  const kind = kindMatch?.[1] ?? "other";
  if (kindMatch) {
    reasons.push(kindMatch[2]);
  } else {
    warnings.push("Document kind was not obvious from the filename.");
  }

  const documentDate =
    parseFlexibleDate(withoutExtension) ?? parseFlexibleDate(normalized) ?? undefined;
  if (documentDate) {
    reasons.push("document date inferred from filename");
  }

  const expiryYear = Number(normalized.match(/\b(?:exp|expires|expiry)\s*(20\d{2})\b/i)?.[1] ?? "");
  if (expiryYear) {
    reasons.push("expiry year inferred from filename");
  }

  const tags = [
    ...new Set([kind, documentDate ? "dated" : "", expiryYear ? "expires" : ""].filter(Boolean))
  ].sort();
  const score =
    (child ? 0.25 : 0) +
    (kind !== "other" ? 0.35 : 0) +
    (documentDate ? 0.2 : 0) +
    (expiryYear ? 0.1 : 0);
  const minimumScore = kind !== "other" ? 0.58 : 0.45;
  const inference = makeInference({
    score: Math.max(minimumScore, score),
    reasons,
    warnings,
    sourceId: stableId("docfile", [fileName])
  });

  return {
    fileName,
    name: normalized,
    childId: child?.id,
    childName: child?.name,
    kind,
    documentDate,
    expiryYear: expiryYear || undefined,
    tags,
    confidence: inference.level,
    warnings,
    reasons
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
