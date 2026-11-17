import io

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
    with io.open(path, encoding='utf-8') as handle:
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

    with io.open(path, 'w', encoding='utf-8') as handle:
        handle.write(src.replace(old, new))

    done.append(label)


READ = '/app/confort-src/src/app/services/settings/read-aloud.service.ts'
MAG = '/app/confort-src/src/app/services/settings/magnifier.service.ts'
NAV = '/app/confort-src/src/app/services/settings/navigation-buttons.service.ts'
DOM = '/app/confort-src/src/app/services/dom.service.ts'

# ------------------------------------------------------------------- read-aloud
patch(READ,
	"""\treadAloudSpan = `${PREFIX}read-aloud-span`;""",
	"""\treadAloudSpan = `${PREFIX}read-aloud-span`;
\t/* Unite de navigation : la phrase quand on vocalise mot a mot, le fragment de texte d'un
\t   paragraphe mixte. Distincte du span de pointage pour que les deux coexistent. */
\treadAloudUnit = `${PREFIX}read-aloud-unit`;""",
	'classe unite')

patch(READ,
	"""\tprivate processInChunks = (items: any[], callback: (item: any) => void): void => {""",
	"""\tprivate processInChunks = (items: any[], callback: (item: any) => void, onDone?: () => void): void => {""",
	'processInChunks signature')

patch(READ,
	"""\t\t\tif (index < items.length) {
\t\t\t\tsetTimeout(run, 0);
\t\t\t}
\t\t};""",
	"""\t\t\tif (index < items.length) {
\t\t\t\tsetTimeout(run, 0);
\t\t\t\treturn;
\t\t\t}

\t\t\tonDone?.();
\t\t};""",
	'processInChunks fin')

patch(READ,
	"""\tprivate setBodyToWords = (): void => {
\t\tthis.processInChunks(Array.from(this.getBodyElements()), (child: any) => {""",
	"""\tprivate setBodyToWords = (onDone?: () => void): void => {
\t\tthis.processInChunks(Array.from(this.getBodyElements()), (child: any) => {""",
	'setBodyToWords signature')

patch(READ,
	"""\t\t\t\t\t\tconst fragment = this.createFragmentForWords(text);
\t\t\t\t\t\tparent.insertBefore(fragment, node);
\t\t\t\t\t\tparent.removeChild(node);
\t\t\t\t\t}
\t\t\t\t}
\t\t\t});
\t\t});
\t}""",
	"""\t\t\t\t\t\tconst fragment = this.createFragmentForWords(text);
\t\t\t\t\t\tparent.insertBefore(fragment, node);
\t\t\t\t\t\tparent.removeChild(node);
\t\t\t\t\t}
\t\t\t\t}
\t\t\t});
\t\t}, onDone);
\t}""",
	'setBodyToWords callback')

patch(READ,
	"""\tprivate setBodyToSentences = (): void => {
\t\tthis.processInChunks(Array.from(this.getBodyElements()), (element: Element) => {
\t\t\tif (element.closest(`.${this.readAloudSpan}`)
\t\t\t\t|| element.matches(this.structuralParents)
\t\t\t\t|| this.isFlexOrGrid(element as HTMLElement)) {
\t\t\t\treturn;
\t\t\t}

\t\t\tthis.groupSentences(element as HTMLElement);
\t\t});
\t}

\tprivate groupSentences = (element: HTMLElement): void => {""",
	"""\tprivate setBodyToSentences = (className: string = this.readAloudSpan, onDone?: () => void): void => {
\t\tthis.processInChunks(Array.from(this.getBodyElements()), (element: Element) => {
\t\t\tif (element.closest(`.${className}`)
\t\t\t\t|| element.matches(this.structuralParents)
\t\t\t\t|| this.isFlexOrGrid(element as HTMLElement)) {
\t\t\t\treturn;
\t\t\t}

\t\t\tthis.groupSentences(element as HTMLElement, className);
\t\t}, onDone);
\t}

\tprivate groupSentences = (element: HTMLElement, className: string = this.readAloudSpan): void => {""",
	'setBodyToSentences parametre')

patch(READ,
	"""\t\t\tif (group.length > 0 && text !== '') {
\t\t\t\tconst span = document.createElement('span');
\t\t\t\tspan.classList.add(this.readAloudSpan);""",
	"""\t\t\tif (group.length > 0 && text !== '') {
\t\t\t\tconst span = document.createElement('span');
\t\t\t\tspan.classList.add(className);""",
	'groupSentences classe')

patch(READ,
	"""\t\tswitch (value) {
\t\t\tcase 'word':
\t\t\t\tthis.setBodyToWords();
\t\t\t\tbreak;
\t\t\tcase 'sentence':
\t\t\t\tthis.setBodyToSentences();
\t\t\t\tbreak;
\t\t\tdefault:
\t\t\t\tbreak;
\t\t}""",
	"""\t\tswitch (value) {
\t\t\tcase 'word':
\t\t\t\t/* Les phrases servent d'unites de navigation, les mots d'unites de pointage */
\t\t\t\tthis.setBodyToSentences(this.readAloudUnit, () => this.setBodyToWords(() => this.makeFocusUnits()));
\t\t\t\tbreak;
\t\t\tcase 'sentence':
\t\t\t\tthis.setBodyToSentences(this.readAloudSpan, () => this.makeFocusUnits());
\t\t\t\tbreak;
\t\t\tdefault:
\t\t\t\tbreak;
\t\t}""",
	'decoupage par valeur')

patch(READ,
	"""\t\tthis.loadDuration();
\t\tthis.makeTextFocusable();
\t\tthis.setTooltip();""",
	"""\t\tthis.loadDuration();

\t\tif (value !== 'word' && value !== 'sentence') {
\t\t\tthis.makeFocusUnits();
\t\t}

\t\tthis.setTooltip();""",
	'appel du decoupage')

patch(READ,
	"""\t\tdocument.addEventListener('focusin', this.handler);
\t}""",
	"""\t\tdocument.addEventListener('focusin', this.handler);

\t\t/* Le decoupage de Lire a haute voix prime sur celui du Focus-loupe */
\t\tmagnifierServiceInstance.syncTextUnits();
\t}""",
	'priorite sur la loupe')

patch(READ,
	"""\t\tdocument.querySelectorAll('[data-cplus-tabindex]').forEach((element: Element) => {
\t\t\telement.removeAttribute('tabindex');
\t\t\tdelete (element as HTMLElement).dataset.cplusTabindex;
\t\t});""",
	"""\t\tdocument.querySelectorAll(`.${this.readAloudUnit}`).forEach((span: Element) => {
\t\t\tspan.replaceWith(...Array.from(span.childNodes));
\t\t});

\t\tthis.clearFocusUnits();""",
	'nettoyage des unites')

# Remplacement du decoupage focalisable par un decoupage selon la valeur choisie
patch(READ,
	"""\t/* Les blocs de texte sans tabindex en recoivent un, retire a l'extinction par resetBody() */
\tmakeTextFocusable = (): void => {
\t\tconst elements = Array.from(document.body.querySelectorAll(this.textBlockSelector)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < elements.length && count < this.textBlockMax; index++) {
\t\t\tconst element = elements[index];

\t\t\tif (element.hasAttribute('tabindex') || this.isInsideApp(element) || !element.textContent?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t/* Un bloc qui contient deja un lien ou un bouton ne recoit pas de tabindex : la
\t\t\t   tabulation resterait prisonniere du bloc. Ce sont alors ses phrases qui deviennent
\t\t\t   focalisables, de part et d'autre de l'element activable. */
\t\t\tif (element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)) {
\t\t\t\tcount += this.makeSpansFocusable(element);
\t\t\t\tcontinue;
\t\t\t}

\t\t\telement.setAttribute('tabindex', '0');
\t\t\telement.dataset.cplusTabindex = 'true';
\t\t\tcount++;
\t\t}
\t}

\t/* Phrases (ou mots) d'un bloc mixte : seules celles qui ne contiennent pas et ne sont pas
\t   contenues dans un element activable deviennent focalisables. */
\tprivate makeSpansFocusable = (element: HTMLElement): number => {
\t\tconst spans = Array.from(element.querySelectorAll(`.${this.readAloudSpan}`)) as HTMLElement[];
\t\tlet count = 0;

\t\tspans.forEach((span: HTMLElement) => {
\t\t\tif (span.hasAttribute('tabindex')
\t\t\t\t|| span.parentElement?.closest(`.${this.readAloudSpan}`)
\t\t\t\t|| span.closest(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| span.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| !span.textContent?.trim()) {
\t\t\t\treturn;
\t\t\t}

\t\t\tspan.setAttribute('tabindex', '0');
\t\t\tspan.dataset.cplusTabindex = 'true';
\t\t\tcount++;
\t\t});

\t\treturn count;
\t}""",
	"""\t/* Decoupage de la page en unites focalisables, selon l'etendue choisie. Les liens et boutons
\t   de la page restent focalisables par le navigateur : ils forment leurs propres unites. */
\tmakeFocusUnits = (): void => {
\t\tthis.clearFocusUnits();

\t\tswitch (this.currentValue) {
\t\t\tcase 'word':
\t\t\t\t/* Pointage au mot, navigation a la phrase */
\t\t\t\tthis.markSpansFocusable(this.readAloudUnit);
\t\t\t\tbreak;
\t\t\tcase 'sentence':
\t\t\t\tthis.markSpansFocusable(this.readAloudSpan);
\t\t\t\tbreak;
\t\t\tcase 'paragraph':
\t\t\t\tthis.markBlocksFocusable();
\t\t\t\tbreak;
\t\t\tcase 'all':
\t\t\t\tthis.markZonesFocusable();
\t\t\t\tbreak;
\t\t\tdefault:
\t\t\t\tbreak;
\t\t}
\t}

\tclearFocusUnits = (): void => {
\t\tdocument.querySelectorAll('[data-cplus-tabindex]').forEach((element: Element) => {
\t\t\telement.removeAttribute('tabindex');
\t\t\tdelete (element as HTMLElement).dataset.cplusTabindex;
\t\t\tdelete (element as HTMLElement).dataset.cplusZone;
\t\t});
\t}

\tprivate markUnit = (element: HTMLElement, isZone = false): void => {
\t\telement.setAttribute('tabindex', '0');
\t\telement.dataset.cplusTabindex = 'true';

\t\tif (isZone) {
\t\t\telement.dataset.cplusZone = 'true';
\t\t}
\t}

\t/* Phrases : seules celles qui ne contiennent pas et ne sont pas contenues dans un element
\t   activable deviennent focalisables, sinon la tabulation resterait prisonniere de l'unite. */
\tprivate markSpansFocusable = (className: string): void => {
\t\tconst spans = Array.from(document.querySelectorAll(`.${className}`)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < spans.length && count < TEXT_BLOCK_MAX; index++) {
\t\t\tconst span = spans[index];

\t\t\tif (span.hasAttribute('tabindex')
\t\t\t\t|| this.isInsideApp(span)
\t\t\t\t|| span.parentElement?.closest(`.${className}`)
\t\t\t\t|| span.closest(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| span.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| !span.textContent?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tthis.markUnit(span);
\t\t\tcount++;
\t\t}
\t}

\t/* Paragraphes, titres, listes et legendes. Un bloc qui contient un lien ou un bouton est
\t   decoupe en fragments de texte, de part et d'autre de l'element activable. */
\tprivate markBlocksFocusable = (): void => {
\t\tconst elements = Array.from(document.body.querySelectorAll(this.textBlockSelector)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < elements.length && count < TEXT_BLOCK_MAX; index++) {
\t\t\tconst element = elements[index];

\t\t\tif (element.hasAttribute('tabindex') || this.isInsideApp(element) || !element.textContent?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tif (element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)) {
\t\t\t\tif (!this.isFlexOrGrid(element)) {
\t\t\t\t\tthis.wrapMixedBlock(element, this.readAloudUnit);
\t\t\t\t}

\t\t\t\tcontinue;
\t\t\t}

\t\t\tthis.markUnit(element);
\t\t\tcount++;
\t\t}

\t\tthis.markSpansFocusable(this.readAloudUnit);
\t}

\t/* Fragments de texte d'un bloc mixte : suites de noeuds sans element activable */
\tprivate wrapMixedBlock = (element: HTMLElement, className: string): void => {
\t\tlet group: Node[] = [];

\t\tconst flush = () => {
\t\t\tconst text = group.map((node: Node) => node.textContent).join('').trim();

\t\t\tif (group.length > 0 && text !== '') {
\t\t\t\tconst span = document.createElement('span');
\t\t\t\tspan.classList.add(className);
\t\t\t\tgroup[0].parentNode?.insertBefore(span, group[0]);
\t\t\t\tgroup.forEach((node: Node) => span.appendChild(node));
\t\t\t}

\t\t\tgroup = [];
\t\t};

\t\tArray.from(element.childNodes).forEach((node: Node) => {
\t\t\tif (node.nodeType === Node.TEXT_NODE) {
\t\t\t\tgroup.push(node);
\t\t\t\treturn;
\t\t\t}

\t\t\tif (node.nodeType !== Node.ELEMENT_NODE) {
\t\t\t\treturn;
\t\t\t}

\t\t\tconst child = node as HTMLElement;

\t\t\tif (child.classList.contains(className)
\t\t\t\t|| child.matches(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| child.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
\t\t\t\t|| this.blockElements.includes(child.nodeName)) {
\t\t\t\tflush();
\t\t\t\treturn;
\t\t\t}

\t\t\tgroup.push(node);
\t\t});

\t\tflush();
\t}

\t/* Zones : suites de liens, groupes de textes sur un fond ou dans un cadre. Les zones les plus
\t   fines sont retenues, pour ne pas reduire la page entiere a une seule unite. */
\tprivate markZonesFocusable = (): void => {
\t\tconst candidates = Array.from(document.body.querySelectorAll(ZONE_SELECTOR)) as HTMLElement[];
\t\tconst zones = candidates.filter((element: HTMLElement) => !this.isInsideApp(element) && this.isZone(element));
\t\tconst leaves = zones.filter((zone: HTMLElement) => !zones.some((other: HTMLElement) => other !== zone && zone.contains(other)));

\t\tleaves.slice(0, TEXT_BLOCK_MAX).forEach((zone: HTMLElement) => {
\t\t\tif (!zone.hasAttribute('tabindex')) {
\t\t\t\tthis.markUnit(zone, true);
\t\t\t}
\t\t});
\t}

\tprivate isZone = (element: HTMLElement): boolean => {
\t\tif (!element.textContent?.trim()
\t\t\t|| element.querySelectorAll(`${TEXT_BLOCK_SELECTOR}, a[href], button`).length < 2) {
\t\t\treturn false;
\t\t}

\t\tconst rect = element.getBoundingClientRect();

\t\tif (!rect.width || !rect.height) {
\t\t\treturn false;
\t\t}

\t\tif (ZONE_LANDMARKS.includes(element.tagName)) {
\t\t\treturn true;
\t\t}

\t\tconst style = getComputedStyle(element);
\t\tconst painted = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
\t\tconst framed = style.borderTopWidth !== '0px' || style.borderBottomWidth !== '0px' || style.boxShadow !== 'none';

\t\treturn painted || framed;
\t}""",
	'decoupage en unites')

patch(READ,
	"""\tprivate resolveSpeakTarget = (element: HTMLElement): HTMLElement | null => {
\t\tconst span = element?.closest?.(`.${this.readAloudSpan}`) as HTMLElement;""",
	"""\tprivate resolveSpeakTarget = (element: HTMLElement): HTMLElement | null => {
\t\tif (this.currentValue === 'all') {
\t\t\tconst zone = element?.closest?.('[data-cplus-zone]') as HTMLElement;

\t\t\tif (zone) {
\t\t\t\treturn zone;
\t\t\t}
\t\t}

\t\tconst span = element?.closest?.(`.${this.readAloudSpan}`) as HTMLElement;""",
	'cible selon la zone')

# --------------------------------------------------------------------- loupe
patch(MAG,
	"""\tthis.applyTheme();

\tif (this.type === MAGNIFIER_FOCUS) {
\t\tthis.makeTextFocusable();
\t} else {
\t\tthis.clearTextFocusable();
\t}""",
	"""\tthis.applyTheme();
\tthis.syncTextUnits();""",
	'loupe decoupage')

patch(MAG,
	"""\tmakeTextFocusable = (): void => {""",
	"""\t/* Focus-loupe seul : decoupage par paragraphes. Des que Lire a haute voix est actif, c'est son
\t   decoupage qui prime et la loupe ne pose plus d'unites. */
\tsyncTextUnits = (): void => {
\t\tif (this.type === MAGNIFIER_FOCUS && readAloudServiceInstance.state === 'off') {
\t\t\tthis.makeTextFocusable();
\t\t\treturn;
\t\t}

\t\tthis.clearTextFocusable();
\t}

\tmakeTextFocusable = (): void => {""",
	'loupe synchronisation')

# ------------------------------------------------------- boutons de navigation
patch(NAV,
	"""\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.navigationButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tdomServiceInstance.makeTextBlocksFocusable(this.navTextFlag);""",
	"""\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.navigationButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tthis.applyTextUnits();""",
	'navigation unites 1')

patch(NAV,
	"""\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.fullButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tdomServiceInstance.makeTextBlocksFocusable(this.navTextFlag);""",
	"""\t\t\t\tthis.currentList = this.isMobile() ? this.mobileButtonsList : this.fullButtonsList;
\t\t\t\tthis.getFocusedElement();
\t\t\t\tthis.applyTextUnits();""",
	'navigation unites 2')

patch(NAV,
	"""\tisMobile = (): boolean => {""",
	"""\t/* Sans Lire a haute voix, la page est decoupee par paragraphes pour Precedent et Suivant ;
\t   avec, c'est le decoupage de Lire a haute voix qui prime. */
\tapplyTextUnits = (): void => {
\t\tif (readAloudServiceInstance.state !== 'off') {
\t\t\tdomServiceInstance.clearTextBlocksFocusable(this.navTextFlag);
\t\t\treturn;
\t\t}

\t\tdomServiceInstance.makeTextBlocksFocusable(this.navTextFlag);
\t}

\tisMobile = (): boolean => {""",
	'navigation decoupage')

print('\n'.join(done))
