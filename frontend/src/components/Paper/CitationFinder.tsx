import { useState } from 'react';
import { BookOpen, Check, ExternalLink, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ClaimLocation, SourceCandidate, SupportVerdict, findSourcesForClaim, findUncitedClaims, insertCitation, CitablePaper,
} from '../../services/citation-finder';
import { getPaperUrl, Reference } from '../../services/references-api';
import type { PaperSection } from '../../services/paper-generator';

const VERDICT_STYLE: Record<SupportVerdict, { label: string; className: string }> = {
  supports: { label: 'Supports the claim', className: 'bg-emerald-500/15 text-emerald-300' },
  related: { label: 'Related, not direct support', className: 'bg-amber-500/15 text-amber-300' },
  unchecked: { label: 'Not checked', className: 'bg-zinc-700/50 text-zinc-400' },
  unrelated: { label: 'Unrelated', className: 'bg-red-500/10 text-red-300' },
};

interface CitationFinderProps {
  paper: CitablePaper;
  fieldId?: string;
  discipline?: string;
  onUpdate: (sections: PaperSection[], sources: Reference[]) => void;
}

type ClaimState = { status: 'idle' | 'loading' | 'done' | 'cited'; candidates: SourceCandidate[]; citedTitle?: string };

const key = (c: ClaimLocation) => `${c.sectionId}:${c.paragraph}:${c.sentence}`;

export const CitationFinder = ({ paper, fieldId, discipline, onUpdate }: CitationFinderProps) => {
  const [claims, setClaims] = useState<ClaimLocation[] | null>(null);
  const [state, setState] = useState<Record<string, ClaimState>>({});

  const scan = () => {
    setClaims(findUncitedClaims(paper.sections));
    setState({});
  };

  const find = async (claim: ClaimLocation) => {
    setState(s => ({ ...s, [key(claim)]: { status: 'loading', candidates: [] } }));
    try {
      const candidates = await findSourcesForClaim(claim.sentence, { fieldId, discipline });
      setState(s => ({ ...s, [key(claim)]: { status: 'done', candidates } }));
      if (candidates.length === 0) toast('No sources found for this claim');
    } catch (error) {
      setState(s => ({ ...s, [key(claim)]: { status: 'idle', candidates: [] } }));
      toast.error(error instanceof Error ? error.message : 'Search failed');
    }
  };

  const cite = (claim: ClaimLocation, candidate: SourceCandidate) => {
    const { sections, sources } = insertCitation(paper, claim, candidate.reference);
    onUpdate(sections, sources);
    setState(s => ({ ...s, [key(claim)]: { status: 'cited', candidates: [], citedTitle: candidate.reference.title } }));
    toast.success('Citation added');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">Find sources for uncited claims</h3>
          <p className="max-w-xl text-sm text-zinc-400">
            Finds claims without a citation and searches for real papers that back them. Read a source before citing it: the support label is an AI judgment based only on the abstract.
          </p>
        </div>
        <button onClick={scan} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Search className="h-4 w-4" />
          {claims ? 'Scan again' : 'Scan paper'}
        </button>
      </div>

      {claims && claims.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-400">Every claim in the body already has a citation.</p>
      )}

      <div className="space-y-4">
        {claims?.map(claim => {
          const s = state[key(claim)] ?? { status: 'idle', candidates: [] };
          return (
            <div key={key(claim)} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{claim.sectionTitle}</div>
              <p className="text-sm text-zinc-200">{claim.sentence}</p>

              {s.status === 'idle' && (
                <button onClick={() => find(claim)} className="mt-3 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                  <BookOpen className="h-4 w-4" /> Find sources
                </button>
              )}
              {s.status === 'loading' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Searching and reading abstracts...</div>
              )}
              {s.status === 'cited' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><Check className="h-4 w-4" /> Cited: {s.citedTitle}</div>
              )}
              {s.status === 'done' && (
                <div className="mt-3 space-y-3">
                  {s.candidates.map(c => (
                    <div key={c.reference.id} className="rounded-lg border border-zinc-800 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <a href={getPaperUrl(c.reference)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-blue-300">
                            {c.reference.title} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          <div className="text-xs text-zinc-500">
                            {c.reference.authors.slice(0, 3).map(a => a.name).join(', ')}{c.reference.authors.length > 3 ? ' et al.' : ''}
                            {c.reference.year > 0 && ` • ${c.reference.year}`}{c.reference.venue && ` • ${c.reference.venue}`}
                            {c.reference.citationCount ? ` • cited by ${c.reference.citationCount.toLocaleString()}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => cite(claim, c)}
                          disabled={c.verdict === 'unrelated'}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Cite here
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-0.5 font-medium ${VERDICT_STYLE[c.verdict].className}`}>{VERDICT_STYLE[c.verdict].label}</span>
                        {c.reason && <span className="text-zinc-400">{c.reason}</span>}
                      </div>
                      {c.reference.abstract && <p className="mt-2 line-clamp-3 text-xs text-zinc-500">{c.reference.abstract}</p>}
                    </div>
                  ))}
                  <button onClick={() => setState(st => ({ ...st, [key(claim)]: { status: 'idle', candidates: [] } }))} className="text-xs text-zinc-500 hover:text-zinc-300">
                    None of these fit; skip
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
