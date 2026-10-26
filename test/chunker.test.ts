import { describe, expect, it } from 'vitest';
import { escapeForSsml, splitIntoChunks } from '../src/parser/chunker';

describe('splitIntoChunks', () => {
  it('splits into sentences and tracks paragraphs', () => {
    const chunks = splitIntoChunks('First sentence is long enough to stand on its own here. Second one follows it closely.\n\nNew paragraph starts here now.');
    expect(chunks.map((c) => c.paragraph)).toEqual([0, 0, 1]);
    expect(chunks[0].text).toBe('First sentence is long enough to stand on its own here.');
  });

  it('merges short lines and adds pauses after list items', () => {
    const chunks = splitIntoChunks('Read Document\nRead Selection\nToggle');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Read Document. Read Selection. Toggle.');
  });

  it('never produces chunks longer than the limit', () => {
    const long = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');
    const chunks = splitIntoChunks(long);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 281)).toBe(true);
    expect(chunks.map((c) => c.text.replace(/\.$/, '')).join(' ')).toBe(long);
  });

  it('escapes characters that would break SSML', () => {
    expect(escapeForSsml('a < b && c > d')).toBe('a &lt; b &amp;&amp; c &gt; d');
  });
});
