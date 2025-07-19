'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';
import { auth, isConfigured } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

const MOCK_USER: User = {
    uid: 'test-user-id',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    isAnonymous: false,
    photoURL: '',
    providerData: [],
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({ token: 'mock-token', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({}),
    providerId: 'password',
    phoneNumber: null,
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bypassAuth = false; // Set to true to bypass login for testing

  useEffect(() => {
    if (bypassAuth) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bypassAuth]);

  if (!isConfigured && !bypassAuth) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Firebase Not Configured</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Your Firebase environment variables are not set up. Please add your Firebase configuration to a 
                        <code className="mx-1 rounded-sm bg-muted px-1 py-0.5 font-mono text-sm">.env.local</code> file in your project root to use the application.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
