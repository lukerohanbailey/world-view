const mix = require('laravel-mix')
const path = require('path')
const fse = require('fs-extra')
require('laravel-mix-polyfill')
require('laravel-mix-purgecss')
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin')
const StylelintPlugin = require('stylelint-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const purgecssWordpress = require('purgecss-with-wordpress')

// Use these functions when resolving paths
const src = relPath => path.resolve(__dirname, process.env.MIX_SRC_DIR, relPath)
const dist = relPath => path.resolve(__dirname, process.env.MIX_DIST_DIR, relPath)
const frameworkDir = process.env.FRAMEWORK_ROOT ? relPath => path.resolve(__dirname, process.env.FRAMEWORK_ROOT, relPath) : src

const purgeCssRoot = process.env.PURGECSS_ROOT || 'resources'

/*
 |--------------------------------------------------------------------------
 | Config
 |--------------------------------------------------------------------------
 */
mix
	// Basic config
	.setPublicPath(process.env.MIX_PUBLIC_PATH)
	.setResourceRoot(process.env.MIX_RESOURCE_ROOT)

	// Module aliases
	.webpackConfig({
		resolve: {
			alias: {
				_utils: frameworkDir('js/utils'),
				_glsl: frameworkDir('glsl'),
				_components: frameworkDir('js/components'),
				_store: frameworkDir('js/store.js'),
				'../../../build/three.module.js': '../../../src/Three'
			}
		}
	})

	// Set up SASS entry point
	.sass(src('scss/style.scss'), dist('css'))

	// Set up the JS entry point
	.js(src('js/theme.js'), dist('scripts'))

	// ensure mix is using the browserslist entry from the package.json
	.polyfill({
		enabled: true,
		useBuiltIns: "usage",
		targets: false,
		debug: process.env.BROWSERSLIST_DEBUG === 'true'
	})

	// PurgeCSS
	.purgeCss({
		defaultExtractor: (content) => content.match(/[a-zA-Z0-9-@./_]+/g) || [],
		content: [
			`${purgeCssRoot}/**/*.html`,
			`${purgeCssRoot}/**/*.js`,
			`${purgeCssRoot}/**/*.jsx`,
			`${purgeCssRoot}/**/*.ts`,
			`${purgeCssRoot}/**/*.tsx`,
			`${purgeCssRoot}/**/*.php`,
			`${purgeCssRoot}/**/*.vue`,
			`${purgeCssRoot}/**/*.twig`,
			`${purgeCssRoot}/**/*.njk`
		],
		safelist: {
			standard: [
				...purgecssWordpress.safelist,
				// eslint-disable-next-line no-eval
				...eval(process.env.PURGECSS_WHITELIST) || []
			],
			// eslint-disable-next-line no-eval
			deep: eval(process.env.PURGECSS_WHITELIST_DEEP) || []
		}
	})

	// Set up Browser Sync
	.browserSync({
		proxy: process.env.MIX_BS_PROXY,
		open: false,
		files: [
			process.env.MIX_DIST_DIR + 'css/*.css',
			process.env.MIX_DIST_DIR + 'scripts/*.js',
			purgeCssRoot + '/**/*.blade.php',
			purgeCssRoot + '/**/*.html'
		],
		snippetOptions: {
			ignorePaths: 'wp-admin/**'
		}
	})

	// Webpack plugins
	.webpackConfig(() => {
		const plugins = [
			new SVGSpritemapPlugin(src('svg-sprite/*.svg'), {
				output: {
					filename: 'images/svgsprite.svg',
					chunk: { keep: true },
					svgo: {
						plugins: [
							{ addClassesToSVGElement: { className: 'svg-sprite' } },
							{ removeTitle: true }
						]
					}
				},
				sprite: { prefix: false }
			})
		]

		if (!mix.inProduction()) {
			plugins.push(
				new ESLintPlugin({
					emitWarning: true,
					failOnError: false
				})
			)

			plugins.push(
				new StylelintPlugin({
					context: process.cwd(),
					files: process.env.MIX_SRC_DIR + "scss/**/*.s?(a|c)ss",
					emitWarning: true
				})
			)
		}

		return { plugins }
	})

	// Additional loaders
	.webpackConfig({
		module: {
			rules: [
				{
					test: /\.(glsl|frag|vert|vs|fs)$/,
					exclude: /node_modules/,
					use: [
						'raw-loader',
						'glslify-loader'
					]
				}
			]
		}
	})

	// Copy any images from resources to public.
	.copyDirectory(src('images'), dist('images'))
	.copyDirectory(src('models'), dist('models'))

	// Append version strings in mix-manifest.
	.version()

// ensure the dist images folder is empty and fresh
fse.emptyDir(dist('images'))
fse.emptyDir(dist('models'))

/*
 |--------------------------------------------------------------------------
 | ENV handling
 |--------------------------------------------------------------------------
 */
if (!mix.inProduction()) {
	// Include separate source maps in development builds.
	mix
		.webpackConfig({ devtool: 'cheap-module-source-map' })
		.sourceMaps()
} else {
	// only run in production
}
