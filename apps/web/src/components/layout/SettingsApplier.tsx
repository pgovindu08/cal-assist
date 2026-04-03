'use client';

import { useEffect } from 'react';
import { useSettingsStore, type Theme } from '@/store/settingsStore';

// ── Per-theme CSS variable definitions ────────────────────────────────────────
// --cal-primary-rgb is "R, G, B" so components can do rgba(var(--cal-primary-rgb), 0.2)
// --primary is the shadcn HSL value that drives bg-primary / text-primary Tailwind classes

const THEME_VARS: Record<Theme, Record<string, string>> = {
  midnight: {
    '--cal-primary':     '#1A56DB',
    '--cal-primary-rgb': '26, 86, 219',
    '--cal-secondary':   '#7E3AF2',
    '--cal-bg':          '#0D0F1A',
    '--cal-surface':     '#141727',
    '--primary':         '221 74% 48%',
    '--ring':            '221 74% 48%',
  },
  aurora: {
    '--cal-primary':     '#059669',
    '--cal-primary-rgb': '5, 150, 105',
    '--cal-secondary':   '#06B6D4',
    '--cal-bg':          '#071310',
    '--cal-surface':     '#0B1D18',
    '--primary':         '161 94% 30%',
    '--ring':            '161 94% 30%',
  },
  sunset: {
    '--cal-primary':     '#D97706',
    '--cal-primary-rgb': '217, 119, 6',
    '--cal-secondary':   '#E02424',
    '--cal-bg':          '#150E07',
    '--cal-surface':     '#1E1509',
    '--primary':         '38 92% 44%',
    '--ring':            '38 92% 44%',
  },
  ocean: {
    '--cal-primary':     '#0891B2',
    '--cal-primary-rgb': '8, 145, 178',
    '--cal-secondary':   '#22D3EE',
    '--cal-bg':          '#07101A',
    '--cal-surface':     '#0C1825',
    '--primary':         '195 93% 37%',
    '--ring':            '195 93% 37%',
  },
  monochrome: {
    '--cal-primary':     '#6B7280',
    '--cal-primary-rgb': '107, 114, 128',
    '--cal-secondary':   '#9CA3AF',
    '--cal-bg':          '#0A0A0A',
    '--cal-surface':     '#141414',
    '--primary':         '220 9% 46%',
    '--ring':            '220 9% 46%',
  },
  forest: {
    '--cal-primary':     '#15803D',
    '--cal-primary-rgb': '21, 128, 61',
    '--cal-secondary':   '#4ADE80',
    '--cal-bg':          '#070F08',
    '--cal-surface':     '#0C160D',
    '--primary':         '142 71% 29%',
    '--ring':            '142 71% 29%',
  },
  rose: {
    '--cal-primary':     '#E11D48',
    '--cal-primary-rgb': '225, 29, 72',
    '--cal-secondary':   '#FB7185',
    '--cal-bg':          '#140609',
    '--cal-surface':     '#200C10',
    '--primary':         '345 76% 50%',
    '--ring':            '345 76% 50%',
  },
};

const FONT_SIZES: Record<string, string> = {
  small:   '13px',
  default: '15px',
  large:   '17px',
};

export function SettingsApplier() {
  const { theme, fontSizeScale, cardStyle, sidebarStyle } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const vars = THEME_VARS[theme];

    // Apply all theme CSS vars
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    // Font size
    root.style.setProperty('--cal-font-base', FONT_SIZES[fontSizeScale] ?? '15px');
    root.style.fontSize = FONT_SIZES[fontSizeScale] ?? '15px';

    // Card style data attribute (used by CSS rules in globals.css)
    root.setAttribute('data-card-style', cardStyle);
    root.setAttribute('data-sidebar', sidebarStyle);
  }, [theme, fontSizeScale, cardStyle, sidebarStyle]);

  return null;
}
