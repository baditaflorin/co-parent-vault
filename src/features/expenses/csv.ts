import { parseFlexibleDate } from "../../lib/dateInference";
import { makeInference, stableId } from "../../lib/inference";
import { normalizeInputText } from "../../lib/normalize";
import type { Expense } from "../../lib/schemas";

export type ExpenseCsvDraft = {
  expense: Expense;
  warnings: string[];
  reasons: string[];
};

type CsvRow = Record<string, string>;

const categoryRules: Array<[string, string]> = [
  ["school|education|supplies|iep|tutor", "school"],
  ["medical|dental|clinic|doctor|therapy|pharmacy", "medical"],
  ["soccer|sport|activity|camp|music|dance", "activity"],
  ["daycare|childcare|care", "childcare"],
  ["travel|passport|flight|hotel", "travel"]
];

export function inferExpensesFromCsv(input: {
  text: string;
  childId: string;
  paidBy: string;
  splitWith: string;
  fallbackCurrency?: string;
}): ExpenseCsvDraft[] {
  const normalized = normalizeInputText(input.text);
  const delimiter = sniffDelimiter(normalized);
  const rows = parseCsv(normalized, delimiter);
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((row) => rowToObject(headers, row));
  const columns = classifyColumns(headers);
  const drafts: ExpenseCsvDraft[] = [];

  for (const [index, record] of records.entries()) {
    const sourceRow = index + 2;
    const warnings: string[] = [];
    const reasons = [
      `${delimiterName(delimiter)} delimiter detected`,
      "columns inferred from header names"
    ];
    const description = value(record, columns.description) || "Imported expense";
    const amountValue = value(record, columns.amount) || value(record, columns.cost);
    const amountCentsRaw = parseSignedMoneyToCents(amountValue);

    if (amountCentsRaw === 0) {
      warnings.push(`Row ${sourceRow} has no expense amount and was skipped.`);
      continue;
    }

    if (isPositivePayment(record, columns, amountCentsRaw)) {
      warnings.push("Positive payment row skipped.");
      drafts.push(skippedDraft(input, sourceRow, description, warnings, reasons));
      continue;
    }

    const amountCents = Math.abs(amountCentsRaw);
    const date = parseFlexibleDate(value(record, columns.date)) ?? "";
    if (!date) {
      warnings.push(`Row ${sourceRow} has an unrecognized date.`);
    }

    const category = inferCategory(value(record, columns.category), description);
    const currency = (value(record, columns.currency) || input.fallbackCurrency || "USD")
      .slice(0, 3)
      .toUpperCase();
    const payer = inferPayer(record, headers, input.paidBy, input.splitWith);
    const score = warnings.length === 0 ? 0.88 : 0.64;
    const inference = makeInference({
      score,
      reasons,
      warnings,
      sourceId: stableId("csvrow", [description, sourceRow, amountCents, date])
    });

    drafts.push({
      expense: {
        id: stableId("exp", [description, sourceRow, amountCents, date]),
        childId: input.childId,
        merchant: description,
        amountCents,
        currency,
        date,
        category,
        paidBy: payer,
        splitWith: payer === input.paidBy ? input.splitWith : input.paidBy,
        status: "open",
        sourceRow,
        inference,
        notes: warnings.join("\n"),
        createdAt: "2026-01-01T00:00:00.000Z"
      },
      warnings,
      reasons
    });
  }

  return drafts;
}

function sniffDelimiter(text: string): string {
  const firstLine = text.split("\n").find(Boolean) ?? "";
  const candidates = [",", ";", "\t"];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function delimiterName(delimiter: string): string {
  if (delimiter === "\t") {
    return "tab";
  }
  if (delimiter === ";") {
    return "semicolon";
  }
  return "comma";
}

export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim()));
}

function rowToObject(headers: string[], row: string[]): CsvRow {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
}

function classifyColumns(headers: string[]) {
  const find = (pattern: RegExp) => headers.find((header) => pattern.test(header.toLowerCase()));
  return {
    date: find(/date|transaction/),
    description: find(/description|merchant|memo|payee/),
    amount: find(/^amount$|debit|withdrawal|transaction amount/),
    cost: find(/cost|total/),
    currency: find(/currency/),
    category: find(/category/)
  };
}

function value(record: CsvRow, key?: string): string {
  return key ? (record[key] ?? "") : "";
}

function inferCategory(category: string, description: string): string {
  const combined = `${category} ${description}`.toLowerCase();
  for (const [pattern, value] of categoryRules) {
    if (new RegExp(pattern).test(combined)) {
      return value;
    }
  }
  return "other";
}

function inferPayer(record: CsvRow, headers: string[], paidBy: string, splitWith: string): string {
  const paidColumns = headers.filter((header) => / paid$/i.test(header));
  for (const column of paidColumns) {
    if (parseSignedMoneyToCents(record[column] ?? "") > 0) {
      return column.replace(/ paid$/i, "").trim();
    }
  }
  return paidBy || splitWith;
}

function isPositivePayment(
  record: CsvRow,
  columns: ReturnType<typeof classifyColumns>,
  amount: number
): boolean {
  const description = value(record, columns.description).toLowerCase();
  return amount > 0 && /payment|deposit|thank you|credit/.test(description);
}

function parseSignedMoneyToCents(value: string): number {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

function skippedDraft(
  input: { childId: string; paidBy: string; splitWith: string },
  sourceRow: number,
  description: string,
  warnings: string[],
  reasons: string[]
): ExpenseCsvDraft {
  const inference = makeInference({ score: 0.2, reasons, warnings });
  return {
    expense: {
      id: stableId("skip", [sourceRow, description]),
      childId: input.childId,
      merchant: description,
      amountCents: 0,
      currency: "USD",
      date: "",
      category: "other",
      paidBy: input.paidBy,
      splitWith: input.splitWith,
      status: "open",
      sourceRow,
      inference,
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    warnings,
    reasons
  };
}
