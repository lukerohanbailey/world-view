import { debounce, E } from '../utils'
import store from '../store'
import gsap from 'gsap'

export default class GlobalEvents {
	/**
	 * Global mousemove bus event
	 * @type {string}
	 */
	static MOUSEMOVE = 'global:mousemove'

	/**
	 * Global touch bus event
	 * @type {string}
	 */
	static TOUCHMOVE = 'global:touchmove'

	/**
	 * Global mouse drag bus event
	 * @type {string}
	 */
	static MOUSEDRAG = 'global:mousedrag'

	/**
	 * Global touch drag/move bus event
	 * @type {string}
	 */
	static TOUCHDRAG = 'global:touchdrag'

	/**
	 * Global pointer (touch or mouse) move bus event
	 * @type {string}
	 */
	static POINTERMOVE = `${GlobalEvents.MOUSEMOVE} ${GlobalEvents.TOUCHMOVE}`

	/**
	 * Global pointer (touch or mouse) drag bus event
	 * @type {string}
	 */
	static POINTERDRAG = `${GlobalEvents.TOUCHDRAG} ${GlobalEvents.MOUSEDRAG}`

	/**
	 * Global pointer down bus event
	 * @type {string}
	 */
	static POINTERDOWN = 'global:pointerdown'

	/**
	 * Global pointer up bus event
	 * @type {string}
	 */
	static POINTERUP = 'global:pointerup'

	/**
	 * Global requestAnimationFrame bus event
	 * @type {string}
	 */
	static RAF = 'global:raf'

	/**
	 * Global resize bus event
	 * @type {string}
	 */
	static RESIZE = 'global:resize'

	/**
	 * The ID of the last run animation frame
	 * @private
	 * @type {null|number}
	 */
	static currentRafId = null

	/**
	 * List of enabled global events
	 * @private
	 */
	static enabled = {}

	/**
	 * Holds drag related properties
	 * @private
	 * @type {{x: number, px: number, y: number, py: number}}
	 */
	static dragInfo = {
		x: 0,
		y: 0,
		px: 0,
		py: 0
	}

	/**
	 * Detect if we're running on a touch device, and set a global flag in store
	 */
	static detectTouchDevice() {
		if ('ontouchstart' in document.documentElement) {
			store.isTouch = true
			store.html.classList.add('is-touch')
		}
	}

	/**
	 * Enable global:mousemove
	 */
	static enableMousemove() {
		if (typeof GlobalEvents.enabled.mousemove === 'undefined') {
			GlobalEvents.enabled.mousemove = true
			E.on('mousemove touchmove', window, GlobalEvents.handleMousemove, { passive: true })
		}
	}

	/**
	 * Enable global:resize
	 * @param {boolean|number} tick
	 */
	static enableResize(tick = false) {
		if (typeof GlobalEvents.enabled.resize === 'undefined') {
			GlobalEvents.enabled.resize = true

			if (tick) {
				E.on('resize', window, debounce((e) => GlobalEvents.handleResize(e), tick))
			} else {
				E.on('resize', window, GlobalEvents.handleResize)
			}
		}
	}

	/**
	 * Enable global:raf
	 * @param {boolean} syncWithGsap
	 */
	static enableRAF(syncWithGsap = false) {
		if (typeof GlobalEvents.enabled.raf === 'undefined') {
			GlobalEvents.enabled.raf = true

			if (syncWithGsap) {
				GlobalEvents.currentRafId = null
				gsap.ticker.add(GlobalEvents.handleRaf)
			} else {
				GlobalEvents.currentRafId = window.requestAnimationFrame(GlobalEvents.handleRaf)
			}
		}
	}

	/**
	 * Enable global drag events
	 */
	static enableDrag() {
		if (typeof GlobalEvents.enabled.drag === 'undefined') {
			GlobalEvents.enabled.drag = true

			E.on('mousedown touchstart', window, GlobalEvents.handleMousedown)
			E.on('mouseup touchend', window, GlobalEvents.handleMouseup)
		}
	}

	/**
	 * Emit the global:mousemove event, and update store.pointer
	 * @private
	 * @param {MouseEvent|TouchEvent} e
	 */
	static handleMousemove(e) {
		store.pointer.default.x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
		store.pointer.default.y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
		store.pointer.gl.set(store.pointer.default.x - store.window.w / 2, -store.pointer.default.y + store.window.h / 2)
		store.pointer.glNormalized.set((store.pointer.default.x / store.window.w) * 2 - 1, -(store.pointer.default.y / store.window.h) * 2 + 1)

		if (!e.changedTouches) {
			E.emit(GlobalEvents.MOUSEMOVE, e)
		} else {
			E.emit(GlobalEvents.TOUCHMOVE, e)
		}

		if (store.pointer.isDragging) {
			const args = {
				deltaX: store.pointer.default.x - GlobalEvents.dragInfo.px,
				deltaY: store.pointer.default.y - GlobalEvents.dragInfo.py,
				startX: GlobalEvents.dragInfo.x,
				startY: GlobalEvents.dragInfo.y
			}

			E.emit(e.changedTouches ? GlobalEvents.TOUCHDRAG : GlobalEvents.MOUSEDRAG, e, args)

			GlobalEvents.dragInfo.px = store.pointer.default.x
			GlobalEvents.dragInfo.py = store.pointer.default.y
		}
	}

	/**
	 * Emit the global:pointerdown event
	 * @private
	 * @param {MouseEvent|TouchEvent} e
	 */
	static handleMousedown(e) {
		GlobalEvents.handleMousemove(e)
		store.pointer.isDragging = true
		GlobalEvents.dragInfo.x = GlobalEvents.dragInfo.px = store.pointer.default.x
		GlobalEvents.dragInfo.y = GlobalEvents.dragInfo.py = store.pointer.default.y
		E.emit(GlobalEvents.POINTERDOWN, e)
	}

	/**
	 * Emit the global:pointerup event
	 * @private
	 * @param {MouseEvent|TouchEvent} e
	 */
	static handleMouseup(e) {
		store.pointer.isDragging = false
		GlobalEvents.handleMousemove(e)
		GlobalEvents.dragInfo = {
			x: 0,
			y: 0,
			px: 0,
			py: 0
		}
		E.emit(GlobalEvents.POINTERUP, e)
	}

	/**
	 * Emit global:resize event
	 * @private
	 * @param {Event} e
	 */
	static handleResize(e) {
		store.window.w = window.innerWidth
		store.window.h = window.innerHeight
		store.html.style.setProperty('--vh', `${store.window.h}px`)

		E.emit(GlobalEvents.RESIZE, e)
	}

	/**
	 * Emit the global:raf event
	 * @private
	 */
	static handleRaf(time) {
		E.emit(GlobalEvents.RAF, time)

		if (GlobalEvents.currentRafId !== null) {
			GlobalEvents.currentRafId = window.requestAnimationFrame(GlobalEvents.handleRaf)
		}
	}
}