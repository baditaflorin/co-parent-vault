import { parseMoneyToCents } from "../../lib/format";

export type ParsedReceipt = {
  merchant: string;
  amountCents: number;
  date: string;
  rawText: string;
};

const amountPatterns = [
  /(?:total|amount|balance|paid)\s*[:\s$€£RON]*(\d+[.,]\d{2})/i,
  /[$€£]\s*(\d+[.,]\d{2})/i,
  /\b(\d+[.,]\d{2})\b/g
];

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const merchant = lines[0]?.slice(0, 80) || "Receipt";
  const dateMatch = rawText.match(
    /\b(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]20\d{2})\b/
  );
  const date = normalizeDate(dateMatch?.[1]) ?? new Date().toISOString().slice(0, 10);

  let bestAmount = 0;
  for (const pattern of amountPatterns) {
    const matches = pattern.global ? [...rawText.matchAll(pattern)] : [rawText.match(pattern)];
    for (const match of matches) {
      if (!match) {
        continue;
      }
      const cents = parseMoneyToCents(match[1]);
      if (cents > bestAmount) {
        bestAmount = cents;
      }
    }
    if (bestAmount > 0 && pattern.global === false) {
      break;
    }
  }

  return {
    merchant,
    amountCents: bestAmount,
    date,
    rawText
  };
}

function normalizeDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const parts = value.split(/[-/.]/).map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (String(parts[0]).length === 4) {
    return `${parts[0].toString().padStart(4, "0")}-${parts[1].toString().padStart(2, "0")}-${parts[2].toString().padStart(2, "0")}`;
  }

  return `${parts[2].toString().padStart(4, "0")}-${parts[0].toString().padStart(2, "0")}-${parts[1].toString().padStart(2, "0")}`;
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
