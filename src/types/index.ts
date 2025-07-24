import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface MedicalDocument {
  id: string;
  userId: string;
  fileName: string;
  tags: string[];
  uploadedAt: Timestamp;
  summary?: string;
  // This is mock data for the share page, not stored in Firestore
  fileContent?: string; 
}

export interface HealthProfile {
  userId: string;
  fullName?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  updatedAt: Timestamp;
}

export interface AccessLog {
  accessedAt: Timestamp;
  ipAddress: string; // Note: In a real app, collecting IP may have privacy implications.
  userAgent: string;
}

export interface ShareLink {
  id: string;
  userId: string;
  documentId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  maxViews: number; // 0 for unlimited
  viewCount: number;
  accessLogs: AccessLog[];
}
