const tmplToolbar: HTMLTemplateElement = document.createElement('template');
tmplToolbar.innerHTML = `
<app-header id="header"></app-header>
`;

class ToolbarComponent extends HTMLElement {
	header: HTMLElement | null = null;
	json: ModeOfUseModel;
	defaultJson: ModeOfUseModel;
	handler: any;
	state: string;

	constructor() {
		super();
		this.appendChild(tmplToolbar.content.cloneNode(true));

		this.handler = this.createHandler();
	}

	connectedCallback(): void {
		this.header = this.querySelector('#header');
		this.state = (this.parentNode.parentNode as ShadowRoot).host.getAttribute('data-state');

		/* JSON retrieval and initialisation */
		filesServiceInstance.getJSONFile('modes-of-use').then((result: any) => {
			this.defaultJson = result;

			localStorageServiceInstance.getItem(JSON_NAME).then((result: any) => {
				if (result && Object.keys(result).length !== 0 && result.version === this.defaultJson.version) {
					this.json = result;
				} else {
					this.json = this.defaultJson;
					localStorageServiceInstance.setItem(JSON_NAME, this.defaultJson);
				}

				this.initCurrentMode(this.state === 'restored');
			});
		});

		window.addEventListener(`storage-${JSON_NAME}`, this.handler);

		this.addEventListener('changeRoute', this.handler);
	}

	initCurrentMode = (shouldLoad = false): void => {
		if (this.json.selectedMode) {
			routeServiceInstance.initPages(this, shouldLoad).then((result: string) => {
				if (result) {
					this.setCurrentPage(result);
				}
			});
		} else {
			routeServiceInstance.navigate(PAGE_MODES, false, this);
			setTimeout(() => {
				this.querySelector('app-modes')?.setAttribute('data-modes', JSON.stringify(this.json));
			});
		}
	}

	setCurrentPage = (page: string): void => {
		if (!page || !this.json) {
			return;
		}

		setTimeout(() => {
			let currentPage = this.querySelector(`app-${page}`);
			if (currentPage) {
				currentPage?.setAttribute('data-modes', JSON.stringify(this.json));

				if (page === PAGE_EDIT_SETTING) {
					localStorageServiceInstance.getItem('current-setting').then((result: any) => {
						if (result) {
							const editSettingElement: HTMLElement = (this.querySelector(`app-${PAGE_EDIT_SETTING}`) as HTMLElement);
							editSettingElement?.setAttribute('data-setting', result);
						}
					});
				}
			}
		});
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'changeRoute':
					this.changeRouteEvent(event);
					break;
				case `storage-${JSON_NAME}`:
					this.storageEvent();
					break;
			}
		}
	}

	private changeRouteEvent = (event: Event): void => {
		let newRoute = (event as CustomEvent).detail.route;
		const previousRoute = routeServiceInstance.currentRoute;
		const previousSetting = (this.querySelector(`app-${PAGE_EDIT_SETTING}`) as HTMLElement)?.getAttribute('data-setting');
		this.header?.focus();

		if ((event as CustomEvent).detail.mode) {
			this.json.selectedMode = (event as CustomEvent).detail.mode;
			(this.querySelector(`app-${PAGE_HOME}`) as HTMLElement)?.focus();
		}

		routeServiceInstance.navigate(newRoute, false, this);
		this.setCurrentPage(newRoute);

		if ((event as CustomEvent).detail.setting) {
			const editSettingElement: HTMLElement = (this.querySelector(`app-${PAGE_EDIT_SETTING}`) as HTMLElement);
			editSettingElement?.setAttribute('data-setting', (event as CustomEvent).detail.setting);
		}

		if (newRoute === PAGE_SETTINGS && previousRoute === PAGE_EDIT_SETTING) {
			this.restoreSettingFocus(previousSetting);
		}
	}

	/* Retour depuis « Choix pour ce reglage » : la vue et le focus reviennent sur le bouton
	   multiclic du reglage que l'on vient de quitter. */
	private restoreSettingFocus = (setting: string): void => {
		if (!setting) {
			return;
		}

		setTimeout(() => {
			const settingElement = this.querySelector(`app-btn-setting[data-name="${setting}"]`) as HTMLElement;
			const button = settingElement?.querySelector('button') as HTMLElement;

			if (!button) {
				return;
			}

			/* La categorie est repliee : elle est rouverte pour que le reglage soit de nouveau visible */
			if (button.getClientRects().length === 0) {
				(settingElement.closest('.accordion-item')?.querySelector('button.accordion-button') as HTMLElement)?.click();
			}

			setTimeout(() => {
				button.focus();
				button.scrollIntoView({ block: 'center' });
			}, 50);
		});
	}

	private storageEvent = (): void => {
		localStorageServiceInstance.getItem(JSON_NAME).then((result: any) => {
			if (!result || Object.keys(result).length === 0) {
				return;
			}

			this.json = result;
			this.setCurrentPage(routeServiceInstance.currentRoute);
		});
	}
}

customElements.define('app-toolbar', ToolbarComponent);
