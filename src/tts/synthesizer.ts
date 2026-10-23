import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface TTSChunk {
  text: string;
  audioBase64: string;
}

export class TTSSynthesizer {
  private tts: MsEdgeTTS;
  private currentVoice: string = 'en-US-JennyNeural';

  constructor(voice: string = 'en-US-JennyNeural') {
    this.tts = new MsEdgeTTS();
    this.currentVoice = voice;
  }

  public async setVoice(voice: string) {
    this.currentVoice = voice;
  }

  public splitIntoChunks(text: string, maxLen: number = 400): string[] {
    const rawSentences = text.split(/(?<=[.?!;:\n])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const s of rawSentences) {
      if ((current + ' ' + s).trim().length > maxLen && current.trim().length > 0) {
        chunks.push(current.trim());
        current = s;
      } else {
        current = (current + ' ' + s).trim();
      }
    }
    if (current.trim().length > 0) {
      chunks.push(current.trim());
    }
    return chunks;
  }

  public async synthesizeText(text: string, voice?: string): Promise<string> {
    const targetVoice = voice || this.currentVoice;
    await this.tts.setMetadata(targetVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = this.tts.toStream(text);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        resolve(`data:audio/mp3;base64,${fullBuffer.toString('base64')}`);
      });
      audioStream.on('error', (err: any) => reject(err));
    });
  }
}
