'use server';
/**
 * @fileOverview A Genkit flow for verifying news claims using Serper News API and Gemini analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyNewsInputSchema = z.object({
  headline: z.string().describe('The headline to verify.'),
});
export type VerifyNewsInput = z.infer<typeof VerifyNewsInputSchema>;

const VerifyNewsOutputSchema = z.object({
  trustScore: z.number().min(0).max(100).describe('Trust Score (0-100%).'),
  crossReferences: z.array(z.object({
    outlet: z.string(),
    snippet: z.string()
  })).describe('List of major outlets covering the story.'),
  verdict: z.string().describe('A short sentence confirming if the news is Widely Verified or Limited Coverage.'),
});
export type VerifyNewsOutput = z.infer<typeof VerifyNewsOutputSchema>;

const searchReputableNews = ai.defineTool(
  {
    name: 'searchReputableNews',
    description: 'Search for a headline specifically on reputable news domains via Serper News API.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    const SERPER_API_KEY = process.env.SERPER_API_KEY;
    if (!SERPER_API_KEY) return JSON.stringify({ error: "SERPER_KEY_MISSING" });
    
    const domains = "site:reuters.com OR site:bbc.com OR site:apnews.com OR site:nytimes.com OR site:aljazeera.com";
    
    try {
      const response = await fetch("https://google.serper.dev/news", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `${query} ${domains}`,
          num: 5
        }),
      });

      if (!response.ok) return JSON.stringify({ error: `SERPER_ERROR_${response.status}` });

      const data = await response.json();
      return JSON.stringify(data.news || []);
    } catch (e) {
      return JSON.stringify({ error: "SERPER_FAILED" });
    }
  }
);

export async function verifyNews(input: VerifyNewsInput): Promise<VerifyNewsOutput> {
  return verifyNewsFlow(input);
}

const verifyNewsPrompt = ai.definePrompt({
  name: 'verifyNewsPrompt',
  input: { schema: VerifyNewsInputSchema },
  output: { schema: VerifyNewsOutputSchema },
  tools: [searchReputableNews],
  prompt: `You are an AI Fact Checker Agent. 
  Headline: "{{headline}}"
  
  1. Use "searchReputableNews" to find matching reports.
  2. Determine Trust Score (0-100%).
  3. Extract 3 cross-references.
  4. Provide verdict: "Widely Verified", "Moderately Verified", or "Limited Coverage Found".`,
});

const verifyNewsFlow = ai.defineFlow(
  {
    name: 'verifyNewsFlow',
    inputSchema: VerifyNewsInputSchema,
    outputSchema: VerifyNewsOutputSchema,
  },
  async (input) => {
    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        const { output } = await verifyNewsPrompt(input);
        if (!output) throw new Error('GEMINI_EMPTY');
        return output;
      } catch (error: any) {
        const msg = error.message?.toLowerCase() || "";
        if ((msg.includes('429') || msg.includes('quota')) && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('VERIFICATION_TIMEOUT');
  }
);
