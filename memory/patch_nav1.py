import io

base = '/app/confort-src/src/app/'
done = []


def shift(block, delta):
    lines = []
    for line in block.split('\n'):
        if delta < 0:
            lines.append(line[-delta:] if line.startswith('\t' * -delta) else line)
        else:
            lines.append(('\t' * delta + line) if line.strip() else line)
    return '\n'.join(lines)


def patch(path, old, new, label):
    """Blocs ecrits avec une tabulation par niveau, recales sur l'indentation du fichier."""
    with io.open(base + path, encoding='utf-8') as handle:
        src = handle.read()

    if new.replace('\t', '') in src.replace('\t', ''):
        done.append(label + ' (deja applique)')
        return

    first = old.split('\n')[0]
    indent = len(first) - len(first.lstrip('\t'))
    targets = set(len(line) - len(line.lstrip('\t')) for line in src.split('\n') if line.strip() == first.strip())
    assert len(targets) == 1, 'ancrage ' + label
    delta = targets.pop() - indent
    old = shift(old, delta)
    new = shift(new, delta)
    assert src.count(old) == 1, label

    with io.open(base + path, 'w', encoding='utf-8') as handle:
        handle.write(src.replace(old, new))

    done.append(label)


# ------------------------------------------------------------------ dom.service
patch('services/dom.service.ts',
	"""\t\t\t\t#${CONTAINER_BUTTONS_ID} button {
\t\t\t\t\tbackground: #f16e00;
\t\t\t\t\tcolor: #000;
\t\t\t\t\tborder: 2px solid currentColor;
\t\t\t\t\tfont-weight: bold;
\t\t\t\t\tpadding: 1em 2em;
\t\t\t\t\toutline: 2px solid #fff;
\t\t\t\t\tbox-shadow: 0 0 6px 3px #bbb;
\t\t\t\t}""",
	"""\t\t\t\t#${CONTAINER_BUTTONS_ID} button {
\t\t\t\t\tbackground: #f16e00;
\t\t\t\t\tcolor: #000;
\t\t\t\t\tborder: 2px solid currentColor;
\t\t\t\t\tfont-weight: bold;
\t\t\t\t\t/* Au repos le bouton se limite a son libelle : il masque beaucoup moins la page */
\t\t\t\t\tpadding: 0.15em 0.45em;
\t\t\t\t\toutline: 2px solid #fff;
\t\t\t\t\tbox-shadow: 0 0 6px 3px #bbb;
\t\t\t\t\ttransition: padding 0.15s ease-out;
\t\t\t\t}

\t\t\t\t#${CONTAINER_BUTTONS_ID} button:hover,
\t\t\t\t#${CONTAINER_BUTTONS_ID} button:focus,
\t\t\t\t#${CONTAINER_BUTTONS_ID} button:focus-visible,
\t\t\t\t#${CONTAINER_BUTTONS_ID} button:active {
\t\t\t\t\tpadding: 1em 2em;
\t\t\t\t}""",
	'boutons de navigation compacts')

patch('services/dom.service.ts',
	"""\t\tfragment.appendChild(container);
\t\tdocument.body.appendChild(fragment);
\t}""",
	"""\t\tfragment.appendChild(container);
\t\tdocument.body.appendChild(fragment);
\t\tthis.keepPaletteClear();
\t}

\t/* La pastille Confort+ ne doit jamais se retrouver sous les boutons de navigation : elle
\t   deviendrait impossible a atteindre au pointeur. */
\tkeepPaletteClear = (): void => {
\t\trequestAnimationFrame(() => dragDropServiceInstance.avoidButtons());
\t}

\t/* Titres, paragraphes, listes et legendes rendus focalisables, pour que la navigation
\t   parcoure tout le contenu de la page et pas seulement les liens et boutons. */
\tmakeTextBlocksFocusable = (flag: string): void => {
\t\tconst elements = Array.from(document.body.querySelectorAll(TEXT_BLOCK_SELECTOR)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < elements.length && count < TEXT_BLOCK_MAX; index++) {
\t\t\tconst element = elements[index];

\t\t\t/* Un bloc qui contient deja un element focalisable n'en recoit pas : la tabulation
\t\t\t   resterait prisonniere du bloc. */
\t\t\tif (element.hasAttribute('tabindex')
\t\t\t\t|| element.closest(APP_NAME)
\t\t\t\t|| element.closest(`#${CONTAINER_BUTTONS_ID}`)
\t\t\t\t|| element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| !element.textContent?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\telement.setAttribute('tabindex', '0');
\t\t\telement.setAttribute(flag, 'true');
\t\t\tcount++;
\t\t}
\t}

\tclearTextBlocksFocusable = (flag: string): void => {
\t\tdocument.body.querySelectorAll(`[${flag}]`).forEach((element: Element) => {
\t\t\telement.removeAttribute('tabindex');
\t\t\telement.removeAttribute(flag);
\t\t});
\t}""",
	'utilitaires dom')

patch('services/dom.service.ts',
	"""\t\tif (document.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.children.length === 0) {
\t\t\tdocument.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.remove();
\t\t\tstylesServiceInstance.removeStyle('container-buttons');
\t\t}""",
	"""\t\tif (document.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.children.length === 0) {
\t\t\tdocument.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.remove();
\t\t\tstylesServiceInstance.removeStyle('container-buttons');
\t\t\tdragDropServiceInstance.refreshPosition();
\t\t}""",
	'retour de la pastille')

# ------------------------------------------------------------ drag-drop.service
patch('services/drag-drop.service.ts',
	"""\tprivate onResize = (): void => {
\t\tthis.clampPosition();
\t}""",
	"""\tprivate onResize = (): void => {
\t\tthis.clampPosition();
\t\tthis.avoidButtons();
\t}

\t/* Pastille posee sur les boutons de navigation : elle remonte juste au-dessus d'eux, sans
\t   ecraser la position choisie par l'utilisateur (elle revient quand les boutons disparaissent). */
\tavoidButtons = (): void => {
\t\tconst container = document.querySelector(`#${CONTAINER_BUTTONS_ID}`) as HTMLElement;

\t\tif (!this.button || !container) {
\t\t\treturn;
\t\t}

\t\tconst rect = this.button.getBoundingClientRect();
\t\tconst zone = container.getBoundingClientRect();

\t\tif (!rect.height || !zone.height) {
\t\t\treturn;
\t\t}

\t\tconst overlap = rect.right > zone.left - BTN_CPLUS_BUTTONS_MARGIN
\t\t\t&& rect.left < zone.right + BTN_CPLUS_BUTTONS_MARGIN
\t\t\t&& rect.bottom > zone.top - BTN_CPLUS_BUTTONS_MARGIN
\t\t\t&& rect.top < zone.bottom + BTN_CPLUS_BUTTONS_MARGIN;

\t\tif (!overlap) {
\t\t\treturn;
\t\t}

\t\tthis.moveTo(rect.left, Math.max(0, zone.top - rect.height - BTN_CPLUS_BUTTONS_MARGIN));
\t}

\t/* Position enregistree, rappelee quand les boutons de navigation disparaissent */
\trefreshPosition = (): void => {
\t\tthis.restorePosition();
\t}""",
	'pastille au-dessus des boutons')

# ------------------------------------------------- navigation-buttons.service
patch('services/settings/navigation-buttons.service.ts',
	"""\tnavigationButtonsList: string[] = ['escape', 'start', 'previous', 'next', 'click'];
\tfullButtonsList: string[] \t\t\t= ['escape', 'start', 'content', 'previous', 'next', 'click'];""",
	"""\tnavigationButtonsList: string[] = ['escape', 'start', 'previous', 'next', 'click'];
\tfullButtonsList: string[] \t\t\t= ['escape', 'start', 'content', 'previous', 'next', 'click'];

\t/* Sur mobile, la serie complete recouvrirait presque toute la page : seuls Precedent et
\t   Suivant restent, les boutons Monter et Descendre occupant deja la ligne du bas. */
\tmobileButtonsList: string[] = ['previous', 'next'];

\t/* Boutons dont le survol prolonge repete l'action, comme Monter et Descendre */
\trepeatableButtons: string[] = ['previous', 'next'];

\tnavTextFlag = `data-${PREFIX}nav-text`;

\tisMobile = (): boolean => {
\t\treturn window.matchMedia('(max-width: 36em), (pointer: coarse)').matches;
\t}""",
	'listes mobiles')

patch('services/settings/navigation-buttons.service.ts',
	"""\t\t\tcase 'navigationSet' :
\t\t\t\tthis.currentList = this.navigationButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tthis.addNavigationButtons();
\t\t\t\tbreak;
\t\t\tcase 'fullSet':
\t\t\t\tthis.currentList = this.fullButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tthis.addNavigationButtons();""",
	"""\t\t\tcase 'navigationSet' :
\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.navigationButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tdomServiceInstance.makeTextBlocksFocusable(this.navTextFlag);
\t\t\t\tthis.addNavigationButtons();
\t\t\t\tbreak;
\t\t\tcase 'fullSet':
\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.fullButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tdomServiceInstance.makeTextBlocksFocusable(this.navTextFlag);
\t\t\t\tthis.addNavigationButtons();""",
	'listes selon l ecran')

patch('services/settings/navigation-buttons.service.ts',
	"""\t\tdocument.removeEventListener('click', this.handlerNavigationButtons);
\t\tdocument.removeEventListener('focusout', this.handlerNavigationButtons);
\t}""",
	"""\t\tdocument.removeEventListener('click', this.handlerNavigationButtons);
\t\tdocument.removeEventListener('focusout', this.handlerNavigationButtons);
\t\tdocument.removeEventListener('focusin', this.handlerNavigationButtons);
\t\tdomServiceInstance.clearTextBlocksFocusable(this.navTextFlag);
\t}""",
	'nettoyage navigation')

patch('services/settings/navigation-buttons.service.ts',
	"""\t\t\t\tif (this.delay > 0) {
\t\t\t\t\tbtnNav.addEventListener('mouseenter', () => {
\t\t\t\t\t\tif (this.hoverTimeoutIds[navigationButton]) {
\t\t\t\t\t\t\tclearTimeout(this.hoverTimeoutIds[navigationButton]!);
\t\t\t\t\t\t}
\t\t\t\t\t\tthis.hoverTimeoutIds[navigationButton] = window.setTimeout(() => {
\t\t\t\t\t\t\tthis.simulateKeyEvent(navigationButton);
\t\t\t\t\t\t\tthis.hoverTimeoutIds[navigationButton] = null;
\t\t\t\t\t\t}, this.delay);
\t\t\t\t\t});

\t\t\t\t\tbtnNav.addEventListener('mouseleave', () => {
\t\t\t\t\t\tif (this.hoverTimeoutIds[navigationButton]) {
\t\t\t\t\t\t\tclearTimeout(this.hoverTimeoutIds[navigationButton]!);
\t\t\t\t\t\t\tthis.hoverTimeoutIds[navigationButton] = null;
\t\t\t\t\t\t}
\t\t\t\t\t});
\t\t\t\t}""",
	"""\t\t\t\tif (this.delay > 0) {
\t\t\t\t\tconst repeatable = this.repeatableButtons.includes(navigationButton);

\t\t\t\t\tbtnNav.addEventListener('mouseenter', () => {
\t\t\t\t\t\tthis.clearHover(navigationButton);

\t\t\t\t\t\tthis.hoverTimeoutIds[navigationButton] = window.setTimeout(() => {
\t\t\t\t\t\t\tthis.simulateKeyEvent(navigationButton);
\t\t\t\t\t\t\tthis.hoverTimeoutIds[navigationButton] = null;

\t\t\t\t\t\t\t/* Precedent et Suivant : le pointeur maintenu sur le bouton continue de
\t\t\t\t\t\t\t   deplacer le focus, au rythme choisi, comme Monter et Descendre. */
\t\t\t\t\t\t\tif (repeatable) {
\t\t\t\t\t\t\t\tthis.repeatIntervalIds[navigationButton] = window.setInterval(() => {
\t\t\t\t\t\t\t\t\tthis.simulateKeyEvent(navigationButton);
\t\t\t\t\t\t\t\t}, this.delay);
\t\t\t\t\t\t\t}
\t\t\t\t\t\t}, this.delay);
\t\t\t\t\t});

\t\t\t\t\tbtnNav.addEventListener('mouseleave', () => this.clearHover(navigationButton));
\t\t\t\t}""",
	'repetition du survol')

patch('services/settings/navigation-buttons.service.ts',
	"""\t\t\tcase 'start':
\t\t\t\trestartTopLeftServiceInstance.setRestartTopLeft();
\t\t\t\tbreak;""",
	"""\t\t\tcase 'start':
\t\t\t\t/* Apres un retour en haut de page, Suivant repart du tout premier element, souvent un
\t\t\t\t   lien d'evitement masque (Aller au contenu). */
\t\t\t\tthis.currentFocusElt = null;
\t\t\t\trestartTopLeftServiceInstance.setRestartTopLeft();
\t\t\t\tbreak;""",
	'debut puis suivant')

patch('services/settings/navigation-buttons.service.ts',
	"""\t\tconst newFocusElt = focusableElements[newIndex];
\t\t(newFocusElt as HTMLElement)?.focus();
\t\tthis.currentFocusElt = newFocusElt;
\t}""",
	"""\t\tconst newFocusElt = focusableElements[newIndex] as HTMLElement;
\t\tnewFocusElt?.focus();
\t\tthis.currentFocusElt = newFocusElt;

\t\t/* Lire a haute voix : c'est l'element de la page qui vient d'etre focalise qui est
\t\t   vocalise, jamais le bouton de navigation qui vient d'etre clique. */
\t\treadAloudServiceInstance.speakFocused(newFocusElt);
\t}

\tclearHover = (name: string): void => {
\t\tif (this.hoverTimeoutIds[name]) {
\t\t\tclearTimeout(this.hoverTimeoutIds[name]!);
\t\t\tthis.hoverTimeoutIds[name] = null;
\t\t}

\t\tif (this.repeatIntervalIds[name]) {
\t\t\tclearInterval(this.repeatIntervalIds[name]!);
\t\t\tthis.repeatIntervalIds[name] = null;
\t\t}
\t}""",
	'vocalisation de l element focalise')

patch('services/settings/navigation-buttons.service.ts',
	"""\thoverTimeoutIds: { [key: string]: number | null } = {};""",
	"""\thoverTimeoutIds: { [key: string]: number | null } = {};
\trepeatIntervalIds: { [key: string]: number | null } = {};""",
	'champ repetition')

patch('services/settings/navigation-buttons.service.ts',
	"""\tgetFocusedElement = (): void => {
\t\tdocument.addEventListener('focus', this.handlerNavigationButtons);
\t}""",
	"""\t/* Suivant et Precedent repartent de l'element reellement focalise, quelle que soit la facon
\t   dont il l'a ete (tabulation, clic, vocalisation). */
\tgetFocusedElement = (): void => {
\t\tdocument.addEventListener('focusin', this.handlerNavigationButtons);
\t}""",
	'suivi du focus')

patch('services/settings/navigation-buttons.service.ts',
	"""\tcreateHandlerNavigationButtons = () => {
\t\treturn (event: any) => {
\t\t\tif (event.type === 'focusout') {
\t\t\t\tthis.currentFocusElt = event.currentTarget;
\t\t\t}
\t\t}
\t}""",
	"""\tcreateHandlerNavigationButtons = () => {
\t\treturn (event: any) => {
\t\t\tif (event.type !== 'focusin') {
\t\t\t\treturn;
\t\t\t}

\t\t\tconst target = event.target as HTMLElement;

\t\t\tif (!target || target === document.body
\t\t\t\t|| target.closest?.(APP_NAME)
\t\t\t\t|| target.closest?.(`#${CONTAINER_BUTTONS_ID}`)) {
\t\t\t\treturn;
\t\t\t}

\t\t\tthis.currentFocusElt = target;
\t\t}
\t}""",
	'handler focusin')

# ------------------------------------------------------- scroll-type.service
patch('services/settings/scroll-type.service.ts',
	"""\tscrollSteps = 100;""",
	"""\t/* Defilement deux fois plus lent qu'a l'origine (100) : il etait trop rapide a suivre */
\tscrollSteps = 50;""",
	'vitesse de defilement')

print('\n'.join(done))
