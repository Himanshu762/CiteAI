import { createRoot } from 'react-dom/client'
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import App from './App'
import DashboardPage from './pages/Dashboard'
import LogoDemo from './pages/LogoDemo'
import FeaturesPage from './components/FeaturesPage'
import UserSettings from './pages/UserSettings'
import './index.css'
import 'react-hot-toast'
import { Buffer } from 'buffer'
import './fonts.css'
import { Logo } from './components/ui/components'
// <reference path="./types/react-yjs.d.ts" />

// Browser-only process polyfill with proper typing
declare global {
  interface Window {
    process: Process;
    Buffer: typeof Buffer;
  }
}

window.process = {
  env: {},
  argv: [],
  versions: {
    http_parser: '2.9.3',
    node: '18.0.0',
    v8: '10.2.154.26',
    ares: '1.18.1',
    uv: '1.43.0',
    zlib: '1.2.11',
    modules: '108',
    openssl: '3.0.5'
  },
  platform: 'browser'
} as Process;

window.Buffer = Buffer;

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/generate" element={<App />} />
        <Route path="/library" element={<DashboardPage />} />
        <Route path="/quality" element={<DashboardPage />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/logo-demo" element={<LogoDemo />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route 
          path="/sign-in/*" 
          element={
            <div className="flex min-h-screen flex-col items-center justify-center bg-primary py-12 px-4">
              <div className="mb-8 flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <span className="text-3xl font-bold text-neutral">Cite</span>
                    <span className="text-3xl font-bold text-accent">AI</span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-md rounded-xl bg-primary-800 p-8 shadow-lg">
                <h2 className="mb-2 text-center text-2xl font-bold text-neutral">Sign in</h2>
                <p className="mb-6 text-center text-neutral/80">to continue to CiteAI</p>
                <SignIn 
                  routing="path" 
                  path="/sign-in" 
                  signUpUrl="/sign-up" 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none rounded-none p-0 m-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "text-neutral",
                      formButtonPrimary: "bg-accent hover:bg-accent-600 text-primary font-semibold",
                      footerActionLink: "text-accent hover:text-accent-600",
                      formFieldLabel: "text-neutral",
                      formFieldInput: "bg-primary-700 border-secondary text-neutral",
                      socialButtonsBlockButton: "border-secondary text-neutral hover:bg-primary-700",
                      socialButtonsProviderIcon: "w-6 h-6",
                      formFieldAction: "text-accent hover:text-accent-600",
                      footerActionText: "text-neutral/70",
                      dividerText: "text-neutral/60",
                      dividerLine: "bg-secondary/30"
                    }
                  }}
                />
              </div>
            </div>
          } 
        />
        <Route 
          path="/sign-up/*" 
          element={
            <div className="flex min-h-screen flex-col items-center justify-center bg-primary py-12 px-4">
              <div className="mb-8 flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <span className="text-3xl font-bold text-neutral">Cite</span>
                    <span className="text-3xl font-bold text-accent">AI</span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-md rounded-xl bg-primary-800 p-8 shadow-lg">
                <h2 className="mb-2 text-center text-2xl font-bold text-neutral">Sign up</h2>
                <p className="mb-6 text-center text-neutral/80">create a CiteAI account</p>
                <SignUp
                  routing="path" 
                  path="/sign-up" 
                  signInUrl="/sign-in"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none rounded-none p-0 m-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formButtonPrimary: "bg-accent hover:bg-accent-600 text-primary font-semibold",
                      footerActionLink: "text-accent hover:text-accent-600",
                      formFieldLabel: "text-neutral",
                      formFieldInput: "bg-primary-700 border-secondary text-neutral",
                      socialButtonsBlockButton: "border-secondary text-neutral hover:bg-primary-700",
                      socialButtonsProviderIcon: "w-6 h-6",
                      formFieldAction: "text-accent hover:text-accent-600",
                      footerActionText: "text-neutral/70",
                      dividerText: "text-neutral/60",
                      dividerLine: "bg-secondary/30"
                    }
                  }}
                />
              </div>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  </ClerkProvider>
);