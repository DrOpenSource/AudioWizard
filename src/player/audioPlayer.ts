import * as vscode from 'vscode';
import { cleanTextForSpeech } from '../parser/cleaner';
import { TTSSynthesizer } from '../tts/synthesizer';

export class AudioPlayerManager {
  private static instance: AudioPlayerManager | null = null;
  private panel: vscode.WebviewPanel | null = null;
  private synthesizer: TTSSynthesizer;
  private statusBarItem: vscode.StatusBarItem | null = null;
  private currentTitle: string = 'AudioWizard Player';
  private currentText: string = '';

  private constructor(private readonly context: vscode.ExtensionContext) {
    this.synthesizer = new TTSSynthesizer();
  }

  public static getInstance(context: vscode.ExtensionContext): AudioPlayerManager {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager(context);
    }
    return AudioPlayerManager.instance;
  }

  public setStatusBarItem(item: vscode.StatusBarItem) {
    this.statusBarItem = item;
  }

  public async playText(text: string, title: string = 'Audio'): Promise<void> {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned.trim()) {
      vscode.window.showInformationMessage('AudioWizard: No readable text found.');
      return;
    }

    this.currentTitle = title;
    this.currentText = cleaned;
    this.ensurePanel();

    if (this.statusBarItem) {
      this.statusBarItem.text = '$(sync~spin) AudioWizard: Synthesizing...';
    }

    this.panel?.webview.postMessage({
      command: 'prepare',
      text: this.currentText,
      title: this.currentTitle
    });

    try {
      // Synthesize using Edge Neural TTS
      const audioDataUrl = await this.synthesizer.synthesizeText(this.currentText);
      this.panel?.webview.postMessage({
        command: 'playAudio',
        audioSrc: audioDataUrl,
        title: this.currentTitle,
        text: this.currentText
      });
      if (this.statusBarItem) {
        this.statusBarItem.text = '$(unmute) AudioWizard: Playing';
      }
    } catch (err: any) {
      console.warn('Edge TTS failed, falling back to Webview Speech API:', err);
      this.panel?.webview.postMessage({
        command: 'fallbackSpeech',
        text: this.currentText,
        title: this.currentTitle
      });
      if (this.statusBarItem) {
        this.statusBarItem.text = '$(unmute) AudioWizard: Playing';
      }
    }
  }

  public togglePlayPause(): void {
    if (!this.panel) {
      vscode.window.showInformationMessage('AudioWizard: No active audio session. Highlight text or copy to clipboard first.');
      return;
    }
    this.panel.webview.postMessage({ command: 'toggle' });
  }

  public stop(): void {
    if (this.panel) {
      this.panel.webview.postMessage({ command: 'stop' });
    }
    if (this.statusBarItem) {
      this.statusBarItem.text = '$(unmute) AudioWizard';
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
        if (this.statusBarItem) {
          if (message.playing) {
            this.statusBarItem.text = '$(unmute) AudioWizard: Playing';
          } else if (message.paused) {
            this.statusBarItem.text = '$(mute) AudioWizard: Paused';
          } else {
            this.statusBarItem.text = '$(unmute) AudioWizard';
          }
        }
      } else if (message.type === 'changeVoice') {
        this.synthesizer.setVoice(message.voice);
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
      if (this.statusBarItem) {
        this.statusBarItem.text = '$(unmute) AudioWizard';
      }
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
      padding: 16px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--vscode-widget-border, #333);
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    h2 { margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; }
    .controls {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 7px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    select {
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border);
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
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
      word-break: break-word;
    }
    .status-badge {
      font-size: 0.78rem;
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
    <button id="btnPlayPause">Play</button>
    <button id="btnStop">Stop</button>
    
    <label>Speed:
      <select id="selSpeed">
        <option value="0.75">0.75x</option>
        <option value="1.0" selected>1.0x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="1.75">1.75x</option>
        <option value="2.0">2.0x</option>
      </select>
    </label>

    <label>Voice:
      <select id="selVoice">
        <option value="en-US-JennyNeural" selected>Jenny (US Neural)</option>
        <option value="en-US-GuyNeural">Guy (US Neural)</option>
        <option value="en-US-AriaNeural">Aria (US Neural)</option>
        <option value="en-IN-NeerjaNeural">Neerja (India Neural)</option>
        <option value="en-GB-SoniaNeural">Sonia (UK Neural)</option>
      </select>
    </label>
  </div>

  <div id="content" class="text-box">Ready. Use Ctrl+Alt+C to read copied chat response, or Ctrl+Alt+R on open files.</div>

  <audio id="audioEl" style="display:none;"></audio>

  <script>
    const vscode = acquireVsCodeApi();
    const audioEl = document.getElementById('audioEl');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnStop = document.getElementById('btnStop');
    const selSpeed = document.getElementById('selSpeed');
    const selVoice = document.getElementById('selVoice');
    const badge = document.getElementById('badge');
    const titleEl = document.getElementById('title');
    const contentEl = document.getElementById('content');

    function setBadge(text, playing, paused) {
      badge.textContent = text;
      vscode.postMessage({ type: 'status', playing: playing, paused: paused });
    }

    audioEl.addEventListener('play', () => {
      setBadge('Playing', true, false);
      btnPlayPause.textContent = 'Pause';
    });

    audioEl.addEventListener('pause', () => {
      if (!audioEl.ended) {
        setBadge('Paused', false, true);
        btnPlayPause.textContent = 'Resume';
      }
    });

    audioEl.addEventListener('ended', () => {
      setBadge('Finished', false, false);
      btnPlayPause.textContent = 'Replay';
    });

    audioEl.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setBadge('Error', false, false);
    });

    btnPlayPause.addEventListener('click', () => {
      if (!audioEl.src) return;
      if (audioEl.paused) {
        audioEl.play().catch(console.error);
      } else {
        audioEl.pause();
      }
    });

    btnStop.addEventListener('click', () => {
      audioEl.pause();
      audioEl.currentTime = 0;
      setBadge('Stopped', false, false);
      btnPlayPause.textContent = 'Play';
    });

    selSpeed.addEventListener('change', () => {
      audioEl.playbackRate = parseFloat(selSpeed.value) || 1.0;
    });

    selVoice.addEventListener('change', () => {
      vscode.postMessage({ type: 'changeVoice', voice: selVoice.value });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'prepare') {
        titleEl.textContent = msg.title || 'AudioWizard Player';
        contentEl.textContent = msg.text || '';
        setBadge('Synthesizing...', false, false);
      } else if (msg.command === 'playAudio') {
        titleEl.textContent = msg.title || 'AudioWizard Player';
        contentEl.textContent = msg.text || '';
        audioEl.src = msg.audioSrc;
        audioEl.playbackRate = parseFloat(selSpeed.value) || 1.0;
        audioEl.play().catch(console.error);
      } else if (msg.command === 'toggle') {
        btnPlayPause.click();
      } else if (msg.command === 'stop') {
        btnStop.click();
      } else if (msg.command === 'fallbackSpeech') {
        titleEl.textContent = msg.title || 'AudioWizard Player';
        contentEl.textContent = msg.text || '';
        const utt = new SpeechSynthesisUtterance(msg.text);
        utt.rate = parseFloat(selSpeed.value) || 1.0;
        window.speechSynthesis.speak(utt);
      }
    });
  </script>
</body>
</html>`;
  }
}
