// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchReferences } from '../services/references-api';

const work = (title: string) => ({ id: `https://openalex.org/W${title.length}`, title, publication_year: 2020, authorships: [{ author: { display_name: 'Ann Lee' } }] });
const page = (titles: string[]) => new Response(JSON.stringify({ results: titles.map(work), meta: { count: titles.length } }));

afterEach(() => vi.unstubAllGlobals());

describe('field-aware reference search', () => {
  it('adds the OpenAlex field filter', async () => {
    const fetchMock = vi.fn(async (_url: string) => page(['In field']));
    vi.stubGlobal('fetch', fetchMock);
    const result = await searchReferences({ query: 'attention', fieldId: '17' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('filter=primary_topic.field.id:17');
    expect(result.references[0].title).toBe('In field');
  });

  it('retries without the filter when the field has no matches', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(page([])).mockResolvedValueOnce(page(['Any field']));
    vi.stubGlobal('fetch', fetchMock);
    const result = await searchReferences({ query: 'attention', fieldId: '35' });
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('filter=');
    expect(result.references[0].title).toBe('Any field');
  });
});
