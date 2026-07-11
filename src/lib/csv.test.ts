import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('renders a header row followed by one row per input, CRLF-terminated', () => {
    const csv = toCsv([{ id: '1', name: 'Alpha' }, { id: '2', name: 'Beta' }], ['id', 'name']);
    expect(csv).toBe('id,name\r\n1,Alpha\r\n2,Beta\r\n');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv(
      [{ note: 'Interested in "Pro", will call\nback' }],
      ['note']
    );
    expect(csv).toBe('note\r\n"Interested in ""Pro"", will call\nback"\r\n');
  });

  it('renders null/undefined values as empty fields', () => {
    const csv = toCsv([{ id: '1', notes: null }], ['id', 'notes']);
    expect(csv).toBe('id,notes\r\n1,\r\n');
  });

  it('returns just the header row for an empty input', () => {
    const csv = toCsv([], ['id', 'name']);
    expect(csv).toBe('id,name\r\n');
  });
});
