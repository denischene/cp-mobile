# Orange Confort+ sur Firefox Nightly Android

Ce document explique comment l'extension **Orange Confort+** a été adaptée pour
fonctionner sur **Firefox Nightly pour Android**, et comment la construire /
l'installer sur un vrai téléphone.

---

## 1. Ce qui a été adapté

| Domaine | Changement | Fichier |
|---|---|---|
| Manifeste | Ajout de la clé `browser_specific_settings.gecko_android` (compatibilité Android déclarée à Firefox, `strict_min_version: 120.0`) | `src/extension/manifest.firefox.json` |
| Script d'arrière-plan | Les appels d'action par onglet (`setIcon`, `enable`, `disable`) — non implémentés sur Android — sont encapsulés dans un helper `safeAction()` : une erreur mobile ne casse plus l'injection de la palette. Ajout de `moz-extension:`/`resource:` aux pages internes ignorées. | `src/extension/scripts/main.ts` |
| Palette (UI) | La palette occupe désormais **toute la largeur** sur petit écran (`@media (max-width: 36em)` → `width: 100vw`), avec `max-height: 100dvh` (hauteur de viewport dynamique) et respect des encoches (`safe-area-inset`). Sur desktop elle reste un panneau latéral de 24em. | `src/styles/06-components/toolbar.scss` |

### Logique **conservée telle quelle** (non modifiée)
- **Boutons multi-clics** (3 états par défaut + 1 valeur personnalisable) — `src/app/shared/btn-setting.component.ts`.
- **Modes d'usage** (Easy+, Vision+, Reading+, Motor+, …) — `src/app/services/mode-of-use.service.ts` et `src/assets/json/modes-of-use.json`.

Le flux de fonctionnement reste identique à celui du bureau : appui sur le bouton
de l'extension → `action.onClicked` → injection de `toolbar.js` dans la page via
`scripting.executeScript` (déjà compatible Android car il utilise `tab.id`).

---

## 2. Construire le paquet

Pré-requis : Node.js ≥ 18, puis `npm install` une fois.

```shell
# Génère dist/extension avec le manifeste Firefox + produit le .xpi Android
npm run build:android
```

Le fichier produit :

```
orange-confort-plus-5.5.1-android.xpi
```

> `npm run build:android` = build complet + `zip:android`.
> Si `dist/extension` est déjà construit, `npm run zip:android` suffit.

Vérification de conformité (0 erreur / 0 avertissement, y compris Android) :

```shell
npx addons-linter orange-confort-plus-5.5.1-android.xpi \
  --disable-linter-rules=no-unsanitized/property,no-unsanitized/method
```

---

## 3. Installer sur un vrai téléphone Android

> ⚠️ **Important (contrainte Mozilla)** : Firefox pour Android **n'installe de
> façon permanente que des extensions signées par Mozilla**. Le `.xpi` produit
> ci‑dessus n'est **pas signé**. Deux chemins existent :

### Option A — Test temporaire par USB (aucune signature, recommandé pour valider)
Depuis un PC, téléphone branché en USB.

1. Sur le téléphone : **Paramètres Firefox → À propos de Firefox** puis tapez 5×
   sur le logo pour activer le menu développeur ; activez **Débogage à distance
   via USB**.
2. Installez `adb` et vérifiez : `adb devices`.
3. Sur le PC, dans le dossier du projet :
   ```shell
   npm run run:android
   # équivaut à :
   # web-ext run -t firefox-android --firefox-apk org.mozilla.fenix --source-dir ./dist/extension
   ```
   (Pour Nightly, remplacez l'APK par `org.mozilla.fenix` → `org.mozilla.fenix`
   reste l'ID Nightly le plus courant ; sinon `org.mozilla.firefox`.)
4. `web-ext` liste les appareils/APK et charge l'extension **temporairement**
   (jusqu'au redémarrage du navigateur).

### Option B — Installation permanente (signature AMO)
Pour garder l'extension installée durablement, elle doit être signée par Mozilla
(distribution « unlisted », gratuite, non publique).

1. Créez des identifiants API sur https://addons.mozilla.org/developers/addon/api/key/
2. Signez :
   ```shell
   WEB_EXT_API_KEY=user:XXXX:XXX WEB_EXT_API_SECRET=xxxxxxxx npm run sign:android
   ```
   `web-ext sign` renvoie un `.xpi` **signé**.
3. Transférez ce `.xpi` signé sur le téléphone, puis :
   **Paramètres Firefox → (menu développeur activé) → Installer une extension à
   partir d'un fichier** → sélectionnez le `.xpi` signé.

> Firefox **Nightly** permet aussi d'ajouter une **collection AMO personnalisée**
> (Paramètres → Custom Add-on collection) pour installer une extension publiée en
> unlisted/collection sans câble.

---

## 4. Utilisation sur mobile

1. Ouvrez une page web.
2. Menu **⋮ → Extensions → Orange Confort+** (l'action déclenche l'injection).
3. Le bouton flottant Confort+ apparaît ; appuyez dessus pour ouvrir la palette
   (désormais plein écran sur mobile).
4. Choisissez un **mode d'usage**, puis ajustez les réglages avec les **boutons
   multi-clics**.
