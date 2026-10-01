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
