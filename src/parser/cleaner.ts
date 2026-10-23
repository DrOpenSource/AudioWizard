export interface CleanOptions {
  skipCodeBlocks?: boolean;
}

export function cleanTextForSpeech(text: string, options: CleanOptions = { skipCodeBlocks: true }): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Strip YAML frontmatter (--- ... ---)
  cleaned = cleaned.replace(/^---[\s\S]*?---\s*/m, "");

  // 2. Handle Markdown Code Blocks (``` ... ```)
  if (options.skipCodeBlocks) {
    cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_match, codeContent) => {
      const lineCount = (codeContent.match(/\n/g) || []).length + 1;
      return ` [Code block with ${lineCount} lines omitted.] `;
    });
  } else {
    cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, "$1");
  }

  // 3. Strip inline code backticks `code` -> code
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // 4. Strip markdown image tags ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // 5. Convert markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 6. Strip Markdown Headings (# Header -> Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // 7. Strip bold, italics, strikethrough (***, **, *, ~~)
  cleaned = cleaned.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1");

  // 8. Strip blockquotes (> Quote -> Quote)
  cleaned = cleaned.replace(/^>\s+/gm, "");

  // 9. Strip markdown table separator lines (| --- | --- |)
  cleaned = cleaned.replace(/^\|?[\s-:]+\|[\s-:|]+$/gm, "");
  // Clean markdown table cells (| Cell | Cell | -> Cell, Cell)
  cleaned = cleaned.replace(/\|\s*/g, " ");

  // 10. Normalize bullet points and numbered lists
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, "");
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, "");

  // 11. Normalize excess whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}
