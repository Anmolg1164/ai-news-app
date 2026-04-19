'use server';
/**
 * @fileOverview A Genkit flow for handling interactive voice questions about news.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { toWav } from './tts-flow';

const VoiceChatInputSchema = z.object({
  userAudioUri: z.string().describe('Base64 data URI of the user voice question.'),
  newsContext: z.string().describe('The context of the news being discussed.'),
});
export type VoiceChatInput = z.infer<typeof VoiceChatInputSchema>;

const VoiceChatOutputSchema = z.object({
  textResponse: z.string().describe('The text response from the AI.'),
  audioResponse: z.string().describe('Data URI of the audio response.'),
});
export type VoiceChatOutput = z.infer<typeof VoiceChatOutputSchema>;

export async function handleVoiceQuery(input: VoiceChatInput): Promise<VoiceChatOutput> {
  return voiceChatFlow(input);
}

const voiceChatFlow = ai.defineFlow(
  {
    name: 'voiceChatFlow',
    inputSchema: VoiceChatInputSchema,
    outputSchema: VoiceChatOutputSchema,
  },
  async (input) => {
    // 1. Transcribe and Generate Answer with specific user prompt
    const response = await ai.generate({
      system: `You are the Dharma Navigator Guide. Use the provided News Context to answer the user's question. 
      The user is asking a question about the news they just heard. Answer briefly.
      Keep answers concise (1-2 sentences). 
      Always end your answer by asking: "Should I continue with the briefing?"`,
      prompt: [
        { text: `News Context: ${input.newsContext}` },
        { media: { url: input.userAudioUri, contentType: 'audio/wav' } }
      ]
    });

    const textResponse = response.text;

    // 2. Convert response to Audio
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textResponse,
    });

    const audioBuffer = Buffer.from(
      media!.url.substring(media!.url.indexOf(',') + 1),
      'base64'
    );

    return {
      textResponse,
      audioResponse: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);
