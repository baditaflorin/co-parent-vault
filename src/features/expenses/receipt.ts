import { parseMoneyToCents } from "../../lib/format";
import { parseFlexibleDate } from "../../lib/dateInference";
import { makeInference } from "../../lib/inference";
import { normalizeInputText } from "../../lib/normalize";
import type { ConfidenceLevel, InferenceMeta } from "../../lib/schemas";

export type ParsedReceipt = {
  merchant: string;
  amountCents: number;
  date: string;
  currency: string;
  confidence: ConfidenceLevel;
  inference: InferenceMeta;
  rawText: string;
};

const amountLabelWeights: Array<{ pattern: RegExp; weight: number; reason: string }> = [
  {
    pattern: /\b(amount\s+due|patient\s+responsibility|balance\s+due|total\s+due)\b/i,
    weight: 100,
    reason: "amount due vocabulary"
  },
  { pattern: /\b(grand\s+total|total)\b/i, weight: 80, reason: "total label" },
  { pattern: /\bvisa|mastercard|card|paid\b/i, weight: 55, reason: "payment line" },
  {
    pattern: /\bsubtotal|procedure\s+charge|charge\b/i,
    weight: 25,
    reason: "pre-adjustment amount"
  },
  {
    pattern: /\btax|tip|adjustment|previous\s+payment|discount\b/i,
    weight: -40,
    reason: "non-reimbursable component"
  }
];

export function parseReceiptText(rawText: string): ParsedReceipt {
  const normalized = normalizeInputText(rawText);
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const merchant = lines[0]?.slice(0, 80) || "Receipt";
  const date = inferReceiptDate(normalized);
  const currency = inferCurrency(normalized);
  const candidates = collectAmountCandidates(lines);
  const best = candidates[0];
  const warnings: string[] = [];
  const reasons = best?.reasons ?? [];

  if (!best) {
    warnings.push("No receipt amount found; enter the reimbursement amount manually.");
  }
  if (!date) {
    warnings.push("No receipt date found; today's date was not assumed.");
  }
  if (
    candidates.length > 1 &&
    candidates[0].amountCents !== candidates[1].amountCents &&
    candidates[0].score - candidates[1].score < 15
  ) {
    warnings.push("Multiple plausible totals found; verify the amount.");
  }

  const inference = makeInference({
    score: best && date ? (warnings.length === 0 ? 0.9 : 0.65) : 0.35,
    reasons: [...reasons, date ? "receipt date recognized" : ""].filter(Boolean),
    warnings
  });

  return {
    merchant,
    amountCents: best?.amountCents ?? 0,
    date: date ?? "",
    currency,
    confidence: inference.level,
    inference,
    rawText: normalized
  };
}

function inferReceiptDate(text: string): string | null {
  return parseFlexibleDate(text);
}

function inferCurrency(text: string): string {
  if (/[€]/.test(text)) {
    return "EUR";
  }
  if (/[£]/.test(text)) {
    return "GBP";
  }
  if (/\bRON\b/i.test(text)) {
    return "RON";
  }
  return "USD";
}

function collectAmountCandidates(lines: string[]): Array<{
  amountCents: number;
  score: number;
  reasons: string[];
}> {
  const candidates = [];
  for (const [index, line] of lines.entries()) {
    const matches = [...line.matchAll(/(?:[$€£]\s*)?(-?\d{1,6}(?:[.,]\d{2}))(?!\d)/g)];
    for (const match of matches) {
      const amountCents = Math.abs(parseMoneyToCents(match[1]));
      if (amountCents === 0) {
        continue;
      }
      let score = amountCents / 100_000;
      const reasons: string[] = [];
      for (const label of amountLabelWeights) {
        if (label.pattern.test(line)) {
          score += label.weight;
          reasons.push(label.reason);
        }
      }
      score += index / 100;
      candidates.push({ amountCents, score, reasons });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || b.amountCents - a.amountCents);
}

export async function ocrReceipt(
  file: File,
  onProgress?: (message: string) => void
): Promise<ParsedReceipt> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (entry) => {
      if (entry.status) {
        onProgress?.(`${entry.status} ${Math.round((entry.progress ?? 0) * 100)}%`);
      }
    }
  });

  try {
    const result = await worker.recognize(file);
    return parseReceiptText(result.data.text);
  } finally {
    await worker.terminate();
  }
}
