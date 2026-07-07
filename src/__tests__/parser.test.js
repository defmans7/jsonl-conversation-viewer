import { describe, it, expect } from 'bun:test';
import { parseJsonl } from '../lib/parser.js';

describe('parseJsonl', () => {
  it('returns empty array for empty string', () => {
    expect(parseJsonl('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseJsonl('  \n  \n  ')).toEqual([]);
  });

  it('parses a single valid line', () => {
    const result = parseJsonl('{"role":"user","content":"hello"}');
    expect(result).toHaveLength(1);
    expect(result[0].ok).toBe(true);
    expect(result[0].obj).toEqual({ role: 'user', content: 'hello' });
    expect(result[0].lineNo).toBe(1);
  });

  it('parses multiple valid lines', () => {
    const input = [
      '{"role":"user","content":"a"}',
      '{"role":"assistant","content":"b"}',
      '{"role":"toolResult","content":"c"}',
    ].join('\n');
    const result = parseJsonl(input);
    expect(result).toHaveLength(3);
    expect(result.every(r => r.ok)).toBe(true);
    expect(result.map(r => r.lineNo)).toEqual([1, 2, 3]);
  });

  it('skips blank lines but preserves line numbers', () => {
    const input = '\n{"role":"user"}\n\n{"role":"assistant"}\n';
    const result = parseJsonl(input);
    expect(result).toHaveLength(2);
    expect(result[0].lineNo).toBe(2);
    expect(result[1].lineNo).toBe(4);
  });

  it('skips // comment lines', () => {
    const input = [
      '// this is a comment',
      '{"role":"user"}',
      '// another comment',
      '{"role":"assistant"}',
    ].join('\n');
    const result = parseJsonl(input);
    expect(result).toHaveLength(2);
    expect(result[0].lineNo).toBe(2);
    expect(result[1].lineNo).toBe(4);
  });

  it('skips # comment lines', () => {
    const input = [
      '# shell-style comment',
      '{"role":"user"}',
    ].join('\n');
    const result = parseJsonl(input);
    expect(result).toHaveLength(1);
    expect(result[0].lineNo).toBe(2);
  });

  it('does not skip lines with // mid-content', () => {
    // Only lines *starting* with // or # are comments
    const input = '{"role":"user","text":"see // this // is fine"}';
    const result = parseJsonl(input);
    expect(result).toHaveLength(1);
    expect(result[0].ok).toBe(true);
  });

  it('reports parse errors for invalid JSON', () => {
    const input = ['{"valid": true}', 'not json', '{"also": "valid"}'].join('\n');
    const result = parseJsonl(input);
    expect(result).toHaveLength(3);
    expect(result[0].ok).toBe(true);
    expect(result[1].ok).toBe(false);
    expect(result[1].lineNo).toBe(2);
    expect(result[1].error).toBeDefined();
    expect(result[2].ok).toBe(true);
  });

  it('handles complex nested JSON', () => {
    const input = JSON.stringify({
      type: 'message',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'hello' },
          { type: 'toolCall', id: 'call_1', name: 'read', arguments: { path: '/foo' } },
        ],
        usage: { input: 100, output: 50, cost: { total: 0.001 } },
      },
    });
    const result = parseJsonl(input);
    expect(result).toHaveLength(1);
    expect(result[0].ok).toBe(true);
    expect(result[0].obj.message.content).toHaveLength(2);
    expect(result[0].obj.message.content[1].type).toBe('toolCall');
  });
});
