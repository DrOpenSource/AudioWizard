# AudioWizard

> **Neural Text-to-Speech Reader for Documentation, Long Context Files, and AI Agent Responses.**  
> Built for developers, architects, and vibe coders using **VS Code**, **Cursor**, and **Antigravity IDE**.

---

## The Problem

When working with AI coding agents (Claude Code, Gemini, Copilot) or reviewing long architectural specs, planning docs, and multi-thousand-line context files, developers suffer from severe visual fatigue. Most agents do not speak their long answers, and screen readers fail by reading raw code syntax, semicolons, and curly braces verbatim.

**AudioWizard** solves this with a clean, lightweight text-to-speech engine with zero subscription fees:

1. **Reads files cleanly** (Markdown, TXT, PRDs, specs) with intelligent AST cleaning (skipping raw code blocks and table markers).
2. **Reads agent responses with 1 keypress** via the clipboard bridge.
3. **Works 100% free with Microsoft Edge Neural voices** (no API keys, human-grade realism).

---

## Key Features

- **Read Document (`Ctrl + Alt + R`):** Read the current markdown or text file aloud from the start or current position.
- **Read Selection (`Ctrl + Alt + S`):** Highlight any paragraph, instruction, or diff and listen immediately.
- **Read Clipboard / Agent Response (`Ctrl + Alt + C`):** Click 'Copy' on any AI agent chat response or prompt, and press `Ctrl + Alt + C` to hear it immediately without opening or pasting into a file!
- **Play / Pause (`Ctrl + Alt + Space`):** Instantly toggle playback.
- **Stop Audio (`audiowizard.stop`):** Stop speech immediately.
- **Side Audio Controller:** Adjust speed (0.75x to 2.0x), switch voices, and view the text being spoken.

---

## Default Keybindings

| Command | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Read Document** | `Ctrl + Alt + R` | `Cmd + Alt + R` |
| **Read Selection** | `Ctrl + Alt + S` | `Cmd + Alt + S` |
| **Read Clipboard / Agent Response** | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| **Toggle Play / Pause** | `Ctrl + Alt + Space` | `Cmd + Alt + Space` |

---

## Development & Building

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Package into .vsix
npx @vscode/vsce package
```

---

## License

MIT (c) [DrOpenSource](https://github.com/DrOpenSource)
