import React, { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          borderRadius: '12px'
        },
        elements: {
          socialButtons: 'grid grid-cols-2 gap-4 w-full',
          socialButton: 'hover:bg-accent transition-colors'
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}; 