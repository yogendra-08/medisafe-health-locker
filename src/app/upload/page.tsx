// @next/no-pre-compile

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
import { Loader2, Sparkles, X, UploadCloud, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { summarizeAndTagDocument } from "@/ai/flows/summarize-and-tag-document";
import { analyzeHealthReport, type HealthAnalysisOutput } from "@/ai/flows/analyze-health-report";
import Tesseract from 'tesseract.js';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';


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
  const [tagInput, setTagInput] = useState("");
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
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
        toast({ title: "Invalid File Type", description: "Please upload an image or PDF file.", variant: "destructive" });
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

  const processDocument = async () => {
    if (!fileToProcess) {
      toast({ title: "No file selected", description: "Please select a document to process.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setOcrProgress(0);
    setHealthInsights([]);

    try {
      // Step 1: OCR with Tesseract.js
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
      setExtractedText(text);
      setOcrProgress(100);

      if (!text) {
        toast({ title: "OCR Failed", description: "Could not extract any text from the document. The image might be blurry or contain no text.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      // Step 2: AI Summary & Tagging + Health Analysis (run in parallel)
      const [summaryResult, insightsResult] = await Promise.all([
        summarizeAndTagDocument({ documentText: text }),
        analyzeHealthReport({ documentText: text })
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

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
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

    if (!fileToProcess) {
      toast({ title: "No file selected", description: "Please select a document to upload.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      // 1. Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`${user.uid}/${Date.now()}_${fileToProcess.name}`, fileToProcess, {
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) {
        throw uploadError;
      }
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${user.uid}/${Date.now()}_${fileToProcess.name}`;

      // 2. Save metadata to Supabase (Postgres) table 'documents'
      const { error: insertError } = await supabase.from('documents').insert([
        {
          user_id: user.uid,
          file_name: values.fileName,
          tags: tags,
          summary: values.summary,
          file_url: fileUrl,
          file_content: extractedText,
          uploaded_at: new Date().toISOString(),
        },
      ]);
      if (insertError) {
        throw insertError;
      }

      toast({ title: "Success!", description: "Your document has been uploaded and saved." });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error uploading document to Supabase:", error);
      toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add a New Document</CardTitle>
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
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted border-border">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                      {fileToProcess ? `Selected: ${fileToProcess.name}` : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, or other image files</p>
                                </div>
                                <Input 
                                  id="dropzone-file" 
                                  type="file" 
                                  className="hidden"
                                  accept="image/*,application/pdf"
                                  disabled={isSaving || isProcessing}
                                  onChange={handleFileChange}
                                />
                            </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" onClick={processDocument} disabled={isProcessing || !fileToProcess || isSaving}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isProcessing ? 'Analyzing Document...' : 'Analyze with AI'}
                </Button>

                {isProcessing && ocrProgress < 100 && (
                  <div className="space-y-2">
                    <Label>Processing...</Label>
                    <Progress value={ocrProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">Extracting text from the document, this may take a moment.</p>
                  </div>
                )}
                
                {form.watch("summary") && (
                   <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI-Generated Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            {...field}
                            disabled={isSaving || isProcessing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              
                {suggestedTags.length > 0 && (
                  <div className="space-y-2">
                      <FormLabel className="text-sm">Suggested Tags (Click to add)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                          {suggestedTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => addTag(tag)}>{tag}</Badge>
                          ))}
                      </div>
                  </div>
                )}

                {healthInsights.length > 0 && (
                  <div className="space-y-4">
                    <FormLabel>AI Health Insights</FormLabel>
                     <Alert variant="destructive">
                        <AlertTitle>Disclaimer</AlertTitle>
                        <AlertDescription>
                            This is not medical advice. These insights are for informational purposes only. Always consult a qualified healthcare professional for any health concerns.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-3">
                        {healthInsights.map((insight, index) => (
                            <Card key={index} className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            <Beaker className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{insight.term}</p>
                                            <p className="text-sm text-muted-foreground">{insight.observation}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                  </div>
                )}


              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Blood Test Results"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>Your Tags</FormLabel>
                <div className="flex items-center gap-2">
                    <Input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                        placeholder="Add a custom tag and press Enter"
                        disabled={isSaving}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag} disabled={isSaving}>Add Tag</Button>
                </div>
                 <div className="flex flex-wrap gap-2 min-h-[2.5rem] bg-background p-2 rounded-md border border-input mt-2">
                    {tags.length > 0 ? tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )) : <span className="text-sm text-muted-foreground px-2">Add tags from suggestions or your own.</span>}
                 </div>
                 <FormDescription>
                    Add relevant tags to categorize your document.
                 </FormDescription>
              </FormItem>

              <Button type="submit" className="w-full" disabled={isSaving || isProcessing}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? `Saving...` : "Save Document"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
