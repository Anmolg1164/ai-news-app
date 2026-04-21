
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

      if (!response.ok) {
        if (response.status === 403) return JSON.stringify({ error: "SERPER_AUTH_ERROR" });
        return JSON.stringify({ error: `SERPER_HTTP_${response.status}` });
      }

      const data = await response.json();
      return JSON.stringify(data.news || data.organic || []);
    } catch (e) {
      return JSON.stringify({ error: "SERPER_CONNECTION_FAILED" });
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
        if (!output) throw new Error('GEMINI_EMPTY_RESPONSE');
        return output;
      } catch (error: any) {
        const msg = error.message?.toLowerCase() || "";
        const isRateLimit = msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota');

        if (isRateLimit && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (msg.includes('serper_auth')) throw new Error('SERPER_API_KEY_INVALID');
        throw new Error(isRateLimit ? 'GEMINI_QUOTA_EXCEEDED' : 'VERIFICATION_FAILED');
      }
    }
    throw new Error('GEMINI_QUOTA_EXCEEDED');
  }
);
