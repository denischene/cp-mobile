import io

done = []
BASE = '/app/confort-src/src/app/'


def replace(path, old, new, label):
    with io.open(BASE + path, encoding='utf-8') as handle:
        src = handle.read()

    if new in src:
        done.append(label + ' (deja applique)')
        return

    assert src.count(old) == 1, label

    with io.open(BASE + path, 'w', encoding='utf-8') as handle:
        handle.write(src.replace(old, new))

    done.append(label)


# 1. Ouverture de la palette : le focus est pose sur « Replier la palette »
replace('app.component.ts',
	"""	private showToolbar = (): void => {
		dragDropServiceInstance.disable();
		this.setContainerButtonsPosition(BTN_RIGHT_POS_OPEN);
		this.confortPlusToolbar.classList.remove('close');
		this.confortPlusBtn.classList.add('d-none');
		this.closeBtn?.focus();""",
	"""	private showToolbar = (): void => {
		dragDropServiceInstance.disable();
		this.setContainerButtonsPosition(BTN_RIGHT_POS_OPEN);
		this.confortPlusToolbar.classList.remove('close');
		this.confortPlusBtn.classList.add('d-none');

		/* Le bouton de repli n'existe qu'une fois l'en-tete rendu : il est retrouve a l'ouverture,
		   puis focalise au rafraichissement suivant pour etre deja visible sans tabuler. */
		this.closeBtn = this?.shadowRoot?.getElementById('close-toolbar');
		requestAnimationFrame(() => this.closeBtn?.focus());""",
	'focus a l ouverture')

# 2. Tabulation en boucle dans la palette ouverte
replace('app.component.ts',
	"""		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	}""",
	"""		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
		this.shadowRoot?.addEventListener('keydown', this.handleToolbarTab);
	}""",
	'ecouteur boucle')

replace('app.component.ts',
	"""	private handleKeyDown = (event: KeyboardEvent) => {""",
	"""	/* La tabulation tourne en boucle dans la palette ouverte : apres le dernier bouton de la page
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

	private handleKeyDown = (event: KeyboardEvent) => {""",
	'boucle de tabulation')

replace('app.component.ts',
	"""		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
	}""",
	"""		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
		this.shadowRoot?.removeEventListener('keydown', this.handleToolbarTab);
	}""",
	'retrait ecouteur boucle')

# 3. Modes d'usage : chaque mode est atteignable a la tabulation, Entree le deplie
replace('shared/select-mode.component.ts',
	"""		this.inputElement!.checked = this.checked;
		this.inputElement!.disabled = this.disabled;""",
	"""		this.inputElement!.checked = this.checked;
		this.inputElement!.disabled = this.disabled;
		/* Chaque mode selectionnable est atteignable a la tabulation (et non le seul mode coche,
		   comportement habituel d'un groupe de boutons radio). */
		this.inputElement!.tabIndex = this.disabled ? -1 : 0;
		this.submitBtnElement!.disabled = this.disabled;
		this.inputElement?.addEventListener('keydown', this.handleKey);""",
	'modes tabulables')

replace('shared/select-mode.component.ts',
	"""	setActiveState = (): void => {""",
	"""	disconnectedCallback(): void {
		this.inputElement?.removeEventListener('keydown', this.handleKey);
	}

	/* Entree deplie le mode focalise, sans valider le formulaire */
	private handleKey = (event: KeyboardEvent): void => {
		if (event.key !== 'Enter' || this.disabled) {
			return;
		}

		event.preventDefault();
		this.inputElement!.checked = true;
		this.inputElement?.dispatchEvent(new Event('change', { bubbles: true }));
	}

	setActiveState = (): void => {""",
	'entree deplie le mode')

replace('pages/modes/modes.component.ts',
	"""		this.selectModeZone!.innerHTML = radioModeList;
	}""",
	"""		this.selectModeZone!.innerHTML = radioModeList;

		/* A l'arrivee, le focus est pose sur le mode deplie (celui en cours ou le mode par defaut) */
		setTimeout(() => (this.querySelector('input:checked') as HTMLElement)?.focus());
	}""",
	'focus sur le mode deplie')

# 4. Chevrons des reglages avances : le focus passe au bouton encore actif
replace('shared/select-edit-value.component.ts',
	"""				switch (event.currentTarget) {
					case this.btnPrevValue:
						this.moveEditValue(this.currentIndex - 1);
						break;
					case this.btnNextValue:
						this.moveEditValue(this.currentIndex + 1);
						break;
				}""",
	"""				switch (event.currentTarget) {
					case this.btnPrevValue:
						this.moveEditValue(this.currentIndex - 1);

						/* Premiere valeur atteinte : le bouton devient gris, le focus passe a l'autre */
						if (this.btnPrevValue?.disabled) {
							this.btnNextValue?.focus();
						}
						break;
					case this.btnNextValue:
						this.moveEditValue(this.currentIndex + 1);

						if (this.btnNextValue?.disabled) {
							this.btnPrevValue?.focus();
						}
						break;
				}""",
	'focus sur le chevron actif')

# 5. Retour des choix vers les reglages : vue et focus retrouves
replace('pages/toolbar.component.ts',
	"""	private changeRouteEvent = (event: Event): void => {
		let newRoute = (event as CustomEvent).detail.route;
		this.header?.focus();""",
	"""	private changeRouteEvent = (event: Event): void => {
		let newRoute = (event as CustomEvent).detail.route;
		const previousRoute = routeServiceInstance.currentRoute;
		this.header?.focus();""",
	'memorisation de la page quittee')

replace('pages/toolbar.component.ts',
	"""		if ((event as CustomEvent).detail.setting) {
			const editSettingElement: HTMLElement = (this.querySelector(`app-${PAGE_EDIT_SETTING}`) as HTMLElement);
			editSettingElement?.setAttribute('data-setting', (event as CustomEvent).detail.setting);
		}
	}""",
	"""		if ((event as CustomEvent).detail.setting) {
			const editSettingElement: HTMLElement = (this.querySelector(`app-${PAGE_EDIT_SETTING}`) as HTMLElement);
			editSettingElement?.setAttribute('data-setting', (event as CustomEvent).detail.setting);
		}

		if (newRoute === PAGE_SETTINGS && previousRoute === PAGE_EDIT_SETTING) {
			this.restoreSettingFocus();
		}
	}

	/* Retour depuis « Choix pour ce reglage » : la vue et le focus reviennent sur le bouton
	   multiclic du reglage que l'on vient de quitter. */
	private restoreSettingFocus = (): void => {
		localStorageServiceInstance.getItem('current-setting').then((setting: any) => {
			if (!setting) {
				return;
			}

			setTimeout(() => {
				const settingElement = this.querySelector(`app-btn-setting[data-name="${setting}"]`) as HTMLElement;
				const button = settingElement?.querySelector('button') as HTMLElement;

				if (!button) {
					return;
				}

				if (button.getClientRects().length === 0) {
					(settingElement.closest('.accordion-item')?.querySelector('button.accordion-button') as HTMLElement)?.click();
				}

				setTimeout(() => {
					button.focus();
					button.scrollIntoView({ block: 'center' });
				}, 50);
			});
		});
	}""",
	'retour sur le reglage quitte')

print('\n'.join(done))
