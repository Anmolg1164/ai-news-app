'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech using ElevenLabs API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TTSInputSchema = z.string().describe('The text to convert to speech.');
const TTSOutputSchema = z.object({
  media: z.string().describe('Data URI of the generated audio.'),
});

export async function textToSpeech(text: string): Promise<{ media: string }> {
  return ttsFlow(text);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (text) => {
    const ELEVEN_LABS_API_KEY = "sk_734d6eecd2ff229e590cb3021999594880ac4bbb697ef343";
    const VOICE_ID = "pNInz6obpgnuMvoYeSOf"; // Professional Voice (Brian)

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVEN_LABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Audio = buffer.toString('base64');

      return {
        media: `data:audio/mpeg;base64,${base64Audio}`,
      };
    } catch (error) {
      console.error("ElevenLabs TTS failed:", error);
      throw error;
    }
  }
);
