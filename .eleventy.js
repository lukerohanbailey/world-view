module.exports = function (eleventyConfig) {
	/**
	 * Add the asset shortcode to fetch an asset name from mix-manifest.json
	 *
	 * @example {% asset 'css/style.css' %}
	 */
	eleventyConfig.addShortcode("asset", function (name) {
		try {
			const assets = require("./public/mix-manifest.json")

			if (name[0] !== '/') {
				name = '/' + name
			}
			return assets[name] || name
		} catch (error) {
			return name
		}
	});

	return {
		dir: { input: 'resources/templates', output: 'public', data: '_data' },
		passthroughFileCopy: true,
		templateFormats: ['njk', 'md', 'html'],
		htmlTemplateEngine: 'njk'
	}
}
