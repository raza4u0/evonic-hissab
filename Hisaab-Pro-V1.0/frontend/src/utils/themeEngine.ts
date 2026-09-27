import { Company } from '../types';

export interface ThemePreset {
  id: string;
  name: string;
  hex: string;
  hoverHex: string;
  category: 'Emerald' | 'Corporate' | 'Modern' | 'Vibrant' | 'Classic';
  description: string;
}

export const PRESET_THEME_COLORS: ThemePreset[] = [
  {
    id: 'qb-green',
    name: 'QuickBooks Classic Green',
    hex: '#2CA01C',
    hoverHex: '#228014',
    category: 'Classic',
    description: 'The standard trusted financial green for Hisaab Pro'
  },
  {
    id: 'emerald-uae',
    name: 'Royal UAE Emerald',
    hex: '#10B981',
    hoverHex: '#059669',
    category: 'Emerald',
    description: 'Fresh GCC institutional emerald green'
  },
  {
    id: 'royal-indigo',
    name: 'Enterprise Indigo',
    hex: '#4F46E5',
    hoverHex: '#4338CA',
    category: 'Corporate',
    description: 'Modern executive indigo blue for corporate reporting'
  },
  {
    id: 'ocean-blue',
    name: 'Dubai Marine Blue',
    hex: '#2563EB',
    hoverHex: '#1D4ED8',
    category: 'Corporate',
    description: 'High-visibility vibrant blue favored by commercial portals'
  },
  {
    id: 'crimson-teal',
    name: 'Modern GCC Teal',
    hex: '#0D9488',
    hoverHex: '#0F766E',
    category: 'Modern',
    description: 'Balanced teal blue-green aesthetic'
  },
  {
    id: 'imperial-purple',
    name: 'Imperial Purple',
    hex: '#9333EA',
    hoverHex: '#7E22CE',
    category: 'Vibrant',
    description: 'Distinctive premium brand violet'
  },
  {
    id: 'amber-gold',
    name: 'Abu Dhabi Gold',
    hex: '#D97706',
    hoverHex: '#B45309',
    category: 'Vibrant',
    description: 'Warm luxury golden amber palette'
  },
  {
    id: 'rose-crimson',
    name: 'Crimson Red',
    hex: '#E11D48',
    hoverHex: '#BE123C',
    category: 'Vibrant',
    description: 'Bold high-contrast scarlet red'
  },
  {
    id: 'slate-dark',
    name: 'Minimalist Slate',
    hex: '#475569',
    hoverHex: '#334155',
    category: 'Modern',
    description: 'Subtle charcoal slate gray'
  }
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    if (/^[0-9A-Fa-f]{3}$/.test(cleanHex)) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r, g, b };
    }
    return null;
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function adjustLightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  
  // If amount is negative, darken; if positive, lighten
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function applyThemeToCssVariables(primaryHex: string): string {
  const rgb = hexToRgb(primaryHex) || { r: 44, g: 160, b: 28 };
  const validHex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
  
  const hoverHex = adjustLightness(validHex, -25);
  const darkHex = adjustLightness(validHex, -45);
  const lightHex = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
  const ringRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--qb-green', validHex);
    root.style.setProperty('--qb-green-hover', hoverHex);
    root.style.setProperty('--qb-green-light', lightHex);
    root.style.setProperty('--qb-navy', darkHex);
    root.style.setProperty('--qb-green-ring', ringRgba);

    root.style.setProperty('--primary-color', validHex);
    root.style.setProperty('--primary-hover', hoverHex);
    root.style.setProperty('--primary-light', lightHex);
    root.style.setProperty('--primary-ring', ringRgba);
  }

  return validHex;
}

export function initAppTheme(company?: Company): string {
  const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('hisaab_theme_primary_color') : null;
  const targetColor = company?.themePrimaryColor || storedTheme || '#2CA01C';
  applyThemeToCssVariables(targetColor);
  return targetColor;
}
