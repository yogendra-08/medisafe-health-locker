import { config, configStatus } from './config';

/**
 * Check if the app is fully configured and ready to run
 */
export function isAppReady(): boolean {
  return configStatus.isValid;
}

/**
 * Check if Firebase is configured (required for auth and database)
 */
export function isFirebaseReady(): boolean {
  return config.firebase.isConfigured && !!config.firebase.auth && !!config.firebase.db;
}

/**
 * Check if Supabase is configured (required for file storage)
 */
export function isSupabaseReady(): boolean {
  return config.supabase.isConfigured && !!config.supabase.client;
}

/**
 * Get configuration status for debugging
 */
export function getConfigStatus() {
  return {
    ...configStatus,
    firebase: {
      isConfigured: config.firebase.isConfigured,
      auth: !!config.firebase.auth,
      db: !!config.firebase.db,
      storage: !!config.firebase.storage,
    },
    supabase: {
      isConfigured: config.supabase.isConfigured,
      client: !!config.supabase.client,
    },
  };
}

/**
 * Validate environment variables and return missing ones
 */
export function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  
  // Firebase required variables
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  firebaseVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Supabase variables (optional but recommended)
  const supabaseVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  supabaseVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // AI variables
  if (!process.env.GEMINI_API_KEY) {
    missing.push('GEMINI_API_KEY');
  }
  
  return missing;
}

/**
 * Get a human-readable configuration summary
 */
export function getConfigSummary(): string {
  const status = getConfigStatus();
  
  let summary = 'Configuration Status:\n';
  summary += `✅ Firebase: ${status.firebase.isConfigured ? 'Configured' : 'Missing'}\n`;
  summary += `✅ Supabase: ${status.supabase.isConfigured ? 'Configured' : 'Missing'}\n`;
  summary += `✅ App Ready: ${status.isValid ? 'Yes' : 'No'}\n`;
  
  if (status.errors.length > 0) {
    summary += '\n❌ Errors:\n';
    status.errors.forEach(error => {
      summary += `  - ${error}\n`;
    });
  }
  
  if (status.warnings.length > 0) {
    summary += '\n⚠️ Warnings:\n';
    status.warnings.forEach(warning => {
      summary += `  - ${warning}\n`;
    });
  }
  
  return summary;
}

/**
 * Log configuration status to console (for debugging)
 */
export function logConfigStatus(): void {
  console.log(getConfigSummary());
  
  if (configStatus.errors.length > 0) {
    console.error('Configuration errors detected. Please fix them before running the app.');
  }
  
  if (configStatus.warnings.length > 0) {
    console.warn('Configuration warnings detected. Some features may not work properly.');
  }
}

/**
 * Check if file storage is available
 */
export function isFileStorageAvailable(): boolean {
  return isSupabaseReady();
}

/**
 * Check if authentication is available
 */
export function isAuthenticationAvailable(): boolean {
  return isFirebaseReady();
}

/**
 * Check if database operations are available
 */
export function isDatabaseAvailable(): boolean {
  return isFirebaseReady();
} 