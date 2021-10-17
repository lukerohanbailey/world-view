/**
 * Throttle
 *
 * @param {function} fn
 * @param {int|number} delay
 * @return {function(): void}
 */
export default function(fn, delay) {
	let lastFunc
	let lastRan
	return function() {
		const context = this
		const args = arguments
		if (!lastRan) {
			fn.apply(context, args)
			lastRan = Date.now()
		} else {
			clearTimeout(lastFunc)
			lastFunc = setTimeout(function() {
				if ((Date.now() - lastRan) >= delay) {
					fn.apply(context, args)
					lastRan = Date.now()
				}
			}, delay - (Date.now() - lastRan))
		}
	}
}
