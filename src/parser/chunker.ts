export interface Chunk {
  text: string;
  /** Index of the paragraph this chunk belongs to, so the player can lay text out in paragraphs. */
  paragraph: number;
}

const MIN_LEN = 40;
const MAX_LEN = 280;

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_LEN) return [sentence];
  const parts: string[] = [];
  let rest = sentence;
  while (rest.length > MAX_LEN) {
    const window = rest.slice(0, MAX_LEN);
    let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '));
    if (cut < MAX_LEN / 2) cut = window.lastIndexOf(' ');
    if (cut <= 0) cut = MAX_LEN;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Lines without closing punctuation (list items, table rows) get a period so the voice pauses. */
function withPause(unit: string): string {
  return /[.?!:;,]$/.test(unit) ? unit : unit + '.';
}

/**
 * Splits cleaned text into sentence-sized chunks. Small chunks keep the time to
 * first audio short and let the player highlight what is being read.
 */
export function splitIntoChunks(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  paragraphs.forEach((para, paragraph) => {
    const units = para
      .split(/\n+|(?<=[.?!])\s+(?=[A-Z0-9"'(\[])/)
      .map((u) => u.trim())
      .filter(Boolean)
      .flatMap(splitLong);

    let current = '';
    for (const unit of units) {
      if (!current) {
        current = unit;
      } else if (current.length < MIN_LEN && current.length + unit.length + 1 <= MAX_LEN) {
        current = withPause(current) + ' ' + unit;
      } else {
        chunks.push({ text: withPause(current), paragraph });
        current = unit;
      }
    }
    if (current) chunks.push({ text: withPause(current), paragraph });
  });

  return chunks;
}

export function escapeForSsml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
