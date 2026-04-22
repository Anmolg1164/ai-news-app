
'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech using Gemini TTS.
 * 
 * - Charon: Mapped to Algenib (Informative/Analytical)
 * - Vindemiatrix: Mapped to Pherkad (Gentle/Serene)
 * - Explicitly configured with Indian English accent for region-specific clarity.
 * - Includes robust retry logic for 429 (Rate Limit) errors.
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
    
    // Explicit Indian English accent configuration
    let finalPrompt = `[Indian English accent] ${input.text}`;
    
    if (input.style === 'professional') {
      finalPrompt = `[Indian English accent] [professional] ${input.text}`;
    } else if (input.style === 'analytical') {
      finalPrompt = `[Indian English accent] [analytical] ${input.text}`;
    } else if (input.style === 'serene') {
      finalPrompt = `[Indian English accent] [serene] [slow] ${input.text}`;
    }

    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
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
          throw new Error('GEMINI_TTS_EMPTY_RESPONSE');
        }

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
        const isRateLimit = 
          msg.includes('429') || 
          msg.includes('resource_exhausted') || 
          msg.includes('quota') || 
          error.status === 429;

        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          // Exponential backoff
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('GEMINI_TTS_SERVICE_BUSY');
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
