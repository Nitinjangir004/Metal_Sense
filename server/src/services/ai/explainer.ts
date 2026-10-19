import { AnalysisRun, Sample, CANONICAL_METALS } from '@metalsense/shared';

export interface GroundedExplanation {
  sampleCode: string;
  overallCategory: string;
  hpiScore: number;
  hpiClassification: string;
  heiScore: number;
  cdScore: number;
  executiveSummary: string;
  exceededMetalsBreakdown: {
    symbol: string;
    name: string;
    monitored: number;
    permissible: number;
    excessRatio: number;
    healthContext: string;
  }[];
  suggestedActionableChecks: string[];
  scientificLimitations: string[];
  provenance: {
    groundedInAnalysisId: string;
    engineVersion: string;
    standardCitation: string;
    generatedAt: string;
  };
}

/**
 * Deterministic Grounded Explanation Engine.
 * Formulates natural-language explanations strictly from verified calculation outputs
 * and canonical toxicological references, preventing hallucinations or medical claims.
 */
export function generateDeterministicExplanation(
  analysis: AnalysisRun,
  sample: Sample
): GroundedExplanation {
  const hpi = analysis.hpi;
  const standard = analysis.standardUsed;

  // 1. Executive Summary
  let summary = '';
  if (hpi.value >= hpi.thresholdValue) {
    summary = `Sample ${sample.sampleCode} exhibits critical heavy-metal contamination with an HPI score of ${hpi.value.toFixed(1)}, exceeding the statutory threshold of 100 under ${standard.code}. This indicates significant degradation of the local aquifer.`;
  } else if (hpi.value >= 25) {
    summary = `Sample ${sample.sampleCode} demonstrates moderate heavy-metal contamination with an HPI score of ${hpi.value.toFixed(1)} (below the critical threshold of 100). Selected metal concentrations warrant ongoing surveillance.`;
  } else {
    summary = `Sample ${sample.sampleCode} exhibits low heavy-metal contamination with an HPI score of ${hpi.value.toFixed(1)} (well below the threshold of 100), reflecting baseline groundwater quality under ${standard.code}.`;
  }

  // 2. Exceeded Metals Breakdown
  const exceededBreakdown = analysis.exceededAnalytes.map((m) => {
    const metalDef = CANONICAL_METALS[m.symbol];
    return {
      symbol: m.symbol,
      name: metalDef?.name || m.symbol,
      monitored: m.monitored,
      permissible: m.permissible,
      excessRatio: m.ratio,
      healthContext:
        metalDef?.healthConcerns ||
        `Concentration is ${m.ratio.toFixed(1)}× above the maximum permissible limit.`,
    };
  });

  // 3. Actionable Follow-up Checks
  const checks: string[] = [];
  if (analysis.exceededAnalytes.length > 0) {
    checks.push(
      `Conduct confirmatory re-testing using High-Resolution ICP-MS or AAS for ${analysis.exceededAnalytes.map((m) => m.symbol).join(', ')}.`
    );
    checks.push(
      'Perform hydrogeological spatial survey of up-gradient wells within 500 meters to isolate industrial vs natural geogenic sources.'
    );
  }
  if (analysis.hpi.missingAnalytes && analysis.hpi.missingAnalytes.length > 0) {
    checks.push(
      `Expand analytical suite to quantify missing standard analytes: ${analysis.hpi.missingAnalytes.join(', ')}.`
    );
  }
  if (analysis.lodStrategy === 'half_lod') {
    checks.push(
      'Verify whether highly sensitive trace LOD instruments can replace censored (<LOD) estimates.'
    );
  }
  if (checks.length === 0) {
    checks.push('Maintain routine seasonal groundwater monitoring protocol.');
  }

  // 4. Limitations and Caveats (Anti-hallucination guardrails)
  const limitations = [
    'Pollution indices evaluate heavy-metal burden only and do not assess microbiological, organic (pesticide/VOC), or radiological water quality.',
    'This evaluation is an environmental computational analysis and does not constitute a certified medical diagnosis or official potability certification.',
    `Calculations are referenced exclusively against ${standard.citation}.`,
  ];

  return {
    sampleCode: sample.sampleCode,
    overallCategory: analysis.overallPollutionCategory,
    hpiScore: hpi.value,
    hpiClassification: hpi.classification,
    heiScore: analysis.hei.value,
    cdScore: analysis.cd.value,
    executiveSummary: summary,
    exceededMetalsBreakdown: exceededBreakdown,
    suggestedActionableChecks: checks,
    scientificLimitations: limitations,
    provenance: {
      groundedInAnalysisId: analysis.id,
      engineVersion: analysis.auditTrail.engineVersion,
      standardCitation: standard.citation,
      generatedAt: new Date().toISOString(),
    },
  };
}
