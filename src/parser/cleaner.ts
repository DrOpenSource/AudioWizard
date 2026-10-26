export interface CleanOptions {
  skipCodeBlocks?: boolean;
}

const FRONTMATTER = /^﻿?---\n[\s\S]*?\n---[ \t]*(\n|$)/;
const CODE_FENCE = /^[ \t]*(```|~~~)[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm;

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

export function stripFrontmatter(text: string): string {
  return text.replace(FRONTMATTER, "");
}

function countLines(code: string): number {
  const trimmed = code.replace(/\n+$/, "");
  return trimmed ? trimmed.split("\n").length : 0;
}

export function cleanTextForSpeech(text: string, options: CleanOptions = { skipCodeBlocks: true }): string {
  if (!text) return "";

  let cleaned = stripFrontmatter(normalizeNewlines(text));

  // Fenced code blocks: announce and skip, or keep the code itself
  cleaned = cleaned.replace(CODE_FENCE, (_match, _fence, code: string) => {
    if (options.skipCodeBlocks === false) return code;
    const lines = countLines(code);
    return `\nCode block, ${lines} ${lines === 1 ? "line" : "lines"}, skipped.\n`;
  });

  // HTML comments and tags (<br>, <details>, <img ...>)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  cleaned = cleaned.replace(/<\/?[a-zA-Z][^>\n]*>/g, " ");

  // Inline code `code` -> code
  cleaned = cleaned.replace(/`([^`\n]+)`/g, "$1");

  // Images are dropped, links keep their text
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Bare URLs are read as "link to example.com" instead of letter by letter
  cleaned = cleaned.replace(/\bhttps?:\/\/(?:www\.)?([^\/\s)]+)[^\s)]*/g, "link to $1");

  // Headings, blockquotes, horizontal rules
  cleaned = cleaned.replace(/^#{1,6}[ \t]+(.*?)[ \t#]*$/gm, "$1");
  cleaned = cleaned.replace(/^[ \t]*>[ \t]?/gm, "");
  cleaned = cleaned.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, "");

  // Emphasis. Underscores only count at word edges so snake_case survives.
  cleaned = cleaned.replace(/\*\*\*([^*\n]+)\*\*\*/g, "$1");
  cleaned = cleaned.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "$1");
  cleaned = cleaned.replace(/(?<!\w)__([^_\n]+)__(?!\w)/g, "$1");
  cleaned = cleaned.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1");
  cleaned = cleaned.replace(/~~([^~\n]+)~~/g, "$1");

  // Tables: drop separator rows, turn cells into a comma list
  cleaned = cleaned.replace(/^[ \t]*\|?[ \t:-]+\|[ \t:|-]*(\n|$)/gm, "");
  cleaned = cleaned.replace(/^[ \t]*\|(.*?)\|?[ \t]*$/gm, (_m, row: string) =>
    row.split("|").map((c) => c.trim()).filter(Boolean).join(", ")
  );
  cleaned = cleaned.replace(/[ \t]*\|[ \t]*/g, ", ");

  // List markers and task checkboxes
  cleaned = cleaned.replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/gm, "");

  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/^ +| +$/gm, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}
