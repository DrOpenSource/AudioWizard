import { normalizeNewlines, stripFrontmatter } from './cleaner';

const HEADING = /^#{1,6}[ \t]+/;
const MAX_SENTENCE = 240;

function firstSentence(block: string): string {
  const flat = block.replace(/\s*\n\s*/g, ' ').trim();
  const match = flat.match(/^[\s\S]*?[.?!](?=\s|$)/);
  const sentence = match ? match[0] : flat;
  return sentence.length > MAX_SENTENCE ? sentence.slice(0, MAX_SENTENCE).replace(/\s+\S*$/, '') + '.' : sentence;
}

/**
 * Builds a quick spoken outline: every heading, followed by the first sentence
 * of the text under it. Documents without headings (chat replies) get the first
 * sentence of each paragraph. Returns raw Markdown; run it through the cleaner.
 */
export function skimMarkdown(text: string): string {
  const source = stripFrontmatter(normalizeNewlines(text)).replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, '');
  const hasHeadings = source.split('\n').some((line) => HEADING.test(line));
  const out: string[] = [];
  let wantSentence = !hasHeadings;
  let paragraph: string[] = [];

  const flush = () => {
    const block = paragraph.join('\n').trim();
    paragraph = [];
    if (!block || /^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/.test(block)) return;
    if (wantSentence) {
      out.push(firstSentence(block));
      wantSentence = !hasHeadings;
    }
  };

  for (const line of source.split('\n')) {
    if (HEADING.test(line)) {
      flush();
      const heading = line.replace(HEADING, '').replace(/[ \t#]+$/, '').trim();
      if (heading) out.push(/[.?!:]$/.test(heading) ? heading : heading + '.');
      wantSentence = true;
    } else if (!line.trim()) {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();

  return out.join('\n\n');
}
