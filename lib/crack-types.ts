import { CrackType } from '@/lib/types';

export const DPWH_CRACK_TYPES: CrackType[] = [
  'transverse',
  'longitudinal',
  'block',
  'corner',
  'diagonal',
  'meandering',
  'reflection',
];

export const SUPPORTED_CRACK_TYPES = DPWH_CRACK_TYPES;

export const CRACK_TYPE_DETAILS: Record<CrackType, { label: string; description: string }> = {
  transverse: {
    label: 'Transverse crack',
    description: 'An unconnected crack running across the pavement or slab.',
  },
  longitudinal: {
    label: 'Longitudinal crack',
    description: 'An unconnected crack running lengthwise along the pavement or slab.',
  },
  block: {
    label: 'Block crack',
    description: 'Interconnected cracks forming roughly rectangular blocks, commonly spread across the pavement; cells are usually larger than 1 m.',
  },
  corner: {
    label: 'Corner crack',
    description: 'A crack extending diagonally from a longitudinal edge to a transverse joint.',
  },
  diagonal: {
    label: 'Diagonal crack',
    description: 'An unconnected crack running diagonally across a pavement or slab.',
  },
  meandering: {
    label: 'Meandering crack',
    description: 'An unconnected, irregular crack following a winding path.',
  },
  reflection: {
    label: 'Reflection crack',
    description: 'A crack in asphalt that mirrors joints in the underlying concrete.',
  },
};

export function getCrackTypeDetails(type: CrackType) {
  return CRACK_TYPE_DETAILS[type];
}