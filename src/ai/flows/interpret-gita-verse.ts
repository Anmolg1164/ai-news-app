'use server';
/**
 * @fileOverview A Genkit flow for interpreting Bhagavad Gita verses.
 *
 * - interpretGitaVerse - A function that handles the interpretation of a Gita verse.
 * - InterpretGitaVerseInput - The input type for the interpretGitaVerse function.
 * - InterpretGitaVerseOutput - The return type for the interpretGitaVerse function.
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
  async input => {
    const {output} = await interpretGitaVersePrompt(input);
    return output!;
  }
);
