# CiteAI - Academic Paper Generator

>it's still a wip

CiteAI drafts academic papers grounded in real sources and real data. You pick a topic, choose references and (optionally) a dataset, and it writes each section with free-tier AI models, citing only what you selected and reporting only statistics it actually computed.

## Features

- **Five-step wizard:** Start (topic) → Research (gaps, questions, references) → Analyze (data) → Compose (generate) → Finish (review, export)
- **Real references:** search OpenAlex and Crossref; the reference list is built from real metadata, never written by the model
- **Field-aware:** pick your discipline (26 OpenAlex fields) and reference search, data analysis and writing stay within its literature and conventions
- **Find sources for claims:** scans the paper for claims without a citation, searches real papers for each, and labels each candidate from its abstract as supporting, related or unrelated; you choose what to cite and the reference list updates
- **Import a draft:** bring in your own .docx, .md, .txt or .tex file to format it in any citation style, find sources for it and export it
- **Citation styles:** APA 7, MLA 9, Harvard and IEEE, with matching in-text citations (IEEE renumbered by first appearance) and student-paper formatting: title page or header block, spacing, headings, page numbers, hanging indents
- **Better drafts:** a thesis and section plan come first so sections build one argument; prompts follow a writing guide, and a checked edit pass removes stock phrases without touching citations or numbers
- **Style cleanup:** deterministic rewrites of stock phrases and optional em-dash normalization, run during generation or from the Style tab on sections you choose; quotes, citations, numbers, equations, code, URLs, tables and the reference list are locked
- **Automatic data analysis:** decides whether the topic needs data, finds a public Hugging Face dataset, and runs correlation, regression, t-test/ANOVA and chi-square tests in code, with exact p-values, APA-formatted statistics and report tables
- **Free AI with automatic fallback:** Groq, NVIDIA NIM, Mistral, OpenRouter and Gemini free tiers behind one server-side gateway that switches providers when one hits its limit
- **Export:** PDF, Word (.docx), Markdown and LaTeX (`.tex` + `.bib` using biblatex; compile with LuaLaTeX), plus BibTeX, RIS and CSL-JSON reference files for Zotero, Mendeley or EndNote
- **My Papers:** papers are saved in your browser

## Getting Started

### Prerequisites

- Node.js 20 or later
- A free API key from at least one provider; [Groq](https://console.groq.com/keys) is recommended (no card needed)

### Installation

```
git clone https://github.com/yourusername/CiteAI.git
cd CiteAI/frontend
npm install
cp .env.example .env
```

Put your key in `.env`, for example `GROQ_API_KEY=gsk_...`. AI keys have no `VITE_` prefix: they stay on the server and are never sent to the browser. Add more providers for more free capacity; see `.env.example` for the limits of each.

### Running the Application

```
npm run dev
```

The app runs at http://localhost:5173. The dev server also serves the `/api/llm` gateway, so no other tooling is needed.

### Checks

```
npm run lint
npm run test
npm run build
```

CI runs all three on every push and pull request to `main`.

## How it Works

- **AI gateway** (`frontend/api/llm.ts`, logic in `frontend/api/_lib/llm-gateway.ts`): a Vercel function that streams completions from the first configured provider, falls back on rate limits, auth errors or outages, and remembers which providers are cooling down. The browser talks only to `/api/llm`.
- **Data analysis** (`frontend/src/services/data-analysis/`): the model only decides *whether* data is needed, *which* dataset fits and *which columns* to test; plans are validated against the real columns. Descriptive statistics come from Hugging Face's full-dataset statistics; tests run on up to 1,000 rows sampled evenly across the dataset. Each report lists its limitations (sampling, multiple comparisons, observational data).
- **Paper generation** (`frontend/src/services/paper-generator.ts`): each section is generated separately with the selected research gaps, questions, references and computed findings. Prompts forbid invented citations and statistics, and the Results section carries the report tables.

## Deployment

Deploy to Vercel with the project **Root Directory** set to `frontend`. Vercel builds the Vite app and deploys `frontend/api/` as serverless functions. Add your provider keys (for example `GROQ_API_KEY`) under Project Settings → Environment Variables.

Anyone who can open the deployed site can use your free AI quota through it. The gateway blocks requests from other websites and caps request size, but for a public launch, require sign-in or add per-user rate limiting.

## License

MIT
