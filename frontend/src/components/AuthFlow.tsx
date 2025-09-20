import { SignIn, SignUp } from "@clerk/clerk-react";
import { Feather } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-ink p-4">
    <div className="mb-8 flex items-center space-x-3">
      <Feather className="text-gold-leaf" size={40} />
      <span className="font-serif text-4xl font-bold text-parchment">
        Cite<span className="text-gold-leaf">AI</span>
      </span>
    </div>
    <div className="w-full max-w-md rounded-lg bg-card border-2 border-border p-8 shadow-2xl animate-enter">
      <h2 className="mb-2 text-center text-3xl font-bold font-serif text-parchment">{title}</h2>
      <p className="mb-8 text-center text-muted-ink">{subtitle}</p>
      {children}
    </div>
  </div>
);

export function AuthFlow({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const appearance = {
    elements: {
      rootBox: "w-full",
      card: "shadow-none p-0 m-0 bg-transparent",
      header: "hidden",
      formButtonPrimary: "bg-gold-leaf hover:bg-gold-leaf/90 text-ink font-serif font-bold text-base",
      footerActionLink: "text-gold-leaf hover:text-gold-leaf-light",
      formFieldLabel: "text-secondary font-serif",
      formFieldInput: "bg-input border-border rounded-md text-foreground",
      socialButtonsBlockButton: "border-border text-parchment hover:bg-muted",
      dividerText: "text-muted-ink",
      dividerLine: "bg-border"
    }
  };

  if (mode === 'sign-in') {
    return (
      <AuthLayout title="Welcome Back" subtitle="Sign in to access your scriptorium">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={appearance} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Your Account" subtitle="Join the ranks of scholars">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={appearance} />
    </AuthLayout>
  );
}