import * as vscode from 'vscode';
import { AudioPlayerManager, ReadMode } from './player/audioPlayer';

function fileName(doc: vscode.TextDocument): string {
  return doc.fileName.split(/[\\/]/).pop() || 'Document';
}

/**
 * Copies whatever is selected in the focused view (a chat panel, a webview),
 * then reads the clipboard. Falls back to the existing clipboard when nothing was selected.
 */
async function copyFocusedSelection(): Promise<void> {
  try {
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    await new Promise((resolve) => setTimeout(resolve, 120));
  } catch {
    // Nothing focusable to copy from; use the clipboard as it is
  }
}

export function activate(context: vscode.ExtensionContext) {
  const player = new AudioPlayerManager(context);
  context.subscriptions.push(player);

  const readDocument = (mode?: ReadMode) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('AudioWizard: Open a file first.');
      return;
    }
    const { document, selection } = editor;
    // From the cursor to the end, unless the cursor is at the very top
    const start = selection.isEmpty && selection.active.line > 0 ? document.lineAt(selection.active.line).range.start : undefined;
    const text = start ? document.getText(new vscode.Range(start, document.lineAt(document.lineCount - 1).range.end)) : document.getText();
    const title = start ? `${fileName(document)} · from line ${start.line + 1}` : fileName(document);
    void player.play(text, title, 'document', mode);
  };

  const readSelection = (): boolean => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) return false;
    void player.play(editor.document.getText(editor.selection), `${fileName(editor.document)} · selection`, 'selection');
    return true;
  };

  const readClipboard = async (copyFirst: boolean) => {
    if (copyFirst) await copyFocusedSelection();
    const text = await vscode.env.clipboard.readText();
    if (!text.trim()) {
      vscode.window.showInformationMessage(
        'AudioWizard: Nothing to read. Select text (or click Copy on an agent reply), then press Ctrl+Alt+C.'
      );
      return;
    }
    void player.play(text, 'Clipboard', 'clipboard');
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('audiowizard.readDocument', () => readDocument()),
    vscode.commands.registerCommand('audiowizard.skimDocument', () => readDocument('skim')),
    vscode.commands.registerCommand('audiowizard.readSelection', () => {
      if (!readSelection()) vscode.window.showInformationMessage('AudioWizard: Highlight some text first.');
    }),
    vscode.commands.registerCommand('audiowizard.readClipboard', () => readClipboard(false)),
    // Ctrl+Alt+C: editor selection, else whatever is selected in the focused panel, else the clipboard
    vscode.commands.registerCommand('audiowizard.read', async (args?: { copyFirst?: boolean }) => {
      // copyFirst is set by the keybinding when focus is outside the text editor
      const copyFirst = args?.copyFirst === true;
      if (!copyFirst && readSelection()) return;
      await readClipboard(copyFirst);
    }),
    vscode.commands.registerCommand('audiowizard.togglePlayPause', () => player.togglePlayPause()),
    vscode.commands.registerCommand('audiowizard.stop', () => player.stop())
  );
}

export function deactivate() {
  // The player is disposed through context.subscriptions, which stops any audio
}
