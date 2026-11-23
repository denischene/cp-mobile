let colorContrastServiceIsInstantiated: boolean;

interface ColourThemeValues {
	name: string;
	cursor: string;
	focus: string;
	scroll: string;
	link: string;
};

interface ReinforcedElement {
	element: HTMLElement;
	color: string;
	priority: string;
};

class ColorContrastService {
	reinforcedElements: ReinforcedElement[] = [];
	observer: MutationObserver = null;
	observerTimer: any = null;
	pendingElements: Set<HTMLElement> = new Set();
	adaptiveLinks: HTMLElement[] = [];
	adaptiveLinksActive = false;
	linkPalette: string[] = [];
	paletteCache: Map<string, string[]> = new Map();
	currentValue: string = DEFAULT_VALUE;
	applyToken = 0;

	colorContrastDictionnary: ColourThemeValues[] = [
		{ name: DEFAULT_VALUE, cursor: DEFAULT_VALUE, focus: DEFAULT_VALUE, scroll: DEFAULT_VALUE, link: DEFAULT_VALUE },
		{ name: 'reinforcedContrasts', cursor: 'bigCursor_black', focus: 'big_black', scroll: 'big_black', link: 'darkblue_orange_brown' },
		{ name: 'ivory_black', cursor: 'bigCursor_ivory', focus: 'big_ivory', scroll: 'big_ivory', link: 'lightblue_orange_lightgreen' },
		{ name: 'black_ivory', cursor: 'bigCursor_black', focus: 'big_black', scroll: 'big_black', link: 'darkblue_orange_brown' },
		{ name: 'white_red', cursor: 'bigCursor_white', focus: 'big_white', scroll: 'big_white', link: 'yellow_darkblue_lightgreen' },
		{ name: 'black_yellow', cursor: 'bigCursor_black', focus: 'big_black', scroll: 'big_black', link: 'darkblue_purple_darkgreen' },
		{ name: 'white_blue', cursor: 'bigCursor_white', focus: 'big_white', scroll: 'big_white', link: 'yellow_orange_lightgreen' },
		{ name: 'yellow_blue', cursor: 'bigCursor_yellow', focus: 'big_yellow', scroll: 'big_yellow', link: 'white_darkgreen_lightgreen' },
		{ name: 'black_green', cursor: 'bigCursor_black', focus: 'big_black', scroll: 'big_black', link: 'yellow_orange_blue' }
	];

	/* Daltonism type deuteranomaly */
	matrixFilter = `
		0.8,   0.2,   0,     0, 0
    0.258, 0.742, 0,     0, 0
    0,     0.142, 0.858, 0, 0
    0,     0,     0,     1, 0`;

	svgFilterDaltonism = `<svg xmlns="http://www.w3.org/2000/svg"><filter id="daltonism"><feColorMatrix in="SourceGraphic" type="matrix" values="${this.matrixFilter.replace(/\s+/g, ' ').trim()}"/></filter></svg>`;

	styleFilterDaltonism = `
		html body > *:not(${APP_NAME}) {
			filter: url('data:image/svg+xml;utf8,${this.svgFilterDaltonism}#daltonism');
		}
	`;

	constructor() {
		if (colorContrastServiceIsInstantiated) {
			throw new Error('ColorContrastService is already instantiated.');
		}

		colorContrastServiceIsInstantiated = true;
	}

	setColorsContrasts = (value: string): void => {
		/* Re-scanning the whole page for nothing froze the browser on mobile
		   while browsing the settings pages. */
		if (value === this.currentValue && value === 'reinforcedContrasts' && this.reinforcedElements.length > 0) {
			return;
		}

		this.currentValue = value;
		stylesServiceInstance.removeStyle('color-contrast');
		stylesServiceInstance.removeStyle('filter-daltonism');
		this.resetReinforcedContrasts();
		this.setServices(DEFAULT_VALUE);

		switch (value) {
			case DEFAULT_VALUE:
				break;
			case 'daltonism':
				stylesServiceInstance.setStyle('filter-daltonism', this.styleFilterDaltonism);
				break;
			case 'reinforcedContrasts':
				/* Only the texts whose contrast is too low are darkened / lightened,
				   page background colours are left untouched. */
				this.setServices('reinforcedContrasts');
				this.applyReinforcedContrasts();
				break;
			default:
				const color = value?.split('_')[0];
				const backgroundColor = value?.split('_')[1];
				this.setServices(`${color}_${backgroundColor}`);
				this.setColorContrastStyle(color, backgroundColor);
				break;
		}

		this.refreshAdaptiveLinks();
	}

	applyReinforcedContrasts = (): void => {
		this.reinforceTextColors();
		this.observeDynamicContent();
	}

	/* Link colours follow the background each link actually sits on: the chosen
	   palette is darkened for a light background and lightened for a dark one, so
	   a dark banner inside a light page (and the opposite) stays readable. */
	refreshAdaptiveLinks = (): void => {
		const palette = this.getLinkPalette();

		if (!palette) {
			this.resetAdaptiveLinks();
			return;
		}

		this.resetAdaptiveLinks();
		this.adaptiveLinksActive = true;
		this.linkPalette = palette;
		this.paletteCache.clear();
		stylesServiceInstance.setStyle('adaptive-links', this.buildAdaptiveLinksStyle());

		/* Colour transitions would be measured mid-way and the computed colours
		   would stay wrong: they are frozen while the backgrounds are read. */
		stylesServiceInstance.setStyle('no-transition', '*, *::before, *::after { transition: none !important; }');
		document.querySelectorAll('a[href]').forEach((link: Element) => this.applyAdaptiveLinkColor(link as HTMLElement));
		stylesServiceInstance.removeStyle('no-transition');

		this.observeDynamicContent();
	}

	private getLinkPalette = (): string[] | null => {
		const chosen = linkStyleServiceInstance?.currentValue;

		if (chosen && chosen !== DEFAULT_VALUE) {
			return chosen.split('_');
		}

		if (this.currentValue === 'reinforcedContrasts') {
			return ['darkblue', 'orange', 'brown'];
		}

		return null;
	}

	/* Each link carries its own colours (computed against its real background)
	   through custom properties: the :link, :visited and :hover states can then
	   all be adapted, which a global stylesheet could not do. */
	private buildAdaptiveLinksStyle = (): string => {
		return `
			a.${PREFIX}link-adaptive:link { color: var(--${PREFIX}link-color) !important; }
			a.${PREFIX}link-adaptive:visited { color: var(--${PREFIX}link-visited-color) !important; }
			a.${PREFIX}link-adaptive:hover,
			a.${PREFIX}link-adaptive:focus,
			a.${PREFIX}link-adaptive:active { color: var(--${PREFIX}link-pointed-color) !important; }
		`;
	}

	private getAdaptedPalette = (palette: string[], background: number[]): string[] => {
		const key = background.map((channel: number) => Math.round(channel)).join(',');

		if (!this.paletteCache.has(key)) {
			/* Pages often darken (or lighten) the background of a link while it is
			   hovered: the pointed colour is adapted against that shifted
			   background so it stays readable. */
			const hoverBackground = this.shiftBackground(background);

			this.paletteCache.set(key, [
				this.adjustColorForBackground(palette[0], background),
				this.adjustColorForBackground(palette[1], hoverBackground),
				this.adjustColorForBackground(palette[2], background)
			]);
		}

		return this.paletteCache.get(key);
	}

	private shiftBackground = (background: number[]): number[] => {
		const isDark = this.isDarkBackground(background);
		const factor = isDark ? 1.2 : 0.82;
		const shifted = background.map((channel: number) => Math.min(255, Math.max(0, channel * factor)));

		/* The shift must never cross the light / dark boundary (a mid tone such as
		   green would then be adapted in the wrong direction). */
		return this.isDarkBackground(shifted) === isDark ? shifted : background;
	}

	private adjustColorForBackground = (cssColor: string, background: number[]): string => {
		if (!cssColor || cssColor === DEFAULT_VALUE) {
			return '';
		}

		const rgb = this.resolveCssColor(cssColor);

		if (!rgb) {
			return cssColor;
		}

		if (this.contrastRatio(rgb, background) >= READ_ALOUD_MIN_CONTRAST) {
			return cssColor;
		}

		return this.reinforceColor(rgb, background);
	}

	/* A background is "dark" when white text contrasts better than black text on
	   it; a plain luminance threshold misclassified mid-tones such as orange. */
	private isDarkBackground = (bgColor: number[]): boolean => {
		return this.contrastRatio([255, 255, 255], bgColor) > this.contrastRatio([0, 0, 0], bgColor);
	}

	/* Semi-transparent backgrounds (banners, overlays) are composited with their
	   ancestors, otherwise a 10% orange over white was read as plain orange. */
	private getBlendedBackground = (element: HTMLElement): number[] | null => {
		const layers: { rgb: number[], alpha: number }[] = [];
		let current: HTMLElement = element;

		while (current) {
			const values = window.getComputedStyle(current).backgroundColor?.match(/[\d.]+/g);

			if (values && values.length >= 3) {
				const alpha = values.length > 3 ? parseFloat(values[3]) : 1;

				if (alpha > 0) {
					layers.push({
						rgb: [parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2])],
						alpha: alpha
					});

					if (alpha >= 1) {
						break;
					}
				}
			}

			current = current.parentElement;
		}

		let result = [255, 255, 255];

		if (layers.length > 0 && layers[layers.length - 1].alpha >= 1) {
			result = layers.pop().rgb;
		}

		for (let index = layers.length - 1; index >= 0; index--) {
			const layer = layers[index];
			result = result.map((channel: number, position: number) =>
				(layer.rgb[position] * layer.alpha) + (channel * (1 - layer.alpha)));
		}

		return result;
	}

	/* Background imposed by the current text/background theme, if any */
	private getThemeBackground = (): number[] | null => {
		const parts = this.currentValue?.split('_');

		if (!parts || parts.length < 2) {
			return null;
		}

		return this.resolveCssColor(parts[1]);
	}

	private resolveCssColor = (cssColor: string): number[] | null => {
		const probe = document.createElement('span');
		/* !important: the colour / contrast themes also use !important, they would
		   otherwise repaint the probe and we would resolve the theme text colour
		   instead of the link colour. */
		probe.style.setProperty('color', cssColor, 'important');
		probe.style.display = 'none';
		document.body.appendChild(probe);
		const resolved = window.getComputedStyle(probe).color;
		probe.remove();

		return this.parseColor(resolved);
	}

	private applyAdaptiveLinkColor = (link: HTMLElement): void => {
		if (!this.adaptiveLinksActive || link.closest(APP_NAME)) {
			return;
		}

		const bgColor = this.getBlendedBackground(link);

		if (!bgColor) {
			return;
		}

		const isDarkBackground = this.isDarkBackground(bgColor);
		const [linkColor, pointedColor, visitedColor] = this.getAdaptedPalette(this.linkPalette, bgColor);

		link.classList.remove(`${PREFIX}link-on-light`, `${PREFIX}link-on-dark`);
		link.classList.add(isDarkBackground ? `${PREFIX}link-on-dark` : `${PREFIX}link-on-light`);
		link.classList.add(`${PREFIX}link-adaptive`);

		if (linkColor) {
			link.style.setProperty(`--${PREFIX}link-color`, linkColor);
		}
		if (pointedColor) {
			link.style.setProperty(`--${PREFIX}link-pointed-color`, pointedColor);
		}
		if (visitedColor) {
			link.style.setProperty(`--${PREFIX}link-visited-color`, visitedColor);
		}

		this.adaptiveLinks.push(link);
	}

	private resetAdaptiveLinks = (): void => {
		this.adaptiveLinksActive = false;
		stylesServiceInstance.removeStyle('adaptive-links');

		this.adaptiveLinks.forEach((link: HTMLElement) => {
			link.classList.remove(`${PREFIX}link-on-light`, `${PREFIX}link-on-dark`, `${PREFIX}link-adaptive`);
			link.style.removeProperty(`--${PREFIX}link-color`);
			link.style.removeProperty(`--${PREFIX}link-pointed-color`);
			link.style.removeProperty(`--${PREFIX}link-visited-color`);
		});
		this.adaptiveLinks = [];
	}

	/* Only the texts whose contrast with their own background is too low are
	   corrected: greys become black or white, any other colour keeps its hue and
	   is only darkened / lightened until it becomes readable. */
	private reinforceTextColors = (root: HTMLElement = document.body): void => {
		const elements = [root, ...Array.from(root.querySelectorAll(`*:not(${APP_NAME},${BODY_ELEMENTS_FILTER})`))];

		/* Processed by small batches: scanning a whole news page in one go froze
		   the browser (and killed the tab on mobile). */
		this.applyToken++;
		const token = this.applyToken;
		const size = 150;
		let index = 0;

		const run = () => {
			if (token !== this.applyToken) {
				return;
			}

			const end = Math.min(index + size, elements.length);

			for (; index < end; index++) {
				this.reinforceElement(elements[index] as HTMLElement);
			}

			if (index < elements.length) {
				setTimeout(run, 0);
			}
		};

		run();
	}

	private reinforceElement = (htmlElement: HTMLElement): void => {
		if (!htmlElement?.dataset
			|| htmlElement.dataset.cplusContrast
			|| htmlElement.closest(APP_NAME)) {
			return;
		}

		/* A link keeps a link colour, adapted to its own background */
		if (htmlElement.matches('a[href]')) {
			htmlElement.dataset.cplusContrast = 'link';
			this.applyAdaptiveLinkColor(htmlElement);
			return;
		}

		if (this.currentValue !== 'reinforcedContrasts' || !this.hasOwnText(htmlElement)) {
			return;
		}

		const textColor = this.parseColor(window.getComputedStyle(htmlElement).color);
		const bgColor = this.getBlendedBackground(htmlElement);

		/* Marked either way: an already checked element is never computed again,
		   which keeps the dynamic content observer cheap. */
		htmlElement.dataset.cplusContrast = 'checked';

		if (!textColor || !bgColor) {
			return;
		}

		if (this.contrastRatio(textColor, bgColor) >= READ_ALOUD_MIN_CONTRAST) {
			return;
		}

		this.reinforcedElements.push({
			element: htmlElement,
			color: htmlElement.style.getPropertyValue('color'),
			priority: htmlElement.style.getPropertyPriority('color')
		});

		htmlElement.dataset.cplusContrast = 'reinforced';
		htmlElement.style.setProperty('color', this.reinforceColor(textColor, bgColor), 'important');
	}

	/* Dynamically loaded texts (infinite scroll, SPA, lazy loading) must be
	   corrected too, without recomputing the elements already handled. */
	private observeDynamicContent = (): void => {
		if (this.observer) {
			return;
		}

		this.observer = new MutationObserver((records: MutationRecord[]) => {
			records.forEach((record: MutationRecord) => {
				record.addedNodes.forEach((node: Node) => {
					const element = (node.nodeType === Node.ELEMENT_NODE
						? node
						: node.parentElement) as HTMLElement;

					if (!element || element.closest?.(APP_NAME) || element.dataset?.cplusContrast) {
						return;
					}

					this.pendingElements.add(element);
				});
			});

			if (this.pendingElements.size === 0) {
				return;
			}

			clearTimeout(this.observerTimer);
			this.observerTimer = setTimeout(this.processPendingElements, 800);
		});

		this.observer.observe(document.body, { childList: true, subtree: true });
	}

	/* Only the newly inserted subtrees are analysed, never the whole page again */
	private processPendingElements = (): void => {
		const elements = Array.from(this.pendingElements).slice(0, 200);
		this.pendingElements.clear();

		elements.forEach((element: HTMLElement) => {
			if (element.isConnected) {
				this.reinforceElement(element);
				element.querySelectorAll(`*:not(${APP_NAME},${BODY_ELEMENTS_FILTER})`)
					.forEach((child: Element) => this.reinforceElement(child as HTMLElement));
			}
		});
	}

	resetReinforcedContrasts = (): void => {
		this.applyToken++;

		if (!this.adaptiveLinksActive) {
			this.observer?.disconnect();
			this.observer = null;
		}
		clearTimeout(this.observerTimer);
		this.pendingElements.clear();

		this.reinforcedElements.forEach((saved: ReinforcedElement) => {
			if (saved.color) {
				saved.element.style.setProperty('color', saved.color, saved.priority);
			} else {
				saved.element.style.removeProperty('color');
			}
		});
		this.reinforcedElements = [];

		document.querySelectorAll('[data-cplus-contrast]').forEach((element: Element) => {
			delete (element as HTMLElement).dataset.cplusContrast;
		});
	}

	/* Keeps the original hue when the colour is not a grey */
	private reinforceColor = (textColor: number[], bgColor: number[]): string => {
		const darken = !this.isDarkBackground(bgColor);
		const fallback = darken ? '#000000' : '#ffffff';
		const [hue, saturation, lightness] = this.rgbToHsl(textColor);

		if (saturation < 0.12) {
			return fallback;
		}

		for (let step = 1; step <= 20; step++) {
			const newLightness = darken
				? Math.max(0, lightness - (step * 0.05))
				: Math.min(1, lightness + (step * 0.05));
			const candidate = this.hslToRgb(hue, saturation, newLightness);

			if (this.contrastRatio(candidate, bgColor) >= READ_ALOUD_MIN_CONTRAST) {
				return `rgb(${candidate.map((channel: number) => Math.round(channel)).join(', ')})`;
			}
		}

		return fallback;
	}

	private rgbToHsl = (rgb: number[]): number[] => {
		const [r, g, b] = rgb.map((channel: number) => channel / 255);
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const lightness = (max + min) / 2;
		let hue = 0;
		let saturation = 0;

		if (max !== min) {
			const delta = max - min;
			saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

			switch (max) {
				case r:
					hue = ((g - b) / delta) + (g < b ? 6 : 0);
					break;
				case g:
					hue = ((b - r) / delta) + 2;
					break;
				default:
					hue = ((r - g) / delta) + 4;
					break;
			}

			hue /= 6;
		}

		return [hue, saturation, lightness];
	}

	private hslToRgb = (hue: number, saturation: number, lightness: number): number[] => {
		if (saturation === 0) {
			const value = lightness * 255;
			return [value, value, value];
		}

		const hueToRgb = (p: number, q: number, t: number): number => {
			let temp = t;
			if (temp < 0) temp += 1;
			if (temp > 1) temp -= 1;
			if (temp < 1 / 6) return p + ((q - p) * 6 * temp);
			if (temp < 1 / 2) return q;
			if (temp < 2 / 3) return p + ((q - p) * ((2 / 3) - temp) * 6);
			return p;
		};

		const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - (lightness * saturation);
		const p = (2 * lightness) - q;

		return [
			hueToRgb(p, q, hue + (1 / 3)) * 255,
			hueToRgb(p, q, hue) * 255,
			hueToRgb(p, q, hue - (1 / 3)) * 255
		];
	}

	private hasOwnText = (element: HTMLElement): boolean => {
		return Array.from(element.childNodes).some(
			(node: Node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ''
		);
	}

	private parseColor = (value: string): number[] | null => {
		const rgb = value?.match(/[\d.]+/g);

		if (!rgb || rgb.length < 3) {
			return null;
		}

		if (rgb.length > 3 && parseFloat(rgb[3]) === 0) {
			return null;
		}

		return [parseFloat(rgb[0]), parseFloat(rgb[1]), parseFloat(rgb[2])];
	}

	private relativeLuminance = (rgb: number[]): number => {
		const [r, g, b] = rgb.map((channel: number) => {
			const value = channel / 255;
			return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
		});

		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	private contrastRatio = (color: number[], background: number[]): number => {
		const l1 = this.relativeLuminance(color);
		const l2 = this.relativeLuminance(background);

		return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
	}

	setColorContrastStyle = (color: string, backgroundColor: string): void => {
		let styleColorContrast = `
			*:not(.${PREFIX}container-buttons) {
				color: ${color} !important;
				background-color: ${backgroundColor} !important;
			}

			fieldset,
			button {
				border-color: ${color} !important;
			}

			input, td, th {
				border: 2px solid ${color} !important;
			}

			td, th {
				padding: .2em !important;
			}

			table {
				border-collapse: collapse !important;
			}
		`;
		stylesServiceInstance.setStyle('color-contrast', styleColorContrast);
	}

	setServices = (value: string): void => {
		const colorParams = this.colorContrastDictionnary.find((o: ColourThemeValues) => o.name === value);

		cursorAspectServiceInstance.setCursor(colorParams?.cursor);
		focusAspectServiceInstance.setFocus(colorParams?.focus);
		scrollAspectServiceInstance.setScrollAspect(colorParams?.scroll);
		linkStyleServiceInstance.setLinkStyle(colorParams?.link);
	}
}
