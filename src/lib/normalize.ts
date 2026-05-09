export function normalizeInputText(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u2028|\u2029/g, "\n");
}

export function normalizeLooseWhitespace(value: string): string {
  return normalizeInputText(value)
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function unfoldIcsLines(value: string): string {
  return normalizeInputText(value).replace(/\n[ \t]/g, "");
}
