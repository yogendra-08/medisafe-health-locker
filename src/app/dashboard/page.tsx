// This component is large but is broken down into smaller client components.
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
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
  Trash2,
  Loader2,
  FileText,
  Share2,
  Upload,
  FileClock,
  Tag,
  BarChart,
  User,
  AlertTriangle,
  Bot,
  View,
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
import type { MedicalDocument, HealthProfile } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { ShareDocumentDialog } from "@/components/share-document-dialog";
import { ViewDocumentDialog } from "@/components/view-document-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";


// --- MOCK DATA ---
const MOCK_DOCUMENTS: MedicalDocument[] = [
    {
        id: 'doc1',
        userId: 'test-user-id',
        fileName: 'Annual Blood Test.png',
        tags: ['Blood Test', 'Laboratory Report'],
        uploadedAt: Timestamp.fromDate(new Date('2024-05-15T09:30:00')),
        summary: 'This document is a blood test report for patient Alex Doe, with test date 04/12/2024. It includes...',
        fileContent: 'Patient: Alex Doe.\nTest Date: 2024-04-12\n\nResults:\n- Hemoglobin: 14 g/dL (Normal)\n- Glucose: 90 mg/dL (Normal)\n- Cholesterol: 180 mg/dL (Normal)\n\nDoctor\'s Note: All results are within the normal range. Follow up in one year recommended.'
    },
    {
        id: 'doc2',
        userId: 'test-user-id',
        fileName: 'Glucose Result.png',
        tags: ['Glucose Test', 'Lab Results'],
        uploadedAt: Timestamp.fromDate(new Date('2024-04-22T14:00:00')),
        summary: 'The document contains glucose test results for Alex Doe, performed on April 12, 2024.',
        fileContent: 'Patient: Alex Doe.\nTest: Glucose Tolerance Test.\nResult: 110 mg/dL.\nNotes: Within normal limits.'
    },
    {
        id: 'doc3',
        userId: 'test-user-id',
        fileName: 'Chest_XRay_Report.pdf',
        tags: [],
        uploadedAt: Timestamp.fromDate(new Date('2024-04-05T11:45:00')),
        summary: 'No information provided in the document text to summarize or tag.',
        fileContent: 'No text could be extracted from this document.'
    },
    {
        id: 'doc4',
        userId: 'test-user-id',
        fileName: 'Dental Checkup Invoice.pdf',
        tags: ['Invoice', 'Dentist'],
        uploadedAt: Timestamp.fromDate(new Date('2024-03-18T16:20:00')),
        summary: 'Invoice for routine dental cleaning and checkup.',
        fileContent: 'Invoice\nService: Dental Cleaning & Checkup\nProvider: Smile Bright Dental\nCost: $100.00'
    },
    {
        id: 'doc5',
        userId: 'test-user-id',
        fileName: 'Follow-up Report.pdf',
        tags: ['Lab Report', 'Follow-up'],
        uploadedAt: Timestamp.fromDate(new Date('2024-05-20T10:00:00')),
        summary: 'Follow-up report shows stable results.',
        fileContent: 'Patient: Alex Doe.\nFollow-up from visit on 2024-05-15.\nResults remain stable. Continue current treatment plan.'
    }
];

const MOCK_PROFILE: HealthProfile = {
    userId: 'test-user-id',
    fullName: 'Alex Doe',
    bloodGroup: 'O+',
    allergies: ['Peanuts', 'Pollen', 'Aspirin'],
    emergencyContact: {
        name: 'Jamie Doe',
        phone: '123-456-7890',
    },
    bloodPressure: '120/80',
    diabetes: 'No',
    takesRegularMedication: 'no',
    updatedAt: Timestamp.now(),
};


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

function WelcomeHeader({ user }: { user: any }) {
    const userName = user?.displayName || user?.email || 'User';
    return (
        <div className="relative rounded-xl overflow-hidden shadow-lg border bg-card">
             <Image 
                src="https://placehold.co/1200x300.png"
                alt="Abstract medical background"
                data-ai-hint="medical abstract"
                width={1200}
                height={300}
                className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-10"
            />
            <div className="relative p-6 bg-gradient-to-r from-card via-card/80 to-transparent">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-3xl font-bold">Welcome back, {userName}!</CardTitle>
                    <CardDescription>This is your secure health document dashboard.</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                     <Button asChild>
                        <Link href="/upload"><Upload className="mr-2 h-4 w-4"/> Upload New Document</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ProfileCompletionAlert({ isProfileComplete }: { isProfileComplete: boolean }) {
    if (isProfileComplete) return null;

    return (
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Complete Your Profile!</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
                Your health profile is incomplete. Add your details for emergency access.
                 <Button asChild variant="default" size="sm">
                    <Link href="/profile">
                        <User className="mr-2 h-4 w-4" /> Go to Profile
                    </Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
}

function StatCard({ icon, title, value, description }: { icon: React.ElementType, title: string, value: string, description: string }) {
    const Icon = icon;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function DocumentChart({ documents }: { documents: MedicalDocument[] }) {
    const chartData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: format(d, "MMM yyyy"), uploads: 0 };
        }).reverse();

        documents.forEach(doc => {
            const monthStr = format(doc.uploadedAt.toDate(), "MMM yyyy");
            const monthData = months.find(m => m.month === monthStr);
            if (monthData) {
                monthData.uploads++;
            }
        });
        return months;
    }, [documents]);

    const chartConfig = {
        uploads: {
            label: "Uploads",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader>
                <CardTitle>Document Upload Activity</CardTitle>
                <CardDescription>Uploads in the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-64">
                    <RechartsBarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="uploads" fill="var(--color-uploads)" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

const tagColorClasses = [
    'tag-gradient-1',
    'tag-gradient-2',
    'tag-gradient-3',
    'tag-gradient-4',
];

function DocumentCard({ 
    doc, 
    onDelete, 
    onShare,
    onView,
}: { 
    doc: MedicalDocument, 
    onDelete: (doc: MedicalDocument) => void,
    onShare: (doc: MedicalDocument) => void,
    onView: (doc: MedicalDocument) => void,
}) {
    return (
        <Card className="flex flex-col group transition-all duration-200 hover:border-primary hover:shadow-lg">
             <CardHeader className="pb-4 cursor-pointer" onClick={() => onView(doc)}>
                <CardTitle className="flex items-start gap-2 text-lg">
                    <FileText className="h-5 w-5 mt-1 shrink-0 text-primary" />
                    <span className="flex-1 break-all group-hover:text-primary">{doc.fileName}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 cursor-pointer" onClick={() => onView(doc)}>
                {doc.tags.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag, i) => (
                            <Badge key={i} className={cn("text-white", tagColorClasses[i % tagColorClasses.length])}>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="text-sm text-muted-foreground">
                    Added: {doc.uploadedAt ? format(doc.uploadedAt.toDate(), "PPP") : 'N/A'}
                </p>
                <p className="text-sm text-foreground line-clamp-3">
                    {doc.summary || "No summary available."}
                </p>
            </CardContent>
            <CardFooter className="mt-auto border-t pt-4">
                <div className="flex w-full justify-end items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => onShare(doc)}>
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(doc)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}


// Main Dashboard Page Component
export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [documentToDelete, setDocumentToDelete] = useState<MedicalDocument | null>(null);
  const [documentToShare, setDocumentToShare] = useState<MedicalDocument | null>(null);
  const [documentToView, setDocumentToView] = useState<MedicalDocument | null>(null);

  const isProfileComplete = !!profile?.fullName;

  useEffect(() => {
    if (!user) {
      setIsLoading(false); // No user, not loading. Let AuthProvider handle redirect.
      return;
    }

    // Use mock data if the user's uid matches the test user id from auth context
    if (user.uid === 'test-user-id') {
      setDocuments(MOCK_DOCUMENTS);
      setProfile(MOCK_PROFILE);
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

    // Fetch Profile
    const profileRef = doc(db, "profiles", user.uid);
    const profileUnsubscribe = onSnapshot(profileRef, docSnap => {
        if (docSnap.exists()) {
            setProfile(docSnap.data() as HealthProfile);
        } else {
            setProfile(null);
        }
    }, error => {
        console.error("Error fetching profile: ", error);
        toast({ title: "Error", description: "Could not fetch profile data.", variant: "destructive" });
    });


    // Fetch Documents
    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid)
    );
    const documentsUnsubscribe = onSnapshot(q, (querySnapshot) => {
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

    return () => {
      profileUnsubscribe();
      documentsUnsubscribe();
    };
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
  
  const totalTags = useMemo(() => new Set(documents.flatMap(d => d.tags)).size, [documents]);
  const lastUploadDate = documents.length > 0 ? documents[0].uploadedAt.toDate() : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <WelcomeHeader user={user} />

        <ProfileCompletionAlert isProfileComplete={isProfileComplete} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FileText} title="Total Documents" value={documents.length.toString()} description="All records in your vault" />
            <StatCard icon={Tag} title="Unique Tags" value={totalTags.toString()} description="Categories for documents" />
            <StatCard icon={FileClock} title="Last Upload" value={lastUploadDate ? formatDistanceToNow(lastUploadDate, { addSuffix: true }) : 'N/A'} description="Most recent addition" />
            <StatCard icon={BarChart} title="This Month" value={documents.filter(d => d.uploadedAt.toDate().getMonth() === new Date().getMonth()).length.toString()} description="Uploads this calendar month" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">My Documents</h2>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Documents Found</h3>
                        <p className="text-muted-foreground">Get started by uploading your first medical document.</p>
                        <Button variant="default" asChild className="mt-4"><Link href="/upload">Upload Document</Link></Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {documents.map((doc) => (
                            <DocumentCard 
                                key={doc.id} 
                                doc={doc}
                                onDelete={setDocumentToDelete}
                                onShare={setDocumentToShare}
                                onView={setDocumentToView}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="lg:col-span-1">
                 <DocumentChart documents={documents} />
            </div>
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
      {documentToView && (
        <ViewDocumentDialog
            isOpen={!!documentToView}
            onClose={() => setDocumentToView(null)}
            document={documentToView}
        />
      )}
    </AppLayout>
  );
}
