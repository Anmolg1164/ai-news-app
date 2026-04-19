'use server';
/**
 * @fileOverview A Genkit flow for translating news articles into regional languages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateNewsInputSchema = z.object({
  title: z.string().describe('The news headline to translate.'),
  content: z.string().describe('The news summary to translate.'),
  targetLanguage: z.string().describe('The target language (e.g., Hindi, Odia, Bhojpuri).'),
});
export type TranslateNewsInput = z.infer<typeof TranslateNewsInputSchema>;

const TranslateNewsOutputSchema = z.object({
  translatedTitle: z.string().describe('The translated headline.'),
  translatedContent: z.string().describe('The translated summary.'),
});
export type TranslateNewsOutput = z.infer<typeof TranslateNewsOutputSchema>;

export async function translateNews(input: TranslateNewsInput): Promise<TranslateNewsOutput> {
  return translateNewsFlow(input);
}

const translateNewsPrompt = ai.definePrompt({
  name: 'translateNewsPrompt',
  input: { schema: TranslateNewsInputSchema },
  output: { schema: TranslateNewsOutputSchema },
  prompt: `You are a professional multilingual news translator. 
  Translate the following news headline and summary into {{targetLanguage}}. 
  Ensure the translation is natural, accurate, and maintains a journalistic tone.

  Headline: {{title}}
  Summary: {{content}}`,
});

const translateNewsFlow = ai.defineFlow(
  {
    name: 'translateNewsFlow',
    inputSchema: TranslateNewsInputSchema,
    outputSchema: TranslateNewsOutputSchema,
  },
  async (input) => {
    let retries = 0;
    const maxRetries = 2;
    
    while (retries < maxRetries) {
      try {
        const { output } = await translateNewsPrompt(input);
        if (!output) throw new Error('Empty translation response');
        return output;
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('News translation failed after retries.');
  }
);
