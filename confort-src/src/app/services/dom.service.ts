let domServiceIsInstantiated: boolean;

class DomService {
	excludedElements = `${APP_NAME}, script`;

	constructor() {
		if (domServiceIsInstantiated) {
			throw new Error('DomService is already instantiated.');
		}

		domServiceIsInstantiated = true;
	}

	/* https://github.com/KittyGiraudel/focusable-selectors	*/
	getFocusableElements = (): any[] => {
		const not = {
			inert: '[inert],[inert] *',
			negTabIndex: '[tabindex^="-"]',
			disabled: ':disabled',
		};

		const focusableElt = [
			`a[href]:not(${not.inert},${not.negTabIndex}`,
			`area[href]:not(${not.inert},${not.negTabIndex}`,
			`input:not([type="hidden"],[type="radio"],${not.inert},${not.negTabIndex},${not.disabled}`,
			`input[type="radio"]:not(${not.inert},${not.negTabIndex},${not.disabled}`,
			`select:not(${not.inert},${not.negTabIndex},${not.disabled}`,
			`textarea:not(${not.inert},${not.negTabIndex},${not.disabled}`,
			`button:not(${not.inert},${not.negTabIndex},${not.disabled}`,
			`details:not(${not.inert} > summary:first-of-type,${not.negTabIndex}`,
			// Discard until Firefox supports `:has()`, i.e. when Firefox has its ESR version in 128.
			// See: https://github.com/KittyGiraudel/focusable-selectors/issues/12
			// `details:not(:has(> summary),${not.inert},${not.negTabIndex})`,
			`iframe:not(${not.inert},${not.negTabIndex}`,
			`audio[controls]:not(${not.inert},${not.negTabIndex}`,
			`video[controls]:not(${not.inert},${not.negTabIndex}`,
			`[contenteditable]:not(${not.inert},${not.negTabIndex}`,
			`[tabindex]:not(${not.inert},${not.negTabIndex}`
		];

		return Array.from(document.querySelectorAll(focusableElt.join(',')))
			.filter((el: any) => !el.disabled && el.tabIndex >= 0);
	}

	addButtonsInDom = (button: string, start: boolean = false): void => {
		let container: HTMLElement;
		let fragment = document.createDocumentFragment();
		let rightPosition = document.querySelector(APP_NAME)?.shadowRoot?.querySelector('app-toolbar')?.classList.contains('close') ?
			BTN_RIGHT_POS_DEFAULT : BTN_RIGHT_POS_OPEN;

		if (document.querySelector(`#${CONTAINER_BUTTONS_ID}`)) {
			container = document.querySelector(`#${CONTAINER_BUTTONS_ID}`);
		} else {
			container = document.createElement('div');
			container.setAttribute('id', CONTAINER_BUTTONS_ID);

			let styleContainerButtons = `
				#${CONTAINER_BUTTONS_ID} {
					font-size: 16px;
					display: flex;
					flex-direction: column;
					gap: 1em;
					position: fixed;
					bottom: 1em;
					right: ${rightPosition};
					z-index: calc(infinity);
				}

				#${CONTAINER_BUTTONS_ID} .button-row {
					display: flex;
					gap: 1em;
					justify-content: flex-end;
				}

				#${CONTAINER_BUTTONS_ID} button {
					background: #f16e00;
					color: #000;
					border: 2px solid currentColor;
					font-weight: bold;
					/* Au repos le bouton se limite a son libelle : il masque beaucoup moins la page */
					padding: 0.15em 0.45em;
					outline: 2px solid #fff;
					box-shadow: 0 0 6px 3px #bbb;
					transition: padding 0.15s ease-out;
				}

				/* Navigation par Precedent et Suivant : le focus reste visible, meme sur fond sombre,
				   avec le meme cadre noir et blanc que Lire a haute voix. */
				:is(a[href], area[href], button, input, select, textarea, summary, [tabindex]):focus,
				[data-cplus-tabindex]:focus,
				[data-cplus-nav-text]:focus {
					outline: 4px solid #000 !important;
					outline-offset: 3px !important;
					box-shadow: 0 0 0 8px #fff !important;
				}

				#${CONTAINER_BUTTONS_ID} button:hover,
				#${CONTAINER_BUTTONS_ID} button:focus,
				#${CONTAINER_BUTTONS_ID} button:focus-visible,
				#${CONTAINER_BUTTONS_ID} button:active {
					padding: 1em 2em;
				}

				#${CONTAINER_BUTTONS_ID} button:hover {
					background: #000;
					color: #fff;
				}

				#${CONTAINER_BUTTONS_ID} button:active {
					background: #fff;
					color: #000;
				}

				#${CONTAINER_BUTTONS_ID} button:focus {
					outline: 3px solid #000;
    			outline-offset: 2px;
				}
			`;

			stylesServiceInstance.setStyle('container-buttons', styleContainerButtons);
		}

		const isScrollButton = this.isScrollButton(button);
		const rowClass = isScrollButton ? 'scroll-row' : 'navigation-row';

		let targetRow = container.querySelector(`.${rowClass}`);
		if (!targetRow) {
			targetRow = document.createElement('div');
			targetRow.className = `button-row ${rowClass}`;

			if (isScrollButton) {
				container.appendChild(targetRow);
			} else {
				const scrollRow = container.querySelector('.scroll-row');
				if (scrollRow) {
					container.insertBefore(targetRow, scrollRow);
				} else {
					container.appendChild(targetRow);
				}
			}
		}

		let btn = document.createElement('button');
		btn.setAttribute('id', `${CONTAINER_BUTTONS_ID}__${button}`);
		btn.type = 'button';
		btn.tabIndex = -1;
		btn.innerText = i18nServiceInstance.getMessage(button);
		btn.title = i18nServiceInstance.getMessage(`${button}_instruction`);

		if (start) {
			targetRow.prepend(btn);
		} else {
			targetRow.appendChild(btn);
		}

		fragment.appendChild(container);
		document.body.appendChild(fragment);
		this.keepPaletteClear();
	}

	/* La pastille Confort+ ne doit jamais se retrouver sous les boutons de navigation : elle
	   deviendrait impossible a atteindre au pointeur. */
	keepPaletteClear = (): void => {
		requestAnimationFrame(() => dragDropServiceInstance.avoidButtons());
	}

	/* Titres, paragraphes, listes et legendes rendus focalisables, pour que la navigation
	   parcoure tout le contenu de la page et pas seulement les liens et boutons. */
	makeTextBlocksFocusable = (flag: string): void => {
		const elements = Array.from(document.body.querySelectorAll(TEXT_BLOCK_SELECTOR)) as HTMLElement[];
		let count = 0;

		for (let index = 0; index < elements.length && count < TEXT_BLOCK_MAX; index++) {
			const element = elements[index];

			if (element.hasAttribute('tabindex')
				|| element.closest(APP_NAME)
				|| element.closest(`#${CONTAINER_BUTTONS_ID}`)
				|| !element.textContent?.trim()) {
				continue;
			}

			/* Un bloc qui contient un lien est decoupe : le texte qui precede, le lien lui-meme,
			   puis le texte qui suit, chacun focalisable a son tour. */
			if (element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)) {
				count += this.wrapTextFragments(element, flag);
				continue;
			}

			element.setAttribute('tabindex', '0');
			element.setAttribute(flag, 'true');
			count++;
		}
	}

	private wrapTextFragments = (element: HTMLElement, flag: string): number => {
		const display = getComputedStyle(element).display;

		if (display.includes('flex') || display.includes('grid')) {
			return 0;
		}

		let group: Node[] = [];
		let count = 0;

		const flush = () => {
			const text = group.map((node: Node) => node.textContent).join('');

			if (group.length > 0 && /[\p{L}\p{N}]/u.test(text)) {
				const fragment = document.createElement('span');
				fragment.classList.add(TEXT_FRAGMENT_CLASS);
				fragment.setAttribute('tabindex', '0');
				fragment.setAttribute(flag, 'true');
				group[0].parentNode?.insertBefore(fragment, group[0]);
				group.forEach((node: Node) => fragment.appendChild(node));
				count++;
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

			if (child.classList.contains(TEXT_FRAGMENT_CLASS)
				|| child.matches(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| child.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| getComputedStyle(child).display.includes('block')) {
				flush();
				return;
			}

			group.push(node);
		});

		flush();

		return count;
	}

	clearTextBlocksFocusable = (flag: string): void => {
		document.body.querySelectorAll(`[${flag}]`).forEach((element: Element) => {
			element.removeAttribute('tabindex');
			element.removeAttribute(flag);

			if (element.classList.contains(TEXT_FRAGMENT_CLASS)) {
				element.replaceWith(...Array.from(element.childNodes));
			}
		});
	}

	isScrollButton = (button: string): boolean => {
		return button.includes( 'scroll_');
	}

	removeButtonsInDom = (button: string): void => {
		const buttonElement = document.querySelector(`#${CONTAINER_BUTTONS_ID}__${button}`);
		const parentRow = buttonElement?.parentElement;

		buttonElement?.remove();

		if (parentRow && parentRow.children.length === 0) {
			parentRow.remove();
		}

		if (document.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.children.length === 0) {
			document.querySelector(`#${CONTAINER_BUTTONS_ID}`)?.remove();
			stylesServiceInstance.removeStyle('container-buttons');
			dragDropServiceInstance.refreshPosition();
		}
	}
}

