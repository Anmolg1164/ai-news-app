'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech using Gemini TTS with Indian English accent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TTSInputSchema = z.object({
  text: z.string(),
  voice: z.enum(['Charon', 'Vindemiatrix']).default('Charon'),
  style: z.enum(['professional', 'analytical', 'serene']).optional(),
});
export type TTSInput = z.infer<typeof TTSInputSchema>;

export async function textToSpeech(input: string | TTSInput): Promise<{ media: string }> {
  const finalInput = typeof input === 'string' ? { text: input, voice: 'Charon' as const } : input;
  
  // Algenib: Professional/Analytical (Male)
  // Pherkad: Serene (Male/Neutral)
  const voiceName = finalInput.voice === 'Vindemiatrix' ? 'Pherkad' : 'Algenib';
  
  // Explicit Indian English Accent configuration
  let finalPrompt = `[Indian English accent] ${finalInput.text}`;
  if (finalInput.style === 'professional') finalPrompt = `[Indian English accent] [professional] ${finalInput.text}`;
  else if (finalInput.style === 'analytical') finalPrompt = `[Indian English accent] [analytical] ${finalInput.text}`;
  else if (finalInput.style === 'serene') finalPrompt = `[Indian English accent] [serene] [slow] ${finalInput.text}`;

  let retries = 0;
  const maxRetries = 4;
  
  while (retries < maxRetries) {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        prompt: finalPrompt,
      });

      if (!media) throw new Error('TTS_EMPTY_RESPONSE');

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavData = await toWav(audioBuffer);

      return {
        media: `data:audio/wav;base64,${wavData}`,
      };
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || "";
      const isRateLimit = msg.includes('429') || msg.includes('quota') || error.status === 429;

      if (isRateLimit && retries < maxRetries - 1) {
        retries++;
        const delay = Math.pow(2, retries) * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('TTS_SERVICE_BUSY');
}

export async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  const wav = (await import('wav')).default;
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
