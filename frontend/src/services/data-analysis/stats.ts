/**
 * Statistical tests used by the analysis pipeline.
 * Pure functions with exact p-values, so reported numbers never come from the language model.
 */

export function mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function variance(values: number[]): number {
    const m = mean(values);
    return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

export function sd(values: number[]): number {
    return Math.sqrt(variance(values));
}

export function quantile(values: number[], q: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(values: number[]): number {
    return quantile(values, 0.5);
}

// --- Special functions -------------------------------------------------------

/** Lanczos approximation of ln Γ(x) */
export function logGamma(x: number): number {
    const c = [
        676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
        12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    let a = 0.99999999999980993;
    const t = x + 7.5;
    for (let i = 0; i < c.length; i++) a += c[i] / (x + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Continued fraction for the incomplete beta function (modified Lentz) */
function betaContinuedFraction(a: number, b: number, x: number): number {
    const tiny = 1e-300;
    let c = 1;
    let d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
        c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d; h *= d * c;
        aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
        c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) < 1e-14) break;
    }
    return h;
}

/** Regularized incomplete beta I_x(a, b) */
export function incompleteBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2)
        ? (front * betaContinuedFraction(a, b, x)) / a
        : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Regularized upper incomplete gamma Q(a, x) */
export function upperIncompleteGamma(a: number, x: number): number {
    if (x <= 0) return 1;
    const gln = logGamma(a);
    if (x < a + 1) {
        // Series for P(a, x)
        let sum = 1 / a;
        let term = sum;
        for (let n = 1; n < 500; n++) {
            term *= x / (a + n);
            sum += term;
            if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
        }
        return 1 - sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    // Continued fraction for Q(a, x)
    const tiny = 1e-300;
    let b = x + 1 - a;
    let c = 1 / tiny;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 500; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
        c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
}

/** Two-tailed p-value for Student's t */
export function tTwoTailedP(t: number, df: number): number {
    return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/** Upper-tail p-value for F(df1, df2) */
export function fUpperP(f: number, df1: number, df2: number): number {
    if (f <= 0) return 1;
    return incompleteBeta(df2 / (df2 + df1 * f), df2 / 2, df1 / 2);
}

/** Upper-tail p-value for chi-square(df) */
export function chiSquareUpperP(chi2: number, df: number): number {
    return upperIncompleteGamma(df / 2, chi2 / 2);
}

// --- Tests -------------------------------------------------------------------

export interface CorrelationTest {
    r: number;
    n: number;
    t: number;
    df: number;
    p: number;
}

export function pearson(x: number[], y: number[]): CorrelationTest {
    const n = x.length;
    const mx = mean(x);
    const my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
        sxy += (x[i] - mx) * (y[i] - my);
        sxx += (x[i] - mx) ** 2;
        syy += (y[i] - my) ** 2;
    }
    const r = sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
    const df = n - 2;
    const t = Math.abs(r) >= 1 ? Infinity : r * Math.sqrt(df / (1 - r * r));
    const p = Number.isFinite(t) ? tTwoTailedP(t, df) : 0;
    return { r, n, t, df, p };
}

export interface RegressionResult {
    slope: number;
    intercept: number;
    r2: number;
    slopeSE: number;
    t: number;
    df: number;
    p: number;
    n: number;
}

export function linearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    const mx = mean(x);
    const my = mean(y);
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) {
        sxy += (x[i] - mx) * (y[i] - my);
        sxx += (x[i] - mx) ** 2;
    }
    const slope = sxx === 0 ? 0 : sxy / sxx;
    const intercept = my - slope * mx;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
        ssRes += (y[i] - (intercept + slope * x[i])) ** 2;
        ssTot += (y[i] - my) ** 2;
    }
    const df = n - 2;
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    const slopeSE = sxx === 0 ? Infinity : Math.sqrt(ssRes / df / sxx);
    const t = slopeSE === 0 ? Infinity : slope / slopeSE;
    const p = Number.isFinite(t) ? tTwoTailedP(t, df) : 0;
    return { slope, intercept, r2, slopeSE, t, df, p, n };
}

export interface WelchTTest {
    meanA: number;
    meanB: number;
    t: number;
    df: number;
    p: number;
    cohensD: number;
}

export function welchTTest(a: number[], b: number[]): WelchTTest {
    const ma = mean(a), mb = mean(b);
    const va = variance(a), vb = variance(b);
    const se2 = va / a.length + vb / b.length;
    const t = (ma - mb) / Math.sqrt(se2);
    const df = se2 ** 2 / ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
    const pooled = Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / (a.length + b.length - 2));
    return { meanA: ma, meanB: mb, t, df, p: tTwoTailedP(t, df), cohensD: pooled === 0 ? 0 : (ma - mb) / pooled };
}

export interface AnovaResult {
    f: number;
    dfBetween: number;
    dfWithin: number;
    p: number;
    etaSquared: number;
}

export function oneWayAnova(groups: number[][]): AnovaResult {
    const all = groups.flat();
    const grand = mean(all);
    let ssBetween = 0, ssWithin = 0;
    for (const g of groups) {
        const m = mean(g);
        ssBetween += g.length * (m - grand) ** 2;
        for (const v of g) ssWithin += (v - m) ** 2;
    }
    const dfBetween = groups.length - 1;
    const dfWithin = all.length - groups.length;
    const f = ssWithin === 0 ? Infinity : (ssBetween / dfBetween) / (ssWithin / dfWithin);
    return {
        f,
        dfBetween,
        dfWithin,
        p: Number.isFinite(f) ? fUpperP(f, dfBetween, dfWithin) : 0,
        etaSquared: ssBetween + ssWithin === 0 ? 0 : ssBetween / (ssBetween + ssWithin),
    };
}

export interface ChiSquareResult {
    chi2: number;
    df: number;
    p: number;
    cramersV: number;
    n: number;
}

/** Pearson chi-square test of independence on a contingency table of counts */
export function chiSquareIndependence(table: number[][]): ChiSquareResult {
    const rows = table.length;
    const cols = table[0].length;
    const rowSums = table.map(r => r.reduce((a, b) => a + b, 0));
    const colSums = Array.from({ length: cols }, (_, j) => table.reduce((a, r) => a + r[j], 0));
    const n = rowSums.reduce((a, b) => a + b, 0);
    let chi2 = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const expected = (rowSums[i] * colSums[j]) / n;
            if (expected > 0) chi2 += (table[i][j] - expected) ** 2 / expected;
        }
    }
    const df = (rows - 1) * (cols - 1);
    const k = Math.min(rows, cols) - 1;
    return { chi2, df, p: chiSquareUpperP(chi2, df), cramersV: k > 0 ? Math.sqrt(chi2 / (n * k)) : 0, n };
}

// --- Formatting (APA style) --------------------------------------------------

export function formatP(p: number): string {
    if (p < 0.001) return 'p < .001';
    return `p = ${p.toFixed(3).replace(/^0/, '')}`;
}

/** p-value for a table cell: "< .001" or ".043" */
export function pCell(p: number): string {
    return p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, '');
}

/** Number with sensible precision for reporting */
export function fmt(value: number, digits = 2): string {
    if (!Number.isFinite(value)) return String(value);
    if (Math.abs(value) >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
    return value.toFixed(digits);
}

/** Correlation-style value without the leading zero, as APA requires for bounded statistics */
export function fmtBounded(value: number, digits = 2): string {
    return value.toFixed(digits).replace(/^(-?)0\./, '$1.');
}
