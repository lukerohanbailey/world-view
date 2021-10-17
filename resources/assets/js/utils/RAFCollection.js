import { E } from '_utils'

export default class RAFCollection {
	constructor() {
		this.callbacks = []
		E.on('global:raf', this.fire)
	}

	add(cb, index) {
		this.callbacks.push({ index, cb })
		this.callbacks.sort(this.sort)
	}

	remove(cb) {
		for (let i = 0; i < this.callbacks.length; i++) {
			if (this.callbacks[i].cb === cb) this.callbacks.splice(i, 1)
		}
	}

	sort(a, b) {
		return a.index > b.index ? 1 : -1
	}

	fire = (time) => {
		let i = 0
		const length = this.callbacks.length
		for (i; i < length; i++) {
			this.callbacks[i].cb(time)
		}
	}
}