
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { MedicalDocument } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface ViewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: MedicalDocument;
}

const tagColorClasses = [
    'tag-gradient-1',
    'tag-gradient-2',
    'tag-gradient-3',
    'tag-gradient-4',
];

export function ViewDocumentDialog({ isOpen, onClose, document }: ViewDocumentDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{document.fileName}</DialogTitle>
          <DialogDescription>
            Uploaded on {document.uploadedAt ? format(document.uploadedAt.toDate(), "PPP") : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-6">
                <div className="space-y-2">
                    <h3 className="font-semibold">AI Summary</h3>
                    <p className="text-sm text-muted-foreground">
                        {document.summary || "No summary available."}
                    </p>
                </div>

                <Separator />
                
                <div className="space-y-2">
                    <h3 className="font-semibold">Tags</h3>
                    {document.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {document.tags.map((tag, i) => (
                                <Badge key={i} className={cn("text-white", tagColorClasses[i % tagColorClasses.length])}>
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">No tags available.</p>}
                </div>

                <Separator />

                <div className="space-y-2">
                     <h3 className="font-semibold">Extracted Text</h3>
                     <pre className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap font-sans">
                        {document.fileContent || "No text was extracted from this document."}
                     </pre>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
