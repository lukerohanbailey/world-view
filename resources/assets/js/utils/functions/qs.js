/**
 * Alias of querySelector
 *
 * @param {string} selector
 * @param {Document|DocumentFragment|HTMLElement|Element} [context]
 * @returns {Element|null}
 */
export default function qs(selector, context = document) {
	return context.querySelector(selector)
}
