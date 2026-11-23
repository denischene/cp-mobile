// @ts-nocheck
// @todo trouver comment éviter les erreurs à la compilation causé par la différence de répertoire
// Exemple: erreur si un service utilise une constante de ce fichier
const PREFIX = 'cplus-';

/* JSON.parse on an attribute or a storage value must never break the toolbar:
   a corrupted value (the literal 'undefined') used to kill the whole palette. */
const safeJsonParse = (value: any, fallback: any = null): any => {
	if (value === null || value === undefined || value === 'undefined' || value === 'null' || value === '') {
		return fallback;
	}

	if (typeof value !== 'string') {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch (error) {
		console.info('Confort+: invalid JSON value ignored.', value);
		return fallback;
	}
};
const JSON_NAME = 'modeOfUse';
const DEFAULT_VALUE = 'noModifications';
const DEFAULT_MODE = 'facilePlus';
const APP_NAME = `${PREFIX}app-root`;
const VERSION = '6.0.0.1';

const PAGE_HOME = 'home';
const PAGE_MODES = 'modes';
const PAGE_SETTINGS = 'settings';
const PAGE_EDIT_SETTING = 'edit-setting';
const PAGE_P_MARKUP_SELECTOR = `body > :not([id^=${PREFIX}]) p, body > p`;

const FOCUS_SIZE_BIG = '4px';
const FOCUS_SIZE_HUGE = '10px';
const CURSOR_SIZE_BIG = 56;
const CURSOR_SIZE_HUGE = 128;
const SCROLL_SIZE_BIG = '32px';
const SCROLL_SIZE_HUGE = '48px';

const BTN_CPLUS_SCROLLBAR_MARGIN = 26;
const BTN_CPLUS_POS_DEFAULT = '1em';
const BTN_CPLUS_DRAG_TRESHOLD = 5;
const BTN_CPLUS_KEYBOARD_STEP = 16;
const BTN_CPLUS_MOVING_CLASS = 'sc-confort-plus--moving';

/* Minimum size (px) above which a click target is already considered big enough */
const CLICK_FACILITE_MIN_TARGET = 44;
const CLICK_FACILITE_TARGETS = `a[href], area[href], button, select, summary,
	input:not([type="hidden"]), textarea, label[for],
	[role="button"], [role="link"], [role="listbox"], [role="combobox"], [role="option"], [role="tab"]`;

const READ_ALOUD_MIN_CONTRAST = 4.5;

/* Loupes : trois types reliés par une continuité de zoom (×2 → ×20) */
const MAGNIFIER_MOUSE = 'mouse';
const MAGNIFIER_FOCUS = 'focus';
const MAGNIFIER_SCREEN = 'screen';
const MAGNIFIER_TYPES = [MAGNIFIER_MOUSE, MAGNIFIER_FOCUS, MAGNIFIER_SCREEN];
const MAGNIFIER_RANGES: { [key: string]: { min: number, max: number } } = {
        [MAGNIFIER_MOUSE]: { min: 2, max: 4 },
        [MAGNIFIER_FOCUS]: { min: 2, max: 9 },
        [MAGNIFIER_SCREEN]: { min: 8, max: 20 }
};
/* Niveau d'entrée lorsqu'on franchit le maximum du type précédent */
const MAGNIFIER_ENTRY_LEVEL: { [key: string]: number } = {
        [MAGNIFIER_FOCUS]: 5,
        [MAGNIFIER_SCREEN]: 10
};
/* Zoom navigateur ajouté (%) au-dessus du zoom choisi par l'utilisateur */
const MAGNIFIER_BROWSER_ZOOM: { [key: string]: number } = {
        [MAGNIFIER_MOUSE]: 0,
        [MAGNIFIER_FOCUS]: 10,
        [MAGNIFIER_SCREEN]: 30
};
const MAGNIFIER_LEVEL_MIN = 2;
const MAGNIFIER_LEVEL_MAX = 20;
/* Niveau de repli quand la copie de page devient trop lente */
const MAGNIFIER_SAFE_LEVEL = 12;
const MAGNIFIER_SLOW_CLONE_MS = 400;
const MAGNIFIER_ROOT_ID = `${PREFIX}magnifier-root`;
const MAGNIFIER_BUBBLE_SIZE = 280;
const MAGNIFIER_KEYBOARD_STEP = 40;
const MAGNIFIER_KEYBOARD_FINE_STEP = 8;
const MAGNIFIER_CONTROLS_DELAY = 3000;
const MAGNIFIER_BADGE_DELAY = 2000;
/* Butées de page et fenêtre d'activation du second clic */
const MAGNIFIER_EDGE_SIZE = 12;
const MAGNIFIER_ARM_DELAY = 1500;
const MAGNIFIER_ACTIONABLE_SELECTOR = 'a[href], button, input, select, textarea, summary, label, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="option"], [onclick], [tabindex]:not([tabindex="-1"])';
/* Fenêtre du Focus-loupe et infobulles de transition */
const MAGNIFIER_FOCUS_PADDING = 32;
const MAGNIFIER_FOCUS_MIN_WIDTH = 220;
const MAGNIFIER_FOCUS_MIN_HEIGHT = 96;
const MAGNIFIER_HINT_DELAY = 5000;
/* Copie de page : cadres embarqués et éléments hors flux */
const MAGNIFIER_FRAME_MARGIN = 200;
const MAGNIFIER_MAX_DEPTH = 12;
/* Appui long sur mobile */
const MAGNIFIER_LONG_PRESS = 600;
const MAGNIFIER_LONG_PRESS_TOLERANCE = 12;
/* Defilement automatique du Focus-loupe */
const MAGNIFIER_EXPLORE_WAIT = 1000;
const MAGNIFIER_EXPLORE_FORWARD = 6000;
const MAGNIFIER_EXPLORE_BACK = 1200;
/* Pastille loupe posee sur le focus en attente, et curseurs de l'etat pending */
const MAGNIFIER_BADGE_WIDTH = 40;
const MAGNIFIER_BADGE_HEIGHT = 40;
/* Cadre pose sur l'element focalise en attente, et textes rendus focalisables */
const MAGNIFIER_FRAME_PADDING = 6;
const MAGNIFIER_TEXT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, blockquote, caption, td, th';
const MAGNIFIER_TEXT_MAX = 600;
const MAGNIFIER_TEXT_FLAG = `data-${PREFIX}magnifier-text`;
/* Copie de page : delai normal et rafraichissement rapide apres une activation */
const MAGNIFIER_CLONE_DELAY = 160;
const MAGNIFIER_CLONE_FAST = 60;
const MAGNIFIER_CLONE_SETTLE = 450;
const MAGNIFIER_BADGE_MAGNIFY = 'data:image/png;base64,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';
const MAGNIFIER_BADGE_VOCALIZE = 'data:image/png;base64,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';
const MAGNIFIER_CURSOR = 'data:image/png;base64,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';
const MAGNIFIER_CURSOR_VOCALIZE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFeklEQVR42qWXT0hUXxTHv+/eO2OlqTAz6ZQQhGTWwoWLhHE0JEti2giOG2cjrQSbTbsIJGgTBJHVYrQWrlQMkVr4Byqb/qyMcdE4uJJf6C9GkQIRx/fePb+N9/Lmn07+vjDw3rz7zv3cc8859zzgQMYRQo6cz6LRaDSZTCb3D1E6nU6Pj4+PNzQ0NLADAYABAN3d3d0oopmZmRl1bdu2ra6VgZGRkZH+/v5+lKh0Op3u6urqWl5eXpZSSgCAdYgmJiYmqqqqqsSBAEBdRyKRCB1DiUQi4Xa73ZrKsizLOUBKSVJKfb+ysrLS0tLSIoQQnHOuABYWFhZyxz99+pQaGxvJ5XKRz+ej3t5eSqVSRERk27a22dnZ2VkQ4M2bN3qQkyuTyWQGBwcHnQCpA8vKcH9/PwHI+505c4a+f/+e5YVoNBrVANKxXM45hcNh+v37NxERmaaZ9eLo6Oio2+12KwD1fGxsjACQy+UixhgBIMMwyOVyEQBqamqiTCZTGMA5QXV1NQGgS5cu0bdv37QnnFuyuLi4WFtbW5tKpVLKS9evXyfGGHHO8zyggObn5/MAWG6UZjIZcM6RSqXQ3t6O4eFhcM6VpwAAbW1tbfF4PE5E4JyDiPDz509IKUFEKJCyYIwhmUzmPcsD2Nvbg23bYIzBNE3cvXsXd+7cgWmaYIxBZWJ9fX29z+fzSilhGAY8Ho+eLFdEBCkl/H7/0QBqBWq1Qgi8evUKnZ2d+PXrFzjnsCwLAODxeDxq1ZFIJGvFCoQxBiklvF4vOjo6jgbIhbEsC0IIfPr0CcFgED9+/IAQQkOoyZqbm/VWERGICIwxGIaBsrIyPHv2DF6vt+hEWoXSCAAJIQgAeTwe+vjxIxER7e/vk5SStra26MqVK3qsx+MhwzD0/bVr1/LSOhwOhwsCOF/M/akILysro+npaVUf6MGDB3T58mW6ffs2LSws0Pb2Nq2srNDs7CxVVlbS6dOnKZlMZmXS2traWkGAU6dOFQVwppRhGDQ2NkZERLu7u0XL7sOHDwkAhcPhrP+PDaAgFMjLly/1dliWpWuGZVlkmib9+fOHzp49S0IIWlxcLAzgrIQnT548EkB5QG3J8+fPs/ZYlXZVJWOxGAGg8+fPFwbYdfiwoqLiyMk55ySEICGELrWPHz/WB44CUIeUaZrU1dVF9+/fPxrA5/PpFZbiCQXEOafXr1+rwLTW19fXDzuSFYA4qoFQuWzbti4uN2/exI0bN1BXV4fa2lp4vV5UV1fjoF0A5xxDQ0NDsVgsllsNVa1QErmdjlOcc116VUWrrKzE9PQ0Tpw4cSi4ZVnW7OzsbLHnS0tLSxpgb29vr6KiokKRGoahS+6FCxdw7tw5xONxMMaws7ODr1+/IhgMQkoJIYT2jGEYkFLqxYRCoVBJfdrm5uam2pu6ujq9t729vbS9va2PWxUXHR0deR1OT09PTzAYDDY2Njb6/X6/z+fzGYZh8ENUEMDv9xMAevLkSVaL9vnz56xC9OHDh6zUm5ubm1OGGWOsUCddkgeuXr1K796908Zt29YrbW1t1V5ob2/P80IgEAgoiL8C2NjY2FBGdnZ28g4OVVDevn2bdTCpyqbGDgwMDDi751KUdxyXl5fDtu2sdBFCQEqJW7duoampSWfGo0ePijYhpUoAwD8HcmaBkmmaZmtra6uK+Hv37iESicDlcmF+fh5fvnxBIBBAkUwuTeWHKBQKhZxlNZPJ0MWLF3VAvnjxQm/TcbZAf+cVShNlLJFIJJyxMDw8TM3NzfT+/fusj5L/BVBIylhfX19fKZ9cxw7CYgZViZ6cnJxcXV1dPcyQ/tD8S/ESDiN2EAOypqam5t8iikQikampqSk1tlSA/wC09UvMkiCf7wAAAABJRU5ErkJggg==';

const BTN_RIGHT_POS_DEFAULT = '2em';
const BTN_RIGHT_POS_OPEN = '26em';

const CLICK_FACILITE_BIG_ZONE = 'bigZone';
const CLICK_FACILITE_LONG_CLICK = 'longClick';
const CLICK_FACILITE_AUTO_CLICK = 'autoClick';

const CONTAINER_BUTTONS_ID = `${PREFIX}container-buttons`;
/* Elements atteignables a la tabulation dans la palette, pour la boucler sur elle-meme */
const TOOLBAR_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/* Marge entre la pastille Confort+ et les boutons de navigation */
const BTN_CPLUS_BUTTONS_MARGIN = 12;
/* Blocs de texte rendus focalisables pour la vocalisation et la navigation par boutons */
const TEXT_BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, figcaption, caption, td, th';
const ZONE_UNTAB_SELECTOR = 'a[href], area[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"]';
const TEXT_FRAGMENT_CLASS = `${PREFIX}text-fragment`;
const TEXT_BLOCK_FOCUSABLE_SELECTOR = 'a[href], area[href], button, input, select, textarea, summary, [tabindex], [role="button"], [role="link"], [role="tab"], [role="menuitem"]';
const TEXT_BLOCK_MAX = 2000;
/* Zones : groupes de liens ou de textes partageant un fond, un cadre ou un role de region */
const ZONE_SELECTOR = 'header, nav, main, footer, section, article, aside, form, fieldset, figure, table, ul, ol, dl, blockquote, div';
const ZONE_LANDMARKS = ['HEADER', 'NAV', 'FOOTER', 'SECTION', 'ARTICLE', 'ASIDE', 'FORM', 'FIELDSET', 'FIGURE', 'TABLE', 'UL', 'OL', 'DL', 'BLOCKQUOTE'];

const TEXT_COLOR_SPAN_CLASS = `${PREFIX}colored-text`;

const TEXT_ALTERNATE_LINES = `${PREFIX}alternateLines`;

const BODY_ELEMENTS_FILTER = 'script,style,link,meta';

const DARK_BG_COLOR_PROFILE = {
	name: 'Palette fonds foncés',
	params: { novice_reader: true },
	format: { line_spacing: 150, page_width: 70 },
	process: [
		{
			function: 'phonemes',
			format: [
				{
					color: '#16b84e',
					phonemes: ['e^', 'e^_comp'],
					phonetics: 'ɛ',
					example: ['ai, è'],
				},
				{
					color: '#cfc3b4',
					phonemes: ['e~'],
					phonetics: 'ɛ̃',
					example: ['ain, in'],
				},
				{
					color: '#ff00bd',
					phonemes: ['a~'],
					phonetics: 'ɑ̃',
					example: ['an, en'],
				},
				{
					color: '#ff99ff',
					phonemes: ['o', 'o_comp', 'o_ouvert'],
					phonetics: 'o',
					example: ['o, au'],
				},
				{
					color: '#00ffcc',
					phonemes: ['k', 'k_qu'],
					phonetics: 'k',
					example: ['qu, k'],
				},
				{
					color: '#ff5353',
					phonemes: ['s^'],
					phonetics: 'ʃ',
					example: ['ch, sh'],
				},
				{
					color: '#ff7900',
					phonemes: ['e', 'e_comp'],
					phonetics: 'e',
					example: ['é'],
				},
				{
					color: '#66ff33',
					phonemes: ['g', 'g_u'],
					phonetics: 'g',
					example: ['gue'],
				},
				{
					color: '#ffff66',
					phonemes: ['z^', 'z^_g'],
					phonetics: 'ʒ',
					example: ['j, ge'],
				},
				{
					color: '#b58e6b',
					phonemes: ['wa'],
					phonetics: 'wa',
					example: ['oi, oua'],
				},
				{
					color: '#f4acff',
					phonemes: ['s', 's_c', 's_t'],
					phonetics: 's',
					example: ['ss, ce'],
				},
				{
					color: '#f88e55',
					phonemes: ['x~'],
					phonetics: 'œ̃',
					example: ['un, ein'],
				},
				{
					color: '#ddddff',
					phonemes: ['z', 'z_s'],
					phonetics: 'z',
					example: ['z'],
				},
			],
		},
	],
};

const DARK_BG_COLOR_PALETTE = {
	"colors" : [
		"#00ffcc", "#12B5AF", "#a0ffe2", "#80aaff", "#c7daff", "#ddddff",
		"#ff00bd", "#ff47c2", "#c34dd4", "#ff00ed", "#ff99ff", "#e482f4",
		"#f4acff", "#fcd0ff", "#ff0000", "#ff5353", "#ff8a8a", "#ffbcbc",
		"#b58e6b", "#cfc3b4", "#ff7900", "#f88e55", "#ffb100", "#ffd200",
		"#fee347", "#ffff66", "#16b84e", "#66ff33", "#bef574", "#ececec"
	]
};

const LIGHT_BG_COLOR_PROFILE = {
	name: 'Palette fonds clairs',
	params: { novice_reader: true },
	format: { line_spacing: 150, page_width: 70 },
	process: [
		{
			function: 'phonemes',
			format: [
				{
					color: '#095228',
					phonemes: ['e^', 'e^_comp'],
					phonetics: 'ɛ',
					example: ['ai, è'],
				},
				{
					color: '#b15b1f',
					phonemes: ['e~'],
					phonetics: 'ɛ̃',
					example: ['ain, in'],
				},
				{
					color: '#008000',
					phonemes: ['a~'],
					phonetics: 'ɑ̃',
					example: ['an, en'],
				},
				{
					color: '#c40083',
					phonemes: ['o', 'o_comp', 'o_ouvert'],
					phonetics: 'o',
					example: ['o, au'],
				},
				{
					color: '#085ebe',
					phonemes: ['k', 'k_qu'],
					phonetics: 'k',
					example: ['qu, k'],
				},
				{
					color: '#1b6300',
					phonemes: ['s^'],
					phonetics: 'ʃ',
					example: ['ch, sh'],
				},
				{
					color: '#6a5500',
					phonemes: ['e', 'e_comp'],
					phonetics: 'e',
					example: ['é'],
				},
				{
					color: '#754977',
					phonemes: ['g', 'g_u'],
					phonetics: 'g',
					example: ['gue'],
				},
				{
					color: '#7f3c00',
					phonemes: ['z^', 'z^_g'],
					phonetics: 'ʒ',
					example: ['j, ge'],
				},
				{
					color: '#b0543f',
					phonemes: ['wa'],
					phonetics: 'wa',
					example: ['oi, oua'],
				},
				{
					color: '#bf3030',
					phonemes: ['s', 's_c', 's_t'],
					phonetics: 's',
					example: ['ss, ce'],
				},
				{
					color: '#81329a',
					phonemes: ['x~'],
					phonetics: 'œ̃',
					example: ['un, ein'],
				},
				{
					color: '#6c0277',
					phonemes: ['z', 'z_s'],
					phonetics: 'z',
					example: ['z'],
				},
			],
		},
	],
};

const LIGHT_BG_COLOR_PALETTE = {
	"colors" : [
		"#001e8e", "#454a8e", "#085ebe", "#4574bd", "#6c0277", "#754977",
		"#81329a", "#a00e77", "#ae45bd", "#c40083", "#bf3030", "#7f3c00",
		"#b0543f", "#b15b1f", "#6a5500", "#095228", "#1b6300", "#008000",
		"#333333"
	]
};
