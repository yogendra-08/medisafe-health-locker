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
      // Check file type and size
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      const validPdfType = 'application/pdf';
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      
      if (!validImageTypes.includes(file.type) && file.type !== validPdfType) {
        toast({ 
          title: "Invalid File Type", 
          description: "Please upload an image (JPEG, PNG, GIF, BMP, WebP) or PDF file.", 
          variant: "destructive" 
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({ 
          title: "File Too Large", 
          description: "Please upload a file smaller than 10MB.", 
          variant: "destructive" 
        });
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
      let text = "";
      
      // Handle different file types
      if (fileToProcess.type === 'application/pdf') {
        // For PDF files, we'll need to convert to image first or use a different approach
        // For now, let's try direct OCR which Tesseract can handle for some PDFs
        try {
          const { data: { text: pdfText } } = await Tesseract.recognize(
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
          text = pdfText;
        } catch (pdfError) {
          console.warn("Direct PDF OCR failed, trying as image:", pdfError);
          // If direct PDF OCR fails, we could implement PDF-to-image conversion here
          throw new Error("PDF processing not fully supported yet. Please convert to image format.");
        }
      } else {
        // Handle image files
        const { data: { text: imageText } } = await Tesseract.recognize(
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
        text = imageText;
      }
      
      setExtractedText(text);
      setOcrProgress(100);

      if (!text || text.trim().length < 10) {
        toast({ 
          title: "OCR Warning", 
          description: "Very little text was extracted. The document might be blurry, contain no text, or be in an unsupported format.", 
          variant: "destructive" 
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: AI Summary & Tagging + Health Analysis (run in parallel)
      try {
        const [summaryResult, insightsResult] = await Promise.all([
          summarizeAndTagDocument({ documentText: text }),
          analyzeHealthReport({ documentText: text })
        ]);
        
        setSuggestedTags(summaryResult.suggestedTags || []);
        form.setValue("summary", summaryResult.summary || "");
        setHealthInsights(insightsResult.findings || []);
        
        toast({ title: "Analysis Complete", description: "Review the summary, tags, and health insights." });
      } catch (aiError) {
        console.warn("AI analysis failed, but OCR succeeded:", aiError);
        toast({ 
          title: "Partial Success", 
          description: "Text was extracted successfully, but AI analysis failed. You can still save the document.", 
          variant: "default" 
        });
      }

    } catch (error) {
      console.error("Document processing failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not analyze the document.";
      toast({ 
        title: "Processing failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
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

    // Handle mock user for testing
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
      // Get user's auth token for RLS policies
      const token = await user.getIdToken();
      
      // Set auth header for Supabase client
      supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
        expires_in: 3600,
        expires_at: Date.now() + 3600 * 1000,
        token_type: 'bearer',
        user: {
          id: user.uid,
          email: user.email || '',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${user.uid}/${timestamp}_${fileToProcess.name}`;
      
      // 1. Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, fileToProcess, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      // Construct the correct file URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured. Please check your environment variables.");
      }
      
      const fileUrl = uploadData?.path 
        ? `${supabaseUrl}/storage/v1/object/public/uploads/${uploadData.path}`
        : `${supabaseUrl}/storage/v1/object/public/uploads/${fileName}`;

      // 2. Save metadata to Supabase (Postgres) table 'documents'
      const documentData = {
        user_id: user.uid,
        file_name: values.fileName || fileToProcess.name,
        tags: tags || [],
        summary: values.summary || '',
        file_url: fileUrl,
        file_content: extractedText || '',
        uploaded_at: new Date().toISOString(),
      };
      
      console.log('Attempting to insert document:', documentData);
      
      const { data: insertData, error: insertError } = await supabase
        .from('documents')
        .insert([documentData])
        .select();
        
      if (insertError) {
        console.error("Database insert error:", insertError);
        
        // Provide more specific error messages
        if (insertError.code === '42501') {
          throw new Error("Database permission denied. Please check your account permissions.");
        } else if (insertError.message.includes('row-level security')) {
          throw new Error("Access denied. Please ensure you're properly authenticated and have permission to upload documents.");
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }

      console.log('Document saved successfully:', insertData);
      toast({ title: "Success!", description: "Your document has been uploaded and saved." });
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error uploading document:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document. Please try again.";
      toast({ 
        title: "Upload Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
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
