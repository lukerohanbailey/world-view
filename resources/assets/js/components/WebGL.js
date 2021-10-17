import {
	WebGLRenderer,
	PerspectiveCamera,
	Scene,
	Clock,
	Vector2,
	VSMShadowMap,
	TextureLoader,
	CubeTextureLoader,
	LinearFilter
} from 'three'
import Stats from 'stats.js'

import store from '_store'
import { E,	GlobalEvents } from '_utils'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Earth from './gl/Earth'

export default class Gl {
	constructor() {
		this.dom = {
			canvas: document.getElementById('canvas')
		}

		this.textureLoader = new TextureLoader()
		this.GLTFLoader = new GLTFLoader()
		this.cubeTextureLoader = new CubeTextureLoader()

		this._m = { x: 0, y: 0 }

		// todo - remove stats for production
		this.stats = new Stats()
		if (!new URLSearchParams(window.location.search).has('hidestats')) {
			this.stats.dom.style.top = 'auto'
			this.stats.dom.style.left = 'auto'
			this.stats.dom.style.bottom = '0px'
			this.stats.dom.style.right = '0px'
			document.body.appendChild(this.stats.dom)
		}

		this.setup()
		this.loadGlobalAssets()
		this.addEvents()
	}

	setup() {
		this.renderer = new WebGLRenderer({ alpha: false, antialias: true, canvas: this.dom.canvas, powerPreference: 'high-performance' })
		this.renderer.setPixelRatio(store.window.dpr >= 2 ? 2 : store.window.dpr)
		this.renderer.setSize(store.window.w, store.window.h)
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = VSMShadowMap
		this.renderer.shadowMap.autoUpdate = false

		// Main Scene
		const cameraPosition = 4000
		const fov = 180 * (2 * Math.atan(store.window.h / 2 / cameraPosition)) / Math.PI
		this.camera = new PerspectiveCamera(fov, store.window.w / store.window.h, 0.1, 10000)
		this.camera.position.set(0, 0, cameraPosition)
		this.camera.aspect = store.window.w / store.window.h
		this.camera.updateProjectionMatrix()
		this.scene = new Scene()

		store.AssetLoader.ktxLoader.detectSupport(this.renderer)

		this.clock = new Clock()

		this.globalUniforms = {
			uTime: { value: 0 },
			uResolution: { value: new Vector2(store.window.w * this.renderer.getPixelRatio(), store.window.h * this.renderer.getPixelRatio()) }
		}

		if (store.enableGui) {
			this.buildGui()
		}
	}

	build() {
		this.earth = new Earth()
		this.scene.add(this.earth)
	}

	setupComposer() {
		// Effect Composer stuff goes here
	}

	loadGlobalAssets() {
		this.assets = {
			models: [],
			textures: []
		}

		this.loadTextures()
		this.loadModels()
	}

	loadModels() {
		const models = {}

		for (const key in models) {
			store.AssetLoader.add(new Promise(resolve => {
				this.GLTFLoader.load(models[key], gltf => {
					this.assets.models[key] = gltf.scene.children[0]
					resolve()
				})
			}))
		}
	}

	loadTextures() {
		const textures = {
			day: `${store.assetsUrl}images/earth-day.jpg`,
			night: `${store.assetsUrl}images/earth-night.jpg`,
			specular: `${store.assetsUrl}images/earth-water.jpg`
		}

		for (const key in textures) {
			store.AssetLoader.add(new Promise(resolve => {
				this.textureLoader.load(textures[key], texture => {
					texture.minFilter = texture.magFilter = LinearFilter
					texture.flipY = true
					this.renderer.initTexture(texture)
					this.assets.textures[key] = texture
					resolve()
				})
			}))
		}
	}

	addEvents() {
		E.on(GlobalEvents.RESIZE, this.onResize)
		store.RAFCollection.add(this.onRaf, 99)
	}

	onResize = () => {
		this.resize()
	}

	resize() {
		const width = store.window.w
		const height = store.window.h
		this.renderer.setSize(width, height)
		this.camera.aspect = width / height
		const cameraPosition = 4000
		this.camera.fov = 180 * (2 * Math.atan(store.window.h / 2 / cameraPosition)) / Math.PI
		this.camera.aspect = store.window.w / store.window.h
		this.camera.updateProjectionMatrix()

		this.globalUniforms.uResolution.value.set(store.window.w * this.renderer.getPixelRatio(), store.window.h * this.renderer.getPixelRatio())
	}

	onAssetsLoaded() {}

	onRaf = (time) => {
		this.stats.begin()

		store.clockDelta = this.clock.getDelta()
		this.globalUniforms.uTime.value = time

		this.renderer.render(this.scene, this.camera)

		this.stats.end()
	}

	buildGui() {}
}
