import { describe, it, expect } from 'bun:test';
import { escapeHtml, fmtTime, fmtMoney } from '../lib/utils.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes all three together', () => {
    expect(escapeHtml('if (a < b && c > d)')).toBe(
      'if (a &lt; b &amp;&amp; c &gt; d)'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('coerces non-strings', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });

  it('returns unchanged for safe strings', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('fmtTime', () => {
  it('returns empty string for falsy input', () => {
    expect(fmtTime('')).toBe('');
    expect(fmtTime(null)).toBe('');
    expect(fmtTime(undefined)).toBe('');
  });

  it('formats a valid ISO timestamp', () => {
    const result = fmtTime('2026-07-07T10:15:30.000Z');
    // Should produce something like "10:15:30 AM" or "10:15:30"
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('returns empty string for invalid date', () => {
    expect(fmtTime('not a date')).toBe('');
    expect(fmtTime('2026-99-99')).toBe('');
  });
});

describe('fmtMoney', () => {
  it('formats a dollar amount', () => {
    expect(fmtMoney(0.001547121)).toBe('$0.001547');
  });

  it('formats a whole dollar', () => {
    expect(fmtMoney(5)).toBe('$5');
  });

  it('formats zero', () => {
    expect(fmtMoney(0)).toBe('$0');
  });

  it('returns null for non-numbers', () => {
    expect(fmtMoney('5')).toBeNull();
    expect(fmtMoney(null)).toBeNull();
    expect(fmtMoney(undefined)).toBeNull();
    expect(fmtMoney(NaN)).toBeNull();
    expect(fmtMoney(Infinity)).toBeNull();
  });

  it('formats numbers with trailing zeros trimmed', () => {
    expect(fmtMoney(0.1)).toBe('$0.1');
    expect(fmtMoney(0.123456)).toBe('$0.123456');
    expect(fmtMoney(0.123000)).toBe('$0.123');
  });
});
