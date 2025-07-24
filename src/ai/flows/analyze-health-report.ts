
'use server';

/**
 * @fileOverview AI-powered health report analysis to detect and highlight key medical terms.
 *
 * - analyzeHealthReport - A function that analyzes medical document text for significant terms.
 * - HealthAnalysisInput - The input type for the function.
 * - HealthAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthAnalysisInputSchema = z.object({
  documentText: z
    .string()
    .describe('The extracted text content from a medical document.'),
});
export type HealthAnalysisInput = z.infer<typeof HealthAnalysisInputSchema>;


const FindingSchema = z.object({
    term: z.string().describe("The specific medical term or value identified in the text (e.g., 'Hemoglobin: 8 g/dL')."),
    observation: z.string().describe("A neutral, informational observation about the term. IMPORTANT: This should NOT be medical advice. Frame it as a potential point of interest for discussion with a medical professional (e.g., 'This value may be outside the typical reference range.')."),
});

const HealthAnalysisOutputSchema = z.object({
  findings: z
    .array(FindingSchema)
    .describe('An array of key medical terms and observations found in the document.'),
});
export type HealthAnalysisOutput = z.infer<typeof HealthAnalysisOutputSchema>;


export async function analyzeHealthReport(input: HealthAnalysisInput): Promise<HealthAnalysisOutput> {
  return analyzeHealthReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeHealthReportPrompt',
  input: {schema: HealthAnalysisInputSchema},
  output: {schema: HealthAnalysisOutputSchema},
  prompt: `You are an expert AI medical data analyst. Your task is to scan a medical document and identify key medical terms, test results, and values.

  For each significant finding, you must provide the term and a brief, neutral observation.

  **CRITICAL RULE:** You are FORBIDDEN from giving medical advice, diagnoses, or treatment recommendations. Your observations must be purely informational and always encourage consultation with a real doctor.

  Good Observation Example: "This value is outside the typical reference range for an adult male."
  BAD Observation Example: "You have anemia, you should take iron supplements."

  Analyze the following document text and extract the key findings.

  Document Text: {{{documentText}}}
  `,
  config: {
    safetySettings: [
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
        }
    ]
  }
});

const analyzeHealthReportFlow = ai.defineFlow(
  {
    name: 'analyzeHealthReportFlow',
    inputSchema: HealthAnalysisInputSchema,
    outputSchema: HealthAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
