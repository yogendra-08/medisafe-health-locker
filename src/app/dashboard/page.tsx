// This component is large but is broken down into smaller client components.
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Trash2,
  Loader2,
  FileText,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { deleteFile } from "@/lib/supabase/storage";
import type { MedicalDocument } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { ShareDocumentDialog } from "@/components/share-document-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

// --- MOCK DATA ---
const MOCK_DOCUMENTS: MedicalDocument[] = [
    {
        id: 'doc1',
        userId: 'test-user-id',
        fileName: 'Annual Blood Test Results.pdf',
        tags: ['Lab Report', 'Annual Checkup'],
        uploadedAt: Timestamp.fromDate(new Date('2023-10-15T09:30:00')),
        summary: 'All results are within the normal range. Follow up in one year.',
        fileContent: 'Mock file content for blood test. Patient: Alex Doe. Results: All clear.'
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
        tags: ['Scan', 'Orthopedics'],
        uploadedAt: Timestamp.fromDate(new Date('2023-08-05T11:45:00')),
        summary: 'MRI shows minor cartilage wear. Recommendation for physical therapy.',
        fileContent: 'Mock file content for MRI scan. Findings: Minor cartilage wear.'
    },
    {
        id: 'doc4',
        userId: 'test-user-id',
        fileName: 'Dental Checkup Invoice.pdf',
        tags: ['Invoice', 'Dentist'],
        uploadedAt: Timestamp.fromDate(new Date('2023-07-18T16:20:00')),
        summary: 'Invoice for routine dental cleaning and checkup.',
        fileContent: 'Mock file content for dental invoice. Service: Cleaning. Cost: $100.'
    }
];

// Delete Confirmation Dialog Component
function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            document record from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild disabled={isDeleting}>
            <button onClick={onConfirm} disabled={isDeleting} className="flex items-center">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main Dashboard Page Component
export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [documentToDelete, setDocumentToDelete] = useState<MedicalDocument | null>(null);
  const [documentToShare, setDocumentToShare] = useState<MedicalDocument | null>(null);


  useEffect(() => {
    if (!user) {
      setIsLoading(false); // No user, not loading. Let AuthProvider handle redirect.
      return;
    }

    // Use mock data if the user is the test user
    if (user.uid === 'test-user-id') {
      setDocuments(MOCK_DOCUMENTS);
      setIsLoading(false);
      return;
    }
    
    // If not test user, fetch from Firestore
    if (!db) {
        console.log("Firestore not available");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: MedicalDocument[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as MedicalDocument);
      });
      setDocuments(docs.sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis()));
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching documents: ", error);
        toast({ title: "Error", description: "Could not fetch documents.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleDelete = useCallback(async () => {
    if (!documentToDelete) return;

    // Handle mock data deletion
    if (user?.uid === 'test-user-id') {
      setIsDeleting(true);
      setTimeout(() => {
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id));
        toast({ title: "Success", description: "Mock document record deleted." });
        setIsDeleting(false);
        setDocumentToDelete(null);
      }, 500);
      return;
    }
    
    // Handle real data deletion
    if (!db) {
        toast({ title: "Error", description: "Database not connected.", variant: "destructive" });
        return;
    }

    setIsDeleting(true);
    try {
      // Delete file from Supabase Storage if it exists
      if (documentToDelete.filePath) {
        const deleteResult = await deleteFile(documentToDelete.filePath);
        if (!deleteResult.success) {
          console.warn("Failed to delete file from storage:", deleteResult.error);
          // Continue with document deletion even if file deletion fails
        }
      }

      // Delete document record from Firestore
      await deleteDoc(doc(db, "documents", documentToDelete.id));
      toast({
        title: "Success",
        description: "Document record deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document record.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, toast, user]);

  // Quick stats
  const totalDocs = documents.length;
  const lastUploaded = documents.length > 0 ? format(documents[0].uploadedAt.toDate(), 'PPP') : '--';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">My Documents</h1>
          <div className="flex gap-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 shadow card px-6 py-3 rounded-xl flex flex-col items-center min-w-[120px]">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-xl font-semibold text-primary transition-all animate-pulse">{totalDocs}</span>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/80 shadow card px-6 py-3 rounded-xl flex flex-col items-center min-w-[120px]">
              <span className="text-xs text-muted-foreground">Last Uploaded</span>
              <span className="text-base font-medium">{lastUploaded}</span>
            </div>
          </div>
        </div>
        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-primary mb-4 animate-bounce" />
            <p className="text-lg font-medium mb-2">No documents found.</p>
            <Link href="/upload">
              <Button size="lg" className="gap-2 text-base font-semibold shadow-lg">
                <PlusCircle className="w-5 h-5" /> Add Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="bg-white/90 dark:bg-zinc-900/90 card shadow p-5 rounded-xl flex flex-col gap-3 hover:scale-[1.03] hover:shadow-xl transition-transform cursor-pointer border border-border relative group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base truncate flex-1" title={doc.fileName}>{doc.fileName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {doc.tags.map(tag => (
                      <Badge key={tag} className="bg-accent/60 text-xs px-2 py-0.5 rounded-full">{tag}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Added: {format(doc.uploadedAt.toDate(), 'PPP')}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.summary}</div>
                  <div className="flex gap-2 mt-auto">
                    <Button size="sm" variant="outline" onClick={() => setDocumentToShare(doc)}>
                      <Share2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDocumentToDelete(doc)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <DeleteConfirmationDialog
          isOpen={!!documentToDelete}
          onClose={() => setDocumentToDelete(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
        <ShareDocumentDialog
          open={!!documentToShare}
          onOpenChange={() => setDocumentToShare(null)}
          document={documentToShare}
        />
      </div>
    </AppLayout>
  );
}
