# Confort+ — Loupes continues (Loupe souris, Focus-loupe, Agrandisseur)

Le bouton multiclic « Loupe » de Confort+ est remplacé par les trois loupes de l'extension
Loupe-Zoom, reliées entre elles par une continuité de zoom allant du ×2 au ×20, sur PC et mobile.

## Pour qui

- Personnes malvoyantes qui ont besoin d'un grossissement fort et permanent (Vision++).
- Personnes qui naviguent au clavier et perdent le fil du focus (Vision+).
- Personnes qui ont ponctuellement besoin de relire un petit texte à la souris (Facile+ et autres modes).
- Utilisateurs de la version serveur, qui gardent une loupe équivalente intégrée aux sites équipés.

## Fonctionnalités et expérience

**Trois types de loupe**

| Type | Niveaux | Comportement |
| --- | --- | --- |
| Loupe souris | ×2 à ×4 | Bulle ronde qui suit le pointeur (ou le doigt) et agrandit la zone sous lui. |
| Focus-loupe | ×2 à ×9 | Fenêtre rectangulaire posée sur l'élément qui reçoit le focus (tabulation sur PC, tap sur mobile) ; pour un élément plus large que la fenêtre, le contenu défile une fois de gauche à droite puis revient, et des flèches invitent à explorer au clavier. |
| Agrandisseur | ×8 à ×20 | Tout l'écran est agrandi ; on se déplace à la souris, aux flèches ou au doigt, et la page défile quand on atteint un bord. Un clic ou Entrée active l'élément visé au centre. |

**Continuité entre les niveaux.** Monter au-delà du maximum d'un type bascule dans le type suivant
sans coupure (Loupe souris ×4 → Focus-loupe ×5 → Agrandisseur ×10), et redescendre ramène au type
précédent. À chaque palier franchi, le zoom du navigateur est aussi augmenté (+10 % puis +30 %
au-dessus du zoom qu'avait l'utilisateur), et il est restitué à l'extinction de la loupe.

**Valeurs du bouton multiclic**, selon le mode d'usage, la première étant toujours la valeur par défaut :

- Facile+ et tous les autres modes : sans loupe · Loupe souris ×2 · Focus-loupe ×5
- Vision+ : sans loupe · Loupe souris ×4 · Focus-loupe ×5
- Vision++ : sans loupe · Focus-loupe ×7 · Agrandisseur ×9

**Réglages fins**, dans la fenêtre de réglages déjà utilisée par les autres fonctions : une première
ligne pour choisir le type de loupe parmi les trois, une seconde ligne pour choisir le niveau de zoom
proposé par ce type. Dès qu'une combinaison sort des valeurs du bouton multiclic, elle devient la
quatrième valeur « personnalisé » du bouton, comme pour les autres réglages de Confort+.

**Commandes sur PC** pendant que la loupe est active : Ctrl + molette ou les touches + et - pour
changer de niveau, les flèches pour explorer (Ctrl pour un pas fin), Échap. ou clic droit pour
escamoter la loupe tout en la gardant disponible au bout du pointeur, un clic ou Entrée pour la
faire revenir puis valider l'élément visé, Tab pour passer d'élément en élément.

**Commandes sur mobile** : un bouton flottant + / - apparaît pendant trois secondes après chaque
appui sur le bouton multiclic Loupe et permet de changer le niveau de zoom ; il réapparaît à chaque
changement. La Loupe souris et l'Agrandisseur suivent le doigt ; le Focus-loupe se pose sur
l'élément touché et y reste.

**Version serveur** : la loupe reste disponible et garde la technique d'agrandissement actuelle
(agrandissement d'une copie de la page, qui ne demande aucune permission navigateur). Le bouton
multiclic et les réglages fins y proposent exactement les mêmes types et niveaux que dans
l'extension : la Loupe souris suit le pointeur, le Focus-loupe se pose sur l'élément focalisé et
l'Agrandisseur couvre l'écran. Le rendu peut y être moins fidèle que dans l'extension sur les pages
chargées (vidéos, canevas, cadres embarqués) et le grossissement très fort y est plus lent ; un
repli automatique ramène dans ce cas la fenêtre à un niveau tenable plutôt que de figer la page.

**Cohabitation** : la vocalisation, les contrastes et les autres réglages restent actifs en même
temps que la loupe ; seul le « Guide de lecture » se met en pause pendant que la loupe est allumée
et reprend à son extinction.

## Parcours utilisateur

1. L'utilisateur ouvre la palette Confort+ : le bouton Loupe est sur « sans loupe ».
2. Un clic passe à la première loupe du mode courant ; sur mobile le bouton + / - apparaît trois secondes.
3. La loupe suit le pointeur, le focus ou l'écran entier selon le type ; le niveau se change à la
   molette, au clavier ou avec + / -, et franchir un maximum fait glisser vers le type suivant.
4. Un clic droit ou Échap. escamote la loupe sans la quitter ; un clic ou Entrée la ramène sur
   l'élément visé et l'active.
5. Un dernier clic sur le bouton multiclic revient à « sans loupe » : le zoom du navigateur et le
   guide de lecture retrouvent leur état d'avant.
6. Depuis les réglages fins, l'utilisateur choisit un autre type ou un autre niveau ; le bouton
   multiclic affiche alors « personnalisé ».

## Ambiance d'interface

Rien de nouveau visuellement : les trois loupes reprennent l'habillage déjà en place dans Confort+
(bouton multiclic avec son libellé et son icône, fenêtre de réglages fins à deux lignes). La loupe
elle-même garde l'aspect de Loupe-Zoom : bulle ronde à faible grossissement, fenêtre à coins
arrondis pour le focus, plein écran pour l'agrandisseur, petite étiquette « ×N » qui s'affiche deux
secondes à chaque changement de niveau, pastille loupe au-dessus du focus quand la loupe est
escamotée, flèches noires sur les bords quand une exploration manuelle est utile, et barres
d'arrivée en bord de page. Le bouton + / - mobile est une pastille sombre à fort contraste, posée
en bas de l'écran, qui s'efface en fondu.

## Phases

**Phase 1 — le MVP, construit maintenant.** Les trois types de loupe et la continuité entre eux,
les valeurs du bouton multiclic par mode d'usage, les réglages fins à deux lignes avec la quatrième
valeur personnalisée, les commandes PC complètes, le suivi du doigt et le bouton + / - sur mobile,
les trois types rendus par copie de page en version serveur, la mise en pause du guide de lecture,
et les libellés en français et en anglais. Validation des réglages sur Facile+, Vision+ et Vision++
uniquement.

**Phase 2 — finitions.** Réduction du scintillement de l'agrandisseur sur les pages très animées,
prise en charge des cadres embarqués (iframes, lecteurs vidéo, formulaires de paiement) et des
documents PDF, mémorisation du dernier type utilisé d'une page à l'autre, tailles de fenêtre
affinées par niveau, et les libellés espagnol, italien et polonais.

**Phase 3 — diffusion.** Nouveau paquet d'extension et mise à jour du site de téléchargement,
page d'aide décrivant les trois loupes et leurs commandes, et, si souhaité, reprise de la signature
Mozilla restée en attente.

## Hypothèses

- Deux moteurs d'agrandissement coexistent : l'extension utilise la capture d'écran de Loupe-Zoom,
  la version serveur conserve l'agrandissement par copie de page déjà en place. Les deux exposent le
  même bouton, les mêmes types et les mêmes niveaux ; seule la fidélité du rendu diffère.
- L'agrandissement par capture d'écran exige une nouvelle permission navigateur. Les utilisateurs
  déjà équipés devront accepter cette permission à la mise à jour, sur PC comme sur mobile.
- Cette capture d'écran est supposée disponible dans Firefox Nightly pour Android ; c'est le
  principal risque technique du projet et il n'est vérifiable que sur l'appareil. À défaut,
  l'extension mobile basculerait sur le même agrandissement par copie de page que la version
  serveur, moins fidèle, et l'Agrandisseur mobile y serait plus lent.
- Les trois loupes gardent les plages de zoom de Loupe-Zoom (×2–×4, ×2–×9, ×8–×20) : un niveau
  demandé hors de ces bornes bascule dans le type voisin plutôt que d'être refusé.
- La valeur « sans loupe » remplace la valeur de loupe actuellement enregistrée dans chaque mode
  d'usage, y compris pour les utilisateurs qui avaient déjà choisi une autre valeur.
- Le niveau et le type choisis dans les réglages fins sont mémorisés comme les autres réglages
  Confort+, et retrouvés à la session suivante.
- Sur mobile, le bouton + / - se place en bas au centre, à distance de la pastille Confort+, et
  disparaît après trois secondes sans appui ; aucun autre moyen de changer de niveau n'est ajouté.
- Les raccourcis propres à Loupe-Zoom qui doublonnent avec Confort+ ne sont pas repris : la loupe
  s'allume et s'éteint uniquement depuis le bouton multiclic, sans raccourci clavier global.
- Le mode de débogage de Loupe-Zoom (badge rouge, journaux détaillés) n'est pas repris.
