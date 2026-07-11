// Minimal RFC 4180-style CSV serializer — good enough for admin exports
// without pulling in a dependency. Quotes a field whenever it contains a
// comma, a quote, or a newline; escapes embedded quotes by doubling them.
const escapeField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T & string)[]): string {
  const header = columns.map(escapeField).join(',');
  const lines = rows.map((row) => columns.map((col) => escapeField(row[col])).join(','));
  return [header, ...lines].join('\r\n') + '\r\n';
}
