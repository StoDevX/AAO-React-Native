/**
 * Render the in-app previews of each Icon Composer document in assets/: the
 * Settings picker's tile and the Credits screen's logo. Run after editing an
 * `.icon`; the PNGs are committed, since the renderer only ships with Xcode.
 *
 * `--all` adds the tinted renditions; `--table` writes a gallery of every logo
 * to images/icons/logos.html. Both outputs are gitignored.
 */
import {execFileSync} from 'node:child_process'
import {readdirSync, writeFileSync} from 'node:fs'
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
const PREVIEWS = [{suffix: 'logo', points: 100}]

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
 * @property {string} preview which preview this is, `logo`
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
			PREVIEWS.flatMap(({suffix, points}) =>
				appearances.map((appearance) => ({
					input: join(SOURCE_DIR, entry),
					preview: suffix,
					output: join(OUTPUT_DIR, `${basename(entry, '.icon')}-${suffix}${appearance.suffix}.png`),
					points,
					rendition: appearance.rendition,
				})),
			),
		)
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
	let logos = plan.filter((p) => p.preview === 'logo')
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

function main() {
	let plan = exportPlan(readdirSync(SOURCE_DIR), {all: process.argv.includes('--all')})

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

	execFileSync(
		'oxipng',
		['-o', 'max', '--strip', 'safe', '--zopfli', ...plan.map((p) => p.output)],
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
