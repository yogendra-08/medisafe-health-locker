
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import type { MedicalDocument } from "@/types";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { add } from 'date-fns';
import { Loader2, Copy, Check } from "lucide-react";

interface ShareDocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: MedicalDocument;
}

export function ShareDocumentDialog({ isOpen, onClose, document }: ShareDocumentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expiry, setExpiry] = useState("1_hour"); // e.g., "1_hour", "1_day", "7_days"
  const [maxViews, setMaxViews] = useState("1"); // e.g., "1", "5", "0" (unlimited)
  const [isCreating, setIsCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const handleCreateLink = async () => {
    if (!user || !db) {
        toast({ title: "Error", description: "You must be logged in to share.", variant: "destructive" });
        return;
    }
    setIsCreating(true);
    setGeneratedLink("");

    try {
        const [amount, unit] = expiry.split('_'); // "1_hour" -> ["1", "hour"]
        const expiresAt = add(new Date(), { [unit + 's']: parseInt(amount) });

        const linkData = {
            userId: user.uid,
            documentId: document.id,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
            maxViews: parseInt(maxViews),
            viewCount: 0,
            accessLogs: [],
        };

        const docRef = await addDoc(collection(db, "shareLinks"), linkData);
        
        const fullLink = `${window.location.origin}/share/${docRef.id}`;
        setGeneratedLink(fullLink);
        toast({ title: "Success!", description: "Your secure share link has been created." });

    } catch (error) {
        console.error("Error creating share link:", error);
        toast({ title: "Error", description: "Could not create the share link.", variant: "destructive" });
    } finally {
        setIsCreating(false);
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }

  const handleClose = () => {
    // Reset state when dialog is closed
    setGeneratedLink("");
    setHasCopied(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{document.fileName}"</DialogTitle>
          <DialogDescription>
            Create a secure, time-limited link to share your document. Access will be logged.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="expiry">Link Expires In</Label>
                        <Select value={expiry} onValueChange={setExpiry}>
                            <SelectTrigger id="expiry">
                                <SelectValue placeholder="Set expiry..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1_hour">1 Hour</SelectItem>
                                <SelectItem value="1_day">1 Day</SelectItem>
                                <SelectItem value="7_days">7 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="max-views">Max Views</Label>
                        <Select value={maxViews} onValueChange={setMaxViews}>
                            <SelectTrigger id="max-views">
                                <SelectValue placeholder="Set view limit..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 View</SelectItem>
                                <SelectItem value="5">5 Views</SelectItem>
                                <SelectItem value="10">10 Views</SelectItem>
                                <SelectItem value="0">Unlimited</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateLink} disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Secure Link
                    </Button>
                </DialogFooter>
            </div>
        ) : (
             <div className="space-y-4 py-4">
                <Label htmlFor="share-link">Your Secure Link</Label>
                <div className="flex gap-2">
                    <Input id="share-link" readOnly value={generatedLink} />
                    <Button size="icon" onClick={handleCopyToClipboard}>
                        {hasCopied ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Anyone with this link can view the document until it expires or the view limit is reached.
                </p>
             </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
