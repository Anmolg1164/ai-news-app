'use server';
/**
 * @fileOverview A stable server action for fetching news intelligence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Stable News Fetcher with your new API key
export async function fetchNews(input: { query: string, page?: string }): Promise<string> {
  const { query, page } = input;
  const apiKey = "pub_eef749649c6f4a8aa86cc699e15042aa";
  
  try {
    let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
    if (page) {
      url += `&page=${page}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "error") {
      return JSON.stringify({ 
        error: data.results?.message || "NEWS_API_LIMIT_OR_INVALID_KEY", 
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

// Tool definition for AI agents
export const searchNews = ai.defineTool(
  {
    name: 'searchNews',
    description: 'Search for latest news articles based on a query.',
    inputSchema: z.object({ query: z.string(), page: z.string().optional() }),
    outputSchema: z.string(),
  },
  async (input) => fetchNews(input)
);
