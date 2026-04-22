'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech using Gemini TTS.
 * 
 * - Charon: Mapped to Algenib (Informative/Analytical)
 * - Vindemiatrix: Mapped to Pherkad (Gentle/Serene)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const TTSInputSchema = z.object({
  text: z.string(),
  voice: z.enum(['Charon', 'Vindemiatrix']).default('Charon'),
  style: z.enum(['professional', 'analytical', 'serene']).optional(),
});
export type TTSInput = z.infer<typeof TTSInputSchema>;

const TTSOutputSchema = z.object({
  media: z.string().describe('Data URI of the generated audio in WAV format.'),
});

export async function textToSpeech(input: string | TTSInput): Promise<{ media: string }> {
  if (typeof input === 'string') {
    return ttsFlow({ text: input, voice: 'Charon' });
  }
  return ttsFlow(input);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (input) => {
    // Mapping personas to Gemini voices
    const voiceName = input.voice === 'Vindemiatrix' ? 'Pherkad' : 'Algenib';
    
    // Constructing the stylized prompt based on the requested persona
    let finalPrompt = input.text;
    if (input.style === 'professional') finalPrompt = `[professional] ${input.text}`;
    if (input.style === 'analytical') finalPrompt = `[analytical] ${input.text}`;
    if (input.style === 'serene') finalPrompt = `[serene] [slow] ${input.text}`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
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

    if (!media) {
      throw new Error('GEMINI_TTS_FAILED');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    // Convert PCM to WAV for browser compatibility
    const wavData = await toWav(audioBuffer);

    return {
      media: `data:audio/wav;base64,${wavData}`,
    };
  }
);

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
