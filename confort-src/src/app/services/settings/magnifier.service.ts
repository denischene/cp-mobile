let magnifierServiceIsInstantiated: boolean;

/* Les trois loupes (Loupe souris, Focus-loupe, Agrandisseur) partagent le même moteur :
   une copie de la page, agrandie et recadrée sur un point de la page (coordonnées document).
   Toutes les couches sont en pointer-events: none pour ne jamais capter les clics de la page. */
class MagnifierService {
	type: string = null;
	level = 0;
	hidden = false;

	root: HTMLElement = null;
	viewport: HTMLElement = null;
	content: HTMLElement = null;
	badge: HTMLElement = null;
	focusBadge: HTMLElement = null;
	puck: HTMLElement = null;
	controls: HTMLElement = null;
	hintLeft: HTMLElement = null;
	hintRight: HTMLElement = null;
	hintTop: HTMLElement = null;
	hintBottom: HTMLElement = null;
	bubble: HTMLElement = null;
	bubbleTimer: any = null;
	edges: { [key: string]: HTMLElement } = {};

	focusedElement: HTMLElement = null;
	clientX = 0;
	clientY = 0;
	exploreOffset = 0;
	exploreOffsetY = 0;
	exploreTimer: any = null;
	lastValue: string = null;
	armedElement: HTMLElement = null;
	armedAt = 0;
	engaged = false;
	pending = false;
	manualHints = false;
	exploreStart = 0;
	explorePhase = '';
	focusRange: Range = null;
	longPressTimer: any = null;
	longPressX = 0;
	longPressY = 0;
	topLayerCount = -1;
	badgeTimer: any = null;
	controlsTimer: any = null;
	cloneTimer: any = null;
	settleTimer: any = null;
	observer: MutationObserver = null;
	pausedReadingGuide: string = null;
	baseBrowserZoom = 100;
	handler: any;

	constructor() {
		if (magnifierServiceIsInstantiated) {
			throw new Error('MagnifierService is already instantiated.');
		}

		magnifierServiceIsInstantiated = true;

		this.handler = this.createHandler();
		/* Ctrl + Maj + Z allume ou eteint la loupe sans ouvrir la palette */
		window.addEventListener('keydown', this.shortcutHandler, true);
		/* Appui long sur mobile : meme chose, sans passer par la palette */
		window.addEventListener('pointerdown', this.longPressHandler, true);
		window.addEventListener('pointermove', this.longPressHandler, true);
		window.addEventListener('pointerup', this.longPressHandler, true);
		window.addEventListener('pointercancel', this.longPressHandler, true);
	}

	longPressHandler = (event: PointerEvent): void => {
		if (event.pointerType !== 'touch') {
			return;
		}

		if (event.type === 'pointerdown') {
			const target = event.target as HTMLElement;

			if (this.type || this.root?.contains(target) || target?.tagName?.toLowerCase() === APP_NAME) {
				return;
			}

			this.longPressX = event.clientX;
			this.longPressY = event.clientY;
			clearTimeout(this.longPressTimer);
			this.longPressTimer = setTimeout(() => {
				this.clientX = this.longPressX;
				this.clientY = this.longPressY;
				this.toggle();
			}, MAGNIFIER_LONG_PRESS);
			return;
		}

		if (event.type === 'pointermove'
			&& Math.abs(event.clientX - this.longPressX) < MAGNIFIER_LONG_PRESS_TOLERANCE
			&& Math.abs(event.clientY - this.longPressY) < MAGNIFIER_LONG_PRESS_TOLERANCE) {
			return;
		}

		clearTimeout(this.longPressTimer);
	}

	shortcutHandler = (event: KeyboardEvent): void => {
		if (!event.ctrlKey || !event.shiftKey || (event.key || '').toLowerCase() !== 'z') {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.toggle();
	}

	toggle = (): void => {
		if (this.type) {
			this.lastValue = `${this.type}_x${this.level}`;
			this.applySettingValue(DEFAULT_VALUE);
			return;
		}

		modeOfUseServiceInstance.getSetting('magnifier').then((result: SettingModel) => {
			const values = result?.values?.split(',') ?? [];
			const fallback = values.find((value: string) => value && value !== DEFAULT_VALUE);
			this.applySettingValue(this.lastValue || fallback || `${MAGNIFIER_MOUSE}_x${MAGNIFIER_RANGES[MAGNIFIER_MOUSE].min}`);
		});
	}

	applySettingValue = (value: string): void => {
		modeOfUseServiceInstance.getSetting('magnifier').then((result: SettingModel) => {
			const values = result?.values?.split(',') ?? [];
			const index = values.indexOf(value);

			if (index !== -1) {
				modeOfUseServiceInstance.setSettingValue('magnifier', index, false);
			} else {
				modeOfUseServiceInstance.addSettingCustomValue('magnifier', 3, value);
			}

			this.setMagnifier(value);
		});
	}

	isTouch = (): boolean => window.matchMedia('(pointer: coarse)').matches;

	/* ---------- Activation ---------- */

	setMagnifier = (value: string): void => {
		const parsed = this.parseValue(value);

		if (!parsed) {
			this.deactivate();
			return;
		}

		const wasActive = !!this.type;
		const previousType = this.type;
		this.type = parsed.type;
		this.level = parsed.level;
		this.lastValue = `${parsed.type}_x${parsed.level}`;

		if (!wasActive) {
			this.activate();
		} else {
			this.applyType();
			this.applyBrowserZoom();

			if (this.type === MAGNIFIER_FOCUS && previousType !== MAGNIFIER_FOCUS) {
				this.focusStartingElement();
				this.enterPending();
			} else if (this.type !== MAGNIFIER_FOCUS) {
				this.pending = false;
				stylesServiceInstance.removeStyle('magnifier-cursor');
			}

			this.render();
		}

		this.showBadge();
		this.showTransitionHint(previousType);
		if (this.isTouch()) {
			this.showControls();
		}
	}

	parseValue = (value: string): { type: string, level: number } => {
		if (!value || value === DEFAULT_VALUE) {
			return null;
		}

		/* Nouvelles valeurs : type_xN. Anciennes valeurs : zoomN (Loupe souris historique). */
		const parts = value.split('_');
		let type = parts[0];
		let level = parseInt((parts[1] || parts[0] || '').replace(/\D/g, ''), 10);

		if (!MAGNIFIER_TYPES.includes(type)) {
			type = MAGNIFIER_MOUSE;
		}
		if (!level || Number.isNaN(level)) {
			level = MAGNIFIER_RANGES[type].min;
		}

		return { type, level: this.clampLevel(type, level) };
	}

	clampLevel = (type: string, level: number): number => {
		const range = MAGNIFIER_RANGES[type];
		return Math.min(range.max, Math.max(range.min, level));
	}

	activate = (): void => {
		stylesServiceInstance.setStyle('magnifier', this.style());
		this.buildDom();
		this.clientX = this.clientX || Math.round(window.innerWidth / 2);
		this.clientY = this.clientY || Math.round(window.innerHeight / 2);

		window.addEventListener('pointermove', this.handler, true);
		window.addEventListener('pointerdown', this.handler, true);
		window.addEventListener('click', this.handler, true);
		window.addEventListener('keydown', this.handler, true);
		window.addEventListener('wheel', this.handler, { passive: false, capture: true });
		window.addEventListener('contextmenu', this.handler, true);
		window.addEventListener('focusin', this.handler, true);
		window.addEventListener('focusout', this.handler, true);
		window.addEventListener('scroll', this.handler, true);
		window.addEventListener('resize', this.handler, false);

		this.pauseReadingGuide();
		this.applyType();
		if (this.type === MAGNIFIER_FOCUS) {
			this.focusStartingElement();
			this.enterPending();
		}
		this.applyBrowserZoom();
		this.cloneContent();
		this.bindObserver();
		this.render();
	}

	deactivate = (): void => {
		if (!this.type) {
			return;
		}

		this.type = null;
		this.level = 0;
		this.hidden = false;
		this.focusedElement = null;
		this.armedElement = null;
		this.focusRange = null;
		this.engaged = false;
		this.stopExploration();
		clearTimeout(this.badgeTimer);
		clearTimeout(this.controlsTimer);
		clearTimeout(this.cloneTimer);
		clearTimeout(this.settleTimer);
		this.clearTextFocusable();

		window.removeEventListener('pointermove', this.handler, true);
		window.removeEventListener('pointerdown', this.handler, true);
		window.removeEventListener('click', this.handler, true);
		window.removeEventListener('keydown', this.handler, true);
		window.removeEventListener('wheel', this.handler, true);
		window.removeEventListener('contextmenu', this.handler, true);
		window.removeEventListener('focusin', this.handler, true);
		window.removeEventListener('focusout', this.handler, true);
		window.removeEventListener('scroll', this.handler, true);
		window.removeEventListener('resize', this.handler, false);

		this.topLayerCount = -1;
		this.pending = false;
		this.manualHints = false;
		stylesServiceInstance.removeStyle('magnifier-cursor');
		this.unbindObserver();
		this.restoreBrowserZoom();
		this.resumeReadingGuide();

		this.root?.remove();
		this.root = null;
		this.viewport = null;
		this.content = null;
		stylesServiceInstance.removeStyle('magnifier');
	}

	/* ---------- Continuité des niveaux ---------- */

	step = (delta: number): void => {
		const next = this.nextStep(this.type, this.level + delta, delta);

		if (next.type === this.type && next.level === this.level) {
			return;
		}

		const previousType = this.type;
		const typeChanged = next.type !== this.type;
		this.type = next.type;
		this.level = next.level;

		if (typeChanged) {
			this.applyType();
			this.applyBrowserZoom();
			this.showTransitionHint(previousType);
		}

		this.render();
		this.showBadge();
		if (this.isTouch()) {
			this.showControls();
		}
		this.saveCustomValue();
	}

	nextStep = (type: string, level: number, delta: number): { type: string, level: number } => {
		const range = MAGNIFIER_RANGES[type];

		if (level > range.max) {
			if (type === MAGNIFIER_MOUSE) {
				return { type: MAGNIFIER_FOCUS, level: MAGNIFIER_ENTRY_LEVEL[MAGNIFIER_FOCUS] };
			}
			if (type === MAGNIFIER_FOCUS) {
				return { type: MAGNIFIER_SCREEN, level: MAGNIFIER_ENTRY_LEVEL[MAGNIFIER_SCREEN] };
			}
			return { type, level: range.max };
		}

		if (level < range.min) {
			if (type === MAGNIFIER_SCREEN) {
				return { type: MAGNIFIER_FOCUS, level: MAGNIFIER_RANGES[MAGNIFIER_FOCUS].max };
			}
			if (type === MAGNIFIER_FOCUS) {
				return { type: MAGNIFIER_MOUSE, level: MAGNIFIER_RANGES[MAGNIFIER_MOUSE].max };
			}
			return { type, level: range.min };
		}

		return { type, level };
	}

	/* La valeur courante devient la valeur personnalisée du bouton multiclic */
	saveCustomValue = (): void => {
		const value = `${this.type}_x${this.level}`;

		modeOfUseServiceInstance.getSetting('magnifier').then((result: SettingModel) => {
			const values = result?.values?.split(',') ?? [];
			const index = values.indexOf(value);

			if (index !== -1) {
				modeOfUseServiceInstance.setSettingValue('magnifier', index, false);
			} else {
				modeOfUseServiceInstance.addSettingCustomValue('magnifier', 3, value)
					.then(() => this.notifyCustomValue(this.type, this.level));
			}
		});
	}

	/* L'infobulle « nouvelle valeur » doit afficher un libellé lisible, pas la valeur brute */
	notifyCustomValue = (type: string, level: number): void => {
		const label = i18nServiceInstance.getMessage('magnifier_values', [
			i18nServiceInstance.getMessage(type),
			i18nServiceInstance.getMessage(`x${level}`)
		]);

		if (label) {
			localStorageServiceInstance.setItem('new-value-added-tooltip', JSON.stringify({ setting: 'magnifier', value: label }));
		}
	}

	/* ---------- Zoom navigateur ---------- */

	applyBrowserZoom = (): void => {
		const requestedType = this.type;
		const extra = MAGNIFIER_BROWSER_ZOOM[requestedType] ?? 0;

		if (!extra) {
			stylesServiceInstance.removeStyle('magnifier-zoom');
			this.cloneContentQueued();
			return;
		}

		modeOfUseServiceInstance.getSetting('zoom').then((result: SettingModel) => {
			const current = result?.values?.split(',')[result.valueSelected];
			this.baseBrowserZoom = (!current || current === DEFAULT_VALUE) ? 100 : Number(current);

			if (this.type !== requestedType) {
				return;
			}

			const zoomValue = (this.baseBrowserZoom * (100 + extra)) / 10000;
			const noZoomValue = 1 / zoomValue;

			stylesServiceInstance.setStyle('magnifier-zoom', `
				body {
					zoom: ${zoomValue};
				}
				${APP_NAME}, body > [id^=${PREFIX}], body::-webkit-scrollbar {
					zoom: ${noZoomValue} !important;
				}
			`);

			this.cloneContentQueued();
		});
	}

	restoreBrowserZoom = (): void => {
		stylesServiceInstance.removeStyle('magnifier-zoom');
	}

	/* ---------- Guide de lecture mis en pause ---------- */

	pauseReadingGuide = (): void => {
		modeOfUseServiceInstance.getSetting('readingGuide').then((result: SettingModel) => {
			const current = result?.values?.split(',')[result.valueSelected];

			if (current && current !== DEFAULT_VALUE) {
				this.pausedReadingGuide = current;
				readingGuideServiceInstance.setReadingMaskGuide(DEFAULT_VALUE);
			}
		});
	}

	resumeReadingGuide = (): void => {
		if (this.pausedReadingGuide) {
			readingGuideServiceInstance.setReadingMaskGuide(this.pausedReadingGuide);
			this.pausedReadingGuide = null;
		}
	}

	/* ---------- DOM ---------- */

	buildDom = (): void => {
		document.querySelector(`#${MAGNIFIER_ROOT_ID}`)?.remove();

		const root = document.createElement('div');
		root.setAttribute('id', MAGNIFIER_ROOT_ID);
		root.setAttribute('popover', 'manual');
		root.innerHTML = `
			<div class="${PREFIX}magnifier-viewport">
				<div class="${PREFIX}magnifier-content"></div>
				<span class="${PREFIX}magnifier-hint ${PREFIX}magnifier-hint--left"></span>
				<span class="${PREFIX}magnifier-hint ${PREFIX}magnifier-hint--right"></span>
				<span class="${PREFIX}magnifier-hint ${PREFIX}magnifier-hint--top"></span>
				<span class="${PREFIX}magnifier-hint ${PREFIX}magnifier-hint--bottom"></span>
			</div>
			<span class="${PREFIX}magnifier-edge ${PREFIX}magnifier-edge--top"></span>
			<span class="${PREFIX}magnifier-edge ${PREFIX}magnifier-edge--bottom"></span>
			<span class="${PREFIX}magnifier-edge ${PREFIX}magnifier-edge--left"></span>
			<span class="${PREFIX}magnifier-edge ${PREFIX}magnifier-edge--right"></span>
			<span class="${PREFIX}magnifier-badge"></span>
			<span class="${PREFIX}magnifier-bubble"></span>
			<span class="${PREFIX}magnifier-focus-badge">
				<span class="${PREFIX}magnifier-focus-badge__vocalize"></span>
				<span class="${PREFIX}magnifier-focus-badge__magnify"></span>
			</span>
			<span class="${PREFIX}magnifier-puck"></span>
			<div class="${PREFIX}magnifier-controls">
				<button type="button" class="${PREFIX}magnifier-controls__btn" data-step="-1">&minus;</button>
				<span class="${PREFIX}magnifier-controls__level"></span>
				<button type="button" class="${PREFIX}magnifier-controls__btn" data-step="1">+</button>
			</div>
		`;
		document.body.appendChild(root);

		this.root = root;
		this.viewport = root.querySelector(`.${PREFIX}magnifier-viewport`);
		this.content = root.querySelector(`.${PREFIX}magnifier-content`);
		this.badge = root.querySelector(`.${PREFIX}magnifier-badge`);
		this.bubble = root.querySelector(`.${PREFIX}magnifier-bubble`);
		this.focusBadge = root.querySelector(`.${PREFIX}magnifier-focus-badge`);
		this.puck = root.querySelector(`.${PREFIX}magnifier-puck`);
		this.controls = root.querySelector(`.${PREFIX}magnifier-controls`);
		this.hintLeft = root.querySelector(`.${PREFIX}magnifier-hint--left`);
		this.hintRight = root.querySelector(`.${PREFIX}magnifier-hint--right`);
		this.hintTop = root.querySelector(`.${PREFIX}magnifier-hint--top`);
		this.hintBottom = root.querySelector(`.${PREFIX}magnifier-hint--bottom`);
		['top', 'bottom', 'left', 'right'].forEach((side: string) => {
			this.edges[side] = root.querySelector(`.${PREFIX}magnifier-edge--${side}`);
		});

		this.controls.querySelectorAll('button').forEach((button: HTMLButtonElement) => {
			button.addEventListener('click', this.handler);
		});
	}

	/* Les pop-ups natives (<dialog> modal, popover) sont dans le top layer : aucun z-index ne
	   passe au-dessus. On y monte la loupe uniquement tant qu'une telle pop-up est ouverte,
	   pour que la palette Confort+ reste au-dessus le reste du temps. */
	ensureTopLayer = (): void => {
		const root: any = this.root;

		if (!root || typeof root.showPopover !== 'function') {
			return;
		}

		let count = 0;

		try {
			count = document.querySelectorAll(`dialog[open], [popover]:popover-open:not(#${MAGNIFIER_ROOT_ID})`).length;
		} catch (error) {
			count = document.querySelectorAll('dialog[open]').length;
		}

		/* Bulle et fenetre de focus doivent toujours passer au-dessus des champs de recherche et
		   autres habillages de site ; en Agrandisseur on reste sous la palette Confort+. */
		if (this.type !== MAGNIFIER_SCREEN && !this.pending) {
			count = Math.max(count, 1);
		}

		if (count === this.topLayerCount) {
			return;
		}

		this.topLayerCount = count;

		try {
			if (root.matches(':popover-open')) {
				root.hidePopover();
			}
			if (count > 0) {
				root.showPopover();
			}
		} catch (error) {
			/* popover indisponible : la loupe reste sous la pop-up */
		}
	}

	applyType = (): void => {
		if (!this.viewport) {
			return;
		}

		this.root.setAttribute('data-type', this.type);
		this.stopExploration();
		this.applyTheme();
		this.syncTextUnits();

		if (this.type === MAGNIFIER_SCREEN) {
			this.viewport.style.width = '100vw';
			this.viewport.style.height = '100vh';
			this.viewport.style.borderRadius = '0';
		} else if (this.type === MAGNIFIER_FOCUS) {
			this.viewport.style.width = `${Math.min(640, Math.round(window.innerWidth * 0.8))}px`;
			this.viewport.style.height = `${Math.min(260, Math.round(window.innerHeight * 0.4))}px`;
			this.viewport.style.borderRadius = '0.75rem';
		} else {
			const size = Math.min(MAGNIFIER_BUBBLE_SIZE, Math.round(window.innerWidth * 0.7));
			this.viewport.style.width = `${size}px`;
			this.viewport.style.height = `${size}px`;
			this.viewport.style.borderRadius = '50%';
		}
	}

	/* ---------- Copie de la page ---------- */

	cloneContent = (): void => {
		if (!this.content) {
			return;
		}

		this.applyTheme();

		/* La copie de reference se prend sans la loupe : elle est detachee du document le temps
		   du clonage, sinon la vue agrandie contient sa propre image (loupe dans la loupe,
		   zoom sur zoom apres une activation). */
		const parent = this.root?.parentNode;
		const next = this.root?.nextSibling;

		if (parent) {
			try {
				if ((this.root as any).matches(':popover-open')) {
					(this.root as any).hidePopover();
				}
			} catch (error) {
				/* popover indisponible */
			}

			this.topLayerCount = -1;
			parent.removeChild(this.root);
		}

		try {
			this.buildClone();
		} finally {
			if (parent) {
				parent.insertBefore(this.root, next);
				/* Le retrait puis le retour de la loupe sont des mutations : sans les ecarter,
				   l'observateur relancerait une copie en boucle. */
				this.observer?.takeRecords();
				this.ensureTopLayer();
			}
		}
	}

	private buildClone = (): void => {
		const start = performance.now();
		const bodyCopy = document.body.cloneNode(true) as HTMLElement;
		bodyCopy.style.cursor = 'auto';
		bodyCopy.style.position = 'relative';
		bodyCopy.setAttribute('unselectable', 'on');

		this.freezeOutOfFlowElements(bodyCopy);
		this.copyMediaElements(bodyCopy);

		const canvasOriginal = document.body.querySelectorAll('canvas');
		const canvasCopy = bodyCopy.querySelectorAll('canvas');
		if (canvasOriginal.length > 0 && canvasOriginal.length === canvasCopy.length) {
			for (let i = 0; i < canvasOriginal.length; i++) {
				try {
					(canvasCopy[i] as HTMLCanvasElement).getContext('2d')?.drawImage(canvasOriginal[i] as HTMLCanvasElement, 0, 0);
				} catch (error) {
					/* canvas protégé : on garde la copie vide */
				}
			}
		}

		['script', 'audio', APP_NAME, `#${MAGNIFIER_ROOT_ID}`, `[id^=${PREFIX}]`].forEach((selector: string) => {
			bodyCopy.querySelectorAll(selector).forEach((element: Element) => element.remove());
		});

		this.copyTopLayerElements(bodyCopy);

		this.content.innerHTML = '';
		this.content.appendChild(bodyCopy);
		this.content.style.width = `${document.documentElement.scrollWidth}px`;
		this.content.style.height = `${document.documentElement.scrollHeight}px`;

		/* Repli automatique : si la copie est trop lente, on redescend à un niveau tenable */
		if ((performance.now() - start) > MAGNIFIER_SLOW_CLONE_MS && this.level > MAGNIFIER_SAFE_LEVEL) {
			this.level = MAGNIFIER_SAFE_LEVEL;
			this.showBadge();
		}
	}

	/* Dans la copie, un element en position fixed ou sticky se cale sur le conteneur agrandi et
	   part hors champ : les bandeaux de cookies, barres collantes et pop-ups etaient donc
	   focalisables mais jamais zoomes. On les repose a leur position reelle dans la page. */
	freezeOutOfFlowElements = (bodyCopy: HTMLElement): void => {
		const origin = this.documentOrigin();
		const pairs: HTMLElement[][] = [];

		const walk = (original: Element, copy: Element, depth: number): void => {
			if (!original || !copy || original.children.length !== copy.children.length) {
				return;
			}

			for (let index = 0; index < original.children.length; index++) {
				const child = original.children[index] as HTMLElement;
				const childCopy = copy.children[index] as HTMLElement;
				const position = getComputedStyle(child).position;

				if (position === 'fixed' || position === 'sticky') {
					pairs.push([child, childCopy]);
				}

				if (depth > 1) {
					walk(child, childCopy, depth - 1);
				}
			}
		};

		walk(document.body, bodyCopy, MAGNIFIER_MAX_DEPTH);

		/* Le reparentage se fait apres le parcours : il decale les listes d'enfants */
		pairs.forEach(([element, copy]: HTMLElement[]) => this.placeInDocument(element, copy, bodyCopy, origin));
	}

	/* Origine du document pour la copie : le body copie porte ses propres marges */
	documentOrigin = (): { x: number, y: number } => {
		const rect = document.body.getBoundingClientRect();

		return {
			x: rect.left + (window.scrollX || document.documentElement.scrollLeft),
			y: rect.top + (window.scrollY || document.documentElement.scrollTop)
		};
	}

	/* Repose une copie a la place exacte de son original, en enfant direct du body copie :
	   sinon un `absolute` se calerait sur le premier ancetre positionne et partirait ailleurs. */
	placeInDocument = (element: HTMLElement, copy: HTMLElement, bodyCopy: HTMLElement, origin: { x: number, y: number }, zIndex: string = ''): void => {
		const rect = element.getBoundingClientRect();

		if (!rect.width || !rect.height) {
			return;
		}

		const left = rect.left + (window.scrollX || document.documentElement.scrollLeft) - origin.x;
		const top = rect.top + (window.scrollY || document.documentElement.scrollTop) - origin.y;

		/* L'ordre d'empilement d'origine est conserve : sans lui, un voile gris de modale reposee
		   apres la modale elle-meme recouvrait son contenu (bandeau cookies d'orange.fr). */
		const depth = zIndex || this.stackingOrder(element);

		copy.style.cssText += `;position:absolute;left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px;margin:0;max-width:none;max-height:none;z-index:${depth};`;
		bodyCopy.appendChild(copy);
	}

	/* z-index effectif d'un element hors flux, en remontant ses ancetres positionnes */
	stackingOrder = (element: HTMLElement): string => {
		let current: HTMLElement = element;
		let depth = 0;

		while (current && depth < MAGNIFIER_MAX_DEPTH) {
			const value = getComputedStyle(current).zIndex;

			if (value && value !== 'auto') {
				return value;
			}

			current = current.parentElement;
			depth++;
		}

		return '1';
	}

	/* Cadres embarques et videos : les iframes visibles (lecteurs video, formulaires de paiement,
	   PDF) sont conservees pour etre agrandies, les videos sont remplacees par leur image
	   courante et les cadres hors ecran par un bloc de meme taille. */
	copyMediaElements = (bodyCopy: HTMLElement): void => {
		const videosOriginal = Array.from(document.body.querySelectorAll('video')) as HTMLVideoElement[];
		const videosCopy = Array.from(bodyCopy.querySelectorAll('video')) as HTMLVideoElement[];

		videosOriginal.forEach((video: HTMLVideoElement, index: number) => {
			const copy = videosCopy[index];
			const rect = video.getBoundingClientRect();

			if (!copy || !rect.width || !rect.height) {
				copy?.remove();
				return;
			}

			const snapshot = document.createElement('canvas');
			snapshot.width = Math.round(rect.width);
			snapshot.height = Math.round(rect.height);
			snapshot.style.cssText = `width:${rect.width}px;height:${rect.height}px;display:block;`;

			try {
				snapshot.getContext('2d')?.drawImage(video, 0, 0, snapshot.width, snapshot.height);
			} catch (error) {
				const poster = video.getAttribute('poster');

				if (poster) {
					const image = document.createElement('img');
					image.src = poster;
					image.style.cssText = snapshot.style.cssText;
					copy.replaceWith(image);
					return;
				}
			}

			copy.replaceWith(snapshot);
		});

		const framesOriginal = Array.from(document.body.querySelectorAll('iframe, embed, object')) as HTMLElement[];
		const framesCopy = Array.from(bodyCopy.querySelectorAll('iframe, embed, object')) as HTMLElement[];

		framesOriginal.forEach((frame: HTMLElement, index: number) => {
			const copy = framesCopy[index];

			if (!copy) {
				return;
			}

			const rect = frame.getBoundingClientRect();
			const visible = rect.width > 0 && rect.height > 0
				&& rect.bottom > -MAGNIFIER_FRAME_MARGIN
				&& rect.top < window.innerHeight + MAGNIFIER_FRAME_MARGIN;

			if (!visible) {
				const placeholder = document.createElement('div');
				placeholder.style.cssText = `width:${rect.width}px;height:${rect.height}px;`;
				copy.replaceWith(placeholder);
				return;
			}

			copy.removeAttribute('allow');
			copy.removeAttribute('allowfullscreen');
			copy.setAttribute('tabindex', '-1');
			copy.setAttribute('aria-hidden', 'true');
			copy.style.cssText += `;width:${rect.width}px;height:${rect.height}px;pointer-events:none;`;
		});
	}

	/* Une pop-up native (dialog modal, popover) n'est plus affichee dans une copie : on la repose
	   a sa place reelle pour que la loupe agrandisse bien son contenu. */
	copyTopLayerElements = (bodyCopy: HTMLElement): void => {
		const selector = 'dialog[open], [popover]';
		const origin = this.documentOrigin();
		const originals = Array.from(document.body.querySelectorAll(selector)) as HTMLElement[];
		const copies = Array.from(bodyCopy.querySelectorAll(selector)) as HTMLElement[];

		originals.forEach((element: HTMLElement, index: number) => {
			const copy = copies[index];

			if (!copy) {
				return;
			}

			copy.removeAttribute('popover');
			copy.setAttribute('open', '');
			copy.style.cssText += ';display:block;';
			/* Couche superieure du navigateur : au-dessus de tout le reste de la copie */
			this.placeInDocument(element, copy, bodyCopy, origin, '2147483000');
		});
	}

	cloneContentQueued = (delay: number = MAGNIFIER_CLONE_DELAY): void => {
		clearTimeout(this.cloneTimer);
		this.cloneTimer = setTimeout(() => {
			this.cloneContent();
			this.render();
		}, delay);
	}

	/* Apres une activation (menu deroulant, liste, accordeon) : une copie tout de suite pour
	   suivre l'ouverture, une seconde une fois l'animation terminee. */
	cloneContentSoon = (): void => {
		this.cloneContentQueued(MAGNIFIER_CLONE_FAST);
		clearTimeout(this.settleTimer);
		this.settleTimer = setTimeout(() => {
			this.cloneContent();
			this.render();
		}, MAGNIFIER_CLONE_SETTLE);
	}

	bindObserver = (): void => {
		this.observer = new MutationObserver((mutations: MutationRecord[]) => {
			const outsideMagnifier = mutations.some((mutation: MutationRecord) => {
				const target = mutation.target as HTMLElement;
				return !this.root?.contains(target);
			});

			if (outsideMagnifier) {
				this.ensureTopLayer();
				this.cloneContentQueued();
			}
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ['class', 'style', 'width', 'height', 'src', 'value']
		});
	}

	unbindObserver = (): void => {
		this.observer?.disconnect();
		this.observer = null;
	}

	/* ---------- Rendu ---------- */

	render = (): void => {
		if (!this.type || !this.viewport || this.hidden) {
			return;
		}

		if (this.pending) {
			this.viewport.style.display = 'none';
			this.updateFocusBadge();
			this.ensureTopLayer();
			return;
		}

		const scrollX = window.scrollX || document.documentElement.scrollLeft;
		const scrollY = window.scrollY || document.documentElement.scrollTop;
		let width = this.viewport.offsetWidth;
		let height = this.viewport.offsetHeight;
		let focalX = this.clientX + scrollX;
		let focalY = this.clientY + scrollY;
		let left = 0;
		let top = 0;

		if (this.type === MAGNIFIER_SCREEN) {
			left = 0;
			top = 0;
		} else if (this.type === MAGNIFIER_FOCUS && this.focusedElement) {
			const rect = this.anchorRect();
			this.applyFocusSize(rect);
			width = this.viewport.offsetWidth;
			height = this.viewport.offsetHeight;

			/* Un mot pointe a la souris : la vue commence sur ce mot, au lieu d'etre centree */
			/* La vue commence au premier mot (ou picto) de l'element : un paragraphe plus large ou
			   plus haut que la fenetre serait sinon montre par son milieu. */
			const startX = ((width / 2) - (width * 0.1)) / this.level;
			const startY = ((height / 2) - (height * 0.1)) / this.level;

			focalX = rect.left + scrollX + Math.min(startX, rect.width / 2) + this.exploreOffset;
			focalY = rect.top + scrollY + Math.min(startY, rect.height / 2) + this.exploreOffsetY;
			left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + (rect.width / 2) - (width / 2)));
			top = Math.max(8, Math.min(window.innerHeight - height - 8, rect.top + (rect.height / 2) - (height / 2)));
		} else if (this.type === MAGNIFIER_FOCUS) {
			left = Math.max(8, Math.min(window.innerWidth - width - 8, this.clientX - (width / 2)));
			top = Math.max(8, Math.min(window.innerHeight - height - 8, this.clientY + 24));
		} else {
			left = this.clientX - (width / 2);
			top = this.clientY - (height / 2);
		}

		this.viewport.style.left = `${Math.round(left)}px`;
		this.viewport.style.top = `${Math.round(top)}px`;
		this.viewport.style.display = 'block';

		/* En Agrandisseur, le point sous le curseur reste sous le curseur : les zones de clic
		   de la vue agrandie et de la page restent alignees. */
		const centerX = this.type === MAGNIFIER_SCREEN ? this.clientX : width / 2;
		const centerY = this.type === MAGNIFIER_SCREEN ? this.clientY : height / 2;
		const offsetX = Math.round(centerX - (focalX * this.level));
		const offsetY = Math.round(centerY - (focalY * this.level));

		/* Une seule transformation : Firefox et Edge ne rafraichissaient pas une copie geante
		   repositionnee en left/top a chaque mouvement. */
		this.content.style.left = '0px';
		this.content.style.top = '0px';
		this.content.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${this.level})`;

		this.updateHints();
		this.updateEdges();
		this.updateFocusBadge();
		this.ensureTopLayer();
	}

	/* ---------- Etats pending et zoome du Focus-loupe ---------- */

	enterPending = (): void => {
		this.pending = true;
		this.engaged = false;
		this.stopExploration();
		this.viewport.style.display = 'none';
		this.applyCursor();
		this.updateFocusBadge();
	}

	enterZoomed = (): void => {
		this.pending = false;
		this.manualHints = false;
		this.engaged = true;
		stylesServiceInstance.removeStyle('magnifier-cursor');
		this.cloneContent();
		this.render();
		this.startExploration();
		this.focusBadge.style.display = 'none';
	}

	/* Focus de depart : le dernier element focalise, sinon le premier de la page */
	focusStartingElement = (): void => {
		const active = document.activeElement as HTMLElement;

		if (active && active !== document.body && active.tagName?.toLowerCase() !== APP_NAME && !this.root?.contains(active)) {
			this.setFocusedElement(active);
			return;
		}

		const candidates = Array.from(document.body.querySelectorAll(MAGNIFIER_ACTIONABLE_SELECTOR)) as HTMLElement[];
		const first = candidates.find((element: HTMLElement) => {
			const rect = element.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0 && element.tagName?.toLowerCase() !== APP_NAME && !this.root?.contains(element);
		});

		if (first) {
			this.setFocusedElement(first);
			first.focus?.();
		}
	}

	/* Cadre pose sur l'element focalise en attente : loupe dans le coin droit, bulle de
	   vocalisation dans le coin gauche quand Lire a haute voix est actif. */
	updateFocusBadge = (): void => {
		if (!this.focusBadge) {
			return;
		}

		if (!this.pending || !this.focusedElement || !document.contains(this.focusedElement)) {
			this.focusBadge.style.display = 'none';
			return;
		}

		const rect = this.focusedElement.getBoundingClientRect();

		if (!rect.width || !rect.height) {
			this.focusBadge.style.display = 'none';
			return;
		}

		const speaking = readAloudServiceInstance.currentValue !== DEFAULT_VALUE;
		this.focusBadge.setAttribute('data-vocalize', speaking ? 'true' : 'false');
		/* Pres du haut de l'ecran, les pictos passent a l'interieur du cadre pour rester visibles */
		this.focusBadge.setAttribute('data-inside', rect.top < (MAGNIFIER_BADGE_HEIGHT + 8) ? 'true' : 'false');
		this.focusBadge.style.display = 'block';
		this.focusBadge.style.left = `${Math.round(rect.left - MAGNIFIER_FRAME_PADDING)}px`;
		this.focusBadge.style.top = `${Math.round(rect.top - MAGNIFIER_FRAME_PADDING)}px`;
		this.focusBadge.style.width = `${Math.round(rect.width + (2 * MAGNIFIER_FRAME_PADDING))}px`;
		this.focusBadge.style.height = `${Math.round(rect.height + (2 * MAGNIFIER_FRAME_PADDING))}px`;
	}

	/* Fond sombre (page ou navigateur) : le cadre et la fenetre se cerclent de blanc */
	applyTheme = (): void => {
		this.root?.setAttribute('data-dark', this.isDarkBackground() ? 'true' : 'false');
	}

	isDarkBackground = (): boolean => {
		const candidates = [document.body, document.documentElement];

		for (let index = 0; index < candidates.length; index++) {
			const parts = (getComputedStyle(candidates[index]).backgroundColor || '').match(/[\d.]+/g);

			if (!parts || parts.length < 3 || (parts.length > 3 && Number(parts[3]) === 0)) {
				continue;
			}

			return ((0.299 * Number(parts[0])) + (0.587 * Number(parts[1])) + (0.114 * Number(parts[2]))) < 128;
		}

		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	/* Focus-loupe : titres, phrases et paragraphes deviennent focalisables, pour que la
	   tabulation parcoure tout le contenu de la page et pas seulement liens et boutons. */
	/* Focus-loupe seul : decoupage par paragraphes. Des que Lire a haute voix est actif, c'est son
	   decoupage qui prime et la loupe ne pose plus d'unites. */
	syncTextUnits = (): void => {
		if (this.type === MAGNIFIER_FOCUS && readAloudServiceInstance.state === 'off') {
			this.makeTextFocusable();
			return;
		}

		this.clearTextFocusable();
	}

	makeTextFocusable = (): void => {
		domServiceInstance.makeTextBlocksFocusable(MAGNIFIER_TEXT_FLAG);
	}

	clearTextFocusable = (): void => {
		domServiceInstance.clearTextBlocksFocusable(MAGNIFIER_TEXT_FLAG);
	}

	/* Curseur specifique a l'etat pending */
	applyCursor = (): void => {
		if (!this.pending) {
			stylesServiceInstance.removeStyle('magnifier-cursor');
			return;
		}

		const speaking = readAloudServiceInstance.currentValue !== DEFAULT_VALUE;
		const cursor = speaking ? MAGNIFIER_CURSOR_VOCALIZE : MAGNIFIER_CURSOR;

		stylesServiceInstance.setStyle('magnifier-cursor', `
			html, body, body * {
				cursor: url("${cursor}") 2 2, auto !important;
			}
		`);
	}

	/* Rectangle du mot pointe s'il y en a un, sinon de l'element focalise */
	anchorRect = (): DOMRect => {
		if (this.focusRange) {
			const rect = this.focusRange.getBoundingClientRect();

			if (rect.width && rect.height) {
				return rect;
			}

			this.focusRange = null;
		}

		return this.focusedElement.getBoundingClientRect();
	}

	/* La fenetre epouse l'objet : juste assez grande pour un mot, pleine largeur pour un long
	   texte ou un long lien, avec un peu plus de hauteur pour limiter le defilement. */
	applyFocusSize = (rect: DOMRect): void => {
		const maxWidth = window.innerWidth - 16;
		const maxHeight = Math.round(window.innerHeight * 0.5);
		const needed = Math.round(rect.width * this.level) + MAGNIFIER_FOCUS_PADDING;
		const neededHeight = Math.round(rect.height * this.level) + MAGNIFIER_FOCUS_PADDING;
		let width = Math.min(maxWidth, Math.max(MAGNIFIER_FOCUS_MIN_WIDTH, needed));
		let height = Math.min(maxHeight, Math.max(MAGNIFIER_FOCUS_MIN_HEIGHT, neededHeight));

		if (needed > maxWidth) {
			width = maxWidth;
			height = Math.min(maxHeight, Math.max(height, Math.round(rect.height * this.level * 1.8)));
		}

		this.viewport.style.width = `${width}px`;
		this.viewport.style.height = `${height}px`;
	}

	updateHints = (): void => {
		const show = this.type === MAGNIFIER_FOCUS && !this.pending && this.manualHints;

		[this.hintLeft, this.hintRight, this.hintTop, this.hintBottom].forEach((hint: HTMLElement) => {
			if (hint) {
				hint.style.display = show ? 'block' : 'none';
			}
		});
	}

	/* Butees de page : bande rouge epaisse quand la vue ne peut plus avancer de ce cote */
	updateEdges = (): void => {
		const scrollY = window.scrollY || document.documentElement.scrollTop;
		const scrollX = window.scrollX || document.documentElement.scrollLeft;
		const marginX = window.innerWidth * 0.12;
		const marginY = window.innerHeight * 0.12;
		const show = this.type === MAGNIFIER_SCREEN && !this.hidden;

		const state = {
			top: show && scrollY <= 0 && this.clientY <= marginY,
			bottom: show && (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 2) && this.clientY >= window.innerHeight - marginY,
			left: show && scrollX <= 0 && this.clientX <= marginX,
			right: show && (window.innerWidth + scrollX) >= (document.documentElement.scrollWidth - 2) && this.clientX >= window.innerWidth - marginX
		};

		Object.keys(state).forEach((side: string) => {
			if (this.edges[side]) {
				this.edges[side].style.display = (state as any)[side] ? 'block' : 'none';
			}
		});
	}

	/* Passage d'un type a l'autre : rappel des deplacements, 5 s au bout du curseur,
	   vocalise si Lire a haute voix est actif. */
	showTransitionHint = (previousType: string): void => {
		/* Aussi a l'allumage par le bouton multiclic, pas seulement molette et touches +/- */
		if (!this.bubble || previousType === this.type) {
			return;
		}

		const key = this.type === MAGNIFIER_FOCUS
			? 'magnifier_hint_focus'
			: (this.type === MAGNIFIER_SCREEN ? 'magnifier_hint_screen' : null);
		const text = key ? i18nServiceInstance.getMessage(key) : null;

		if (!text) {
			return;
		}

		this.bubble.innerText = text;
		this.bubble.style.display = 'block';
		this.bubble.style.left = `${Math.min(window.innerWidth - this.bubble.offsetWidth - 8, this.clientX + 18)}px`;
		this.bubble.style.top = `${Math.min(window.innerHeight - this.bubble.offsetHeight - 8, this.clientY + 18)}px`;

		clearTimeout(this.bubbleTimer);
		this.bubbleTimer = setTimeout(() => {
			if (this.bubble) {
				this.bubble.style.display = 'none';
			}
		}, MAGNIFIER_HINT_DELAY);

		readAloudServiceInstance.speakText(text);
	}

	showBadge = (): void => {
		if (!this.badge) {
			return;
		}

		this.badge.innerText = `×${this.level}`;
		this.badge.style.display = 'block';
		clearTimeout(this.badgeTimer);
		this.badgeTimer = setTimeout(() => {
			if (this.badge) {
				this.badge.style.display = 'none';
			}
		}, MAGNIFIER_BADGE_DELAY);
	}

	showControls = (): void => {
		if (!this.controls) {
			return;
		}

		(this.controls.querySelector(`.${PREFIX}magnifier-controls__level`) as HTMLElement).innerText = `×${this.level}`;
		this.controls.style.display = 'flex';
		clearTimeout(this.controlsTimer);
		this.controlsTimer = setTimeout(() => {
			if (this.controls) {
				this.controls.style.display = 'none';
			}
		}, MAGNIFIER_CONTROLS_DELAY);
	}

	/* ---------- Escamotage ---------- */

	hide = (): void => {
		if (this.hidden || !this.type) {
			return;
		}

		this.hidden = true;
		this.engaged = false;
		this.stopExploration();
		this.viewport.style.display = 'none';
		this.puck.style.display = 'block';
		this.movePuck();
	}

	show = (): void => {
		if (!this.hidden) {
			return;
		}

		this.hidden = false;
		this.puck.style.display = 'none';
		this.render();
	}

	movePuck = (): void => {
		if (!this.hidden) {
			return;
		}

		let left = this.clientX;
		let top = this.clientY;

		if (this.type === MAGNIFIER_FOCUS && this.focusedElement) {
			const rect = this.focusedElement.getBoundingClientRect();
			left = rect.left + (rect.width / 2);
			top = Math.max(20, rect.top - 20);
		}

		this.puck.style.left = `${Math.round(left - 18)}px`;
		this.puck.style.top = `${Math.round(top - 18)}px`;
	}

	/* ---------- Exploration du Focus-loupe ---------- */

	startExploration = (): void => {
		this.stopExploration();
		this.manualHints = false;

		if (this.type !== MAGNIFIER_FOCUS || !this.focusedElement || this.pending) {
			return;
		}

		const rect = this.anchorRect();
		const overflow = ((rect.width * this.level) - this.viewport.offsetWidth) / this.level;

		if (overflow <= 0) {
			this.exploreOffset = 0;
			this.manualHints = (rect.height * this.level) > this.viewport.offsetHeight;
			this.render();
			return;
		}

		const limit = overflow / 2;
		this.exploreOffset = -limit;
		this.explorePhase = 'wait';
		this.exploreStart = Date.now();
		this.render();

		this.exploreTimer = setInterval(() => {
			const elapsed = Date.now() - this.exploreStart;

			if (this.explorePhase === 'wait') {
				if (elapsed >= MAGNIFIER_EXPLORE_WAIT) {
					this.explorePhase = 'forward';
					this.exploreStart = Date.now();
				}
				return;
			}

			if (this.explorePhase === 'forward') {
				const progress = Math.min(1, elapsed / MAGNIFIER_EXPLORE_FORWARD);
				this.exploreOffset = -limit + (2 * limit * progress);

				if (progress >= 1) {
					this.explorePhase = 'back';
					this.exploreStart = Date.now();
				}
			} else if (this.explorePhase === 'back') {
				const progress = Math.min(1, elapsed / MAGNIFIER_EXPLORE_BACK);
				this.exploreOffset = limit - (2 * limit * progress);

				if (progress >= 1) {
					this.exploreOffset = -limit;
					this.manualHints = true;
					this.stopExploration();
				}
			}

			this.render();
		}, 40);
	}

	stopExploration = (): void => {
		clearInterval(this.exploreTimer);
		this.exploreTimer = null;
		this.explorePhase = '';
	}

	/* ---------- Interactions ---------- */

	setFocusedElement = (element: HTMLElement, range: Range = null): void => {
		/* Palette Confort+ ou focus sorti de la page : on efface, au lieu de laisser la vue sur
		   l'element precedent pendant que la tabulation repart en haut de page. */
		if (!element || element === document.body || this.root?.contains(element)
			|| element.tagName?.toLowerCase() === APP_NAME || element.closest?.(APP_NAME)) {
			this.clearFocus();
			return;
		}

		this.focusedElement = element;
		this.focusRange = range;
		this.exploreOffset = 0;
		this.exploreOffsetY = 0;
		this.show();

		/* La mise en page bouge avec le focus (liens d'evitement de lemonde.fr qui apparaissent
		   puis disparaissent) : la copie est reprise avant de calculer la vue. */
		if (this.type === MAGNIFIER_FOCUS && !this.pending) {
			this.cloneContent();
		}

		this.render();

		if (!this.pending) {
			this.startExploration();
		}
	}

	clearFocus = (): void => {
		this.focusedElement = null;
		this.focusRange = null;
		this.stopExploration();

		if (this.focusBadge) {
			this.focusBadge.style.display = 'none';
		}

		if (this.viewport) {
			this.viewport.style.display = 'none';
		}
	}

	/* Mot situe sous le pointeur, pour que le Focus-loupe commence a ce mot */
	wordRangeAtPoint = (x: number, y: number): Range => {
		let node: Node = null;
		let offset = 0;

		try {
			const caretPosition = (document as any).caretPositionFromPoint
				? (document as any).caretPositionFromPoint(x, y)
				: null;

			if (caretPosition) {
				node = caretPosition.offsetNode;
				offset = caretPosition.offset;
			} else if ((document as any).caretRangeFromPoint) {
				const caretRange = (document as any).caretRangeFromPoint(x, y);
				node = caretRange?.startContainer;
				offset = caretRange?.startOffset ?? 0;
			}
		} catch (error) {
			return null;
		}

		if (!node || node.nodeType !== Node.TEXT_NODE) {
			return null;
		}

		const text = node.textContent || '';
		let start = Math.min(offset, text.length);
		let end = start;

		while (start > 0 && !/\s/.test(text[start - 1])) {
			start--;
		}
		while (end < text.length && !/\s/.test(text[end])) {
			end++;
		}

		if (start === end) {
			return null;
		}

		const range = document.createRange();
		range.setStart(node, start);
		range.setEnd(node, end);

		return range;
	}

	/* Cible du Focus-loupe pour un pointage souris : l'objet activable, sinon le mot pointe */
	/* Palette Confort+ et boutons de navigation : la loupe ne s'y pose pas, un clic sur Precedent
	   ou Suivant ne doit pas deplacer la loupe sous la souris. */
	isOwnUi = (target: HTMLElement): boolean => {
		return !!this.root?.contains(target)
			|| target.tagName?.toLowerCase() === APP_NAME
			|| !!target.closest?.(APP_NAME)
			|| !!target.closest?.(`#${CONTAINER_BUTTONS_ID}`);
	}

	focusFromPoint = (target: HTMLElement, x: number, y: number): void => {
		const actionable = target.closest(MAGNIFIER_ACTIONABLE_SELECTOR) as HTMLElement;

		if (actionable) {
			this.setFocusedElement(actionable);
			return;
		}

		this.setFocusedElement(target, this.wordRangeAtPoint(x, y));
	}

	moveFocal = (deltaX: number, deltaY: number): void => {
		this.clientX = Math.max(0, Math.min(window.innerWidth, this.clientX + deltaX));
		this.clientY = Math.max(0, Math.min(window.innerHeight, this.clientY + deltaY));
		this.scrollAtEdges();
		this.render();
	}

	/* La page défile quand on atteint un bord de l'écran */
	scrollAtEdges = (): void => {
		const marginX = window.innerWidth * 0.1;
		const marginY = window.innerHeight * 0.1;
		let scrollX = 0;
		let scrollY = 0;

		if (this.clientX <= marginX) {
			scrollX = -MAGNIFIER_KEYBOARD_STEP;
		} else if (this.clientX >= window.innerWidth - marginX) {
			scrollX = MAGNIFIER_KEYBOARD_STEP;
		}

		if (this.clientY <= marginY) {
			scrollY = -MAGNIFIER_KEYBOARD_STEP;
		} else if (this.clientY >= window.innerHeight - marginY) {
			scrollY = MAGNIFIER_KEYBOARD_STEP;
		}

		if (scrollX || scrollY) {
			window.scrollBy(scrollX, scrollY);
		}
	}

	activateFocalElement = (): void => {
		const target = document.elementFromPoint(this.clientX, this.clientY) as HTMLElement;

		if (target && !this.root?.contains(target)) {
			target.focus?.();
			target.click?.();
		}
	}

	/* Comme pour la vocalisation : le 1er clic pose la loupe, le 2e active l'element vise */
	armClick = (event: MouseEvent): void => {
		const target = event.target as HTMLElement;

		if (!this.type || !target || this.isOwnUi(target)) {
			return;
		}

		/* Etat pending : le clic pose la loupe sur l'element vise, sans l'activer */
		if (this.pending) {
			event.preventDefault();
			event.stopPropagation();
			this.focusFromPoint(target, event.clientX, event.clientY);
			this.focusedElement?.focus?.();
			this.enterZoomed();
			return;
		}

		const actionable = target.closest(MAGNIFIER_ACTIONABLE_SELECTOR) as HTMLElement;

		/* Focus-loupe deja zoome : un clic sur un autre objet le pose d'abord dans la loupe ;
		   seul un clic sur l'objet deja zoome l'active. */
		if (this.type === MAGNIFIER_FOCUS && !this.hidden) {
			const current = this.focusedElement;
			const sameTarget = !!current && (current === (actionable || target) || current.contains(target));

			if (!sameTarget) {
				event.preventDefault();
				event.stopPropagation();
				this.focusFromPoint(target, event.clientX, event.clientY);
				this.focusedElement?.focus?.();
				this.enterZoomed();
				return;
			}

			this.cloneContentSoon();
			return;
		}

		if (!actionable) {
			return;
		}

		const now = Date.now();

		/* Une fois la loupe posee, un simple clic active l'objet vise : la copie est reprise
		   aussitot pour agrandir ce qui vient de se derouler (menu, liste, accordeon). */
		if (this.engaged && !this.hidden) {
			this.cloneContentSoon();
			return;
		}

		if (this.armedElement === actionable && (now - this.armedAt) < MAGNIFIER_ARM_DELAY) {
			this.armedElement = null;
			this.engaged = true;
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.armedElement = actionable;
		this.armedAt = now;
		this.engaged = true;
		this.show();

		if (this.type === MAGNIFIER_FOCUS) {
			this.setFocusedElement(actionable);
		} else {
			this.render();
		}
	}

	/* Le focus clavier reprend l'element entier, pas un mot */
	focusFromKeyboard = (element: HTMLElement): void => {
		this.setFocusedElement(element);
		this.updateFocusBadge();
	}

	isEditable = (element: HTMLElement): boolean => {
		const tag = element?.tagName?.toLowerCase();
		return tag === 'input' || tag === 'textarea' || tag === 'select' || element?.isContentEditable;
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'pointermove':
					if (this.isOwnUi(event.target as HTMLElement)) {
						return;
					}
					this.clientX = event.clientX;
					this.clientY = event.clientY;
					if (this.hidden) {
						this.movePuck();
						return;
					}
					if (this.type === MAGNIFIER_SCREEN) {
						this.scrollAtEdges();
					}
					if (this.type !== MAGNIFIER_FOCUS) {
						this.render();
					}
					break;

				case 'pointerdown':
					if (this.isOwnUi(event.target as HTMLElement)) {
						return;
					}
					this.clientX = event.clientX;
					this.clientY = event.clientY;
					if (this.pending) {
						return;
					}
					if (this.hidden) {
						this.show();
						return;
					}
					if (this.type === MAGNIFIER_FOCUS) {
						this.focusFromPoint(event.target as HTMLElement, event.clientX, event.clientY);
					} else {
						this.render();
					}
					if (this.isTouch()) {
						this.showControls();
					}
					break;

				case 'focusin':
					if (this.type === MAGNIFIER_FOCUS && (this.pending || !this.isTouch())) {
						this.focusFromKeyboard(event.target as HTMLElement);
					}
					break;

				case 'focusout':
					if (this.type === MAGNIFIER_FOCUS) {
						setTimeout(() => {
							const active = document.activeElement as HTMLElement;

							if (!active || active === document.body) {
								this.clearFocus();
							}
						}, 0);
					}
					break;

				case 'keydown':
					this.keyHandler(event);
					break;

				case 'wheel':
					if (event.ctrlKey) {
						event.preventDefault();
						this.step(event.deltaY < 0 ? 1 : -1);
					}
					break;

				case 'contextmenu':
					if (!this.root?.contains(event.target)) {
						if (this.type === MAGNIFIER_FOCUS && !this.pending) {
							event.preventDefault();
							this.enterPending();
							return;
						}

						if (this.pending) {
							return;
						}

						event.preventDefault();
						this.hidden ? this.show() : this.hide();
					}
					break;

				case 'scroll':
					if (!this.hidden) {
						this.render();
						this.cloneContentQueued();
					}
					break;

				case 'resize':
					this.applyType();
					this.cloneContentQueued();
					break;

				case 'click':
					if (event.currentTarget?.dataset?.step) {
						event.preventDefault();
						this.step(Number(event.currentTarget.dataset.step));
					} else {
						this.armClick(event);
					}
					break;
			}
		}
	}

	private keyHandler = (event: KeyboardEvent): void => {
		const target = event.target as HTMLElement;

		if (event.key === 'Tab' && this.type === MAGNIFIER_FOCUS && !this.pending) {
			/* La tabulation reprend la main : retour en attente et l'enchainement de la page,
			   puis des menus du navigateur, n'est plus bloque sur le dernier element. */
			this.enterPending();
			return;
		}

		if (event.key === 'Escape' || event.key === 'GoBack' || event.key === 'BrowserBack') {
			/* En pending, Echap. doit rester a la page (fermeture des menus deroulants) */
			if (this.pending) {
				return;
			}

			if (this.type === MAGNIFIER_FOCUS) {
				this.enterPending();
				return;
			}

			this.hidden ? this.show() : this.hide();
			return;
		}

		if (event.key === 'Enter' && this.pending && this.type === MAGNIFIER_FOCUS) {
			event.preventDefault();
			event.stopPropagation();
			this.setFocusedElement(document.activeElement as HTMLElement);
			this.enterZoomed();
			return;
		}

		if (this.isEditable(target) || this.root?.contains(target)) {
			return;
		}

		switch (event.key) {
			case '+':
			case '=':
				event.preventDefault();
				this.step(1);
				break;
			case '-':
				event.preventDefault();
				this.step(-1);
				break;
			case 'Enter':
				if (this.hidden) {
					event.preventDefault();
					this.show();
					this.activateFocalElement();
				} else if (this.type === MAGNIFIER_SCREEN) {
					event.preventDefault();
					this.activateFocalElement();
				}
				break;
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown': {
				const step = event.ctrlKey ? MAGNIFIER_KEYBOARD_FINE_STEP : MAGNIFIER_KEYBOARD_STEP;

				if (this.type === MAGNIFIER_FOCUS && this.focusedElement) {
					event.preventDefault();
					this.stopExploration();
					this.manualHints = true;

					if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
						this.exploreOffset += (event.key === 'ArrowRight' ? step : -step) / this.level;
					} else {
						this.exploreOffsetY += (event.key === 'ArrowDown' ? step : -step) / this.level;
					}

					this.render();
					return;
				}

				event.preventDefault();
				this.moveFocal(
					event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
					event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
				);
				break;
			}
		}
	}

	private style = (): string => `
		#${MAGNIFIER_ROOT_ID},
		#${MAGNIFIER_ROOT_ID} * {
			pointer-events: none;
		}

		#${MAGNIFIER_ROOT_ID} {
			display: block;
			position: fixed;
			inset: 0;
			width: 100vw;
			height: 100vh;
			max-width: none;
			max-height: none;
			margin: 0;
			padding: 0;
			border: 0;
			background: transparent;
			color: inherit;
			overflow: visible;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-viewport {
			position: fixed;
			display: none;
			overflow: hidden;
			background-color: white;
			border: 2px solid black;
			box-shadow: 0 0 16px 6px rgba(0, 0, 0, 0.25);
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID}[data-type="${MAGNIFIER_SCREEN}"] .${PREFIX}magnifier-viewport {
			border-width: 0;
			box-shadow: none;
			left: 0;
			top: 0;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-content {
			position: absolute;
			top: 0;
			left: 0;
			overflow: visible;
			transform-origin: left top;
			user-select: none;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint {
			position: absolute;
			display: none;
			top: 50%;
			width: 0;
			height: 0;
			margin-top: -10px;
			border-top: 10px solid transparent;
			border-bottom: 10px solid transparent;
			filter: drop-shadow(0 0 2px white);
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--left {
			left: 4px;
			border-right: 14px solid black;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--right {
			right: 4px;
			border-left: 14px solid black;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--top,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--bottom {
			left: 50%;
			top: auto;
			margin-top: 0;
			margin-left: -10px;
			border-top: 0;
			border-bottom: 0;
			border-left: 10px solid transparent;
			border-right: 10px solid transparent;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--top {
			top: 4px;
			border-bottom: 14px solid black;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-hint--bottom {
			bottom: 4px;
			border-top: 14px solid black;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge {
			position: fixed;
			display: none;
			background-color: #d00;
			box-shadow: 0 0 0 1px white;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--top,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--bottom {
			left: 0;
			width: 100vw;
			height: ${MAGNIFIER_EDGE_SIZE}px;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--left,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--right {
			top: 0;
			height: 100vh;
			width: ${MAGNIFIER_EDGE_SIZE}px;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--top { top: 0; }
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--bottom { bottom: 0; }
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--left { left: 0; }
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-edge--right { right: 0; }

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-badge {
			position: fixed;
			display: none;
			right: 1rem;
			top: 1rem;
			padding: 0.25rem 0.75rem;
			border-radius: 999px;
			background-color: black;
			color: white;
			font: bold 1.25rem/1.4 sans-serif;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge {
			position: fixed;
			display: none;
			box-sizing: border-box;
			border: 4px solid black;
			border-radius: 0.75rem;
			box-shadow: 0 0 0 3px white, inset 0 0 0 3px white;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__magnify,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__vocalize {
			position: absolute;
			top: -${MAGNIFIER_BADGE_HEIGHT + 4}px;
			width: ${MAGNIFIER_BADGE_WIDTH}px;
			height: ${MAGNIFIER_BADGE_HEIGHT}px;
			background-repeat: no-repeat;
			background-position: center;
			background-size: contain;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__magnify {
			right: -4px;
			background-image: url("${MAGNIFIER_BADGE_MAGNIFY}");
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge[data-inside="true"] .${PREFIX}magnifier-focus-badge__magnify,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge[data-inside="true"] .${PREFIX}magnifier-focus-badge__vocalize {
			top: 2px;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge__vocalize {
			display: none;
			left: -4px;
			background-image: url("${MAGNIFIER_BADGE_VOCALIZE}");
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-focus-badge[data-vocalize="true"] .${PREFIX}magnifier-focus-badge__vocalize {
			display: block;
		}

		#${MAGNIFIER_ROOT_ID}[data-dark="true"] .${PREFIX}magnifier-focus-badge {
			border-color: white;
			box-shadow: 0 0 0 3px black, inset 0 0 0 3px black;
		}

		#${MAGNIFIER_ROOT_ID}[data-dark="true"] .${PREFIX}magnifier-viewport {
			border-color: white;
			box-shadow: 0 0 0 3px black, 0 0 16px 6px rgba(0, 0, 0, 0.45);
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-bubble {
			position: fixed;
			display: none;
			max-width: 22rem;
			padding: 0.5rem 0.75rem;
			border-radius: 0.5rem;
			background-color: rgba(0, 0, 0, 0.9);
			box-shadow: 0 0 0 2px white;
			color: white;
			font: 1rem/1.4 sans-serif;
			white-space: pre-line;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-puck {
			position: fixed;
			display: none;
			width: 36px;
			height: 36px;
			border: 3px solid black;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.9);
			box-shadow: 0 0 0 2px white;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-puck::after {
			content: '';
			position: absolute;
			left: 24px;
			top: 24px;
			width: 14px;
			height: 3px;
			background-color: black;
			transform: rotate(45deg);
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-controls {
			position: fixed;
			display: none;
			left: 50%;
			bottom: 1.5rem;
			transform: translateX(-50%);
			align-items: center;
			gap: 0.75rem;
			padding: 0.5rem 0.75rem;
			border-radius: 999px;
			background-color: rgba(0, 0, 0, 0.9);
			box-shadow: 0 0 0 2px white;
			z-index: 2147483646;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-controls,
		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-controls * {
			pointer-events: auto;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-controls__btn {
			width: 48px;
			height: 48px;
			border: 2px solid white;
			border-radius: 50%;
			background-color: black;
			color: white;
			font: bold 1.5rem/1 sans-serif;
			cursor: pointer;
		}

		#${MAGNIFIER_ROOT_ID} .${PREFIX}magnifier-controls__level {
			min-width: 3ch;
			color: white;
			text-align: center;
			font: bold 1.25rem/1 sans-serif;
		}
	`;
}
