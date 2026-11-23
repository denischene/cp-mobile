const editMagnifierLayout: HTMLTemplateElement = document.createElement('template');
editMagnifierLayout.innerHTML = `
	<form class="d-flex flex-column gap-4 text-center">
		<app-select-edit-value id="${PREFIX}select-magnifier-type" data-name="magnifierType" data-label="true"></app-select-edit-value>
		<app-select-edit-value id="${PREFIX}select-magnifier-level" data-name="magnifierLevel" data-label="true"></app-select-edit-value>
	</form>
`;

class EditMagnifierComponent extends HTMLElement {
	selectTypeElement: HTMLElement | null = null;
	selectLevelElement: HTMLElement | null = null;
	settingValues: string[] = null;
	typeValue = 'none';
	levelValue = 2;
	ready = false;

	magnifierTypes = ['none', MAGNIFIER_MOUSE, MAGNIFIER_FOCUS, MAGNIFIER_SCREEN];

	handler: any;

	constructor() {
		super();

		this.appendChild(editMagnifierLayout.content.cloneNode(true));

		this.handler = this.createHandler();
	}

	connectedCallback(): void {
		this.selectTypeElement = this.querySelector(`#${PREFIX}select-magnifier-type`);
		this.selectLevelElement = this.querySelector(`#${PREFIX}select-magnifier-level`);

		this.selectTypeElement.addEventListener('editSettingMagnifierType', this.handler);
		this.selectLevelElement.addEventListener('editSettingMagnifierLevel', this.handler);

		this.selectTypeElement.setAttribute('data-setting-values', this.magnifierTypes.join(','));

		modeOfUseServiceInstance.getSetting('magnifier').then((result: SettingModel) => {
			this.settingValues = result?.values?.split(',') ?? [];
			const currentValue = this.settingValues[result?.valueSelected];
			const parsed = magnifierServiceInstance.parseValue(currentValue);

			this.typeValue = parsed ? parsed.type : 'none';
			this.levelValue = parsed ? parsed.level : MAGNIFIER_RANGES[MAGNIFIER_MOUSE].min;

			this.setLevelValues();
			this.selectTypeElement.setAttribute('data-index', this.magnifierTypes.indexOf(this.typeValue).toString());
			this.ready = true;
		});
	}

	levelsForType = (type: string): string[] => {
		const range = MAGNIFIER_RANGES[type] ?? MAGNIFIER_RANGES[MAGNIFIER_MOUSE];
		const levels: string[] = [];

		for (let level = range.min; level <= range.max; level++) {
			levels.push(`x${level}`);
		}

		return levels;
	}

	setLevelValues = (): void => {
		if (this.typeValue === 'none') {
			this.selectLevelElement.style.display = 'none';
			return;
		}

		this.selectLevelElement.style.display = '';

		const levels = this.levelsForType(this.typeValue);
		const clamped = magnifierServiceInstance.clampLevel(this.typeValue, this.levelValue);
		this.levelValue = clamped;

		this.selectLevelElement.setAttribute('data-setting-values', levels.join(','));
		(this.selectLevelElement as any).moveEditValue(levels.indexOf(`x${clamped}`));
	}

	setMagnifier = (): void => {
		const value = this.typeValue === 'none' ? DEFAULT_VALUE : `${this.typeValue}_x${this.levelValue}`;
		const newSettingIndex = this.settingValues.indexOf(value);

		if (newSettingIndex !== -1) {
			modeOfUseServiceInstance.setSettingValue('magnifier', newSettingIndex, true);
		} else {
			modeOfUseServiceInstance.addSettingCustomValue('magnifier', 3, value)
				.then(() => magnifierServiceInstance.notifyCustomValue(this.typeValue, this.levelValue));
		}

		magnifierServiceInstance.setMagnifier(value);
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'editSettingMagnifierType':
					this.typeValue = event.detail.newValue;
					this.setLevelValues();
					if (this.ready) {
						this.setMagnifier();
					}
					break;
				case 'editSettingMagnifierLevel':
					this.levelValue = Number(event.detail.newValue?.replace(/\D/g, ''));
					if (this.ready) {
						this.setMagnifier();
					}
					break;
			}
		}
	}
}

customElements.define('app-edit-magnifier', EditMagnifierComponent);
