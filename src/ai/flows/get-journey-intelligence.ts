'use server';
/**
 * @fileOverview A stable server action for fetching news intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Stable News Fetcher with hardcoded fallback key
export async function fetchNews(input: { query: string, page?: string }): Promise<string> {
  const { query, page } = input;
  const apiKey = "pub_7015099c158564175376044710f6396e9842c";
  
  try {
    let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
    if (page) {
      url += `&page=${page}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "error") {
      return JSON.stringify({ 
        error: data.results?.message || "API_KEY_ERROR_OR_LIMIT", 
        results: [] 
      });
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
    return JSON.stringify({ error: "FETCH_NETWORK_ERROR", results: [] });
  }
}

// Keep the tool definition for AI agents to use internally if needed
export const searchNews = ai.defineTool(
  {
    name: 'searchNews',
    description: 'Search for latest news articles based on a query.',
    inputSchema: z.object({ query: z.string(), page: z.string().optional() }),
    outputSchema: z.string(),
  },
  async (input) => fetchNews(input)
);
