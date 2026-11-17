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

# Les boutons de navigation Confort+ ne doivent jamais etre vocalises
patch(READ,
	"""\t\treturn !!element.closest(APP_NAME) || element.tagName.toLowerCase() === APP_NAME;""",
	"""\t\t/* Les boutons de navigation Confort+ ne sont jamais vocalises : c'est l'element de la page
\t\t   qu'ils focalisent qui doit l'etre. */
\t\treturn !!element.closest(APP_NAME) || element.tagName.toLowerCase() === APP_NAME
\t\t\t|| !!element.closest(`#${CONTAINER_BUTTONS_ID}`);""",
	'boutons jamais vocalises')

# Blocs de texte : pas de tabindex sur un bloc qui contient deja un element focalisable
patch(READ,
	"""\tmakeTextFocusable = (): void => {
\t\tconst elements = Array.from(document.body.querySelectorAll(this.textBlockSelector)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < elements.length && count < this.textBlockMax; index++) {
\t\t\tconst element = elements[index];

\t\t\tif (element.hasAttribute('tabindex') || this.isInsideApp(element) || !element.textContent?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\telement.setAttribute('tabindex', '0');
\t\t\telement.dataset.cplusTabindex = 'true';
\t\t\tcount++;
\t\t}
\t}""",
	"""\tmakeTextFocusable = (): void => {
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
\t}

\t/* Vocalisation demandee par les boutons de navigation Suivant et Precedent */
\tspeakFocused = (element: HTMLElement): void => {
\t\tif (this.state === 'off' || !element || this.duration === 'always') {
\t\t\t/* En « A chaque fois », la mise en focus a deja declenche la vocalisation */
\t\t\treturn;
\t\t}

\t\tconst target = this.resolveSpeakTarget(element);

\t\tif (target) {
\t\t\tthis.speak(target);
\t\t}
\t}""",
	'blocs mixtes et vocalisation demandee')

# Focus-loupe : la vue commence au premier mot de l'element, pas en son milieu
patch(MAG,
	"""\t\t\tfocalX = this.focusRange
\t\t\t\t? rect.left + scrollX + ((width / 2) - (width * 0.1)) / this.level + this.exploreOffset
\t\t\t\t: rect.left + scrollX + (rect.width / 2) + this.exploreOffset;
\t\t\tfocalY = rect.top + scrollY + (rect.height / 2) + this.exploreOffsetY;""",
	"""\t\t\t/* La vue commence au premier mot (ou picto) de l'element : un paragraphe plus large ou
\t\t\t   plus haut que la fenetre serait sinon montre par son milieu. */
\t\t\tconst startX = ((width / 2) - (width * 0.1)) / this.level;
\t\t\tconst startY = ((height / 2) - (height * 0.1)) / this.level;

\t\t\tfocalX = rect.left + scrollX + Math.min(startX, rect.width / 2) + this.exploreOffset;
\t\t\tfocalY = rect.top + scrollY + Math.min(startY, rect.height / 2) + this.exploreOffsetY;""",
	'vue calee sur le premier mot')

# Copie de page : l'ordre d'empilement des elements hors flux est conserve
patch(MAG,
	"""\tplaceInDocument = (element: HTMLElement, copy: HTMLElement, bodyCopy: HTMLElement, origin: { x: number, y: number }): void => {
\t\tconst rect = element.getBoundingClientRect();

\t\tif (!rect.width || !rect.height) {
\t\t\treturn;
\t\t}

\t\tconst left = rect.left + (window.scrollX || document.documentElement.scrollLeft) - origin.x;
\t\tconst top = rect.top + (window.scrollY || document.documentElement.scrollTop) - origin.y;

\t\tcopy.style.cssText += `;position:absolute;left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px;margin:0;max-width:none;max-height:none;`;
\t\tbodyCopy.appendChild(copy);
\t}""",
	"""\tplaceInDocument = (element: HTMLElement, copy: HTMLElement, bodyCopy: HTMLElement, origin: { x: number, y: number }, zIndex: string = ''): void => {
\t\tconst rect = element.getBoundingClientRect();

\t\tif (!rect.width || !rect.height) {
\t\t\treturn;
\t\t}

\t\tconst left = rect.left + (window.scrollX || document.documentElement.scrollLeft) - origin.x;
\t\tconst top = rect.top + (window.scrollY || document.documentElement.scrollTop) - origin.y;

\t\t/* L'ordre d'empilement d'origine est conserve : sans lui, un voile gris de modale reposee
\t\t   apres la modale elle-meme recouvrait son contenu (bandeau cookies d'orange.fr). */
\t\tconst depth = zIndex || this.stackingOrder(element);

\t\tcopy.style.cssText += `;position:absolute;left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px;margin:0;max-width:none;max-height:none;z-index:${depth};`;
\t\tbodyCopy.appendChild(copy);
\t}

\t/* z-index effectif d'un element hors flux, en remontant ses ancetres positionnes */
\tstackingOrder = (element: HTMLElement): string => {
\t\tlet current: HTMLElement = element;
\t\tlet depth = 0;

\t\twhile (current && depth < MAGNIFIER_MAX_DEPTH) {
\t\t\tconst value = getComputedStyle(current).zIndex;

\t\t\tif (value && value !== 'auto') {
\t\t\t\treturn value;
\t\t\t}

\t\t\tcurrent = current.parentElement;
\t\t\tdepth++;
\t\t}

\t\treturn '1';
\t}""",
	'empilement conserve')

patch(MAG,
	"""\t\t\tcopy.style.cssText += ';display:block;z-index:1;';
\t\t\tthis.placeInDocument(element, copy, bodyCopy, origin);""",
	"""\t\t\tcopy.style.cssText += ';display:block;';
\t\t\t/* Couche superieure du navigateur : au-dessus de tout le reste de la copie */
\t\t\tthis.placeInDocument(element, copy, bodyCopy, origin, '2147483000');""",
	'couche superieure au-dessus')

print('\n'.join(done))
