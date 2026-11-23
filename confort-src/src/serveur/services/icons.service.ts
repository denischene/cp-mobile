let iconsServiceIsInstantiated: boolean;

class IconsService {
	constructor() {
		if (iconsServiceIsInstantiated) {
			throw new Error('IconsService is already instantiated.');
		}

		iconsServiceIsInstantiated = true;
	}

	get path(): string {
		const base = (window as any).__CONFORT_BASE__;
		const root = base ? String(base).replace(/\/$/, '') : window.location.origin;

		return `${root}/assets/icons/orange-icons-sprite.svg`;
	}

	loadSprite(root: ShadowRoot): void { return; }
}
