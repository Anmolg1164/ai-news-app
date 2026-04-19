'use server';
/**
 * @fileOverview A Genkit flow for fetching journey-specific intelligence using real APIs.
 * 
 * - getJourneyIntelligence - Fetches live news, weather, and currency data using Genkit tools.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input/Output Schemas
const JourneyIntelligenceInputSchema = z.object({
  category: z.string().describe('The navigation category (e.g., Explore, Destinations, Wisdom).'),
});
export type JourneyIntelligenceInput = z.infer<typeof JourneyIntelligenceInputSchema>;

const JourneyIntelligenceOutputSchema = z.object({
  summary: z.string().describe('A 2-sentence summary of latest news for this category.'),
  country: z.string().nullable().describe('The primary country identified in the news.'),
  weather: z.string().nullable().describe('Current weather conditions in that country.'),
  currency: z.string().nullable().describe('Local currency and approximate exchange rate to USD.'),
  travelAlert: z.string().nullable().describe('A brief travel advisory if applicable.'),
});
export type JourneyIntelligenceOutput = z.infer<typeof JourneyIntelligenceOutputSchema>;

/**
 * Tool to fetch latest news using NewsData.io
 */
const searchNews = ai.defineTool(
  {
    name: 'searchNews',
    description: 'Search for latest news articles based on a query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return "News API key missing.";
    
    try {
      const response = await fetch(
        `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`
      );
      const data = await response.json();
      const results = (data.results || [])
        .slice(0, 3)
        .map((r: any) => `- ${r.title}: ${r.description}`)
        .join('\n');
      return results || "No news found for this query.";
    } catch (e) {
      return "Error fetching news.";
    }
  }
);

/**
 * Tool to fetch current weather using OpenWeatherMap
 */
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

/**
 * Tool to fetch exchange rates using ExchangeRate-API
 */
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
  Current Category: "{{category}}"
  
  Instructions:
  1. Use "searchNews" to find real, latest updates related to "{{category}}".
  2. Identify the primary focus country from the news results.
  3. If a country is identified:
     - Determine its capital or major city and use "getWeather" to fetch real-time conditions.
     - Identify the official currency code (ISO 4217, e.g., INR for India) and use "getExchangeRate" to get the latest USD conversion.
  4. Write a concise 2-sentence summary of the fetched news.
  5. Check for any specific travel warnings or alerts in the news and include them in travelAlert.
  
  If no specific country is identified, set country, weather, and currency to null.`,
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