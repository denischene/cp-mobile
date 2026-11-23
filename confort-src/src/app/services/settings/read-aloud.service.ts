let readAloudServiceIsInstantiated: boolean;

class ReadAloudService extends BodySelectorService {
	handler: any;
	tooltipReadAloud: HTMLElement;
	readAloudTooltipId = `${PREFIX}read-aloud-tooltip`;
	readAloudFlashId = `${PREFIX}read-aloud-flash`;
	readAloudSpan = `${PREFIX}read-aloud-span`;
	/* Unite de navigation : la phrase quand on vocalise mot a mot, le fragment de texte d'un
	   paragraphe mixte. Distincte du span de pointage pour que les deux coexistent. */
	readAloudUnit = `${PREFIX}read-aloud-unit`;
	speakingClass = `${PREFIX}read-aloud-speaking`;

	/* 'off' = setting disabled, 'suspended' = armed & waiting, 'on' = speaking */
	state: 'off' | 'suspended' | 'on' = 'off';
	currentValue: string = DEFAULT_VALUE;
	speakingElement: HTMLElement | null = null;
	lastSpokenTarget: HTMLElement | null = null;
	lastSpeechEnd = 0;
	lastPointerTime = 0;
	lastPointerTarget: HTMLElement | null = null;
	blockNextClick = false;
	/* 'onDemand' = vocalisation au clic ou a la touche Entree, 'always' = aussi a la tabulation */
	duration: string = 'onDemand';
	currentUtterance: SpeechSynthesisUtterance = null;
	speakTimer: any = null;
	speakToken = 0;
	flashTimer: any = null;
	blockClickTimer: any = null;
	applyToken = 0;

	/* Words and whitespaces are kept apart so that the original text can be
	   restored exactly when the setting is turned off. */
	regexWord = /\s+|\S+/g;
	regexSentenceEnd = /[.!?…](\s|$)/;

	/* Containers whose direct children must never be wrapped */
	structuralParents = 'select, optgroup, datalist, table, thead, tbody, tfoot, tr, ul, ol, dl, svg, math, video, audio, picture, iframe, object, map, template, noscript';

	blockElements = ['ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DD', 'DETAILS', 'DIALOG', 'DIV', 'DL', 'DT',
		'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR',
		'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TD', 'TH', 'TR', 'UL'];

	imageSelector = 'img, picture, figure, svg, [role="img"]';

	nativelyFocusableSelector = 'a[href], area[href], button, input, select, textarea, summary, [tabindex]';

	/* Titres, paragraphes, listes et legendes : rendus focalisables pour que la vocalisation
	   parcoure tout le contenu, au pointeur comme a la tabulation. */
	textBlockSelector = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, figcaption, caption, td, th';
	textBlockMax = 600;

	/* Accordion headings and other scripted widgets: not natively focusable but
	   they do react to a click / tap. */
	focusableSelector = 'a[href], area[href], button, input, select, textarea, summary, [tabindex], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [aria-expanded], [aria-controls], [onclick]';

	textSelector = `h1, h2, h3, h4, h5, h6, [aria-expanded], summary,
		p, li, dt, dd, blockquote, pre, td, th,
		figcaption, caption, legend, label, span, strong, em, b, i, q, cite, abbr, time,
		input, textarea, img`;

	actionableSelector = 'a[href], area[href], button, select, summary, details, input, textarea, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="combobox"], [tabindex]:not([tabindex="-1"])';

	cursorReadAloud = `url('data:image/svg+xml;utf8,<svg width="28" height="28" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="black" d="M114.821 60.554c0 33.882-26.402 56.278-56.846 56.278-6.216 0-21.82-2.872-25.265-5.743C26.394 117.406 9.168 122 9.168 122c-.374-.298.176-1.564 1.067-3.613 1.913-4.401 5.396-12.415 4.675-22.229C6.87 85.822 4 74.911 4 60.554 4 30.108 28.105 6 58.55 6c32.73 0 56.271 24.693 56.271 54.554Zm-28.55 4.38a3.532 3.532 0 1 1 0-7.064 3.532 3.532 0 0 1 0 7.063Zm-27.075 0a3.532 3.532 0 1 1 0-7.064 3.532 3.532 0 0 1 0 7.063Zm-30.607-3.532a3.532 3.532 0 1 0 7.063 0 3.532 3.532 0 0 0-7.063 0Z" stroke="white" stroke-width="12" paint-order="stroke"/></svg>') 14 14, pointer`;

	constructor() {
		super();
		if (readAloudServiceIsInstantiated) {
			throw new Error('ReadAloudService is already instantiated.');
		}

		readAloudServiceIsInstantiated = true;

		this.handler = this.createHandler();
	}

	setReadAloud = (value: string): void => {
		/* Re-applying the same value would rebuild the whole DOM for nothing:
		   on mobile this froze the browser while browsing the settings pages. */
		const spansNeeded = value === 'word' || value === 'sentence';

		if (value === this.currentValue
			&& (!spansNeeded || document.querySelector(`.${this.readAloudSpan}`))) {
			return;
		}

		this.currentValue = value;
		this.applyToken++;
		this.stopSpeech();
		this.resetBody();

		if (value === DEFAULT_VALUE || !value) {
			this.state = 'off';
			this.resetReadAloud();
			return;
		}

		switch (value) {
			case 'word':
				/* Les phrases servent d'unites de navigation, les mots d'unites de pointage */
				this.setBodyToSentences(this.readAloudUnit, () => this.setBodyToWords(() => this.makeFocusUnits()));
				break;
			case 'sentence':
				this.setBodyToSentences(this.readAloudSpan, () => this.makeFocusUnits());
				break;
			default:
				break;
		}

		this.state = 'suspended';
		this.speakingElement = null;
		this.loadDuration();

		if (value !== 'word' && value !== 'sentence') {
			this.makeFocusUnits();
		}

		this.setTooltip();
		this.showScopeFlash(value);

		document.addEventListener('pointerdown', this.handler, true);
		document.addEventListener('click', this.handler, true);
		document.addEventListener('keydown', this.handler, true);
		document.addEventListener('contextmenu', this.handler);
		document.addEventListener('focusin', this.handler);

		/* Le decoupage de Lire a haute voix prime sur celui du Focus-loupe */
		magnifierServiceInstance.syncTextUnits();
	}

	/* The page is processed by small batches: a single synchronous pass over a
	   big page (Le Monde...) blocked the UI long enough to kill the tab on mobile. */
	private processInChunks = (items: any[], callback: (item: any) => void, onDone?: () => void): void => {
		const token = this.applyToken;
		const size = 80;
		let index = 0;

		const run = () => {
			if (token !== this.applyToken) {
				return;
			}

			const end = Math.min(index + size, items.length);

			for (; index < end; index++) {
				callback(items[index]);
			}

			if (index < items.length) {
				setTimeout(run, 0);
				return;
			}

			onDone?.();
		};

		run();
	}

	private setBodyToWords = (onDone?: () => void): void => {
		this.processInChunks(Array.from(this.getBodyElements()), (child: any) => {
			const textNodes = this.getTextNodes(child);

			textNodes.forEach((node: any) => {
				const text = node.nodeValue;
				if (text && !this.isAlreadyEdited(node, this.readAloudSpan)) {
					const parent = node.parentNode;

					if (parent
						&& !BODY_ELEMENTS_FILTER.split(',').includes(parent.nodeName.toLowerCase())
						&& !this.isFlexOrGrid(parent)) {
						const fragment = this.createFragmentForWords(text);
						parent.insertBefore(fragment, node);
						parent.removeChild(node);
					}
				}
			});
		}, onDone);
	}

	/* A sentence must be vocalized as a whole, even when it contains links:
	   inline children (a, strong, em...) are grouped inside the same span. */
	private setBodyToSentences = (className: string = this.readAloudSpan, onDone?: () => void): void => {
		this.processInChunks(Array.from(this.getBodyElements()), (element: Element) => {
			if (element.closest(`.${className}`)
				|| element.matches(this.structuralParents)
				|| this.isFlexOrGrid(element as HTMLElement)) {
				return;
			}

			this.groupSentences(element as HTMLElement, className);
		}, onDone);
	}

	private groupSentences = (element: HTMLElement, className: string = this.readAloudSpan): void => {
		let group: Node[] = [];

		const flush = () => {
			const text = group.map((node: Node) => node.textContent).join('').trim();

			if (group.length > 0 && text !== '') {
				const span = document.createElement('span');
				span.classList.add(className);
				group[0].parentNode?.insertBefore(span, group[0]);
				group.forEach((node: Node) => span.appendChild(node));
			}

			group = [];
		};

		Array.from(element.childNodes).forEach((node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				let current = node as Text;

				while (current) {
					const match = this.regexSentenceEnd.exec(current.nodeValue);

					if (!match) {
						group.push(current);
						break;
					}

					const rest = current.splitText(match.index + match[0].length);
					group.push(current);
					flush();

					current = rest.nodeValue.trim() === '' ? null : rest;
				}

				return;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return;
			}

			if (this.blockElements.includes(node.nodeName)) {
				flush();
				return;
			}

			group.push(node);
		});

		flush();
	}

	private createFragmentForWords(text: string): DocumentFragment {
		const fragment = document.createDocumentFragment();
		const items = text.match(this.regexWord) ?? [];

		items.forEach((item: string) => {
			if (item.trim() === '') {
				fragment.appendChild(document.createTextNode(item));
				return;
			}

			const span = document.createElement('span');
			span.classList.add(this.readAloudSpan);
			span.textContent = item;
			fragment.appendChild(span);
		});

		return fragment;
	}

	/* Sentence spans can contain links and other elements: they are unwrapped
	   (children kept) instead of being replaced by their text content. */
	private resetBody = (): void => {
		this.removeTooltip();

		document.querySelectorAll(`.${this.readAloudSpan}`).forEach((span: Element) => {
			span.replaceWith(...Array.from(span.childNodes));
		});

		document.querySelectorAll(`.${this.readAloudUnit}`).forEach((span: Element) => {
			span.replaceWith(...Array.from(span.childNodes));
		});

		this.clearFocusUnits();

		this.resetToDefaultBody([TEXT_COLOR_SPAN_CLASS]);
	}

	loadDuration = (): void => {
		modeOfUseServiceInstance.getSetting('readAloudDuration').then((result: SettingModel) => {
			this.duration = result?.values?.split(',')[result.valueSelected] || 'onDemand';
		});
	}

	setDuration = (value: string): void => {
		this.duration = value || 'onDemand';
	}

	/* Decoupage de la page en unites focalisables, selon l'etendue choisie. Les liens et boutons
	   de la page restent focalisables par le navigateur : ils forment leurs propres unites. */
	makeFocusUnits = (): void => {
		this.clearFocusUnits();

		switch (this.currentValue) {
			case 'word':
				/* Pointage au mot, navigation a la phrase */
				this.markSpansFocusable(this.readAloudUnit);
				break;
			case 'sentence':
				this.markSpansFocusable(this.readAloudSpan);
				break;
			case 'paragraph':
				this.markBlocksFocusable();
				break;
			case 'all':
				this.markZonesFocusable();
				break;
			default:
				break;
		}
	}

	clearFocusUnits = (): void => {
		document.querySelectorAll('[data-cplus-untab]').forEach((element: Element) => {
			const child = element as HTMLElement;
			const previous = child.dataset.cplusUntab;

			if (previous === 'none') {
				child.removeAttribute('tabindex');
			} else {
				child.setAttribute('tabindex', previous as string);
			}

			delete child.dataset.cplusUntab;
		});

		document.querySelectorAll('[data-cplus-tabindex]').forEach((element: Element) => {
			element.removeAttribute('tabindex');
			delete (element as HTMLElement).dataset.cplusTabindex;
			delete (element as HTMLElement).dataset.cplusZone;
		});
	}

	/* Une unite doit porter du texte a vocaliser : une ponctuation isolee n'en est pas une */
	private hasReadableText = (element: HTMLElement): boolean => {
		return /[\p{L}\p{N}]/u.test(element.textContent || '');
	}

	private markUnit = (element: HTMLElement, isZone = false): void => {
		element.setAttribute('tabindex', '0');
		element.dataset.cplusTabindex = 'true';

		if (isZone) {
			element.dataset.cplusZone = 'true';
		}
	}

	/* Phrases : seules celles qui ne contiennent pas et ne sont pas contenues dans un element
	   activable deviennent focalisables, sinon la tabulation resterait prisonniere de l'unite. */
	private markSpansFocusable = (className: string): void => {
		const spans = Array.from(document.querySelectorAll(`.${className}`)) as HTMLElement[];
		let count = 0;

		for (let index = 0; index < spans.length && count < TEXT_BLOCK_MAX; index++) {
			const span = spans[index];

			if (span.hasAttribute('tabindex')
				|| this.isInsideApp(span)
				|| span.parentElement?.closest(`.${className}`)
				|| span.closest(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| span.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| !this.hasReadableText(span)) {
				continue;
			}

			this.markUnit(span);
			count++;
		}
	}

	/* Paragraphes, titres, listes et legendes. Un bloc qui contient un lien ou un bouton est
	   decoupe en fragments de texte, de part et d'autre de l'element activable. */
	private markBlocksFocusable = (): void => {
		const elements = Array.from(document.body.querySelectorAll(this.textBlockSelector)) as HTMLElement[];
		let count = 0;

		for (let index = 0; index < elements.length && count < TEXT_BLOCK_MAX; index++) {
			const element = elements[index];

			if (element.hasAttribute('tabindex') || this.isInsideApp(element) || !element.textContent?.trim()) {
				continue;
			}

			if (element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)) {
				if (!this.isFlexOrGrid(element)) {
					this.wrapMixedBlock(element, this.readAloudUnit);
				}

				continue;
			}

			this.markUnit(element);
			count++;
		}

		this.markSpansFocusable(this.readAloudUnit);
	}

	/* Fragments de texte d'un bloc mixte : suites de noeuds sans element activable */
	private wrapMixedBlock = (element: HTMLElement, className: string): void => {
		let group: Node[] = [];

		const flush = () => {
			const text = group.map((node: Node) => node.textContent).join('');

			if (group.length > 0 && /[\p{L}\p{N}]/u.test(text)) {
				const span = document.createElement('span');
				span.classList.add(className);
				group[0].parentNode?.insertBefore(span, group[0]);
				group.forEach((node: Node) => span.appendChild(node));
			}

			group = [];
		};

		Array.from(element.childNodes).forEach((node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				group.push(node);
				return;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return;
			}

			const child = node as HTMLElement;

			if (child.classList.contains(className)
				|| child.matches(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| child.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| this.blockElements.includes(child.nodeName)) {
				flush();
				return;
			}

			group.push(node);
		});

		flush();
	}

	/* Zones : suites de liens, groupes de textes sur un fond ou dans un cadre. Les zones les plus
	   fines sont retenues, pour ne pas reduire la page entiere a une seule unite. */
	private markZonesFocusable = (): void => {
		const candidates = Array.from(document.body.querySelectorAll(ZONE_SELECTOR)) as HTMLElement[];
		const zones = candidates.filter((element: HTMLElement) => !this.isInsideApp(element) && this.isZone(element));
		const leaves = zones.filter((zone: HTMLElement) => !zones.some((other: HTMLElement) => other !== zone && zone.contains(other)));

		leaves.slice(0, TEXT_BLOCK_MAX).forEach((zone: HTMLElement) => {
			if (!zone.hasAttribute('tabindex')) {
				this.markUnit(zone, true);
			}

			this.untabInside(zone);
		});
	}

	/* Les liens et boutons d'une zone sortent de l'ordre de tabulation : on passe d'une zone a la
	   suivante, sans rester prisonnier de la zone en cours. Les champs de saisie restent joignables. */
	private untabInside = (zone: HTMLElement): void => {
		zone.querySelectorAll(ZONE_UNTAB_SELECTOR).forEach((element: Element) => {
			const child = element as HTMLElement;

			if (child.dataset.cplusUntab || this.isInsideApp(child)) {
				return;
			}

			child.dataset.cplusUntab = child.getAttribute('tabindex') ?? 'none';
			child.setAttribute('tabindex', '-1');
		});
	}

	private isZone = (element: HTMLElement): boolean => {
		if (!element.textContent?.trim()
			|| element.querySelectorAll(`${TEXT_BLOCK_SELECTOR}, a[href], button`).length < 2) {
			return false;
		}

		const rect = element.getBoundingClientRect();

		if (!rect.width || !rect.height) {
			return false;
		}

		if (ZONE_LANDMARKS.includes(element.tagName)) {
			return true;
		}

		const style = getComputedStyle(element);
		const painted = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
		const framed = style.borderTopWidth !== '0px' || style.borderBottomWidth !== '0px' || style.boxShadow !== 'none';

		return painted || framed;
	}

	/* Vocalisation demandee par les boutons de navigation Suivant et Precedent */
	speakFocused = (element: HTMLElement): void => {
		if (this.state === 'off' || !element || this.duration === 'always') {
			/* En « A chaque fois », la mise en focus a deja declenche la vocalisation */
			return;
		}

		const target = this.resolveSpeakTarget(element);

		if (target) {
			this.speak(target);
		}
	}

	resetReadAloud = (): void => {
		this.state = 'off';
		this.speakingElement = null;
		this.lastSpokenTarget = null;
		this.blockNextClick = false;
		document.documentElement.classList.remove(this.speakingClass);
		stylesServiceInstance.removeStyle('read-aloud');
		document.querySelector(`#${this.readAloudFlashId}`)?.remove();
		document.removeEventListener('pointermove', this.handler);
		document.removeEventListener('pointerdown', this.handler, true);
		document.removeEventListener('click', this.handler, true);
		document.removeEventListener('keydown', this.handler, true);
		document.removeEventListener('contextmenu', this.handler);
		document.removeEventListener('focusin', this.handler);
	}

	setTooltip = (): void => {
		this.removeTooltip();
		const tooltip = document.createElement('div');
		tooltip.setAttribute('id', this.readAloudTooltipId);
		tooltip.textContent = this.isTouchDevice()
			? i18nServiceInstance.getMessage('readAloud_tooltip_mobile')
			: i18nServiceInstance.getMessage('readAloud_tooltip');
		document.body.insertBefore(tooltip, document.body.firstChild);
		stylesServiceInstance.setStyle('read-aloud', this.getStyle());
		this.tooltipReadAloud = document.querySelector(`#${this.readAloudTooltipId}`);
		document.addEventListener('pointermove', this.handler);
	}

	/* Brief (2s) information showing the vocalization scope being activated */
	showScopeFlash = (value: string): void => {
		document.querySelector(`#${this.readAloudFlashId}`)?.remove();
		const flash = document.createElement('div');
		flash.setAttribute('id', this.readAloudFlashId);
		flash.setAttribute('role', 'status');
		flash.textContent = i18nServiceInstance.getMessage(`readAloud_scope_${value}`)
			|| i18nServiceInstance.getMessage(`readAloud_${value}`)
			|| value;
		document.body.appendChild(flash);

		clearTimeout(this.flashTimer);
		this.flashTimer = setTimeout(() => {
			flash.remove();
		}, 2000);
	}

	private isTouchDevice = (): boolean => {
		return window.matchMedia('(pointer: coarse)').matches;
	}

	private isImage = (element: HTMLElement): boolean => {
		return !!element?.matches?.(this.imageSelector);
	}

	/* An image is always vocalized as a whole: its text alternative, or its
	   caption, or a default message. */
	private getImageText = (element: HTMLElement): string => {
		const image = (element.matches('img') ? element : element.querySelector('img')) as HTMLImageElement;
		const alternative = image?.getAttribute('alt')
			|| element.getAttribute('aria-label')
			|| image?.getAttribute('aria-label')
			|| element.getAttribute('title')
			|| image?.getAttribute('title')
			|| element.querySelector('title')?.textContent;

		if (alternative?.trim()) {
			return alternative;
		}

		const caption = element.closest('figure')?.querySelector('figcaption')?.textContent
			|| element.querySelector('figcaption')?.textContent;

		if (caption?.trim()) {
			return caption;
		}

		return i18nServiceInstance.getMessage('readAloud_noDescription') || 'absence de description';
	}

	getInnerText = (element: HTMLElement): string => {
		if (this.isImage(element)) {
			return this.getImageText(element);
		}

		if (element.classList?.contains(`${PREFIX}colored-text`)) {
			return element.parentElement.innerText;
		}

		return element.innerText
			|| (element as HTMLInputElement).value
			|| element.getAttribute('aria-label')
			|| element.getAttribute('alt')
			|| element.getAttribute('title')
			|| '';
	}

	private removeTooltip = (): void => {
		this.tooltipReadAloud?.remove();
		document.querySelector(`#${this.readAloudTooltipId}`)?.remove();
		this.tooltipReadAloud = null;
		document.removeEventListener('pointermove', this.handler);
	}

	private isInsideApp = (element: any): boolean => {
		if (!(element instanceof HTMLElement)) {
			return false;
		}
		/* Les boutons de navigation Confort+ ne sont jamais vocalises : c'est l'element de la page
		   qu'ils focalisent qui doit l'etre. */
		return !!element.closest(APP_NAME) || element.tagName.toLowerCase() === APP_NAME
			|| !!element.closest(`#${CONTAINER_BUTTONS_ID}`);
	}

	private getActionable = (element: HTMLElement): HTMLElement | null => {
		return element?.closest?.(this.actionableSelector) as HTMLElement;
	}

	/* Returns the element to vocalize: the sentence / word span when there is
	   one, an image, or the closest element owning some text. */
	private resolveSpeakTarget = (element: HTMLElement): HTMLElement | null => {
		if (this.currentValue === 'all') {
			/* Un champ de saisie garde la main : ni vocalisation de zone, ni reprise du focus */
			if (element?.matches?.('input, select, textarea, [contenteditable="true"]')) {
				return null;
			}

			const zone = element?.closest?.('[data-cplus-zone]') as HTMLElement;

			if (zone) {
				return zone;
			}
		}

		const span = element?.closest?.(`.${this.readAloudSpan}`) as HTMLElement;

		if (span) {
			const actionable = this.getActionable(element);

			/* A standalone link / button / select is vocalized on its own; it is
			   only read as part of the sentence when the sentence holds other
			   text around it. */
			if (actionable && !this.spanHasTextOutsideActionables(span)) {
				return actionable;
			}

			return span;
		}

		const image = element?.closest?.(this.imageSelector) as HTMLElement;

		if (image) {
			return image;
		}

		let current: HTMLElement = element;
		let depth = 0;

		while (current && depth < 3) {
			/* The element may have no own text left because its text has been
			   wrapped into word / sentence spans (accordion headings...) */
			const wrapsSpans = current.matches?.(this.textSelector)
				&& !!current.querySelector?.(`.${this.readAloudSpan}`);

			if (this.hasOwnText(current) || wrapsSpans || this.getActionable(current) === current) {
				return current;
			}
			current = current.parentElement;
			depth++;
		}

		return null;
	}

	private spanHasTextOutsideActionables = (span: HTMLElement): boolean => {
		const clone = span.cloneNode(true) as HTMLElement;
		clone.querySelectorAll(this.actionableSelector).forEach((node: Element) => node.remove());

		return clone.textContent.trim() !== '';
	}

	/* Wrapping the children of a flex / grid container turns them into flex items:
	   the spaces between words and the gaps disappear, breaking the layout. */
	private isFlexOrGrid = (element: HTMLElement): boolean => {
		if (!element?.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
			return false;
		}

		return ['flex', 'inline-flex', 'grid', 'inline-grid']
			.includes(window.getComputedStyle(element).display);
	}

	private hasOwnText = (element: HTMLElement): boolean => {
		return Array.from(element?.childNodes ?? []).some(
			(node: Node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ''
		);
	}

	/* Message d'interface vocalisé seulement si Lire à haute voix est actif */
	speakText = (text: string): void => {
		if (this.currentValue === DEFAULT_VALUE || !text) {
			return;
		}

		if (speechSynthesis.speaking || speechSynthesis.pending) {
			speechSynthesis.cancel();
		}

		const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
		utterance.lang = document.documentElement.lang || navigator.language || 'fr-FR';
		speechSynthesis.speak(utterance);
	}

	private speak = (element: HTMLElement): void => {
		const text = this.getInnerText(element)?.trim();

		if (!text) {
			return;
		}

		const wasSpeaking = speechSynthesis.speaking || speechSynthesis.pending;

		if (wasSpeaking) {
			speechSynthesis.cancel();
		}

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = document.documentElement.lang || navigator.language || 'fr-FR';
		/* Seule la vocalisation en cours peut remettre l'etat a l'arret : sinon l'annulation de la
		   precedente eteignait aussitot celle qui vient d'etre lancee. */
		utterance.onend = () => {
			if (this.currentUtterance === utterance) {
				this.stopSpeech();
			}
		};
		utterance.onerror = utterance.onend;

		this.giveFocus(element);
		this.speakingElement = element;
		this.currentUtterance = utterance;
		this.state = 'on';
		document.documentElement.classList.add(this.speakingClass);

		/* Apres une annulation, les moteurs de synthese avalent la demande suivante si elle part dans
		   la foulee : elle est donc differee le temps que la file se vide. */
		const token = ++this.speakToken;
		clearTimeout(this.speakTimer);

		if (!wasSpeaking) {
			speechSynthesis.speak(utterance);
			return;
		}

		this.speakTimer = setTimeout(() => {
			if (token === this.speakToken && this.currentUtterance === utterance) {
				speechSynthesis.speak(utterance);
			}
		}, 150);
	}

	/* An activable element (including accordion headings) must receive the focus
	   when it is vocalized, so that a second gesture activates it. */
	private giveFocus = (element: HTMLElement): void => {
		const target = element?.closest?.(this.focusableSelector) as HTMLElement;

		/* Le focus n'est jamais repris a un element contenu dans la cible : la tabulation resterait
		   bloquee sur la meme unite. */
		if (!target || document.activeElement === target || this.isInsideApp(target)
			|| (document.activeElement && target.contains(document.activeElement))) {
			return;
		}

		if (!target.matches(this.nativelyFocusableSelector) && !target.hasAttribute('tabindex')) {
			target.setAttribute('tabindex', '-1');
			target.dataset.cplusTabindex = 'true';
		}

		target.focus({ preventScroll: true });
	}

	private stopSpeech = (armActivationWindow = true): void => {
		clearTimeout(this.speakTimer);
		this.speakToken++;
		this.currentUtterance = null;

		if (speechSynthesis.speaking || speechSynthesis.pending) {
			speechSynthesis.cancel();
		}

		/* The element stays activable for 1s after its vocalization, whatever its
		   nature: links, buttons, but also accordion headings whose behaviour
		   cannot be detected from the DOM. */
		this.lastSpokenTarget = armActivationWindow ? this.speakingElement : null;
		this.lastSpeechEnd = Date.now();
		this.speakingElement = null;
		document.documentElement.classList.remove(this.speakingClass);

		if (this.state === 'on') {
			this.state = 'suspended';
		}
	}

	private blockActivation = (event: any): void => {
		this.blockNextClick = true;
		event.preventDefault();
		event.stopPropagation();

		/* On touch devices preventDefault can swallow the click event itself:
		   the flag must never stay on, it would eat the next real click. */
		clearTimeout(this.blockClickTimer);
		this.blockClickTimer = setTimeout(() => {
			this.blockNextClick = false;
		}, 500);
	}

	private isSpokenElement = (element: HTMLElement, speakTarget: HTMLElement): boolean => {
		if (!this.speakingElement) {
			return false;
		}

		return this.speakingElement === speakTarget
			|| this.speakingElement.contains(element)
			|| !!speakTarget?.contains(this.speakingElement);
	}

	/* Common behaviour for a left click, a tap and the Enter key */
	private onActivationGesture = (event: any, element: HTMLElement): void => {
		const speakTarget = this.resolveSpeakTarget(element);

		/* Nothing to read here (empty zone): the current vocalization stops and
		   the element just read can be vocalized again right away. */
		if (!speakTarget) {
			this.stopSpeech(false);
			return;
		}

		if (this.state === 'on') {
			/* Second gesture on the element being read: stop the speech and let
			   the page handle the gesture (link, button, accordion heading...) */
			if (this.isSpokenElement(element, speakTarget)) {
				this.stopSpeech();
				return;
			}

			this.stopSpeech();
			this.blockActivation(event);

			if (speakTarget) {
				this.speak(speakTarget);
			}

			return;
		}

		/* Up to 1s after its vocalization, a new gesture on the same element is
		   passed through to the page */
		if (this.lastSpokenTarget
			&& Date.now() - this.lastSpeechEnd < 1000
			&& (this.lastSpokenTarget === speakTarget || this.lastSpokenTarget.contains(element))) {
			this.lastSpokenTarget = null;
			return;
		}

		this.blockActivation(event);
		this.speak(speakTarget);
	}

	private createHandler = () => {
		return (event: any) => {
			const target = event.target as HTMLElement;

			if (this.state === 'off') {
				return;
			}

			switch (event.type) {
				case 'pointermove':
					if (!this.tooltipReadAloud) {
						return;
					}
					this.tooltipReadAloud.style.left = `${event.pageX! - (window.scrollX || document.documentElement.scrollLeft)}px`;
					this.tooltipReadAloud.style.top = `${event.pageY! - (window.scrollY || document.documentElement.scrollTop)}px`;
					break;

				case 'pointerdown':
					if (this.isInsideApp(target)) {
						return;
					}

					/* The instruction tooltip disappears after the first click / tap */
					this.removeTooltip();
					this.lastPointerTime = Date.now();
					this.lastPointerTarget = target;

					/* A right click only interrupts the vocalization */
					if (event.button === 2) {
						this.stopSpeech();
						return;
					}

					this.onActivationGesture(event, target);
					break;

				case 'click':
					/* The toolbar UI must never be impacted by the settings */
					if (this.isInsideApp(target)) {
						return;
					}

					if (this.blockNextClick) {
						this.blockNextClick = false;
						event.preventDefault();
						event.stopPropagation();
						event.stopImmediatePropagation();
					}
					break;

				case 'keydown':
					if (event.key === 'Escape' || event.key === 'Esc') {
						this.removeTooltip();
						this.stopSpeech();
						return;
					}

					if (event.key === 'Enter') {
						const focused = document.activeElement as HTMLElement;

						if (!focused || this.isInsideApp(focused)) {
							return;
						}

						this.removeTooltip();
						this.onActivationGesture(event, focused);
					}
					break;

				case 'contextmenu':
					this.removeTooltip();
					this.stopSpeech();
					break;

				case 'focusin':
					/* Keyboard navigation: leaving an element interrupts its
					   vocalization, the newly focused one is vocalized. */
					const focusedElement = document.activeElement as HTMLElement;

					if (!focusedElement || this.isInsideApp(focusedElement)) {
						return;
					}

					/* Focus triggered by the click that was just handled: the
					   element has already been vocalized, nothing to do. */
					if (this.lastPointerTarget
						&& Date.now() - this.lastPointerTime < 700
						&& (this.lastPointerTarget === focusedElement
							|| focusedElement.contains(this.lastPointerTarget)
							|| this.lastPointerTarget.contains(focusedElement))) {
						return;
					}

					this.removeTooltip();
					this.stopSpeech();

					/* Sur demande : la mise en focus ne vocalise pas, c'est la touche Entree qui declenche */
					if (this.duration !== 'always') {
						return;
					}

					const speakTarget = this.resolveSpeakTarget(focusedElement);

					if (speakTarget) {
						this.speak(speakTarget);
					}
					break;
			}
		}
	}

	private getStyle = (): string => {
		const notSpeaking = `html:not(.${this.speakingClass})`;

		return `
			#${this.readAloudTooltipId} {
				position: fixed;
				white-space: pre-line;
				background-color: rgba(0, 0, 0, 0.8);
				color: white;
				border: 1px solid currentColor;
				width: fit-content;
				padding: 1em;
				pointer-events: none;
				z-index: calc(infinity);
				transform: translate(75px, 50%);
			}

			#${this.readAloudFlashId} {
				position: fixed;
				left: 50%;
				bottom: 2em;
				transform: translateX(-50%);
				background-color: #000;
				color: #fff;
				border: 3px solid #fff;
				border-radius: .5em;
				padding: .75em 1.25em;
				font-size: 1.125em;
				pointer-events: none;
				z-index: calc(infinity);
			}

			${notSpeaking} :is(${this.textSelector}),
			${notSpeaking} :is(${this.actionableSelector}) {
				cursor: ${this.cursorReadAloud} !important;
			}

			${notSpeaking} [data-cplus-tabindex]:focus,
			${notSpeaking} :is(${this.actionableSelector}):focus-visible,
			${notSpeaking} :is(${this.textSelector}):focus-visible {
				outline: 4px solid #000 !important;
				outline-offset: 3px !important;
				box-shadow: 0 0 0 8px #fff !important;
			}

			${this.getActionableHoverStyle()}
		`;
	}

	/* Hovering / focusing an actionable element reinforces its appearance,
	   one step further than the current "clearly links" setting. */
	private getActionableHoverStyle = (): string => {
		const current = clearlyLinksServiceInstance?.currentValue;
		const selector = `:is(${this.actionableSelector}):hover, :is(${this.actionableSelector}):focus-visible`;

		if (current === 'bold_underline') {
			return `
				${selector} {
					font-weight: bold !important;
					text-decoration: none !important;
					border: 2px solid currentColor !important;
				}
			`;
		}

		return `
			${selector} {
				font-weight: bold !important;
				text-decoration: underline !important;
			}
		`;
	}
}
