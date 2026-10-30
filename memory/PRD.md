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

## Journal (01/06/2026 — « contrastes renforcés » étendus / AMO reporté)
- `color-contrast.service.ts` : « Contrastes renforcés » s'applique maintenant à TOUTE couleur de texte
  dont le ratio WCAG < 4.5 avec son fond réel :
  * texte achromatique (saturation < 0.12) → #000 sur fond clair, #fff sur fond foncé
  * texte coloré → la teinte et la saturation sont conservées, seule la luminosité est assombrie /
    éclaircie par paliers de 5 % jusqu'à atteindre 4.5:1 (repli #000/#fff si impossible)
  * les fonds de page ne sont jamais modifiés
  * `MutationObserver` (debounce 500 ms) pour les textes chargés dynamiquement (scroll infini, SPA)
  * marquage `data-cplus-contrast` : chaque élément n'est calculé qu'une fois (coût maîtrisé),
    attributs et couleurs inline intégralement restaurés au changement de valeur
- Vérifié (Playwright) : #bbb → noir, #ffa726 → rgb(165,98,0) (teinte conservée), bleu suffisant inchangé,
  gris foncé sur #111 → blanc, fond de page inchangé, texte ajouté après activation corrigé en < 1 s,
  restauration complète et 0 marqueur résiduel. Aucune erreur console.
- Signature AMO : **reportée à la demande de l'utilisateur**, l'ID `@orange_confort_plus` est conservé.
  Rappel pour plus tard : il faudra un ID propre (ex. confort-plus-mobile@oakcess.fr), des identifiants
  API AMO (JWT issuer + secret) et `npm run sign:android` (web-ext sign --channel=unlisted) ;
  AMO refusera de signer sous l'ID d'Orange.

## Journal (05/06/2026 — règles de vocalisation revues + plantage des menus corrigé)
### Plantage « la version mobile plante en naviguant dans ses menus » — CAUSE RACINE TROUVÉE ET CORRIGÉE
- `shared/header.component.ts` : `prevButtonEvent()` diffusait `changeRoute` avec
  `historyRoute[historyRoute.length - 1]` = **undefined** quand l'historique est vide (page d'accueil).
  `RouteService.navigate(undefined)` supprimait alors la page courante sans en charger de nouvelle
  (palette vide) puis `setCurrentRoute(undefined)` écrivait la chaîne `"undefined"` dans le stockage ;
  au chargement suivant `JSON.parse("undefined")` levait une SyntaxError dans
  `HomeComponent.attributeChangedCallback` → palette morte jusqu'à réinitialisation.
- Correctifs : garde dans `prevButtonEvent()`, `RouteService.navigate()/setCurrentRoute()` ignorent
  toute route inconnue, nouvelle fonction globale `safeJsonParse()` (constantes.core.ts) utilisée dans
  toolbar/home/settings/modes/mode/abstract-category/abstract-setting/btn-setting/pause/color-profile-rule,
  `toolbar.component` ne pousse plus de JSON `undefined`, et les deux `LocalStorageService`
  (serveur + extension) refusent d'écrire `undefined` et auto-nettoient une valeur corrompue.
- Hook de debug `window.cplus` ajouté (injector.core.ts) : readAloud, colorContrast, clickFacilite,
  clearlyLinks, dragDrop, route, storage.

### Vocalisation (read-aloud.service.ts) — nouvelles règles
- Étendue « phrase » : regroupement des phrases AU-DELÀ des éléments inline (`groupSentences()`), donc
  une phrase contenant des hyperliens est lue en entier ; l'unwrap conserve les liens (plus de
  `resetToDefaultBody` destructif sur ces spans).
- Un lien / bouton / select AUTONOME est lu seul (`spanHasTextOutsideActionables()`), un lien inline
  dans une phrase fait lire la phrase entière.
- Images : `getImageText()` → alt complet quelle que soit l'étendue, sinon `figcaption`, sinon
  « absence de description » (clé i18n `readAloud_noDescription` fr/en/es/it/pl).
- Machine à états `onActivationGesture()` : rien en cours → vocalise sans activer ; texte en cours →
  clic gauche/droit, Échap, changement de focus = arrêt ; élément activable en cours (ou dans la
  seconde qui suit la fin de sa lecture) → arrêt + activation réelle ; clic sur un autre texte →
  arrêt + lecture du nouveau.
- Clavier : `focusin` vocalise l'élément focusé (en ignorant le focus induit par le clic qu'on vient de
  traiter sur le même élément), `Enter` suit la même logique que le clic.
- Étendue « mot » : `createFragmentForWords()` réécrit — les espaces sont conservés tels quels
  (plus d'espaces en double ni de texte altéré) et le texte est restauré à l'identique.
- Traitement par lots asynchrones (`processInChunks`, 80 éléments) pour ne plus bloquer le thread
  principal sur les grandes pages ; garde « même valeur » dans `setReadAloud` et
  `setColorsContrasts('reinforcedContrasts')` pour éviter de reconstruire tout le DOM à chaque
  navigation dans les menus.

### Tests
- `/app/test_reports/iteration_4.json` : **10/10 règles validées**, 0 erreur JS, plantage des menus
  non reproductible (20 cycles + rechargement), auto-guérison d'un stockage corrompu validée.
- Paquets régénérés : `.xpi` 6.0.0-alpha.1 + ZIP statique `/cpm`.

## Journal (06/06/2026 — palette non impactée / accordéons / liens adaptatifs)
1. **La palette n'est plus impactée par la vocalisation** (`read-aloud.service.ts`) :
   - le handler `click` ignore désormais tout événement provenant de la palette (`isInsideApp`),
     ce qui corrigeait le « il faut cliquer deux fois sur les boutons multiclics » ;
   - `blockActivation()` purge automatiquement son drapeau au bout de 500 ms (sur mobile,
     `preventDefault` sur `pointerdown` peut supprimer le `click`, le drapeau restait armé et
     mangeait le clic suivant — y compris celui de la palette).
2. **Titres-accordéons** (Wikipédia mobile par ex.) : la fenêtre d'activation d'1 s s'applique
   maintenant à TOUT élément vocalisé (`lastSpokenTarget`) et plus seulement aux éléments
   « activables » détectables ; `giveFocus()` donne le focus à l'élément vocalisé lorsqu'il est
   potentiellement interactif (`[aria-expanded]`, `[aria-controls]`, `[onclick]`, rôles, etc.) en
   ajoutant si besoin un `tabindex="-1"` temporaire (nettoyé au retour à « sans vocalisation » via
   `[data-cplus-tabindex]`) ; `resolveSpeakTarget()` reconnaît un élément dont le texte a été
   encapsulé dans des spans (il n'avait plus de texte propre, donc rien n'était vocalisé).
   Résultat : 1er tap = vocalisation + focus sans bascule, 2e tap dans la seconde = bascule de
   l'accordéon, tap au-delà d'1 s = nouvelle vocalisation.
3. **Couleurs de liens adaptatives** (`color-contrast.service.ts`) : en « Contrastes renforcés »,
   chaque `a[href]` reçoit la classe `cplus-link-on-light` (darkblue / orange / brown) ou
   `cplus-link-on-dark` (lightblue / #ffb366 / burlywood) selon la luminance de SON fond réel, via la
   feuille `adaptive-links` ; un bandeau sombre dans une page claire (et inversement) est donc géré.
   Les liens ne sont plus repeints par le renforcement de contraste (ils gardent une couleur de lien).
   Classes et feuille retirées au retour à « sans modification ».

Tests : `/app/test_reports/iteration_5.json` — 7/7 scénarios OK, 0 erreur JS, non-régressions
vocalisation (itération 4) et plantage des menus confirmées. Paquets régénérés (.xpi + ZIP /cpm).

## Journal (23/06/2026 — infobulle mobile, modale ameli, liens adaptatifs généralisés, multiclics)
1. **Infobulle mobile** (`read-aloud.service.ts`) : nouveau message `readAloud_tooltip_mobile`
   (fr/en/es/it/pl) affiché quand `matchMedia('(pointer: coarse)')` — « Tap pour vocaliser, Tap zone
   vide pour arrêter, Re-tap pour actionner » ; un tap sur une zone vide arrête désormais la
   vocalisation (sans armer la fenêtre d'activation d'1 s, donc un re-tap relit le même texte).
2. **Modale inaccessible (ameli.fr)** — cause trouvée : les masques du réglage « Guide de lecture »
   (`reading-guide.service.ts`) sont des div plein écran rgba(0,0,0,.5) en z-index infini SANS
   `pointer-events: none`, déplacées uniquement par `mousemove` : sur mobile (pas de survol) elles
   restaient figées après le mousemove synthétique du tap et recouvraient toute la page, dont la
   modale, en avalant tous les taps — la palette restant utilisable. Correctifs : `pointer-events: none`
   sur les masques / la règle / le libellé, écouteurs `pointermove` + `pointerdown` (la bande suit les
   taps), hauteur initiale au milieu de l'écran, handler null-safe, plus de `stopPropagation`.
3. **Boutons multiclics décalés d'un cran** (`extension/services/local-storage.service.ts`) :
   l'événement `storage-<clé>` était émis AVANT l'écriture `chrome.storage` (régression introduite au
   durcissement Chrome) ; les composants relisaient donc la valeur précédente. L'événement est
   maintenant émis après la résolution des écritures. **Non vérifiable en preview** (la version
   serveur est synchrone) : à confirmer sur l'appareil.
4. **Liens adaptatifs généralisés** (`color-contrast.service.ts`) : actifs pour TOUTES les valeurs de
   « Couleurs texte/fond » dès qu'une palette de liens est active (ou en contrastes renforcés).
   Chaque lien porte ses propres couleurs via `--cplus-link-color` / `--cplus-link-pointed-color` /
   `--cplus-link-visited-color`, calculées contre son fond réel composité (alpha-blending des fonds
   semi-transparents), avec décision clair/sombre par comparaison de contraste (et non par seuil de
   luminance), décalage du fond pour l'état survolé (sans franchir la frontière clair/sombre) et gel
   temporaire des transitions CSS pendant la mesure. Cache par fond pour le coût.
5. Corrections annexes : virgule manquante dans `color-read.component.ts` (la 1re valeur était
   'noModificationssplitSyllables_word' et faisait planter `BtnSettingComponent.setTitle` à chaque
   rendu des réglages) + garde dans `setTitle` ; i18n serveur protégé à la première visite avec
   re-traduction après le fetch ; la vocalisation ne découpe plus les conteneurs flex/grid (espaces et
   gaps perdus) ; « Clic adapté » ne force plus `display: inline-block` sur une cible flex/grid
   (icônes qui passaient au-dessus du libellé, CTA déformé).

Tests : itérations 6 à 11 (`/app/test_reports/iteration_6..11.json`) — tous les points ci-dessus
validés (contrastes >= 4.5:1 mesurés au survol réel sur tous les liens et tous les thèmes, masques,
infobulles, règles de vocalisation, palette non impactée, 15 cycles de navigation sans erreur JS).
Dernier correctif (« Clic adapté » / display) vérifié manuellement seulement, à la demande de
l'utilisateur d'arrêter les tests automatiques.

## Journal (27/06/2026 — Loupes continues : Loupe souris, Focus-loupe, Agrandisseur)
Le bouton multiclic « Loupe » expose désormais trois types de loupe reliés par une continuité
de zoom ×2 → ×20, sur PC et mobile, dans l'extension comme dans la version serveur.

Fichiers :
- `src/app/core/constantes.core.ts` : types (`mouse`/`focus`/`screen`), plages (×2–4, ×2–9, ×8–20),
  niveaux d'entrée (focus ×5, agrandisseur ×10), zoom navigateur ajouté (+10 % / +30 %), niveau de
  repli (×12), tailles et délais (bulle 280 px, badge 2 s, pastille mobile 3 s).
- `src/app/services/settings/magnifier.service.ts` : réécrit. Moteur unique par copie de page
  (recadrée sur un point en coordonnées document) pour les trois types ; continuité montante et
  descendante entre types ; zoom navigateur appliqué par type au-dessus du zoom de l'utilisateur et
  restitué à l'extinction ; guide de lecture mis en pause puis repris ; badge ×N ; pastille + / -
  mobile ; escamotage (Échap., clic droit) avec pastille loupe et retour par clic/Entrée ;
  exploration automatique puis manuelle du Focus-loupe avec flèches de bord ; barres d'arrivée en
  bord de page ; défilement aux bords pour l'Agrandisseur ; repli automatique si la copie dépasse
  400 ms. **Toutes les couches sont en `pointer-events: none`** et le `z-index` reste sous la
  palette, qui demeure visible et cliquable même en Agrandisseur.
- `src/app/shared/settings/magnifier.component.ts` : valeurs par défaut `noModifications,mouse_x2,focus_x5`.
- `src/app/pages/edit-setting/settings/edit-magnifier.component.ts` : réglages fins à deux lignes
  (type puis niveau, niveaux filtrés par type) ; toute combinaison hors multiclic devient la 4e
  valeur personnalisée, avec une infobulle au libellé lisible.
- `src/assets/json/modes-of-use.json` (version 1.0.49, remet « sans loupe » partout) :
  Facile+ et autres `noModifications,mouse_x2,focus_x5` · Vision+ `noModifications,mouse_x4,focus_x5`
  · Vision++ `noModifications,focus_x7,screen_x9`.
- `src/_locales/*/messages.json` : libellés des trois types, `magnifier_values`, labels des deux
  lignes de réglage et niveaux ×2 à ×20, dans les cinq langues.

Vérifié en preview (version serveur, aucune erreur JS) : les trois types s'affichent et suivent
pointeur / focus / écran ; continuité mouse ×4 → focus ×5 → screen ×10 et retour ; multiclic
Facile+ (sans loupe → souris ×2 → focus ×5) ; réglages fins à deux lignes et 4e valeur
`screen_x9` enregistrée ; zoom navigateur 1,1 / 1,3 appliqué puis retiré ; guide de lecture
suspendu puis rétabli ; Tab pilote le Focus-loupe ; clic droit escamote, clic restaure ; +, -,
Ctrl+molette et flèches changent le niveau ou déplacent la vue ; la saisie clavier n'est pas captée.

Non vérifiable ici (à valider sur appareil) : suivi du doigt et pastille + / - en conditions
tactiles réelles, et le rendu dans l'extension Firefox Nightly Android.

Écart assumé par rapport au plan : **le moteur par capture d'écran n'est pas utilisé** — les trois
loupes reposent sur la copie de page, dans l'extension comme sur le serveur. Aucune nouvelle
permission navigateur n'est donc demandée (repli prévu par le plan). Phases 2 et 3 (scintillement,
iframes/PDF, mémorisation du dernier type, page d'aide, signature AMO) restent ouvertes.

## Journal (29/06/2026 — retours loupes, paquets PC, site)
Site statique (`frontend/src/components/deployment/`) :
- `ServerVersionInfo.jsx` : le lien du paragraphe « version serveur » pointe sur
  confort-plus.orange.com.
- Tous les textes gris clairs sur fond pâle passent en gris foncé
  (`text-confort-ink/50|60|70|80` -> `/85`) dans Hero, DownloadCard, InstallSteps,
  ExperimentalBanner, ServerVersionInfo.
- Nouveau `DesktopDownloads.jsx` : paquets Firefox PC (.xpi) et Chrome/Edge (.zip), avec la
  marche à suivre pour chaque navigateur.

Extension / version serveur :
- `read-aloud.service.ts` + locales : infobulle PC reformulée sur deux lignes
  (« Cliquez pour vocaliser, / appuyez sur Échap. ou clic droit pour arrêter. »), rendu via
  `white-space: pre-line`.
- `magnifier.service.ts` :
  * **Butées de page** : quatre bandes rouges de 12 px (haut, bas, gauche, droite) en
    Agrandisseur, affichées seulement quand la page ne peut plus défiler de ce côté ET que le
    point visé est dans la marge correspondante — donc aussi bien aux flèches, à la souris
    qu'avec les boutons Monter/Descendre (déclenchés par l'écoute du `scroll`).
  * **Focus-loupe** : la fenêtre se pose désormais PAR-DESSUS l'élément focalisé (centrée
    dessus) ; flèches d'exploration haut/bas en plus de gauche/droite, et les touches
    ArrowUp/ArrowDown décalent la vue quand l'élément est plus haut que la fenêtre
    (`exploreOffsetY`).
  * **Premier clic = pose de la loupe, second clic = activation** (comme la vocalisation) :
    écouteur `click` en capture, `MAGNIFIER_ACTIONABLE_SELECTOR`, fenêtre de 1,5 s
    (`MAGNIFIER_ARM_DELAY`). La palette Confort+ et la pastille + / - ne sont jamais concernées.
  * **Ctrl + Maj + Z** : bascule « sans loupe » <-> dernière valeur utilisée sans ouvrir la
    palette (écouteur permanent posé dans le constructeur, valeur enregistrée dans le mode
    d'usage comme un réglage normal).
  * **Pop-ups natives** : une `<dialog>` ouverte avec `showModal()` (cas free.fr) vit dans le
    *top layer*, qu'aucun z-index n'atteint. La loupe devient un `popover="manual"` monté dans
    le top layer uniquement tant qu'une telle pop-up est ouverte (`ensureTopLayer`), puis
    redescend sous la palette. La copie de page repose les `dialog[open]` / `[popover]` à leur
    position réelle (`copyTopLayerElements`) pour que leur contenu soit réellement agrandi.
  * z-index porté à 2147483646 (au-dessus des pop-ups à z-index, sous la palette).

Paquets (`package.json`) : nouveaux scripts `zip:firefox-pc`, `zip:chrome-edge` et
`package:all`. Trois artefacts produits et publiés dans `frontend/public/downloads/` :
`-android.xpi`, `-firefox.xpi` (manifeste Gecko), `-chrome-edge.zip` (manifeste Chromium,
service worker).

Site statique republié : `confort-plus-site-statique-cpm.zip` (66 fichiers, 6,6 Mo) contient
bien la version serveur à jour (vérifié : `ensureTopLayer`, `copyTopLayerElements`, `armClick`
présents dans `js/toolbar.min.js`), les trois paquets et les locales. **L'ancien ZIP en ligne
sur conf-plus-mobile.oakcess.fr/cpm/ doit être remplacé par celui-ci.**

Vérifié en preview (zéro erreur JS) : infobulle sur deux lignes ; bandes rouges 12 px
#dd0000 aux limites et absentes au centre ; fenêtre Focus-loupe superposée et centrée sur
l'élément ; 1er clic arme / 2e clic active pour les trois types et clic unique quand la loupe
est éteinte ; Ctrl+Maj+Z allume, éteint et rallume la dernière valeur ; pop-up native
surmontée par la loupe, contenu agrandi, champ et bouton toujours utilisables ; palette
au-dessus de la loupe hors pop-up (2147483647 contre 2147483646).

## Journal (29/06/2026 — version 6.0.0.1, cadres embarqués, page d'aide, affinages loupes)
Version passée de `6.0.0-alpha.1` à **6.0.0.1** (package.json, manifestes Gecko et Chromium,
noms des paquets, site). Trois paquets publiés : `-android.xpi`, `-firefox.xpi`,
`-chrome-edge.zip`.

`magnifier.service.ts`
- **Clic simple** : la toute première interaction pose la loupe sans activer l'objet ; ensuite
  (`engaged`) un simple clic active hyperliens, boutons, listes déroulantes et tuiles. Le drapeau
  retombe à l'escamotage, pour que le clic de retour repose la loupe avant d'activer.
- **Focus-loupe ajusté à l'objet** (`applyFocusSize`) : largeur = largeur de la cible × zoom + 32,
  bornée à l'écran, hauteur idem bornée à 50 % de l'écran ; un mot tient donc sans défilement, et
  un long lien ou un long texte occupe toute la largeur avec un peu plus de hauteur.
- **Mot pointé** (`wordRangeAtPoint`, `focusFromPoint`, `anchorRect`) : au pointage souris sur du
  texte non cliquable, la fenêtre s'ancre sur le mot sous le curseur (Range) et la vue commence à
  ce mot ; sur un objet activable c'est l'objet entier (`closest`). Le focus clavier garde
  l'élément complet. Corrige le décalage constaté au pointage souris.
- **Infobulles de transition** (`showTransitionHint`, 5 s, trois lignes, au bout du curseur,
  vocalisées via le nouveau `readAloudServiceInstance.speakText` si Lire à haute voix est actif) :
  Loupe souris -> Focus-loupe et Focus-loupe -> Agrandisseur, clés `magnifier_hint_focus` /
  `magnifier_hint_screen` dans les cinq langues.
- **Éléments hors flux** (`freezeOutOfFlowElements`) : dans la copie de page, tout élément en
  `position: fixed` ou `sticky` est reposé en `absolute` à ses coordonnées réelles. C'était la
  cause du cas actu.voici.fr : le bandeau de cookies (div fixed) était focalisable mais jamais
  zoomé, car dans la copie les éléments fixes se calent sur le conteneur agrandi et partent hors
  champ.
- **Cadres embarqués** (`copyMediaElements`) : les `iframe`/`embed`/`object` visibles ne sont plus
  supprimés de la copie (lecteurs vidéo, formulaires de paiement, PDF), avec `allow` retiré et
  `pointer-events: none` ; ceux hors écran deviennent un bloc de même taille. Les `video` sont
  remplacées par leur image courante (canvas, repli sur le poster). **Limite connue** : une iframe
  est rechargée dans la copie, donc les données déjà saisies dans un formulaire de paiement n'y
  apparaissent pas.
- `read-aloud.service.ts` : `speakText()` public (annule la lecture en cours, lit un message
  d'interface) — n'émet rien si Lire à haute voix est éteint.

Site : nouvelle page **/aide-loupes** (`pages/MagnifierHelpPage.jsx`, route dans `App.js`, lien
« Aide loupes » dans l'en-tête) décrivant les trois loupes, les six raccourcis PC dont
Ctrl + Maj + Z, et les gestes mobiles. `.htaccess` renvoie déjà toute URL inconnue sur index.html.

Vérifié en preview (zéro erreur JS) : clics [0, 1, 2] (1er pose, suivants activent) ; fenêtre de
629×316 px pour un lien de 119 px à ×5 et pleine largeur pour un long texte ; mot sous le curseur
capturé en Range et vue commençant dessus ; infobulles sur trois lignes aux deux transitions ;
bandeau fixed reposé en absolute dans la copie et bouton réellement agrandi (×4 mesuré) ; iframe
conservée à sa place ; page d'aide complète ; alignement clone/fenêtre vérifié au pixel
(décalage horizontal résiduel = défilement d'exploration volontaire).

Reste ouvert : scintillement de l'Agrandisseur sur pages très animées, mémorisation du dernier
type d'une page à l'autre, signature Mozilla.

## Journal (30/06/2026 — appui long, décalage au 1er clic, barres fixes, site à la racine)
`magnifier.service.ts`
- **Appui long tactile** (`longPressHandler`, 600 ms, tolérance 12 px) : la loupe se pose sur sa
  dernière valeur sans ouvrir la palette ; un tap court ou un glissement annule. Écouteurs posés
  dans le constructeur, donc actifs même loupe éteinte.
- **Décalage du premier clic sur du texte** : le zoom navigateur (+10 % / +30 %) était appliqué de
  façon asynchrone APRÈS la copie de page, donc la copie correspondait à une mise en page qui
  n'existait plus ; le deuxième clic tombait juste parce qu'une mutation avait relancé la copie.
  `applyBrowserZoom` relance désormais la copie, et le défilement aussi (les éléments collés
  bougent dans la page).
- **Barres de menu fixes non agrandies** (lemonde.fr, Wikipédia) : deux causes corrigées.
  1. Le balayage des éléments `fixed`/`sticky` était abandonné au-delà de 6 000 éléments et
     comparait deux listes plates ; il devient un parcours parallèle original/copie borné à 12
     niveaux de profondeur (`MAGNIFIER_MAX_DEPTH`), sans plafond d'éléments.
  2. Surtout, une copie repositionnée en `absolute` se calait sur le premier ancêtre positionné
     (très fréquent) et partait ailleurs. `placeInDocument` corrige les coordonnées avec l'origine
     réelle du body (`documentOrigin`) et **reparente la copie en enfant direct du body copié**.
     Même traitement pour les `dialog`/`popover`.
  Vérifié : barre `position: fixed` imbriquée dans un parent `relative` → copie en enfant du body,
  à 0,0, lien agrandi ×4 et visible dans la fenêtre.

Version serveur et site
- `VERSION` passe à `6.0.0.1` : « À propos d'Orange Confort+ v6.0.0.1 » (vérifié dans la palette).
- Les services serveur (`path`, `files`, `i18n`, `icons`) honorent `window.__CONFORT_BASE__`
  quand il est défini, au lieu de toujours partir de l'origine du domaine. C'est ce qui empêchait
  la version serveur de fonctionner dans un sous-dossier (le /cpm/ en ligne cherchait ses fichiers
  à la racine du domaine, d'où une palette sans styles ni icônes).
- Le site se construit désormais **pour la racine du domaine** (`PUBLIC_URL` vide, `.htaccess` avec
  `RewriteBase /`), et embarque le dossier **`dist/serveur/`** tel que publié par Orange ; les
  copies en double à la racine (js, css, assets, _locales) ont été supprimées.
  Archive renommée `confort-plus-site-statique.zip` (67 fichiers, 6,7 Mo, 55 fichiers sous
  dist/serveur). LISEZ-MOI réécrit : déploiement racine + réutilisation de dist/serveur ailleurs.
- Page d'aide : mention de l'appui long ajoutée.

Outillage : `build/terser.js` et `postcss.config.js` utilisaient `assert { type: 'json' }`,
supprimé dans Node 24 (le pod a changé de version) — remplacé par `with { type: 'json' }`, sans
quoi aucun paquet ne se construisait plus.

Paquets 6.0.0.1 régénérés (android.xpi, firefox.xpi, chrome-edge.zip) et publiés.
Vérifié en preview (zéro erreur JS, aucune requête en échec) : palette stylée et icônes servies
depuis /dist/serveur, version affichée, trois loupes, appui long, alignement stable dès le premier
clic, page /aide-loupes.
