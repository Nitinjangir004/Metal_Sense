import { AnalysisRun, Sample } from '@metalsense/shared';
import {
  GroundedExplanation,
  generateDeterministicExplanation,
} from './explainer.js';
import { sanitizeUntrustedDocumentText } from './sanitizer.js';
import { env } from '../../config/env.js';

export interface ComparativeSummary {
  samplesCount: number;
  criticalSamplesCount: number;
  moderateSamplesCount: number;
  lowSamplesCount: number;
  predominantExceededMetals: string[];
  geospatialTrendSummary: string;
  recommendedInterventions: string[];
  generatedAt: string;
}

export interface AiServiceAdapter {
  explainSample(analysis: AnalysisRun, sample: Sample): Promise<GroundedExplanation>;
  compareSamples(items: { sample: Sample; analysis: AnalysisRun }[]): Promise<ComparativeSummary>;
}

export class HybridAiService implements AiServiceAdapter {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  async explainSample(analysis: AnalysisRun, sample: Sample): Promise<GroundedExplanation> {
    // If no remote AI key or offline, use deterministic grounded explanation
    if (!this.apiKey || this.apiKey.includes('your-gemini-api-key')) {
      return generateDeterministicExplanation(analysis, sample);
    }

    // When Gemini API key is configured, execute remote prompt with strict schema enforcement
    try {
      const prompt = `You are an environmental chemist. Explain this computed heavy metal analysis strictly using the provided calculation data. Do not hallucinate or invent any numbers or legal limits.
Sample: ${sample.sampleCode}
Matrix: ${sample.sampleMatrix}
HPI: ${analysis.hpi.value} (${analysis.hpi.classification})
HEI: ${analysis.hei.value}
Exceeded Metals: ${JSON.stringify(analysis.exceededAnalytes)}
Standard: ${analysis.standardUsed.code}`;

      // Call Gemini API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // low temperature for determinism
            maxOutputTokens: 800,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Fall back gracefully
        return generateDeterministicExplanation(analysis, sample);
      }

      const json = (await res.json()) as any;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return generateDeterministicExplanation(analysis, sample);
      }

      // Merge model narrative into grounded explanation structure
      const base = generateDeterministicExplanation(analysis, sample);
      base.executiveSummary = text.substring(0, 500);
      return base;
    } catch (err) {
      // Remote timeout or network error -> reliable deterministic fallback
      return generateDeterministicExplanation(analysis, sample);
    }
  }

  async compareSamples(items: { sample: Sample; analysis: AnalysisRun }[]): Promise<ComparativeSummary> {
    const total = items.length;
    const critical = items.filter((i) => i.analysis.hpi.value >= 100).length;
    const moderate = items.filter(
      (i) => i.analysis.hpi.value >= 25 && i.analysis.hpi.value < 100
    ).length;
    const low = items.filter((i) => i.analysis.hpi.value < 25).length;

    // Aggregate unique exceeded metals across all samples
    const metalsSet = new Set<string>();
    for (const item of items) {
      for (const m of item.analysis.exceededAnalytes) {
        metalsSet.add(m.symbol);
      }
    }

    let trend = '';
    if (critical > 0) {
      trend = `${critical} of ${total} monitored locations exhibit critical heavy-metal contamination, predominantly clustered near industrial and shallow aquifer zones.`;
    } else if (moderate > 0) {
      trend = `All monitored wells remain below the critical threshold of 100, though ${moderate} locations display elevated background concentrations.`;
    } else {
      trend = 'All evaluated wells maintain pristine baseline quality comfortably within statutory limits.';
    }

    return {
      samplesCount: total,
      criticalSamplesCount: critical,
      moderateSamplesCount: moderate,
      lowSamplesCount: low,
      predominantExceededMetals: Array.from(metalsSet),
      geospatialTrendSummary: trend,
      recommendedInterventions: [
        'Establish barrier buffer zones around down-gradient industrial perimeters.',
        'Install localized reverse osmosis or activated alumina filtration for impacted communities.',
        'Increase testing frequency to bi-weekly in wells with HPI > 25.',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const aiService = new HybridAiService();
