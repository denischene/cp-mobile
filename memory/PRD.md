# PRD – Confort+ Mobile (Firefox Nightly Android)

## Problème original
Porter l'extension navigateur « Orange Confort+ » (GitHub: Orange-OpenSource/Orange-Confort-plus, branche develop) pour fonctionner sur Firefox Nightly Android. Créer une page de déploiement web correspondant à la charte graphique de confort-plus.fr, servant le .xpi et intégrant la « version serveur » du widget Confort+ directement dans la page.

## Architecture
```
/app/
├── frontend/
│   ├── public/
│   │   ├── index.html               # Injection Confort+ server script (deferred) + @font-face
│   │   ├── fonts/AccessibleDfA-VF.ttf # Police variable Accessible DfA
│   │   ├── js/toolbar.min.js        # Widget Confort+ compilé
│   │   └── css/styles.min.css       # Styles Confort+ compilés
│   ├── src/
│   │   ├── pages/
│   │   │   └── DeploymentPage.jsx   # Page d'accueil de déploiement
│   │   ├── components/deployment/
│   │   │   ├── ThemeProvider.jsx     # Contexte dark/light + prefers-color-scheme
│   │   │   ├── SiteHeader.jsx       # Header avec toggle mode sombre
│   │   │   ├── ExperimentalBanner.jsx
│   │   │   ├── Hero.jsx             # Badges texte noir (light) / orange (dark)
│   │   │   ├── DownloadCard.jsx     # QR code + téléchargement
│   │   │   ├── InstallSteps.jsx     # Étapes A/B détaillées
│   │   │   ├── ServerVersionInfo.jsx
│   │   │   └── SiteFooter.jsx       # Ligne séparatrice orange + pictos orange
│   │   └── index.css                # Font-family Accessible DfA appliquée globalement
├── confort-src/                     # Code source extension cloné
│   ├── dist/serveur/
│   ├── orange-confort-plus-6.0.0-alpha.1-android.xpi
│   └── ANDROID_FIREFOX.md
```

## Fonctionnalités implémentées
- [x] Page de déploiement React
- [x] Branding Orange Confort+
- [x] Téléchargement du .xpi
- [x] Widget Confort+ « version serveur » injecté
- [x] Correction overflow mobile
- [x] Boutons CTA texte noir
- [x] Titre « Test temporaire sur Firefox Nightly Android »
- [x] Instructions A/B détaillées
- [x] Mode sombre avec toggle + persistance localStorage
- [x] Synchronisation prefers-color-scheme (thème système)
- [x] QR Code (qrcode.react)
- [x] Police Accessible DfA (variable font)
- [x] Dark mode complet : fond noir, textes blancs, badges orange, liens orange, cadres orange/blancs, numéros de liste orange, `<code>` blanc sur gris foncé, ligne séparatrice orange épaisse (banner + footer), `<pre>` encadré blanc
- [x] Light mode : badges texte noir, icônes/cadres orange

## Limitations connues
- Extension .xpi non signée
- Palette Confort+ parfois en anglais (limitation upstream)

## Backlog
- P0: Corrections basées sur retours tests appareil réel
- P1: Workflow de signature AMO
- P2: Icône mobile personnalisée

## Journal (01/06/2026 — livraison site statique)
- Page de déploiement mise à jour sur `orange-confort-plus-6.0.0-alpha.1-android.xpi`
- Fichiers « version serveur » (js/toolbar.min.js, css/, assets/, _locales/) régénérés depuis `confort-src/dist/serveur` (6.0.0-alpha.1)
- `toolbar.min.js` / `toolbar.js` patchés : `window.location.origin` → `window.__CONFORT_BASE__||window.location.origin` (support sous-dossier)
- `index.html` définit `window.__CONFORT_BASE__` à partir de `%PUBLIC_URL%` ; `App.js` : `BrowserRouter basename={process.env.PUBLIC_URL}`
- Build statique compilé pour `/cpm` (PUBLIC_URL=/cpm), scripts Emergent/PostHog retirés du HTML livré
- ZIP livrable : `/app/frontend/public/downloads/confort-plus-site-statique-cpm.zip` (inclut .htaccess Apache + LISEZ-MOI.txt)
  URL : {PREVIEW}/downloads/confort-plus-site-statique-cpm.zip

## Backlog restant (bugs extension signalés, non traités)
- P0 : déplacement clavier de la pastille (Tab → Espace → flèches → Espace/Échap), rendu 4 triangles noirs bord blanc épais (aussi au drag souris)
- P0 : drag mobile de la pastille (la page scrolle au lieu de la pastille)
- P0 : position par défaut mobile de la pastille en bas à droite
- P0 : refonte vocalisation (curseur/focus Lire, clic/re-clic On↔Suspended, navigation clavier, infobulle, info furtive étendue)
- P1 : Clic adapté — rectangles trop larges, listbox non prises en compte, pas d'agrandissement si zone déjà grande
- P1 : valeurs par défaut modes Lecture+ / Vision+ (Contrastes renforcés, curseurs/focus noirs, couleurs de liens)
- P1 : « Contrastes renforcés » ne doit modifier que les textes à faible contraste, pas les fonds
- P1 : crash Chrome (localStorage) sur Le Monde ; homogénéité de langue TTS
- ON HOLD (demande utilisateur) : version serveur qui écrase la version extension

## Journal (01/06/2026 — lot « pastille clavier / drag mobile / vocalisation / contrastes »)
Extension (src `confort-src`, branche feat-mobile-color, v6.0.0-alpha.1) :
- `drag-drop.service.ts` : mode déplacement clavier (Tab → Espace → flèches → Espace/Échap),
  pas de 16 px (64 px avec Maj), `setPointerCapture` + `touchmove preventDefault` + `touch-action: none`
  (la page ne scrolle plus pendant le drag mobile), position par défaut bas-droite sur mobile
  (`matchMedia('(max-width: 36em), (pointer: coarse)')`), garde `positionRestored` pour ne pas
  écraser la position par défaut.
- `app.component.ts` + `confort-plus.scss` : 4 triangles noirs (SVG, stroke #fff 5, paint-order stroke)
  affichés en mode déplacement clavier ET pendant le drag souris (classe `sc-confort-plus--moving`).
- `read-aloud.service.ts` : réécriture — états off/suspended/on, clic = On, re-clic même texte = Suspended,
  clic sur un autre texte = coupe et lit le nouveau, 2e clic sur un élément activable = activation,
  en Suspended un clic sur lien/bouton vocalise sans activer, Échap et clic droit → Suspended,
  déclenchement au focus clavier (focusin, garde 400 ms après un pointerdown), infobulle supprimée
  dès le 1er clic/tap, info furtive 2 s avec l'étendue (`readAloud_scope_*` ajoutés dans fr/en/es/it/pl),
  curseur Lire à bord blanc épais, focus Lire (contour noir + anneau blanc), curseur/focus par défaut
  pendant la synthèse (classe `cplus-read-aloud-speaking`), `utterance.lang` forcé sur la langue du document,
  renforcement du rendu des éléments actionnables au survol/focus selon « Lien bien visible ».
- `color-contrast.service.ts` : « Contrastes renforcés » ne pose plus de couleurs globales ; calcul du
  ratio WCAG par élément (texte propre uniquement) et passage en #000 ou #fff seulement si ratio < 4.5,
  restauration exacte des styles inline au changement de valeur.
- `clearly-links.service.ts` : expose `currentValue`.
- `01-variables/_index.scss` : `$dropdown-item-padding-y: .5rem` (corrige l'échec sass « 0.5em et 0.0625rem
  ont des unités incompatibles » qui bloquait tout le build CSS).

Livrables régénérés : `orange-confort-plus-6.0.0-alpha.1-android.xpi`, `dist/serveur/*` copiés dans
`/app/frontend/public`, ZIP statique `/app/frontend/public/downloads/confort-plus-site-statique-cpm.zip`.

Vérifications automatisées (Playwright sur la page de déploiement, version serveur) :
mode déplacement clavier OK (classe + flèches visibles + déplacement + sortie Échap), position mobile
bas-droite OK, states vocalisation OK (suspended → on → suspended, clic lien bloqué, clic droit),
spans nettoyés au retour à « sans vocalisation », contrastes renforcés : 10 éléments corrigés,
fond de page inchangé, restauration complète. Aucune erreur console.

## Journal (01/06/2026 — lot « clic adapté / valeurs par défaut / robustesse Chrome »)
- `click-facilite.service.ts` : zones de clic resserrées (padding-block 1.125rem, padding-inline .125rem
  au lieu de 1.375rem partout), nouvelle cible `CLICK_FACILITE_TARGETS` incluant select, listbox/combobox,
  inputs, textarea, summary, label[for], role=button/link/tab ; les éléments déjà >= 44x44 px (tuiles,
  grandes cartes) ne sont plus agrandis mais gardent le surlignage au survol/focus
  (classe `click-facilite-target`) ; les contrôles de formulaire utilisent min-height/min-width 44 px
  (classe `click-facilite-enlarged-control`) ; reset nettoie les trois classes.
- `constantes.core.ts` : `CLICK_FACILITE_MIN_TARGET = 44`, `CLICK_FACILITE_TARGETS`.
- `modes-of-use.json` (version 1.0.47 → **1.0.48**, nécessaire pour que les réglages stockés soient
  rafraîchis) :
  * lecturePlus : colorContrast par défaut = `reinforcedContrasts` (au lieu de `black_ivory`)
  * visionPlus : colorContrast = `noModifications,reinforcedContrasts,ivory_black` (défaut contrastes
    renforcés), cursorAspect = `bigCursor_black,hugeCursor_black`, focusAspect = `big_black,huge_black`,
    scrollAspect = `big_black,huge_black`, linkStyle = `darkblue_orange_brown` par défaut
- Chrome / robustesse (cause probable du « l'extension se ferme après inactivité ») :
  * `extension/scripts/main.ts` : helpers `injectScript` / `isToolbarPresent` / `injectToolbar` —
    plus aucune double injection de `toolbar.js` (les services sont des singletons qui lèvent une
    exception à la 2e exécution et cassaient la palette), tous les `executeScript` ont un `.catch`,
    `tabs.onUpdated` ignore les mises à jour sans navigation (les sites qui s'auto-rafraîchissent
    comme Le Monde en déclenchent des dizaines), logs `storage.onChanged` désactivés.
  * `extension/services/local-storage.service.ts` : garde `isExtensionContextAlive()`, tous les appels
    `chrome.storage` en try/catch + `.catch`, repli sur `window.localStorage`
    (clés `cplus-<key>-<hostname>`, donc sans collision avec la version serveur), tabId redemandé
    paresseusement si le service worker a été recyclé.

Vérifications (Playwright, version serveur sur la page de déploiement) : select → min-height 44 px,
grande tuile → aucun agrandissement (largeur inchangée), petit lien → +4 px seulement en largeur
(contre +44 px avant) et +37 px en hauteur, reset complet des classes ; modes-of-use servi en 1.0.48
avec toutes les nouvelles valeurs. Aucune erreur console. Le durcissement Chrome (service worker)
n'est pas testable en preview : à valider par l'utilisateur sur Le Monde.
