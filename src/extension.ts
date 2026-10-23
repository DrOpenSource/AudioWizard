import * as vscode from 'vscode';
import { AudioPlayerManager } from './player/audioPlayer';

export function activate(context: vscode.ExtensionContext) {
  const player = AudioPlayerManager.getInstance(context);

  // Status Bar Item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "$(unmute) AudioWizard";
  statusBar.tooltip = "Click to Toggle Audio Play/Pause (Ctrl+Alt+Space)";
  statusBar.command = "audiowizard.togglePlayPause";
  statusBar.show();
  context.subscriptions.push(statusBar);

  // 1. Read Active Document
  const readDocCmd = vscode.commands.registerCommand('audiowizard.readDocument', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('AudioWizard: Open a file first.');
      return;
    }
    const doc = editor.document;
    const text = doc.getText();
    const fileName = doc.fileName.split(/[\\/]/).pop() || 'Document';
    player.playText(text, fileName);
  });

  // 2. Read Selected Text
  const readSelCmd = vscode.commands.registerCommand('audiowizard.readSelection', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showInformationMessage('AudioWizard: Highlight some text first to read.');
      return;
    }
    const text = editor.document.getText(editor.selection);
    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'Selection';
    player.playText(text, `${fileName} (Selection)`);
  });

  // 3. Read Clipboard (e.g. Agent Response)
  const readClipCmd = vscode.commands.registerCommand('audiowizard.readClipboard', async () => {
    const text = await vscode.env.clipboard.readText();
    if (!text || !text.trim()) {
      vscode.window.showInformationMessage('AudioWizard: Clipboard is empty. Copy text from chat first.');
      return;
    }
    player.playText(text, 'Clipboard / Agent Response');
  });

  // 4. Toggle Play/Pause
  const toggleCmd = vscode.commands.registerCommand('audiowizard.togglePlayPause', () => {
    player.togglePlayPause();
  });

  // 5. Stop Audio
  const stopCmd = vscode.commands.registerCommand('audiowizard.stop', () => {
    player.stop();
  });

  context.subscriptions.push(readDocCmd, readSelCmd, readClipCmd, toggleCmd, stopCmd);
}

export function deactivate() {
  // Clean up if needed
}
