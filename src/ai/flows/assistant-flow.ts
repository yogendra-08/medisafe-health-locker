
// src/ai/flows/assistant-flow.ts
'use server';
/**
 * @fileOverview An AI assistant that can answer questions about a user's medical documents.
 * 
 * - askAssistant - A streaming flow that uses tools to answer questions.
 * - AssistantInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Timestamp } from 'firebase/firestore';

// Mock document data - in a real app, this would come from a database.
const MOCK_DOCUMENTS = [
    {
        id: 'doc1',
        userId: 'test-user-id',
        fileName: 'Annual Blood Test Results.pdf',
        tags: ['Lab Report', 'Annual Checkup', 'blood test'],
        uploadedAt: Timestamp.fromDate(new Date('2023-10-15T09:30:00')),
        summary: 'All results are within the normal range. Follow up in one year.',
        fileContent: 'Patient: Alex Doe. Results: Hemoglobin 14 g/dL, Glucose 90 mg/dL. All clear.'
    },
    {
        id: 'doc2',
        userId: 'test-user-id',
        fileName: 'Dermatologist Prescription.jpg',
        tags: ['Prescription', "Dermatology"],
        uploadedAt: Timestamp.fromDate(new Date('2023-09-22T14:00:00')),
        summary: 'Prescription for topical cream for minor skin rash.',
        fileContent: 'Mock file content for prescription. Medication: Hydrocortisone Cream.'
    },
    {
        id: 'doc3',
        userId: 'test-user-id',
        fileName: 'MRI Scan - Left Knee.dicom',
        tags: ['Scan', 'Orthopedics', 'MRI'],
        uploadedAt: Timestamp.fromDate(new Date('2023-08-05T11:45:00')),
        summary: 'MRI shows minor cartilage wear. Recommendation for physical therapy.',
        fileContent: 'Mock file content for MRI scan. Findings: Minor cartilage wear in left knee.'
    },
];


const searchDocumentsTool = ai.defineTool(
    {
        name: 'searchUserDocuments',
        description: "Search the user's medical documents to answer a question. Use keywords from the user's query to find relevant documents.",
        inputSchema: z.object({
            query: z.string().describe("The search query, e.g., 'blood test', 'MRI', 'latest prescription'"),
            userId: z.string().describe("The ID of the user whose documents are being searched."),
        }),
        outputSchema: z.array(z.object({
            fileName: z.string(),
            summary: z.string(),
            fileContent: z.string().optional(),
        })),
    },
    async (input) => {
        console.log(`Tool called for user ${input.userId} with query: ${input.query}`);
        const query = input.query.toLowerCase();
        // Simple mock search: filter documents by user and then file name, tags, or summary
        return MOCK_DOCUMENTS.filter(doc => 
            doc.userId === input.userId && (
                doc.fileName.toLowerCase().includes(query) ||
                doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
                doc.summary.toLowerCase().includes(query)
            )
        ).map(({ fileName, summary, fileContent }) => ({ fileName, summary, fileContent }));
    }
);


const AssistantInputSchema = z.object({
  query: z.string(),
  userId: z.string(),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


const assistantPrompt = ai.definePrompt({
    name: 'assistantPrompt',
    tools: [searchDocumentsTool],
    system: `You are a helpful AI assistant for the MediSafe app.
Your role is to answer questions based on the user's uploaded medical documents.
You MUST use the searchUserDocuments tool to find relevant documents before answering. Pass the user's ID to the tool.
If you can't find any relevant documents, inform the user.
Keep your answers concise and directly related to the information in the documents.
Do not provide medical advice.
`,
    input: {
        schema: z.object({
            query: z.string(),
            userId: z.string(),
        })
    }
});

export async function askAssistant(input: AssistantInput) {
  const { stream } = ai.generateStream({
      model: 'googleai/gemini-2.0-flash',
      prompt: {
          prompt: assistantPrompt,
          input: { query: input.query, userId: input.userId }
      },
      history: [],
  });

  // Stream the text output
  const outputStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
            if (chunk.text) {
                controller.enqueue(chunk.text);
            }
        }
      } catch (e) {
        console.error("Streaming error:", e);
        controller.error(e);
      }
      controller.close();
    },
  });

  return outputStream;
}
