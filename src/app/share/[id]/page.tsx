"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { MedicalDocument, ShareLink } from "@/types";
import { Loader2, ShieldAlert, FileText, Clock, Eye, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { format } from "date-fns";

type ShareStatus = 'loading' | 'valid' | 'not_found' | 'expired' | 'limit_reached' | 'error';


// --- MOCK DATA ---
// To test different scenarios, you can manually create mock share links.
// This part is complex to fully mock without a mock backend, 
// so we will primarily rely on Firestore for this feature, even in test mode.
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
    }
];


export default function SharePage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<MedicalDocument | null>(null);
  const [status, setStatus] = useState<ShareStatus>('loading');
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  useEffect(() => {
    async function fetchAndValidateShareLink() {
      if (!params.id) {
        setStatus('not_found');
        return;
      }
      if (!db) {
        setStatus('error');
        console.error("Firestore not available");
        return;
      }

      try {
        const shareLinkRef = doc(db, "shareLinks", params.id);
        const shareLinkSnap = await getDoc(shareLinkRef);

        if (!shareLinkSnap.exists()) {
          setStatus('not_found');
          return;
        }

        const linkData = { id: shareLinkSnap.id, ...shareLinkSnap.data() } as ShareLink;
        setShareLink(linkData);

        // --- Validation ---
        // 1. Check time expiry
        if (linkData.expiresAt.toMillis() < Date.now()) {
          setStatus('expired');
          return;
        }
        // 2. Check view limit
        if (linkData.maxViews > 0 && linkData.viewCount >= linkData.maxViews) {
          setStatus('limit_reached');
          return;
        }

        // --- Log Access and Update View Count ---
        // NOTE: In a real app, you'd get IP and User Agent from a server-side function
        // for accuracy and security. This is a client-side approximation.
        await updateDoc(shareLinkRef, {
          viewCount: linkData.viewCount + 1,
          accessLogs: arrayUnion({
            accessedAt: serverTimestamp(),
            ipAddress: 'x.x.x.x', // Placeholder
            userAgent: navigator.userAgent, // Client-side user agent
          }),
        });

        // --- Fetch Document Data ---
        // For test users, we get from mock data. Otherwise from Firestore.
        if (linkData.userId === 'test-user-id') {
             const mockDoc = MOCK_DOCUMENTS.find(d => d.id === linkData.documentId);
             if (mockDoc) {
                setDocument(mockDoc);
                setStatus('valid');
             } else {
                setStatus('not_found');
             }
        } else {
            const docRef = doc(db, "documents", linkData.documentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setDocument({ id: docSnap.id, ...docSnap.data() } as MedicalDocument);
                setStatus('valid');
            } else {
                // The shared document was deleted
                setStatus('not_found');
            }
        }

      } catch (e) {
        console.error("Error fetching share link:", e);
        setStatus('error');
      }
    }
    fetchAndValidateShareLink();
  }, [params.id]);


  const ErrorState = ({ icon, title, message }: { icon: React.ElementType, title: string, message: string }) => {
    const Icon = icon;
    return (
        <div className="text-center text-destructive py-8">
            <Icon className="mx-auto h-12 w-12 mb-4" />
            <p className="font-bold text-lg">{title}</p>
            <p className="text-muted-foreground">{message}</p>
        </div>
    )
  }

  const renderContent = () => {
    switch (status) {
        case 'loading':
            return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        case 'not_found':
            return <ErrorState icon={FileText} title="Not Found" message="This share link is invalid or the document no longer exists." />;
        case 'expired':
            return <ErrorState icon={Clock} title="Link Expired" message="This share link has expired and is no longer active." />;
        case 'limit_reached':
            return <ErrorState icon={Eye} title="Access Limit Reached" message="This document has been viewed the maximum number of times." />;
        case 'error':
            return <ErrorState icon={ShieldAlert} title="Error" message="Could not retrieve the shared document. Please try again later." />;
        case 'valid':
            if (!document || !shareLink) return null; // Should not happen in 'valid' state
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-semibold text-foreground">{document.fileName}</h3>
                        <p className="text-sm text-muted-foreground">Shared on {format(shareLink.createdAt.toDate(), "PPP")}</p>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Summary</h4>
                        <p>{document.summary || "No summary available."}</p>
                        
                        <h4>Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {document.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>

                        {/* In a real app, this would be a secure link to the actual file in Firebase Storage */}
                        <h4>File Content (Mock)</h4>
                        <pre className="bg-background border rounded-md p-4 text-xs whitespace-pre-wrap">
                            {document.fileContent || "No file content to display."}
                        </pre>
                    </div>
                </div>
            );
    }
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Shared Medical Document
              </CardTitle>
              <CardDescription>This document was shared with you securely.</CardDescription>
            </div>
            <Logo className="hidden sm:flex" />
          </div>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
        {shareLink && (
            <CardContent className="text-xs text-muted-foreground border-t pt-4">
                <div className="flex justify-between">
                    <span>Expires: {format(shareLink.expiresAt.toDate(), "PPpp")}</span>
                    <span>Views: {shareLink.viewCount + 1} / {shareLink.maxViews > 0 ? shareLink.maxViews : '∞'}</span>
                </div>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
