path = '/app/confort-src/src/app/services/settings/magnifier.service.ts'
src = open(path, encoding='utf-8').read()
done = []


def halve(block):
    return block.replace('\t\t', '\t')


def shift(block, delta):
    lines = []
    for line in block.split('\n'):
        if delta < 0:
            lines.append(line[-delta:] if line.startswith('\t' * -delta) else line)
        else:
            lines.append(('\t' * delta + line) if line.strip() else line)
    return '\n'.join(lines)


def patch(old, new, label):
    global src
    old = halve(old)
    new = halve(new)
    first = old.split('\n')[0]
    indent = len(first) - len(first.lstrip('\t'))
    targets = set(len(line) - len(line.lstrip('\t')) for line in src.split('\n') if line.strip() == first.strip())
    assert len(targets) == 1, 'ancrage ' + label
    delta = targets.pop() - indent
    old = shift(old, delta)
    new = shift(new, delta)
    assert old in src, label
    assert src.count(old) == 1, 'multiple ' + label
    src = src.replace(old, new)
    done.append(label)


# 1. Champ settleTimer
patch(
	"\t\tcloneTimer: any = null;\n",
	"\t\tcloneTimer: any = null;\n\t\tsettleTimer: any = null;\n",
	'champ settleTimer')

# 2. Ecouteur focusout
patch(
	"\t\t\t\twindow.addEventListener('focusin', this.handler, true);\n",
	"\t\t\t\twindow.addEventListener('focusin', this.handler, true);\n\t\t\t\twindow.addEventListener('focusout', this.handler, true);\n",
	'ajout focusout')
patch(
	"\t\t\t\twindow.removeEventListener('focusin', this.handler, true);\n",
	"\t\t\t\twindow.removeEventListener('focusin', this.handler, true);\n\t\t\t\twindow.removeEventListener('focusout', this.handler, true);\n",
	'retrait focusout')

# 3. Nettoyage a la desactivation
patch(
	"""\t\t\t\tclearTimeout(this.cloneTimer);

\t\t\t\twindow.removeEventListener('pointermove'""",
	"""\t\t\t\tclearTimeout(this.cloneTimer);
\t\t\t\tclearTimeout(this.settleTimer);
\t\t\t\tthis.clearTextFocusable();

\t\t\t\twindow.removeEventListener('pointermove'""",
	'nettoyage desactivation')

# 4. applyType : textes focalisables
patch(
	"""\t\t\t\tthis.root.setAttribute('data-type', this.type);
\t\t\t\tthis.stopExploration();
""",
	"""\t\t\t\tthis.root.setAttribute('data-type', this.type);
\t\t\t\tthis.stopExploration();
\t\t\t\tthis.applyTheme();

\t\t\t\tif (this.type === MAGNIFIER_FOCUS) {
\t\t\t\t\t\tthis.makeTextFocusable();
\t\t\t\t} else {
\t\t\t\t\t\tthis.clearTextFocusable();
\t\t\t\t}
""",
	'applyType textes focalisables')

# 5. Copie de page prise sans la loupe
patch(
	"""\t\t\t\tcloneContent = (): void => {
\t\t\t\t\t\tif (!this.content) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst start = performance.now();""",
	"""\t\t\t\tcloneContent = (): void => {
\t\t\t\t\t\tif (!this.content) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tthis.applyTheme();

\t\t\t\t\t\t/* La copie de reference se prend sans la loupe : elle est detachee du document le temps
\t\t\t\t\t\t   du clonage, sinon la vue agrandie contient sa propre image (loupe dans la loupe,
\t\t\t\t\t\t   zoom sur zoom apres une activation). */
\t\t\t\t\t\tconst parent = this.root?.parentNode;
\t\t\t\t\t\tconst next = this.root?.nextSibling;

\t\t\t\t\t\tif (parent) {
\t\t\t\t\t\t\t\ttry {
\t\t\t\t\t\t\t\t\t\tif ((this.root as any).matches(':popover-open')) {
\t\t\t\t\t\t\t\t\t\t\t\t(this.root as any).hidePopover();
\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t} catch (error) {
\t\t\t\t\t\t\t\t\t\t/* popover indisponible */
\t\t\t\t\t\t\t\t}

\t\t\t\t\t\t\t\tthis.topLayerCount = -1;
\t\t\t\t\t\t\t\tparent.removeChild(this.root);
\t\t\t\t\t\t}

\t\t\t\t\t\ttry {
\t\t\t\t\t\t\t\tthis.buildClone();
\t\t\t\t\t\t} finally {
\t\t\t\t\t\t\t\tif (parent) {
\t\t\t\t\t\t\t\t\t\tparent.insertBefore(this.root, next);
\t\t\t\t\t\t\t\t\t\tthis.ensureTopLayer();
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t}
\t\t\t\t}

\t\t\t\tprivate buildClone = (): void => {
\t\t\t\t\t\tconst start = performance.now();""",
	'copie sans la loupe')

# 6. Copie : delais et rafraichissement apres activation
patch(
	"""\t\t\t\tcloneContentQueued = (): void => {
\t\t\t\t\t\tclearTimeout(this.cloneTimer);
\t\t\t\t\t\tthis.cloneTimer = setTimeout(() => {
\t\t\t\t\t\t\t\tthis.cloneContent();
\t\t\t\t\t\t\t\tthis.render();
\t\t\t\t\t\t}, 250);
\t\t\t\t}""",
	"""\t\t\t\tcloneContentQueued = (delay: number = MAGNIFIER_CLONE_DELAY): void => {
\t\t\t\t\t\tclearTimeout(this.cloneTimer);
\t\t\t\t\t\tthis.cloneTimer = setTimeout(() => {
\t\t\t\t\t\t\t\tthis.cloneContent();
\t\t\t\t\t\t\t\tthis.render();
\t\t\t\t\t\t}, delay);
\t\t\t\t}

\t\t\t\t/* Apres une activation (menu deroulant, liste, accordeon) : une copie tout de suite pour
\t\t\t\t   suivre l'ouverture, une seconde une fois l'animation terminee. */
\t\t\t\tcloneContentSoon = (): void => {
\t\t\t\t\t\tthis.cloneContentQueued(MAGNIFIER_CLONE_FAST);
\t\t\t\t\t\tclearTimeout(this.settleTimer);
\t\t\t\t\t\tthis.settleTimer = setTimeout(() => {
\t\t\t\t\t\t\t\tthis.cloneContent();
\t\t\t\t\t\t\t\tthis.render();
\t\t\t\t\t\t}, MAGNIFIER_CLONE_SETTLE);
\t\t\t\t}""",
	'delais de copie')

# 7. Cadre du focus en attente : deux pictos
patch(
	"""\t\t\t\t\t\t<span class="${PREFIX}magnifier-focus-badge"></span>""",
	"""\t\t\t\t\t\t<span class="${PREFIX}magnifier-focus-badge">
\t\t\t\t\t\t\t\t<span class="${PREFIX}magnifier-focus-badge__vocalize"></span>
\t\t\t\t\t\t\t\t<span class="${PREFIX}magnifier-focus-badge__magnify"></span>
\t\t\t\t\t\t</span>""",
	'markup cadre focus')

# 8. enterZoomed : copie fraiche avant le rendu
patch(
	"""\t\t\t\tenterZoomed = (): void => {
\t\t\t\t\t\tthis.pending = false;
\t\t\t\t\t\tthis.manualHints = false;
\t\t\t\t\t\tthis.engaged = true;
\t\t\t\t\t\tstylesServiceInstance.removeStyle('magnifier-cursor');
\t\t\t\t\t\tthis.render();""",
	"""\t\t\t\tenterZoomed = (): void => {
\t\t\t\t\t\tthis.pending = false;
\t\t\t\t\t\tthis.manualHints = false;
\t\t\t\t\t\tthis.engaged = true;
\t\t\t\t\t\tstylesServiceInstance.removeStyle('magnifier-cursor');
\t\t\t\t\t\tthis.cloneContent();
\t\t\t\t\t\tthis.render();""",
	'copie fraiche en entrant en zoome')

# 9. Cadre pose sur l'element focalise
patch(
	"""\t\t\t\t/* Pastille loupe (et vocalisation) posee sur le coin haut droit du focus */
\t\t\t\tupdateFocusBadge = (): void => {
\t\t\t\t\t\tif (!this.focusBadge) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tif (!this.pending || !this.focusedElement) {
\t\t\t\t\t\t\t\tthis.focusBadge.style.display = 'none';
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst rect = this.focusedElement.getBoundingClientRect();

\t\t\t\t\t\tif (!rect.width || !rect.height) {
\t\t\t\t\t\t\t\tthis.focusBadge.style.display = 'none';
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst speaking = readAloudServiceInstance.currentValue !== DEFAULT_VALUE;
\t\t\t\t\t\tthis.focusBadge.setAttribute('data-vocalize', speaking ? 'true' : 'false');
\t\t\t\t\t\tthis.focusBadge.style.display = 'block';
\t\t\t\t\t\tthis.focusBadge.style.left = `${Math.round(rect.right - MAGNIFIER_BADGE_WIDTH)}px`;
\t\t\t\t\t\tthis.focusBadge.style.top = `${Math.round(Math.max(0, rect.top - MAGNIFIER_BADGE_HEIGHT - 2))}px`;
\t\t\t\t}""",
	"""\t\t\t\t/* Cadre pose sur l'element focalise en attente : loupe dans le coin droit, bulle de
\t\t\t\t   vocalisation dans le coin gauche quand Lire a haute voix est actif. */
\t\t\t\tupdateFocusBadge = (): void => {
\t\t\t\t\t\tif (!this.focusBadge) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tif (!this.pending || !this.focusedElement || !document.contains(this.focusedElement)) {
\t\t\t\t\t\t\t\tthis.focusBadge.style.display = 'none';
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst rect = this.focusedElement.getBoundingClientRect();

\t\t\t\t\t\tif (!rect.width || !rect.height) {
\t\t\t\t\t\t\t\tthis.focusBadge.style.display = 'none';
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst speaking = readAloudServiceInstance.currentValue !== DEFAULT_VALUE;
\t\t\t\t\t\tthis.focusBadge.setAttribute('data-vocalize', speaking ? 'true' : 'false');
\t\t\t\t\t\tthis.focusBadge.style.display = 'block';
\t\t\t\t\t\tthis.focusBadge.style.left = `${Math.round(rect.left - MAGNIFIER_FRAME_PADDING)}px`;
\t\t\t\t\t\tthis.focusBadge.style.top = `${Math.round(rect.top - MAGNIFIER_FRAME_PADDING)}px`;
\t\t\t\t\t\tthis.focusBadge.style.width = `${Math.round(rect.width + (2 * MAGNIFIER_FRAME_PADDING))}px`;
\t\t\t\t\t\tthis.focusBadge.style.height = `${Math.round(rect.height + (2 * MAGNIFIER_FRAME_PADDING))}px`;
\t\t\t\t}

\t\t\t\t/* Fond sombre (page ou navigateur) : le cadre et la fenetre se cerclent de blanc */
\t\t\t\tapplyTheme = (): void => {
\t\t\t\t\t\tthis.root?.setAttribute('data-dark', this.isDarkBackground() ? 'true' : 'false');
\t\t\t\t}

\t\t\t\tisDarkBackground = (): boolean => {
\t\t\t\t\t\tconst candidates = [document.body, document.documentElement];

\t\t\t\t\t\tfor (let index = 0; index < candidates.length; index++) {
\t\t\t\t\t\t\t\tconst parts = (getComputedStyle(candidates[index]).backgroundColor || '').match(/[\\d.]+/g);

\t\t\t\t\t\t\t\tif (!parts || parts.length < 3 || (parts.length > 3 && Number(parts[3]) === 0)) {
\t\t\t\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t\t\t}

\t\t\t\t\t\t\t\treturn ((0.299 * Number(parts[0])) + (0.587 * Number(parts[1])) + (0.114 * Number(parts[2]))) < 128;
\t\t\t\t\t\t}

\t\t\t\t\t\treturn window.matchMedia('(prefers-color-scheme: dark)').matches;
\t\t\t\t}

\t\t\t\t/* Focus-loupe : titres, phrases et paragraphes deviennent focalisables, pour que la
\t\t\t\t   tabulation parcoure tout le contenu de la page et pas seulement liens et boutons. */
\t\t\t\tmakeTextFocusable = (): void => {
\t\t\t\t\t\tconst elements = Array.from(document.body.querySelectorAll(MAGNIFIER_TEXT_SELECTOR)) as HTMLElement[];
\t\t\t\t\t\tlet count = 0;

\t\t\t\t\t\tfor (let index = 0; index < elements.length && count < MAGNIFIER_TEXT_MAX; index++) {
\t\t\t\t\t\t\t\tconst element = elements[index];

\t\t\t\t\t\t\t\tif (element.hasAttribute('tabindex') || this.root?.contains(element) || element.closest(APP_NAME)) {
\t\t\t\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t\t\t}

\t\t\t\t\t\t\t\tif (!(element.textContent || '').trim()) {
\t\t\t\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t\t\t}

\t\t\t\t\t\t\t\telement.setAttribute('tabindex', '0');
\t\t\t\t\t\t\t\telement.setAttribute(MAGNIFIER_TEXT_FLAG, 'true');
\t\t\t\t\t\t\t\tcount++;
\t\t\t\t\t\t}
\t\t\t\t}

\t\t\t\tclearTextFocusable = (): void => {
\t\t\t\t\t\tdocument.body.querySelectorAll(`[${MAGNIFIER_TEXT_FLAG}]`).forEach((element: Element) => {
\t\t\t\t\t\t\t\telement.removeAttribute('tabindex');
\t\t\t\t\t\t\t\telement.removeAttribute(MAGNIFIER_TEXT_FLAG);
\t\t\t\t\t\t});
\t\t\t\t}""",
	'cadre focus et utilitaires')

# 10. Infobulle de transition aussi depuis le bouton multiclic
patch(
	"\t\t\t\t\t\tif (!this.bubble || !previousType || previousType === this.type) {",
	"\t\t\t\t\t\t/* Aussi a l'allumage par le bouton multiclic, pas seulement molette et touches +/- */\n\t\t\t\t\t\tif (!this.bubble || previousType === this.type) {",
	'infobulle multiclic')

# 11. Focus perdu : plus rien a montrer
patch(
	"""\t\t\t\tsetFocusedElement = (element: HTMLElement, range: Range = null): void => {
\t\t\t\t\t\tif (!element || this.root?.contains(element) || element.tagName?.toLowerCase() === APP_NAME) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tthis.focusedElement = element;
\t\t\t\t\t\tthis.focusRange = range;
\t\t\t\t\t\tthis.exploreOffset = 0;
\t\t\t\t\t\tthis.exploreOffsetY = 0;
\t\t\t\t\t\tthis.show();
\t\t\t\t\t\tthis.render();""",
	"""\t\t\t\tsetFocusedElement = (element: HTMLElement, range: Range = null): void => {
\t\t\t\t\t\t/* Palette Confort+ ou focus sorti de la page : on efface, au lieu de laisser la vue sur
\t\t\t\t\t\t   l'element precedent pendant que la tabulation repart en haut de page. */
\t\t\t\t\t\tif (!element || element === document.body || this.root?.contains(element)
\t\t\t\t\t\t\t\t|| element.tagName?.toLowerCase() === APP_NAME || element.closest?.(APP_NAME)) {
\t\t\t\t\t\t\t\tthis.clearFocus();
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tthis.focusedElement = element;
\t\t\t\t\t\tthis.focusRange = range;
\t\t\t\t\t\tthis.exploreOffset = 0;
\t\t\t\t\t\tthis.exploreOffsetY = 0;
\t\t\t\t\t\tthis.show();

\t\t\t\t\t\t/* La mise en page bouge avec le focus (liens d'evitement de lemonde.fr qui apparaissent
\t\t\t\t\t\t   puis disparaissent) : la copie est reprise avant de calculer la vue. */
\t\t\t\t\t\tif (this.type === MAGNIFIER_FOCUS && !this.pending) {
\t\t\t\t\t\t\t\tthis.cloneContent();
\t\t\t\t\t\t}

\t\t\t\t\t\tthis.render();""",
	'focus efface hors page')

patch(
	"""\t\t\t\t/* Mot situe sous le pointeur, pour que le Focus-loupe commence a ce mot */""",
	"""\t\t\t\tclearFocus = (): void => {
\t\t\t\t\t\tthis.focusedElement = null;
\t\t\t\t\t\tthis.focusRange = null;
\t\t\t\t\t\tthis.stopExploration();

\t\t\t\t\t\tif (this.focusBadge) {
\t\t\t\t\t\t\t\tthis.focusBadge.style.display = 'none';
\t\t\t\t\t\t}

\t\t\t\t\t\tif (this.viewport) {
\t\t\t\t\t\t\t\tthis.viewport.style.display = 'none';
\t\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t/* Mot situe sous le pointeur, pour que le Focus-loupe commence a ce mot */""",
	'clearFocus')

# 12. Focus-loupe zoome : un clic place d'abord l'objet dans la loupe
patch(
	"""\t\t\t\t\t\tconst actionable = target.closest(MAGNIFIER_ACTIONABLE_SELECTOR) as HTMLElement;

\t\t\t\t\t\tif (!actionable) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst now = Date.now();

\t\t\t\t\t\t/* Une fois la loupe posee, un simple clic active l'objet vise */
\t\t\t\t\t\tif (this.engaged && !this.hidden) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}""",
	"""\t\t\t\t\t\tconst actionable = target.closest(MAGNIFIER_ACTIONABLE_SELECTOR) as HTMLElement;

\t\t\t\t\t\t/* Focus-loupe deja zoome : un clic sur un autre objet le pose d'abord dans la loupe ;
\t\t\t\t\t\t   seul un clic sur l'objet deja zoome l'active. */
\t\t\t\t\t\tif (this.type === MAGNIFIER_FOCUS && !this.hidden) {
\t\t\t\t\t\t\t\tconst current = this.focusedElement;
\t\t\t\t\t\t\t\tconst sameTarget = !!current && (current === (actionable || target) || current.contains(target));

\t\t\t\t\t\t\t\tif (!sameTarget) {
\t\t\t\t\t\t\t\t\t\tevent.preventDefault();
\t\t\t\t\t\t\t\t\t\tevent.stopPropagation();
\t\t\t\t\t\t\t\t\t\tthis.focusFromPoint(target, event.clientX, event.clientY);
\t\t\t\t\t\t\t\t\t\tthis.focusedElement?.focus?.();
\t\t\t\t\t\t\t\t\t\tthis.enterZoomed();
\t\t\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t\t\t}

\t\t\t\t\t\t\t\tthis.cloneContentSoon();
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tif (!actionable) {
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tconst now = Date.now();

\t\t\t\t\t\t/* Une fois la loupe posee, un simple clic active l'objet vise : la copie est reprise
\t\t\t\t\t\t   aussitot pour agrandir ce qui vient de se derouler (menu, liste, accordeon). */
\t\t\t\t\t\tif (this.engaged && !this.hidden) {
\t\t\t\t\t\t\t\tthis.cloneContentSoon();
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}""",
	'clic en focus zoome')

# 13. focusout : le focus quitte la page
patch(
	"""\t\t\t\t\t\t\t\tcase 'keydown':
\t\t\t\t\t\t\t\t\t\tthis.keyHandler(event);""",
	"""\t\t\t\t\t\t\t\tcase 'focusout':
\t\t\t\t\t\t\t\t\t\tif (this.type === MAGNIFIER_FOCUS) {
\t\t\t\t\t\t\t\t\t\t\t\tsetTimeout(() => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tconst active = document.activeElement as HTMLElement;

\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!active || active === document.body) {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tthis.clearFocus();
\t\t\t\t\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\t\t\t}, 0);
\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\tbreak;

\t\t\t\t\t\t\t\tcase 'keydown':
\t\t\t\t\t\t\t\t\t\tthis.keyHandler(event);""",
	'focusout')

# 14. Tabulation : retour en attente, l'enchainement de la page n'est pas bloque
patch(
	"""\t\t\t\t\t\tif (event.key === 'Escape' || event.key === 'GoBack' || event.key === 'BrowserBack') {""",
	"""\t\t\t\t\t\tif (event.key === 'Tab' && this.type === MAGNIFIER_FOCUS && !this.pending) {
\t\t\t\t\t\t\t\t/* La tabulation reprend la main : retour en attente et l'enchainement de la page,
\t\t\t\t\t\t\t\t   puis des menus du navigateur, n'est plus bloque sur le dernier element. */
\t\t\t\t\t\t\t\tthis.enterPending();
\t\t\t\t\t\t\t\treturn;
\t\t\t\t\t\t}

\t\t\t\t\t\tif (event.key === 'Escape' || event.key === 'GoBack' || event.key === 'BrowserBack') {""",
	'tabulation en zoome')

# 15. Styles : cadre, pictos et cerclage blanc sur fond sombre
patch(
	"""\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge {
\t\t\t\t\t\t\t\tposition: fixed;
\t\t\t\t\t\t\t\tdisplay: none;
\t\t\t\t\t\t\t\twidth: ${MAGNIFIER_BADGE_WIDTH}px;
\t\t\t\t\t\t\t\theight: ${MAGNIFIER_BADGE_HEIGHT}px;
\t\t\t\t\t\t\t\tbackground-image: url("${MAGNIFIER_BADGE_MAGNIFY}");
\t\t\t\t\t\t\t\tbackground-repeat: no-repeat;
\t\t\t\t\t\t\t\tbackground-position: right bottom;
\t\t\t\t\t\t\t\tbackground-size: contain;
\t\t\t\t\t\t\t\tfilter: drop-shadow(0 0 2px white);
\t\t\t\t\t\t\t\tz-index: 2147483646;
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge[data-vocalize="true"] {
\t\t\t\t\t\t\t\tbackground-image: url("${MAGNIFIER_BADGE_VOCALIZE}");
\t\t\t\t\t\t}""",
	"""\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge {
\t\t\t\t\t\t\t\tposition: fixed;
\t\t\t\t\t\t\t\tdisplay: none;
\t\t\t\t\t\t\t\tbox-sizing: border-box;
\t\t\t\t\t\t\t\tborder: 4px solid black;
\t\t\t\t\t\t\t\tborder-radius: 0.75rem;
\t\t\t\t\t\t\t\tbox-shadow: 0 0 0 3px white, inset 0 0 0 3px white;
\t\t\t\t\t\t\t\tz-index: 2147483646;
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__magnify,
\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__vocalize {
\t\t\t\t\t\t\t\tposition: absolute;
\t\t\t\t\t\t\t\ttop: -${MAGNIFIER_BADGE_HEIGHT + 4}px;
\t\t\t\t\t\t\t\twidth: ${MAGNIFIER_BADGE_WIDTH}px;
\t\t\t\t\t\t\t\theight: ${MAGNIFIER_BADGE_HEIGHT}px;
\t\t\t\t\t\t\t\tbackground-repeat: no-repeat;
\t\t\t\t\t\t\t\tbackground-position: center;
\t\t\t\t\t\t\t\tbackground-size: contain;
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__magnify {
\t\t\t\t\t\t\t\tright: -4px;
\t\t\t\t\t\t\t\tbackground-image: url("${MAGNIFIER_BADGE_MAGNIFY}");
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__vocalize {
\t\t\t\t\t\t\t\tdisplay: none;
\t\t\t\t\t\t\t\tleft: -4px;
\t\t\t\t\t\t\t\tbackground-image: url("${MAGNIFIER_BADGE_VOCALIZE}");
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge[data-vocalize="true"] .${PREFIX}magnifier-focus-badge__vocalize {
\t\t\t\t\t\t\t\tdisplay: block;
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID}[data-dark="true"] .${PREFIX}magnifier-focus-badge {
\t\t\t\t\t\t\t\tborder-color: white;
\t\t\t\t\t\t\t\tbox-shadow: 0 0 0 3px black, inset 0 0 0 3px black;
\t\t\t\t\t\t}

\t\t\t\t\t\t#${MAGNIFIER_ROOT_ID}[data-dark="true"] .${PREFIX}magnifier-viewport {
\t\t\t\t\t\t\t\tborder-color: white;
\t\t\t\t\t\t\t\tbox-shadow: 0 0 0 3px black, 0 0 16px 6px rgba(0, 0, 0, 0.45);
\t\t\t\t\t\t}""",
	'styles cadre focus')

open(path, 'w', encoding='utf-8').write(src)
print('\n'.join(done))
