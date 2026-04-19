
'use server';
/**
 * @fileOverview A Genkit flow for translating Bhagavad Gita verses into a target language.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateVerseInputSchema = z.object({
  verse: z.string().describe('The Sanskrit verse text.'),
  english: z.string().describe('The English translation of the verse.'),
  targetLanguage: z.string().describe('The language to translate the verse and its meaning into (e.g., Hindi, Spanish, French).'),
});
export type TranslateVerseInput = z.infer<typeof TranslateVerseInputSchema>;

const TranslateVerseOutputSchema = z.object({
  translatedVerse: z.string().describe('The translated verse text in the target language.'),
  meaning: z.string().describe('A concise explanation of the meaning in the target language.'),
});
export type TranslateVerseOutput = z.infer<typeof TranslateVerseOutputSchema>;

export async function translateVerse(input: TranslateVerseInput): Promise<TranslateVerseOutput> {
  return translateVerseFlow(input);
}

const translateVersePrompt = ai.definePrompt({
  name: 'translateVersePrompt',
  input: { schema: TranslateVerseInputSchema },
  output: { schema: TranslateVerseOutputSchema },
  prompt: `You are an expert spiritual scholar and linguist.
Translate the following Bhagavad Gita verse and its meaning into {{{targetLanguage}}}.
Keep the translation poetic yet clear.

Sanskrit: {{{verse}}}
Meaning: {{{english}}}
Target Language: {{{targetLanguage}}}`,
});

const translateVerseFlow = ai.defineFlow(
  {
    name: 'translateVerseFlow',
    inputSchema: TranslateVerseInputSchema,
    outputSchema: TranslateVerseOutputSchema,
  },
  async (input) => {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { output } = await translateVersePrompt(input);
        if (!output) throw new Error('Empty response from AI');
        return output;
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          // Exponential backoff: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Maximum retries exceeded for translation.');
  }
);
