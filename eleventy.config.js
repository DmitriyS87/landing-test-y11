const dom = require('linkedom');
// const esbuild = require('esbuild');
const fs = require('fs');
const highlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const htmlMin = require('html-minifier-terser');
const markdown = require('markdown-it')({ html: true });
const lightningcss = require('lightningcss');
const prettyData = require('pretty-data');
const removeMarkdown = require('remove-markdown');
const yaml = require('js-yaml');
const packageJson = require('./package.json');

const global = yaml.load(fs.readFileSync('src/data/global.yml', 'utf8'));

module.exports = (config) => {
	// Collections
	// Markdown

	config.addFilter('markdown', (value) => {
		return markdown.render(value);
	});

	config.addFilter('markdownInline', (value) => {
		return markdown.renderInline(value);
	});

	config.addFilter('markdownRemove', (value) => {
		return removeMarkdown(value);
	});

	config.setLibrary('md', markdown);

	// HTML

	config.addTransform('html-minify', async (content, path) => {
		if (path && path.endsWith('.html')) {
			return await htmlMin.minify(content, {
				collapseBooleanAttributes: true,
				collapseWhitespace: true,
				decodeEntities: true,
				includeAutoGeneratedTags: false,
				removeComments: true,
			});
		}

		return content;
	});


	config.addTransform('html-transform', async (content, path) => {
		if (path && path.endsWith('.html')) {
			const window = dom.parseHTML(content);

			return window.document.toString();
		}

		return content;
	});

	// CSS

	const styles = [
		'./src/styles/index.css'
	];

	const processStyles = async (path) => {
		return await lightningcss.bundle({
			filename: path,
			minify: true,
			sourceMap: false,
			targets: lightningcss.browserslistToTargets(
				packageJson.browserslist,
			),
			include:
				lightningcss.Features.MediaQueries |
				lightningcss.Features.Nesting,
		});
	};

	config.addTemplateFormats('css');

	config.addExtension('css', {
		outputFileExtension: 'css',
		compile: async (content, path) => {
			if (!styles.includes(path)) {
				return;
			}

			return async () => {
				let { code } = await processStyles(path);

				return code;
			};
		},
	});

	config.addFilter('css', async (path) => {
		let { code } = await processStyles(path);

		return code;
	});

	// XML minification

	config.addTransform('xmlMin', (content, path) => {
		if (path && path.endsWith('.xml')) {
			return prettyData.pd.xmlmin(content);
		}

		return content;
	});

	// YAML

	config.addDataExtension('yml', (contents) => {
		return yaml.load(contents);
	});

	// Absolute links

	// config.addFilter('absolute', (content, article) => {
	// 	const reg = /(src="[^(https://)])|(src="\/)|(href="[^(https://)])|(href="\/)/g;
	// 	const prefix = global.domain + article.url;
	// 	return content.replace(reg, (match) => {
	// 		if (match === 'src="/' || match === 'href="/') {
	// 			match = match.slice(0, -1);
	// 			return match + prefix;
	// 		} else {
	// 			return match.slice(0, -1) + prefix + match.slice(-1);
	// 		}
	// 	});
	// });

	// Passthrough copy

	[
		'src/img',
		'src/fonts',
	].forEach((path) => config.addPassthroughCopy(path));

	// Plugins

	config.addPlugin(highlight);

	// Config

	return {
		dir: {
			input: 'src',
			output: 'dist',
			includes: 'includes',
			layouts: 'layouts',
			data: 'data',
		},
		dataTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['md', 'njk'],
	};
};
