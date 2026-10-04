# Windy Drive

Jeu mobile hyper-casual (iOS + Android), type Flappy Bird : une voiture vue de dessus, poussée en permanence par un vent latéral ; chaque tap braque dans l'autre sens. Sortie de route = partie perdue. Score = distance en mètres. 100 % hors ligne, aucun serveur.

## Sources de vérité

- `derive.html` : prototype validé par des testeurs. **Référence de comportement** (physique, génération de route, sensations). En cas de doute sur le gameplay, il fait foi.
- `design/Windy Drive.dc.html` : design visuel (Claude Design). Référence **visuelle uniquement** : écrans, couleurs, typographies, logo.
- `design/derive-engine.js` : moteur de MAQUETTE du design. Sa physique est différente (vitesse latérale, route en zigzag, voiture 26×50). **Ne jamais en reprendre la logique de jeu** ; seulement le rendu (thèmes summer / summer-night, voiture, vibreurs, panneaux, particules).
- `design/Windy Drive.html` : bundle du design (contient les polices woff2 en base64).

## Stack

TypeScript + Vite, rendu Canvas 2D (pas de moteur de jeu), tests Vitest, Capacitor pour iOS/Android.
Plugins : Haptics, Preferences, Keep Awake (`@capacitor-community/keep-awake`), Status Bar, Share + Filesystem (partage d'image), Screen Orientation. Portrait verrouillé, safe areas respectées.

## Architecture (séparation stricte)

```
src/config/gameConfig.ts   TOUTES les valeurs de jeu (vitesse, drift, tap, route, rétrécissements…)
src/config/theme.ts        TOUT le visuel (couleurs, polices, tailles, sprites)
src/sim/                   simulation pure TS : rng, roadGenerator, road, car, game. AUCUN accès DOM/Canvas
src/render/                dessin Canvas, caméra. Lit l'état de sim en lecture seule
src/ui/                    écrans (accueil, HUD, fin de partie), entrées tap/clavier, i18n
src/platform/              interface + implémentations (capacitor.ts natif, web.ts navigateur)
src/ext/                   points d'extension VIDES : leaderboard, ads, analytics (ne pas implémenter)
src/dev/                   panneau de réglages, chargé seulement si import.meta.env.DEV
tests/                     Vitest (sim sans navigateur)
```

Règles :
- `sim/` ne connaît ni le rendu, ni le DOM, ni `theme.ts`. Il doit tourner sous Node.
- Aucune valeur de gameplay en dur hors de `gameConfig.ts` ; aucune couleur/police/dimension visuelle hors de `theme.ts`.
- Le panneau dev ne doit jamais se retrouver dans le build de production.
- Pas de dépendance réseau : polices et assets embarqués en local (pas de Google Fonts).

## Mécaniques à respecter (valeurs initiales, toutes dans gameConfig)

- Monde : largeur d'écran = 360 unités. Caméra à 68 % de la hauteur, pivote vers le cap de la route (lissage exponentiel, facteur 3/s).
- Voiture : vitesse 260 u/s, 18×30 u (collision). ω gagne `drift`=7 rad/s² dans le sens du vent, plafonné à 3 rad/s ; un tap fixe ω à `tap`=2,2 rad/s dans le sens opposé. Direction = ∫ω, position = ∫(direction, vitesse). Pas de temps fixe 1/120 s.
- Route : axe échantillonné tous les 4 u, largeur 110. Perdu si le centre de la voiture s'écarte de l'axe de plus d'une demi-largeur locale.
- Segments : ligne droite 110–440 u (jamais deux de suite), virage rayon R ∈ [Rmin, 2,8·Rmin], angle 0,4–1,5 rad. Rmin contre le vent = vitesse/(0,62·tap) ; dans le vent = vitesse/1,8 ; toujours ≥ 0,9·largeur. Courbure lissée (0,12/échantillon). Pondération virages 1,7 / droite 1 ; jamais 3 segments identiques. Cap borné à ±1,25 rad (virages aggravants interdits au-delà de 0,75).
- Début : droite ~420 u puis 5 segments d'échauffement doux, sans rétrécissement.
- Rétrécissements : ~30 % des segments éligibles (≥260 u, droite ou virage doux), jamais deux de suite, largeur 62–75 %, transition smoothstep sur min(130, 30 % du segment).
- Génération avec PRNG à graine (mulberry32) : même graine = même route.
- Score = distance le long de la route, 10 u = 1 m. Crash : secousse 0,5 s, vibration, glissade, écran de fin. Restart par tap avec garde de 350 ms.
- Deux sens de vent (défaut : vent vers la droite), un record par sens.

## Design (thème)

- Direction « Plein Été » : jour (summer) + nuit (summer-night). Le mode sombre est un **réglage utilisateur** (pas automatique).
- Polices : Bowlby One (titres, score), DM Sans (interface). Logo « WINDY DRIVE » incliné de −9°, aigrettes de vent à gauche des mots.
- La voiture est dessinée à l'échelle de la hitbox 18×30 (le design la dessine plus grande : réduire le sprite, ne pas changer la physique).
- Le bouton Classement n'affiche qu'un message pour l'instant (extension `ext/leaderboard.ts`).

## Produit

- Langues : FR et EN (i18n dès le départ). **Anglais par défaut** à la première ouverture, quelle que soit la langue de l'appareil ; le choix du joueur (bouton `Language · FR/EN`) est ensuite mémorisé.
- Sons : synthétisés via WebAudio (tap, crash, nouveau record), sans fichiers audio. Interrupteur son sur l'accueil.
- Identifiant d'app provisoire : `com.windydrive.app` (à confirmer avant publication).

- **iPhone uniquement** (`TARGETED_DEVICE_FAMILY = 1`) : le jeu est portrait/téléphone. Une app iPad devrait supporter les 4 orientations (règle Apple) ; ne pas repasser en « universel » sans adapter la mise en page.
- **Xcode Cloud** : `ios/App/ci_scripts/ci_post_clone.sh` installe Node, `npm ci`, build web et `cap sync ios` (node_modules et ios/App/App/public ne sont pas dans Git).

## Qualité

- 60 fps stables sur téléphone d'entrée de gamme : dessiner seulement la fenêtre visible, éviter les allocations par image, mesurer avant d'optimiser.
- Tests unitaires sur la génération : aucun virage infranchissable, cap dans les limites (tolérance documentée due au lissage), règles de rétrécissement, déterminisme par graine.
- Commenter les parties non évidentes (physique, génération). Code en anglais, textes utilisateur via i18n.

## Commandes

- `npm run dev` : serveur de dev (panneau DEV en bas à gauche)
- `npm test` : tests Vitest (sim sans navigateur ; `tests/autopilot.ts` = pilote de test)
- `npm run typecheck` / `npm run build` : vérification TS + build de production (le panneau dev en est absent)
- `npm run cap:sync` : build web + copie vers ios/ et android/ (à refaire après chaque changement de code)
- `npm run assets` : régénère icônes et écrans de lancement (iOS + Android) depuis le logo du design (`scripts/make-assets.mjs` → `assets/`)
- `npm run store` : régénère `store/` (captures App Store / Google Play en FR+EN aux tailles exactes, icônes 1024/512, feature graphic). Utilise le mode capture `?shot=` du serveur de dev (`src/dev/shots.ts`, absent du build) et Chrome via DevTools ; scènes modifiables dans `shots.ts`
- `npm run ios` / `npm run android` : sync puis ouvre Xcode / Android Studio
- Build simulateur iOS en ligne de commande : `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build`
- Android : SDK dans `~/Library/Android/sdk`, JDK **21** obligatoire (Gradle 8.14 ne supporte pas le JDK 25 d'Android Studio) : `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=$HOME/Library/Android/sdk` puis `cd android && ./gradlew assembleDebug` (APK : `android/app/build/outputs/apk/debug/app-debug.apk`)
- Émulateur : `$ANDROID_HOME/emulator/emulator -avd EKKIP_Pixel` ; installer avec `adb install -r <apk>`, lancer avec `adb shell am start -n com.windydrive.app/.MainActivity`

## Ordre de travail

1. Gameplay jouable dans le navigateur, fidèle au prototype.
2. Trois écrans (design Claude Design) + persistance des records.
3. Capacitor : iOS/Android, haptique, keep awake, safe areas, partage natif.
4. Icônes, polices finales, ajustements.

À la fin de chaque étape : expliquer comment tester et ce qui reste à faire.
