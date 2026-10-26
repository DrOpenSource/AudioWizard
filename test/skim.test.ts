import { describe, expect, it } from 'vitest';
import { skimMarkdown } from '../src/parser/skim';

describe('skimMarkdown', () => {
  it('reads headings and the first sentence under each', () => {
    const doc = '# Plan\n\nWe ship today. Then we rest.\n\n## Risks\n\nThe API may break. Keep a fallback.\n\nMore detail here.\n\n```ts\ncode();\n```';
    expect(skimMarkdown(doc)).toBe('Plan.\n\nWe ship today.\n\nRisks.\n\nThe API may break.');
  });

  it('uses first sentences of paragraphs when there are no headings', () => {
    expect(skimMarkdown('One. Two.\n\nThree! Four.')).toBe('One.\n\nThree!');
  });
});
