'use server';
/**
 * @fileOverview A Genkit flow for fetching alternative global perspectives on a news topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchNews } from './get-journey-intelligence';

const AlternativePerspectiveInputSchema = z.object({
  category: z.string().describe('The news category.'),
  originalSummary: z.string().describe('The original news summary.'),
  currentRegion: z.string().describe('The region the original news came from.'),
});
export type AlternativePerspectiveInput = z.infer<typeof AlternativePerspectiveInputSchema>;

const AlternativePerspectiveOutputSchema = z.object({
  altSummary: z.string().describe('A 2-sentence summary from a different global perspective.'),
  differenceAnalysis: z.string().describe('Analysis of how this reporting differs from the original.'),
  altRegion: z.string().describe('The geographical region of the alternative sources.'),
  complexTerms: z.array(z.object({
    term: z.string().describe('The complex term found in the altSummary.'),
    explanation: z.string().describe('A 1-sentence ELIF explanation of the term.')
  })).optional().describe('A list of complex terms and their simple explanations.')
});
export type AlternativePerspectiveOutput = z.infer<typeof AlternativePerspectiveOutputSchema>;

export async function getAlternativePerspective(
  input: AlternativePerspectiveInput
): Promise<AlternativePerspectiveOutput> {
  return altPerspectiveFlow(input);
}

const altPerspectivePrompt = ai.definePrompt({
  name: 'altPerspectivePrompt',
  input: { schema: AlternativePerspectiveInputSchema },
  output: { schema: AlternativePerspectiveOutputSchema },
  tools: [searchNews],
  prompt: `You are an Agentic Media Analyst specializing in global perspectives.
  
  Topic Category: "{{category}}"
  Original Summary: "{{originalSummary}}"
  Original Source Region: "{{currentRegion}}"

  Instructions:
  1. Use "searchNews" to find articles about "{{category}}" specifically from a DIFFERENT global region than "{{currentRegion}}".
  2. If the original was Western-centric (e.g., North America/Europe), prioritize finding Asian, African, or Latin American viewpoints.
  3. Summarize this alternative perspective in exactly 2 sentences.
  4. Explicitly analyze how this reporting differs from the original summary (e.g., focus on different economic impacts, social consequences, or cultural tone).
  5. Identify the region of these alternative sources (altRegion).
  6. Identify up to 2 complex terms used in your altSummary and provide a 1-sentence 'Explain Like I'm Five' (ELIF) definition for each.`,
});

const altPerspectiveFlow = ai.defineFlow(
  {
    name: 'altPerspectiveFlow',
    inputSchema: AlternativePerspectiveInputSchema,
    outputSchema: AlternativePerspectiveOutputSchema,
  },
  async (input) => {
    const { output } = await altPerspectivePrompt(input);
    return output!;
  }
);