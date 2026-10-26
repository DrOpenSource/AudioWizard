# Changelog

## 0.1.0: First release

Listen to long docs and agent replies instead of reading them.

- **Read anything.** `Ctrl+Alt+R` reads the current file from the cursor (or from the top). `Ctrl+Alt+C` reads your selection; outside the editor it reads text you selected in a chat panel, or whatever you copied.
- **Starts fast, even on long files.** Text is read sentence by sentence, with the next sentences prepared while one plays, so a long spec starts speaking in a second or two.
- **The player.** A compact player in the bottom panel: play/pause, previous/next sentence, a progress bar you can click, speed from 0.75× to 2.5×, 13 neural voices, and the text with the current sentence highlighted. Click any sentence to jump to it.
- **Skim mode.** Hear just the headings and the first sentence of each section.
- **Stop means stop.** `Ctrl+Alt+X`, the Stop button or Esc stops speech immediately, including while audio is still being prepared, and disabling the extension silences it.
- **Reads Markdown like a person would.** Code blocks are announced ("Code block, 12 lines, skipped"), tables become lists, links read their text, URLs read as "link to github.com", and `snake_case` names stay intact.
- **System voices.** Set `audiowizard.engine` to `system` to use your operating system's voices; nothing leaves your machine. If the neural voice service can't be reached, AudioWizard uses the system voice automatically.
