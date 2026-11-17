import io

done = []


def replace(path, old, new, label):
    with io.open(path, encoding='utf-8') as handle:
        src = handle.read()

    if new in src:
        done.append(label + ' (deja applique)')
        return

    assert src.count(old) == 1, label

    with io.open(path, 'w', encoding='utf-8') as handle:
        handle.write(src.replace(old, new))

    done.append(label)


READ = '/app/confort-src/src/app/services/settings/read-aloud.service.ts'
MAG = '/app/confort-src/src/app/services/settings/magnifier.service.ts'
DOM = '/app/confort-src/src/app/services/dom.service.ts'
CONST = '/app/confort-src/src/app/core/constantes.core.ts'

# 1. Zones : on tabule d'une zone a l'autre
replace(READ,
	"""		leaves.slice(0, TEXT_BLOCK_MAX).forEach((zone: HTMLElement) => {
			if (!zone.hasAttribute('tabindex')) {
				this.markUnit(zone, true);
			}
		});
	}""",
	"""		leaves.slice(0, TEXT_BLOCK_MAX).forEach((zone: HTMLElement) => {
			if (!zone.hasAttribute('tabindex')) {
				this.markUnit(zone, true);
			}

			this.untabInside(zone);
		});
	}

	/* Les liens et boutons d'une zone sortent de l'ordre de tabulation : on passe d'une zone a la
	   suivante, sans rester prisonnier de la zone en cours. Les champs de saisie restent joignables. */
	private untabInside = (zone: HTMLElement): void => {
		zone.querySelectorAll(ZONE_UNTAB_SELECTOR).forEach((element: Element) => {
			const child = element as HTMLElement;

			if (child.dataset.cplusUntab || this.isInsideApp(child)) {
				return;
			}

			child.dataset.cplusUntab = child.getAttribute('tabindex') ?? 'none';
			child.setAttribute('tabindex', '-1');
		});
	}""",
	'tabulation de zone en zone')

replace(READ,
	"""	clearFocusUnits = (): void => {
		document.querySelectorAll('[data-cplus-tabindex]').forEach((element: Element) => {""",
	"""	clearFocusUnits = (): void => {
		document.querySelectorAll('[data-cplus-untab]').forEach((element: Element) => {
			const child = element as HTMLElement;
			const previous = child.dataset.cplusUntab;

			if (previous === 'none') {
				child.removeAttribute('tabindex');
			} else {
				child.setAttribute('tabindex', previous as string);
			}

			delete child.dataset.cplusUntab;
		});

		document.querySelectorAll('[data-cplus-tabindex]').forEach((element: Element) => {""",
	'retour des tabulations')

replace(READ,
	"""	private resolveSpeakTarget = (element: HTMLElement): HTMLElement | null => {
		if (this.currentValue === 'all') {
			const zone = element?.closest?.('[data-cplus-zone]') as HTMLElement;""",
	"""	private resolveSpeakTarget = (element: HTMLElement): HTMLElement | null => {
		if (this.currentValue === 'all') {
			/* Un champ de saisie garde la main : ni vocalisation de zone, ni reprise du focus */
			if (element?.matches?.('input, select, textarea, [contenteditable="true"]')) {
				return null;
			}

			const zone = element?.closest?.('[data-cplus-zone]') as HTMLElement;""",
	'champs de saisie epargnes')

replace(READ,
	"""		if (!target || document.activeElement === target || this.isInsideApp(target)) {
			return;
		}""",
	"""		/* Le focus n'est jamais repris a un element contenu dans la cible : la tabulation resterait
		   bloquee sur la meme unite. */
		if (!target || document.activeElement === target || this.isInsideApp(target)
			|| (document.activeElement && target.contains(document.activeElement))) {
			return;
		}""",
	'focus jamais repris aux enfants')

# 2. Defilement automatique apres une seconde
replace(CONST,
	"const MAGNIFIER_EXPLORE_WAIT = 2000;",
	"const MAGNIFIER_EXPLORE_WAIT = 1000;",
	'attente avant defilement')

replace(CONST,
	"const TEXT_BLOCK_FOCUSABLE_SELECTOR = ",
	"""const ZONE_UNTAB_SELECTOR = 'a[href], area[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"]';
const TEXT_FRAGMENT_CLASS = `${PREFIX}text-fragment`;
const TEXT_BLOCK_FOCUSABLE_SELECTOR = """,
	'constantes de decoupage')

# 3. Decoupage des blocs mixtes pour la loupe et les boutons de navigation
replace(DOM,
	"""			/* Un bloc qui contient deja un element focalisable n'en recoit pas : la tabulation
			   resterait prisonniere du bloc. */
			if (element.hasAttribute('tabindex')
				|| element.closest(APP_NAME)
				|| element.closest(`#${CONTAINER_BUTTONS_ID}`)
				|| element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| !element.textContent?.trim()) {
				continue;
			}

			element.setAttribute('tabindex', '0');
			element.setAttribute(flag, 'true');
			count++;
		}
	}

	clearTextBlocksFocusable = (flag: string): void => {
		document.body.querySelectorAll(`[${flag}]`).forEach((element: Element) => {
			element.removeAttribute('tabindex');
			element.removeAttribute(flag);
		});
	}""",
	"""			if (element.hasAttribute('tabindex')
				|| element.closest(APP_NAME)
				|| element.closest(`#${CONTAINER_BUTTONS_ID}`)
				|| !element.textContent?.trim()) {
				continue;
			}

			/* Un bloc qui contient un lien est decoupe : le texte qui precede, le lien lui-meme,
			   puis le texte qui suit, chacun focalisable a son tour. */
			if (element.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)) {
				count += this.wrapTextFragments(element, flag);
				continue;
			}

			element.setAttribute('tabindex', '0');
			element.setAttribute(flag, 'true');
			count++;
		}
	}

	private wrapTextFragments = (element: HTMLElement, flag: string): number => {
		const display = getComputedStyle(element).display;

		if (display.includes('flex') || display.includes('grid')) {
			return 0;
		}

		let group: Node[] = [];
		let count = 0;

		const flush = () => {
			const text = group.map((node: Node) => node.textContent).join('');

			if (group.length > 0 && /[\\p{L}\\p{N}]/u.test(text)) {
				const fragment = document.createElement('span');
				fragment.classList.add(TEXT_FRAGMENT_CLASS);
				fragment.setAttribute('tabindex', '0');
				fragment.setAttribute(flag, 'true');
				group[0].parentNode?.insertBefore(fragment, group[0]);
				group.forEach((node: Node) => fragment.appendChild(node));
				count++;
			}

			group = [];
		};

		Array.from(element.childNodes).forEach((node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				group.push(node);
				return;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return;
			}

			const child = node as HTMLElement;

			if (child.classList.contains(TEXT_FRAGMENT_CLASS)
				|| child.matches(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| child.querySelector(TEXT_BLOCK_FOCUSABLE_SELECTOR)
				|| getComputedStyle(child).display.includes('block')) {
				flush();
				return;
			}

			group.push(node);
		});

		flush();

		return count;
	}

	clearTextBlocksFocusable = (flag: string): void => {
		document.body.querySelectorAll(`[${flag}]`).forEach((element: Element) => {
			element.removeAttribute('tabindex');
			element.removeAttribute(flag);

			if (element.classList.contains(TEXT_FRAGMENT_CLASS)) {
				element.replaceWith(...Array.from(element.childNodes));
			}
		});
	}""",
	'fragments autour des liens')

# 4. Les boutons de navigation ne posent pas la loupe sous la souris
replace(MAG,
	"""		if (!this.type || !target || this.root?.contains(target) || target.tagName?.toLowerCase() === APP_NAME) {
			return;
		}""",
	"""		if (!this.type || !target || this.isOwnUi(target)) {
			return;
		}""",
	'clic hors interface Confort+')

replace(MAG,
	"""	focusFromPoint = (target: HTMLElement, x: number, y: number): void => {""",
	"""	/* Palette Confort+ et boutons de navigation : la loupe ne s'y pose pas, un clic sur Precedent
	   ou Suivant ne doit pas deplacer la loupe sous la souris. */
	isOwnUi = (target: HTMLElement): boolean => {
		return !!this.root?.contains(target)
			|| target.tagName?.toLowerCase() === APP_NAME
			|| !!target.closest?.(APP_NAME)
			|| !!target.closest?.(`#${CONTAINER_BUTTONS_ID}`);
	}

	focusFromPoint = (target: HTMLElement, x: number, y: number): void => {""",
	'detection interface Confort+')

replace(MAG,
	"""				case 'pointerdown':
					this.clientX = event.clientX;
					this.clientY = event.clientY;
					if (this.root?.contains(event.target) || this.pending) {
						return;
					}""",
	"""				case 'pointerdown':
					if (this.isOwnUi(event.target as HTMLElement)) {
						return;
					}
					this.clientX = event.clientX;
					this.clientY = event.clientY;
					if (this.pending) {
						return;
					}""",
	'pointeur hors interface')

replace(MAG,
	"""				case 'pointermove':
					this.clientX = event.clientX;
					this.clientY = event.clientY;""",
	"""				case 'pointermove':
					if (this.isOwnUi(event.target as HTMLElement)) {
						return;
					}
					this.clientX = event.clientX;
					this.clientY = event.clientY;""",
	'survol hors interface')

print('\n'.join(done))
