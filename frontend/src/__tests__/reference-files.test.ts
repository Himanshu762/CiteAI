import { describe, it, expect } from 'vitest';
import { citationKeys, toBibTeX, toRIS, toCSLJSON } from '../services/reference-files';
import { Reference } from '../services/references-api';

const resnet: Reference = {
  id: '1', title: 'Deep residual learning for image recognition', year: 2016, venue: 'CVPR', doi: '10.1109/CVPR.2016.90',
  authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }],
};
const resnet2: Reference = { ...resnet, id: '2', title: 'Deep residual networks revisited' };
const iris = { id: 'scikit-learn/iris', title: 'iris', url: 'https://huggingface.co/datasets/scikit-learn/iris' };

describe('citationKeys', () => {
  it('builds author-year-word keys and disambiguates duplicates', () => {
    expect(citationKeys([resnet, resnet2], [iris])).toEqual(['he2016deepa', 'he2016deepb', 'scikitlearnirisdata']);
    expect(citationKeys([{ ...resnet, authors: [], year: 0, title: 'The & approach' }])).toEqual(['anonndapproach']);
  });
});

describe('BibTeX', () => {
  it('writes article and dataset entries', () => {
    const bib = toBibTeX([{ ...resnet, title: 'Costs & benefits_of depth' }], [iris]);
    expect(bib).toContain('@article{he2016costs,');
    expect(bib).toContain('title = {{Costs \\& benefits\\_of depth}}');
    expect(bib).toContain('author = {He, Kaiming and Zhang, Xiangyu}');
    expect(bib).toContain('doi = {10.1109/CVPR.2016.90}');
    expect(bib).toContain('@misc{scikitlearnirisdata,');
  });
});

describe('RIS', () => {
  it('writes one record per source with CRLF endings', () => {
    const ris = toRIS([resnet], [iris]);
    expect(ris.split('ER  - ').length - 1).toBe(2);
    expect(ris).toContain('TY  - JOUR\r\nTI  - Deep residual learning for image recognition\r\nAU  - He, Kaiming');
    expect(ris).toContain('TY  - DATA');
  });
});

describe('CSL-JSON', () => {
  it('produces items Zotero and Pandoc can import', () => {
    const items = JSON.parse(toCSLJSON([resnet], [iris]));
    expect(items[0]).toEqual(expect.objectContaining({
      id: 'he2016deep', type: 'article-journal', issued: { 'date-parts': [[2016]] }, DOI: '10.1109/CVPR.2016.90',
    }));
    expect(items[1].type).toBe('dataset');
  });
});
