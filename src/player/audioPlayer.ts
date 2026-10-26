import * as vscode from 'vscode';
import { cleanTextForSpeech } from '../parser/cleaner';
import { Chunk, splitIntoChunks } from '../parser/chunker';
import { skimMarkdown } from '../parser/skim';
import { SynthesisCancelled, TTSSynthesizer } from '../tts/synthesizer';
import { getPlayerHtml } from './webview';

export type ReadMode = 'full' | 'skim';
export type Origin = 'document' | 'selection' | 'clipboard';
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';

interface Source {
  raw: string;
  title: string;
  origin: Origin;
}

const PREFETCH = 2;

/**
 * Owns the player view and the read-aloud session. The webview plays one chunk
 * at a time and asks for the next; this side synthesizes ahead of it.
 */
export class AudioPlayerManager implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewId = 'audiowizard.player';

  private view: vscode.WebviewView | null = null;
  private ready = false;
  private outbox: unknown[] = [];
  private readonly synthesizer = new TTSSynthesizer();
  private readonly statusBar: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  private source: Source | null = null;
  private mode: ReadMode = 'full';
  private chunks: Chunk[] = [];
  private session = 0;
  private abort = new AbortController();
  private cache = new Map<number, Promise<string>>();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBar.command = 'audiowizard.togglePlayPause';
    this.setState('idle');
    this.statusBar.show();

    this.disposables.push(
      this.statusBar,
      vscode.window.registerWebviewViewProvider(AudioPlayerManager.viewId, this, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('audiowizard')) this.post({ command: 'settings', ...this.settings() });
      })
    );
  }

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    this.ready = false;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'assets')],
    };
    view.webview.html = getPlayerHtml(view.webview);
    view.webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    view.onDidDispose(() => {
      this.view = null;
      this.ready = false;
      this.cancelSynthesis();
      this.setState('idle');
    });
  }

  public async play(raw: string, title: string, origin: Origin, mode: ReadMode = this.mode): Promise<void> {
    this.source = { raw, title, origin };
    this.mode = mode;
    if (!this.load(0)) {
      vscode.window.showInformationMessage('AudioWizard: No readable text found.');
      return;
    }
    await this.reveal(origin !== 'clipboard');
  }

  public togglePlayPause(): void {
    if (!this.source) {
      vscode.window.showInformationMessage('AudioWizard: Nothing to play yet. Select text or copy a reply, then press Ctrl+Alt+C.');
      return;
    }
    this.post({ command: 'toggle' });
  }

  public stop(): void {
    this.cancelSynthesis();
    this.post({ command: 'stop' });
    this.setState('idle');
  }

  public dispose(): void {
    this.stop();
    this.synthesizer.dispose();
    this.disposables.forEach((d) => d.dispose());
  }

  /** Builds the chunk list for the current source and mode and sends it to the player. */
  private load(startIndex: number): boolean {
    if (!this.source) return false;
    const { skipCodeBlocks } = this.settings();
    const text = this.mode === 'skim' ? skimMarkdown(this.source.raw) : this.source.raw;
    const chunks = splitIntoChunks(cleanTextForSpeech(text, { skipCodeBlocks }));
    if (!chunks.length) return false;

    this.cancelSynthesis();
    this.chunks = chunks;
    this.session++;
    this.setState('loading');
    this.post({
      command: 'load',
      session: this.session,
      title: this.source.title,
      origin: this.source.origin,
      mode: this.mode,
      chunks,
      startIndex: Math.min(startIndex, chunks.length - 1),
      ...this.settings(),
    });
    return true;
  }

  private onMessage(msg: any): void {
    switch (msg?.type) {
      case 'ready':
        this.ready = true;
        this.outbox.splice(0).forEach((m) => this.view?.webview.postMessage(m));
        this.post({ command: 'settings', ...this.settings() });
        break;
      case 'need':
        if (msg.session === this.session) this.deliver(msg.index);
        break;
      case 'state':
        this.setState(msg.state);
        break;
      case 'setVoice':
        this.cancelSynthesis();
        void this.updateSetting('voice', msg.voice).then(() => {
          if (typeof msg.index === 'number') this.load(msg.index);
        });
        break;
      case 'setSpeed':
        void this.updateSetting('speed', msg.speed);
        break;
      case 'setMode':
        if (msg.mode === 'full' || msg.mode === 'skim') {
          this.mode = msg.mode;
          this.load(0);
        }
        break;
      case 'stop':
        this.cancelSynthesis();
        break;
    }
  }

  private async deliver(index: number): Promise<void> {
    const session = this.session;
    for (const key of this.cache.keys()) {
      if (key < index - 1) this.cache.delete(key);
    }
    for (let i = index + 1; i <= index + PREFETCH && i < this.chunks.length; i++) {
      this.synthesizeAhead(i).catch(() => undefined);
    }
    try {
      const src = await this.synthesizeAhead(index);
      if (session === this.session) this.post({ command: 'audio', session, index, src });
    } catch (err) {
      if (err instanceof SynthesisCancelled || session !== this.session) return;
      console.warn('AudioWizard: Edge TTS failed, using the system voice for this sentence.', err);
      this.cache.delete(index);
      this.post({ command: 'audioFailed', session, index });
    }
  }

  private synthesizeAhead(index: number): Promise<string> {
    let pending = this.cache.get(index);
    if (!pending) {
      pending = this.synthesizer.synthesize(this.chunks[index].text, this.settings().voice, this.abort.signal);
      this.cache.set(index, pending);
    }
    return pending;
  }

  private cancelSynthesis(): void {
    this.abort.abort();
    this.abort = new AbortController();
    this.cache.clear();
  }

  private async reveal(restoreEditorFocus: boolean): Promise<void> {
    if (this.view) {
      this.view.show(true);
      return;
    }
    await vscode.commands.executeCommand(`${AudioPlayerManager.viewId}.focus`);
    if (restoreEditorFocus && vscode.window.activeTextEditor) {
      await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    }
  }

  private post(message: unknown): void {
    if (this.view && this.ready) {
      this.view.webview.postMessage(message);
    } else if ((message as { command?: string }).command === 'load') {
      // Only the latest load matters once the view comes up
      this.outbox = [message];
    }
  }

  private settings() {
    const config = vscode.workspace.getConfiguration('audiowizard');
    return {
      voice: config.get<string>('voice', 'en-US-JennyNeural'),
      speed: config.get<number>('speed', 1),
      engine: config.get<'neural' | 'system'>('engine', 'neural'),
      skipCodeBlocks: config.get<boolean>('skipCodeBlocks', true),
    };
  }

  private async updateSetting(key: string, value: unknown): Promise<void> {
    await vscode.workspace.getConfiguration('audiowizard').update(key, value, vscode.ConfigurationTarget.Global);
  }

  private setState(state: PlayerState): void {
    const labels: Record<PlayerState, [string, string]> = {
      idle: ['$(unmute) AudioWizard', 'AudioWizard: read selection or clipboard (Ctrl+Alt+C)'],
      loading: ['$(loading~spin) AudioWizard', 'AudioWizard: preparing audio'],
      playing: ['$(debug-pause) AudioWizard', 'AudioWizard: playing. Click to pause (Ctrl+Alt+Space)'],
      paused: ['$(play) AudioWizard', 'AudioWizard: paused. Click to resume (Ctrl+Alt+Space)'],
    };
    const [text, tooltip] = labels[state] ?? labels.idle;
    this.statusBar.text = text;
    this.statusBar.tooltip = tooltip;
    void vscode.commands.executeCommand('setContext', 'audiowizard.active', state !== 'idle');
  }
}
