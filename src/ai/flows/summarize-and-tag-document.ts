
'use server';

/**
 * @fileOverview AI flow to summarize and suggest tags for a medical document.
 *
 * - summarizeAndTagDocument - A function that handles the document analysis.
 * - DocumentAnalysisInput - The input type for the function.
 * - DocumentAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentAnalysisInputSchema = z.object({
  documentText: z
    .string()
    .describe('The extracted text content from the medical document.'),
});
export type DocumentAnalysisInput = z.infer<typeof DocumentAnalysisInputSchema>;

const DocumentAnalysisOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key information in the document, such as doctor remarks, results, or diagnosis.'),
  suggestedTags: z
    .array(z.string())
    .describe('An array of suggested tags for the medical document based on its content.'),
});
export type DocumentAnalysisOutput = z.infer<typeof DocumentAnalysisOutputSchema>;

export async function summarizeAndTagDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisOutput> {
  return summarizeAndTagFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAndTagPrompt',
  input: {schema: DocumentAnalysisInputSchema},
  output: {schema: DocumentAnalysisOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing medical documents.
  
  Based on the content of the document text provided, do two things:
  1. Write a concise summary of the key information, such as doctor remarks, test results, or diagnosis.
  2. Suggest a list of relevant tags that would help categorize the document.

  Document Text: {{{documentText}}}
  `,
});

const summarizeAndTagFlow = ai.defineFlow(
  {
    name: 'summarizeAndTagFlow',
    inputSchema: DocumentAnalysisInputSchema,
    outputSchema: DocumentAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
