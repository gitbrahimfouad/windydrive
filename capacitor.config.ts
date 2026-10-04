import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.windydrive.app',
  appName: 'Windy Drive',
  webDir: 'dist',
  backgroundColor: '#9fd062',
  ios: { contentInset: 'never', backgroundColor: '#9fd062' },
  android: { backgroundColor: '#9fd062' },
  plugins: {
    // Immersive game: system bars hidden from launch; Capacitor injects --safe-area-inset-* on older WebViews.
    SystemBars: { hidden: true, insetsHandling: 'css' },
  },
};

export default config;
