
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadFile } from "@/lib/supabase/storage";
import { Loader2, Sparkles, X, UploadCloud, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { summarizeAndTagDocument } from "@/ai/flows/summarize-and-tag-document";
import { analyzeHealthReport, type HealthAnalysisOutput } from "@/ai/flows/analyze-health-report";
import Tesseract from 'tesseract.js';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';


const formSchema = z.object({
  file: z.any().optional(),
  fileName: z.string().min(1, 'File name is required.'),
  summary: z.string().optional(),
});

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [fileToProcess, setFileToProcess] = useState<File | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthAnalysisOutput['findings']>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileName: "",
      summary: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image or PDF
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        toast({ title: "Invalid File Type", description: "Please upload an image file (PNG, JPG, etc.) or PDF file.", variant: "destructive" });
        return;
      }
      setFileToProcess(file);
      form.setValue('fileName', file.name);
      setExtractedText("");
      setSuggestedTags([]);
      form.setValue("summary", "");
      setOcrProgress(0);
      setHealthInsights([]);
    }
  };

  // Drag-and-drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange({ target: { files: [file] } } as any);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processDocument = async () => {
    if (!fileToProcess) {
      toast({ title: "No file selected", description: "Please select a document to process.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setOcrProgress(0);
    setHealthInsights([]);

    try {
      let extractedText = "";

      if (fileToProcess.type === 'application/pdf') {
        // For PDFs, we'll skip OCR for now and just save the file
        // In a production app, you might want to use a PDF text extraction library
        toast({ title: "PDF Upload", description: "PDF uploaded successfully. Text extraction from PDFs is not yet supported.", variant: "default" });
        setExtractedText("PDF document uploaded - text extraction not available");
        setOcrProgress(100);
      } else {
        // Step 1: OCR with Tesseract.js for images
        const { data: { text } } = await Tesseract.recognize(
          fileToProcess,
          'eng',
          { 
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrProgress(m.progress * 100);
              }
            }
          }
        );
        extractedText = text;
        setOcrProgress(100);

        if (!text) {
          toast({ title: "OCR Failed", description: "Could not extract any text from the document. The image might be blurry or contain no text.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
      }

      setExtractedText(extractedText);

      // Step 2: AI Summary & Tagging + Health Analysis (run in parallel)
      const [summaryResult, insightsResult] = await Promise.all([
        summarizeAndTagDocument({ documentText: extractedText }),
        analyzeHealthReport({ documentText: extractedText })
      ]);
      
      setSuggestedTags(summaryResult.suggestedTags);
      form.setValue("summary", summaryResult.summary);
      setHealthInsights(insightsResult.findings);
      
      toast({ title: "Analysis Complete", description: "Review the summary, tags, and health insights." });

    } catch (error) {
      console.error("Document processing failed:", error);
      toast({ title: "Processing failed.", description: "Could not analyze the document.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };


  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Authentication error", description: "Please log in again.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    if (user.uid === 'test-user-id') {
      setTimeout(() => {
        toast({ title: "Success!", description: "Mock document record has been saved." });
        setIsSaving(false);
        router.push("/dashboard");
      }, 500);
      return;
    }

    if (!db) {
      toast({ title: "Database not connected", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      // Upload file to Supabase Storage if file exists
      let fileUrl: string | undefined;
      let filePath: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      if (fileToProcess) {
        const uploadResult = await uploadFile(fileToProcess, user.uid);
        
        if (!uploadResult.success) {
          toast({ title: "File Upload Failed", description: uploadResult.error || "Failed to upload file", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        
        fileUrl = uploadResult.fileUrl;
        filePath = uploadResult.filePath;
        fileSize = fileToProcess.size;
        fileType = fileToProcess.type;
      }

      // Save document metadata to Firestore
      await addDoc(collection(db, "documents"), {
        userId: user.uid,
        fileName: values.fileName,
        tags: tags,
        summary: values.summary,
        fileContent: extractedText, // Save the extracted text for the AI assistant
        fileUrl: fileUrl,
        filePath: filePath,
        fileSize: fileSize,
        fileType: fileType,
        uploadedAt: serverTimestamp(),
      });

      toast({ title: "Success!", description: "Your document record has been saved." });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error writing document to Firestore:", error);
      toast({ title: "Error", description: "Failed to save document details.", variant: "destructive" });
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <motion.div
        className="max-w-2xl mx-auto mt-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glassmorphism-card shadow-xl p-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-primary animate-bounce" />
              Add a New Document
            </CardTitle>
            <CardDescription>
              Upload a document image to automatically extract text, generate a summary, and suggest tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document File</FormLabel>
                      <FormControl>
                        <motion.div
                          className="flex flex-col items-center justify-center w-full border-2 border-dashed border-primary/40 rounded-xl p-8 bg-white/60 dark:bg-zinc-900/60 transition-all cursor-pointer hover:shadow-lg hover:bg-primary/10 mb-4"
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          whileHover={{ scale: 1.02 }}
                        >
                          {fileToProcess ? (
                            <div className="flex flex-col items-center gap-2">
                              {fileToProcess.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(fileToProcess)} alt="Preview" className="w-24 h-24 object-contain rounded-lg shadow" />
                              ) : (
                                <UploadCloud className="w-16 h-16 text-primary" />
                              )}
                              <span className="text-sm mt-2">{fileToProcess.name}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setFileToProcess(null)} className="mt-1 text-xs">Remove</Button>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="w-16 h-16 text-primary mb-2 animate-bounce" />
                              <span className="text-base font-medium text-primary">Click to upload or drag and drop</span>
                              <span className="text-xs text-muted-foreground">PNG, JPG, PDF, or other image files</span>
                              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} ref={field.ref} />
                            </>
                          )}
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full gap-2 font-semibold shadow-md bg-gradient-to-r from-primary to-accent text-white hover:scale-105 transition-transform"
                    onClick={processDocument}
                    disabled={isProcessing || !fileToProcess}
                  >
                    <Sparkles className="w-5 h-5 animate-pulse" /> Analyze with AI
                  </Button>
                </motion.div>
                {isProcessing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <Progress value={ocrProgress} className="h-2 rounded-full" />
                    <div className="text-xs text-muted-foreground mt-2">Analyzing document... ({Math.round(ocrProgress)}%)</div>
                  </motion.div>
                )}
                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Blood Test Results" className="rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label>Your Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AnimatePresence>
                      {suggestedTags.map(tag => (
                        <motion.button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="px-3 py-1 rounded-full bg-accent/80 text-xs font-medium text-primary shadow hover:scale-105 transition-transform"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          + {tag}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AnimatePresence>
                      {tags.map(tag => (
                        <motion.div
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-xs font-medium text-white shadow hover:scale-105 transition-transform"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-xs">✕</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="AI-generated summary will appear here..." className="rounded-lg min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AnimatePresence>
                  {healthInsights.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4">
                      <Alert className="bg-accent/30 border-accent/60">
                        <AlertTitle className="flex items-center gap-2"><Beaker className="w-5 h-5 text-primary" /> Health Insights</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc ml-6 mt-2 space-y-1">
                            {healthInsights.map((insight, i) => (
                              <li key={i}>{insight}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button type="submit" size="lg" className="w-full font-semibold shadow-lg mt-4 bg-gradient-to-r from-primary to-accent text-white hover:scale-105 transition-transform" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Save Document
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
