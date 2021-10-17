import store from '_store'
import E from '_utils/E'

import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { TextureLoader } from 'three'

/**
*   Add any promises that need to be resolved before showing
*   the page by using the add( promise ) method.
*/

export default class AssetLoader {
	constructor(progressEventName = 'AssetsProgress') {
		this.promisesToLoad = []
		this.fontsLoaded = false
		this.loaded = false
		this.progressEventName = progressEventName

		this.jsons = {}
		this.gltfs = {}
		this.textures = {}
		this.ktxTextures = {}

		this.textureLoader = new TextureLoader()
		this.ktxLoader = new KTX2Loader()
		this.ktxLoader.setTranscoderPath(`${store.assetsUrl}basis/`)
		this.exrLoader = new EXRLoader()
		this.gltfLoader = new GLTFLoader()
		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath(`${store.assetsUrl}draco/`)
		this.gltfLoader.setDRACOLoader(this.dracoLoader)
	}

	load = ({ element = document.body, progress = true } = {}) => {
		if (element) {
			this.element = element
			this.addFonts()
			this.addMedia()
		}

		let loadedCount = 0

		if (progress) {
			for (let i = 0; i < this.promisesToLoad.length; i++) {
				this.promisesToLoad[i].then(() => {
					loadedCount++
					this.progressCallback((loadedCount * 100) / this.promisesToLoad.length)
				})
			}
		}

		this.loaded = new Promise(resolve => {
			Promise.all(this.promisesToLoad).then(() => {
				this.reset()
				resolve()
			})
		})

		return this.loaded
	}

	progressCallback = (percentLoaded) => {
		E.emit(this.progressEventName, { percent: Math.ceil(percentLoaded) })
	}

	add = (promise) => {
		this.promisesToLoad.push(promise)
		return promise
	}

	addMedia = () => {
		const images = this.element.querySelectorAll('img')
		for (let i = 0; i < images.length; i++) {
			this.addImage(images[i])
		}

		const videos = this.element.querySelectorAll('video:not([lazy])')
		for (let i = 0; i < videos.length; i++) {
			this.add(new Promise(resolve => {
				videos[i].crossOrigin = ''
				videos[i].addEventListener('canplaythrough', function playthrough() {
					videos[i].removeEventListener('canplaythrough', playthrough)

					videos[i].addEventListener('timeupdate', function ready() {
						videos[i].removeEventListener('timeupdate', ready)
						videos[i].pause()
						resolve()
					})
				})
				videos[i].addEventListener('error', resolve)
				if (videos[i].src === '' && videos[i].dataset.src) {
					videos[i].src = videos[i].dataset.src
				}
				videos[i].load()
				videos[i].play()
			}))
		}
	}

	addImage(el) {
		return this.add(new Promise(resolve => {
			if (el.complete && el.naturalWidth !== 0) {
				// image already loaded so resolve
				resolve(el)
			} else {
				// image not loaded yet so listen for it
				el.addEventListener('load', () => { resolve(el) })
				el.addEventListener('error', () => { resolve(el) })
			}
		}))
	}

	addFonts = () => {
		if (document.fonts) {
			this.add(document.fonts.ready)
		}

		if (!this.fontsLoaded && window.Typekit) {
			this.add(new Promise(resolve => {
				window.Typekit.load({
					active: () => {
						this.fontsLoaded = true
						resolve()
					}
				})
			}))
		}
	}

	loadJson = (url) => {
		if (!this.jsons[url]) {
			this.jsons[url] = this.add(new Promise((resolve, reject) => {
				fetch(url, {
					headers: {
						'Content-Type': 'application/json'
					}
				})
					.then(response => {
						if (!response.ok) {
							throw new Error('Network response was not ok for request: ', url)
						}
						resolve(response.json())
					}, reject)
			}))
		}

		return this.jsons[url]
	}

	loadGltf = (url) => {
		if (!this.gltfs[url]) {
			this.gltfs[url] = this.add(new Promise((resolve, reject) => {
				store.TaskScheduler.enqueueTask(() => {
					this.gltfLoader.load(url, gltf => {
						resolve(gltf)
					}, undefined, reject)
				})
			}))
		}

		return this.gltfs[url]
	}

	loadTexture = (url) => {
		if (!this.textures[url]) {
			this.textures[url] = this.add(new Promise((resolve, reject) => {
				this.textureLoader.load(url, texture => {
					store.TaskScheduler.enqueueTask(() => {
						resolve(store.Gl.generateTexture(texture))
					})
				}, undefined, reject)
			}))
		}

		return this.textures[url]
	}

	loadKtxTexture(url) {
		if (!this.ktxTextures[url]) {
			this.ktxTextures[url] = this.add(new Promise((resolve, reject) => {
				this.ktxLoader.load(url, texture => {
					store.TaskScheduler.enqueueTask(() => {
						resolve(store.Gl.generateTexture(texture))
					})
				}, undefined, reject)
			}))
		}

		return this.ktxTextures[url]
	}

	reset = () => {
		this.promisesToLoad = []
	}
}