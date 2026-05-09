const MONTHS = new Map(
  ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map(
    (month, index) => [month, index + 1]
  )
);

export function parseFlexibleDate(value: string): string | null {
  const text = value.trim();
  const iso = text.match(/(?:^|[^0-9])(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?=$|[^0-9])/);
  if (iso) {
    return formatIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const slash = text.match(/(?:^|[^0-9])(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|\d{2})(?=$|[^0-9])/);
  if (slash) {
    const year = normalizeYear(slash[3]);
    return formatIso(year, Number(slash[1]), Number(slash[2]));
  }

  const long = text.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(20\d{2})\b/i
  );
  if (long) {
    const month = MONTHS.get(long[1].slice(0, 3).toLowerCase());
    return month ? formatIso(Number(long[3]), month, Number(long[2])) : null;
  }

  return null;
}

function normalizeYear(value: string): number {
  const year = Number(value);
  return value.length === 2 ? 2000 + year : year;
}

function formatIso(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}
