# Orange Confort+ — Portage Firefox Nightly Android

## Problème / Objectif
Adapter l'extension navigateur Orange Confort+ (dépôt GitHub Orange-OpenSource,
branche develop) pour qu'elle fonctionne sur Firefox Nightly Android (mobile
d'abord). Produire un .xpi + instructions. Adapter la palette au petit écran.
Conserver la logique des boutons multi-clics (3 états + 1 perso) et des modes d'usage.

## Contexte technique
- Code source cloné dans /app/confort-src (branche develop, v5.5.1).
- Stack: TypeScript (web components + Boosted/Bootstrap fork), SCSS, build via npm + web-ext.
- Architecture extension MV3: background (main.ts) -> action.onClicked -> scripting.executeScript(toolbar.js).
  La palette est un shadow DOM injecté dans la page.

## Réalisé (2026-06)
- Manifeste Firefox: ajout browser_specific_settings.gecko_android (strict_min_version 120.0).
- main.ts: helper safeAction() encapsulant setIcon/enable/disable par onglet (non supportés Android);
  ajout moz-extension:/resource: aux pages internes. Flux d'injection inchangé.
- toolbar.scss: palette plein écran sur mobile (@media max-width:36em -> width:100vw),
  max-height:100dvh, safe-area-inset. Panneau 24em conservé sur desktop.
- Logique multi-clics (btn-setting.component.ts) et modes d'usage (mode-of-use.service.ts) NON modifiées.
- Build OK, addons-linter: 0 erreur / 0 warning (Android compatible).
- Scripts npm ajoutés: build:android, zip:android, run:android, sign:android.
- Vérification visuelle à 390px: palette plein écran + modes + boutons multi-clics OK.
- Livrables: orange-confort-plus-5.5.1-android.xpi, ANDROID_FIREFOX.md (guide install/USB/signature AMO).

## Contrainte connue
Firefox Android n'installe de façon permanente que des .xpi SIGNÉS par Mozilla.
- Test temporaire: web-ext run -t firefox-android (USB/adb).
- Installation permanente: signer via AMO (web-ext sign --channel=unlisted) puis
  "Installer une extension à partir d'un fichier".

## Backlog / Next
- Signature AMO (nécessite clés API Mozilla de l'utilisateur).
- Affiner l'ergonomie tactile (taille cibles, drag du bouton flottant) si retour utilisateur.
- Tester d'autres modes (magnifier, lecture audio) sur appareil réel.
