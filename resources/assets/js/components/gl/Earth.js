import fragmentShader from '_glsl/earth.frag'
import vertexShader from '_glsl/earth.vert'

import { Box3, MathUtils, Mesh, MeshBasicMaterial, ShaderMaterial, SphereBufferGeometry, Vector2, Vector3 } from "three"
import * as store from '_store'
import { E, GlobalEvents, qs } from '_utils'
import gsap from 'gsap/all'

const radius = 1

const locations = {
	nullIsland: {
		lat: 0,
		lng: 0
	},
	london: {
		lat: 51.5074,
		lng: -0.1278
	},
	connecticut: {
		lat: 41.6032,
		lng: -73.0877,
		vec3: null
	},
	sydney: {
		lat: -33.8688,
		lng: 151.2093
	}
}

export default class Earth extends Mesh {
	constructor() {
		const uniforms = {
			uDayTexture: { value: store.WebGL.assets.textures.day },
			uNightTexture: { value: store.WebGL.assets.textures.night },
			uSpecularTexture: { value: store.WebGL.assets.textures.specular },
			uSunDirection: { value: new Vector3(1.0, 0.0, 0.0) },
			uScale: { value: null }
		}

		super(
			new SphereBufferGeometry(radius, 32, 32),
			new ShaderMaterial({
				uniforms,
				fragmentShader,
				vertexShader
			})
		)

		this.geometry.rotateY(-Math.PI * 0.5)
		this.baseRotation = new Vector2()
		this.bbox = new Box3()
		this.pixelScale = new Vector2()

		this.domEl = qs('.earth')

		this.addEvents()
		this.addLocationMarkers()
		this.onResize()

		window.animateToLocation = (name) => { this.animateToLocation(name) }
	}

	addEvents() {
		E.on(GlobalEvents.RAF, this.onRAF)
		E.on(GlobalEvents.RESIZE, this.onResize)
	}

	addLocationMarkers() {
		const markerGeometry = new SphereBufferGeometry(radius * 0.02, 16, 16)
		const whiteMaterial = new MeshBasicMaterial()

		for (const key in locations) {
			const location = locations[key]

			// Add vector for each coordinate so we can caclulate the angles individually
			location.lngVec3 = this.latLngToVec3(radius, { lat: 0, lng: location.lng })
			location.latVec3 = this.latLngToVec3(radius, { lat: location.lat, lng: 0 })

			// Add Marker
			const marker = new Mesh(markerGeometry, whiteMaterial)
			marker.position.copy(this.latLngToVec3(radius * 1.02, location))
			this.add(marker)
			location.marker = marker
		}
	}

	animateToLocation = (locationName) => {
		if (locationName === this.currentLocation) return
		this.currentLocation = locationName
		const location = locations[locationName]

		let yTargetAngle = locations.nullIsland.lngVec3.angleTo(location.lngVec3)
		yTargetAngle = (location.lng > 0) ? -yTargetAngle : yTargetAngle

		let xTargetAngle = locations.nullIsland.latVec3.angleTo(location.latVec3)
		xTargetAngle = (location.lat < 0) ? -xTargetAngle : xTargetAngle

		gsap.to(this.baseRotation, {
			y: yTargetAngle,
			x: xTargetAngle,
			duration: 1,
			ease: 'expo.out'
		})
	}

	onRAF = (time) => {
		this.material.uniforms.uSunDirection.value.x = Math.cos(time * 0.1)
		this.material.uniforms.uSunDirection.value.z = Math.sin(time * 0.1)
		this.rotation.x = this.baseRotation.x
		this.rotation.y = this.baseRotation.y
	}

	onResize = () => {
		this.syncDomSize()
		this.updateDom2Webgl()
	}

	/**
	 *
	 * @param {Number} radius The radius of the sphere geometry used for the planet
	 * @param {Object} latLng An object literal for that latitude and longitude coordinates to be mapped to a vector
	 * @param {Number} latLng.lat The latitude coordinate
	 * @param {Number} latLng.lng The longitude coordinate
	 * @returns {Vector3} The positon of the coordinates mapped onto a sphere of the given radius
	 */
	latLngToVec3(radius, { lat, lng }) {
		return new Vector3().setFromSphericalCoords(
			radius,
			MathUtils.degToRad(90 - lat),
			MathUtils.degToRad(lng)
		)
	}

	syncDomSize() {
		this.domElBcr = this.domEl.getBoundingClientRect()
		// Divide by 2 because we are using a sphere that is sized by radius
		this.widthPx = (this.domElBcr.width / 2)
		this.heightPx = (this.domElBcr.height / 2)
		this.scale.set(this.widthPx, this.heightPx, this.widthPx)
		this.material.uniforms.uScale.value = this.widthPx
	}

	updateDom2Webgl() {
		const x = (-(store.window.w / 2) + (this.domElBcr.x + ((this.domElBcr.width / 2))))
		const y = ((store.window.h / 2) - this.domElBcr.y - (this.domElBcr.height / 2))
		this.position.x = x
		this.position.y = y
	}
}