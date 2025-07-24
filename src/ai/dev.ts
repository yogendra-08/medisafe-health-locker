import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-document-tags.ts';
import '@/ai/flows/summarize-and-tag-document.ts';
import '@/ai/flows/analyze-health-report.ts';
