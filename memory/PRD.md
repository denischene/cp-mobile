# PRD – Confort+ Mobile (Firefox Nightly Android)

## Problème original
Porter l'extension navigateur « Orange Confort+ » (GitHub: Orange-OpenSource/Orange-Confort-plus, branche develop) pour fonctionner sur Firefox Nightly Android. Créer une page de déploiement web correspondant à la charte graphique de confort-plus.fr, servant le .xpi et intégrant la « version serveur » du widget Confort+ directement dans la page.

## Architecture
```
/app/
├── frontend/
│   ├── public/
│   │   └── index.html               # Injection Confort+ server script (deferred load)
│   │   ├── js/toolbar.min.js        # Widget Confort+ compilé
│   │   └── css/styles.min.css       # Styles Confort+ compilés
│   ├── src/
│   │   ├── pages/
│   │   │   └── DeploymentPage.jsx   # Page d'accueil de déploiement
│   │   └── components/deployment/   # Hero, DownloadCard, InstallSteps, ThemeProvider, etc.
├── confort-src/                     # Code source extension cloné
│   ├── dist/serveur/                # Version serveur compilée
│   ├── orange-confort-plus-5.5.1-android.xpi
│   └── ANDROID_FIREFOX.md
```

## Fonctionnalités implémentées
- [x] Page de déploiement React (Hero, DownloadCard, InstallSteps, ServerVersionInfo, Header, Footer)
- [x] Branding Orange Confort+ (charte graphique confort-plus.fr)
- [x] Téléchargement du .xpi comme asset statique
- [x] Injection du widget Confort+ « version serveur » (toolbar.min.js + styles.min.css)
- [x] Correction overflow mobile (ServerVersionInfo)
- [x] Boutons CTA texte noir pour meilleur contraste
- [x] Titre section « Test temporaire sur Firefox Nightly Android »
- [x] Instructions d'installation en 2 sections A/B détaillées
- [x] **Mode sombre** avec toggle dans le header + persistance localStorage (24 sept. 2026)
- [x] **Badges mode clair** : textes en noir, pictos et cadres orange (24 sept. 2026)
- [x] **QR Code** : téléchargement direct du .xpi depuis mobile (qrcode.react) (24 sept. 2026)

## Limitations connues
- Extension .xpi non signée (installation permanente impossible sans signature AMO)
- Palette Confort+ parfois en anglais selon la langue du navigateur (limitation upstream)

## Backlog
- P0: Corrections basées sur retours tests appareil réel
- P1: Workflow de signature AMO pour installation permanente
- P2: Icône mobile personnalisée pour l'extension
