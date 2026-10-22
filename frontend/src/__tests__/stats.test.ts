import { describe, it, expect } from 'vitest';
import {
  pearson, linearRegression, welchTTest, oneWayAnova, chiSquareIndependence,
  tTwoTailedP, chiSquareUpperP, fUpperP, formatP, fmtBounded, median, sd,
} from '../services/data-analysis/stats';

// Reference values computed with SciPy 1.17 (scipy.stats)
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const yStrong = [2.1, 3.9, 6.2, 7.8, 9.7, 12.4, 13.8, 16.1, 18.2, 19.9];
const yWeak = [5, 3, 6, 2, 7, 4, 8, 3, 6, 5];

describe('distribution tails', () => {
  it('matches SciPy for t, chi-square and F', () => {
    expect(tTwoTailedP(2.5, 3)).toBeCloseTo(0.08770664700806556, 10);
    expect(chiSquareUpperP(3.84, 1)).toBeCloseTo(0.050043521248705085, 10);
    expect(chiSquareUpperP(30, 10)).toBeCloseTo(0.0008566412107753002, 12);
    expect(fUpperP(4.5, 2, 27)).toBeCloseTo(0.020574394164052878, 10);
  });
});

describe('tests', () => {
  it('pearson', () => {
    const strong = pearson(x, yStrong);
    expect(strong.r).toBeCloseTo(0.9993235851149714, 12);
    expect(strong.p / 9.151201576254769e-13).toBeCloseTo(1, 4);
    const weak = pearson(x, yWeak);
    expect(weak.r).toBeCloseTo(0.20154144862179718, 12);
    expect(weak.p).toBeCloseTo(0.5766036222283659, 10);
  });

  it('linear regression', () => {
    const lr = linearRegression(x, yWeak);
    expect(lr.slope).toBeCloseTo(0.1272727272727273, 12);
    expect(lr.intercept).toBeCloseTo(4.2, 12);
    expect(lr.r2).toBeCloseTo(0.04061895551257251, 12);
    expect(lr.slopeSE).toBeCloseTo(0.21868628548689353, 12);
    expect(lr.p).toBeCloseTo(0.5766036222283658, 10);
  });

  it('welch t-test', () => {
    const t = welchTTest([5.1, 4.9, 6.2, 5.8, 6.0, 5.5, 5.3], [6.5, 6.9, 7.1, 6.0, 7.4, 6.8]);
    expect(t.t).toBeCloseTo(-4.610186235135556, 10);
    expect(t.df).toBeCloseTo(10.632532374170433, 8);
    expect(t.p).toBeCloseTo(0.0008219996809951741, 10);
  });

  it('one-way ANOVA', () => {
    const a = oneWayAnova([[4.2, 4.8, 5.1, 4.5], [5.9, 6.1, 5.5, 6.3, 5.8], [4.9, 5.2, 5.0]]);
    expect(a.f).toBeCloseTo(19.869217424826527, 9);
    expect(a.p).toBeCloseTo(0.0004996537939376158, 10);
  });

  it('chi-square independence (no continuity correction)', () => {
    const c = chiSquareIndependence([[20, 15, 5], [10, 25, 25]]);
    expect(c.chi2).toBeCloseTo(15.79861111111111, 10);
    expect(c.df).toBe(2);
    expect(c.p).toBeCloseTo(0.0003710010906678793, 12);
  });
});

describe('descriptives and formatting', () => {
  it('computes sample sd and median', () => {
    expect(sd([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138089935299395, 12);
    expect(median([5, 1, 3, 2])).toBe(2.5);
  });

  it('formats APA-style values', () => {
    expect(formatP(0.0004)).toBe('p < .001');
    expect(formatP(0.04321)).toBe('p = .043');
    expect(fmtBounded(-0.4567)).toBe('-.46');
  });
});
