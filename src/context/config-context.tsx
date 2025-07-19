"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { config, configStatus, validateConfiguration } from '@/lib/config';
import { logConfigStatus } from '@/lib/config-utils';

interface ConfigContextType {
  isConfigured: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: string[];
  warnings: string[];
  firebaseConfigured: boolean;
  supabaseConfigured: boolean;
  isFileStorageAvailable: boolean;
  isAuthenticationAvailable: boolean;
  isDatabaseAvailable: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [configState, setConfigState] = useState({
    isConfigured: configStatus.isValid,
    hasErrors: configStatus.errors.length > 0,
    hasWarnings: configStatus.warnings.length > 0,
    errors: configStatus.errors,
    warnings: configStatus.warnings,
    firebaseConfigured: config.firebase.isConfigured,
    supabaseConfigured: config.supabase.isConfigured,
    isFileStorageAvailable: config.supabase.isConfigured && !!config.supabase.client,
    isAuthenticationAvailable: config.firebase.isConfigured && !!config.firebase.auth,
    isDatabaseAvailable: config.firebase.isConfigured && !!config.firebase.db,
  });

  useEffect(() => {
    // Log configuration status on mount (only in development)
    if (process.env.NODE_ENV === 'development') {
      logConfigStatus();
    }

    // Validate configuration and update state
    const validation = validateConfiguration();
    setConfigState({
      isConfigured: validation.isValid,
      hasErrors: validation.errors.length > 0,
      hasWarnings: validation.warnings.length > 0,
      errors: validation.errors,
      warnings: validation.warnings,
      firebaseConfigured: config.firebase.isConfigured,
      supabaseConfigured: config.supabase.isConfigured,
      isFileStorageAvailable: config.supabase.isConfigured && !!config.supabase.client,
      isAuthenticationAvailable: config.firebase.isConfigured && !!config.firebase.auth,
      isDatabaseAvailable: config.firebase.isConfigured && !!config.firebase.db,
    });
  }, []);

  return (
    <ConfigContext.Provider value={configState}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
} 