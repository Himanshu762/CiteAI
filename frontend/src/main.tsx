import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './providers/auth-provider'

// Wizard pages (new clean UI)
import StartPage from './pages/wizard/StartPage'
// Later steps load on demand so the landing page stays small
const ResearchPage = lazy(() => import('./pages/wizard/ResearchPage'))
const AnalyzePage = lazy(() => import('./pages/wizard/AnalyzePage'))
const ComposePage = lazy(() => import('./pages/wizard/ComposePage'))
const FinishPage = lazy(() => import('./pages/wizard/FinishPage'))

// Legacy pages (kept for compatibility)
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const Features = lazy(() => import('./pages/Features'))
const UserSettings = lazy(() => import('./pages/UserSettings'))

import './index.css'
import { Buffer } from 'buffer'
import './fonts.css'
import { AuthFlow } from './components/AuthFlow'

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
  <AuthProvider>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <Routes>
        {/* Clean wizard flow */}
        <Route path="/" element={<StartPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/finish" element={<FinishPage />} />

        {/* Legacy routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/generate" element={<Navigate to="/" replace />} />
        <Route path="/library" element={<DashboardPage />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/features" element={<Features />} />

        {/* Auth */}
        <Route path="/sign-in/*" element={<AuthFlow mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthFlow mode="sign-up" />} />
      </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  </AuthProvider>
);