path = '/app/confort-src/src/app/services/settings/read-aloud.service.ts'
src = open(path, encoding='utf-8').read()
done = []


def shift(block, delta):
    lines = []
    for line in block.split('\n'):
        if delta < 0:
            lines.append(line[-delta:] if line.startswith('\t' * -delta) else line)
        else:
            lines.append(('\t' * delta + line) if line.strip() else line)
    return '\n'.join(lines)


def patch(old, new, label):
    """Les blocs sont ecrits avec une tabulation par niveau, puis recales sur le fichier."""
    global src
    first = old.split('\n')[0]
    indent = len(first) - len(first.lstrip('\t'))
    targets = set(len(line) - len(line.lstrip('\t')) for line in src.split('\n') if line.strip() == first.strip())
    assert len(targets) == 1, 'ancrage ' + label
    delta = targets.pop() - indent
    old = shift(old, delta)
    new = shift(new, delta)
    assert src.count(old) == 1, label
    src = src.replace(old, new)
    done.append(label)


patch(
	"""\tblockNextClick = false;
\tflashTimer: any = null;""",
	"""\tblockNextClick = false;
\t/* 'onDemand' = vocalisation au clic ou a la touche Entree, 'always' = aussi a la tabulation */
\tduration: string = 'onDemand';
\tcurrentUtterance: SpeechSynthesisUtterance = null;
\tspeakTimer: any = null;
\tspeakToken = 0;
\tflashTimer: any = null;""",
	'champs duree')

patch(
	"""\tnativelyFocusableSelector = 'a[href], area[href], button, input, select, textarea, summary, [tabindex]';""",
	"""\tnativelyFocusableSelector = 'a[href], area[href], button, input, select, textarea, summary, [tabindex]';

\t/* Titres, paragraphes, listes et legendes : rendus focalisables pour que la vocalisation
\t   parcoure tout le contenu, au pointeur comme a la tabulation. */
\ttextBlockSelector = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, figcaption, caption, td, th';
\ttextBlockMax = 600;""",
	'selecteur blocs de texte')

patch(
	"""\tthis.setTooltip();
\tthis.showScopeFlash(value);""",
	"""\tthis.loadDuration();
\tthis.makeTextFocusable();
\tthis.setTooltip();
\tthis.showScopeFlash(value);""",
	'activation duree')

patch(
	"""\tresetReadAloud = (): void => {""",
	"""\tloadDuration = (): void => {
\t\tmodeOfUseServiceInstance.getSetting('readAloudDuration').then((result: SettingModel) => {
\t\t\tthis.duration = result?.values?.split(',')[result.valueSelected] || 'onDemand';
\t\t});
\t}

\tsetDuration = (value: string): void => {
\t\tthis.duration = value || 'onDemand';
\t}

\t/* Les blocs de texte sans tabindex en recoivent un, retire a l'extinction par resetBody() */
\tmakeTextFocusable = (): void => {
\t\tconst elements = Array.from(document.body.querySelectorAll(this.textBlockSelector)) as HTMLElement[];
\t\tlet count = 0;

\t\tfor (let index = 0; index < elements.length && count < this.textBlockMax; index++) {
\t\t\tconst element = elements[index];

\t\t\tif (element.hasAttribute('tabindex') || this.isInsideApp(element) || !element.innerText?.trim()) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\telement.setAttribute('tabindex', '0');
\t\t\telement.dataset.cplusTabindex = 'true';
\t\t\tcount++;
\t\t}
\t}

\tresetReadAloud = (): void => {""",
	'duree et textes focalisables')

patch(
	"""\tconst utterance = new SpeechSynthesisUtterance(text);
\tutterance.lang = document.documentElement.lang || navigator.language || 'fr-FR';
\tutterance.onend = () => this.stopSpeech();
\tutterance.onerror = () => this.stopSpeech();

\tthis.giveFocus(element);
\tthis.speakingElement = element;
\tthis.state = 'on';
\tdocument.documentElement.classList.add(this.speakingClass);
\tspeechSynthesis.speak(utterance);""",
	"""\tconst utterance = new SpeechSynthesisUtterance(text);
\tutterance.lang = document.documentElement.lang || navigator.language || 'fr-FR';
\t/* Seule la vocalisation en cours peut remettre l'etat a l'arret : sinon l'annulation de la
\t   precedente eteignait aussitot celle qui vient d'etre lancee. */
\tutterance.onend = () => {
\t\tif (this.currentUtterance === utterance) {
\t\t\tthis.stopSpeech();
\t\t}
\t};
\tutterance.onerror = utterance.onend;

\tthis.giveFocus(element);
\tthis.speakingElement = element;
\tthis.currentUtterance = utterance;
\tthis.state = 'on';
\tdocument.documentElement.classList.add(this.speakingClass);

\t/* Apres une annulation, les moteurs de synthese avalent la demande suivante si elle part dans
\t   la foulee : elle est donc differee le temps que la file se vide. */
\tconst token = ++this.speakToken;
\tclearTimeout(this.speakTimer);

\tif (!wasSpeaking) {
\t\tspeechSynthesis.speak(utterance);
\t\treturn;
\t}

\tthis.speakTimer = setTimeout(() => {
\t\tif (token === this.speakToken && this.currentUtterance === utterance) {
\t\t\tspeechSynthesis.speak(utterance);
\t\t}
\t}, 150);""",
	'vocalisation enchainee')

patch(
	"""\tif (speechSynthesis.speaking || speechSynthesis.pending) {
\t\tspeechSynthesis.cancel();
\t}

\tconst utterance = new SpeechSynthesisUtterance(text);""",
	"""\tconst wasSpeaking = speechSynthesis.speaking || speechSynthesis.pending;

\tif (wasSpeaking) {
\t\tspeechSynthesis.cancel();
\t}

\tconst utterance = new SpeechSynthesisUtterance(text);""",
	'annulation avant vocalisation')

patch(
	"""\tprivate stopSpeech = (armActivationWindow = true): void => {
\t\tif (speechSynthesis.speaking || speechSynthesis.pending) {
\t\t\tspeechSynthesis.cancel();
\t\t}""",
	"""\tprivate stopSpeech = (armActivationWindow = true): void => {
\t\tclearTimeout(this.speakTimer);
\t\tthis.speakToken++;
\t\tthis.currentUtterance = null;

\t\tif (speechSynthesis.speaking || speechSynthesis.pending) {
\t\t\tspeechSynthesis.cancel();
\t\t}""",
	'arret differe')

patch(
	"""\tconst speakTarget = this.resolveSpeakTarget(focusedElement);

\tif (speakTarget) {
\t\tthis.speak(speakTarget);
\t}
\tbreak;""",
	"""\t/* Sur demande : la mise en focus ne vocalise pas, c'est la touche Entree qui declenche */
\tif (this.duration !== 'always') {
\t\treturn;
\t}

\tconst speakTarget = this.resolveSpeakTarget(focusedElement);

\tif (speakTarget) {
\t\tthis.speak(speakTarget);
\t}
\tbreak;""",
	'tabulation sur demande')

open(path, 'w', encoding='utf-8').write(src)
print('\n'.join(done))
