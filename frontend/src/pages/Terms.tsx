import React from 'react';
import { LandingHeader } from '../components/navigation/Navigation';

export default function Terms() {
  return (
    <div className="min-h-screen bg-ink text-parchment">
      <LandingHeader />
      <main className="container mx-auto px-6 py-16">
        <h1 className="text-3xl font-display mb-4">Terms of Service</h1>
        <p className="text-parchment/80">Effective date: August 31, 2025</p>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Acceptance</h2>
          <p className="mt-2 text-sm text-parchment/80">By accessing or using CiteAI, you agree to these Terms. If you do not agree, do not use the service.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">User content</h2>
          <p className="mt-2 text-sm text-parchment/80">You retain rights to the content you upload. You grant CiteAI a limited license to process that content to provide the service.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Acceptable use</h2>
          <p className="mt-2 text-sm text-parchment/80">You must not use the service to create harmful, illegal, or infringing content. We reserve the right to suspend accounts that violate our policies.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Disclaimers & liability</h2>
          <p className="mt-2 text-sm text-parchment/80">The service is provided "as is" and we disclaim certain warranties. See full terms for liability limits.</p>
        </section>

        <section className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-parchment/80">Questions about these terms: legal@citeai.example (replace before launch).</p>
        </section>
      </main>
    </div>
  )
}
