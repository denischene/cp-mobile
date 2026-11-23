let localStorageServiceIsInstantiated: boolean;

class LocalStorageService {
	constructor() {
		if (localStorageServiceIsInstantiated) {
			throw new Error('LocalStorageService is already instantiated.');
		}

		localStorageServiceIsInstantiated = true;
	}

	setItem<T>(key: string, value: T): void {
		if (value === undefined) {
			return;
		}

		try {
			//@ts-ignore
			localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
		} catch (error) { /* quota or private mode */ }
		let storeEvent = new CustomEvent(`storage-${key}`,
			{
				bubbles: true
			});
		window.dispatchEvent(storeEvent);
	}

	getItem<T>(key: string): Promise<T> {
		// @ts-ignore
		const raw = localStorage.getItem(`${PREFIX}${key}`);
		// @ts-ignore
		const value = safeJsonParse(raw, undefined);

		/* Self healing: a corrupted value is removed instead of breaking the app */
		if (raw !== null && value === undefined) {
			this.removeItem(key);
		}

		return Promise.resolve(value as T);
	}

	removeItem(key: string): void {
		//@ts-ignore
		localStorage.removeItem(`${PREFIX}${key}`);
	}
}
