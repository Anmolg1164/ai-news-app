'use server';
/**
 * @fileOverview A Genkit flow for interpreting Bhagavad Gita verses.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretGitaVerseInputSchema = z.object({
  verse: z.string().describe('The Bhagavad Gita verse to interpret.'),
});
export type InterpretGitaVerseInput = z.infer<typeof InterpretGitaVerseInputSchema>;

const InterpretGitaVerseOutputSchema = z.object({
  interpretation: z.string().describe('A clear and concise interpretation of the verse.'),
  modernRelevance: z
    .string()
    .describe("Explanation of the verse's modern relevance to daily life."),
});
export type InterpretGitaVerseOutput = z.infer<typeof InterpretGitaVerseOutputSchema>;

export async function interpretGitaVerse(
  input: InterpretGitaVerseInput
): Promise<InterpretGitaVerseOutput> {
  return interpretGitaVerseFlow(input);
}

const interpretGitaVersePrompt = ai.definePrompt({
  name: 'interpretGitaVersePrompt',
  input: {schema: InterpretGitaVerseInputSchema},
  output: {schema: InterpretGitaVerseOutputSchema},
  prompt: `You are an expert in spiritual texts, particularly the Bhagavad Gita.
Your task is to provide a clear and concise interpretation of the given Bhagavad Gita verse, explaining its meaning and its modern relevance to daily life.

Verse: {{{verse}}}`,
});

const interpretGitaVerseFlow = ai.defineFlow(
  {
    name: 'interpretGitaVerseFlow',
    inputSchema: InterpretGitaVerseInputSchema,
    outputSchema: InterpretGitaVerseOutputSchema,
  },
  async (input) => {
    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        const { output } = await interpretGitaVersePrompt(input);
        if (!output) throw new Error('Empty response from AI');
        return output;
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');
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
    throw new Error('Maximum retries exceeded for interpretation.');
  }
);
