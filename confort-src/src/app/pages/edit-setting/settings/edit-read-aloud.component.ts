const editReadAloudLayout: HTMLTemplateElement = document.createElement('template');
editReadAloudLayout.innerHTML = `
	<form>
		<p class="fs-5 fw-bold mb-0" data-i18n="readAloud_scope_label"></p>
		<app-select-edit-value data-name="readAloud"></app-select-edit-value>

		<div id="${PREFIX}read-aloud-duration" class="mt-3">
			<p class="fs-5 fw-bold mb-0" data-i18n="readAloud_duration_label"></p>
			<app-select-edit-value data-name="readAloudDuration"></app-select-edit-value>
		</div>
	</form>
`;

class EditReadAloudComponent extends HTMLElement {
	selectReadAloudElement: HTMLElement | null = null;
	selectDurationElement: HTMLElement | null = null;
	durationContainer: HTMLElement | null = null;
	settingValues: string[] = null;
	durationValues: string[] = null;
	readAloudValues = [DEFAULT_VALUE, 'word', 'sentence', 'paragraph', 'all'];
	readAloudDurationValues = ['onDemand', 'always'];

	handler: any;

	constructor() {
		super();

		this.appendChild(editReadAloudLayout.content.cloneNode(true));

		this.handler = this.createHandler();
	}

	connectedCallback(): void {
		this.selectReadAloudElement = this.querySelector('app-select-edit-value[data-name="readAloud"]');
		this.selectDurationElement = this.querySelector('app-select-edit-value[data-name="readAloudDuration"]');
		this.durationContainer = this.querySelector(`#${PREFIX}read-aloud-duration`);

		this.selectReadAloudElement.addEventListener('editSettingReadAloud', this.handler);
		this.selectDurationElement.addEventListener('editSettingReadAloudDuration', this.handler);

		this.selectReadAloudElement.setAttribute('data-setting-values', this.readAloudValues.join(','));
		this.selectDurationElement.setAttribute('data-setting-values', this.readAloudDurationValues.join(','));

		modeOfUseServiceInstance.getSetting('readAloud').then((result: SettingModel) => {
			this.settingValues = result.values.split(',');
			const currentIndex = this.readAloudValues.findIndex(i => i === this.settingValues[result.valueSelected]);

			this.selectReadAloudElement.setAttribute('data-index', currentIndex.toString());
			this.toggleDuration(this.settingValues[result.valueSelected]);
		});

		modeOfUseServiceInstance.getSetting('readAloudDuration').then((result: SettingModel) => {
			this.durationValues = result?.values?.split(',') || this.readAloudDurationValues;
			const currentIndex = Math.max(0, this.readAloudDurationValues.indexOf(this.durationValues[result?.valueSelected ?? 0]));

			this.selectDurationElement.setAttribute('data-index', currentIndex.toString());
		});
	}

	/* Sans vocalisation : la durée n'a plus d'objet */
	toggleDuration = (value: string): void => {
		this.durationContainer?.classList.toggle('d-none', !value || value === DEFAULT_VALUE);
	}

	setReadAloud = (value: string): void => {
		let newSettingIndex = this.settingValues.indexOf(value);

		if (newSettingIndex !== -1) {
			modeOfUseServiceInstance.setSettingValue('readAloud', newSettingIndex, true);
		} else {
			modeOfUseServiceInstance.addSettingCustomValue('readAloud', 3, value);
		}

		this.toggleDuration(value);
		readAloudServiceInstance.setReadAloud(value);
	}

	setDuration = (value: string): void => {
		const newSettingIndex = (this.durationValues || this.readAloudDurationValues).indexOf(value);

		if (newSettingIndex !== -1) {
			modeOfUseServiceInstance.setSettingValue('readAloudDuration', newSettingIndex);
		}

		readAloudServiceInstance.setDuration(value);
	}

	private createHandler = () => {
		return (event: any) => {
			switch (event.type) {
				case 'editSettingReadAloud':
					this.setReadAloud(event.detail.newValue);
					break;
				case 'editSettingReadAloudDuration':
					this.setDuration(event.detail.newValue);
					break;
			}
		}
	}
}

customElements.define('app-edit-read-aloud', EditReadAloudComponent);
