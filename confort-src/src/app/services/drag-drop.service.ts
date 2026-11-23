let dragDropServiceIsInstantiated: boolean;

class DragDropService {
	button: HTMLElement | null = null;
	isDragging = false;
	isEnabled = false;
	justDragged = false;
	isKeyboardMoving = false;
	positionRestored = false;
	offsetX = 0;
	offsetY = 0;
	initialPointerX = 0;
	initialPointerY = 0;

	handlerPointerDown: any;
	handlerPointerMove: any;
	handlerPointerUp: any;
	handlerClick: any;
	handlerResize: any;
	handlerTouchMove: any;
	handlerKeyDown: any;
	handlerKeyUp: any;
	handlerBlur: any;

	constructor() {
		if (dragDropServiceIsInstantiated) {
			throw new Error('DragDropService is already instantiated.');
		}

		dragDropServiceIsInstantiated = true;

		this.handlerPointerDown = this.onPointerDown.bind(this);
		this.handlerPointerMove = this.onPointerMove.bind(this);
		this.handlerPointerUp = this.onPointerUp.bind(this);
		this.handlerClick = this.onClickCapture.bind(this);
		this.handlerResize = this.onResize.bind(this);
		this.handlerTouchMove = this.onTouchMove.bind(this);
		this.handlerKeyDown = this.onKeyDown.bind(this);
		this.handlerKeyUp = this.onKeyUp.bind(this);
		this.handlerBlur = this.onBlur.bind(this);
	}

	init = (button: HTMLElement): void => {
		this.button = button;
		this.restorePosition();
	}

	enable = (): void => {
		if (!this.button || this.isEnabled) {
			return;
		}
		this.isEnabled = true;
		this.button.addEventListener('pointerdown', this.handlerPointerDown);
		this.button.addEventListener('click', this.handlerClick, true);
		this.button.addEventListener('keydown', this.handlerKeyDown);
		this.button.addEventListener('keyup', this.handlerKeyUp);
		this.button.addEventListener('blur', this.handlerBlur);
		window.addEventListener('resize', this.handlerResize);
		this.clampPosition();
	}

	disable = (): void => {
		if (!this.button || !this.isEnabled) {
			return;
		}
		this.isEnabled = false;
		this.button.removeEventListener('pointerdown', this.handlerPointerDown);
		this.button.removeEventListener('click', this.handlerClick, true);
		this.button.removeEventListener('keydown', this.handlerKeyDown);
		this.button.removeEventListener('keyup', this.handlerKeyUp);
		this.button.removeEventListener('blur', this.handlerBlur);
		this.button.removeEventListener('touchmove', this.handlerTouchMove);
		document.removeEventListener('pointermove', this.handlerPointerMove);
		document.removeEventListener('pointerup', this.handlerPointerUp);
		window.removeEventListener('resize', this.handlerResize);
		this.isDragging = false;
		this.justDragged = false;
		this.stopKeyboardMove(false);
		if (this.button) {
			this.button.style.cursor = 'grab';
		}
	}

	private onPointerDown = (event: PointerEvent): void => {
		if (!this.button || !this.isEnabled) {
			return;
		}

		this.isDragging = false;
		this.justDragged = false;
		this.initialPointerX = event.clientX;
		this.initialPointerY = event.clientY;

		const rect = this.button.getBoundingClientRect();
		this.offsetX = event.clientX - rect.left;
		this.offsetY = event.clientY - rect.top;

		try {
			this.button.setPointerCapture(event.pointerId);
		} catch (e) { }

		document.addEventListener('pointermove', this.handlerPointerMove);
		document.addEventListener('pointerup', this.handlerPointerUp);
		this.button.addEventListener('touchmove', this.handlerTouchMove, { passive: false });

		this.button.style.cursor = 'grabbing';
		event.preventDefault();
	}

	private onPointerMove = (event: PointerEvent): void => {
		if (!this.button) {
			return;
		}

		const deltaX = Math.abs(event.clientX - this.initialPointerX);
		const deltaY = Math.abs(event.clientY - this.initialPointerY);

		if (deltaX > BTN_CPLUS_DRAG_TRESHOLD || deltaY > BTN_CPLUS_DRAG_TRESHOLD) {
			this.isDragging = true;
			this.button.classList.add(BTN_CPLUS_MOVING_CLASS);
		}

		this.moveTo(event.clientX - this.offsetX, event.clientY - this.offsetY);

		event.preventDefault();
	}

	/* Mobile: while the pointer drags the button the page must not scroll */
	private onTouchMove = (event: TouchEvent): void => {
		event.preventDefault();
	}

	private onPointerUp = (event: PointerEvent): void => {
		if (!this.button) {
			return;
		}

		document.removeEventListener('pointermove', this.handlerPointerMove);
		document.removeEventListener('pointerup', this.handlerPointerUp);
		this.button.removeEventListener('touchmove', this.handlerTouchMove);

		try {
			this.button.releasePointerCapture(event.pointerId);
		} catch (e) { }

		this.button.style.cursor = 'grab';

		if (!this.isKeyboardMoving) {
			this.button.classList.remove(BTN_CPLUS_MOVING_CLASS);
		}

		if (this.isDragging) {
			this.justDragged = true;
			this.savePosition();
			event.preventDefault();
			event.stopPropagation();

			setTimeout(() => {
				this.justDragged = false;
			}, 100);
		}

		this.isDragging = false;
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		if (!this.button || !this.isEnabled) {
			return;
		}

		const isSpace = event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

		if (isSpace) {
			event.preventDefault();
			event.stopPropagation();
			if (this.isKeyboardMoving) {
				this.stopKeyboardMove(true);
			} else {
				this.startKeyboardMove();
			}
			return;
		}

		if (!this.isKeyboardMoving) {
			return;
		}

		if (event.key === 'Escape' || event.key === 'Esc') {
			event.preventDefault();
			event.stopPropagation();
			this.stopKeyboardMove(true);
			return;
		}

		const step = event.shiftKey ? BTN_CPLUS_KEYBOARD_STEP * 4 : BTN_CPLUS_KEYBOARD_STEP;
		const rect = this.button.getBoundingClientRect();
		let deltaX = 0;
		let deltaY = 0;

		switch (event.key) {
			case 'ArrowUp':
				deltaY = -step;
				break;
			case 'ArrowDown':
				deltaY = step;
				break;
			case 'ArrowLeft':
				deltaX = -step;
				break;
			case 'ArrowRight':
				deltaX = step;
				break;
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.moveTo(rect.left + deltaX, rect.top + deltaY);
	}

	private onKeyUp = (event: KeyboardEvent): void => {
		const isSpace = event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';
		if (isSpace) {
			/* Prevents the native click triggered by Space on a <button> */
			event.preventDefault();
			event.stopPropagation();
		}
	}

	private onBlur = (): void => {
		if (this.isKeyboardMoving) {
			this.stopKeyboardMove(true);
		}
	}

	private startKeyboardMove = (): void => {
		this.isKeyboardMoving = true;
		this.button?.classList.add(BTN_CPLUS_MOVING_CLASS);
	}

	private stopKeyboardMove = (save: boolean): void => {
		if (!this.isKeyboardMoving) {
			return;
		}
		this.isKeyboardMoving = false;
		this.button?.classList.remove(BTN_CPLUS_MOVING_CLASS);
		if (save) {
			this.savePosition();
			this.justDragged = true;
			setTimeout(() => {
				this.justDragged = false;
			}, 100);
		}
	}

	private moveTo = (x: number, y: number): void => {
		if (!this.button) {
			return;
		}

		const newX = this.clamp(x, this.getMaxX());
		const newY = this.clamp(y, this.getMaxY());

		this.button.style.left = `${newX}px`;
		this.button.style.top = `${newY}px`;
		this.button.style.right = 'auto';
		this.button.style.bottom = 'auto';
	}

	private onClickCapture = (event: PointerEvent): void => {
		if (this.justDragged || this.isKeyboardMoving) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		}
	}

	private onResize = (): void => {
		this.clampPosition();
		this.avoidButtons();
	}

	/* Pastille posee sur les boutons de navigation : elle remonte juste au-dessus d'eux, sans
	   ecraser la position choisie par l'utilisateur (elle revient quand les boutons disparaissent). */
	avoidButtons = (): void => {
		const container = document.querySelector(`#${CONTAINER_BUTTONS_ID}`) as HTMLElement;

		if (!this.button || !container) {
			return;
		}

		const rect = this.button.getBoundingClientRect();
		const zone = container.getBoundingClientRect();

		if (!rect.height || !zone.height) {
			return;
		}

		const overlap = rect.right > zone.left - BTN_CPLUS_BUTTONS_MARGIN
			&& rect.left < zone.right + BTN_CPLUS_BUTTONS_MARGIN
			&& rect.bottom > zone.top - BTN_CPLUS_BUTTONS_MARGIN
			&& rect.top < zone.bottom + BTN_CPLUS_BUTTONS_MARGIN;

		if (!overlap) {
			return;
		}

		this.moveTo(rect.left, Math.max(0, zone.top - rect.height - BTN_CPLUS_BUTTONS_MARGIN));
	}

	/* Position enregistree, rappelee quand les boutons de navigation disparaissent */
	refreshPosition = (): void => {
		this.restorePosition();
	}

	private clampPosition = (): void => {
		if (!this.button || !this.positionRestored) {
			return;
		}

		const rect = this.button.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			return;
		}

		const maxX = this.getMaxX();
		const maxY = this.getMaxY();

		let currentLeft = parseFloat(this.button.style.left) || rect.left;
		let currentTop = parseFloat(this.button.style.top) || rect.top;

		if (this.button.style.left === '' || this.button.style.top === '') {
			currentLeft = rect.left;
			currentTop = rect.top;
		}

		const newX = this.clamp(currentLeft, maxX);
		const newY = this.clamp(currentTop, maxY);

		this.button.style.left = `${newX}px`;
		this.button.style.top = `${newY}px`;
		this.button.style.right = 'auto';
		this.button.style.bottom = 'auto';

		this.savePosition();
	}

	private savePosition = (): void => {
		if (!this.button) {
			return;
		}
		const rect = this.button.getBoundingClientRect();
		localStorageServiceInstance.setItem('button-position-x', rect.left.toString());
		localStorageServiceInstance.setItem('button-position-y', rect.top.toString());
	}

	private restorePosition = (): void => {
		if (!this.button) {
			return;
		}

		Promise.all([
			localStorageServiceInstance.getItem('button-position-x'),
			localStorageServiceInstance.getItem('button-position-y')
		]).then(([savedX, savedY]) => {
			this.positionRestored = true;
			if (savedX && savedY) {
				let x = parseFloat(savedX as string);
				let y = parseFloat(savedY as string);

				const maxX = this.getMaxX();
				const maxY = this.getMaxY();

				x = this.clamp(x, maxX);
				y = this.clamp(y, maxY);

				this.button.style.left = `${x}px`;
				this.button.style.top = `${y}px`;
				this.button.style.right = 'auto';
				this.button.style.bottom = 'auto';
			} else if (this.isMobileViewport()) {
				/* Mobile default position: bottom right corner */
				this.button.style.left = 'auto';
				this.button.style.top = 'auto';
				this.button.style.bottom = BTN_CPLUS_POS_DEFAULT;
				this.button.style.right = BTN_CPLUS_POS_DEFAULT;
			} else {
				this.button.style.left = 'auto';
				this.button.style.bottom = 'auto';
				this.button.style.top = BTN_CPLUS_POS_DEFAULT;
				this.button.style.right = BTN_CPLUS_POS_DEFAULT;
			}
		});
	}

	private isMobileViewport = (): boolean => {
		return window.matchMedia('(max-width: 36em), (pointer: coarse)').matches;
	}

	private getMaxX = (): number => {
		return window.innerWidth - this.button.offsetWidth - BTN_CPLUS_SCROLLBAR_MARGIN;
	}

	private getMaxY = (): number => {
		return window.innerHeight - this.button.offsetHeight;
	}

	private clamp (value: number, max: number, min = 0) {
		return Math.max(min, Math.min(value, max));
	}
}
