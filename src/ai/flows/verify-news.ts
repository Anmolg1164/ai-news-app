'use server';
/**
 * @fileOverview A Genkit flow for verifying news claims using Serper API and Gemini analysis.
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
    description: 'Search for a headline specifically on reputable news domains.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    const SERPER_API_KEY = "eda72dfa7cf331c0e0b4a475a679f32c7c82feed";
    const domains = "site:reuters.com OR site:bbc.com OR site:apnews.com OR site:nytimes.com OR site:aljazeera.com";
    
    try {
      const response = await fetch("https://google.serper.dev/search", {
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
      return JSON.stringify(data.organic || []);
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
  prompt: `You are an AI Fact Checker. 
  Headline: "{{headline}}"
  
  Instructions:
  1. Use "searchReputableNews" to find matching reports from BBC, Reuters, AP, NYT, or Al Jazeera.
  2. Analyze the search results:
     - If all 5 outlets report the same facts, Trust Score is 95-100%.
     - If 2-3 outlets report it, Trust Score is 60-80%.
     - If 0 outlets report it, Trust Score is below 30%.
  3. Extract up to 3 cross-references (Outlet Name and a brief snippet).
  4. Provide a verdict: "Widely Verified", "Moderately Verified", or "Limited Coverage Found".`,
});

const verifyNewsFlow = ai.defineFlow(
  {
    name: 'verifyNewsFlow',
    inputSchema: VerifyNewsInputSchema,
    outputSchema: VerifyNewsOutputSchema,
  },
  async (input) => {
    const { output } = await verifyNewsPrompt(input);
    return output!;
  }
);
