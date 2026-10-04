export type Lang = 'fr' | 'en';

const dict = {
  fr: {
    tapToPlay: 'Tape pour jouer',
    hint: 'Chaque tap braque contre le vent',
    record: 'RECORD',
    wind: 'VENT',
    left: '← Gauche',
    right: 'Droite →',
    soundOn: 'Son activé',
    soundOff: 'Son coupé',
    leaderboard: 'Classement',
    leaderboardSignIn: 'Connecte-toi à Game Center (Réglages) pour voir le classement',
    leaderboardSignInAndroid: 'Connecte-toi à Google Play Jeux pour voir le classement',
    offRoad: 'Sortie de route',
    meters: 'mètres',
    newRecord: 'Nouveau record !',
    prevRecord: 'Ancien record',
    almost: 'Plus que {n} m !',
    bestIs: 'Record {n} m',
    replay: 'Rejouer',
    share: 'Partager',
    orTap: "ou tape n'importe où pour relancer",
    menu: 'Menu',
    dark: 'Mode nuit',
    light: 'Mode jour',
    language: 'Langue',
    shareText: "J'ai tenu {n} m sur Windy Drive. Tu feras mieux ?",
    shareBrag: "J'ai tenu",
    shareChallenge: 'Tu feras mieux ?',
    shareFooter: 'Windy Drive · gratuit sur iOS et Android',
    shareError: "Partage impossible",
  },
  en: {
    tapToPlay: 'Tap to play',
    hint: 'Every tap steers against the wind',
    record: 'BEST',
    wind: 'WIND',
    left: '← Left',
    right: 'Right →',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    leaderboard: 'Leaderboard',
    leaderboardSignIn: 'Sign in to Game Center (Settings) to see the leaderboard',
    leaderboardSignInAndroid: 'Sign in to Google Play Games to see the leaderboard',
    offRoad: 'Off the road',
    meters: 'meters',
    newRecord: 'New record!',
    prevRecord: 'Previous best',
    almost: 'Only {n} m to go!',
    bestIs: 'Best {n} m',
    replay: 'Play again',
    share: 'Share',
    orTap: 'or tap anywhere to restart',
    menu: 'Menu',
    dark: 'Night mode',
    light: 'Day mode',
    language: 'Language',
    shareText: 'I lasted {n} m on Windy Drive. Can you beat it?',
    shareBrag: 'I lasted',
    shareChallenge: 'Can you beat it?',
    shareFooter: 'Windy Drive · free on iOS and Android',
    shareError: 'Could not share',
  },
} as const;

export type Key = keyof (typeof dict)['fr'];

/** Default language: English, whatever the device language. The player can switch to French (saved). */
export const DEFAULT_LANG: Lang = 'en';
let lang: Lang = DEFAULT_LANG;

export function setLang(l: Lang): void {
  lang = l;
  document.documentElement.lang = l;
}
export function getLang(): Lang {
  return lang;
}
export function t(key: Key, vars?: Record<string, string | number>): string {
  let s: string = dict[lang][key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
export function formatMeters(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US').replace(/\s/g, ' ');
}
