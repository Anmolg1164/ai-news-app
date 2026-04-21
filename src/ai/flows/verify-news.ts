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
    const SERPER_API_KEY = "eda72dfa7cf331c0e0b4a475a679f32c7c82feed";
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
      const data = await response.json();
      return JSON.stringify(data.news || data.organic || []);
    } catch (e) {
      return JSON.stringify({ error: "Serper search failed." });
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
  Headline to Verify: "{{headline}}"
  
  Instructions:
  1. Use "searchReputableNews" to find matching reports from BBC, Reuters, AP, NYT, or Al Jazeera.
  2. Analyze the search results thoroughly.
  3. Determine the Trust Score:
     - 90-100%: If multiple reputable outlets report the exact same primary facts.
     - 60-80%: If only 1-2 outlets report it, or if details are slightly inconsistent.
     - <40%: If no reputable outlets report the story.
  4. Extract up to 3 cross-references (Outlet Name and a brief snippet).
  5. Provide a verdict: "Widely Verified", "Moderately Verified", or "Limited Coverage Found".`,
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
        if (!output) throw new Error('Empty verification response');
        return output;
      } catch (error: any) {
        const isRateLimit = 
          error.message?.includes('429') || 
          error.status === 429 || 
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.message?.includes('Quota exceeded');

        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          // Exponential backoff: 3s, 6s, 12s...
          const delay = Math.pow(2, retries) * 1500 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Verification service timed out due to high load. Please try again.');
  }
);
