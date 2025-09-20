import React, { useEffect, useState } from 'react';

export default function AdminProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => { fetch('/api/providers').then(r => r.json()).then(d => setProviders(d.providers || [])); }, []);

  const add = async () => {
    await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, label, baseUrl, apiKey }) });
    const r = await fetch('/api/providers'); const d = await r.json(); setProviders(d.providers || []);
  }

  return (
    <div className="min-h-screen bg-ink text-parchment p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl mb-4">Admin — Providers</h1>
        <div className="bg-card p-6 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="id" value={id} onChange={(e) => setId(e.target.value)} className="p-2 rounded-md bg-input" />
            <input placeholder="label" value={label} onChange={(e) => setLabel(e.target.value)} className="p-2 rounded-md bg-input" />
            <input placeholder="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="p-2 rounded-md bg-input col-span-2" />
            <input placeholder="apiKey (optional)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="p-2 rounded-md bg-input col-span-2" />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={add} className="btn-scribe">Add Provider</button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Configured Providers</h2>
          <ul>
            {providers.map(p => (
              <li key={p.id} className="p-3 bg-[rgba(255,255,255,0.02)] rounded-md mb-2">{p.id} — {p.label} — {p.baseUrl}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
