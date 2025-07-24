// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview AI-powered tag suggestion for uploaded medical documents.
 *
 * - suggestDocumentTags - A function that suggests tags for a given medical document.
 * - SuggestDocumentTagsInput - The input type for the suggestDocumentTags function.
 * - SuggestDocumentTagsOutput - The return type for the suggestDocumentTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDocumentTagsInputSchema = z.object({
  documentText: z
    .string()
    .describe('The extracted text content from the medical document.'),
});

export type SuggestDocumentTagsInput = z.infer<typeof SuggestDocumentTagsInputSchema>;

const SuggestDocumentTagsOutputSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .describe('An array of suggested tags for the medical document.'),
});

export type SuggestDocumentTagsOutput = z.infer<typeof SuggestDocumentTagsOutputSchema>;

export async function suggestDocumentTags(input: SuggestDocumentTagsInput): Promise<SuggestDocumentTagsOutput> {
  return suggestDocumentTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDocumentTagsPrompt',
  input: {schema: SuggestDocumentTagsInputSchema},
  output: {schema: SuggestDocumentTagsOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing medical documents and suggesting relevant tags.

  Based on the content of the document, suggest a list of tags that would help the user categorize and find the document later.

  Document Text: {{{documentText}}}
  Tags:`, // Just ask for the tags, the output schema takes care of the formatting.
});

const suggestDocumentTagsFlow = ai.defineFlow(
  {
    name: 'suggestDocumentTagsFlow',
    inputSchema: SuggestDocumentTagsInputSchema,
    outputSchema: SuggestDocumentTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
