import { RegulatoryStandard } from '../types/index.js';

export const BIS_10500_2012: RegulatoryStandard = {
  id: 'std_bis_10500_2012',
  code: 'BIS_10500_2012',
  title: 'Indian Standard Drinking Water — Specification (IS 10500:2012, Second Revision)',
  issuingOrganization: 'Bureau of Indian Standards (BIS)',
  jurisdiction: 'India',
  matrix: 'groundwater',
  version: '2012 (incl. 2015 Amendment No. 1 & 2)',
  publicationYear: 2012,
  sourceUrl: 'https://archive.org/details/gov.in.is.10500.2012',
  citation:
    'Bureau of Indian Standards (BIS). IS 10500: 2012 Drinking Water — Specification (Second Revision). New Delhi: BIS, 2012.',
  isDefault: true,
  limits: {
    As: {
      symbol: 'As',
      acceptableLimit: 0.01, // mg/L (10 ug/L)
      permissibleLimit: 0.05, // mg/L (in absence of alternate source)
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Carcinogenic risk. BIS Amendment 2 notes 0.01 mg/L is mandatory where possible.',
    },
    Cd: {
      symbol: 'Cd',
      acceptableLimit: 0.003, // mg/L (3 ug/L)
      permissibleLimit: 0.003, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Toxic heavy metal; no relaxation beyond 0.003 mg/L.',
    },
    Cr: {
      symbol: 'Cr',
      acceptableLimit: 0.05, // mg/L (50 ug/L) Total Chromium
      permissibleLimit: 0.05, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Total Chromium limit. Hexavalent chromium Cr(VI) limit is 0.05 mg/L.',
    },
    Cu: {
      symbol: 'Cu',
      acceptableLimit: 0.05, // mg/L (50 ug/L)
      permissibleLimit: 1.5, // mg/L
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Astringent taste and gastrointestinal irritation at elevated concentrations.',
    },
    Fe: {
      symbol: 'Fe',
      acceptableLimit: 0.3, // mg/L (300 ug/L)
      permissibleLimit: 1.0, // mg/L (Amendment No. 1, 2015 updated to 1.0 mg/L in absence of alternate source)
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Aesthetic, staining, and metallic taste concerns.',
    },
    Pb: {
      symbol: 'Pb',
      acceptableLimit: 0.01, // mg/L (10 ug/L)
      permissibleLimit: 0.01, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Cumulative toxicant causing neurodevelopmental delays.',
    },
    Mn: {
      symbol: 'Mn',
      acceptableLimit: 0.1, // mg/L (100 ug/L)
      permissibleLimit: 0.3, // mg/L
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Neurological impact at chronic high concentrations; black precipitate.',
    },
    Ni: {
      symbol: 'Ni',
      acceptableLimit: 0.02, // mg/L (20 ug/L)
      permissibleLimit: 0.02, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Allergenic and toxic threshold.',
    },
    Zn: {
      symbol: 'Zn',
      acceptableLimit: 5.0, // mg/L (5000 ug/L)
      permissibleLimit: 15.0, // mg/L
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Essential trace element; opalescence and astringent taste above 5 mg/L.',
    },
    Hg: {
      symbol: 'Hg',
      acceptableLimit: 0.001, // mg/L (1 ug/L) Total Mercury
      permissibleLimit: 0.001, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Extreme toxicity; bioaccumulative neurotoxin.',
    },
    Al: {
      symbol: 'Al',
      acceptableLimit: 0.03, // mg/L
      permissibleLimit: 0.2, // mg/L
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Neurological concerns and post-flocculation turbidity.',
    },
    Ba: {
      symbol: 'Ba',
      acceptableLimit: 0.7, // mg/L
      permissibleLimit: 0.7, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Cardiovascular risks.',
    },
    Se: {
      symbol: 'Se',
      acceptableLimit: 0.01, // mg/L
      permissibleLimit: 0.01, // No relaxation
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Selenosis threshold.',
    },
  },
};

export const WHO_GDWQ_4TH_ED: RegulatoryStandard = {
  id: 'std_who_gdwq_4th',
  code: 'WHO_GDWQ_4TH',
  title: 'WHO Guidelines for Drinking-water Quality (Fourth Edition)',
  issuingOrganization: 'World Health Organization (WHO)',
  jurisdiction: 'International_WHO',
  matrix: 'drinking_water',
  version: '4th Edition (incorporating 1st and 2nd addenda)',
  publicationYear: 2022,
  sourceUrl: 'https://www.who.int/publications/i/item/9789240045064',
  citation:
    'World Health Organization. Guidelines for drinking-water quality: fourth edition incorporating the first and second addenda. Geneva: WHO, 2022.',
  isDefault: false,
  limits: {
    As: {
      symbol: 'As',
      acceptableLimit: 0.01, // 10 ug/L provisional guideline value
      permissibleLimit: 0.01,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Provisional guideline value due to analytical measurement limitations.',
    },
    Cd: {
      symbol: 'Cd',
      acceptableLimit: 0.003, // 3 ug/L
      permissibleLimit: 0.003,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Kidney cortex accumulation guideline.',
    },
    Cr: {
      symbol: 'Cr',
      acceptableLimit: 0.05, // 50 ug/L provisional
      permissibleLimit: 0.05,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Total chromium provisional guideline.',
    },
    Cu: {
      symbol: 'Cu',
      acceptableLimit: 2.0, // 2000 ug/L
      permissibleLimit: 2.0,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Protective against acute gastrointestinal effects.',
    },
    Fe: {
      symbol: 'Fe',
      acceptableLimit: 0.3, // Taste/appearance guideline, no health-based guideline necessary
      permissibleLimit: 0.3,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Taste threshold usually between 0.1 and 0.3 mg/L.',
    },
    Pb: {
      symbol: 'Pb',
      acceptableLimit: 0.01, // 10 ug/L provisional
      permissibleLimit: 0.01,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Provisional guideline value; lead is toxic to central nervous system.',
    },
    Mn: {
      symbol: 'Mn',
      acceptableLimit: 0.08, // 80 ug/L updated WHO provisional value
      permissibleLimit: 0.4,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Neurological endpoint consideration.',
    },
    Ni: {
      symbol: 'Ni',
      acceptableLimit: 0.07, // 70 ug/L
      permissibleLimit: 0.07,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Soluble salts guideline value.',
    },
    Zn: {
      symbol: 'Zn',
      acceptableLimit: 3.0, // Not of health concern at drinking levels; aesthetic threshold ~3 mg/L
      permissibleLimit: 5.0,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Aesthetic guideline value.',
    },
    Hg: {
      symbol: 'Hg',
      acceptableLimit: 0.006, // 6 ug/L for inorganic mercury
      permissibleLimit: 0.006,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Guideline for total inorganic mercury.',
    },
    Al: {
      symbol: 'Al',
      acceptableLimit: 0.1, // 100 ug/L operational guideline
      permissibleLimit: 0.2,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Compromises disinfection efficiency if coagulant residual exceeds 0.2 mg/L.',
    },
    Ba: {
      symbol: 'Ba',
      acceptableLimit: 1.3, // 1300 ug/L
      permissibleLimit: 1.3,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Cardiovascular effects guideline.',
    },
    Se: {
      symbol: 'Se',
      acceptableLimit: 0.04, // 40 ug/L
      permissibleLimit: 0.04,
      unit: 'mg/L',
      idealLimit: 0,
      notes: 'Selenosis threshold.',
    },
  },
};

export const STANDARD_REGISTRY: Record<string, RegulatoryStandard> = {
  BIS_10500_2012,
  WHO_GDWQ_4TH: WHO_GDWQ_4TH_ED,
};
