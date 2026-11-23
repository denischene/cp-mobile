const template: HTMLTemplateElement = document.createElement('template');
template.innerHTML = `
<div data-bs-theme="light" style="display:none">
	<button type="button" class="btn btn-icon btn-primary btn-lg sc-confort-plus" id="confort" data-i18n-title="mainButton">
		<span class="visually-hidden" data-i18n="mainButton"></span>
		<app-icon data-size="3em" data-name="Accessibility"></app-icon>
		<span class="sc-confort-plus-move-arrows" aria-hidden="true">
			<svg class="sc-confort-plus-move-arrow sc-confort-plus-move-arrow--up" viewBox="0 0 20 14" focusable="false"><polygon points="10,1 19,13 1,13" fill="#000" stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/></svg>
			<svg class="sc-confort-plus-move-arrow sc-confort-plus-move-arrow--down" viewBox="0 0 20 14" focusable="false"><polygon points="10,1 19,13 1,13" fill="#000" stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/></svg>
			<svg class="sc-confort-plus-move-arrow sc-confort-plus-move-arrow--left" viewBox="0 0 20 14" focusable="false"><polygon points="10,1 19,13 1,13" fill="#000" stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/></svg>
			<svg class="sc-confort-plus-move-arrow sc-confort-plus-move-arrow--right" viewBox="0 0 20 14" focusable="false"><polygon points="10,1 19,13 1,13" fill="#000" stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/></svg>
		</span>
		<span id="pause-indicator" class="sc-confort-plus-pause-icon">
			<app-icon data-size="2em" data-name="Pause"></app-icon>
		</span>
	</button>
	<app-toolbar class="bg-body position-fixed top-0 end-0" id="${PREFIX}toolbar"></app-toolbar>
</div>
`;

class AppComponent extends HTMLElement {
	confortPlusBtn: HTMLElement | undefined = null;
	confortPlusToolbar: HTMLElement | undefined = null;
	closeBtn: HTMLElement | undefined = null;
	pauseIndicator: HTMLElement | undefined = null;
	link: HTMLLinkElement;

	handler: any;

	private pressedKeys = new Set<string>();

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this?.shadowRoot?.appendChild(template.content.cloneNode(true));

		this.link = document.createElement('link');
		this.link.rel = 'stylesheet';
		this.link.href = `${appPath}css/styles.min.css`;
		this.link.onload = () => {
			this?.shadowRoot?.querySelector('[data-bs-theme]').removeAttribute('style');
		};
		this.shadowRoot?.appendChild(this.link);

		this.handler = this.createHandler();
	}

	connectedCallback(): void {
		iconsServiceInstance.loadSprite(this.shadowRoot);
		// @note Tick until everything loaded
		setTimeout(() => {
			i18nServiceInstance.translate(this.shadowRoot);
		});

		this.confortPlusBtn = this?.shadowRoot?.getElementById('confort');
		this.closeBtn = this?.shadowRoot?.getElementById('close-toolbar');
		this.pauseIndicator = this?.shadowRoot?.getElementById('pause-indicator');
		this.confortPlusToolbar = this?.shadowRoot?.getElementById(`${PREFIX}toolbar`);
		if (!this.confortPlusBtn || !this.confortPlusToolbar) {
			return;
		}

		localStorageServiceInstance.getItem('is-opened')
			.then((isOpened: any) => {
				if (isOpened === 'true') {
					this.showToolbar();
				} else {
					this.hideToolbar();
				}
			});

		this.setPauseIndicator();

		dragDropServiceInstance.init(this.confortPlusBtn);
		dragDropServiceInstance.enable();

		this.confortPlusToolbar.addEventListener('closeEvent', this.handler);
		this.confortPlusBtn.addEventListener('click', this.handler);

		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
		this.shadowRoot?.addEventListener('keydown', this.handleToolbarTab as EventListener);
	}

	disconnectedCallback(): void {
		this.confortPlusToolbar?.removeEventListener('closeEvent', this.handler);
		this.confortPlusBtn?.removeEventListener('click', this.handler);

		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
		this.shadowRoot?.removeEventListener('keydown', this.handleToolbarTab as EventListener);
	}

	/* La tabulation tourne en boucle dans la palette ouverte : apres le dernier bouton de la page
	   elle revient sur « Replier la palette » (accueil) ou sur le bouton de retour (autres pages). */
	private handleToolbarTab = (event: KeyboardEvent) => {
		if (event.key !== 'Tab' || this.confortPlusToolbar?.classList.contains('close')) {
			return;
		}

		const focusables = this.getToolbarFocusables();

		if (focusables.length === 0) {
			return;
		}

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const current = (event.composedPath()[0] as HTMLElement);

		if (!event.shiftKey && current === last) {
			event.preventDefault();
			first.focus();
		} else if (event.shiftKey && current === first) {
			event.preventDefault();
			last.focus();
		}
	}

	private getToolbarFocusables = (): HTMLElement[] => {
		const elements = Array.from(
			this.confortPlusToolbar?.querySelectorAll(TOOLBAR_FOCUSABLE_SELECTOR) ?? []
		) as HTMLElement[];

		return elements.filter((element: HTMLElement) => {
			return !(element as HTMLButtonElement).disabled
				&& element.tabIndex >= 0
				&& element.getClientRects().length > 0;
		});
	}

	private handleKeyDown = (event: KeyboardEvent) => {
		this.pressedKeys.add(event.key);

		if (
			event.shiftKey &&
			this.pressedKeys.has('R')
			&& this.pressedKeys.has('A')
			&& this.pressedKeys.has('Z')
		) {
			this.resetAction();
			this.pressedKeys.clear();
		}
	}

	private handleKeyUp = (event: KeyboardEvent) => {
		this.pressedKeys.delete(event.key);
	}

	private resetAction = () => {

		globalSettingsServices.forEach((service: SavedSettingsState) => {
			service.instanceService(DEFAULT_VALUE);
		});
		localStorageServiceInstance.getItem('modeOfUse').then((json: any) => {
			const activeMode = json.modes.find((mode: any) => mode[json.selectedMode]);

			activeMode?.[json.selectedMode]?.forEach((settingWrapper: any) => {
				const setting = Object.values(settingWrapper)[0] as any;
				setting.valueSelected = 0;
			});
			localStorageServiceInstance.setItem('modeOfUse', json);
		});

	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'closeEvent':
					this.hideToolbar();
					break;
				case 'click':
					this.showToolbar();
					break;
				default:
					break;
			}
		}
	}

	private showToolbar = (): void => {
		dragDropServiceInstance.disable();
		this.setContainerButtonsPosition(BTN_RIGHT_POS_OPEN);
		this.confortPlusToolbar.classList.remove('close');

		/* Le bouton de repli n'existe qu'une fois l'en-tete rendu : il est retrouve a l'ouverture et
		   focalise avant que la pastille ne disparaisse, sinon le navigateur renvoie le focus au
		   document en masquant l'element focalise. */
		this.closeBtn = this?.shadowRoot?.getElementById('close-toolbar');
		this.confortPlusBtn.classList.add('d-none');
		this.focusCloseBtn();
		localStorageServiceInstance.setItem('is-opened', 'true');
	}

	/* La palette apparait avec une transition : le bouton de repli n'est focalisable qu'une fois
	   affiche, la mise au point est donc retentee jusqu'a aboutir. */
	private focusCloseBtn = (): void => {
		[0, 120, 350].forEach((delay: number) => {
			setTimeout(() => {
				if (this.shadowRoot?.activeElement !== this.closeBtn) {
					this.closeBtn?.focus();
				}
			}, delay);
		});
	}

	private hideToolbar = (): void => {
		this.setContainerButtonsPosition(BTN_RIGHT_POS_DEFAULT);
		this.confortPlusToolbar.classList.add('close');
		this.confortPlusBtn.classList.remove('d-none');
		this.confortPlusBtn?.focus();
		localStorageServiceInstance.setItem('is-opened', 'false');
		this.setPauseIndicator();
		dragDropServiceInstance.enable();
	}

	private setContainerButtonsPosition = (position: string): void => {
		if (document.querySelector(`#${CONTAINER_BUTTONS_ID}`)) {
			(document.querySelector(`#${CONTAINER_BUTTONS_ID}`) as HTMLElement).style.right = position;
		}
	}

	private setPauseIndicator = () => {
		localStorageServiceInstance.getItem('is-paused')
			.then((isPaused: any) => {
				this.pauseIndicator.hidden = !isPaused;
				this.confortPlusBtn.classList.toggle('sc-confort-plus--paused', isPaused ?? false);
			});
	}
}

customElements.define(APP_NAME, AppComponent);
