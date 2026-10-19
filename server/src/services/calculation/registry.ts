export interface IndexMethodMetadata {
  code: string;
  version: string;
  name: string;
  citation: string;
  doi?: string;
  publicationYear: number;
  applicableMatrix: ('drinking_water' | 'groundwater' | 'surface_water')[];
  formulaDisplay: string;
  description: string;
  parameters: {
    name: string;
    description: string;
    defaultValue?: number;
  }[];
  thresholds: {
    category: string;
    range: string;
    condition: (val: number) => boolean;
    description: string;
  }[];
}

export const CALCULATION_METHOD_REGISTRY: Record<string, IndexMethodMetadata> = {
  HPI_MOHAN_1996: {
    code: 'HPI_MOHAN_1996',
    version: '1.0.0',
    name: 'Heavy Metal Pollution Index (HPI)',
    citation:
      'Mohan, S. V., Nithila, P., & Reddy, S. J. (1996). Estimation of heavy metal in drinking water and development of heavy metal pollution index. Journal of Environmental Science & Health Part A, 31(2), 283-289.',
    doi: '10.1080/10934529609376357',
    publicationYear: 1996,
    applicableMatrix: ['drinking_water', 'groundwater', 'surface_water'],
    formulaDisplay: 'HPI = (Σ Wi · Qi) / (Σ Wi)',
    description:
      'Weighted composite rating model where individual weightage Wi is inversely proportional to permissible standard limit Si (k = 1), and Qi is the sub-index calculated against ideal and permissible limits.',
    parameters: [
      { name: 'k', description: 'Constant of proportionality for unit weighting', defaultValue: 1 },
      { name: 'Threshold', description: 'Critical contamination boundary', defaultValue: 100 },
    ],
    thresholds: [
      {
        category: 'low',
        range: 'HPI < 25',
        condition: (val) => val < 25,
        description: 'Low heavy metal pollution burden; excellent drinking suitability.',
      },
      {
        category: 'medium',
        range: '25 <= HPI < 100',
        condition: (val) => val >= 25 && val < 100,
        description: 'Moderate heavy metal pollution; within allowable statutory range.',
      },
      {
        category: 'high',
        range: 'HPI >= 100',
        condition: (val) => val >= 100,
        description: 'Critical pollution; aggregate water suitability threshold exceeded.',
      },
    ],
  },

  HEI_EDET_OFFIONG_2002: {
    code: 'HEI_EDET_OFFIONG_2002',
    version: '1.0.0',
    name: 'Heavy Metal Evaluation Index (HEI)',
    citation:
      'Edet, A. E., & Offiong, O. E. (2002). Evaluation of water quality index for heavy metal in groundwaters of Calabar, SE Nigeria. Environmental Geology, 42(7), 776-783.',
    doi: '10.1007/s00254-002-0579-2',
    publicationYear: 2002,
    applicableMatrix: ['drinking_water', 'groundwater'],
    formulaDisplay: 'HEI = Σ (Hc / Hmac)',
    description:
      'Direct ratio sum of measured concentration Hc divided by the statutory maximum admissible concentration (Hmac).',
    parameters: [
      { name: 'Hmac', description: 'Maximum Admissible Concentration from selected standard' },
    ],
    thresholds: [
      {
        category: 'low',
        range: 'HEI < 10',
        condition: (val) => val < 10,
        description: 'Low contamination level.',
      },
      {
        category: 'medium',
        range: '10 <= HEI <= 20',
        condition: (val) => val >= 10 && val <= 20,
        description: 'Medium contamination level; requires periodic monitoring.',
      },
      {
        category: 'high',
        range: 'HEI > 20',
        condition: (val) => val > 20,
        description: 'High contamination level exceeding toxicological bounds.',
      },
    ],
  },

  CD_BACKMAN_1998: {
    code: 'CD_BACKMAN_1998',
    version: '1.0.0',
    name: 'Degree of Contamination (Cd)',
    citation:
      'Backman, B., Bodiš, D., Lahermo, P., Rapant, S., & Tarvainen, T. (1998). Application of a summary environmental and quality index for contaminated waters. Environmental Geology, 36(1-2), 55-64.',
    doi: '10.1007/s002540050323',
    publicationYear: 1998,
    applicableMatrix: ['groundwater', 'drinking_water'],
    formulaDisplay: 'Cd = Σ Cfi, where Cfi = (CAi / CNi) - 1',
    description:
      'Sum of contamination factors Cfi quantifying degradation relative to baseline upper allowable concentrations CNi.',
    parameters: [
      { name: 'CNi', description: 'Baseline reference / acceptable limit' },
    ],
    thresholds: [
      {
        category: 'low',
        range: 'Cd < 1',
        condition: (val) => val < 1,
        description: 'Low degree of contamination.',
      },
      {
        category: 'medium',
        range: '1 <= Cd <= 3',
        condition: (val) => val >= 1 && val <= 3,
        description: 'Medium degree of contamination.',
      },
      {
        category: 'high',
        range: 'Cd > 3',
        condition: (val) => val > 3,
        description: 'High degree of contamination; substantial aquifer impact.',
      },
    ],
  },
};
