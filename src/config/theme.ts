/**
 * ALL visuals live here: colours, fonts, sizes. The renderer and the UI read only this file,
 * so the final design can be plugged in without touching game logic.
 * Source: Claude Design, direction « Plein Été » (day + night variants).
 */
export interface Theme {
  ground: string;
  verge: string;
  asphalt: string;
  line: string; // centre dashes
  curbA: string;
  curbB: string;
  warnA: string; // narrowing zones: yellow / black curbs
  warnB: string;
  car: string;
  carAccent: string;
  glass: string;
  lamp: string;
  shadow: string;
  track: string;
  trees: [string, string, string];
  treeHi: string;
  hay: string;
  dust: string[];
  spark: string[];
  wind: string; // wind streaks
  sign: string;
  signInk: string;
  mark: string; // chevrons painted before a narrowing
  headlights: string | null;
  vignette: string | null;
  score: string;
  scoreShadow: string;
  // UI
  uiInk: string;
  uiPanel: string;
  uiAccent: string; // cobalt
  uiYellow: string;
  uiYellowShadow: string;
  uiRed: string;
}

export type ThemeName = 'day' | 'night';

const day: Theme = {
  ground: '#9fd062',
  verge: '#e9d9a2',
  asphalt: '#5d6169',
  line: '#f6f2e4',
  curbA: '#e5432f',
  curbB: '#fbf7ee',
  warnA: '#ffc21a',
  warnB: '#2a2a2a',
  car: '#2563eb',
  carAccent: '#ffffff',
  glass: '#1b2440',
  lamp: '#fff6c8',
  shadow: 'rgba(28,52,18,.28)',
  track: 'rgba(40,40,45,.3)',
  trees: ['#3d8c3a', '#4f9e40', '#2f7a34'],
  treeHi: '#7cc35c',
  hay: '#f0d27a',
  dust: ['#e6d29a', '#d4bd7c', '#f2e6c0'],
  spark: ['#ffb020', '#ffe066'],
  wind: 'rgba(255,253,240,.9)',
  sign: '#ffc21a',
  signInk: '#2a2a2a',
  mark: '#ffc21a',
  headlights: null,
  vignette: null,
  score: '#ffffff',
  scoreShadow: '#24401a',
  uiInk: '#2a2a2a',
  uiPanel: '#fbf7ee',
  uiAccent: '#2563eb',
  uiYellow: '#ffc21a',
  uiYellowShadow: '#b88700',
  uiRed: '#e5432f',
};

const night: Theme = {
  ...day,
  ground: '#1d3a33',
  verge: '#3b3a2d',
  asphalt: '#2b2e37',
  line: '#c9ccbd',
  curbA: '#c2372c',
  curbB: '#d6d3c8',
  car: '#3b7bff',
  trees: ['#14302a', '#193a32', '#102822'],
  treeHi: '#22493d',
  hay: '#4a4630',
  dust: ['#4a4a3c', '#5a5846', '#3c3c30'],
  wind: 'rgba(200,230,255,.4)',
  shadow: 'rgba(0,0,0,.35)',
  track: 'rgba(0,0,0,.35)',
  headlights: 'rgba(255,240,190,.32)',
  vignette: 'rgba(3,9,16,.66)',
  scoreShadow: '#000000',
  uiPanel: '#1a2b27',
  uiInk: '#ffffff',
};

export const themes: Record<ThemeName, Theme> = { day, night };

export const fonts = {
  display: '"Bowlby One", Impact, "Arial Black", sans-serif', // titles, score
  ui: '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
};

/** Sizes in world units (the screen is 360 units wide). */
export const sizes = {
  curbWidth: 6,
  vergeWidth: 10,
  curbStripe: 16,
  centerLineWidth: 3,
  centerDash: [18, 24] as [number, number],
  trackWidth: 2.6,
  treeEvery: 7, // samples
  carScale: 0.6, // the design draws a 26×50 car; physics hitbox is 18×30
  scoreFontPx: 56, // CSS px
};
