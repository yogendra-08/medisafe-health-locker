import { app, auth, db, storage, isConfigured as isFirebaseConfigured } from './firebase/config';
import { supabase, isConfigured as isSupabaseConfigured, supabaseConfig } from './supabase/config';

export interface AppConfig {
  firebase: {
    isConfigured: boolean;
    app: any;
    auth: any;
    db: any;
    storage: any;
  };
  supabase: {
    isConfigured: boolean;
    client: any;
    config: any;
  };
  isFullyConfigured: boolean;
}

export const config: AppConfig = {
  firebase: {
    isConfigured: isFirebaseConfigured,
    app,
    auth,
    db,
    storage,
  },
  supabase: {
    isConfigured: isSupabaseConfigured,
    client: supabase,
    config: supabaseConfig,
  },
  isFullyConfigured: isFirebaseConfigured && isSupabaseConfigured,
};

// Configuration validation
export function validateConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Firebase configuration
  if (!isFirebaseConfigured) {
    errors.push('Firebase is not configured. Required for authentication and database.');
  } else {
    if (!auth) warnings.push('Firebase Auth not initialized');
    if (!db) warnings.push('Firebase Firestore not initialized');
    if (!storage) warnings.push('Firebase Storage not initialized (optional - using Supabase for file storage)');
  }

  // Check Supabase configuration
  if (!isSupabaseConfigured) {
    warnings.push('Supabase is not configured. File storage will not work.');
  } else {
    if (!supabase) warnings.push('Supabase client not initialized');
  }

  // Check for conflicting storage configurations
  if (isFirebaseConfigured && isSupabaseConfigured) {
    console.log('✅ Using Firebase for auth/database and Supabase for file storage');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export individual configurations for backward compatibility
export { app, auth, db, storage, isConfigured as isFirebaseConfigured } from './firebase/config';
export { supabase, isConfigured as isSupabaseConfigured, supabaseConfig } from './supabase/config';

// Configuration status
export const configStatus = validateConfiguration(); 