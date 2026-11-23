let navigationButtonsServiceIsInstantiated: boolean = false;

class NavigationButtonsService {
	currentFocusElt: any;
	handlerNavigationButtons: any;
	navigationButtonSet: string = DEFAULT_VALUE;
	delay: number = 0;
	hoverTimeoutIds: { [key: string]: number | null } = {};
	repeatIntervalIds: { [key: string]: number | null } = {};

	constructor() {
		if (navigationButtonsServiceIsInstantiated) {
			throw new Error('NavigationButtonsService is already instantiated.');
		}

		navigationButtonsServiceIsInstantiated = true;

		this.handlerNavigationButtons = this.createHandlerNavigationButtons();
	}

	navigationButtonsList: string[] = ['escape', 'start', 'previous', 'next', 'click'];
	fullButtonsList: string[] 			= ['escape', 'start', 'content', 'previous', 'next', 'click'];

	/* Sur mobile, la serie complete recouvrirait presque toute la page : seuls Precedent et
	   Suivant restent, les boutons Monter et Descendre occupant deja la ligne du bas. */
	mobileButtonsList: string[] = ['previous', 'next'];

	/* Boutons dont le survol prolonge repete l'action, comme Monter et Descendre */
	repeatableButtons: string[] = ['previous', 'next'];

	navTextFlag = `data-${PREFIX}nav-text`;

	/* Sans Lire a haute voix, la page est decoupee par paragraphes pour Precedent et Suivant ;
	   avec, c'est le decoupage de Lire a haute voix qui prime. */
	applyTextUnits = (): void => {
		if (readAloudServiceInstance.state !== 'off') {
			domServiceInstance.clearTextBlocksFocusable(this.navTextFlag);
			return;
		}

		domServiceInstance.makeTextBlocksFocusable(this.navTextFlag);
	}

	isMobile = (): boolean => {
		return window.matchMedia('(max-width: 36em), (pointer: coarse)').matches;
	}

	currentList: string[] = this.navigationButtonsList;

	setNavigationButtons = (value: string): void => {
		this.navigationButtonSet = value.split("_")[0];
		this.delay = this.getDelay(value.split('_')[1]);

		this.resetNavigationButtons();

		switch (this.navigationButtonSet) {
			case 'scrollSet':
				this.currentList = [];
				if (this.delay <= 0) {
					scrollTypeServiceInstance.setScrollType('scrollOnClick');
				} else {
					scrollTypeServiceInstance.setScrollType('scrollOnMouseover', this.delay);
				}
				break;
			case 'navigationSet' :
				this.currentList = this.isMobile() ? this.mobileButtonsList : this.navigationButtonsList;
				this.getFocusedElement();
				this.applyTextUnits();
				this.addNavigationButtons();
				break;
			case 'fullSet':
				this.currentList = this.isMobile() ? this.mobileButtonsList : this.fullButtonsList;
				this.getFocusedElement();
				this.applyTextUnits();
				this.addNavigationButtons();
				if (this.delay <= 0) {
					scrollTypeServiceInstance.setScrollType('scrollOnClick');
				} else {
					scrollTypeServiceInstance.setScrollType('scrollOnMouseover', this.delay);
				}
				break;
			default:
				break;
		}
	}

	resetNavigationButtons = (): void => {
		scrollTypeServiceInstance.setScrollType(DEFAULT_VALUE);
		this.currentList.forEach((navigationButton: string) => {
			domServiceInstance.removeButtonsInDom(navigationButton);
			if (this.hoverTimeoutIds[navigationButton]) {
				clearTimeout(this.hoverTimeoutIds[navigationButton]!);
				this.hoverTimeoutIds[navigationButton] = null;
			}
		});
		document.removeEventListener('click', this.handlerNavigationButtons);
		document.removeEventListener('focusout', this.handlerNavigationButtons);
		document.removeEventListener('focusin', this.handlerNavigationButtons);
		domServiceInstance.clearTextBlocksFocusable(this.navTextFlag);
	}

	addNavigationButtons = (): void => {
		this.currentList.forEach((navigationButton: string) => {
			domServiceInstance.addButtonsInDom(navigationButton);

			let btnNav = document.querySelector(`#${CONTAINER_BUTTONS_ID}__${navigationButton}`);
			if (btnNav) {
				btnNav.addEventListener('mousedown', (event) => {
					event.preventDefault();
					event.stopPropagation();
					this.simulateKeyEvent(navigationButton);
				});

				if (this.delay > 0) {
					const repeatable = this.repeatableButtons.includes(navigationButton);

					btnNav.addEventListener('mouseenter', () => {
						this.clearHover(navigationButton);

						this.hoverTimeoutIds[navigationButton] = window.setTimeout(() => {
							this.simulateKeyEvent(navigationButton);
							this.hoverTimeoutIds[navigationButton] = null;

							/* Precedent et Suivant : le pointeur maintenu sur le bouton continue de
							   deplacer le focus, au rythme choisi, comme Monter et Descendre. */
							if (repeatable) {
								this.repeatIntervalIds[navigationButton] = window.setInterval(() => {
									this.simulateKeyEvent(navigationButton);
								}, this.delay);
							}
						}, this.delay);
					});

					btnNav.addEventListener('mouseleave', () => this.clearHover(navigationButton));
				}
			}
		});
	}

	simulateKeyEvent = (name: string): void => {
		switch (name) {
			case 'next':
				this.focusElement('next');
				break;
			case 'previous':
				this.focusElement('previous');
				break;
			case 'click':
				this.currentFocusElt?.click();
				break;
			case 'escape':
				this.simulateKeydownEscape();
				break;
			case 'start':
				/* Apres un retour en haut de page, Suivant repart du tout premier element, souvent un
				   lien d'evitement masque (Aller au contenu). */
				this.currentFocusElt = null;
				restartTopLeftServiceInstance.setRestartTopLeft();
				break;
			case 'content':
				skipToContentServiceInstance.setSkipToContent();
				break;
			default:
				break;
		}
	}

	focusElement = (direction: 'previous' | 'next'): void => {
		const focusableElements = domServiceInstance.getFocusableElements();

		let newIndex: number = 0;
		if (this.currentFocusElt) {
			const currentIndex = focusableElements.indexOf(this.currentFocusElt);
			newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
			newIndex = newIndex > focusableElements.length - 1 ? 0 : newIndex < 0 ? focusableElements.length - 1 : newIndex;
		}

		const newFocusElt = focusableElements[newIndex] as HTMLElement;
		newFocusElt?.focus();
		this.currentFocusElt = newFocusElt;

		/* Lire a haute voix : c'est l'element de la page qui vient d'etre focalise qui est
		   vocalise, jamais le bouton de navigation qui vient d'etre clique. */
		readAloudServiceInstance.speakFocused(newFocusElt);
	}

	clearHover = (name: string): void => {
		if (this.hoverTimeoutIds[name]) {
			clearTimeout(this.hoverTimeoutIds[name]!);
			this.hoverTimeoutIds[name] = null;
		}

		if (this.repeatIntervalIds[name]) {
			clearInterval(this.repeatIntervalIds[name]!);
			this.repeatIntervalIds[name] = null;
		}
	}

	/* Suivant et Precedent repartent de l'element reellement focalise, quelle que soit la facon
	   dont il l'a ete (tabulation, clic, vocalisation). */
	getFocusedElement = (): void => {
		document.addEventListener('focusin', this.handlerNavigationButtons);
	}

	simulateKeydownEscape = (): void => {
		var event = new KeyboardEvent('keydown', {
			key: 'Escape',
			keyCode: 27,
			code: 'Escape',
			which: 27,
			bubbles: true,
			cancelable: true
		});
		document.dispatchEvent(event);
	}

	createHandlerNavigationButtons = () => {
		return (event: any) => {
			if (event.type !== 'focusin') {
				return;
			}

			const target = event.target as HTMLElement;

			if (!target || target === document.body
				|| target.closest?.(APP_NAME)
				|| target.closest?.(`#${CONTAINER_BUTTONS_ID}`)) {
				return;
			}

			this.currentFocusElt = target;
		}
	}

	getDelay = (delay: string): number => {
		if (delay !== 'clicAction') {
			return parseInt(delay?.replace(/\D/g, ''), 10) * 1000;
		}
		return 0;
	}
}
