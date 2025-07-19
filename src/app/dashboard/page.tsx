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
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
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

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">Tags</TableHead>
                <TableHead className="hidden md:table-cell">Added At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    No documents found.
                    <Button variant="link" asChild><Link href="/upload">Add one now</Link></Button>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.uploadedAt ? format(doc.uploadedAt.toDate(), "PPpp") : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDocumentToShare(doc)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDocumentToDelete(doc)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DeleteConfirmationDialog 
        isOpen={!!documentToDelete} 
        onClose={() => setDocumentToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      {documentToShare && (
        <ShareDocumentDialog 
            isOpen={!!documentToShare}
            onClose={() => setDocumentToShare(null)}
            document={documentToShare}
        />
      )}
    </AppLayout>
  );
}
