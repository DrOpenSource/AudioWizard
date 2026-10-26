# AudioWizard: Pricing, Licensing & Honest Claims

**Single source of truth for anything AudioWizard says about itself**: README, Marketplace/Open VSX listing, Gumroad page, in-extension text, privacy policy and social posts. When the product changes, update this file first, then the copy.

*Decisions recorded 2026-10-26 by the owner.*

## 1. Decisions

| Topic | Decision |
|---|---|
| **Free tier** | Everything in 0.1.x stays free forever: read file / selection / clipboard, Skim mode, all voices, speed, the player. No nag screens. |
| **Pro** | **Coming in v0.2:** Overview, a short spoken summary made with the user's own AI key (BYOK). Not on sale yet. |
| **Price** | **$4.99 one-time** when Pro launches. No subscriptions, ever. |
| **License** | Personal license, honour system, all of the buyer's own machines (same as the rest of the Wizard series). |
| **"Lifetime"** | The license never expires. It does not promise updates forever. |

## 2. Service model

- **No servers of our own.** Neural voices come from Microsoft's Edge read-aloud service; Overview (v0.2) will call the AI provider the user brings a key for. Gumroad license check at Pro activation only.
- The Edge voice service is **not an official, documented API**. It has changed before (it broke `msedge-tts` 2.1.0 on 2026-10-25; fixed in 2.1.1). Never promise it will always work. The system-voice fallback must always work.

## 3. Rules for any claim

1. **Shipped + tested only.** Planned features say **"Coming in v0.2"**, never a ✓.
2. **Measured numbers only.** Measured on Windows 11, 2026-10-26: first sentence of audio in **about 1–2 s** (1.2–1.7 s), each following sentence prepared in about **0.5 s**, ahead of playback. Don't say "instant".
3. **Privacy wording:** "With neural voices, the text being read is sent to Microsoft's speech service. Switch to system voices and nothing leaves your machine." Never say "100% offline" or "nothing leaves your machine" without the system-voice condition.
4. **Skim** is extractive (headings + first sentences). Never call it AI or a summary.
5. **Chat panels:** reading highlighted chat text depends on the panel supporting the editor's Copy command. Say "select text in a chat panel, or click its Copy button, then press Ctrl+Alt+C". Only name an editor/panel as working after it has been tried.
6. **Editors:** VS Code (Marketplace); Cursor and Antigravity via Open VSX. Say "tested in X" only after a hands-on test, with the version and date recorded here.

## 4. Test record

| Date | Editor | Result |
|---|---|---|
| 2026-10-26 | Unit tests (vitest), Windows 11 | 13/13 pass: cleaner, chunker, skim |
| 2026-10-26 | Edge TTS live, Windows 11 | Synthesis, SSML escaping, voice switching, cancel: pass |
| 2026-10-26 | Antigravity IDE 2.5.5 (VS Code 1.107), Windows 11, hands-on by the owner | All checks pass: read file, Stop while preparing/playing and on disable, Ctrl+Alt+C in editor and Agent panel, Skim, speed, voice, click-to-jump |
| | VS Code | _not yet tested hands-on: say "available", not "tested"_ |
| | Cursor | _not yet tested hands-on: say "available via Open VSX", not "tested"_ |
