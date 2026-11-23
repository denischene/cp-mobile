let readingGuideServiceIsInstantiated: boolean;

class ReadingGuideService {
	guideType: 'rule' | 'mask' | 'alternatingLines' |'' = '';
	sizeGuide: number = 40;
	handler: any;

	horizontalGuideID = `${PREFIX}horizontal-guide-elt`;
	maskTopEltID = `${PREFIX}mask-guide__top-elt`;
	maskBottomEltID = `${PREFIX}mask-guide__bottom-elt`;
	closeTextID = `${PREFIX}mask-guide__close-text`;

	classRuleGuide = `
		#${this.horizontalGuideID} {
			pointer-events: none;
			border-top: 4px solid black;
			border-bottom: 4px solid white;
			background: black;
			height: 1px;
			width: 100%;
			position: fixed;
			left: 0;
			z-index: calc(infinity);
		}
	`;

	classMaskGuide = `
		#${this.maskTopEltID},
		#${this.maskBottomEltID} {
			/* The masks are purely visual: they must never capture clicks or taps,
			   otherwise the page (and any modal dialog) becomes unusable. */
			pointer-events: none;
			background: rgba(0, 0, 0, 0.5) !important;
			position: fixed;
			left: 0;
			right: 0;
			z-index: calc(infinity);
		}
		#${this.maskTopEltID} {
			top: 0;
		}
		#${this.maskBottomEltID} {
			bottom: 0;
		}

		#${this.closeTextID} {
			pointer-events: none;
			background: rgba(255, 255, 255, 0.4) !important;
			padding: 0.25em 1em;
			position: fixed;
			left: 0;
			line-height: 2em;
			transform: translate(0, -100%);
			z-index: calc(infinity);
		}
	`;
	classAlternatingLinesGuide = `
	${PAGE_P_MARKUP_SELECTOR} {
		background: repeating-linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.4) 0 1lh,
			rgba(0, 0, 0, 0.2) 1lh 2lh
		)
	}
	`;

	constructor() {
		if (readingGuideServiceIsInstantiated) {
			throw new Error('ReadingGuideService is already instantiated.');
		}

		readingGuideServiceIsInstantiated = true;

		this.handler = this.createHandler();
	}

	setReadingMaskGuide = (value: string): void => {
		switch (value) {
			case 'ruleGuide':
				this.resetGuide();
				this.guideType = 'rule';
				this.setGuide();
				break;
			case 'maskGuide':
				this.resetGuide();
				this.guideType = 'mask';
				this.setGuide();
				break;
			case 'alternatingLines':
				this.resetGuide();
				this.guideType = 'alternatingLines';
				this.setGuide();
				break;
			default:
				this.resetGuide();
		}
	}

	setGuide = (): void => {
		let styleGuide = '';
		if (this.guideType === 'rule') {
			styleGuide = this.classRuleGuide;
		} else if (this.guideType === 'mask') {
			styleGuide = this.classMaskGuide;
		} else if (this.guideType === 'alternatingLines') {
			this.setPagePMarkupElementsFlag();
			styleGuide = this.classAlternatingLinesGuide;
		}

		stylesServiceInstance.setStyle('reading-guide', styleGuide);

		if (this.guideType === 'rule') {
			const readingElt = document.createElement('div');
			readingElt.setAttribute('id', `${this.horizontalGuideID}`);
			document.body.insertBefore(readingElt, document.querySelector(APP_NAME));
		} else if (this.guideType === 'mask') {
			const maskTopElt = document.createElement('div');
			const maskBottomElt = document.createElement('div');
			maskTopElt.setAttribute('id', `${this.maskTopEltID}`);
			maskBottomElt.setAttribute('id', `${this.maskBottomEltID}`);
			/* Without an initial height nothing is masked until the first move:
			   on a touch screen there is no hover, so the guide starts in the
			   middle of the viewport. */
			const middle = window.innerHeight / 2;
			maskTopElt.style.height = `${Math.max(0, middle - this.sizeGuide)}px`;
			maskBottomElt.style.height = `${Math.max(0, window.innerHeight - middle - this.sizeGuide)}px`;
			document.body.insertBefore(maskTopElt, document.querySelector(APP_NAME));
			document.body.insertBefore(maskBottomElt, document.querySelector(APP_NAME));
		}

		/* Pointer events cover the mouse AND the touch screen: on mobile the guide
		   follows the taps, it used to stay where the last synthetic mousemove
		   left it and masked the whole page. */
		document.addEventListener('pointermove', this.handler);
		document.addEventListener('pointerdown', this.handler);
	}

	resetGuide = (): void => {
		this.guideType = '';
		stylesServiceInstance.removeStyle('reading-guide');
		document.querySelector(`#${this.horizontalGuideID}`)?.remove();
		document.querySelector(`#${this.maskTopEltID}`)?.remove();
		document.querySelector(`#${this.maskBottomEltID}`)?.remove();
		document.querySelector(`#${this.closeTextID}`)?.remove();
		document.removeEventListener('pointermove', this.handler);
		document.removeEventListener('pointerdown', this.handler);
		this.removePagePMarkupElementsFlag();
	}

	setPagePMarkupElementsFlag = (): void => {
		const elts = document.querySelectorAll(PAGE_P_MARKUP_SELECTOR);
		elts.forEach((elt) => {
			if (!elt.classList.contains(TEXT_ALTERNATE_LINES)) {
				elt.classList.add(TEXT_ALTERNATE_LINES);
			}
		});
	}

	removePagePMarkupElementsFlag = (): void => {
		const elts = document.querySelectorAll(PAGE_P_MARKUP_SELECTOR);
		elts.forEach((elt) => {
			if (elt.classList.contains(TEXT_ALTERNATE_LINES)) {
				elt.classList.remove(TEXT_ALTERNATE_LINES);
			}
		});
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'pointermove':
				case 'pointerdown':
					const y = (event as PointerEvent).clientY;

					if (this.guideType === 'rule') {
						const guide = document.querySelector(`#${this.horizontalGuideID}`) as HTMLElement;
						if (guide) {
							guide.style.top = `${y + 2}px`;
						}
					} else if (this.guideType === 'mask') {
						const maskTop = document.querySelector(`#${this.maskTopEltID}`) as HTMLElement;
						const maskBottom = document.querySelector(`#${this.maskBottomEltID}`) as HTMLElement;
						const closeText = document.querySelector(`#${this.closeTextID}`) as HTMLElement;

						if (maskTop) {
							maskTop.style.height = `${Math.max(0, y - this.sizeGuide)}px`;
						}
						if (maskBottom) {
							maskBottom.style.height = `${Math.max(0, window.innerHeight - y - this.sizeGuide)}px`;
						}
						if (closeText) {
							closeText.style.top = `${y - this.sizeGuide}px`;
						}
					}
					break;
			}
		}
	}
}
