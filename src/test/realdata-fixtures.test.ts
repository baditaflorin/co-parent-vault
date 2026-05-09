import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { importEventDraftsFromIcs } from "../features/calendar/ics";
import { inferDocumentFromFileName } from "../features/documents/inferDocument";
import { inferExpensesFromCsv } from "../features/expenses/csv";
import { parseReceiptText } from "../features/expenses/receipt";
import { inferMessageThread } from "../features/messages/thread";
import type { Child } from "../lib/schemas";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/fixtures/realdata");
const child: Child = { id: "child-maya", name: "Maya", color: "#0f766e" };

type Expected = {
  kind: string;
  minDrafts?: number;
  first?: Record<string, unknown>;
  mustWarnings?: string[];
  mustTags?: string[];
  files?: Array<Record<string, unknown>>;
};

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

function readExpected(name: string): Expected {
  return JSON.parse(readFixture(name)) as Expected;
}

function fixtureNames(): string[] {
  return readdirSync(fixturesDir)
    .filter((name) => !name.endsWith(".expected.json"))
    .sort();
}

describe("real-data fixture contracts", () => {
  for (const fixture of fixtureNames()) {
    it(`${fixture} produces the expected deterministic draft`, () => {
      const expected = readExpected(fixture.replace(/\.(ics|csv|txt)$/, ".expected.json"));
      const input = readFixture(fixture);
      const first = runFixture(fixture, input);
      const second = runFixture(fixture, input);

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
      assertExpected(first, expected);
    });
  }
});

function runFixture(fixture: string, input: string) {
  if (fixture.endsWith(".ics")) {
    return importEventDraftsFromIcs(input, child.id).map((draft) => ({
      title: draft.event.title,
      id: draft.event.id,
      sourceUid: draft.event.sourceUid,
      timezone: draft.event.timezone,
      allDay: draft.event.allDay,
      confidence: draft.confidence,
      warnings: draft.warnings
    }));
  }

  if (fixture.endsWith(".csv")) {
    return inferExpensesFromCsv({
      text: input,
      childId: child.id,
      paidBy: "Alex",
      splitWith: "Jordan"
    }).map((draft) => ({
      merchant: draft.expense.merchant,
      id: draft.expense.id,
      amountCents: draft.expense.amountCents,
      category: draft.expense.category,
      confidence: draft.expense.inference?.level,
      warnings: draft.warnings
    }));
  }

  if (fixture.includes("receipt") || fixture.includes("invoice")) {
    const parsed = parseReceiptText(input);
    return [
      {
        merchant: parsed.merchant,
        amountCents: parsed.amountCents,
        date: parsed.date,
        confidence: parsed.confidence,
        warnings: parsed.inference.warnings
      }
    ];
  }

  if (fixture.includes("email-thread")) {
    const draft = inferMessageThread({
      text: input,
      childId: child.id,
      fallbackCounterpart: "Jordan"
    });
    return [
      {
        counterpart: draft.message.counterpart,
        channel: draft.message.channel,
        subject: draft.message.subject,
        confidence: draft.message.inference?.level,
        tags: draft.message.tags,
        warnings: draft.warnings
      }
    ];
  }

  return input
    .split("\n")
    .filter(Boolean)
    .map((fileName) => inferDocumentFromFileName(fileName, [child]))
    .map((draft) => ({
      fileName: draft.fileName,
      kind: draft.kind,
      child: draft.childName,
      date: draft.documentDate,
      confidence: draft.confidence,
      warnings: draft.warnings
    }));
}

function assertExpected(actual: Array<Record<string, unknown>>, expected: Expected): void {
  const nonSkipped = actual.filter((item) => item.amountCents !== 0);
  if (expected.minDrafts) {
    expect(nonSkipped.length).toBeGreaterThanOrEqual(expected.minDrafts);
  }

  if (expected.first) {
    for (const [key, value] of Object.entries(expected.first)) {
      expect(nonSkipped[0]?.[key] ?? actual[0]?.[key]).toBe(value);
    }
  }

  if (expected.mustWarnings) {
    const warnings = actual.flatMap((item) => (Array.isArray(item.warnings) ? item.warnings : []));
    for (const warning of expected.mustWarnings) {
      expect(warnings).toContain(warning);
    }
  }

  if (expected.mustTags) {
    const tags = actual.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []));
    for (const tag of expected.mustTags) {
      expect(tags).toContain(tag);
    }
  }

  if (expected.files) {
    expected.files.forEach((file, index) => {
      for (const [key, value] of Object.entries(file)) {
        expect(actual[index]?.[key]).toBe(value);
      }
    });
  }
}
