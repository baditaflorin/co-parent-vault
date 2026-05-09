import { parseFlexibleDate } from "../../lib/dateInference";
import { makeInference, stableId } from "../../lib/inference";
import { normalizeInputText } from "../../lib/normalize";
import type { MessageRecord } from "../../lib/schemas";

export type MessageThreadDraft = {
  message: MessageRecord;
  warnings: string[];
  reasons: string[];
};

const tagRules: Array<[RegExp, string]> = [
  [/\breimburse|payment|paid|amount|invoice|receipt\b/i, "reimbursement"],
  [/\bmedical|dental|doctor|clinic|therapy|insurance\b/i, "medical"],
  [/\bschool|teacher|iep|homework|conference\b/i, "school"],
  [/\bexchange|pickup|drop[- ]?off|parenting time\b/i, "exchange"],
  [/\bpassport|travel|flight|hotel\b/i, "travel"]
];

export function inferMessageThread(input: {
  text: string;
  childId: string;
  fallbackCounterpart: string;
}): MessageThreadDraft {
  const text = normalizeInputText(input.text);
  const warnings: string[] = [];
  const reasons: string[] = [];
  const from = header(text, "from");
  const sent = header(text, "sent") || header(text, "date");
  const subject = header(text, "subject");
  const channel = /from:|subject:|sent:/i.test(text)
    ? "email"
    : /\bSMS|text message\b/i.test(text)
      ? "sms"
      : "other";
  const occurredAtDate = sent ? parseFlexibleDate(sent) : parseFlexibleDate(text);
  const counterpart = inferCounterpart(from) || input.fallbackCounterpart || "Co-parent";
  const tags = inferTags(text);
  const actionItems = inferActionItems(text);

  if (from) {
    reasons.push("counterpart inferred from email From header");
  } else {
    warnings.push("No sender header found; verify counterpart.");
  }
  if (occurredAtDate) {
    reasons.push("date inferred from message headers");
  } else {
    warnings.push("No message date found; verify occurred-at date.");
  }
  if (subject) {
    reasons.push("subject inferred from header");
  }
  if (tags.length > 0) {
    reasons.push(`tags inferred from family-domain words: ${tags.join(", ")}`);
  }

  const inference = makeInference({
    score: warnings.length === 0 ? 0.88 : 0.58,
    reasons,
    warnings,
    sourceId: stableId("thread", [subject, counterpart, occurredAtDate, text.slice(0, 80)])
  });

  return {
    message: {
      id: stableId("msg", [subject, counterpart, occurredAtDate, text.slice(0, 120)]),
      childId: input.childId,
      counterpart,
      occurredAt: occurredAtDate ? `${occurredAtDate}T12:00:00.000Z` : "2026-01-01T12:00:00.000Z",
      channel,
      subject: subject || "",
      body: stripHeaders(text),
      tags,
      actionItems,
      inference,
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    warnings,
    reasons
  };
}

function header(text: string, name: string): string {
  const match = text.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1].trim() ?? "";
}

function inferCounterpart(value: string): string {
  const match = value.match(/^"?([^"<]+?)"?\s*(?:<.+>)?$/);
  return match?.[1].trim() ?? "";
}

function inferTags(text: string): string[] {
  const tags = new Set<string>();
  for (const [pattern, tag] of tagRules) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

function inferActionItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      /\b(please|send|confirm|bring|upload|pay|by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(
        line
      )
    )
    .slice(0, 5);
}

function stripHeaders(text: string): string {
  return text.replace(/^(from|to|sent|date|subject):.+$/gim, "").trim();
}
