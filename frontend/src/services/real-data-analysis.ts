/**
 * Real Data Analysis Service
 * Fetches actual dataset samples and performs statistical analysis
 * Uses HuggingFace Dataset Viewer API for real data access
 */

import { geminiCompletion, GEMINI_MODELS } from './gemini-api';

export interface RealDataAnalysis {
    summary: {
        totalRows: number;
        totalColumns: number;
        missingValues: number;
        missingPercentage: number;
        numericColumns: number;
        categoricalColumns: number;
    };
    columns: ColumnStats[];
    correlations: CorrelationResult[];
    findings: StatisticalFinding[];
    sampleData: Record<string, any>[];
    dataUrl: string;
}

export interface ColumnStats {
    name: string;
    type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'unknown';
    count: number;
    missing: number;
    missingPercent: number;
    unique: number;
    // Numeric stats
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    median?: number;
    q25?: number;
    q75?: number;
    // Categorical stats
    topValues?: { value: string; count: number; percentage: number }[];
}

export interface CorrelationResult {
    column1: string;
    column2: string;
    correlation: number;
    strength: 'none' | 'weak' | 'moderate' | 'strong';
}

export interface StatisticalFinding {
    type: 'insight' | 'warning' | 'recommendation';
    title: string;
    description: string;
    metric?: string;
    value?: number;
}

/**
 * Fetch real data sample from HuggingFace Dataset Viewer
 * This API provides actual row data from datasets
 */
export async function fetchDatasetSample(
    datasetId: string,
    config?: string,
    split: string = 'train',
    limit: number = 100
): Promise<{ rows: Record<string, any>[]; features: Record<string, any>; numRows: number }> {
    try {
        // First get dataset info to find configs/splits
        const infoUrl = `https://datasets-server.huggingface.co/info?dataset=${encodeURIComponent(datasetId)}`;
        const infoResponse = await fetch(infoUrl);

        if (!infoResponse.ok) {
            throw new Error(`Dataset info not available`);
        }

        const info = await infoResponse.json();

        // Get first available config and split
        const configName = config || Object.keys(info.dataset_info || {})[0] || 'default';
        const availableSplits = info.dataset_info?.[configName]?.splits || {};
        const splitName = split in availableSplits ? split : Object.keys(availableSplits)[0] || 'train';
        const numRows = availableSplits[splitName]?.num_examples || 0;

        // Fetch actual rows
        const rowsUrl = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(datasetId)}&config=${encodeURIComponent(configName)}&split=${encodeURIComponent(splitName)}&offset=0&length=${limit}`;

        const rowsResponse = await fetch(rowsUrl);

        if (!rowsResponse.ok) {
            throw new Error(`Could not fetch rows: ${rowsResponse.status}`);
        }

        const rowsData = await rowsResponse.json();

        return {
            rows: (rowsData.rows || []).map((r: any) => r.row),
            features: rowsData.features || {},
            numRows,
        };
    } catch (error) {
        console.error('Failed to fetch dataset sample:', error);
        throw error;
    }
}

/**
 * Perform statistical analysis on real data
 */
export async function analyzeRealData(
    datasetId: string,
    source: 'huggingface' | 'kaggle' = 'huggingface'
): Promise<RealDataAnalysis> {
    const sampleSize = 100;

    // Fetch real data sample
    const { rows, features, numRows } = await fetchDatasetSample(datasetId, undefined, 'train', sampleSize);

    if (rows.length === 0) {
        throw new Error('No data available for analysis');
    }

    // Analyze each column
    const columnNames = Object.keys(rows[0]);
    const columnStats: ColumnStats[] = [];

    for (const colName of columnNames) {
        const values = rows.map(row => row[colName]);
        const stats = analyzeColumn(colName, values);
        columnStats.push(stats);
    }

    // Calculate correlations between numeric columns
    const numericCols = columnStats.filter(c => c.type === 'numeric');
    const correlations: CorrelationResult[] = [];

    for (let i = 0; i < numericCols.length - 1; i++) {
        for (let j = i + 1; j < numericCols.length; j++) {
            const col1 = numericCols[i].name;
            const col2 = numericCols[j].name;
            const values1 = rows.map(r => parseFloat(r[col1])).filter(v => !isNaN(v));
            const values2 = rows.map(r => parseFloat(r[col2])).filter(v => !isNaN(v));

            if (values1.length > 5 && values2.length > 5) {
                const corr = calculateCorrelation(values1, values2);
                correlations.push({
                    column1: col1,
                    column2: col2,
                    correlation: corr,
                    strength: getCorrelationStrength(corr),
                });
            }
        }
    }

    // Sort by absolute correlation value
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    // Calculate summary stats
    const totalMissing = columnStats.reduce((sum, c) => sum + c.missing, 0);
    const totalCells = rows.length * columnNames.length;

    // Generate statistical findings
    const findings = generateFindings(columnStats, correlations, numRows);

    return {
        summary: {
            totalRows: numRows,
            totalColumns: columnNames.length,
            missingValues: totalMissing,
            missingPercentage: (totalMissing / totalCells) * 100,
            numericColumns: numericCols.length,
            categoricalColumns: columnStats.filter(c => c.type === 'categorical').length,
        },
        columns: columnStats,
        correlations: correlations.slice(0, 10), // Top 10 correlations
        findings,
        sampleData: rows.slice(0, 5), // First 5 rows for preview
        dataUrl: `https://huggingface.co/datasets/${datasetId}`,
    };
}

/**
 * Analyze a single column
 */
function analyzeColumn(name: string, values: any[]): ColumnStats {
    const nonNull = values.filter(v => v != null && v !== '');
    const missing = values.length - nonNull.length;
    const unique = new Set(nonNull.map(v => String(v))).size;

    // Determine type
    const numericValues = nonNull.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const isNumeric = numericValues.length > nonNull.length * 0.7; // 70% numeric = numeric column

    if (isNumeric && numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const mean = sum / numericValues.length;
        const variance = numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numericValues.length;
        const std = Math.sqrt(variance);

        return {
            name,
            type: 'numeric',
            count: nonNull.length,
            missing,
            missingPercent: (missing / values.length) * 100,
            unique,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: Math.round(mean * 100) / 100,
            std: Math.round(std * 100) / 100,
            median: sorted[Math.floor(sorted.length / 2)],
            q25: sorted[Math.floor(sorted.length * 0.25)],
            q75: sorted[Math.floor(sorted.length * 0.75)],
        };
    }

    // Categorical column
    const valueCounts = new Map<string, number>();
    nonNull.forEach(v => {
        const str = String(v).slice(0, 50); // Truncate long values
        valueCounts.set(str, (valueCounts.get(str) || 0) + 1);
    });

    const topValues = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
            value,
            count,
            percentage: (count / nonNull.length) * 100,
        }));

    // Check if datetime
    const isDatetime = nonNull.some(v => {
        const str = String(v);
        return /^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}\/\d{2}\/\d{4}/.test(str);
    });

    return {
        name,
        type: isDatetime ? 'datetime' : (unique > values.length * 0.5 ? 'text' : 'categorical'),
        count: nonNull.length,
        missing,
        missingPercent: (missing / values.length) * 100,
        unique,
        topValues,
    };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;

    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    if (denom === 0) return 0;

    return Math.round((numerator / denom) * 1000) / 1000;
}

function getCorrelationStrength(r: number): 'none' | 'weak' | 'moderate' | 'strong' {
    const abs = Math.abs(r);
    if (abs < 0.2) return 'none';
    if (abs < 0.4) return 'weak';
    if (abs < 0.7) return 'moderate';
    return 'strong';
}

/**
 * Generate statistical findings from the analysis
 */
function generateFindings(
    columns: ColumnStats[],
    correlations: CorrelationResult[],
    totalRows: number
): StatisticalFinding[] {
    const findings: StatisticalFinding[] = [];

    // Check for high missing values
    const highMissing = columns.filter(c => c.missingPercent > 20);
    if (highMissing.length > 0) {
        findings.push({
            type: 'warning',
            title: 'High Missing Values',
            description: `${highMissing.length} column(s) have >20% missing data: ${highMissing.map(c => c.name).join(', ')}`,
            metric: 'missing_percentage',
            value: highMissing[0].missingPercent,
        });
    }

    // Check for strong correlations
    const strongCorr = correlations.filter(c => c.strength === 'strong' || c.strength === 'moderate');
    if (strongCorr.length > 0) {
        const top = strongCorr[0];
        findings.push({
            type: 'insight',
            title: 'Significant Correlation Found',
            description: `${top.column1} and ${top.column2} have ${top.strength} correlation (r=${top.correlation})`,
            metric: 'correlation',
            value: top.correlation,
        });
    }

    // Check for outliers in numeric columns
    const numericCols = columns.filter(c => c.type === 'numeric' && c.max && c.min && c.std);
    for (const col of numericCols.slice(0, 3)) {
        if (col.max! - col.min! > col.std! * 6) {
            findings.push({
                type: 'insight',
                title: 'Wide Value Range',
                description: `${col.name} has values from ${col.min} to ${col.max} (mean: ${col.mean})`,
                metric: 'range',
                value: col.max! - col.min!,
            });
            break;
        }
    }

    // Check for skewed distributions
    for (const col of columns.filter(c => c.type === 'categorical' && c.topValues).slice(0, 2)) {
        const top = col.topValues![0];
        if (top.percentage > 50) {
            findings.push({
                type: 'insight',
                title: 'Dominant Category',
                description: `${col.name}: "${top.value}" appears in ${top.percentage.toFixed(1)}% of rows`,
                metric: 'frequency',
                value: top.percentage,
            });
        }
    }

    // Dataset size insight
    findings.push({
        type: 'insight',
        title: 'Dataset Scale',
        description: `${totalRows.toLocaleString()} total rows with ${columns.length} features — ${totalRows > 10000 ? 'large enough for robust analysis' : 'moderate sample size'}`,
        metric: 'rows',
        value: totalRows,
    });

    // Recommendation
    if (numericCols.length >= 2) {
        findings.push({
            type: 'recommendation',
            title: 'Analysis Potential',
            description: `${numericCols.length} numeric columns available for regression, correlation, and trend analysis`,
        });
    }

    return findings;
}

/**
 * Generate AI-powered interpretation of findings
 */
export async function interpretFindings(
    analysis: RealDataAnalysis,
    topic: string
): Promise<string> {
    const prompt = `You are a data scientist. Given this dataset analysis for research on "${topic}", provide a brief 2-3 sentence interpretation of the key findings that would be useful for an academic paper:

Dataset: ${analysis.summary.totalRows} rows, ${analysis.summary.totalColumns} columns
Missing Data: ${analysis.summary.missingPercentage.toFixed(1)}% 
Key Correlations: ${analysis.correlations.slice(0, 3).map(c => `${c.column1}↔${c.column2} (r=${c.correlation})`).join(', ') || 'None significant'}
Findings: ${analysis.findings.slice(0, 3).map(f => f.title).join(', ')}

Respond with just the interpretation, no preamble.`;

    try {
        return await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
    } catch (e) {
        return `This dataset contains ${analysis.summary.totalRows.toLocaleString()} samples with ${analysis.summary.numericColumns} numeric and ${analysis.summary.categoricalColumns} categorical features, providing quantitative support for the research.`;
    }
}
