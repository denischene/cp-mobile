let clickFaciliteServiceIsInstantiated: boolean;

class ClickFaciliteService {
	selectedElt: any;
	delay: number;
	isClicking = false;
	clickableElements = ['A', 'AREA', 'INPUT', 'SELECT', 'OPTION', 'TEXTAREA', 'LABEL', 'BUTTON', 'SUMMARY'];
	timer: ReturnType<typeof setTimeout> | null = null;
	handlerClickFacilite: any;

	constructor() {
		if (clickFaciliteServiceIsInstantiated) {
			throw new Error('ClickFaciliteService is already instantiated.');
		}
		clickFaciliteServiceIsInstantiated = true;

		this.handlerClickFacilite = this.createHandlerClickFacilite();
	}

	setClickFacilite = (value: string): void => {
		let paramName = value.split('_')[0];
		this.delay = parseInt(value.split('_')[1]?.replace(/\D/g, ''), 10) * 1000;

		switch (paramName) {
			case CLICK_FACILITE_BIG_ZONE: {
				this.resetEventClick();
				this.enlargeClickableElements();
				scrollAspectServiceInstance.setScrollAspect('big_black');
				// Issue #500 : conflict between "Navigation buttons" et "Click Facilite"
				// scrollTypeServiceInstance.setScrollType(DEFAULT_VALUE);
				break;
			}
			case CLICK_FACILITE_LONG_CLICK: {
				this.resetEventClick();
				this.enlargeClickableElements();
				scrollAspectServiceInstance.setScrollAspect('big_black');
				// Issue #500 : conflict between "Navigation buttons" et "Click Facilite"
				// scrollTypeServiceInstance.setScrollType('scrollOnClick');
				this.longClick();
				break;
			}
			case CLICK_FACILITE_AUTO_CLICK: {
				this.resetEventClick();
				this.enlargeClickableElements();
				scrollAspectServiceInstance.setScrollAspect('big_black');
				// Issue #500 : conflict between "Navigation buttons" et "Click Facilite"
				// scrollTypeServiceInstance.setScrollType('scrollOnMouseover');
				this.autoClick();
				break;
			}
			default: {
				scrollAspectServiceInstance.setScrollAspect(DEFAULT_VALUE);
				scrollTypeServiceInstance.setScrollType(DEFAULT_VALUE);
				this.resetEventClick();
				this.resetEnlargeClickableElements();
				break;
			}
		}
	}

	getClickableElt = (event: MouseEvent): any => {
		let pointedElt: any = event.target;
		let closestPointedElt: any = pointedElt.closest(this.clickableElements.join(','))
		return this.clickableElements.includes(pointedElt.nodeName) ? pointedElt :
			closestPointedElt ? closestPointedElt : pointedElt;
	}

	longClick = (): void => {
		document.addEventListener('click', this.handlerClickFacilite);
		document.addEventListener('mousedown', this.handlerClickFacilite);
		document.addEventListener('mouseup', this.handlerClickFacilite);
	}

	autoClick = (): void => {
		document.addEventListener('mouseover', this.handlerClickFacilite);
		document.addEventListener('mouseout', this.handlerClickFacilite);
	}

	resetEventClick = (): void => {
		document.removeEventListener('click', this.handlerClickFacilite);
		document.removeEventListener('mouseover', this.handlerClickFacilite);
		document.removeEventListener('mouseout', this.handlerClickFacilite);
		document.removeEventListener('mousedown', this.handlerClickFacilite);
		document.removeEventListener('mouseup', this.handlerClickFacilite);
	}

	doClick = (elt: any): void => {
		if (this.clickableElements.includes(elt.nodeName)) {
			switch (elt.nodeName) {
				case 'A':
				case 'AREA':
					this.clickLink(elt);
					break;
				case 'INPUT':
					this.clickInput(elt);
					break;
				case 'SELECT':
				case 'TEXTAREA':
					elt.focus();
					break;
				case 'OPTION':
					this.selectOption(elt);
					break;
				case 'LABEL':
					document.getElementById(elt.htmlFor).click();
					break;
				default:
					elt.click();
					break;
			}
		} else if (elt.onclick && elt.onclick !== null) {
			elt.onclick();
		} else {
			elt.click();
		}
	};

	clickLink = (elt: any): void => {
		if (elt.href && elt.href !== "") {
			window.location = elt.href;
		}
	}

	clickInput = (elt: any): void => {
		elt.focus();
		switch (elt.type) {
			case 'radio':
				elt.checked = true;
				break;
			case 'checkbox':
				elt.checked = !elt.checked;
				break;
		}
	}

	selectOption = (elt: any): void => {
		let options = elt.closest('SELECT')?.options;
		for (var i = 0; i < options.length; i++) {
			if (options[i].text === elt.text) {
				options[i].selected = true;
				elt.focus();
			} else {
				options[i].selected = false;
			}
		}
	}

	createHandlerClickFacilite = () => {
		return (event: any) => {
			switch (event.type) {
				case 'click':
					event.preventDefault();
					break;
				case 'mousedown':
				case 'mouseover':
					this.setTimeoutClick(event);
					break;
				case 'mouseup':
				case 'mouseout':
					this.clearTimeout();
					break;
			}
		}
	}

	private setTimeoutClick = (event: any): void => {
		this.timer = setTimeout(() => {
			this.doClick(this.getClickableElt(event));
		}, this.delay);
	}

	private clearTimeout = (): void => {
		if (this.timer !== null) {
			clearTimeout(this.timer);
		}
	}

	enlargeClickableElements = (): void => {
		const styleId = 'click-facilite-enlarge-style';
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.innerHTML = `
				.click-facilite-enlarged {
					padding-block: 1.125rem !important;
					padding-inline: .125rem !important;
				}
				/* Only a purely inline target needs to become a block to accept the
				   vertical padding: changing the display of a flex / grid target
				   breaks its layout (icons stacking above the label). */
				.click-facilite-enlarged-inline {
					display: inline-block;
				}
				.click-facilite-enlarged-control {
					min-height: ${CLICK_FACILITE_MIN_TARGET}px !important;
					min-width: ${CLICK_FACILITE_MIN_TARGET}px !important;
					padding-block: .5rem !important;
				}
				.click-facilite-target:hover,
				.click-facilite-target:focus-visible {
					outline: 2px solid currentColor !important;
					filter: drop-shadow(0px 0px 5px #ffffff);
				}
			`;
			document.head.appendChild(style);
		}

		document.querySelectorAll(CLICK_FACILITE_TARGETS).forEach((element: Element) => {
			const htmlElement = element as HTMLElement;

			/* Every target gets the hover / focus highlight */
			htmlElement.classList.add('click-facilite-target');

			const rect = htmlElement.getBoundingClientRect();

			/* Already big enough (tiles, cards, large buttons): enlarging the click
			   zone makes no sense and would break the page layout */
			if (rect.height >= CLICK_FACILITE_MIN_TARGET && rect.width >= CLICK_FACILITE_MIN_TARGET) {
				return;
			}

			/* Form controls (listbox, inputs...) keep their box model, only their
			   minimum size grows */
			if (['SELECT', 'INPUT', 'TEXTAREA'].includes(htmlElement.nodeName)) {
				htmlElement.classList.add('click-facilite-enlarged-control');
				return;
			}

			htmlElement.classList.add('click-facilite-enlarged');

			if (window.getComputedStyle(htmlElement).display === 'inline') {
				htmlElement.classList.add('click-facilite-enlarged-inline');
			}
		});
	}

	resetEnlargeClickableElements = (): void => {
		document.querySelectorAll('.click-facilite-target, .click-facilite-enlarged, .click-facilite-enlarged-control, .click-facilite-enlarged-inline').forEach((el) => {
			el.classList.remove('click-facilite-target', 'click-facilite-enlarged', 'click-facilite-enlarged-control', 'click-facilite-enlarged-inline');
		});
		const style = document.getElementById('click-facilite-enlarge-style');
		if (style) {
			style.remove();
		}
	}
}
