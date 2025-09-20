import React from 'react';
import { LandingHeader } from '../components/navigation/Navigation';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-ink text-parchment">
      <LandingHeader />
      <main className="container mx-auto px-6 py-16">
        <h1 className="text-3xl font-display mb-4">Privacy Policy</h1>
        <p className="text-parchment/80">Effective date: August 31, 2025</p>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Introduction</h2>
          <p className="mt-2 text-sm text-parchment/80">CiteAI ("we", "our", "us") respects your privacy. This policy explains how we collect, use, and share information when you use our website and services.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Information we collect</h2>
          <ul className="list-disc ml-6 mt-2 text-sm text-parchment/80">
            <li>Account data (email, name) when you register with us.</li>
            <li>Content you provide to generate or edit papers.</li>
            <li>Usage data and diagnostic logs to improve the service.</li>
          </ul>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">How we use information</h2>
          <p className="mt-2 text-sm text-parchment/80">We use information to provide and maintain the service, respond to support requests, detect abuse, and to improve our models and features. We do not sell personal data.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Third-party services</h2>
          <p className="mt-2 text-sm text-parchment/80">We may use third-party services (for example, model providers, analytics) which have their own privacy policies. We only send data necessary to interact with those services.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Security</h2>
          <p className="mt-2 text-sm text-parchment/80">We employ reasonable technical and organizational measures to protect information. No system is completely secure; please avoid sharing highly sensitive personal data.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-parchment/80">If you have questions about this policy, contact us at privacy@citeai.example (replace with real address before launch).</p>
        </section>
      </main>
    </div>
  )
}
