import store from "_store"
import {
	E,
	GlobalEvents,
	AssetLoader,
	RAFCollection
} from "_utils"

import WebGL from "_components/WebGL"

E.on('DOMContentLoaded', window, function() {
	GlobalEvents.enableMousemove()
	GlobalEvents.enableRAF(true)
	GlobalEvents.enableResize()
	GlobalEvents.enableDrag()

	store.RAFCollection = new RAFCollection()

	store.AssetLoader = new AssetLoader()
	store.WebGL = new WebGL()
	store.AssetLoader.load().then(() => {
		console.log('AssetLoader: loaded')
		store.WebGL.build()
	})
})
