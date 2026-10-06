/**
 * Render the in-app previews of each Icon Composer document in assets/: the
 * Settings picker's tile and the Credits screen's logo. Run after editing an
 * `.icon`; the PNGs are committed, since the renderer only ships with Xcode.
 *
 * `--all` adds the tinted renditions; `--table` writes a gallery of every logo
 * to images/icons/logos.html. Both outputs are gitignored.
 *
 * Old Main (Retro) also gets its app icon set, which is stacked from the layers
 * of its document rather than exported, so its previews and its set differ.
 *
 * Lion and O is for Olaf have no document: their app icon sets are the artwork,
 * and their previews are scaled down from it.
 */
import {execFileSync} from 'node:child_process'
import {mkdirSync, readdirSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'

/**
 * Icon Composer's own renderer. `xcrun ictool` is a different tool that shares
 * the name and rejects `--export-image`.
 */
const ICTOOL =
	'/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool'

const SOURCE_DIR = 'assets'
const OUTPUT_DIR = join('images', 'icons')

/** Every iPhone the app supports is @3x; an iPad scales the preview down. */
const SCALE = 3

/**
 * The size in points each preview is drawn at. AppLogo on the Credits screen
 * shows it at full size, the App Icon gallery at 76pt, and the Customize
 * sheet's App Icon row scales it down to 30pt.
 */
const POINTS = 100

/** ictool's renditions, one per app appearance the previews follow. */
const APPEARANCES = [
	{suffix: '', rendition: 'Default'},
	{suffix: '-dark', rendition: 'Dark'},
]

/**
 * The home screen's tinted look, which the app cannot detect, so nothing
 * shows these. `--all` renders them to review an icon change by eye; they
 * are gitignored.
 */
const TINTED_APPEARANCES = [
	{suffix: '-tinted-light', rendition: 'TintedLight'},
	{suffix: '-tinted-dark', rendition: 'TintedDark'},
]

/**
 * @typedef {object} Export
 * @property {string} input the Icon Composer document
 * @property {string} output the PNG to write
 * @property {number} points the preview's size on screen
 * @property {string} rendition the ictool rendition
 */

/**
 * @param {string[]} entries the names in assets/
 * @param {{all?: boolean}} [options] `all` adds the tinted renditions
 * @returns {Export[]}
 */
export function exportPlan(entries, {all = false} = {}) {
	let appearances = all ? [...APPEARANCES, ...TINTED_APPEARANCES] : APPEARANCES
	return entries
		.filter((entry) => entry.endsWith('.icon'))
		.flatMap((entry) =>
			appearances.map((appearance) => ({
				input: join(SOURCE_DIR, entry),
				output: join(OUTPUT_DIR, `${basename(entry, '.icon')}${appearance.suffix}.png`),
				points: POINTS,
				rendition: appearance.rendition,
			})),
		)
}

/**
 * Old Main (Retro) ships as a plain app icon set, not as its `.icon`, which
 * would cost a render for the tinted look too. Its Icon Composer document stays
 * here as the source the set and the previews are made from.
 */
const RETRO_DOCUMENT = join(SOURCE_DIR, '0-source-icons', 'old-main-retro.icon')
const RETRO_SET = join(SOURCE_DIR, 'old-main-retro.xcassets', 'old-main-retro.appiconset')

/** The size in pixels of an app icon set's image. */
const APP_ICON_SIZE = 1024

/** Where the document keeps the colors it draws in, and what the set converts them to. */
const P3_PROFILE = '/System/Library/ColorSync/Profiles/Display P3.icc'
const SRGB_PROFILE = '/System/Library/ColorSync/Profiles/sRGB Profile.icc'

/** The document's fill, which its opaque background covers; the set starts from it. */
const RETRO_FILL = 'rgb(20,28,12)'

/**
 * The app icon sets drawn outside Icon Composer, whose light and dark images
 * are committed as they are. Each lives at assets/<name>.xcassets/<name>.appiconset.
 */
const ARTWORK_SETS = ['lion', 'o-is-for-olaf']

/** The corner radius, in preview pixels, that matches the mask ictool bakes into a preview. */
const PREVIEW_CORNER_RADIUS = 90

/**
 * Each artwork set's previews, scaled from the set's image for the appearance.
 *
 * @returns {{input: string, output: string}[]}
 */
export function artworkPreviews() {
	return ARTWORK_SETS.flatMap((name) =>
		[
			{suffix: '', image: 'light'},
			{suffix: '-dark', image: 'dark'},
		].map(({suffix, image}) => ({
			input: join(SOURCE_DIR, `${name}.xcassets`, `${name}.appiconset`, `${image}.png`),
			output: join(OUTPUT_DIR, `${name}${suffix}.png`),
		})),
	)
}

/**
 * Scale an artwork image to preview size and round its corners, as ictool does
 * for a document's render, since the app draws a preview as it is.
 *
 * @param {{input: string, output: string}} preview
 */
function scaleArtwork({input, output}) {
	let size = POINTS * SCALE
	let corner = PREVIEW_CORNER_RADIUS
	execFileSync('magick', [
		input,
		'-filter',
		'Lanczos',
		'-resize',
		`${size}x${size}`,
		'(',
		'-size',
		`${size}x${size}`,
		'xc:black',
		'-fill',
		'white',
		'-draw',
		`roundrectangle 0,0 ${size - 1},${size - 1} ${corner},${corner}`,
		')',
		'-alpha',
		'off',
		'-compose',
		'CopyOpacity',
		'-composite',
		output,
	])
}

/** @returns {Export[]} */
export function retroPreviews() {
	return APPEARANCES.map((appearance) => ({
		input: RETRO_DOCUMENT,
		output: join(OUTPUT_DIR, `old-main-retro${appearance.suffix}.png`),
		points: POINTS,
		rendition: appearance.rendition,
	}))
}

/**
 * The light and dark images of the Retro app icon set, each with the layers of
 * the source document that make it, bottom first.
 *
 * Stacked here rather than exported by ictool, which bakes its rounded mask and
 * a lit rim into the render. iOS draws its own on top of any app icon, so the
 * baked ones show twice, and the dark rim glows.
 *
 * @returns {{output: string, layers: string[]}[]}
 */
export function retroSetImages() {
	let assets = join(RETRO_DOCUMENT, 'Assets')
	return [
		{name: 'light', pixels: 'pixels', background: 'background', glow: 'pixels-glow'},
		{
			name: 'dark',
			pixels: 'pixels-amber',
			background: 'background-amber',
			glow: 'pixels-amber-glow',
		},
	].map(({name, pixels, background, glow}) => ({
		output: join(RETRO_SET, `${name}.png`),
		layers: [`${background}.png`, `${glow}.png`, `${pixels}.svg`, 'wave.png'].map((layer) =>
			join(assets, layer),
		),
	}))
}

/**
 * Stack an image's layers over the document's fill. icon.json scales its
 * raster layers up from a quarter of the canvas, so each is brought to full
 * size. The layers hold Display P3 numbers, which the profile then names, and
 * the result becomes sRGB, 8-bit and opaque: actool keeps a second, 16-bit copy
 * of any Display P3 image, and the app icon sets want no alpha.
 *
 * @param {{output: string, layers: string[]}} image
 */
function stackRetroImage({output, layers}) {
	let size = `${APP_ICON_SIZE}x${APP_ICON_SIZE}`
	execFileSync('magick', [
		'-size',
		size,
		`xc:${RETRO_FILL}`,
		...layers.flatMap((layer) => [
			'(',
			...(layer.endsWith('.svg')
				? ['-background', 'none', layer]
				: ['-quiet', layer, '+profile', '*']),
			'-filter',
			'Lanczos',
			'-resize',
			size,
			')',
			'-composite',
		]),
		'-alpha',
		'off',
		'-profile',
		P3_PROFILE,
		'-profile',
		SRGB_PROFILE,
		'-depth',
		'8',
		output,
	])
}

/**
 * An HTML gallery of every logo in the plan, one row per icon and one column
 * per rendition, linking to files beside it in images/icons/. HTML rather than
 * Markdown because Quick Look renders its images.
 *
 * @param {Export[]} plan
 * @returns {string}
 */
export function logoGallery(plan) {
	let logos = plan
	let renditions = [...new Set(logos.map((p) => p.rendition))]
	let icons = [...new Set(logos.map((p) => basename(p.input, '.icon')))]

	let rows = icons.map((icon) => {
		let cells = renditions.map((rendition) => {
			let logo = logos.find((p) => basename(p.input, '.icon') === icon && p.rendition === rendition)
			return logo ? `<td><img src="${basename(logo.output)}" width="150"></td>` : '<td></td>'
		})
		return `<tr><th>${icon}</th>${cells.join('')}</tr>`
	})

	return [
		'<!doctype html>',
		'<meta charset="utf-8">',
		'<title>App icon logos</title>',
		'<style>body { background: white; font: 14px -apple-system, sans-serif; } th { text-align: left; }</style>',
		'<table>',
		`<tr><th>Icon</th>${renditions.map((r) => `<th>${r}</th>`).join('')}</tr>`,
		...rows,
		'</table>',
		'',
	].join('\n')
}

/** The app icon set's manifest: a light image and a dark one, no tinted. */
const RETRO_CONTENTS = {
	images: [
		{filename: 'light.png', idiom: 'universal', platform: 'ios', size: '1024x1024'},
		{
			appearances: [{appearance: 'luminosity', value: 'dark'}],
			filename: 'dark.png',
			idiom: 'universal',
			platform: 'ios',
			size: '1024x1024',
		},
	],
	info: {author: 'xcode', version: 1},
}

function main() {
	let plan = [
		...exportPlan(readdirSync(SOURCE_DIR), {all: process.argv.includes('--all')}),
		...retroPreviews(),
	]

	mkdirSync(RETRO_SET, {recursive: true})
	writeFileSync(
		join(SOURCE_DIR, 'old-main-retro.xcassets', 'Contents.json'),
		JSON.stringify({info: RETRO_CONTENTS.info}, null, 2) + '\n',
	)
	writeFileSync(join(RETRO_SET, 'Contents.json'), JSON.stringify(RETRO_CONTENTS, null, 2) + '\n')

	for (let {input, output, points, rendition} of plan) {
		console.log(`make-icons: ${input} -> ${output}`)
		execFileSync(ICTOOL, [
			input,
			'--export-image',
			'--output-file',
			output,
			'--platform',
			'iOS',
			'--rendition',
			rendition,
			'--width',
			String(points),
			'--height',
			String(points),
			'--scale',
			String(SCALE),
		])
	}

	let artwork = artworkPreviews()
	for (let preview of artwork) {
		console.log(`make-icons: ${preview.input} -> ${preview.output}`)
		scaleArtwork(preview)
	}

	let setImages = retroSetImages()
	for (let image of setImages) {
		console.log(`make-icons: ${RETRO_DOCUMENT} -> ${image.output}`)
		stackRetroImage(image)
	}

	execFileSync(
		'oxipng',
		[
			'-o',
			'max',
			'--strip',
			'safe',
			'--zopfli',
			...plan.map((p) => p.output),
			...artwork.flatMap((p) => [p.input, p.output]),
			...setImages.map((i) => i.output),
		],
		{
			stdio: 'inherit',
		},
	)

	if (process.argv.includes('--table')) {
		let gallery = join(OUTPUT_DIR, 'logos.html')
		writeFileSync(gallery, logoGallery(plan))
		console.log(`make-icons: ${gallery}`)
	}
}

if (import.meta.main) {
	main()
}
