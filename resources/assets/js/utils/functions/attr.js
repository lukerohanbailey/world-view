/**
 * Get/set/remove attribute for a given element
 *
 * @param {Element|Node} element
 * @param {string|object} attribute
 * @param {string[]|string|boolean|object} [value]
 * @return {string|undefined}
 */
export default function attr(element, attribute, value) {
	const set = (a, v) => {
		if (a === 'style') {
			Object.assign(element.style, v)
			return
		}

		if (a === 'classList') {
			addClasses(element, v)
			return
		}

		element.setAttribute(a, v === true ? a : v)
	}

	if (typeof attribute === 'object') {
		for (const attr in attribute) {
			if (attribute[attr] === false) {
				element.removeAttribute(attr)
				continue
			}

			set(attr, attribute[attr])
		}
	} else {
		if (value === undefined) {
			return element.getAttribute(attribute)
		}

		if (value === false) {
			element.removeAttribute(attribute)
			return
		}

		set(attribute, value)
	}
}

/**
 * Add specified classes to an element.
 * @private
 * @param element
 * @param {string[]|string|object} classes
 */
function addClasses(element, classes) {
	if (Array.isArray(classes)) {
		element.classList.add(...classes)
		return
	}

	if (typeof classes === 'string') {
		element.classList.add(...classes.split(' '))
		return
	}

	if (classes.add) {
		addClasses(element, classes.add)
	}

	if (classes.remove) {
		removeClasses(element, classes.remove)
	}
}

/**
 * Remove specified classes on an element.
 * @private
 * @param element
 * @param {string[]|string} classes
 */
function removeClasses(element, classes) {
	if (Array.isArray(classes)) {
		element.classList.remove(...classes)
		return
	}

	if (typeof classes === 'string') {
		element.classList.remove(...classes.split(' '))
	}
}
