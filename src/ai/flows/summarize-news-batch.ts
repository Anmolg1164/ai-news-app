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
  prompt: `You are a professional radio news anchor. 
  Summarize the following {{articles.length}} news articles into a concise "bullet headline" briefing.
  
  Instructions:
  1. Start with a warm greeting like "Here is your G newsMola briefing."
  2. For each important story, provide a single, snappy 1-sentence headline.
  3. Use bullet points in text, but ensure the flow is natural for text-to-speech.
  4. End with "That's the latest for now."

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
    const { output } = await summarizeNewsBatchPrompt(input);
    return output!;
  }
);
