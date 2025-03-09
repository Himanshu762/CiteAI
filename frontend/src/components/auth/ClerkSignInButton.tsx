import React from 'react';
import { SignInButton } from "@clerk/clerk-react";

interface ClerkSignInButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
}

export const ClerkSignInButton = ({ 
  children,
  mode = "modal" 
}: ClerkSignInButtonProps) => (
  <SignInButton mode={mode}>
    {children}
  </SignInButton>
); 