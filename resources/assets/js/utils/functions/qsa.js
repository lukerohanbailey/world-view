/**
 * Alias of querySelectorAll.
 *
 * @param {string} selector
 * @param {Document|DocumentFragment|HTMLElement|Element} [context]
 * @returns {Element[]}
 */
export default function qsa(selector, context = document) {
	const list = context.querySelectorAll(selector)
	return Array.prototype.slice.call(list)
}
