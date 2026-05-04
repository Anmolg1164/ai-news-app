'use server';
/**
 * @fileOverview A Genkit flow for fetching journey-specific intelligence using real APIs.
 * 
 * - fetchNews: A Server Action to fetch news using the newsData tool logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Tool to fetch latest news using NewsData.io
export const searchNews = ai.defineTool(
  {
    name: 'searchNews',
    description: 'Search for latest news articles based on a query. Supports pagination via page parameter.',
    inputSchema: z.object({ 
      query: z.string(),
      page: z.string().optional().describe('The nextPage token from a previous response.')
    }),
    outputSchema: z.string(),
  },
  async ({ query, page }) => {
    const apiKey = process.env.NEWS_API_KEY || "pub_7015099c158564175376044710f6396e9842c"; // Fallback key if env missing
    
    try {
      let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
      if (page) {
        url += `&page=${page}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "error") {
        return JSON.stringify({ error: data.results?.message || "API_LIMIT_REACHED", results: [] });
      }

      const results = (data.results || []).map((r: any) => ({
        title: r.title,
        description: r.description || r.content || "No description available.",
        link: r.link,
        pubDate: r.pubDate,
        source_id: r.source_id
      }));

      return JSON.stringify({
        results,
        nextPage: data.nextPage || null
      });
    } catch (e) {
      return JSON.stringify({ error: "FETCH_ERROR", results: [] });
    }
  }
);

// Define a Flow specifically for fetching news to be used as a Server Action
const fetchNewsFlow = ai.defineFlow(
  {
    name: 'fetchNewsFlow',
    inputSchema: z.object({ 
      query: z.string(),
      page: z.string().optional()
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return await searchNews(input);
  }
);

export async function fetchNews(input: { query: string, page?: string }): Promise<string> {
  return fetchNewsFlow(input);
}
