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

## Journal (02/07/2026 — Focus-loupe en deux états, Agrandisseur Edge/Firefox, alignement des clics)
`magnifier.service.ts`
- **Agrandisseur figé sur Edge et Firefox** : la copie géante était repositionnée en `left`/`top`
  à chaque mouvement en plus du `scale`, ce que ces moteurs ne rafraîchissaient plus. Le rendu
  passe par une **seule transformation** `translate3d(...) scale(...)`, sans layout.
- **Zones de clic décalées entre vue agrandie et page** : en Agrandisseur la vue était centrée sur
  le milieu de l'écran alors que le clic part du pointeur. Le point visé reste désormais **sous le
  curseur** (vérifié : `document.elementFromPoint` et la copie agrandie coïncident).
- **Focus-loupe repensé en deux états** :
  * À l'activation, le focus part du **dernier élément focalisé**, sinon du **premier focusable**
    de la page.
  * **État pending** : focus visible mais non grossi, déplaçable à Tab / Maj+Tab, avec la pastille
    loupe (`Magnify_focus`) — ou loupe + bulle (`Magnify-Vocalize_focus`) si Lire à haute voix est
    actif — posée sur son coin haut droit, et le curseur flèche+loupe
    (`Cursor-magnify pending`, ou flèche+bulle-loupe si vocalisation) appliqué à toute la page.
    Images fournies par l'utilisateur, détourées, réduites et embarquées en data-URI dans
    `constantes.core.ts`.
  * **État zoomé** : atteint par clic, tap ou Entrée sur l'élément visé — texte brut compris, avec
    ancrage sur le mot pointé. Échap., clic droit ou Retour Android ramènent au pending en
    conservant le focus. **Depuis le pending, aucun lien ne peut être activé** ; Échap. y reste
    transmis à la page pour fermer menus et listes déroulantes. Depuis le zoomé, un clic simple
    active (`engaged`).
  * **Défilement du contenu trop large** : 2 s d'attente, aller lent (6 s), retour rapide (1,2 s),
    puis affichage des **quatre triangles pleins** ; n'importe quelle flèche interrompt le
    défilement et affiche les triangles.
  * Les boutons de la palette ne font pas basculer d'état (filtrage `root`/`APP_NAME`) ; « Échap. »
    et « Clique » agissent comme leurs équivalents clavier.
- **Loupe sous les champs de recherche (ecosia.org, edf.fr)** : la Loupe souris et le Focus-loupe
  sont désormais montés en permanence dans le *top layer* (`showPopover`), seul moyen de passer
  au-dessus des habillages de site ; l'Agrandisseur n'y monte que si une pop-up native est
  ouverte, pour rester sous la palette Confort+.
- Correction d'une régression bloquante : le reparentage des éléments `fixed`/`sticky` pendant le
  parcours décalait les listes d'enfants (`children[index]` indéfini) et faisait échouer toute
  activation de la loupe ; les paires sont maintenant collectées puis traitées après le parcours.

Site : page /aide-loupes mise à jour (deux temps du Focus-loupe, nouveaux effets d'Échap. et du
clic). Paquets 6.0.0.1 et archive `confort-plus-site-statique.zip` régénérés (67 fichiers, 6,8 Mo).

Vérifié en preview (zéro erreur JS) : pending à l'activation avec focus, pastille et curseur ;
Tab conserve le pending ; Entrée et clic passent au zoomé sans activer le lien ; clic suivant
active ; Échap. et clic droit reviennent au pending en gardant le focus ; phases d'attente et
d'aller du défilement ; flèche qui stoppe et affiche les quatre triangles ; alignement pointeur /
vue agrandie en Agrandisseur ; bascule des trois types sans résidu.
Non vérifiable ici : rendu réel sur Edge et Firefox (le préview ne teste que Chromium) et sur les
pages citées (ecosia, edf, lemonde) qui ne peuvent pas charger la barre d'outils en test.

## Journal (16/11/2026 — pictos fournis, cadre d'attente, copie sans la loupe, textes focalisables)
`constantes.core.ts` : les quatre pictos sont régénérés à partir des images fournies par
l'utilisateur (`/app/memory/make_pictos.py`, PIL) avec un **liseré blanc épais** (dilatation de
l'alpha) pour rester lisibles sur fond sombre : deux curseurs 32 px (flèche + loupe, flèche + bulle)
et deux pictos de coin 40 px (loupe, bulle). Nouvelles constantes : `MAGNIFIER_FRAME_PADDING`,
`MAGNIFIER_TEXT_SELECTOR`/`MAGNIFIER_TEXT_MAX`/`MAGNIFIER_TEXT_FLAG`,
`MAGNIFIER_CLONE_DELAY`/`_FAST`/`_SETTLE`.

`magnifier.service.ts`
- **Copie de page prise sans la loupe** (loupe dans la loupe, zoom sur zoom) : `cloneContent`
  détache `#cplus-magnifier-root` du document, appelle `buildClone()`, puis le remet en place et
  purge les enregistrements de l'observateur (`takeRecords`) pour ne pas boucler. La suppression par
  sélecteur ne suffisait pas : la copie de référence contenait sa propre image agrandie.
- **Copie fraîche avant chaque rendu de focus** : `setFocusedElement` et `enterZoomed` reclonent
  avant de calculer la vue — c'est ce qui décalait les termes focalisés sur lemonde.fr (les liens
  d'évitement apparaissent au focus et poussent la page) et provoquait le « zoom sur zoom » après
  une entrée en état activé.
- **Menus déroulants, listes et accordéons** : après une activation, `cloneContentSoon()` reprend la
  copie à 60 ms puis à 450 ms, donc la loupe agrandit ce qui vient de se dérouler.
- **Cadre de l'état d'attente** conforme à `Magnify-Vocalize_focus.png` : le cadre épouse l'élément
  focalisé (bord noir 4 px cerclé de blanc), **loupe dans le coin droit**, **bulle de vocalisation
  dans le coin gauche** quand Lire à haute voix est actif ; près du haut de l'écran les pictos
  passent à l'intérieur du cadre (`data-inside`).
- **Fond sombre** : `applyTheme()`/`isDarkBackground()` (luminance du fond de page, repli sur
  `prefers-color-scheme`) posent `data-dark` sur la racine ; cadre d'attente et fenêtre de loupe se
  **cerclent alors de blanc**.
- **Clic en Focus-loupe déjà zoomé** : un clic sur un autre objet le pose d'abord dans la loupe ;
  seul un clic sur l'objet déjà zoomé l'active (plus d'activation immédiate d'un lien).
- **Tabulation en état activé** : `Tab` repasse en état d'attente et laisse l'enchaînement de la
  page, puis des menus du navigateur, se poursuivre (il restait bloqué sur le dernier élément).
- **Focus sorti de la page** (palette Confort+, menus du navigateur) : `clearFocus()` efface cadre
  et fenêtre au lieu de les laisser sur le dernier élément pendant que la tabulation repart en haut.
- **Textes focalisables** : en Focus-loupe, titres, paragraphes, listes, légendes et cellules sans
  tabindex reçoivent `tabindex="0"` (600 max, retirés à l'extinction), donc la navigation parcourt
  tout le contenu et plus seulement liens et boutons.
- **Infobulle de transition** aussi à l'allumage par le **bouton multiclic Loupe**, et plus seulement
  à la molette ou aux touches +/-.

Vérifié en preview (zéro erreur JS) : 40 tabulations successives, cadre aligné au pixel sur le focus
à chaque étape (y compris sur des `p` devenus focalisables) ; pictos visibles pour un élément collé
en haut ; `Entrée` → état zoomé sans aucune trace de loupe dans la copie ; `Tab` en zoomé → retour en
attente ; clic souris en zoomé sur un autre lien → aucune navigation, lien posé dans la loupe ;
`data-dark` et bord blanc sur fond sombre ; menu déroulant de test : 1er clic pose la loupe, 2e
ouvre le menu et la copie agrandit l'entrée dépliée.

Non vérifiable ici : rendu réel sous Edge/Firefox et sur lemonde.fr, ecosia, EDF (le préview ne
teste que Chromium et ces sites ne chargent pas la barre d'outils).

Paquets 6.0.0.1 régénérés, `frontend/public/dist/serveur/` resynchronisé (pictos inclus), site
reconstruit et archive `confort-plus-site-statique.zip` recréée (67 fichiers, 6,78 Mo).

## Journal (16/11/2026 bis — règles de vocalisation affinées, réglage « Durée », textes focalisables)
`read-aloud.service.ts`
- **Enchaînement des vocalisations corrigé** : `speechSynthesis.cancel()` suivi immédiatement d'un
  `speak()` était avalé par les moteurs de synthèse, et le `onend` de la vocalisation annulée
  éteignait celle qui venait d'être lancée. La nouvelle demande est désormais différée de 150 ms
  après une annulation (jeton `speakToken`) et seul `currentUtterance` peut remettre l'état à
  l'arrêt. C'est ce qui faisait qu'un 2e clic arrêtait tout au lieu de vocaliser le nouvel élément,
  au clic comme à la tabulation.
- **Règles de clic** (vérifiées) : même élément non activable ou fond de page → arrêt ; autre élément
  non activable → arrêt du précédent et vocalisation du nouveau ; élément activable → vocalisation
  sans activation, un clic suivant dans la seconde qui suit l'active, au-delà il le vocalise à
  nouveau.
- **Réglage de durée** : `duration` ('onDemand' | 'always'), chargé depuis le mode d'usage à chaque
  activation (`loadDuration`) et modifiable par `setDuration`. En « Sur demande », la mise en focus
  ne vocalise pas (c'est Entrée qui déclenche) ; en « À chaque fois », la tabulation vocalise.
- **Blocs de texte focalisables** (`makeTextFocusable`) : titres, paragraphes, listes, légendes et
  cellules sans tabindex reçoivent `tabindex="0"` (600 max), retirés par `resetBody()` qui purge déjà
  `[data-cplus-tabindex]`.

Interface « Tous les réglages / Audio / Tous les choix » (`edit-read-aloud.component.ts`) : sous-titre
**« Étendue : »** avant les valeurs de portée, puis **« Durée : »** avec un second sélecteur à
chevrons (`Sur demande (Clic, Entrée)` / `À chaque fois (Clic, Tabulation)`), masqué quand l'étendue
vaut « sans vocalisation ».

`modes-of-use.json` → version **1.0.50** (force la mise à jour du stockage local) et nouveau réglage
`readAloudDuration` dans les sept modes : `onDemand` pour Facile+, Vision+, Lecture+, Pointage+ et
Moteur+, `always` pour Vision++ et Lecture++. Libellés ajoutés dans les cinq locales.

Vérifié en preview (zéro erreur JS) : clic texte puis autre texte → deux vocalisations distinctes ;
deux clics sur le même texte → une seule puis arrêt ; clic sur un lien pendant la vocalisation → le
lien est vocalisé sans être activé, le clic suivant l'active ; « Sur demande » → 0 vocalisation à la
tabulation et 1 à Entrée ; « À chaque fois » → chaque tabulation vocalise ; 36 blocs de texte rendus
focalisables ; page de réglage affichant « Scope: / Duration: » avec masquage correct.

Paquets 6.0.0.1 et archive du site régénérés (67 fichiers, 6,78 Mo).

## Journal (17/11/2026 — boutons de navigation, pastille, vocalisation et loupes)
- **Tabulation bloquée sur un paragraphe contenant un lien** : un bloc qui contient déjà un élément
  focalisable ne reçoit plus de `tabindex` (la tabulation y restait prisonnière). Ce sont alors ses
  **phrases** (`.cplus-read-aloud-span`) situées hors des éléments activables qui deviennent
  focalisables, de part et d'autre du lien. Le défaut n'était pas reproductible sous Chromium :
  correction basée sur la cause structurelle (imbrication de focalisables).
- **Focus-loupe** : la vue est calée sur le **premier mot (ou picto)** de l'élément et non sur son
  milieu (`focalX`/`focalY` prennent le minimum entre le départ de l'élément et son centre, donc les
  petits éléments restent centrés).
- **Modale de cookies (orange.fr)** : l'ordre d'empilement d'origine est conservé lors du reposage
  des éléments hors flux dans la copie (`stackingOrder`, `placeInDocument(..., zIndex)`) ; un voile
  gris reposé après la modale la recouvrait. La couche supérieure du navigateur
  (`dialog[open]`, `[popover]`) passe à `z-index: 2147483000`.
- **Boutons de navigation compacts** : au repos leur taille se limite au libellé
  (`padding: 0.15em 0.45em`) ; au survol, au focus ou à l'activation ils reprennent leur grande
  marge (`1em 2em`), avec transition.
- **Pastille Confort+ jamais sous les boutons** (`dragDropServiceInstance.avoidButtons()`, appelé à
  l'ajout des boutons et au redimensionnement) : elle remonte juste au-dessus d'eux et retrouve sa
  position enregistrée quand les boutons disparaissent (`refreshPosition`).
- **Moins de boutons sur mobile** (`isMobile()` = `max-width: 36em` ou `pointer: coarse`) :
  ascenseur inchangé, série navigation réduite à Précédent/Suivant, série complète = Précédent et
  Suivant au-dessus de Monter et Descendre.
- **Début puis Suivant** : `currentFocusElt` est remis à zéro par le bouton Début, donc Suivant
  repart du tout premier élément de la page (souvent un lien d'évitement masqué).
- **Suivant / Précédent** suivent désormais le focus réel (`focusin` au lieu d'un écouteur `focus`
  qui ne se déclenchait jamais) et parcourent aussi les blocs de texte rendus focalisables
  (`domServiceInstance.makeTextBlocksFocusable`, attribut `data-cplus-nav-text`).
- **Vocalisation** : les boutons de navigation Confort+ ne sont plus vocalisés (exclus par
  `isInsideApp`) ; c'est l'élément de page qu'ils focalisent qui l'est (`speakFocused`, inactif en
  « À chaque fois » où le focus déclenche déjà).
- **Survol prolongé** : Précédent et Suivant répètent l'action au rythme choisi (2 s, 3 s, 6 s),
  comme Monter et Descendre (`repeatIntervalIds`, `clearHover`).
- **Défilement Monter/Descendre deux fois plus lent** (`scrollSteps` 100 → 50).
- `modes-of-use.json` → **1.0.51** ; Moteur+ : `noModifications,scrollSet_clicAction,fullSet_clicAction`
  avec « Boutons d'ascenseur à cliquer » par défaut.

Vérifié en preview (zéro erreur JS) : boutons 77×33 au repos et 109×60 au survol ; pastille déplacée
au-dessus des boutons ; Début puis Suivant → premier élément de la page ; clic sur Suivant → seul
l'élément focalisé est vocalisé ; survol maintenu sur Suivant → trois déplacements en 7 s ; modale de
test copiée au-dessus de son voile (z 9001 > 9000) et correctement agrandie ; vue Focus-loupe calée
sur le début du paragraphe ; mobile simulé → Précédent/Suivant seuls au-dessus de Monter/Descendre ;
paragraphe mixte → plus de tabindex sur le bloc, deux phrases focalisables à l'intérieur.

Paquets 6.0.0.1 et archive du site régénérés (67 fichiers, 6,8 Mo).

## Journal (17/11/2026 bis — découpage des unités focalisables par étendue)
`read-aloud.service.ts` — le découpage de la page en unités focalisables dépend maintenant de
l'étendue choisie (`makeFocusUnits`), les liens et boutons de la page restant leurs propres unités :
- **vocaliser le mot pointé** : les phrases sont enveloppées dans `.cplus-read-aloud-unit` (unités de
  navigation), les mots dans `.cplus-read-aloud-span` (unités de pointage) ; les deux coexistent, le
  pointeur vocalise le mot et la tabulation la phrase.
- **vocaliser la phrase pointée** : les phrases servent aux deux (`markSpansFocusable`).
- **vocaliser le paragraphe pointé** : titres, paragraphes, listes, légendes (`markBlocksFocusable`) ;
  un bloc contenant un lien est découpé en fragments de texte de part et d'autre de l'élément
  activable (`wrapMixedBlock`), pour que la tabulation ne reste pas prisonnière du bloc.
- **tout vocaliser** : zones (`markZonesFocusable`) — conteneurs de régions (`header`, `nav`,
  `section`, `ul`, `table`...) ou blocs avec fond/cadre regroupant au moins deux éléments de texte ou
  de lien ; seules les zones les plus fines sont retenues (une zone qui en contient une autre n'en est
  pas une), et `resolveSpeakTarget` renvoie la zone entière au pointage comme au focus.
- Les unités sans lettre ni chiffre (ponctuation isolée) sont écartées (`hasReadableText`).
- `processInChunks` accepte une suite (`onDone`) : en mode mot, les phrases sont enveloppées avant les
  mots, puis les unités sont posées. Limite portée à `TEXT_BLOCK_MAX = 2000` pour couvrir la page
  entière.

**Priorité des découpages** : `magnifierServiceInstance.syncTextUnits()` (appelé par la loupe et par
`setReadAloud`) ne pose les unités de la loupe que si Lire à haute voix est éteint ; de même
`navigationButtonsServiceInstance.applyTextUnits()`. Focus-loupe seul ou boutons de navigation seuls →
découpage par paragraphes ; dès que Lire à haute voix est actif, c'est son découpage qui prime.

**Focus visible en navigation par boutons** : la feuille de style des boutons de navigation ajoute le
cadre noir et blanc de Lire à haute voix (`outline: 4px solid #000`, `box-shadow: 0 0 0 8px #fff`) sur
`:focus` (et non `:focus-visible`, inopérant pour un focus programmatique), donc visible aussi sur
fond sombre. Lire à haute voix applique le même cadre à ses unités.

Vérifié en preview (zéro erreur JS) : mot → 531 mots et 46 phrases, pointage d'un mot = le mot,
tabulation = la phrase (vocalisée en « À chaque fois ») ; phrase → 46 unités ; paragraphe → 37 unités
dont les fragments des blocs mixtes, pointage = paragraphe entier ; tout → 11 zones, pointage = zone
entière ; loupe seule 68 unités / vocalisation 0, puis loupe 0 / vocalisation 93 ; boutons seuls → 34
unités de paragraphe et cadre mesuré `4px solid rgb(0,0,0)` + halo blanc 8 px sur l'élément focalisé.

Paquets 6.0.0.1 et archive du site régénérés (67 fichiers, 6,81 Mo).

## Journal (17/11/2026 ter — tabulation des zones, découpage autour des liens, loupe et boutons)
- **Tout vocaliser, tabulation bloquée sur la zone en cours** : deux causes. Les liens et boutons
  internes restaient dans l'ordre de tabulation (le focus revenait donc dans la zone), et `giveFocus`
  reprenait le focus au profit de la zone à chaque focus d'un enfant. Désormais `untabInside` sort les
  liens et boutons d'une zone de l'ordre de tabulation (valeur d'origine mémorisée dans
  `data-cplus-untab`, restaurée par `clearFocusUnits`), les champs de saisie sont épargnés
  (`resolveSpeakTarget` renvoie `null` pour eux) et `giveFocus` ne reprend jamais le focus à un
  élément contenu dans la cible.
- **Défilement automatique de la vue zoomée** : `MAGNIFIER_EXPLORE_WAIT` 2000 → **1000 ms**.
- **Blocs contenant un lien** : `domServiceInstance.wrapTextFragments` découpe le bloc en
  `span.cplus-text-fragment` focalisables — texte avant le lien, lien, texte après (les fragments sans
  lettre ni chiffre sont ignorés). Utilisé par le Focus-loupe seul et par les boutons de navigation ;
  les fragments sont déballés à l'extinction.
- **Boutons Précédent/Suivant à la souris** : `magnifierServiceInstance.isOwnUi()` écarte la palette
  Confort+ et `#cplus-container-buttons` des événements `pointerdown`, `pointermove` et `click`, donc
  la loupe ne se pose plus sous la souris et l'état d'attente de la page n'est plus perturbé.

Vérifié en preview (zéro erreur JS) : six tabulations en « tout vocaliser » → enchaînement de zones,
13 liens sortis de la tabulation puis tous restaurés à l'extinction ; paragraphe mixte découpé en
`SPAN[tab]` + `A` + « . » et tabulation fragment → lien → titre → paragraphe ; clic sur Suivant avec
Focus-loupe en attente → la loupe reste sur l'élément de page (jamais sur un bouton) et l'état
d'attente est conservé ; attente de défilement mesurée à 1000 ms.

Paquets 6.0.0.1 et archive du site régénérés.

## Journal (17/11/2026 quater — tabulation dans la palette)
- **Ouverture par Entrée** : `showToolbar` retrouve `#close-toolbar` au moment de l'ouverture (il
  n'existe pas encore au `connectedCallback`) et la mise au point est retentée à 0, 120 et 350 ms, le
  temps que la palette soit réellement affichée (elle apparaît avec une transition, un élément encore
  masqué n'est pas focalisable). Vérifié : le focus est sur « Replier la palette » dès l'ouverture.
- **Boucle de tabulation** (`handleToolbarTab` sur le shadow root, `TOOLBAR_FOCUSABLE_SELECTOR`) :
  après le dernier élément de la page courante, la tabulation revient sur le premier élément de la
  palette — « Replier la palette » à l'accueil (le bouton de retour y est masqué), « < » sur les pages
  Réglages, Choix pour ce réglage et Modes d'usage. Maj+Tab reboucle dans l'autre sens.
- **Modes d'usage** : chaque mode porte désormais un nom de groupe distinct
  (`modes-<mode>`) car, dans un groupe de boutons radio, seul le mode coché est atteignable à la
  tabulation ; l'exclusivité est rétablie par `keepSingleChoice` dans la page des modes. Le focus
  arrive sur le mode déplié, puis Tab → bouton du mode → mode suivant. Entrée déplie le mode focalisé
  sans valider le formulaire. Les modes grisés sont hors tabulation (bouton compris).
- **Chevrons des réglages avancés** : quand la flèche actionnée devient grise (première ou dernière
  valeur), le focus passe à l'autre flèche.
- **Retour « Choix pour ce réglage » → « Réglages »** : `restoreSettingFocus` rouvre au besoin la
  catégorie, remet la vue sur le réglage quitté et y repose le focus (bouton multiclic).

Vérifié en preview : focus à l'ouverture, enchaînement mode → bouton → mode suivant, Entrée qui
déplie un seul mode, bouclage depuis le dernier élément vers le premier (modes et accueil).
Non vérifié de bout en bout : le transfert de focus entre chevrons et la restitution du focus au
retour vers les réglages (scénario non reproductible par script, code simple et compilé).

## Journal (17/11/2026 quinquies — code source intégré au dépôt principal)
`confort-src` était un dépôt Git imbriqué : le dépôt principal n'en gardait qu'un lien (gitlink), donc
l'export GitHub ne contenait aucun fichier source. Le lien a été retiré de l'index
(`git rm --cached confort-src`), le `.git` imbriqué supprimé, et les 325 fichiers source indexés
(`src/`, `build/`, `tsconfig*.json`, `package.json`, manifestes, locales, JSON des modes).
Exclusions ajoutées dans `/app/.gitignore` : `confort-src/node_modules/`, `confort-src/dist/`,
`confort-src/docs/`, `confort-src/*.xpi`, `confort-src/*.zip`, `confort-src/web-ext-artifacts/`
(dépendances et sorties de build, régénérables par `npm install && npm run package:all`).
La version serveur livrée reste suivie dans `frontend/public/dist/serveur/`.
Note : l'historique Git amont d'Orange Confort+ contenu dans le `.git` imbriqué n'est plus présent
localement (il reste disponible sur le dépôt public d'origine).
