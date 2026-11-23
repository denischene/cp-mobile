const modesLayout: HTMLTemplateElement = document.createElement('template');
modesLayout.innerHTML = `
<form class="p-3">
	<fieldset class="d-grid gap-2 mb-4 text-body">
		<legend class="fs-6 fw-normal" data-i18n="chooseModeAndValidate"></legend>
		<div id="select-mode-zone" class="d-grid gap-1">
		</div>
	</fieldset>
</form>
`;

class ModesComponent extends HTMLElement {
	static observedAttributes = ['data-modes'];
	selectModeForm: HTMLFormElement | null = null;
	selectModeZone: HTMLElement | null = null;

	handler: any;

	constructor() {
		super();
		this.appendChild(modesLayout.content.cloneNode(true));

		this.handler = this.createHandler();
	}

	connectedCallback(): void {
		this.selectModeForm = this.querySelector('form');
		this.selectModeZone = this.querySelector('#select-mode-zone');

		this.selectModeForm?.addEventListener('submit', this.handler);
		this.selectModeZone?.addEventListener('change', this.handler);
	}

	disconnectedCallback(): void {
		this.selectModeForm?.removeEventListener('submit', this.handler);
		this.selectModeZone?.removeEventListener('change', this.handler);
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
		if ('data-modes' === name) {
			const modes = safeJsonParse(newValue);

			if (!modes?.modes) {
				return;
			}

			this.displayListMode(modes);
		}
	}

	displayListMode = (json: ModeOfUseModel): void => {
		const listMode = json.modes;
		const selectedMode = json.selectedMode ? json.selectedMode : DEFAULT_MODE;
		let radioModeList = '';
		listMode.forEach((mode: any) => {
			let settingsList = Object.entries(mode)[0][1] as [];
			let disabled = settingsList.length === 0;
			let isChecked = Object.keys(mode)[0] === selectedMode;
			let radioMode = `<app-select-mode data-label="${Object.keys(mode)[0]}" data-checked="${isChecked}" data-active="${json.selectedMode === mode}" data-disabled="${disabled}"></app-select-mode>`;
			radioModeList = radioModeList + radioMode;
		});
		this.selectModeZone!.innerHTML = radioModeList;

		/* A l'arrivee, le focus est pose sur le mode deplie (celui en cours ou le mode par defaut) */
		setTimeout(() => (this.querySelector('input:checked') as HTMLElement)?.focus());
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'submit':
					this.selectModeFormEvent(event);
					break;
				case 'change':
					this.keepSingleChoice(event.target as HTMLInputElement);
					break;
			}
		}
	}

	/* Un seul mode coche a la fois, les modes n'etant plus regroupes par un nom commun */
	private keepSingleChoice = (input: HTMLInputElement): void => {
		if (!input?.checked) {
			return;
		}

		this.selectModeZone?.querySelectorAll('input[type="radio"]').forEach((other: Element) => {
			if (other !== input) {
				(other as HTMLInputElement).checked = false;
			}
		});
	}

	private selectModeFormEvent = (event: Event): void => {
		event.preventDefault();
		const selectedModeName = (this.querySelector('input:checked') as HTMLInputElement).value;
		modeOfUseServiceInstance.setSelectedMode(selectedModeName);
		localStorageServiceInstance.setItem('current-category', null);
		let clickEvent = new CustomEvent('changeRoute',
			{
				bubbles: true,
				detail: {
					route: PAGE_HOME,
					mode: selectedModeName
				}
			});
		this.dispatchEvent(clickEvent);
	}
}

customElements.define('app-modes', ModesComponent);
