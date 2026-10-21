# Assets pour les stores (générés par `npm run store`)

| Dossier / fichier | Où l'utiliser |
|---|---|
| `ios/app-icon-1024.png` | App Store Connect → Informations de l'app → icône (1024×1024, sans transparence) |
| `ios/iphone-6.9in_1320x2868/{fr,en}` | Captures iPhone 6,9" (obligatoire) |
| `ios/iphone-6.5in_1284x2778/{fr,en}` | Captures iPhone 6,5" (si demandé) |
| `ios/iphone-6.1in_1179x2556/{fr,en}` | Captures iPhone 6,1" avec Dynamic Island (portrait 1179×2556) |
| `ios/header/` | Images d'en-tête App Store 5244×2950 et 3840×1646 (avec / sans logo) — `npm run store:header` |
| ~~`ios/ipad-13in_2064x2752`~~ | Non nécessaire : l'app est déclarée iPhone uniquement |
| `android/app-icon-512.png` | Play Console → Fiche du store → Icône de l'application (512×512) |
| `android/phone_1080x1920/{fr,en}` | Play Console → Captures d'écran du téléphone (2 à 8) |
| `android/feature-graphic-1024x500-{fr,en}.png` | Play Console → Image de présentation (1024×500) |

Ordre des captures : 01 accueil · 02 virage · 03 rétrécissement · 04 nouveau record · 05 « presque » · 06 mode nuit.
