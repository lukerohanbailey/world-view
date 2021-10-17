const { Vector2 } = require("three")

module.exports = {
	html: document.documentElement,
	body: document.body,
	window: {
		w: window.innerWidth,
		h: window.innerHeight,
		dpr: window.devicePixelRatio
		// dpr: 1
	},
	mq: {
		xs: window.matchMedia('(min-width: 415px)'),
		sm: window.matchMedia('(min-width: 768px)'),
		md: window.matchMedia('(min-width: 1024px)'),
		lg: window.matchMedia('(min-width: 1366px)'),
		xlg: window.matchMedia('(min-width: 1921px)'),
		'4k': window.matchMedia('(min-width: 3840px)')
	},
	pointer: {
		default: new Vector2(),
		gl: new Vector2(),
		glNormalized: new Vector2(),
		isDragging: false
	},
	components: {},
	keys: { UP: 38, DOWN: 40, ENTER: 13, ESC: 27, HOME: 36, END: 35 },
	cookieNoticeAccepted: false,

	assetsUrl: '/',

	/** @type {?ASScroll} **/
	ASS: null,

	/** @type {?AssetLoader} **/
	AssetLoader: null,

	enableGUI: true
}
