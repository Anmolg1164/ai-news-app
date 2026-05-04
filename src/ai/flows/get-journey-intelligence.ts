'use server';
/**
 * @fileOverview A Genkit flow for fetching journey-specific intelligence using real APIs.
 * 
 * - fetchNews: A Server Action to fetch news using the newsData tool logic.
 * - getJourneyIntelligence: A flow for aggregate intelligence (weather, news, currency).
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
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return JSON.stringify({ error: "NEWS_API_KEY_MISSING" });
    
    try {
      let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
      if (page) {
        url += `&page=${page}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
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
      return JSON.stringify({ error: "FETCH_ERROR" });
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
    return searchNews(input);
  }
);

export async function fetchNews(input: { query: string, page?: string }): Promise<string> {
  return fetchNewsFlow(input);
}

// Other Intelligence Tools
const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Get current weather for a specific city or country focus.',
    inputSchema: z.object({ location: z.string() }),
    outputSchema: z.string(),
  },
  async ({ location }) => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) return "Weather API key missing.";

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      if (data.cod !== 200) return "Weather data unavailable.";
      return `${Math.round(data.main.temp)}°C, ${data.weather[0].description}`;
    } catch (e) {
      return "Error fetching weather.";
    }
  }
);

const getExchangeRate = ai.defineTool(
  {
    name: 'getExchangeRate',
    description: 'Get the exchange rate from USD to a target currency code (e.g. INR, EUR, GBP).',
    inputSchema: z.object({ targetCurrencyCode: z.string() }),
    outputSchema: z.string(),
  },
  async ({ targetCurrencyCode }) => {
    const apiKey = process.env.CURRENCY_API_KEY;
    if (!apiKey) return "Currency API key missing.";

    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/${targetCurrencyCode}`
      );
      const data = await response.json();
      if (data.result !== 'success') return "Rate unavailable.";
      return `1 USD = ${data.conversion_rate} ${targetCurrencyCode}`;
    } catch (e) {
      return "Error fetching exchange rate.";
    }
  }
);

// Aggregate Intelligence Flow
const JourneyIntelligenceInputSchema = z.object({
  category: z.string(),
});
export type JourneyIntelligenceInput = z.infer<typeof JourneyIntelligenceInputSchema>;

const JourneyIntelligenceOutputSchema = z.object({
  summary: z.string(),
  country: z.string().nullable(),
  weather: z.string().nullable(),
  currency: z.string().nullable(),
  travelAlert: z.string().nullable(),
  sourceRegion: z.string(),
  complexTerms: z.array(z.object({
    term: z.string(),
    explanation: z.string()
  })).optional()
});
export type JourneyIntelligenceOutput = z.infer<typeof JourneyIntelligenceOutputSchema>;

export async function getJourneyIntelligence(
  input: JourneyIntelligenceInput
): Promise<JourneyIntelligenceOutput> {
  return journeyIntelligenceFlow(input);
}

const journeyIntelligencePrompt = ai.definePrompt({
  name: 'journeyIntelligencePrompt',
  input: { schema: JourneyIntelligenceInputSchema },
  output: { schema: JourneyIntelligenceOutputSchema },
  tools: [searchNews, getWeather, getExchangeRate],
  prompt: `You are an Agentic Travel Intelligence officer.
  Category: "{{category}}"
  
  1. Use "searchNews" for latest updates.
  2. Identify primary focus country.
  3. Fetch weather and exchange rates if country found.
  4. Summarize findings in 2 sentences.`,
});

const journeyIntelligenceFlow = ai.defineFlow(
  {
    name: 'journeyIntelligenceFlow',
    inputSchema: JourneyIntelligenceInputSchema,
    outputSchema: JourneyIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await journeyIntelligencePrompt(input);
    return output!;
  }
);
