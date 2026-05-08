import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./receipt";

describe("parseReceiptText", () => {
  it("extracts merchant, total, and ISO date", () => {
    const parsed = parseReceiptText("Kids Clinic\nDate: 2026-05-08\nTotal: $42.19\nThank you");

    expect(parsed.merchant).toBe("Kids Clinic");
    expect(parsed.amountCents).toBe(4219);
    expect(parsed.date).toBe("2026-05-08");
  });

  it("uses the largest visible amount when a total label is absent", () => {
    const parsed = parseReceiptText("Book shop\nitem 9.99\ncard 32.50");

    expect(parsed.amountCents).toBe(3250);
  });
});
