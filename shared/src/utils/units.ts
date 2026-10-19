import { ConcentrationUnit } from '../types/index.js';

/**
 * Normalizes a concentration to a target unit.
 * Supports mg/L, ug/L, ppm, ppb (for aqueous solutions where 1 L ~ 1 kg, ppm == mg/L, ppb == ug/L).
 */
export function convertConcentration(
  value: number,
  fromUnit: ConcentrationUnit,
  toUnit: ConcentrationUnit
): number {
  if (value < 0) {
    throw new Error('Concentration cannot be negative');
  }
  if (fromUnit === toUnit) {
    return value;
  }

  // Convert fromUnit to base unit: ug/L
  let valueInUgL: number;
  switch (fromUnit) {
    case 'ug/L':
    case 'ppb':
      valueInUgL = value;
      break;
    case 'mg/L':
    case 'ppm':
      valueInUgL = value * 1000;
      break;
    default:
      throw new Error(`Unsupported source unit: ${fromUnit}`);
  }

  // Convert base unit (ug/L) to toUnit
  switch (toUnit) {
    case 'ug/L':
    case 'ppb':
      return valueInUgL;
    case 'mg/L':
    case 'ppm':
      return valueInUgL / 1000;
    default:
      throw new Error(`Unsupported target unit: ${toUnit}`);
  }
}

/**
 * Rounds a number to a specified number of significant decimal places without floating point precision issues.
 */
export function roundToPrecision(val: number, decimals: number = 4): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
