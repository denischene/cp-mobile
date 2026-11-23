let pathServiceIsInstantiated: boolean;

class PathService {
	path: string = '';

	constructor() {
		if (pathServiceIsInstantiated) {
			throw new Error('PathService is already instantiated.');
		}

		pathServiceIsInstantiated = true;

		const base = (window as any).__CONFORT_BASE__;
		this.path = base ? `${String(base).replace(/\/$/, '')}/` : `${window.location.origin}/`;
	}
}

