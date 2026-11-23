let filesServiceIsInstantiated: boolean;

class FilesService {
	path: string = '';

	constructor() {
		if (filesServiceIsInstantiated) {
			throw new Error('FilesService is already instantiated.');
		}

		filesServiceIsInstantiated = true;
		const base = (window as any).__CONFORT_BASE__;
		this.path = base ? `${String(base).replace(/\/$/, '')}/` : `${window.location.origin}/`;
	}

	getJSONFile(file: string): Promise<string> {
		return fetch(`${this.path}assets/json/${file}.json`)
			.then(response => {
				return response.json();
			})
			.catch(error => {
				console.error(`Error when retrieving ${file}.json: ${error}.`);
				return error;
			});
	}
}

