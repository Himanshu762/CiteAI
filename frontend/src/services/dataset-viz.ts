/**
 * Dataset Visualization Service
 * Generates chart data and visualizations for datasets
 * Uses Gemini for AI-powered insights
 */

import { geminiCompletion, GEMINI_MODELS } from './gemini-api';
import { Dataset, DatasetAnalysis } from './dataset-finder';

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title: string;
    description: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
    }[];
}

export interface DataVisualization {
    id: string;
    datasetId: string;
    charts: ChartData[];
    insights: string[];
    generatedAt: Date;
}

/**
 * Generate visualizations for a dataset analysis
 */
export async function generateVisualizations(
    dataset: Dataset,
    analysis: DatasetAnalysis
): Promise<DataVisualization> {
    const charts: ChartData[] = [];
    const insights: string[] = [];

    // Generate column distribution chart
    if (analysis.columns && analysis.columns.length > 0) {
        const numericCols = analysis.columns.filter(c => c.type === 'numeric');
        const categoricalCols = analysis.columns.filter(c => c.type === 'categorical');

        // Summary chart - column types distribution
        charts.push({
            type: 'pie',
            title: 'Column Types Distribution',
            description: 'Distribution of data types across columns',
            labels: ['Numeric', 'Categorical', 'DateTime', 'Text'],
            datasets: [{
                label: 'Columns',
                data: [
                    analysis.columns.filter(c => c.type === 'numeric').length,
                    analysis.columns.filter(c => c.type === 'categorical').length,
                    analysis.columns.filter(c => c.type === 'datetime').length,
                    analysis.columns.filter(c => c.type === 'text').length,
                ],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
            }],
        });

        // Missing values chart
        const colsWithMissing = analysis.columns
            .filter(c => c.missing > 0)
            .slice(0, 8);

        if (colsWithMissing.length > 0) {
            charts.push({
                type: 'bar',
                title: 'Missing Values by Column',
                description: 'Number of missing values in each column',
                labels: colsWithMissing.map(c => c.name),
                datasets: [{
                    label: 'Missing Values',
                    data: colsWithMissing.map(c => c.missing),
                    backgroundColor: colsWithMissing.map(() => '#ef4444'),
                }],
            });
        }

        // Top categorical values
        for (const col of categoricalCols.slice(0, 2)) {
            if (col.topValues && col.topValues.length > 0) {
                charts.push({
                    type: 'bar',
                    title: `${col.name} Distribution`,
                    description: `Top values in ${col.name}`,
                    labels: col.topValues.slice(0, 6).map(v => v.value),
                    datasets: [{
                        label: 'Count',
                        data: col.topValues.slice(0, 6).map(v => v.count),
                        backgroundColor: col.topValues.slice(0, 6).map((_, i) =>
                            ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][i % 6]
                        ),
                    }],
                });
            }
        }

        // Numeric ranges
        const numericWithRange = numericCols.filter(c => c.min !== undefined && c.max !== undefined);
        if (numericWithRange.length > 0) {
            charts.push({
                type: 'bar',
                title: 'Numeric Ranges',
                description: 'Min and max values for numeric columns',
                labels: numericWithRange.slice(0, 6).map(c => c.name),
                datasets: [
                    {
                        label: 'Min',
                        data: numericWithRange.slice(0, 6).map(c => c.min || 0),
                        backgroundColor: numericWithRange.map(() => '#3b82f6'),
                    },
                    {
                        label: 'Max',
                        data: numericWithRange.slice(0, 6).map(c => c.max || 0),
                        backgroundColor: numericWithRange.map(() => '#10b981'),
                    },
                ],
            });
        }
    }

    // Generate AI insights
    try {
        const insightPrompt = `Analyze this dataset and provide 3-5 brief research insights:

Dataset: ${dataset.title}
Description: ${dataset.description}
Stats: ${analysis.summary.totalRows} rows, ${analysis.summary.totalColumns} columns
Missing Values: ${analysis.summary.missingValues}

Respond with a JSON array of insight strings:
["insight 1", "insight 2", "insight 3"]`;

        const result = await geminiCompletion(insightPrompt, GEMINI_MODELS.FLASH);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            insights.push(...parsed);
        }
    } catch (e) {
        insights.push('Dataset contains structured data suitable for analysis');
        insights.push(`${analysis.summary.totalRows} data points available for research`);
    }

    return {
        id: `viz-${dataset.id}`,
        datasetId: dataset.id,
        charts,
        insights,
        generatedAt: new Date(),
    };
}

/**
 * Auto-discover relevant datasets for a research topic using AI
 * Extracts meaningful concepts and generates targeted search queries
 */
export async function discoverDatasetsForTopic(topic: string): Promise<string[]> {
    try {
        const prompt = `Analyze this research topic and suggest 4 dataset search queries that would find DATA relevant to this research.

Research Topic: "${topic}"

IMPORTANT: Think about what KIND of data would actually support this research:
- For software/programming topics: look for code quality metrics, software engineering surveys, developer productivity data
- For business/analytics topics: look for business performance data, analytics adoption surveys, organizational data
- For methodology topics: look for comparative studies, process metrics, team performance data

Example:
- Topic: "Role of Modular Python Design in Agile Business Analytics"
  Good queries: ["software development metrics", "agile team performance", "code quality datasets", "business analytics adoption"]
  Bad queries: ["role", "modular", "python", "design"] ← Too generic!

Respond with ONLY a JSON array of 4 specific, searchable queries (2-4 words each):
["query1", "query2", "query3", "query4"]`;

        const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const queries = JSON.parse(jsonMatch[0]);
            // Validate queries are meaningful (not just single common words)
            const validQueries = queries.filter((q: string) =>
                q.length > 3 && !['data', 'dataset', 'role', 'the', 'of', 'in', 'and'].includes(q.toLowerCase())
            );
            if (validQueries.length >= 2) {
                return validQueries.slice(0, 4);
            }
        }
    } catch (e) {
        console.error('Dataset discovery failed:', e);
    }

    // Smart fallback: extract key concepts, not just words
    const conceptPatterns = [
        /(?:modular|microservices?|component|architecture)/i,
        /(?:python|javascript|java|programming|software)/i,
        /(?:agile|scrum|devops|methodology)/i,
        /(?:analytics|business|data science|machine learning)/i,
        /(?:performance|metrics|quality|productivity)/i,
    ];

    const concepts: string[] = [];
    for (const pattern of conceptPatterns) {
        const match = topic.match(pattern);
        if (match) concepts.push(match[0].toLowerCase());
    }

    if (concepts.length >= 2) {
        return [
            `${concepts[0]} ${concepts[1]} data`,
            `${concepts.slice(0, 2).join(' ')} metrics`,
            'software engineering survey',
            'development productivity'
        ];
    }

    return ['software metrics', 'development survey', 'code quality', 'team performance'];
}


/**
 * Export chart as SVG string for embedding in papers
 */
export function chartToSVG(chart: ChartData): string {
    const width = 400;
    const height = 250;
    const padding = 40;

    if (chart.type === 'bar') {
        const barWidth = (width - padding * 2) / chart.labels.length - 10;
        const maxVal = Math.max(...chart.datasets[0].data);
        const scale = (height - padding * 2) / maxVal;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold">${chart.title}</text>`;

        chart.labels.forEach((label, i) => {
            const x = padding + i * (barWidth + 10);
            const barHeight = chart.datasets[0].data[i] * scale;
            const y = height - padding - barHeight;
            const color = chart.datasets[0].backgroundColor?.[i] || '#3b82f6';

            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2"/>`;
            svg += `<text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="10">${label.slice(0, 8)}</text>`;
        });

        svg += '</svg>';
        return svg;
    }

    // Simplified SVG for other chart types
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="14">${chart.title}</text>
    </svg>`;
}
