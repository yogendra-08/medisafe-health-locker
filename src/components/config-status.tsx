"use client";

import React from 'react';
import { config, configStatus } from '@/lib/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export function ConfigStatus() {
  if (configStatus.isValid && configStatus.warnings.length === 0) {
    return null; // Don't show anything if everything is configured correctly
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Configuration Status</h3>
      
      {/* Firebase Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={config.firebase.isConfigured ? "default" : "destructive"}>
            {config.firebase.isConfigured ? "Firebase" : "Firebase (Missing)"}
          </Badge>
          {config.firebase.isConfigured ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        {!config.firebase.isConfigured && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
              Firebase is required for authentication and database. Please set up your Firebase environment variables.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Supabase Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={config.supabase.isConfigured ? "default" : "secondary"}>
            {config.supabase.isConfigured ? "Supabase" : "Supabase (Optional)"}
          </Badge>
          {config.supabase.isConfigured ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Info className="h-4 w-4 text-blue-500" />
          )}
        </div>
        
        {!config.supabase.isConfigured && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Supabase Not Configured</AlertTitle>
            <AlertDescription>
              Supabase is used for file storage. Without it, file uploads will not work. 
              Follow the setup guide in SUPABASE_SETUP.md to configure it.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Warnings */}
      {configStatus.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {configStatus.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Environment Variables Help */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Environment Variables</AlertTitle>
        <AlertDescription>
          Make sure you have the following environment variables set in your <code>.env.local</code> file:
          <div className="mt-2 space-y-1 text-sm">
            <div><strong>Firebase:</strong> NEXT_PUBLIC_FIREBASE_*</div>
            <div><strong>Supabase:</strong> NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            <div><strong>AI:</strong> GEMINI_API_KEY</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook to check if the app is properly configured
export function useConfigStatus() {
  return {
    isConfigured: configStatus.isValid,
    hasErrors: configStatus.errors.length > 0,
    hasWarnings: configStatus.warnings.length > 0,
    errors: configStatus.errors,
    warnings: configStatus.warnings,
    firebaseConfigured: config.firebase.isConfigured,
    supabaseConfigured: config.supabase.isConfigured,
  };
} 