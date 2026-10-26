import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanTextForSpeech } from '../src/parser/cleaner';

describe('cleanTextForSpeech', () => {
  it('strips frontmatter only at the top of the file', () => {
    const doc = '---\ntitle: Spec\n---\n# Intro\n\nHello.\n\n---\n\n## The Problem\n\nFatigue is real.\n\n---\n\nEnd.';
    const out = cleanTextForSpeech(doc);
    expect(out).not.toContain('title: Spec');
    expect(out).toContain('The Problem');
    expect(out).toContain('Fatigue is real.');
    expect(out).toContain('End.');
    expect(out).not.toContain('---');
  });

  it('keeps every section of the project README', () => {
    const out = cleanTextForSpeech(readFileSync('README.md', 'utf8'));
    expect(out).toMatch(/visual fatigue/);
  });

  it('leaves snake_case identifiers alone but removes emphasis', () => {
    expect(cleanTextForSpeech('Set my_var_name to **on** and _really_ mean it.')).toBe('Set my_var_name to on and really mean it.');
    expect(cleanTextForSpeech('A *note* and __bold__ and ~~gone~~.')).toBe('A note and bold and gone.');
  });

  it('announces code blocks with an accurate line count', () => {
    expect(cleanTextForSpeech('Run this:\n\n```bash\nnpm install\nnpm run build\n```\n\nDone.')).toBe(
      'Run this:\n\nCode block, 2 lines, skipped.\n\nDone.'
    );
    expect(cleanTextForSpeech('```\nx\n```', { skipCodeBlocks: false })).toBe('x');
  });

  it('handles Windows line endings', () => {
    expect(cleanTextForSpeech('# Title\r\n\r\n```ts\r\nconst a = 1;\r\n```\r\n')).toBe('Title\n\nCode block, 1 line, skipped.');
  });

  it('reads tables as comma lists and drops separators', () => {
    const out = cleanTextForSpeech('| Command | Key |\n| :--- | :--- |\n| Read | Ctrl+Alt+R |');
    expect(out).toBe('Command, Key\nRead, Ctrl+Alt+R');
  });

  it('shortens URLs, keeps link text and strips list markers and HTML', () => {
    expect(cleanTextForSpeech('See [the docs](https://x.dev/a) or https://www.github.com/DrOpenSource/AudioWizard')).toBe(
      'See the docs or link to github.com'
    );
    expect(cleanTextForSpeech('- [x] Done\n- [ ] Todo\n1. First<br>')).toBe('Done\nTodo\nFirst');
  });
});
