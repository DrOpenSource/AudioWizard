import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { escapeForSsml } from '../parser/chunker';

export class SynthesisCancelled extends Error {
  constructor() {
    super('Synthesis cancelled');
  }
}

/**
 * Edge neural TTS over a single connection. Requests run one at a time so
 * voice changes never race, and cancelled requests are skipped before they start.
 */
export class TTSSynthesizer {
  private tts: MsEdgeTTS | null = null;
  private voice = '';
  private queue: Promise<unknown> = Promise.resolve();

  public synthesize(text: string, voice: string, signal: AbortSignal): Promise<string> {
    const job = this.queue.then(() => this.run(text, voice, signal));
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async run(text: string, voice: string, signal: AbortSignal): Promise<string> {
    try {
      return await this.attempt(text, voice, signal);
    } catch (err) {
      if (err instanceof SynthesisCancelled) throw err;
      // Reconnects occasionally time out; one fresh connection usually succeeds
      return this.attempt(text, voice, signal);
    }
  }

  private async attempt(text: string, voice: string, signal: AbortSignal): Promise<string> {
    if (signal.aborted) throw new SynthesisCancelled();
    try {
      if (!this.tts) {
        this.tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 15000 });
        this.voice = '';
      }
      if (this.voice !== voice) {
        await this.tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        this.voice = voice;
      }
      const { audioStream } = this.tts.toStream(escapeForSsml(text));
      const audio = await new Promise<Buffer>((resolve, reject) => {
        const parts: Buffer[] = [];
        audioStream.on('data', (part: Buffer) => parts.push(part));
        audioStream.on('end', () => resolve(Buffer.concat(parts)));
        audioStream.on('error', reject);
      });
      if (!audio.length) throw new Error('Edge TTS returned no audio');
      return `data:audio/mp3;base64,${audio.toString('base64')}`;
    } catch (err) {
      // Drop the connection so the next request starts from a clean socket
      this.dispose();
      throw err;
    }
  }

  public dispose(): void {
    try {
      this.tts?.close();
    } catch {
      // Already closed
    }
    this.tts = null;
    this.voice = '';
  }
}
