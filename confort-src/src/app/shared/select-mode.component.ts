const selectModeLayout: HTMLTemplateElement = document.createElement('template');
selectModeLayout.innerHTML = `
	<input type="radio" name="modes" class="sc-select-mode__input">
	<div class="d-flex flex-column align-items-start gap-1 p-2 position-relative sc-select-mode__label btn btn-tertiary">
		<label class="stretched-link">
			<div class="d-flex align-items-center gap-2 w-100">
				<app-icon data-size="2em"></app-icon>
				<span class="fs-5 text flex-fill"></span>
			</div>
			<span class="fs-6 fw-normal m-0 mb-3"></span>
		</label>
		<button class="btn btn-primary position-relative z-1" type="submit"></button>
	</div>
`;

class SelectModeComponent extends HTMLElement {
	inputElement: HTMLInputElement = null;
	submitBtnElement: HTMLButtonElement = null;
	iconElement: HTMLElement = null;
	labelElement: HTMLLabelElement = null;
	textElement: HTMLElement = null;
	descriptionElement: HTMLElement = null;
	label = '';
	checked = false;
	disabled = false;
	active = false;

	constructor() {
		super();

		this.label = this.dataset?.label || this.label;
		this.checked = (this.dataset?.checked === 'true') || this.checked;
		this.disabled = (this.dataset?.disabled === 'true') || this.disabled;
		this.active = (this.dataset?.active === 'true') || this.active;

		this.appendChild(selectModeLayout.content.cloneNode(true));
	}

	connectedCallback(): void {
		this.inputElement = this.querySelector('input');
		this.submitBtnElement = this.querySelector('button');
		this.labelElement = this.querySelector('label');
		this.iconElement = this.querySelector('app-icon');
		this.textElement = this.querySelector('app-icon + span');
		this.descriptionElement = this.querySelector('label > span');

		this.inputElement!.id = stringServiceInstance.normalizeID(this.label);
		this.inputElement!.value = this.label;
		/* Un nom propre a chaque mode : dans un groupe de boutons radio, seul le mode coche serait
		   atteignable a la tabulation. L'exclusivite est retablie par la page des modes d'usage. */
		this.inputElement!.name = `modes-${stringServiceInstance.normalizeID(this.label)}`;
		this.inputElement!.checked = this.checked;
		this.inputElement!.disabled = this.disabled;
		/* Chaque mode selectionnable est atteignable a la tabulation (et non le seul mode coche,
		   comportement habituel d'un groupe de boutons radio). */
		this.inputElement!.tabIndex = this.disabled ? -1 : 0;
		this.submitBtnElement!.disabled = this.disabled;
		this.inputElement?.addEventListener('keydown', this.handleKey);
		this.submitBtnElement.innerText = i18nServiceInstance.getMessage(this.active ? 'resetThisMode' : 'validateThisMode');
		this.submitBtnElement.title = this.active ? i18nServiceInstance.getMessage('resetThisModeTitle') : '';
		this.labelElement?.setAttribute('for', stringServiceInstance.normalizeID(this.label));
		this.iconElement?.setAttribute('data-name', `${this.label}_border`);
		this.textElement!.innerText = i18nServiceInstance.getMessage(`${this.label}Name`);
		this.descriptionElement!.innerText = i18nServiceInstance.getMessage(`${this.label}Description`);

		if (this.active) {
			this.setActiveState();
		}
	}

	disconnectedCallback(): void {
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

	setActiveState = (): void => {
		let span: HTMLSpanElement = document.createElement('span');
		span.classList.add('fs-5', 'text');
		span.innerText = i18nServiceInstance.getMessage('activeMode');
		this.querySelector('label div').appendChild(span);
	}
}

customElements.define('app-select-mode', SelectModeComponent);
