# Orange Confort+ — Portage Firefox Nightly Android + Page de déploiement

## Problème / Objectif
1. Adapter l'extension navigateur Orange Confort+ (dépôt GitHub Orange-OpenSource,
   branche develop) pour qu'elle fonctionne sur Firefox Nightly Android. Produire un
   .xpi + instructions. (FAIT — session précédente)
2. Construire une page de déploiement/présentation (frontend React) reprenant la
   charte graphique de www.confort-plus.fr, avec lien de téléchargement du .xpi,
   cadrage "extension pour téléphone mobile" + nature expérimentale, et la "version
   serveur" de Confort+ (script auto-injecté) fonctionnelle sur cette même page.
   (FAIT — cette session, 2026-09-23)

## Contexte technique
- Extension source: /app/confort-src (branche develop, v5.5.1). Build Android:
  /app/confort-src/orange-confort-plus-5.5.1-android.xpi, guide:
  /app/confort-src/ANDROID_FIREFOX.md.
- Version "serveur" Confort+ (dist/serveur): script JS unique (toolbar.min.js) qui
  s'auto-injecte en Shadow DOM (custom element <cplus-app-root>) et fetch ses
  ressources (css/, assets/json, assets/icons, _locales) via window.location.origin.
- Frontend app (/app/frontend) = React + Tailwind + shadcn, sert désormais la page
  de présentation du portage mobile (pas de backend custom impliqué, page statique).

## Réalisé (2026-09-23)
- Copié les assets de la "version serveur" (css/, js/, assets/, _locales/,
  COPYING.txt) dans /app/frontend/public/ (racine, requis par le fetch absolu du script).
- Copié le .xpi et le guide ANDROID_FIREFOX.md dans /app/frontend/public/downloads/.
- Ajouté `<script src="/js/toolbar.min.js">` dans public/index.html (avant `</body>`)
  → pastille Confort+ active sur toute la page.
- Page DeploymentPage.jsx (fr) avec composants: SiteHeader, ExperimentalBanner, Hero,
  DownloadCard (+ InstallSteps), ServerVersionInfo, SiteFooter — charte confort-plus.fr
  (orange #FF7900, header sombre #0D0D0D, typographie large, liens GitHub/site officiel).
- Couleur --primary (index.css) et tailwind.config.js (colors.confort) alignés sur
  l'orange Orange (#FF7900 / hsl 28 100% 50%).
- App.js: route "/" rend DeploymentPage (ancien template Emergent retiré).
- Bug corrigé (testing_agent): overflow horizontal mobile 390px causé par un <pre>
  de code sans `min-w-0` dans ServerVersionInfo.jsx → corrigé (min-w-0 + break-all).
- Testing agent: 1 itération, bug HIGH fixé, tout le reste OK (data-testid, liens
  externes target=_blank/rel=noopener, téléchargement .xpi 200 + mimetype
  application/x-xpinstall, guide .md 200, script serveur + ressources 200, palette
  Confort+ s'ouvre bien en Shadow DOM).

## Limitation connue (non bloquante)
- La palette Confort+ (version serveur, upstream toolbar.min.js) s'affiche en anglais
  malgré /_locales/fr/ disponible : dépend de navigator.language du navigateur/test,
  comportement du script tiers non modifié dans cette session.

## Contrainte connue (portage extension)
Firefox Android n'installe de façon permanente que des .xpi SIGNÉS par Mozilla.
- Test temporaire: web-ext run -t firefox-android (USB/adb) — documenté sur la page.
- Installation permanente: signer via AMO (web-ext sign --channel=unlisted) —
  documenté sur la page (carte "Installation permanente").

## Backlog / Next
- Signature AMO du .xpi (nécessite clés API Mozilla de l'utilisateur) si install
  permanente souhaitée.
- Tester réellement sur téléphone Android physique (retour utilisateur).
- (Optionnel) Forcer la locale FR du script serveur tiers si le mélange EN/FR gêne.
