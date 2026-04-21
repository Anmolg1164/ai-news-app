'use server';
/**
 * @fileOverview A Genkit flow for summarizing a batch of news articles into bulleted headlines for audio briefing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeNewsBatchInputSchema = z.object({
  articles: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).describe('The top news articles to summarize.'),
});
export type SummarizeNewsBatchInput = z.infer<typeof SummarizeNewsBatchInputSchema>;

const SummarizeNewsBatchOutputSchema = z.object({
  summary: z.string().describe('A bulleted summary suitable for text-to-speech announcement.'),
});
export type SummarizeNewsBatchOutput = z.infer<typeof SummarizeNewsBatchOutputSchema>;

export async function summarizeNewsBatch(input: SummarizeNewsBatchInput): Promise<SummarizeNewsBatchOutput> {
  return summarizeNewsBatchFlow(input);
}

const summarizeNewsBatchPrompt = ai.definePrompt({
  name: 'summarizeNewsBatchPrompt',
  input: { schema: SummarizeNewsBatchInputSchema },
  output: { schema: SummarizeNewsBatchOutputSchema },
  prompt: `You are a professional radio news anchor for G newsMola. 
  Summarize the following {{articles.length}} news articles into a concise "bullet headline" briefing.
  
  Instructions:
  1. Start with: "Greetings. Here is your G newsMola briefing."
  2. For each story, provide a single, snappy 1-sentence headline.
  3. Ensure the flow is natural for text-to-speech.
  4. End with: "That is the latest for now. Stay informed."

  Articles:
  {{#each articles}}
  - Title: {{this.title}}
    Content: {{this.content}}
  {{/each}}`,
});

const summarizeNewsBatchFlow = ai.defineFlow(
  {
    name: 'summarizeNewsBatchFlow',
    inputSchema: SummarizeNewsBatchInputSchema,
    outputSchema: SummarizeNewsBatchOutputSchema,
  },
  async (input) => {
    let retries = 0;
    const maxRetries = 4;
    
    while (retries < maxRetries) {
      try {
        const { output } = await summarizeNewsBatchPrompt(input);
        if (!output) throw new Error('Empty summary response');
        return output;
      } catch (error: any) {
        const isRateLimit = 
          error.message?.includes('429') || 
          error.status === 429 || 
          error.message?.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('AI Briefing service busy. Please try again in a few moments.');
  }
);
