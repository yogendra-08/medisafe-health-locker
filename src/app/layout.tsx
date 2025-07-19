import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { ConfigProvider } from '@/context/config-context';
import React, { useState } from 'react';

export const metadata: Metadata = {
  title: 'MediSafe - Your Personal Health Record Locker',
  description: 'Securely upload, manage, and share your medical documents online.',
  manifest: '/manifest.webmanifest',
};

function LayoutWithDarkMode({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <html lang="en" suppressHydrationWarning className={dark ? 'dark' : ''}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <button
          aria-label="Toggle dark mode"
          style={{position: 'fixed', top: 16, right: 16, zIndex: 1000}}
          onClick={() => setDark(d => !d)}
        >
          {dark ? '🌙' : '☀️'}
        </button>
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LayoutWithDarkMode>
        {children}
        <Toaster />
      </LayoutWithDarkMode>
    </AuthProvider>
  );
}
