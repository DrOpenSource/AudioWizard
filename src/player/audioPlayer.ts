import * as vscode from 'vscode';
import { cleanTextForSpeech } from '../parser/cleaner';

export class AudioPlayerManager {
  private static instance: AudioPlayerManager | null = null;
  private panel: vscode.WebviewPanel | null = null;
  private isPlaying: boolean = false;
  private currentTitle: string = 'AudioWizard Player';
  private currentText: string = '';

  private constructor(private readonly context: vscode.ExtensionContext) {}

  public static getInstance(context: vscode.ExtensionContext): AudioPlayerManager {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager(context);
    }
    return AudioPlayerManager.instance;
  }

  public playText(text: string, title: string = 'Audio'): void {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned.trim()) {
      vscode.window.showInformationMessage('AudioWizard: No readable text found.');
      return;
    }

    this.currentTitle = title;
    this.currentText = cleaned;

    this.ensurePanel();
    this.panel?.webview.postMessage({
      command: 'play',
      text: this.currentText,
      title: this.currentTitle
    });
  }

  public togglePlayPause(): void {
    if (!this.panel) {
      vscode.window.showInformationMessage('AudioWizard: No active audio session. Use Read Document or Read Selection to start.');
      return;
    }
    this.panel.webview.postMessage({ command: 'toggle' });
  }

  public stop(): void {
    if (this.panel) {
      this.panel.webview.postMessage({ command: 'stop' });
    }
  }

  private ensurePanel(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'audiowizard.player',
      'AudioWizard Player',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'status') {
        this.isPlaying = message.playing;
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
      this.isPlaying = false;
    });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AudioWizard</title>
  <style>
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 18px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--vscode-widget-border, #333);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h2 { margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
    .controls {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .speed-select, .voice-select {
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border);
      padding: 6px 10px;
      border-radius: 4px;
    }
    .text-box {
      background: var(--vscode-editorWidget-background, rgba(255,255,255,0.03));
      border: 1px solid var(--vscode-widget-border, #444);
      padding: 14px;
      border-radius: 6px;
      max-height: 380px;
      overflow-y: auto;
      font-size: 0.95rem;
      white-space: pre-wrap;
    }
    .status-badge {
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 12px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 id="title">AudioWizard Player</h2>
    <span id="badge" class="status-badge">Idle</span>
  </div>

  <div class="controls">
    <button id="btnPlayPause">Pause</button>
    <button id="btnStop">Stop</button>
    
    <label>Speed:
      <select id="selSpeed" class="speed-select">
        <option value="0.75">0.75x</option>
        <option value="1.0" selected>1.0x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="1.75">1.75x</option>
        <option value="2.0">2.0x</option>
      </select>
    </label>

    <label>Voice:
      <select id="selVoice" class="voice-select"></select>
    </label>
  </div>

  <div id="content" class="text-box">Ready to read. Use Ctrl+Alt+R on documents or Ctrl+Alt+C for clipboard.</div>

  <script>
    const vscode = acquireVsCodeApi();
    let synth = window.speechSynthesis;
    let voices = [];
    let currentUtterance = null;
    let currentText = '';
    let isPaused = false;

    function populateVoices() {
      voices = synth.getVoices().filter(v => v.lang.startsWith('en'));
      if (voices.length === 0) voices = synth.getVoices();
      const sel = document.getElementById('selVoice');
      sel.innerHTML = '';
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = v.name + ' (' + v.lang + ')';
        if (v.name.includes('Natural') || v.name.includes('Neural') || v.default) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      });
    }

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();

    function setBadge(text, playing) {
      const b = document.getElementById('badge');
      b.textContent = text;
      vscode.postMessage({ type: 'status', playing: playing });
    }

    function speak(text, title) {
      synth.cancel();
      isPaused = false;
      currentText = text;
      document.getElementById('title').textContent = title || 'AudioWizard Player';
      document.getElementById('content').textContent = text;
      document.getElementById('btnPlayPause').textContent = 'Pause';

      if (!text.trim()) return;

      currentUtterance = new SpeechSynthesisUtterance(text);
      const selVoice = document.getElementById('selVoice');
      if (voices[selVoice.value]) {
        currentUtterance.voice = voices[selVoice.value];
      }
      currentUtterance.rate = parseFloat(document.getElementById('selSpeed').value) || 1.0;

      currentUtterance.onstart = () => setBadge('Playing', true);
      currentUtterance.onend = () => {
        setBadge('Finished', false);
        document.getElementById('btnPlayPause').textContent = 'Replay';
      };
      currentUtterance.onerror = () => setBadge('Error', false);

      synth.speak(currentUtterance);
    }

    document.getElementById('btnPlayPause').addEventListener('click', () => {
      if (!currentText) return;
      if (synth.speaking && !synth.paused) {
        synth.pause();
        isPaused = true;
        document.getElementById('btnPlayPause').textContent = 'Resume';
        setBadge('Paused', false);
      } else if (synth.paused) {
        synth.resume();
        isPaused = false;
        document.getElementById('btnPlayPause').textContent = 'Pause';
        setBadge('Playing', true);
      } else {
        speak(currentText, document.getElementById('title').textContent);
      }
    });

    document.getElementById('btnStop').addEventListener('click', () => {
      synth.cancel();
      isPaused = false;
      setBadge('Stopped', false);
      document.getElementById('btnPlayPause').textContent = 'Play';
    });

    document.getElementById('selSpeed').addEventListener('change', () => {
      if (synth.speaking && !synth.paused) {
        speak(currentText, document.getElementById('title').textContent);
      }
    });

    document.getElementById('selVoice').addEventListener('change', () => {
      if (synth.speaking && !synth.paused) {
        speak(currentText, document.getElementById('title').textContent);
      }
    });

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'play') {
        speak(msg.text, msg.title);
      } else if (msg.command === 'toggle') {
        document.getElementById('btnPlayPause').click();
      } else if (msg.command === 'stop') {
        document.getElementById('btnStop').click();
      }
    });
  </script>
</body>
</html>`;
  }
}
