import { describe, it, expect } from 'vitest';
import {
  formatReference, formatInTextCitation, formatNarrativeCitation, generateStyledReferenceList, formatDatasetCitation,
  renumberCitations,
} from '../services/citation-formatter';
import { Reference } from '../services/references-api';

const resnet: Reference = {
  id: '1', title: 'Deep residual learning for image recognition', year: 2016, venue: 'CVPR', doi: '10.1109/CVPR.2016.90',
  authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }, { name: 'Shaoqing Ren' }],
};
const two: Reference = { id: '2', title: 'A study', year: 2020, venue: 'Nature', authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }] };
const four: Reference = { ...resnet, id: '4', authors: [...resnet.authors, { name: 'Jian Sun' }] };
const noDate: Reference = { id: '5', title: 'Undated report', year: 0, authors: [{ name: 'Ann Lee' }] };

describe('MLA 9', () => {
  it('formats works-cited entries', () => {
    expect(formatReference(resnet, 'mla')).toBe('He, Kaiming, et al. "Deep residual learning for image recognition." *CVPR*, 2016, https://doi.org/10.1109/CVPR.2016.90.');
    expect(formatReference(two, 'mla')).toBe('Doe, Jane, and John Smith. "A study." *Nature*, 2020.');
  });

  it('uses author-only in-text citations', () => {
    expect(formatInTextCitation(resnet, 'mla')).toBe('(He et al.)');
    expect(formatInTextCitation(two, 'mla')).toBe('(Doe and Smith)');
    expect(formatNarrativeCitation(two, 'mla')).toBe('Doe and Smith');
  });
});

describe('Harvard (Cite Them Right)', () => {
  it('formats reference-list entries', () => {
    expect(formatReference(resnet, 'harvard')).toBe("He, K., Zhang, X. and Ren, S. (2016) 'Deep residual learning for image recognition', *CVPR*. Available at: https://doi.org/10.1109/CVPR.2016.90");
    expect(formatReference(four, 'harvard').startsWith('He, K. et al. (2016)')).toBe(true);
    expect(formatReference(noDate, 'harvard')).toBe("Lee, A. (no date) 'Undated report'.");
  });

  it('uses author-date in-text citations, et al. from four authors', () => {
    expect(formatInTextCitation(resnet, 'harvard')).toBe('(He, Zhang and Ren, 2016)');
    expect(formatInTextCitation(four, 'harvard')).toBe('(He et al., 2016)');
    expect(formatNarrativeCitation(noDate, 'harvard')).toBe('Lee (no date)');
  });
});

describe('shared behavior', () => {
  it('keeps APA output unchanged', () => {
    expect(formatInTextCitation(resnet, 'apa')).toBe('(He et al., 2016)');
    expect(formatReference(two, 'apa')).toBe('Doe, J., & Smith, J. (2020). A study. *Nature*.');
  });

  it('sorts reference lists by first author family name', () => {
    expect(generateStyledReferenceList([resnet, two], 'mla').split('\n\n').map(e => e.split(',')[0])).toEqual(['Doe', 'He']);
  });

  it('cites datasets in each style', () => {
    const ds = { id: 'scikit-learn/iris', title: 'iris', url: 'https://huggingface.co/datasets/scikit-learn/iris' };
    expect(formatDatasetCitation(ds, 'apa')).toBe('scikit-learn. (n.d.). *iris* [Data set]. Hugging Face. https://huggingface.co/datasets/scikit-learn/iris');
    expect(formatDatasetCitation(ds, 'mla')).toBe('scikit-learn. *iris*. Hugging Face, https://huggingface.co/datasets/scikit-learn/iris.');
    expect(formatDatasetCitation(ds, 'harvard')).toBe('scikit-learn (no date) *iris* [Dataset]. Available at: https://huggingface.co/datasets/scikit-learn/iris');
  });
});

describe('IEEE', () => {
  it('formats numbered entries with initials first', () => {
    expect(formatReference(resnet, 'ieee', 1)).toBe('[1] K. He, X. Zhang, and S. Ren, "Deep residual learning for image recognition," *CVPR*, 2016, doi: 10.1109/CVPR.2016.90.');
    expect(formatReference(two, 'ieee', 2)).toBe('[2] J. Doe and J. Smith, "A study," *Nature*, 2020.');
    expect(formatReference(noDate, 'ieee', 3)).toBe('[3] A. Lee, "Undated report."');
  });

  it('cites by number', () => {
    expect(formatInTextCitation(resnet, 'ieee', 4)).toBe('[4]');
    expect(formatNarrativeCitation(resnet, 'ieee', 4)).toBe('He et al. [4]');
    expect(generateStyledReferenceList([two, resnet], 'ieee').split('\n\n').map(e => e.slice(0, 8))).toEqual(['[1] J. D', '[2] K. H']);
  });

  it('renumbers by first appearance and drops uncited sources', () => {
    const { texts, order } = renumberCitations(['As shown [2], and [1, 3].', 'See [2]-[3], [2]–[4] and [9].'], 4);
    expect(order).toEqual([2, 1, 3, 4]);
    expect(texts).toEqual(['As shown [1], and [2], [3].', 'See [1], [3], [1], [3], [4] and [9].']);
    expect(renumberCitations(['Only [3] here.'], 3)).toEqual({ texts: ['Only [1] here.'], order: [3] });
    // Consecutive new numbers collapse into an IEEE range
    expect(renumberCitations(['[3], [1, 2]', '[1]-[3]'], 3).texts[1]).toBe('[1]–[3]');
  });
});
