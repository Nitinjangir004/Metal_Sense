import { MetalSymbol, ConcentrationUnit } from '../types/index.js';

export interface MetalDefinition {
  symbol: MetalSymbol;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  defaultUnit: ConcentrationUnit;
  healthConcerns: string;
  synonyms: string[];
}

export const CANONICAL_METALS: Record<MetalSymbol, MetalDefinition> = {
  As: {
    symbol: 'As',
    name: 'Arsenic',
    atomicNumber: 33,
    atomicMass: 74.92,
    defaultUnit: 'ug/L',
    healthConcerns: 'Carcinogenic, skin lesions, peripheral neuropathy, cardiovascular disease.',
    synonyms: ['Arsenic', 'As', 'Total Arsenic', 'Inorganic Arsenic'],
  },
  Cd: {
    symbol: 'Cd',
    name: 'Cadmium',
    atomicNumber: 48,
    atomicMass: 112.41,
    defaultUnit: 'ug/L',
    healthConcerns: 'Renal dysfunction, bone damage (Itai-itai disease), pulmonary and hypertension risks.',
    synonyms: ['Cadmium', 'Cd', 'Total Cadmium'],
  },
  Cr: {
    symbol: 'Cr',
    name: 'Chromium',
    atomicNumber: 24,
    atomicMass: 52.0,
    defaultUnit: 'ug/L',
    healthConcerns: 'Hexavalent Cr(VI) is a potent carcinogen; skin ulceration, liver and kidney damage.',
    synonyms: ['Chromium', 'Cr', 'Total Chromium', 'Hexavalent Chromium', 'Cr(VI)'],
  },
  Cu: {
    symbol: 'Cu',
    name: 'Copper',
    atomicNumber: 29,
    atomicMass: 63.55,
    defaultUnit: 'mg/L',
    healthConcerns: 'Gastrointestinal distress; long-term exposure causes Wilson disease complications, liver toxicity.',
    synonyms: ['Copper', 'Cu', 'Total Copper'],
  },
  Fe: {
    symbol: 'Fe',
    name: 'Iron',
    atomicNumber: 26,
    atomicMass: 55.85,
    defaultUnit: 'mg/L',
    healthConcerns: 'Aesthetic degradation (taste, staining), hemochromatosis risk in chronic high doses.',
    synonyms: ['Iron', 'Fe', 'Total Iron', 'Ferrous Iron'],
  },
  Pb: {
    symbol: 'Pb',
    name: 'Lead',
    atomicNumber: 82,
    atomicMass: 207.2,
    defaultUnit: 'ug/L',
    healthConcerns: 'Neurotoxic, developmental impairment in children, encephalopathy, kidney damage.',
    synonyms: ['Lead', 'Pb', 'Total Lead', 'Plumbum'],
  },
  Mn: {
    symbol: 'Mn',
    name: 'Manganese',
    atomicNumber: 25,
    atomicMass: 54.94,
    defaultUnit: 'mg/L',
    healthConcerns: 'Neurotoxicity (manganism resembling Parkinsonism), neurological deficits in developing infants.',
    synonyms: ['Manganese', 'Mn', 'Total Manganese'],
  },
  Ni: {
    symbol: 'Ni',
    name: 'Nickel',
    atomicNumber: 28,
    atomicMass: 58.69,
    defaultUnit: 'ug/L',
    healthConcerns: 'Allergic contact dermatitis, respiratory issues, potential renal and carcinogenic effects.',
    synonyms: ['Nickel', 'Ni', 'Total Nickel'],
  },
  Zn: {
    symbol: 'Zn',
    name: 'Zinc',
    atomicNumber: 30,
    atomicMass: 65.38,
    defaultUnit: 'mg/L',
    healthConcerns: 'Astringent taste, gastrointestinal irritation, copper deficiency with chronic excess.',
    synonyms: ['Zinc', 'Zn', 'Total Zinc'],
  },
  Hg: {
    symbol: 'Hg',
    name: 'Mercury',
    atomicNumber: 80,
    atomicMass: 200.59,
    defaultUnit: 'ug/L',
    healthConcerns: 'Severe neurotoxicity (Minamata disease), renal failure, cognitive impairment.',
    synonyms: ['Mercury', 'Hg', 'Total Mercury', 'Hydrargyrum'],
  },
  Al: {
    symbol: 'Al',
    name: 'Aluminium',
    atomicNumber: 13,
    atomicMass: 26.98,
    defaultUnit: 'mg/L',
    healthConcerns: 'Neurological impairment, dialytic encephalopathy, discoloration and turbidity.',
    synonyms: ['Aluminium', 'Aluminum', 'Al', 'Total Aluminium'],
  },
  Ba: {
    symbol: 'Ba',
    name: 'Barium',
    atomicNumber: 56,
    atomicMass: 137.33,
    defaultUnit: 'mg/L',
    healthConcerns: 'Hypertension, cardiac arrhythmias, neuromuscular paralysis.',
    synonyms: ['Barium', 'Ba', 'Total Barium'],
  },
  Se: {
    symbol: 'Se',
    name: 'Selenium',
    atomicNumber: 34,
    atomicMass: 78.96,
    defaultUnit: 'ug/L',
    healthConcerns: 'Selenosis (hair/nail loss, peripheral neuropathy, tooth decay) at elevated chronic intake.',
    synonyms: ['Selenium', 'Se', 'Total Selenium'],
  },
};
