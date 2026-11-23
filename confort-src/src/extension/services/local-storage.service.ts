let localStorageServiceIsInstantiated: boolean;

class LocalStorageService {
	hostname: string = '';
	tabId: number;

	constructor() {
		if (localStorageServiceIsInstantiated) {
			throw new Error('LocalStorageService is already instantiated.');
		}

		localStorageServiceIsInstantiated = true;

		this.hostname = window.location.hostname;
		this.requestTabId();
	}

	/* The extension context can be invalidated (extension reloaded / updated,
	   service worker recycled after a long inactivity). Every chrome.* call must
	   then stop throwing, otherwise the whole toolbar dies and the user has to
	   restart the browser. */
	private isExtensionContextAlive = (): boolean => {
		try {
			// @ts-ignore
			return !!(chrome?.runtime?.id && chrome?.storage?.local);
		} catch (error) {
			return false;
		}
	}

	private requestTabId = (): void => {
		if (!this.isExtensionContextAlive()) {
			return;
		}

		try {
			chrome.runtime.sendMessage({ getTabId: true })
				.then(response => {
					this.tabId = response?.tabId;
				})
				.catch(() => { /* service worker asleep or context gone */ });
		} catch (error) { /* context gone */ }
	}

	private fallbackSetItem<T>(key: string, value: T): void {
		try {
			// @ts-ignore
			window.localStorage.setItem(`${PREFIX}${key}-${this.hostname}`, JSON.stringify(value));
		} catch (error) { /* storage unavailable (private mode, quota) */ }
	}

	private fallbackGetItem<T>(key: string): T {
		try {
			// @ts-ignore
			const raw = window.localStorage.getItem(`${PREFIX}${key}-${this.hostname}`);

			if (raw === null) {
				return undefined;
			}

			try {
				return JSON.parse(raw);
			} catch (error) {
				window.localStorage.removeItem(`${PREFIX}${key}-${this.hostname}`);
				return undefined;
			}
		} catch (error) {
			return undefined;
		}
	}

	setItem<T>(key: string, value: T): void {
		if (value === undefined) {
			return;
		}

		this.fallbackSetItem(key, value);

		if (!this.isExtensionContextAlive()) {
			this.notifyChange(key);
			return;
		}

		try {
			const writes: Promise<any>[] = [
				// @ts-ignore
				chrome.storage.local.set({ [`${PREFIX}${key}-${this.hostname}`]: value }),
				// @ts-ignore
				chrome.storage.local.set({ [`latest-${PREFIX}${key}`]: value })
			];

			// @note Special case to handle in-tab navigations and pause
			if (['is-opened', 'is-paused'].includes(key)) {
				if (!this.tabId) {
					this.requestTabId();
				} else {
					// @ts-ignore
					writes.push(chrome.storage.local.set({ [`${PREFIX}${key}-${this.tabId}`]: value }));
				}
			}

			/* The listeners read the value back: they must never be notified
			   before the write is done, they would get the previous value
			   (multi-click buttons were one step behind). */
			Promise.all(writes)
				.catch(() => { })
				.then(() => this.notifyChange(key));
		} catch (error) {
			this.notifyChange(key);
		}
	}

	private notifyChange = (key: string): void => {
		window.dispatchEvent(new CustomEvent(`storage-${key}`, { bubbles: true }));
	}

	getItem<T>(key: string): Promise<T> {
		if (!this.isExtensionContextAlive()) {
			return Promise.resolve(this.fallbackGetItem<T>(key));
		}

		try {
			// @note Special case to handle in-tab navigations and pause
			if (['is-opened', 'is-paused'].includes(key) && this.tabId) {
				//@ts-ignore
				return chrome.storage.local.get([`${PREFIX}${key}-${this.tabId}`])
					.then(datas => datas[`${PREFIX}${key}-${this.tabId}`])
					.catch(() => this.fallbackGetItem<T>(key));
			}

			//@ts-ignore
			return chrome.storage.local.get([`${PREFIX}${key}-${this.hostname}`]).then(datas => {
				if (datas[`${PREFIX}${key}-${this.hostname}`]) {
					return datas[`${PREFIX}${key}-${this.hostname}`];
				}

				// @ts-ignore
				return chrome.storage.local.get([`latest-${PREFIX}${key}`])
					.then(latest => latest[`latest-${PREFIX}${key}`]);
			}).catch(() => this.fallbackGetItem<T>(key));
		} catch (error) {
			return Promise.resolve(this.fallbackGetItem<T>(key));
		}
	}

	removeItem(key: string): void {
		try {
			// @ts-ignore
			window.localStorage.removeItem(`${PREFIX}${key}-${this.hostname}`);
		} catch (error) { /* storage unavailable */ }

		if (!this.isExtensionContextAlive()) {
			return;
		}

		try {
			//@ts-ignore
			chrome.storage.local.remove([
				`${PREFIX}${key}-${this.hostname}`,
				`latest-${PREFIX}${key}`
			])?.catch?.(() => { });
		} catch (error) { /* context gone */ }
	}
}
