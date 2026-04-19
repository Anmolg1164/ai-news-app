'use server';
/**
 * @fileOverview A Genkit flow for fetching journey-specific intelligence.
 * 
 * - getJourneyIntelligence - Fetches news summary, identifies country, and retrieves travel data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

export async function getJourneyIntelligence(
  input: JourneyIntelligenceInput
): Promise<JourneyIntelligenceOutput> {
  return journeyIntelligenceFlow(input);
}

const journeyIntelligencePrompt = ai.definePrompt({
  name: 'journeyIntelligencePrompt',
  input: { schema: JourneyIntelligenceInputSchema },
  output: { schema: JourneyIntelligenceOutputSchema },
  prompt: `You are an Agentic Travel Intelligence officer. 
  For the given category: "{{category}}", perform the following:
  1. Fetch/Simulate the most relevant recent news or cultural updates.
  2. Provide a summary of exactly 2 sentences.
  3. Identify if a specific country is the focus. If so, return the country name.
  4. If a country is identified, provide realistic weather (e.g., "24°C, Sunny") and currency info (e.g., "INR (₹) - 83.5/USD").
  5. Add a brief travel alert if there's anything a traveler should know.
  
  If no specific country is found, set country, weather, and currency to null.`,
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
