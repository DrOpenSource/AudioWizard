# AudioWizard

> **Listen instead of read.** Neural text-to-speech for Markdown docs, long specs and AI agent replies, right inside **VS Code**, **Cursor** and **Antigravity**.

---

## The Problem

When working with AI coding agents (Claude Code, Gemini, Copilot) or reviewing long architectural specs, planning docs, and multi-thousand-line context files, developers suffer from severe visual fatigue. Most agents do not speak their long answers, and screen readers fail by reading raw code syntax, semicolons, and curly braces verbatim.

**AudioWizard** gives you a speaker button for all of it: free, with natural neural voices and no API key.

---

## How to use it

| Do this | Press |
| :--- | :--- |
| Read the current file (from the cursor, or from the top) | `Ctrl+Alt+R` · `⌘⌥R` |
| Read your selection, or an agent reply you selected or copied | `Ctrl+Alt+C` · `⌘⌥C` |
| Play / pause | `Ctrl+Alt+Space` · `⌘⌥P` |
| Stop | `Ctrl+Alt+X` · `⌘⌥X` (or Esc in the player) |

You can also click the **speaker icon** in the title bar of any Markdown or text file.

**Agent replies:** select text in the chat panel and press `Ctrl+Alt+C`. If a panel doesn't let AudioWizard copy the selection, click the reply's **Copy** button first, then press `Ctrl+Alt+C`.

---

## The player

AudioWizard opens a compact player in the bottom panel, next to the Terminal. You can drag it to a sidebar if you prefer.

- **Play / pause, previous / next sentence**, and a progress bar you can click to jump.
- **The text, with the current sentence highlighted.** Click any sentence to start reading from there.
- **Speed** from 0.75× to 2.5×, and **13 neural voices** (US, UK, India, Australia).
- **Full or Skim.** Skim reads just the headings and the first sentence of each section, so you get the shape of a long doc in a minute.

Long files start speaking in a second or two: AudioWizard reads sentence by sentence and prepares the next ones while you listen.

---

## Reads Markdown like a person would

- Code blocks are announced, not read: *"Code block, 12 lines, skipped."*
- Tables become spoken lists, links read their text, and URLs read as *"link to github.com"*.
- Headings, bullets, bold and checkboxes are read as plain text, and `snake_case` names stay intact.

---

## Settings

| Setting | Default | What it does |
| :--- | :--- | :--- |
| `audiowizard.engine` | `neural` | `neural`: Microsoft Edge neural voices. `system`: your operating system's voices, fully offline. |
| `audiowizard.voice` | `en-US-JennyNeural` | Neural voice. Also changeable in the player. |
| `audiowizard.speed` | `1` | 0.5× to 2.5×. Also changeable in the player. |
| `audiowizard.skipCodeBlocks` | `true` | Announce code blocks instead of reading code aloud. |

---

## Privacy

With neural voices, the text being read is sent, sentence by sentence, to Microsoft's Edge speech service to generate the audio. Nothing else from your project is sent. Switch `audiowizard.engine` to `system` and nothing leaves your machine. No accounts, no analytics. Details: [PRIVACY.md](PRIVACY.md).

The neural voices come from Microsoft's Edge read-aloud service, which isn't an official API and can change. If it can't be reached, AudioWizard switches to your system voice automatically.

---

## Coming in v0.2: Overview (Pro)

A short spoken summary of a long doc or agent reply, made with **your own AI key** (Gemini, OpenAI, Anthropic or a local Ollama model). **$4.99 once**, no subscription. Everything above stays free.

---

## Known limitations

- On keyboard layouts that use **AltGr** (Polish, German and others), `Ctrl+Alt` shortcuts can clash with typing special characters. Rebind them in **Keyboard Shortcuts** (search "AudioWizard").
- Reading highlighted chat text depends on the chat panel supporting the editor's Copy command. The Copy-button route always works.

---

## Development

```bash
npm install
npm test          # parser tests
npm run build     # bundle to dist/
npm run package   # typecheck, test, build and create the .vsix
```

## License

MIT © [Dr. OpenSource](https://github.com/DrOpenSource)
